import { randomBytes } from 'node:crypto';
import {
  ChannelType, Events, PermissionFlagsBits, type Client, type GuildMember,
  type VoiceBasedChannel, type VoiceState
} from 'discord.js';
import { db, audit } from '../db/database.js';
import { log } from '../logger.js';

const pendingDeletion = new Map<string, NodeJS.Timeout>();

type RoomRow = {
  id: number; guild_id: string; voice_channel_id: string; room_code: string;
  owner_id: string; hidden: number; locked: number; delete_after_seconds: number;
};

function newRoomCode() {
  return randomBytes(8).toString('hex').toUpperCase();
}

function getRoom(channelId: string): RoomRow | undefined {
  return db.prepare('SELECT * FROM temporary_voice_room WHERE voice_channel_id = ?').get(channelId) as RoomRow | undefined;
}

export function getManagedRoom(member: GuildMember): RoomRow | undefined {
  const current = member.voice.channelId ? getRoom(member.voice.channelId) : undefined;
  if (current) return current;
  return db.prepare('SELECT * FROM temporary_voice_room WHERE guild_id = ? AND owner_id = ? ORDER BY id DESC LIMIT 1')
    .get(member.guild.id, member.id) as RoomRow | undefined;
}

export async function applyRoomSetting(room: RoomRow, guild: import('discord.js').Guild, setting: 'lock' | 'open' | 'hide' | 'show') {
  const channel = await guild.channels.fetch(room.voice_channel_id).catch(() => null);
  if (!channel || !channel.isVoiceBased()) throw new Error('Không tìm thấy phòng voice đang hoạt động.');
  const everyoneId = guild.id;
  const nextLocked = setting === 'lock' ? 1 : setting === 'open' ? 0 : room.locked;
  const nextHidden = setting === 'hide' ? 1 : setting === 'show' ? 0 : room.hidden;

  if (nextLocked || nextHidden) {
    await channel.permissionOverwrites.edit(everyoneId, {
      Connect: nextLocked ? false : null,
      ViewChannel: nextHidden ? false : null
    });
  } else {
    await channel.permissionOverwrites.delete(everyoneId).catch(() => undefined);
  }
  const owner = await guild.members.fetch(room.owner_id).catch(() => null);
  if (owner) await channel.permissionOverwrites.edit(owner.id, { ViewChannel: true, Connect: true });
  db.prepare('UPDATE temporary_voice_room SET locked = ?, hidden = ? WHERE id = ?')
    .run(nextLocked, nextHidden, room.id);
}

function humansIn(channel: VoiceBasedChannel): number {
  return channel.members.filter(member => !member.user.bot).size;
}

async function scheduleDelete(channel: VoiceBasedChannel) {
  const key = channel.id;
  if (pendingDeletion.has(key)) return;
  const room = getRoom(key);
  const delaySeconds = Math.max(5, room?.delete_after_seconds ?? 5);
  const timer = setTimeout(async () => {
    pendingDeletion.delete(key);
    const current = await channel.guild.channels.fetch(key).catch(() => null);
    if (!current?.isVoiceBased() || humansIn(current) > 0) return;
    const room = getRoom(key);
    if (!room) return;
    try {
      await current.delete('Phòng voice tạm trống; bot không được tính là thành viên giữ phòng.');
      db.prepare('DELETE FROM temporary_voice_room WHERE id = ?').run(room.id);
      audit(channel.guild.id, 'temporary_voice_deleted', undefined, room.owner_id, key, { roomId: room.id });
    } catch (error) {
      log('warn', 'Could not delete empty temporary voice room', { channelId: key, error: error instanceof Error ? error.message : String(error) });
    }
  }, delaySeconds * 1000);
  timer.unref();
  pendingDeletion.set(key, timer);
}

function cancelDelete(channelId: string) {
  const timer = pendingDeletion.get(channelId);
  if (timer) clearTimeout(timer);
  pendingDeletion.delete(channelId);
}

