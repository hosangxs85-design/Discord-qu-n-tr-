import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().min(1),
  DISCORD_TEST_GUILD_ID: z.string().optional(),
  DATABASE_PATH: z.string().default('./data/bot.sqlite'),
  REGISTER_COMMANDS_ON_START: z.enum(['true', 'false']).default('false'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

export const config = schema.parse(process.env);
