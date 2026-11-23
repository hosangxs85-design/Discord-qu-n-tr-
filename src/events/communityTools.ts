import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, Events,
  PermissionFlagsBits, type ButtonInteraction, type ChatInputCommandInteraction, type Client, type Interaction, type TextChannel
} from 'discord.js';
import { audit, db } from '../db/database.js';
import { canConfigure } from '../permissions.js';
import { log } from '../logger.js';

const faqKeyPattern = /^[a-z0-9][a-z0-9-]{1,31}$/;

type PollRow = {
  id: number; guild_id: string; creator_id: string; title: string;
  channel_id: string | null; message_id: string | null; closed: number;
};
type PollOptionRow = { id: number; label: string; position: number; votes: number };
type TicketRow = {
  id: number; guild_id: string; owner_id: string; channel_id: string;
  subject: string; status: 'open' | 'closed';
};
type BirthdayRow = { user_id: string; month: number; day: number };

function getPoll(id: number) {
  return db.prepare('SELECT * FROM community_poll WHERE id = ?').get(id) as PollRow | undefined;
}

function getPollOptions(id: number) {
  return db.prepare(`SELECT o.id,o.label,o.position,COUNT(v.user_id) AS votes
    FROM poll_option o LEFT JOIN poll_vote v ON v.option_id = o.id
    WHERE o.poll_id = ? GROUP BY o.id ORDER BY o.position`).all(id) as PollOptionRow[];
}

function pollComponents(poll: PollRow, options: PollOptionRow[]) {
  if (poll.closed) return [];
  const votes = new ActionRowBuilder<ButtonBuilder>().addComponents(options.map(option =>
    new ButtonBuilder().setCustomId(`poll:${poll.id}:${option.id}`).setLabel(option.label).setStyle(ButtonStyle.Primary)
  ));
  const close = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`poll-close:${poll.id}`).setLabel('Đóng bình chọn').setStyle(ButtonStyle.Secondary)
  );
  return [votes, close];
}

function pollEmbed(poll: PollRow, options: PollOptionRow[]) {
  const total = options.reduce((sum, option) => sum + option.votes, 0);
  const lines = options.map(option => `**${option.position + 1}. ${option.label}** — ${option.votes} phiếu`).join('\n');
  return new EmbedBuilder().setColor(poll.closed ? 0x64748b : 0x5865f2)
    .setTitle(poll.title.slice(0, 256))
    .setDescription(`${lines}\n\n**Tổng lượt chọn:** ${total}`)
    .setFooter({ text: `Bình chọn #${poll.id} · ${poll.closed ? 'Đã đóng' : 'Đang mở'} · mỗi người có một phiếu, có thể đổi lựa chọn` });
}

async function refreshPollMessage(interaction: ButtonInteraction, poll: PollRow) {
  const options = getPollOptions(poll.id);
  await interaction.update({ embeds: [pollEmbed(poll, options)], components: pollComponents(poll, options) });
}

function validCalendarDate(month: number, day: number) {
  const maxDay = new Date(Date.UTC(2000, month, 0)).getUTCDate();
  return day >= 1 && day <= maxDay;
}

function localParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? '0';
  return { year: Number(value('year')), month: Number(value('month')), day: Number(value('day')), hour: Number(value('hour')) };
}