async function createTemporaryRoom(member: GuildMember, lobby: VoiceBasedChannel) {
  const existing = db.prepare('SELECT voice_channel_id FROM temporary_voice_room WHERE guild_id = ? AND owner_id = ?')
    .get(member.guild.id, member.id) as { voice_channel_id: string } | undefined;
  if (existing) {
    const active = await member.guild.channels.fetch(existing.voice_channel_id).catch(() => null);
    if (active?.isVoiceBased()) {
      await member.voice.setChannel(active, 'Thành viên đã có phòng voice tạm đang hoạt động');
      return;
    }
    db.prepare('DELETE FROM temporary_voice_room WHERE guild_id = ? AND owner_id = ?').run(member.guild.id, member.id);
  }

  const safeName = `Phòng · ${member.displayName}`.slice(0, 95);
  const lobbySettings = db.prepare('SELECT delete_after_seconds FROM voice_lobby WHERE guild_id = ? AND source_channel_id = ?')
    .get(member.guild.id, lobby.id) as { delete_after_seconds: number } | undefined;
  const roomChannel = await member.guild.channels.create({
    name: safeName,
    type: ChannelType.GuildVoice,
    parent: lobby.parentId,
    reason: `Phòng voice tạm do ${member.user.tag} tạo`,
    permissionOverwrites: [{
      id: member.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]
    }]
  });
  const roomCode = newRoomCode();
  const result = db.prepare('INSERT INTO temporary_voice_room (guild_id,voice_channel_id,room_code,owner_id,delete_after_seconds) VALUES (?,?,?,?,?)')
    .run(member.guild.id, roomChannel.id, roomCode, member.id, lobbySettings?.delete_after_seconds ?? 5);
  const roomId = Number(result.lastInsertRowid);
  audit(member.guild.id, 'temporary_voice_created', member.id, member.id, roomChannel.id, { roomId });
  try {
    await member.voice.setChannel(roomChannel, 'Tạo phòng voice tạm thời');
    await member.send(`Phòng voice **${roomChannel.name}** đã được tạo. Mã riêng của phòng: \`${roomCode}\`. Dùng lệnh /phòng mã khi đang ở phòng để xem lại.`).catch(() => undefined);
  } catch (error) {
    log('warn', 'Temporary room created but member could not be moved', { guildId: member.guild.id, channelId: roomChannel.id, error: error instanceof Error ? error.message : String(error) });
  }
}

async function checkVacated(state: VoiceState) {
  const channel = state.channel;
  if (!channel || !getRoom(channel.id)) return;
  if (humansIn(channel) > 0) {
    cancelDelete(channel.id);
    const room = getRoom(channel.id);
    if (room && room.owner_id === state.id) {
      const nextOwner = channel.members.find(candidate => !candidate.user.bot);
      if (nextOwner) {
        db.prepare('UPDATE temporary_voice_room SET owner_id = ? WHERE voice_channel_id = ?').run(nextOwner.id, channel.id);
        await channel.permissionOverwrites.edit(nextOwner.id, { ViewChannel: true, Connect: true }).catch(() => undefined);
        audit(channel.guild.id, 'temporary_voice_owner_transferred', state.id, nextOwner.id, channel.id);
      }
    }
    return;
  }
  await scheduleDelete(channel);
}

export function registerVoiceRooms(client: Client) {
  client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    try {
      if (oldState.channelId && oldState.channelId !== newState.channelId) await checkVacated(oldState);
      if (!newState.channelId || oldState.channelId === newState.channelId || !newState.member || newState.member.user.bot) return;
      const isLobby = db.prepare('SELECT 1 FROM voice_lobby WHERE guild_id = ? AND source_channel_id = ?')
        .get(newState.guild.id, newState.channelId);
      if (isLobby && newState.channel?.isVoiceBased()) await createTemporaryRoom(newState.member, newState.channel);
      else if (getRoom(newState.channelId)) cancelDelete(newState.channelId);
    } catch (error) {
      log('error', 'Temporary voice handler failed', { guildId: newState.guild.id, error: error instanceof Error ? error.message : String(error) });
    }
  });

  client.once(Events.ClientReady, async ready => {
    const rows = db.prepare('SELECT voice_channel_id FROM temporary_voice_room').all() as Array<{ voice_channel_id: string }>;
    for (const row of rows) {
      const channel = await ready.channels.fetch(row.voice_channel_id).catch(() => null);
      if (!channel?.isVoiceBased()) {
        db.prepare('DELETE FROM temporary_voice_room WHERE voice_channel_id = ?').run(row.voice_channel_id);
      } else if (humansIn(channel) === 0) {
        await scheduleDelete(channel);
      }
    }
  });
}

export async function grantRoomAccess(guild: import('discord.js').Guild, roomCode: string, member: GuildMember) {
  const room = db.prepare('SELECT * FROM temporary_voice_room WHERE guild_id = ? AND room_code = ?')
    .get(guild.id, roomCode.toUpperCase()) as RoomRow | undefined;
  if (!room) return null;
  const channel = await guild.channels.fetch(room.voice_channel_id).catch(() => null);
  if (!channel?.isVoiceBased()) {
    db.prepare('DELETE FROM temporary_voice_room WHERE id = ?').run(room.id);
    return null;
  }
  // The random room code acts as an invite. Locking hides ordinary discovery,
  // while an explicit code grants this member a channel-specific allow overwrite.
  await channel.permissionOverwrites.edit(member.id, { ViewChannel: true, Connect: true });
  audit(guild.id, 'temporary_voice_access_granted_by_code', member.id, member.id, channel.id, { roomId: room.id });
  return channel;
}
