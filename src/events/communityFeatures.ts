import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events,
  type ChatInputCommandInteraction, type Client, type Interaction
} from 'discord.js';
import { db, audit, getGuildConfig } from '../db/database.js';
import { canConfigure } from '../permissions.js';
import { applyRoomSetting, getManagedRoom, grantRoomAccess } from './voiceRooms.js';
import { log } from '../logger.js';

const DAY = 24 * 60 * 60 * 1000;
const REMINDER_OFFSETS = [86400, 3600, 600];

type EventRow = {
  id: number; guild_id: string; creator_id: string; title: string; description: string;
  starts_at_ms: number; timezone: string; status: string; channel_id: string | null; message_id: string | null;
};
type RoomRow = {
  id: number; guild_id: string; voice_channel_id: string; room_code: string;
  owner_id: string; hidden: number; locked: number; delete_after_seconds: number;
};

function getSubcommand(interaction: ChatInputCommandInteraction) {
  return interaction.options.getSubcommand(false);
}

function fmtDate(timestamp: number, timezone: string) {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: timezone, dateStyle: 'full', timeStyle: 'medium'
    }).format(new Date(timestamp));
  } catch {
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'full', timeStyle: 'medium'
    }).format(new Date(timestamp));
  }
}

function eventButtons(eventId: number) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`event:${eventId}:going`).setLabel('Tham gia').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`event:${eventId}:interested`).setLabel('Quan tâm').setStyle(ButtonStyle.Primary)
  );
}

