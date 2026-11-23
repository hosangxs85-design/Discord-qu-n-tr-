import { EmbedBuilder, Events, type Client, type Guild } from 'discord.js';
import { audit, db, ensureGuild, getGuildConfig } from '../db/database.js';
import { log } from '../logger.js';

const labels: Record<string, string> = {
  member_join: 'Thành viên tham gia', member_leave: 'Thành viên rời server',
  message_deleted_metadata_only: 'Tin nhắn bị xóa (chỉ metadata)', message_edited_metadata_only: 'Tin nhắn được sửa (chỉ metadata)',
  member_nickname_changed: 'Thay đổi biệt danh', member_roles_changed: 'Thay đổi vai trò',
  voice_join: 'Tham gia phòng voice', voice_leave: 'Rời phòng voice', voice_move: 'Chuyển phòng voice',
  channel_created: 'Tạo kênh', channel_deleted: 'Xóa kênh', channel_updated: 'Thay đổi kênh',
  role_created: 'Tạo vai trò', role_deleted: 'Xóa vai trò', role_updated: 'Thay đổi vai trò',
  ban_added: 'Thành viên bị ban (thao tác bên ngoài bot)', ban_removed: 'Thành viên được gỡ ban'
};

async function sendAudit(guild: Guild, eventType: string, subjectId?: string, channelId?: string, details: Record<string, unknown> = {}) {
  const config = getGuildConfig(guild.id);
  if (!config?.log_channel_id) return;
  const channel = await guild.channels.fetch(config.log_channel_id).catch(() => null);
  if (!channel?.isTextBased() || !('send' in channel)) return;
  const embed = new EmbedBuilder().setColor(0x64748b).setTitle(labels[eventType] ?? 'Nhật ký server')
    .addFields(
      { name: 'Loại sự kiện', value: eventType, inline: true },
      { name: 'Đối tượng', value: subjectId ? `<@${subjectId}>` : 'Không xác định', inline: true },
      { name: 'Kênh', value: channelId ? `<#${channelId}>` : 'Không áp dụng', inline: true }
    ).setTimestamp();
  const detailText = Object.entries(details).map(([key, value]) => `**${key}:** ${String(value).slice(0, 200)}`).join('\n');
  if (detailText) embed.addFields({ name: 'Chi tiết', value: detailText.slice(0, 1000) });
  const sendable = channel as typeof channel & { send: (options: { embeds: EmbedBuilder[]; allowedMentions: { parse: never[] } }) => Promise<unknown> };
  await sendable.send({ embeds: [embed], allowedMentions: { parse: [] } }).catch(() => undefined);
}

async function logEvent(guild: Guild, type: string, actorId?: string, subjectId?: string, channelId?: string, details: Record<string, unknown> = {}) {
  audit(guild.id, type, actorId, subjectId, channelId, details);
  await sendAudit(guild, type, subjectId, channelId, details);
}

function applyTemplate(template: string | null, userId: string, guildName: string, fallback: string) {
  return (template || fallback).replaceAll('{user}', `<@${userId}>`).replaceAll('{server}', guildName).slice(0, 1800);
}

