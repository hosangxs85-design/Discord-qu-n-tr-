import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { commands } from '../src/commands/index.js';

const read = (relative: string) => fs.readFileSync(path.resolve(process.cwd(), relative), 'utf8');
function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(target) : target.endsWith('.ts') ? [target] : [];
  });
}

const allSource = () => sourceFiles(path.resolve(process.cwd(), 'src')).map(file => fs.readFileSync(file, 'utf8')).join('\n');

describe('MVP safety and registration invariants', () => {
  it('does not register punitive commands', () => {
    const source = read('src/commands/index.ts');
    expect(source).not.toMatch(/setName\('(ban|kick|timeout)'\)/);
  });

  it('contains no API path that automatically bans, kicks, or times out members', () => {
    expect(allSource()).not.toMatch(/\b(?:members|member|targetMember)\.(?:ban|kick|timeout)\s*\(/);
  });

  it('keeps Message Content Intent disabled', () => {
    expect(read('src/index.ts')).not.toContain('MessageContent');
  });

  it('registers verification commands only once', () => {
    const source = read('src/commands/index.ts');
    const names = [...source.matchAll(/setName\('([^']+)'\)/g)].map(match => match[1]);
    expect(names.filter(name => name === 'verify-panel')).toHaveLength(1);
    expect(names.filter(name => name === 'verify-grant')).toHaveLength(1);
  });

  it('stores verification challenges and cooldowns per guild and user', () => {
    const source = read('src/db/database.ts');
    expect(source).toContain('PRIMARY KEY (guild_id, user_id)');
    expect(source).toContain('CREATE TABLE IF NOT EXISTS verification_rate_limit');
  });

  it('reopens deferred cases without applying punishments', () => {
    const source = read('src/events/interactionCreate.ts');
    expect(source).toContain("status = 'pending'");
    expect(source).toContain("status = 'deferred'");
    expect(source).toContain('Không có hình phạt nào được tự động thực hiện');
  });

  it('serializes every command with Vietnamese display localization', () => {
    const payloads = commands.map(command => command.toJSON());
    expect(payloads).toHaveLength(15);
    for (const command of payloads) expect(command.name_localizations?.vi).toBeTruthy();
    expect(payloads.find(command => command.name === 'event')?.name_localizations?.vi).toBe('sự-kiện');
    expect(payloads.find(command => command.name === 'room')?.name_localizations?.vi).toBe('phòng');
  });

  it('supports persistent events with timezone-aware timestamps and reminders', () => {
    const source = read('src/events/communityFeatures.ts');
    expect(source).toContain('ISO 8601 có múi giờ');
    expect(source).toContain('30 * DAY');
    expect(source).toContain('REMINDER_OFFSETS');
    expect(read('src/db/database.ts')).toContain('CREATE TABLE IF NOT EXISTS event_reminder');
  });

  it('creates multiple voice lobbies and deletes rooms based on human members only', () => {
    const source = read('src/events/voiceRooms.ts');
    expect(source).toContain('!member.user.bot');
    expect(source).toContain('Math.max(5, room?.delete_after_seconds ?? 5)');
    expect(read('src/db/database.ts')).toContain('PRIMARY KEY (guild_id, source_channel_id)');
  });

  it('rate-limits private room-code attempts and stores random room codes', () => {
    expect(read('src/events/communityFeatures.ts')).toContain('recentAttempts.count >= 5');
    expect(read('src/events/voiceRooms.ts')).toContain('randomBytes(8)');
  });

  it('registers Vietnamese-localized birthday, poll, ticket and FAQ command roots', () => {
    const payloads = commands.map(command => command.toJSON());
    const expected: Record<string, string> = {
      birthday: 'sinh-nhật', poll: 'bình-chọn', ticket: 'hỗ-trợ', faq: 'câu-hỏi'
    };
    for (const [name, localized] of Object.entries(expected)) {
      expect(payloads.find(command => command.name === name)?.name_localizations?.vi).toBe(localized);
    }
  });

  it('adds community tool tables without changing the legacy moderation model', () => {
    const dbSource = read('src/db/database.ts');
    for (const table of ['birthday_registration', 'birthday_delivery', 'community_poll', 'poll_option', 'poll_vote', 'ticket_config', 'support_ticket', 'faq_entry']) {
      expect(dbSource).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    }
    expect(dbSource).toContain('idx_ticket_one_open_per_owner');
    expect(dbSource).toContain('birthday_channel_id');
  });

  it('keeps birthday opt-in month/day only and allows users to remove it', () => {
    const source = read('src/events/communityTools.ts');
    expect(source).toContain("INSERT INTO birthday_registration (guild_id,user_id,month,day)");
    expect(source).toContain("DELETE FROM birthday_registration WHERE guild_id = ? AND user_id = ?");
    expect(source).toContain('đăng ký đồng nghĩa bạn đồng ý');
    expect(source).toContain('birthday_delivery');
    const guildEvents = read('src/events/guildEvents.ts');
    expect(guildEvents).toContain('DELETE FROM birthday_registration WHERE guild_id = ? AND user_id = ?');
    expect(guildEvents).toContain('DELETE FROM birthday_delivery WHERE guild_id = ? AND user_id = ?');
  });

  it('enforces one replaceable vote per user and keeps poll close permission-checked', () => {
    const source = read('src/events/communityTools.ts');
    expect(read('src/db/database.ts')).toContain('PRIMARY KEY (poll_id,user_id)');
    expect(source).toContain('ON CONFLICT(poll_id,user_id) DO UPDATE');
    expect(source).toContain('poll.creator_id !== member.id && !canConfigure(member)');
  });

  it('creates private tickets and preserves their channel history on close', () => {
    const source = read('src/events/communityTools.ts');
    expect(source).toContain('deny: [PermissionFlagsBits.ViewChannel]');
    expect(source).toContain('ticket.owner_id !== member.id');
    expect(source).toContain('Kênh và lịch sử vẫn được giữ lại');
    expect(source).not.toContain('channel.delete(\'Ticket đã đóng');
  });

  it('restricts FAQ edits to configured administrators and rejects unsafe keys', () => {
    const source = read('src/events/communityTools.ts');
    expect(source).toContain('if (!canConfigure(member))');
    expect(source).toContain('const faqKeyPattern = /^[a-z0-9][a-z0-9-]{1,31}$/');
    expect(source).toContain('ON CONFLICT(guild_id,faq_key)');
  });
});
