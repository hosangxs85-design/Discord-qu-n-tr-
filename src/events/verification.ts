import { randomInt, randomUUID } from 'node:crypto';
import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, ModalBuilder,
  TextInputBuilder, TextInputStyle, type Client, type GuildMember, type Interaction
} from 'discord.js';
import { db, getGuildConfig, audit } from '../db/database.js';
import { canConfigure } from '../permissions.js';
import { log } from '../logger.js';

function makeChallenge() {
  const a = randomInt(2, 10);
  const b = randomInt(2, 10);
  return { question: `${a} + ${b} = ?`, answer: a + b };
}

export async function grantVerified(member: GuildMember) {
  const c = getGuildConfig(member.guild.id);
  if (!c?.unverified_role_id || !c.verified_role_id) {
    throw new Error('Chưa cấu hình đủ hai role xác minh.');
  }
  const unverified = member.guild.roles.cache.get(c.unverified_role_id) ?? await member.guild.roles.fetch(c.unverified_role_id);
  const verified = member.guild.roles.cache.get(c.verified_role_id) ?? await member.guild.roles.fetch(c.verified_role_id);
  if (!unverified || !verified) throw new Error('Không tìm thấy role xác minh đã cấu hình.');
  const botMember = member.guild.members.me;
  if (!botMember || verified.position >= botMember.roles.highest.position || unverified.position >= botMember.roles.highest.position) {
    throw new Error('Role bot phải nằm cao hơn hai role xác minh.');
  }
  // Add the destination role first so a transient failure cannot leave the member without access.
  await member.roles.add(verified, 'Hoàn tất xác minh Discord Community Suite');
  await member.roles.remove(unverified, 'Hoàn tất xác minh Discord Community Suite');
}

export function registerVerification(client: Client) {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    try {
      if (interaction.isChatInputCommand() && interaction.commandName === 'verify-panel') {
        if (!interaction.guild) return void await interaction.reply({ content: 'Chỉ dùng trong server.', ephemeral: true });
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!canConfigure(member)) return void await interaction.reply({ content: 'Bạn không có quyền đăng bảng xác minh.', ephemeral: true });
        const c = getGuildConfig(interaction.guild.id);
        if (!c?.verification_channel_id || !c.unverified_role_id || !c.verified_role_id) {
          return void await interaction.reply({ content: 'Hãy chạy /setup và cấu hình kênh xác minh cùng hai role trước.', ephemeral: true });
        }
        const channel = await interaction.guild.channels.fetch(c.verification_channel_id).catch(() => null);
        if (!channel?.isTextBased() || !('send' in channel)) return void await interaction.reply({ content: 'Kênh xác minh không hợp lệ hoặc bot không có quyền gửi tin.', ephemeral: true });
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('verify:start').setLabel('Bắt đầu xác minh').setStyle(ButtonStyle.Success)
        );
        await channel.send({ content: '**Xác minh thành viên**\nNhấn nút bên dưới để nhận một câu hỏi kiểm tra đơn giản. Hoàn tất xác minh sẽ cấp quyền truy cập theo cấu hình server.', components: [row] });
        await interaction.reply({ content: 'Đã đăng bảng xác minh.', ephemeral: true });
        return;
      }

      if (interaction.isButton() && interaction.customId === 'verify:start') {
        if (!interaction.guild) return void await interaction.reply({ content: 'Không xác định được server.', ephemeral: true });
        const c = getGuildConfig(interaction.guild.id);
        if (!c?.unverified_role_id || !c.verified_role_id) return void await interaction.reply({ content: 'Hệ thống xác minh chưa được cấu hình.', ephemeral: true });
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (member.roles.cache.has(c.verified_role_id)) return void await interaction.reply({ content: 'Bạn đã được xác minh.', ephemeral: true });
        // Clean expired records and apply a short cooldown to prevent challenge spam.
        db.prepare('DELETE FROM verification_challenge WHERE expires_at < ?').run(Date.now());
        const now = Date.now();
        const recent = db.prepare('SELECT last_issued_at FROM verification_rate_limit WHERE guild_id = ? AND user_id = ?')
          .get(interaction.guild.id, interaction.user.id) as { last_issued_at: number } | undefined;
        if (recent && now - recent.last_issued_at < 10_000) {
          return void await interaction.reply({ content: 'Bạn vừa tạo một yêu cầu xác minh. Vui lòng chờ 10 giây rồi thử lại.', ephemeral: true });
        }
        const challenge = makeChallenge();
        const token = randomUUID();
        db.prepare('DELETE FROM verification_challenge WHERE guild_id = ? AND user_id = ?').run(interaction.guild.id, interaction.user.id);
        db.prepare('INSERT INTO verification_challenge (token,guild_id,user_id,answer,expires_at) VALUES (?,?,?,?,?)')
          .run(token, interaction.guild.id, interaction.user.id, challenge.answer, now + 5 * 60 * 1000);
        db.prepare('INSERT INTO verification_rate_limit (guild_id,user_id,last_issued_at) VALUES (?,?,?) ON CONFLICT(guild_id,user_id) DO UPDATE SET last_issued_at = excluded.last_issued_at')
          .run(interaction.guild.id, interaction.user.id, now);
        db.prepare('DELETE FROM verification_rate_limit WHERE last_issued_at < ?').run(now - 24 * 60 * 60 * 1000);
        const modal = new ModalBuilder().setCustomId(`verify:answer:${token}`).setTitle('Xác minh thành viên');
        const input = new TextInputBuilder().setCustomId('answer').setLabel(challenge.question).setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(3);
        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
        await interaction.showModal(modal);
        return;
      }

      if (interaction.isModalSubmit() && interaction.customId.startsWith('verify:answer:')) {
        if (!interaction.guild) return void await interaction.reply({ content: 'Không xác định được server.', ephemeral: true });
        const token = interaction.customId.split(':')[2];
        const challenge = db.prepare('SELECT answer, expires_at FROM verification_challenge WHERE token = ? AND guild_id = ? AND user_id = ?')
          .get(token, interaction.guild.id, interaction.user.id) as { answer: number; expires_at: number } | undefined;
        db.prepare('DELETE FROM verification_challenge WHERE token = ?').run(token);
        if (!challenge || challenge.expires_at < Date.now()) return void await interaction.reply({ content: 'Mã xác minh đã hết hạn. Hãy nhấn nút để thử lại.', ephemeral: true });
        const answer = Number(interaction.fields.getTextInputValue('answer').trim());
        if (!Number.isInteger(answer) || answer !== challenge.answer) return void await interaction.reply({ content: 'Câu trả lời chưa chính xác. Hãy nhấn nút để tạo câu hỏi mới.', ephemeral: true });
        const member = await interaction.guild.members.fetch(interaction.user.id);
        await grantVerified(member);
        audit(interaction.guild.id, 'member_verified', interaction.user.id, interaction.user.id);
        await interaction.reply({ content: 'Xác minh thành công. Role Đã xác minh đã được cấp.', ephemeral: true });
      }
    } catch (error) {
      log('error', 'Verification interaction failed', { error: error instanceof Error ? error.message : 'unknown' });
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Không thể hoàn tất xác minh do lỗi cấu hình hoặc quyền Discord. Hãy báo quản trị viên kiểm tra.', ephemeral: true }).catch(() => undefined);
      }
    }
  });
}