async function handleBirthdayCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return void await interaction.reply({ content: 'Lệnh sinh nhật chỉ dùng trong server.', ephemeral: true });
  const sub = interaction.options.getSubcommand();
  if (sub === 'set') {
    const month = interaction.options.getInteger('month', true);
    const day = interaction.options.getInteger('day', true);
    if (!validCalendarDate(month, day)) return void await interaction.reply({ content: 'Ngày/tháng không hợp lệ.', ephemeral: true });
    db.prepare(`INSERT INTO birthday_registration (guild_id,user_id,month,day) VALUES (?,?,?,?)
      ON CONFLICT(guild_id,user_id) DO UPDATE SET month=excluded.month,day=excluded.day,registered_at=CURRENT_TIMESTAMP`)
      .run(interaction.guild.id, interaction.user.id, month, day);
    audit(interaction.guild.id, 'birthday_opt_in', interaction.user.id, interaction.user.id);
    return void await interaction.reply({ content: `Đã đăng ký sinh nhật ngày ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}. Chỉ lưu ngày/tháng, không lưu năm sinh; đăng ký đồng nghĩa bạn đồng ý được chúc mừng tại kênh sinh nhật đã cấu hình.`, ephemeral: true });
  }
  if (sub === 'remove') {
    db.prepare('DELETE FROM birthday_registration WHERE guild_id = ? AND user_id = ?').run(interaction.guild.id, interaction.user.id);
    audit(interaction.guild.id, 'birthday_opt_out', interaction.user.id, interaction.user.id);
    return void await interaction.reply({ content: 'Đã xóa đăng ký sinh nhật của bạn.', ephemeral: true });
  }
  const total = (db.prepare('SELECT COUNT(*) AS count FROM birthday_registration WHERE guild_id = ?').get(interaction.guild.id) as {count:number}).count;
  const rows = db.prepare('SELECT user_id,month,day FROM birthday_registration WHERE guild_id = ? ORDER BY month,day LIMIT 35')
    .all(interaction.guild.id) as BirthdayRow[];
  const text = rows.length
    ? rows.map(row => `• ${String(row.day).padStart(2, '0')}/${String(row.month).padStart(2, '0')} · <@${row.user_id}>`).join('\n')
    : 'Chưa có thành viên nào đăng ký sinh nhật.';
  const suffix = total > rows.length ? `\n(Hiển thị ${rows.length}/${total} mục đầu tiên.)` : '';
  await interaction.reply({ content: `**Sinh nhật đã đăng ký**\n${text}${suffix}`, ephemeral: true, allowedMentions: { parse: [] } });
}

async function handlePollCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return void await interaction.reply({ content: 'Bình chọn chỉ dùng trong server.', ephemeral: true });
  const sub = interaction.options.getSubcommand();
  if (sub === 'create') {
    const title = interaction.options.getString('question', true).trim();
    const labels = ['option1', 'option2', 'option3', 'option4']
      .map(name => interaction.options.getString(name)?.trim())
      .filter((label): label is string => Boolean(label));
    if (!title || labels.length < 2) return void await interaction.reply({ content: 'Câu hỏi và ít nhất hai lựa chọn không được để trống.', ephemeral: true });
    const normalized = labels.map(label => label.toLocaleLowerCase('vi'));
    if (new Set(normalized).size !== labels.length) return void await interaction.reply({ content: 'Các lựa chọn phải khác nhau.', ephemeral: true });
    if (!interaction.channel?.isTextBased() || !('send' in interaction.channel)) return void await interaction.reply({ content: 'Không thể đăng bình chọn tại kênh này.', ephemeral: true });

    await interaction.deferReply({ ephemeral: true });
    const result = db.prepare('INSERT INTO community_poll (guild_id,creator_id,title,channel_id) VALUES (?,?,?,?)')
      .run(interaction.guild.id, interaction.user.id, title, interaction.channelId);
    const pollId = Number(result.lastInsertRowid);
    const addOption = db.prepare('INSERT INTO poll_option (poll_id,position,label) VALUES (?,?,?)');
    labels.forEach((label, position) => addOption.run(pollId, position, label));
    const poll = getPoll(pollId)!;
    const options = getPollOptions(pollId);
    try {
      const message = await (interaction.channel as { send: (payload: unknown) => Promise<{ id: string }> }).send({
        embeds: [pollEmbed(poll, options)], components: pollComponents(poll, options), allowedMentions: { parse: [] }
      });
      db.prepare('UPDATE community_poll SET message_id = ? WHERE id = ?').run(message.id, pollId);
    } catch (error) {
      db.prepare('DELETE FROM community_poll WHERE id = ?').run(pollId);
      log('warn', 'Could not publish poll', { pollId, error: error instanceof Error ? error.message : String(error) });
      return void await interaction.editReply('Không đăng được bình chọn. Hãy kiểm tra quyền gửi tin nhắn và embed của bot.');
    }
    audit(interaction.guild.id, 'poll_created', interaction.user.id, undefined, interaction.channelId, { pollId, optionCount: labels.length });
    return void await interaction.editReply(`Đã đăng bình chọn **${title}** với mã #${pollId}.`);
  }

  const pollId = interaction.options.getInteger('id', true);
  const poll = db.prepare('SELECT * FROM community_poll WHERE guild_id = ? AND id = ?').get(interaction.guild.id, pollId) as PollRow | undefined;
  if (!poll || poll.closed) return void await interaction.reply({ content: 'Không tìm thấy bình chọn đang mở với mã này.', ephemeral: true });
  await interaction.deferReply({ ephemeral: true });
  const member = await interaction.guild.members.fetch(interaction.user.id);
  if (poll.creator_id !== member.id && !canConfigure(member)) return void await interaction.editReply('Chỉ người tạo hoặc Admin/Quản trị được cấp quyền mới có thể đóng bình chọn.');
  db.prepare('UPDATE community_poll SET closed = 1 WHERE id = ?').run(poll.id);
  const closedPoll = getPoll(poll.id)!;
  const channel = await interaction.guild.channels.fetch(poll.channel_id ?? '').catch(() => null);
  if (channel?.isTextBased() && 'messages' in channel && poll.message_id) {
    const message = await channel.messages.fetch(poll.message_id).catch(() => null);
    if (message) await message.edit({ embeds: [pollEmbed(closedPoll, getPollOptions(poll.id))], components: [], allowedMentions: { parse: [] } }).catch(() => undefined);
  }
  audit(interaction.guild.id, 'poll_closed', interaction.user.id, undefined, poll.channel_id ?? undefined, { pollId });
  await interaction.editReply(`Đã đóng bình chọn #${pollId}.`);
}

