import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

const dbPath = path.resolve(config.DATABASE_PATH);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Tables are created additively so existing v0.1-v0.4 databases remain usable.
db.exec(`
CREATE TABLE IF NOT EXISTS guild_config (
  guild_id TEXT PRIMARY KEY,
  log_channel_id TEXT,
  review_channel_id TEXT,
  welcome_channel_id TEXT,
  verification_channel_id TEXT,
  unverified_role_id TEXT,
  verified_role_id TEXT,
  reviewer_role_id TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  welcome_enabled INTEGER NOT NULL DEFAULT 0,
  message_content_logging INTEGER NOT NULL DEFAULT 0,
  goodbye_channel_id TEXT,
  event_channel_id TEXT,
  birthday_channel_id TEXT,
  welcome_message TEXT,
  goodbye_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS audit_event (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor_id TEXT,
  subject_id TEXT,
  channel_id TEXT,
  details_json TEXT NOT NULL DEFAULT '{}',
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_guild_time ON audit_event(guild_id, occurred_at);
CREATE TABLE IF NOT EXISTS moderation_case (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  channel_id TEXT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','deferred','approved','rejected','closed')),
  reviewer_id TEXT,
  review_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_cases_guild_status ON moderation_case(guild_id, status);
CREATE TABLE IF NOT EXISTS verification_challenge (
  token TEXT PRIMARY KEY, guild_id TEXT NOT NULL, user_id TEXT NOT NULL, answer INTEGER NOT NULL,
  expires_at INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_verification_user ON verification_challenge(guild_id, user_id, expires_at);
CREATE TABLE IF NOT EXISTS verification_rate_limit (
  guild_id TEXT NOT NULL, user_id TEXT NOT NULL, last_issued_at INTEGER NOT NULL,
  PRIMARY KEY (guild_id, user_id)
);
CREATE TABLE IF NOT EXISTS community_event (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  starts_at_ms INTEGER NOT NULL,
  timezone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','cancelled','finished')),
  channel_id TEXT,
  message_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_event_guild_start ON community_event(guild_id, starts_at_ms);
CREATE TABLE IF NOT EXISTS event_rsvp (
  event_id INTEGER NOT NULL REFERENCES community_event(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  response TEXT NOT NULL CHECK(response IN ('going','interested')),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id, user_id)
);
CREATE TABLE IF NOT EXISTS event_reminder (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES community_event(id) ON DELETE CASCADE,
  offset_seconds INTEGER NOT NULL,
  due_at_ms INTEGER NOT NULL,
  sent_at_ms INTEGER,
  UNIQUE(event_id, offset_seconds)
);
CREATE TABLE IF NOT EXISTS voice_lobby (
  guild_id TEXT NOT NULL,
  source_channel_id TEXT NOT NULL,
  delete_after_seconds INTEGER NOT NULL DEFAULT 5 CHECK(delete_after_seconds >= 5 AND delete_after_seconds <= 300),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (guild_id, source_channel_id)
);
CREATE TABLE IF NOT EXISTS temporary_voice_room (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  voice_channel_id TEXT NOT NULL UNIQUE,
  room_code TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0,
  locked INTEGER NOT NULL DEFAULT 0,
  delete_after_seconds INTEGER NOT NULL DEFAULT 5 CHECK(delete_after_seconds >= 5 AND delete_after_seconds <= 300),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(guild_id, room_code)
);
CREATE TABLE IF NOT EXISTS voice_room_attempt (
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  attempted_at_ms INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_voice_room_attempt_user ON voice_room_attempt(guild_id,user_id,attempted_at_ms);
CREATE TABLE IF NOT EXISTS birthday_registration (
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
  day INTEGER NOT NULL CHECK(day BETWEEN 1 AND 31),
  registered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (guild_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_birthday_date ON birthday_registration(guild_id,month,day);
CREATE TABLE IF NOT EXISTS birthday_delivery (
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  sent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (guild_id,user_id,year)
);
CREATE TABLE IF NOT EXISTS community_poll (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  title TEXT NOT NULL,
  channel_id TEXT,
  message_id TEXT,
  closed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_poll_guild ON community_poll(guild_id,id);
CREATE TABLE IF NOT EXISTS poll_option (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  poll_id INTEGER NOT NULL REFERENCES community_poll(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  label TEXT NOT NULL,
  UNIQUE(poll_id,position)
);
CREATE TABLE IF NOT EXISTS poll_vote (
  poll_id INTEGER NOT NULL REFERENCES community_poll(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  option_id INTEGER NOT NULL REFERENCES poll_option(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (poll_id,user_id)
);
CREATE TABLE IF NOT EXISTS ticket_config (
  guild_id TEXT PRIMARY KEY,
  support_role_id TEXT NOT NULL,
  category_id TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS support_ticket (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  channel_id TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_one_open_per_owner ON support_ticket(guild_id,owner_id) WHERE status = 'open';
CREATE TABLE IF NOT EXISTS faq_entry (
  guild_id TEXT NOT NULL,
  faq_key TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (guild_id,faq_key)
);
`);

// Backward-compatible column migrations for earlier archives.
const guildColumns = db.prepare('PRAGMA table_info(guild_config)').all() as Array<{ name: string }>;
const existingColumns = new Set(guildColumns.map(column => column.name));
const addGuildColumn = (name: string, definition: string) => {
  if (!existingColumns.has(name)) db.exec(`ALTER TABLE guild_config ADD COLUMN ${name} ${definition}`);
};
addGuildColumn('verification_channel_id', 'TEXT');
addGuildColumn('goodbye_channel_id', 'TEXT');
addGuildColumn('event_channel_id', 'TEXT');
addGuildColumn('birthday_channel_id', 'TEXT');
addGuildColumn('welcome_message', 'TEXT');
addGuildColumn('goodbye_message', 'TEXT');
const roomColumns = db.prepare('PRAGMA table_info(temporary_voice_room)').all() as Array<{ name: string }>;
if (!roomColumns.some(column => column.name === 'delete_after_seconds')) {
  db.exec('ALTER TABLE temporary_voice_room ADD COLUMN delete_after_seconds INTEGER NOT NULL DEFAULT 5');
}

export type GuildConfig = {
  guild_id: string;
  log_channel_id: string | null;
  review_channel_id: string | null;
  welcome_channel_id: string | null;
  verification_channel_id: string | null;
  unverified_role_id: string | null;
  verified_role_id: string | null;
  reviewer_role_id: string | null;
  timezone: string;
  welcome_enabled: number;
  message_content_logging: number;
  goodbye_channel_id: string | null;
  event_channel_id: string | null;
  birthday_channel_id: string | null;
  welcome_message: string | null;
  goodbye_message: string | null;
};

export function getGuildConfig(guildId: string): GuildConfig | undefined {
  return db.prepare('SELECT * FROM guild_config WHERE guild_id = ?').get(guildId) as GuildConfig | undefined;
}

export function ensureGuild(guildId: string) {
  db.prepare('INSERT OR IGNORE INTO guild_config (guild_id) VALUES (?)').run(guildId);
}

export function audit(guildId: string, eventType: string, actorId?: string, subjectId?: string, channelId?: string, details: Record<string, unknown> = {}) {
  db.prepare('INSERT INTO audit_event (guild_id,event_type,actor_id,subject_id,channel_id,details_json) VALUES (?,?,?,?,?,?)')
    .run(guildId, eventType, actorId ?? null, subjectId ?? null, channelId ?? null, JSON.stringify(details));
}
