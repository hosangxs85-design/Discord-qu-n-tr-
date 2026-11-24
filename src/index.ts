import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { config } from './config.js';
import { registerInteractions } from './events/interactionCreate.js';
import { registerGuildEvents } from './events/guildEvents.js';
import { registerVerification } from './events/verification.js';
import { registerCommunityFeatures } from './events/communityFeatures.js';
import { registerCommunityTools } from './events/communityTools.js';
import { registerVoiceRooms } from './events/voiceRooms.js';
import './health-server.js';
import { log } from './logger.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildVoiceStates],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});
registerInteractions(client);
registerGuildEvents(client);
registerVerification(client);
registerCommunityFeatures(client);
registerCommunityTools(client);
registerVoiceRooms(client);
client.once('ready', ready => log('info', `Bot online as ${ready.user.tag}`, { guilds: ready.guilds.cache.size }));
client.on('error', error => log('error', 'Discord client error', { error: error.message }));
process.on('unhandledRejection', error => log('error', 'Unhandled rejection', { error: String(error) }));

await client.login(config.DISCORD_TOKEN);