async function handleTicketCommand(interaction: ChatInputCommandInteraction, client: Client) {
  if (!interaction.guild) return void await interaction.reply({ content: 'Ticket chỉ dùng trong server.', ephemeral: true });
  const sub = interaction.options.getSubcommand();
  if (sub === 'configure') {
    await interaction.deferReply({ ephemeral: true });
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!canConfigure(member)) return void await interaction.editReply('Chỉ Admin/Quản trị được cấp quyền mới cấu hình ticket.');
    const role = interaction.options.getRole('support_role', true);
    const category = interaction.options.getChannel('category');
    if (role.id === interaction.guild.id) return void await interaction.editReply('Không thể dùng @everyone làm role hỗ trợ.');
    db.prepare(`INSERT INTO ticket_config (guild_id,support_role_id,category_id) VALUES (?,?,?)
      ON CONFLICT(guild_id) DO UPDATE SET support_role_id=excluded.support_role_id,category_id=COALESCE(excluded.category_id,ticket_config.category_id),updated_at=CURRENT_TIMESTAMP`)
      .run(interaction.guild.id, role.id, category?.id ?? null);
    audit(interaction.guild.id, 'ticket_configuration_updated', member.id, undefined, category?.id, { supportRoleId: role.id });
    return void await interaction.editReply({ content: `Đã cấu hình role hỗ trợ ${role} và ${category ? `danh mục ${category}` : 'giữ nguyên danh mục hiện tại nếu đã có'}.`, allowedMentions: { parse: [] } });
  }

  if (sub === 'open') {
    const settings = db.prepare('SELECT support_role_id,category_id FROM ticket_config WHERE guild_id = ?')
      .get(interaction.guild.id) as { support_role_id: string; category_id: string | null } | undefined;
    if (!settings) return void await interaction.reply({ content: 'Server chưa cấu hình ticket. Admin/Quản trị hãy dùng `/hỗ-trợ cấu-hình` trước.', ephemeral: true });
    await interaction.deferReply({ ephemeral: true });
    const existing = db.prepare("SELECT id,channel_id FROM support_ticket WHERE guild_id = ? AND owner_id = ? AND status = 'open'")
      .get(interaction.guild.id, interaction.user.id) as { id: number; channel_id: string } | undefined;
    if (existing) {
      const existingChannel = await interaction.guild.channels.fetch(existing.channel_id).catch(() => null);
      if (existingChannel) return void await interaction.editReply(`Bạn đã có ticket đang mở: <#${existing.channel_id}>.`);
      db.prepare("UPDATE support_ticket SET status='closed',closed_at=CURRENT_TIMESTAMP WHERE id=?").run(existing.id);
    }
    const subject = interaction.options.getString('subject', true).trim();
    if (!subject) return void await interaction.reply({ content: 'Chủ đề ticket không được để trống.', ephemeral: true });
    const supportRole = await interaction.guild.roles.fetch(settings.support_role_id).catch(() => null);
    if (!supportRole) return void await interaction.editReply('Role hỗ trợ đã bị xóa. Admin cần cấu hình lại ticket.');
    const category = settings.category_id ? await interaction.guild.channels.fetch(settings.category_id).catch(() => null) : null;
    if (settings.category_id && category?.type !== ChannelType.GuildCategory) {
      return void await interaction.editReply('Danh mục ticket không còn hợp lệ. Admin cần cấu hình lại.');
    }
    const slug = interaction.user.username.normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase().replace(/^-|-$/g, '').slice(0, 24) || 'thanh-vien';
    const botId = client.user?.id;
    if (!botId) return void await interaction.editReply('Bot chưa sẵn sàng. Hãy thử lại sau ít phút.');
    const viewPermissions = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks];
    let channel: TextChannel | undefined;
    let ticketId: number | undefined;
    try {
      channel = await interaction.guild.channels.create({
        name: `ho-tro-${slug}`.slice(0, 90), type: ChannelType.GuildText,
        ...(category ? { parent: category.id } : {}),
        topic: `Ticket người yêu cầu ${interaction.user.id} · ${subject.slice(0, 100)}`,
        reason: `Tạo ticket hỗ trợ cho ${interaction.user.tag}`,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: viewPermissions },
          { id: supportRole.id, allow: viewPermissions },
          { id: botId, allow: [...viewPermissions, PermissionFlagsBits.ManageChannels] }
        ]
      });
      const insert = db.prepare('INSERT INTO support_ticket (guild_id,owner_id,channel_id,subject) VALUES (?,?,?,?)')
        .run(interaction.guild.id, interaction.user.id, channel.id, subject);
      ticketId = Number(insert.lastInsertRowid);
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(`ticket-close:${ticketId}`).setLabel('Đóng ticket').setStyle(ButtonStyle.Danger)
      );
      await channel.send({
        content: `${interaction.user} · ${supportRole}`,
        embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle(`Ticket #${ticketId} · ${subject}`).setDescription('Mô tả vấn đề của bạn. Không gửi mật khẩu, token hoặc thông tin thanh toán. Nhấn “Đóng ticket” khi đã được hỗ trợ.')],
        components: [row], allowedMentions: { users: [interaction.user.id], roles: [supportRole.id] }
      });
    } catch (error) {
      if (ticketId) db.prepare('DELETE FROM support_ticket WHERE id = ?').run(ticketId);
      if (channel) await channel.delete('Dọn kênh ticket mới tạo nhưng không khởi tạo được hồ sơ').catch(() => undefined);
      const message = error instanceof Error ? error.message : String(error);
      log('warn', 'Could not create support ticket', { guildId: interaction.guild.id, userId: interaction.user.id, error: message });
      return void await interaction.editReply('Không thể tạo ticket. Hãy kiểm tra quyền Manage Channels, View Channel và Send Messages của bot.');
    }
    audit(interaction.guild.id, 'ticket_opened', interaction.user.id, interaction.user.id, channel.id, { ticketId });
    return void await interaction.editReply({ content: `Đã tạo ticket #${ticketId}: ${channel}.`, allowedMentions: { parse: [] } });
  }

  if (sub === 'close') {
    const ticket = db.prepare("SELECT * FROM support_ticket WHERE guild_id = ? AND channel_id = ? AND status = 'open'")
      .get(interaction.guild.id, interaction.channelId) as TicketRow | undefined;
    if (!ticket) return void await interaction.reply({ content: 'Kênh hiện tại không phải ticket đang mở.', ephemeral: true });
    await interaction.deferReply({ ephemeral: true });
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const settings = db.prepare('SELECT support_role_id FROM ticket_config WHERE guild_id = ?').get(interaction.guild.id) as {support_role_id:string}|undefined;
    if (ticket.owner_id !== member.id && !canConfigure(member) && !(settings && member.roles.cache.has(settings.support_role_id))) {
      return void await interaction.editReply('Chỉ người tạo ticket, role hỗ trợ hoặc Admin/Quản trị mới được đóng ticket.');
    }
    await closeTicket(ticket, interaction.guild, interaction.user.id);
    return void await interaction.editReply(`Đã đóng ticket #${ticket.id}. Kênh và lịch sử vẫn được giữ lại.`);
  }
}

