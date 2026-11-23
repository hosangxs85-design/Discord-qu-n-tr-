import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events, type Client, type Interaction } from 'discord.js';
import { db, ensureGuild, getGuildConfig, audit } from '../db/database.js';
import { canConfigure, canReview } from '../permissions.js';
import { log } from '../logger.js';
import { grantVerified } from './verification.js';

export function registerInteractions(client: Client) {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        if (!interaction.guild || !interaction.member || !('permissions' in interaction.member)) {
          await interaction.reply({ content: 'Lệnh này chỉ dùng trong server Discord.', ephemeral: true }); return;
        }
        const guildId = interaction.guild.id;
        ensureGuild(guildId);
        const member = await interaction.guild.members.fetch(interaction.user.id);

        if (interaction.commandName === 'ping') {
          await interaction.reply({ content: `Pong! Độ trễ Gateway: ${client.ws.ping} ms.`, ephemeral: true });
          return;
        }
        if (interaction.commandName === 'setup') {
          if (!canConfigure(member)) { await interaction.reply({ content: 'Bạn không có quyền thiết lập bot.', ephemeral: true }); return; }
          const fields = {
            log_channel_id: interaction.options.getChannel('kenh_log')?.id,
            review_channel_id: interaction.options.getChannel('kenh_duyet')?.id,
            welcome_channel_id: interaction.options.getChannel('kenh_chao_mung')?.id,
            goodbye_channel_id: interaction.options.getChannel('kenh_tam_biet')?.id,
            event_channel_id: interaction.options.getChannel('kenh_su_kien')?.id,
            birthday_channel_id: interaction.options.getChannel('kenh_sinh_nhat')?.id,
            verification_channel_id: interaction.options.getChannel('kenh_xac_minh')?.id,
            unverified_role_id: interaction.options.getRole('role_chua_xac_minh')?.id,
            verified_role_id: interaction.options.getRole('role_da_xac_minh')?.id,
            reviewer_role_id: interaction.options.getRole('role_duyet')?.id,
            welcome_message: interaction.options.getString('loi_chao')?.trim(),
            goodbye_message: interaction.options.getString('loi_tam_biet')?.trim(),
            timezone: interaction.options.getString('mui_gio')?.trim()
          };
          if (fields.timezone) {
            try { new Intl.DateTimeFormat('vi-VN', { timeZone: fields.timezone }); }
            catch { await interaction.reply({ content: 'Múi giờ không hợp lệ. Hãy dùng tên IANA, ví dụ `Asia/Ho_Chi_Minh`.', ephemeral: true }); return; }
          }
          const unverifiedRoleId = fields.unverified_role_id;
          const verifiedRoleId = fields.verified_role_id;
          if (unverifiedRoleId && verifiedRoleId && unverifiedRoleId === verifiedRoleId) {
            await interaction.reply({ content: 'Hai role xác minh phải là hai role khác nhau.', ephemeral: true }); return;
          }
          if (unverifiedRoleId || verifiedRoleId) {
            const botMember = interaction.guild.members.me;
            if (!botMember) { await interaction.reply({ content: 'Không thể xác định role của bot trong server.', ephemeral: true }); return; }
            for (const roleId of [unverifiedRoleId, verifiedRoleId].filter(Boolean) as string[]) {
              const role = await interaction.guild.roles.fetch(roleId).catch(() => null);
              if (!role || role.id === interaction.guild.id || role.position >= botMember.roles.highest.position) {
                await interaction.reply({ content: 'Role được chọn không hợp lệ hoặc nằm ngang/trên role cao nhất của bot. Hãy đưa role bot lên cao hơn.', ephemeral: true }); return;
              }
            }
          }
          const values: Record<string, string> = {};
          for (const [key, value] of Object.entries(fields)) if (value) values[key] = value;
          if (Object.keys(values).length) {
            const sql = `UPDATE guild_config SET ${Object.keys(values).map(k => `${k} = @${k}`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE guild_id = @guild_id`;
            db.prepare(sql).run({ ...values, guild_id: guildId });
          }
          audit(guildId, 'configuration_updated', interaction.user.id, undefined, interaction.channelId ?? undefined, { fields: Object.keys(values) });
          await interaction.reply({ content: `Đã lưu ${Object.keys(values).length} mục cấu hình. Các mục bỏ trống được giữ nguyên. Hãy kiểm tra quyền và thứ tự role của bot trong Server Settings.`, ephemeral: true });
          return;
        }
        if (interaction.commandName === 'status') {
          const c = getGuildConfig(guildId);
          const embed = new EmbedBuilder().setTitle('Trạng thái cấu hình').setColor(0x8b78c6)
            .addFields(
              { name: 'Kênh nhật ký', value: c?.log_channel_id ? `<#${c.log_channel_id}>` : 'Chưa cấu hình', inline: true },
              { name: 'Kênh duyệt', value: c?.review_channel_id ? `<#${c.review_channel_id}>` : 'Chưa cấu hình', inline: true },
              { name: 'Kênh chào mừng', value: c?.welcome_channel_id ? `<#${c.welcome_channel_id}>` : 'Chưa cấu hình', inline: true },
              { name: 'Kênh tạm biệt', value: c?.goodbye_channel_id ? `<#${c.goodbye_channel_id}>` : 'Chưa cấu hình', inline: true },
              { name: 'Kênh sự kiện', value: c?.event_channel_id ? `<#${c.event_channel_id}>` : 'Dùng kênh gọi lệnh', inline: true },
              { name: 'Kênh sinh nhật', value: c?.birthday_channel_id ? `<#${c.birthday_channel_id}>` : 'Chưa cấu hình', inline: true },
              { name: 'Kênh xác minh', value: c?.verification_channel_id ? `<#${c.verification_channel_id}>` : 'Chưa cấu hình', inline: true },
              { name: 'Role chưa xác minh', value: c?.unverified_role_id ? `<@&${c.unverified_role_id}>` : 'Chưa cấu hình', inline: true },
              { name: 'Role đã xác minh', value: c?.verified_role_id ? `<@&${c.verified_role_id}>` : 'Chưa cấu hình', inline: true },
              { name: 'Múi giờ sự kiện', value: c?.timezone ?? 'Asia/Ho_Chi_Minh', inline: true },
              { name: 'Lưu nội dung tin nhắn', value: 'Tắt mặc định', inline: true }
            );
          await interaction.reply({ embeds: [embed], ephemeral: true }); return;
        }
        if (interaction.commandName === 'verify-grant') {
          if (!canConfigure(member)) { await interaction.reply({ content: 'Bạn không có quyền cấp xác minh thủ công.', ephemeral: true }); return; }
          const targetUser = interaction.options.getUser('thanh_vien', true);
          if (targetUser.bot) { await interaction.reply({ content: 'Không thể cấp xác minh cho bot.', ephemeral: true }); return; }
          const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
          if (!targetMember) { await interaction.reply({ content: 'Không tìm thấy thành viên trong server này.', ephemeral: true }); return; }
          await grantVerified(targetMember);
          audit(guildId, 'member_verified_manually', interaction.user.id, targetUser.id, interaction.channelId ?? undefined);
          await interaction.reply({ content: `Đã cấp role Đã xác minh cho <@${targetUser.id}>.`, ephemeral: true });
          return;
        }

        if (interaction.commandName === 'report') {
          const target = interaction.options.getUser('thanh_vien', true);
          const reason = interaction.options.getString('ly_do', true).trim();
          if (target.bot || target.id === interaction.user.id) { await interaction.reply({ content: 'Không thể báo cáo bot hoặc tự báo cáo chính mình.', ephemeral: true }); return; }
          const targetMember = await interaction.guild.members.fetch(target.id).catch(() => null);
          if (!targetMember) { await interaction.reply({ content: 'Chỉ có thể báo cáo thành viên hiện đang ở trong server.', ephemeral: true }); return; }
          const recentReports = db.prepare("SELECT COUNT(*) AS count FROM moderation_case WHERE guild_id = ? AND reporter_id = ? AND created_at >= datetime('now','-10 minutes')")
            .get(guildId, interaction.user.id) as { count: number };
          if (recentReports.count >= 3) { await interaction.reply({ content: 'Bạn đã gửi tối đa 3 báo cáo trong 10 phút. Vui lòng chờ trước khi gửi thêm.', ephemeral: true }); return; }
          const c = getGuildConfig(guildId);
          const result = db.prepare('INSERT INTO moderation_case (guild_id,reporter_id,subject_id,channel_id,reason) VALUES (?,?,?,?,?)')
            .run(guildId, interaction.user.id, target.id, interaction.channelId, reason);
          const caseId = Number(result.lastInsertRowid);
          audit(guildId, 'moderation_report_created', interaction.user.id, target.id, interaction.channelId, { caseId });
          const reviewChannel = c?.review_channel_id ? await interaction.guild.channels.fetch(c.review_channel_id).catch(() => null) : null;
          let sentToReviewChannel = false;
          if (reviewChannel?.isTextBased() && 'send' in reviewChannel) {
            const embed = new EmbedBuilder().setTitle(`Cần xem xét · Vụ việc #${caseId}`).setColor(0xd6a64b)
              .setDescription(reason).addFields(
                { name: 'Thành viên được báo cáo', value: `<@${target.id}>`, inline: true },
                { name: 'Người gửi', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Kênh', value: interaction.channel ? `<#${interaction.channelId}>` : 'Không rõ', inline: true }
              ).setFooter({ text: 'Đây chỉ là đề xuất xem xét; bot không tự áp dụng hình phạt.' });
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder().setCustomId(`case:${caseId}:approved`).setLabel('Chấp thuận đề xuất').setStyle(ButtonStyle.Success),
              new ButtonBuilder().setCustomId(`case:${caseId}:deferred`).setLabel('Để treo').setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId(`case:${caseId}:rejected`).setLabel('Từ chối').setStyle(ButtonStyle.Danger)
            );
            await reviewChannel.send({ embeds: [embed], components: [row], allowedMentions: { parse: [] } });
            sentToReviewChannel = true;
          }
          await interaction.reply({ content: sentToReviewChannel
            ? `Đã tạo báo cáo #${caseId} và gửi đến kênh kiểm duyệt.`
            : `Đã lưu báo cáo #${caseId}, nhưng server chưa cấu hình kênh kiểm duyệt hợp lệ. Hãy báo Admin để cấu hình /setup.`, ephemeral: true }); return;
        }
        if (interaction.commandName === 'cases') {
          if (!canReview(member)) { await interaction.reply({ content: 'Bạn không có quyền xem hàng đợi kiểm duyệt.', ephemeral: true }); return; }
          const rows = db.prepare("SELECT id, subject_id, reason, status, created_at FROM moderation_case WHERE guild_id = ? AND status IN ('pending','deferred') ORDER BY id DESC LIMIT 10").all(guildId) as Array<{id:number;subject_id:string;reason:string;status:string;created_at:string}>;
          const body = rows.length ? rows.map(r => `**#${r.id}** · ${r.status === 'deferred' ? 'Để treo' : 'Chờ duyệt'} · <@${r.subject_id}> · ${r.reason.slice(0,160)}`).join('\n') : 'Không có vụ việc đang chờ hoặc được để treo.';
          await interaction.reply({ content: body, ephemeral: true }); return;
        }
      }

      if (interaction.isButton() && interaction.customId.startsWith('case:')) {
        if (!interaction.guild) { await interaction.reply({ content: 'Tương tác không hợp lệ.', ephemeral: true }); return; }
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!canReview(member)) { await interaction.reply({ content: 'Bạn không có quyền duyệt vụ việc.', ephemeral: true }); return; }
        const [, idText, status] = interaction.customId.split(':');
        const caseId = Number(idText);
        if (!Number.isInteger(caseId)) { await interaction.reply({ content: 'Mã xử lý không hợp lệ.', ephemeral: true }); return; }
        if (status === 'reopen') {
          const result = db.prepare("UPDATE moderation_case SET status = 'pending', reviewer_id = NULL, reviewed_at = NULL WHERE id = ? AND guild_id = ? AND status = 'deferred'")
            .run(caseId, interaction.guild.id);
          if (result.changes !== 1) { await interaction.reply({ content: 'Vụ việc không còn ở trạng thái để treo hoặc đã được mở lại.', ephemeral: true }); return; }
          audit(interaction.guild.id, 'moderation_case_reopened', interaction.user.id, undefined, interaction.channelId ?? undefined, { caseId });
          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId(`case:${caseId}:approved`).setLabel('Chấp thuận đề xuất').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`case:${caseId}:deferred`).setLabel('Để treo').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`case:${caseId}:rejected`).setLabel('Từ chối').setStyle(ButtonStyle.Danger)
          );
          await interaction.update({ content: `Vụ việc #${caseId} đã được mở lại bởi <@${interaction.user.id}>.`, embeds: interaction.message.embeds, components: [row] });
          return;
        }
        if (!['approved','deferred','rejected'].includes(status)) { await interaction.reply({ content: 'Mã xử lý không hợp lệ.', ephemeral: true }); return; }
        const result = db.prepare("UPDATE moderation_case SET status = ?, reviewer_id = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ? AND guild_id = ? AND status = 'pending'")
          .run(status, interaction.user.id, caseId, interaction.guild.id);
        if (result.changes !== 1) { await interaction.reply({ content: 'Vụ việc đã được xử lý hoặc không còn tồn tại.', ephemeral: true }); return; }
        audit(interaction.guild.id, 'moderation_case_reviewed', interaction.user.id, undefined, interaction.channelId ?? undefined, { caseId, status });
        const label = status === 'approved' ? 'Đã chấp thuận đề xuất' : status === 'deferred' ? 'Đã để treo' : 'Đã từ chối';
        if (status === 'deferred') {
          const reopenRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId(`case:${caseId}:reopen`).setLabel('Mở lại để xem xét').setStyle(ButtonStyle.Primary)
          );
          await interaction.update({ content: `${label} bởi <@${interaction.user.id}>. Vụ việc vẫn có thể được mở lại.`, embeds: interaction.message.embeds, components: [reopenRow] });
        } else {
          await interaction.update({ content: `${label} bởi <@${interaction.user.id}>. **Không có hình phạt nào được tự động thực hiện.**`, embeds: interaction.message.embeds, components: [] });
        }
      }
    } catch (error) {
      log('error', 'Interaction handler failed', { error: error instanceof Error ? error.message : 'unknown' });
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Có lỗi khi xử lý thao tác. Hãy thử lại hoặc báo quản trị viên.', ephemeral: true }).catch(() => undefined);
      }
    }
  });
}