async function handleEventCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({ content: 'Lệnh sự kiện chỉ dùng trong server.', ephemeral: true });
    return;
  }
  const subcommand = getSubcommand(interaction);
  if (subcommand === 'create') {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!canConfigure(member)) {
      await interaction.reply({ content: 'Bạn chưa được cấp quyền tạo sự kiện.', ephemeral: true });
      return;
    }
    const title = interaction.options.getString('tieu_de', true).trim();
    const startsAtText = interaction.options.getString('bat_dau', true).trim();
    const description = interaction.options.getString('mo_ta')?.trim() ?? '';
    const hasOffset = /(?:Z|[+-]\d{2}:\d{2})$/i.test(startsAtText);
    const startsAt = Date.parse(startsAtText);
    if (!hasOffset || !Number.isFinite(startsAt) || startsAt <= Date.now()) {
      await interaction.reply({ content: 'Thời gian phải là ISO 8601 có múi giờ và nằm trong tương lai, ví dụ `2026-12-01T19:30:00+07:00`.', ephemeral: true });
      return;
    }
    const config = getGuildConfig(interaction.guild.id);
    const timezone = config?.timezone || 'Asia/Ho_Chi_Minh';
    try { new Intl.DateTimeFormat('vi-VN', { timeZone: timezone }); } catch {
      await interaction.reply({ content: `Múi giờ cấu hình ${timezone} không hợp lệ. Admin cần sửa bằng /thiết-lập.`, ephemeral: true });
      return;
    }
    const result = db.prepare('INSERT INTO community_event (guild_id,creator_id,title,description,starts_at_ms,timezone) VALUES (?,?,?,?,?,?)')
      .run(interaction.guild.id, interaction.user.id, title, description, startsAt, timezone);
    const eventId = Number(result.lastInsertRowid);
    for (const offset of REMINDER_OFFSETS) {
      const dueAt = startsAt - offset * 1000;
      if (dueAt > Date.now()) db.prepare('INSERT OR IGNORE INTO event_reminder (event_id,offset_seconds,due_at_ms) VALUES (?,?,?)').run(eventId, offset, dueAt);
    }
    const destinationId = config?.event_channel_id ?? interaction.channelId;
    if (!destinationId) {
      db.prepare("UPDATE community_event SET status = 'cancelled' WHERE id = ?").run(eventId);
      await interaction.reply({ content: 'Không xác định được kênh đăng sự kiện. Hãy cấu hình kênh sự kiện bằng /thiết-lập.', ephemeral: true });
      return;
    }
    const destination = await interaction.guild.channels.fetch(destinationId).catch(() => null);
    if (!destination?.isTextBased() || !('send' in destination)) {
      db.prepare('UPDATE community_event SET status = \'cancelled\' WHERE id = ?').run(eventId);
      await interaction.reply({ content: 'Không tìm thấy kênh đăng sự kiện. Hãy cấu hình kênh sự kiện bằng /thiết-lập.', ephemeral: true });
      return;
    }
    const embed = new EmbedBuilder().setColor(0x6d8df0).setTitle(title)
      .setDescription(description || 'Chưa có mô tả.')
      .addFields(
        { name: 'Thời gian', value: `${fmtDate(startsAt, timezone)} (${timezone})`, inline: false },
        { name: 'Mã sự kiện', value: `#${eventId}`, inline: true },
        { name: 'Người tổ chức', value: `<@${interaction.user.id}>`, inline: true }
      ).setFooter({ text: 'Chọn Tham gia hoặc Quan tâm để phản hồi.' }).setTimestamp();
    const message = await destination.send({ embeds: [embed], components: [eventButtons(eventId)], allowedMentions: { parse: [] } });
    db.prepare('UPDATE community_event SET channel_id = ?, message_id = ? WHERE id = ?').run(destination.id, message.id, eventId);
    audit(interaction.guild.id, 'community_event_created', interaction.user.id, undefined, destination.id, { eventId, startsAt });
    await interaction.reply({ content: `Đã tạo sự kiện **${title}** với mã #${eventId}. Thời gian hiển thị theo ${timezone}.`, ephemeral: true });
    return;
  }
  if (subcommand === 'list') {
    const config = getGuildConfig(interaction.guild.id);
    const timezone = config?.timezone || 'Asia/Ho_Chi_Minh';
    const now = Date.now();
    const events = db.prepare(`SELECT * FROM community_event WHERE guild_id = ? AND starts_at_ms BETWEEN ? AND ? ORDER BY starts_at_ms ASC LIMIT 25`)
      .all(interaction.guild.id, now - 30 * DAY, now + 30 * DAY) as EventRow[];
    if (!events.length) {
      await interaction.reply({ content: 'Chưa có sự kiện trong khoảng 30 ngày trước đến 30 ngày tới.', ephemeral: true });
      return;
    }
    const descriptions = events.map(event => {
      const status = event.status === 'cancelled' ? ' · **Đã hủy**' : event.starts_at_ms < now ? ' · Đã diễn ra' : '';
      const counts = db.prepare("SELECT response, COUNT(*) AS count FROM event_rsvp WHERE event_id = ? GROUP BY response").all(event.id) as Array<{response:string;count:number}>;
      const going = counts.find(row => row.response === 'going')?.count ?? 0;
      const interested = counts.find(row => row.response === 'interested')?.count ?? 0;
      return `**#${event.id} · ${event.title}**${status}\n${fmtDate(event.starts_at_ms, timezone)} (${timezone})\nTham gia: ${going} · Quan tâm: ${interested}`;
    });
    await interaction.reply({ embeds: [new EmbedBuilder().setTitle('Lịch sự kiện · 30 ngày trước và sau').setColor(0x6d8df0).setDescription(descriptions.join('\n\n')).setFooter({ text: `Múi giờ: ${timezone}` })], ephemeral: true });
    return;
  }
  if (subcommand === 'cancel') {
    const eventId = interaction.options.getInteger('ma', true);
    const event = db.prepare('SELECT * FROM community_event WHERE guild_id = ? AND id = ?').get(interaction.guild.id, eventId) as EventRow | undefined;
    if (!event || event.status !== 'scheduled') {
      await interaction.reply({ content: 'Không tìm thấy sự kiện đang hoạt động với mã này.', ephemeral: true });
      return;
    }
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (event.creator_id !== interaction.user.id && !canConfigure(member)) {
      await interaction.reply({ content: 'Chỉ người tạo sự kiện hoặc Admin/Quản trị được cấp quyền mới có thể hủy.', ephemeral: true });
      return;
    }
    db.prepare("UPDATE community_event SET status = 'cancelled' WHERE guild_id = ? AND id = ?").run(interaction.guild.id, eventId);
    db.prepare('DELETE FROM event_reminder WHERE event_id = ?').run(eventId);
    audit(interaction.guild.id, 'community_event_cancelled', interaction.user.id, undefined, event.channel_id ?? undefined, { eventId });
    if (event.channel_id && event.message_id) {
      const channel = await interaction.guild.channels.fetch(event.channel_id).catch(() => null);
      if (channel?.isTextBased() && 'messages' in channel) {
        const message = await channel.messages.fetch(event.message_id).catch(() => null);
        if (message) await message.edit({ content: 'Sự kiện này đã bị hủy.', components: [], allowedMentions: { parse: [] } }).catch(() => undefined);
      }
    }
    await interaction.reply({ content: `Đã hủy sự kiện #${eventId}.`, ephemeral: true });
  }
}