async function closeTicket(ticket: TicketRow, guild: NonNullable<Interaction['guild']>, actorId: string) {
  db.prepare("UPDATE support_ticket SET status='closed',closed_at=CURRENT_TIMESTAMP WHERE id=? AND status='open'").run(ticket.id);
  const channel = await guild.channels.fetch(ticket.channel_id).catch(() => null);
  if (channel && 'permissionOverwrites' in channel) {
    await channel.permissionOverwrites.edit(ticket.owner_id, { SendMessages: false }).catch(() => undefined);
    if ('setName' in channel && 'name' in channel) await channel.setName(`da-dong-${channel.name}`.slice(0, 95), 'Ticket được đóng').catch(() => undefined);
  }
  audit(guild.id, 'ticket_closed', actorId, ticket.owner_id, ticket.channel_id, { ticketId: ticket.id });
}

async function handleFaqCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return void await interaction.reply({ content: 'FAQ chỉ dùng trong server.', ephemeral: true });
  const sub = interaction.options.getSubcommand();
  if (sub === 'add' || sub === 'remove') {
    await interaction.deferReply({ ephemeral: true });
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!canConfigure(member)) return void await interaction.editReply('Chỉ Admin/Quản trị được cấp quyền mới sửa FAQ.');
    const key = interaction.options.getString('key', true).trim().toLowerCase();
    if (!faqKeyPattern.test(key)) return void await interaction.editReply('Mã FAQ chỉ gồm chữ thường không dấu, số và dấu gạch ngang; dài 2–32 ký tự.');
    if (sub === 'remove') {
      const result = db.prepare('DELETE FROM faq_entry WHERE guild_id = ? AND faq_key = ?').run(interaction.guild.id, key);
      if (!result.changes) return void await interaction.editReply('Không tìm thấy mã FAQ này.');
      audit(interaction.guild.id, 'faq_entry_removed', member.id, undefined, interaction.channelId, { key });
      return void await interaction.editReply(`Đã gỡ mục FAQ **${key}**.`);
    }
    const question = interaction.options.getString('question', true).trim();
    const answer = interaction.options.getString('answer', true).trim();
    if (!question || !answer) return void await interaction.editReply('Câu hỏi và câu trả lời FAQ không được để trống.');
    db.prepare(`INSERT INTO faq_entry (guild_id,faq_key,question,answer,created_by) VALUES (?,?,?,?,?)
      ON CONFLICT(guild_id,faq_key) DO UPDATE SET question=excluded.question,answer=excluded.answer,created_by=excluded.created_by,created_at=CURRENT_TIMESTAMP`)
      .run(interaction.guild.id, key, question, answer, member.id);
    audit(interaction.guild.id, 'faq_entry_updated', member.id, undefined, interaction.channelId, { key });
    return void await interaction.editReply(`Đã lưu mục FAQ **${key}**.`);
  }
  if (sub === 'list') {
    const rows = db.prepare('SELECT faq_key AS key,question FROM faq_entry WHERE guild_id = ? ORDER BY faq_key LIMIT 20')
      .all(interaction.guild.id) as Array<{key:string;question:string}>;
    const description = rows.length ? rows.map(row => `**${row.key}** · ${row.question.slice(0, 120)}`).join('\n') : 'Server chưa có mục FAQ.';
    return void await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x38a169).setTitle('Câu hỏi thường gặp').setDescription(description)], ephemeral: true });
  }
  const key = interaction.options.getString('key', true).trim().toLowerCase();
  const row = db.prepare('SELECT question,answer FROM faq_entry WHERE guild_id = ? AND faq_key = ?')
    .get(interaction.guild.id, key) as {question:string;answer:string}|undefined;
  if (!row) return void await interaction.reply({ content: 'Không tìm thấy mục FAQ. Dùng `/câu-hỏi danh-sách` để xem các mã hiện có.', ephemeral: true });
  await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x38a169).setTitle(row.question).setDescription(row.answer)], ephemeral: true, allowedMentions: { parse: [] } });
}

