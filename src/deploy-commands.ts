import { REST, Routes } from 'discord.js';
import { config } from './config.js';
import { commands } from './commands/index.js';

const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);
const body = commands.map(command => command.toJSON());
if (config.DISCORD_TEST_GUILD_ID) {
  await rest.put(Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, config.DISCORD_TEST_GUILD_ID), { body });
  console.log(`Đã đăng ký ${body.length} lệnh cho server thử nghiệm.`);
} else {
  await rest.put(Routes.applicationCommands(config.DISCORD_CLIENT_ID), { body });
  console.log(`Đã đăng ký ${body.length} lệnh toàn cục.`);
}