async function handleLobbyCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return void await interaction.reply({ content: 'Lệnh này chỉ dùng trong server.', ephemeral: true });
  const member = await interaction.guild.members.fetch(interaction.user.id);
  if (!canConfigure(member)) return void await interaction.reply({ content: 'Bạn không có quyền cấu hình lobby voice.', ephemeral: true });
  const sub = getSubcommand(interaction);
  if (sub === 'add') {
    const channel = interaction.options.getChannel('kenh', true);
    const seconds = interaction.options.getInteger('xoa_sau_giay') ?? 5;
    db.prepare('INSERT INTO voice_lobby (guild_id,source_channel_id,delete_after_seconds) VALUES (?,?,?) ON CONFLICT(guild_id,source_channel_id) DO UPDATE SET delete_after_seconds = excluded.delete_after_seconds')
      .run(interaction.guild.id, channel.id, seconds);
    audit(interaction.guild.id, 'voice_lobby_configured', interaction.user.id, undefined, channel.id, { deleteAfterSeconds: seconds });
    return void await interaction.reply({ content: `Đã cấu hình <#${channel.id}> làm lobby tạo phòng. Phòng trống sẽ tự xóa sau ${seconds} giây (bot phát nhạc không giữ phòng).`, ephemeral: true });
  }
  if (sub === 'remove') {
    const channel = interaction.options.getChannel('kenh', true);
    db.prepare('DELETE FROM voice_lobby WHERE guild_id = ? AND source_channel_id = ?').run(interaction.guild.id, channel.id);
    audit(interaction.guild.id, 'voice_lobby_removed', interaction.user.id, undefined, channel.id);
    return void await interaction.reply({ content: `Đã gỡ <#${channel.id}> khỏi danh sách lobby.`, ephemeral: true });
  }
  const lobbies = db.prepare('SELECT source_channel_id,delete_after_seconds FROM voice_lobby WHERE guild_id = ? ORDER BY created_at')
    .all(interaction.guild.id) as Array<{source_channel_id:string;delete_after_seconds:number}>;
  const text = lobbies.length ? lobbies.map((item, index) => `${index + 1}. <#${item.source_channel_id}> · xóa sau ${item.delete_after_seconds} giây`).join('\n') : 'Chưa cấu hình lobby nào.';
  return void await interaction.reply({ content: text, ephemeral: true });
}