async function sendBirthdayAnnouncements(client: Client) {
  const configs = db.prepare('SELECT guild_id,birthday_channel_id,timezone FROM guild_config WHERE birthday_channel_id IS NOT NULL')
    .all() as Array<{guild_id:string;birthday_channel_id:string;timezone:string}>;
  const now = new Date();
  for (const config of configs) {
    let local: ReturnType<typeof localParts>;
    try { local = localParts(now, config.timezone); }
    catch { log('warn', 'Invalid timezone for birthday announcement', { guildId: config.guild_id, timezone: config.timezone }); continue; }
    if (local.hour !== 9) continue;
    const rows = db.prepare(`SELECT b.user_id,b.month,b.day FROM birthday_registration b
      WHERE b.guild_id = ? AND b.month = ? AND b.day = ?
      AND NOT EXISTS (SELECT 1 FROM birthday_delivery d WHERE d.guild_id=b.guild_id AND d.user_id=b.user_id AND d.year=?)`)
      .all(config.guild_id, local.month, local.day, local.year) as BirthdayRow[];
    if (!rows.length) continue;
    const guild = client.guilds.cache.get(config.guild_id);
    const channel = guild ? await guild.channels.fetch(config.birthday_channel_id).catch(() => null) : null;
    if (!channel?.isTextBased() || !('send' in channel)) continue;
    for (let start = 0; start < rows.length; start += 20) {
      const batch = rows.slice(start, start + 20);
      const mentions = batch.map(row => `<@${row.user_id}>`);
      try {
        await (channel as {send:(payload:unknown)=>Promise<unknown>}).send({
          content: `Hôm nay server có sinh nhật của ${mentions.join(', ')}. Chúc mừng sinh nhật!`,
          allowedMentions: { users: batch.map(row => row.user_id) }
        });
        const markSent = db.prepare('INSERT OR IGNORE INTO birthday_delivery (guild_id,user_id,year) VALUES (?,?,?)');
        const saveBatch = db.transaction((people: BirthdayRow[]) => people.forEach(person => markSent.run(config.guild_id, person.user_id, local.year)));
        saveBatch(batch);
      } catch (error) {
        log('warn', 'Birthday announcement failed', { guildId: config.guild_id, error: error instanceof Error ? error.message : String(error) });
      }
    }
    audit(config.guild_id, 'birthday_announcements_sent', undefined, undefined, config.birthday_channel_id, { count: rows.length, year: local.year });
  }
}