export function registerGuildEvents(client: Client) {
  client.on(Events.GuildMemberAdd, async member => {
    ensureGuild(member.guild.id);
    const config = getGuildConfig(member.guild.id);
    await logEvent(member.guild, 'member_join', client.user?.id, member.id);
    if (config?.welcome_channel_id) {
      const channel = await member.guild.channels.fetch(config.welcome_channel_id).catch(() => null);
      if (channel?.isTextBased() && 'send' in channel) {
        const content = applyTemplate(config.welcome_message, member.id, member.guild.name, `Chào mừng {user} đến với **{server}**!`);
        await channel.send({ content, allowedMentions: { parse: [] } }).catch(error => log('warn', 'Welcome message failed', { error: String(error) }));
      }
    }
    if (config?.unverified_role_id && config.verified_role_id) {
      try {
        await member.roles.remove(config.verified_role_id, 'Đồng bộ trạng thái thành viên mới');
        await member.roles.add(config.unverified_role_id, 'Gán trạng thái chưa xác minh khi tham gia');
      } catch (error) {
        log('warn', 'Could not assign unverified role', { guildId: member.guild.id, error: String(error) });
      }
    }
  });

  client.on(Events.GuildMemberRemove, async member => {
    const config = getGuildConfig(member.guild.id);
    db.prepare('DELETE FROM birthday_registration WHERE guild_id = ? AND user_id = ?').run(member.guild.id, member.id);
    db.prepare('DELETE FROM birthday_delivery WHERE guild_id = ? AND user_id = ?').run(member.guild.id, member.id);
    await logEvent(member.guild, 'member_leave', client.user?.id, member.id);
    if (config?.goodbye_channel_id) {
      const channel = await member.guild.channels.fetch(config.goodbye_channel_id).catch(() => null);
      if (channel?.isTextBased() && 'send' in channel) {
        const content = applyTemplate(config.goodbye_message, member.id, member.guild.name, '**{user}** đã rời server {server}.');
        await channel.send({ content, allowedMentions: { parse: [] } }).catch(error => log('warn', 'Goodbye message failed', { error: String(error) }));
      }
    }
  });

  client.on(Events.MessageDelete, message => {
    if (!message.guildId) return;
    const guild = message.guild;
    audit(message.guildId, 'message_deleted_metadata_only', undefined, message.author?.id, message.channelId, { messageId: message.id, contentStored: false });
    if (guild) void sendAudit(guild, 'message_deleted_metadata_only', message.author?.id, message.channelId, { messageId: message.id, contentStored: false });
  });
  client.on(Events.MessageUpdate, (oldMessage, newMessage) => {
    if (!newMessage.guildId) return;
    const guild = newMessage.guild;
    audit(newMessage.guildId, 'message_edited_metadata_only', undefined, newMessage.author?.id, newMessage.channelId, { messageId: newMessage.id, contentStored: false });
    if (guild) void sendAudit(guild, 'message_edited_metadata_only', newMessage.author?.id, newMessage.channelId, { messageId: newMessage.id, contentStored: false });
  });

  client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    if (oldMember.nickname !== newMember.nickname) {
      await logEvent(newMember.guild, 'member_nickname_changed', undefined, newMember.id, undefined, {
        before: oldMember.nickname ?? oldMember.user.username,
        after: newMember.nickname ?? newMember.user.username
      });
    }
    const before = new Set(oldMember.roles.cache.keys());
    const after = new Set(newMember.roles.cache.keys());
    const added = [...after].filter(id => !before.has(id));
    const removed = [...before].filter(id => !after.has(id));
    if (added.length || removed.length) {
      await logEvent(newMember.guild, 'member_roles_changed', undefined, newMember.id, undefined, {
        added: added.map(id => newMember.guild.roles.cache.get(id)?.name ?? id).join(', ') || 'Không có',
        removed: removed.map(id => oldMember.guild.roles.cache.get(id)?.name ?? id).join(', ') || 'Không có'
      });
    }
  });

  client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    if (oldState.channelId === newState.channelId) return;
    const memberId = newState.id;
    const type = !oldState.channelId ? 'voice_join' : !newState.channelId ? 'voice_leave' : 'voice_move';
    const channelId = newState.channelId ?? oldState.channelId ?? undefined;
    await logEvent(newState.guild, type, undefined, memberId, channelId, {
      from: oldState.channel?.name ?? 'Không có', to: newState.channel?.name ?? 'Không có'
    });
  });

  client.on(Events.ChannelCreate, channel => {
    if (channel.guild) void logEvent(channel.guild, 'channel_created', undefined, undefined, channel.id, { name: channel.name, type: channel.type });
  });
  client.on(Events.ChannelDelete, channel => {
    if ('guild' in channel && channel.guild && 'name' in channel) void logEvent(channel.guild, 'channel_deleted', undefined, undefined, channel.id, { name: channel.name, type: channel.type });
  });
  client.on(Events.ChannelUpdate, (oldChannel, newChannel) => {
    if (!('guild' in newChannel) || !newChannel.guild || !('name' in oldChannel) || !('name' in newChannel)) return;
    if (oldChannel.name !== newChannel.name || ('topic' in oldChannel && 'topic' in newChannel && oldChannel.topic !== newChannel.topic)) {
      void logEvent(newChannel.guild, 'channel_updated', undefined, undefined, newChannel.id, {
        before: oldChannel.name, after: newChannel.name
      });
    }
  });
  client.on(Events.GuildRoleCreate, role => void logEvent(role.guild, 'role_created', undefined, undefined, undefined, { name: role.name, roleId: role.id }));
  client.on(Events.GuildRoleDelete, role => void logEvent(role.guild, 'role_deleted', undefined, undefined, undefined, { name: role.name, roleId: role.id }));
  client.on(Events.GuildRoleUpdate, (oldRole, newRole) => {
    if (oldRole.name !== newRole.name || oldRole.color !== newRole.color) {
      void logEvent(newRole.guild, 'role_updated', undefined, undefined, undefined, { before: oldRole.name, after: newRole.name });
    }
  });
  client.on(Events.GuildBanAdd, ban => void logEvent(ban.guild, 'ban_added', undefined, ban.user.id));
  client.on(Events.GuildBanRemove, ban => void logEvent(ban.guild, 'ban_removed', undefined, ban.user.id));
}