async function handleRoomCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return void await interaction.reply({ content: 'Lệnh này chỉ dùng trong server.', ephemeral: true });
  const member = await interaction.guild.members.fetch(interaction.user.id);
  const sub = getSubcommand(interaction);
  if (sub === 'manage') {
    if (!canConfigure(member)) return void await interaction.reply({ content: 'Bạn không có quyền quản trị phòng tạm.', ephemeral: true });
    const target = interaction.options.getChannel('kenh', true);
    const room = db.prepare('SELECT * FROM temporary_voice_room WHERE guild_id = ? AND voice_channel_id = ?')
      .get(interaction.guild.id, target.id) as RoomRow | undefined;
    if (!room) return void await interaction.reply({ content: 'Kênh này không phải phòng tạm do bot quản lý.', ephemeral: true });
    const setting = interaction.options.getString('thao_tac', true) as 'lock' | 'open' | 'hide' | 'show';
    await applyRoomSetting(room, interaction.guild, setting);
    audit(interaction.guild.id, `temporary_voice_admin_${setting}`, interaction.user.id, room.owner_id, target.id);
    return void await interaction.reply({ content: `Đã áp dụng thao tác quản trị **${setting}** cho <#${target.id}>.`, ephemeral: true });
  }
  if (sub === 'enter') {
    const code = interaction.options.getString('ma', true).replace(/\s/g, '').toUpperCase();
    if (!/^[A-F0-9]{16}$/.test(code)) return void await interaction.reply({ content: 'Mã phòng không hợp lệ.', ephemeral: true });
    const now = Date.now();
    db.prepare('DELETE FROM voice_room_attempt WHERE attempted_at_ms < ?').run(now - 24 * 60 * 60 * 1000);
    const recentAttempts = db.prepare('SELECT COUNT(*) AS count FROM voice_room_attempt WHERE guild_id = ? AND user_id = ? AND attempted_at_ms > ?')
      .get(interaction.guild.id, member.id, now - 60_000) as { count: number };
    if (recentAttempts.count >= 5) return void await interaction.reply({ content: 'Bạn đã thử quá nhiều mã phòng. Hãy chờ một phút rồi thử lại.', ephemeral: true });
    db.prepare('INSERT INTO voice_room_attempt (guild_id,user_id,attempted_at_ms) VALUES (?,?,?)').run(interaction.guild.id, member.id, now);
    const channel = await grantRoomAccess(interaction.guild, code, member);
    if (!channel) return void await interaction.reply({ content: 'Không tìm thấy phòng đang hoạt động với mã này.', ephemeral: true });
    let moved = false;
    if (member.voice.channelId) {
      await member.voice.setChannel(channel, 'Thành viên chủ động nhập mã phòng riêng').then(() => { moved = true; }).catch(() => undefined);
    }
    const action = moved ? 'Đã chuyển bạn vào phòng.' : 'Phòng đã hiện trong danh sách của bạn; hãy tham gia bằng nút voice.';
    return void await interaction.reply({ content: `${action} Mã phòng là lời mời riêng; chỉ dùng với người bạn muốn cho vào.`, ephemeral: true });
  }
  const room = getManagedRoom(member);
  if (!room) return void await interaction.reply({ content: 'Bạn chưa ở trong phòng tạm và chưa có phòng nào do bạn sở hữu.', ephemeral: true });
  const isAdmin = canConfigure(member);
  if (room.owner_id !== member.id && !isAdmin) return void await interaction.reply({ content: 'Chỉ chủ phòng hoặc Admin/Quản trị viên được cấp quyền mới có thể chỉnh phòng này.', ephemeral: true });
  if (['lock', 'open', 'hide', 'show'].includes(sub ?? '')) {
    await applyRoomSetting(room, interaction.guild, sub as 'lock' | 'open' | 'hide' | 'show');
    const label: Record<string, string> = { lock: 'đã khóa; người có mã vẫn có thể xin quyền vào', open: 'đã mở', hide: 'đã ẩn; có thể vào bằng mã riêng', show: 'đã hiện' };
    audit(interaction.guild.id, `temporary_voice_${sub}`, interaction.user.id, room.owner_id, room.voice_channel_id);
    return void await interaction.reply({ content: `Phòng ${label[sub ?? '']}.`, ephemeral: true });
  }
  const channel = await interaction.guild.channels.fetch(room.voice_channel_id).catch(() => null);
  if (!channel?.isVoiceBased()) return void await interaction.reply({ content: 'Phòng không còn tồn tại.', ephemeral: true });
  if (sub === 'code') return void await interaction.reply({ content: `Mã riêng của phòng bạn: \`${room.room_code}\`. Chỉ chia sẻ với người bạn muốn mời.`, ephemeral: true });
  if (sub === 'rename') {
    const name = interaction.options.getString('ten', true).trim();
    await channel.setName(name.slice(0, 95), 'Chủ phòng đổi tên');
    return void await interaction.reply({ content: `Đã đổi tên phòng thành **${name.slice(0, 95)}**.`, ephemeral: true });
  }
  if (sub === 'limit') {
    const limit = interaction.options.getInteger('so_nguoi', true);
    await channel.setUserLimit(limit, 'Chủ phòng cập nhật giới hạn');
    return void await interaction.reply({ content: limit ? `Đã đặt giới hạn ${limit} người.` : 'Đã gỡ giới hạn số người.', ephemeral: true });
  }
}