export function registerCommunityTools(client: Client) {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'birthday') return await handleBirthdayCommand(interaction);
        if (interaction.commandName === 'poll') return await handlePollCommand(interaction);
        if (interaction.commandName === 'ticket') return await handleTicketCommand(interaction, client);
        if (interaction.commandName === 'faq') return await handleFaqCommand(interaction);
      }

      if (interaction.isButton() && interaction.customId.startsWith('poll:')) {
        if (!interaction.guild) return void await interaction.reply({ content: 'Bình chọn chỉ dùng trong server.', ephemeral: true });
        const [, pollText, optionText] = interaction.customId.split(':');
        const pollId = Number(pollText);
        const optionId = Number(optionText);
        const poll = getPoll(pollId);
        const option = db.prepare('SELECT id FROM poll_option WHERE id = ? AND poll_id = ?').get(optionId, pollId);
        if (!poll || poll.guild_id !== interaction.guild.id || poll.closed || !option) {
          return void await interaction.reply({ content: 'Bình chọn đã đóng hoặc lựa chọn không hợp lệ.', ephemeral: true });
        }
        db.prepare(`INSERT INTO poll_vote (poll_id,user_id,option_id) VALUES (?,?,?)
          ON CONFLICT(poll_id,user_id) DO UPDATE SET option_id=excluded.option_id,created_at=CURRENT_TIMESTAMP`)
          .run(pollId, interaction.user.id, optionId);
        return await refreshPollMessage(interaction, poll);
      }

      if (interaction.isButton() && interaction.customId.startsWith('poll-close:')) {
        if (!interaction.guild) return void await interaction.reply({ content: 'Bình chọn chỉ dùng trong server.', ephemeral: true });
        const pollId = Number(interaction.customId.split(':')[1]);
        const poll = getPoll(pollId);
        if (!poll || poll.guild_id !== interaction.guild.id || poll.closed) return void await interaction.reply({ content: 'Bình chọn không còn mở.', ephemeral: true });
        await interaction.deferReply({ ephemeral: true });
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (poll.creator_id !== member.id && !canConfigure(member)) return void await interaction.editReply('Chỉ người tạo hoặc Admin/Quản trị được cấp quyền mới đóng được bình chọn.');
        db.prepare('UPDATE community_poll SET closed = 1 WHERE id = ?').run(pollId);
        audit(interaction.guild.id, 'poll_closed', member.id, undefined, poll.channel_id ?? undefined, { pollId });
        const closed = getPoll(pollId)!;
        await interaction.message.edit({ embeds: [pollEmbed(closed, getPollOptions(pollId))], components: [], allowedMentions: { parse: [] } });
        return void await interaction.editReply(`Đã đóng bình chọn #${pollId}.`);
      }

      if (interaction.isButton() && interaction.customId.startsWith('ticket-close:')) {
        if (!interaction.guild) return void await interaction.reply({ content: 'Ticket chỉ dùng trong server.', ephemeral: true });
        const ticketId = Number(interaction.customId.split(':')[1]);
        const ticket = db.prepare("SELECT * FROM support_ticket WHERE guild_id = ? AND id = ? AND status = 'open'")
          .get(interaction.guild.id, ticketId) as TicketRow | undefined;
        if (!ticket) return void await interaction.reply({ content: 'Ticket đã được đóng hoặc không còn tồn tại.', ephemeral: true });
        await interaction.deferReply({ ephemeral: true });
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const settings = db.prepare('SELECT support_role_id FROM ticket_config WHERE guild_id = ?').get(interaction.guild.id) as {support_role_id:string}|undefined;
        if (ticket.owner_id !== member.id && !canConfigure(member) && !(settings && member.roles.cache.has(settings.support_role_id))) {
          return void await interaction.editReply('Chỉ người tạo ticket, role hỗ trợ hoặc Admin/Quản trị mới được đóng ticket.');
        }
        await closeTicket(ticket, interaction.guild, member.id);
        await interaction.message.edit({ content: `Ticket #${ticket.id} đã đóng bởi <@${member.id}>. Lịch sử kênh được giữ lại.`, embeds: interaction.message.embeds, components: [], allowedMentions: { parse: [] } });
        return void await interaction.editReply(`Đã đóng ticket #${ticket.id}. Lịch sử kênh được giữ lại.`);
      }
    } catch (error) {
      log('error', 'Community tools interaction failed', { error: error instanceof Error ? error.message : String(error) });
      if (interaction.isRepliable() && interaction.deferred) {
        await interaction.editReply('Có lỗi khi xử lý. Hãy thử lại hoặc báo quản trị viên.').catch(() => undefined);
      } else if (interaction.isRepliable() && !interaction.replied) {
        await interaction.reply({ content: 'Có lỗi khi xử lý. Hãy thử lại hoặc báo quản trị viên.', ephemeral: true }).catch(() => undefined);
      }
    }
  });

  client.once(Events.ClientReady, ready => {
    const timer = setInterval(() => void sendBirthdayAnnouncements(ready).catch(error => log('error', 'Birthday scheduler failed', { error: String(error) })), 60_000);
    timer.unref();
    void sendBirthdayAnnouncements(ready).catch(error => log('error', 'Initial birthday pass failed', { error: String(error) }));
  });
}