const WEATHER_CODES: Record<number, string> = {
  0: 'Trời quang', 1: 'Ít mây', 2: 'Có mây rải rác', 3: 'Nhiều mây',
  45: 'Sương mù', 48: 'Sương mù đóng băng', 51: 'Mưa phùn nhẹ', 53: 'Mưa phùn vừa', 55: 'Mưa phùn dày',
  56: 'Mưa phùn lạnh nhẹ', 57: 'Mưa phùn lạnh dày', 61: 'Mưa nhẹ', 63: 'Mưa vừa', 65: 'Mưa to',
  66: 'Mưa lạnh nhẹ', 67: 'Mưa lạnh to', 71: 'Tuyết nhẹ', 73: 'Tuyết vừa', 75: 'Tuyết dày',
  77: 'Hạt tuyết', 80: 'Mưa rào nhẹ', 81: 'Mưa rào vừa', 82: 'Mưa rào to',
  85: 'Tuyết rào nhẹ', 86: 'Tuyết rào to', 95: 'Dông', 96: 'Dông kèm mưa đá nhẹ', 99: 'Dông kèm mưa đá to'
};

async function handleWeather(interaction: ChatInputCommandInteraction) {
  const location = interaction.options.getString('dia_diem', true).trim();
  await interaction.deferReply({ ephemeral: true });
  try {
    const geoUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
    geoUrl.search = new URLSearchParams({ name: location, count: '1', language: 'vi', format: 'json' }).toString();
    const geoResponse = await fetch(geoUrl, { signal: AbortSignal.timeout(8000) });
    if (!geoResponse.ok) throw new Error('Không truy vấn được dịch vụ định vị.');
    const geoData = await geoResponse.json() as { results?: Array<{name:string;country?:string;latitude:number;longitude:number;timezone?:string}> };
    const place = geoData.results?.[0];
    if (!place) return void await interaction.editReply(`Không tìm thấy địa điểm “${location}”. Hãy thử tên thành phố cụ thể hơn.`);
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({
      latitude: String(place.latitude), longitude: String(place.longitude),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
      timezone: 'auto'
    }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Không truy vấn được dữ liệu thời tiết.');
    const data = await response.json() as { current?: {temperature_2m:number;relative_humidity_2m:number;apparent_temperature:number;precipitation:number;weather_code:number;wind_speed_10m:number;time:string}; current_units?: {temperature_2m?:string;wind_speed_10m?:string} };
    if (!data.current) throw new Error('Dịch vụ không trả về dữ liệu thời tiết.');
    const current = data.current;
    const embed = new EmbedBuilder().setColor(0x4b9cd3).setTitle(`Thời tiết · ${place.name}${place.country ? `, ${place.country}` : ''}`)
      .setDescription(`**${WEATHER_CODES[current.weather_code] ?? 'Chưa rõ trạng thái'}**`)
      .addFields(
        { name: 'Nhiệt độ', value: `${current.temperature_2m}${data.current_units?.temperature_2m ?? '°C'}`, inline: true },
        { name: 'Cảm giác như', value: `${current.apparent_temperature}${data.current_units?.temperature_2m ?? '°C'}`, inline: true },
        { name: 'Độ ẩm', value: `${current.relative_humidity_2m}%`, inline: true },
        { name: 'Gió', value: `${current.wind_speed_10m}${data.current_units?.wind_speed_10m ?? ' km/h'}`, inline: true },
        { name: 'Lượng mưa', value: `${current.precipitation} mm`, inline: true },
        { name: 'Cập nhật', value: `${current.time} (${place.timezone ?? 'giờ địa phương'})`, inline: false }
      ).setFooter({ text: 'Nguồn dữ liệu: Open-Meteo' });
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    log('warn', 'Weather lookup failed', { error: error instanceof Error ? error.message : String(error) });
    await interaction.editReply('Không lấy được thời tiết lúc này. Hãy thử lại sau ít phút.');
  }
}

async function sendDueReminders(client: Client) {
  const now = Date.now();
  // Skip reminders missed by more than five minutes while the bot was offline.
  db.prepare('UPDATE event_reminder SET sent_at_ms = ? WHERE sent_at_ms IS NULL AND due_at_ms < ?')
    .run(now, now - 5 * 60 * 1000);
  const due = db.prepare(`SELECT r.id AS reminder_id,r.event_id,e.guild_id,e.title,e.description,e.starts_at_ms,e.timezone,e.channel_id
    FROM event_reminder r JOIN community_event e ON e.id = r.event_id
    WHERE r.sent_at_ms IS NULL AND r.due_at_ms <= ? AND e.status = 'scheduled' AND e.starts_at_ms > ?
    ORDER BY r.due_at_ms ASC LIMIT 100`).all(now, now) as Array<{
      reminder_id:number;event_id:number;guild_id:string;title:string;description:string;starts_at_ms:number;timezone:string;channel_id:string|null
    }>;
  for (const reminder of due) {
    if (!reminder.channel_id) {
      db.prepare('UPDATE event_reminder SET sent_at_ms = ? WHERE id = ?').run(now, reminder.reminder_id);
      continue;
    }
    const guild = client.guilds.cache.get(reminder.guild_id);
    const channel = guild ? await guild.channels.fetch(reminder.channel_id).catch(() => null) : null;
    if (channel?.isTextBased() && 'send' in channel) {
      const remaining = Math.max(1, Math.round((reminder.starts_at_ms - now) / 60000));
      const embed = new EmbedBuilder().setColor(0xe0a44d).setTitle(`Sắp diễn ra · ${reminder.title}`)
        .setDescription(reminder.description || 'Sự kiện sắp bắt đầu.')
        .addFields({ name: 'Bắt đầu lúc', value: `${fmtDate(reminder.starts_at_ms, reminder.timezone)} (${reminder.timezone})`, inline: false },
          { name: 'Còn khoảng', value: remaining >= 60 ? `${Math.round(remaining / 60)} giờ` : `${remaining} phút`, inline: true })
        .setFooter({ text: `Sự kiện #${reminder.event_id}` });
      await channel.send({ embeds: [embed], allowedMentions: { parse: [] } }).catch(error => log('warn', 'Event reminder send failed', { eventId: reminder.event_id, error: String(error) }));
    }
    db.prepare('UPDATE event_reminder SET sent_at_ms = ? WHERE id = ?').run(Date.now(), reminder.reminder_id);
  }
}

export function registerCommunityFeatures(client: Client) {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'event') return await handleEventCommand(interaction);
        if (interaction.commandName === 'voice-lobby') return await handleLobbyCommand(interaction);
        if (interaction.commandName === 'room') return await handleRoomCommand(interaction);
        if (interaction.commandName === 'weather') return await handleWeather(interaction);
      }
      if (interaction.isButton() && interaction.customId.startsWith('event:')) {
        if (!interaction.guild) return void await interaction.reply({ content: 'Tương tác này chỉ dùng trong server.', ephemeral: true });
        const [, idText, response] = interaction.customId.split(':');
        const eventId = Number(idText);
        if (!Number.isInteger(eventId) || !['going', 'interested'].includes(response ?? '')) return void await interaction.reply({ content: 'Nút sự kiện không hợp lệ.', ephemeral: true });
        const event = db.prepare("SELECT id,status FROM community_event WHERE id = ? AND guild_id = ?").get(eventId, interaction.guild.id) as {id:number;status:string}|undefined;
        if (!event || event.status !== 'scheduled') return void await interaction.reply({ content: 'Sự kiện không còn hoạt động.', ephemeral: true });
        db.prepare(`INSERT INTO event_rsvp (event_id,user_id,response) VALUES (?,?,?)
          ON CONFLICT(event_id,user_id) DO UPDATE SET response = excluded.response, updated_at = CURRENT_TIMESTAMP`)
          .run(eventId, interaction.user.id, response);
        audit(interaction.guild.id, 'community_event_rsvp', interaction.user.id, interaction.user.id, interaction.channelId ?? undefined, { eventId, response });
        const label = response === 'going' ? 'đã ghi nhận bạn tham gia' : 'đã ghi nhận bạn quan tâm';
        return void await interaction.reply({ content: `Sự kiện #${eventId}: ${label}.`, ephemeral: true });
      }
    } catch (error) {
      log('error', 'Community feature interaction failed', { error: error instanceof Error ? error.message : String(error) });
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Có lỗi khi xử lý. Hãy thử lại hoặc báo quản trị viên.', ephemeral: true }).catch(() => undefined);
      }
    }
  });

  client.once(Events.ClientReady, ready => {
    const timer = setInterval(() => void sendDueReminders(ready).catch(error => log('error', 'Reminder worker failed', { error: String(error) })), 15_000);
    timer.unref();
    void sendDueReminders(ready).catch(error => log('error', 'Initial reminder pass failed', { error: String(error) }));
  });
}
