import { PermissionFlagsBits, type GuildMember } from 'discord.js';
import { getGuildConfig } from './db/database.js';

export function canConfigure(member: GuildMember): boolean {
  return member.permissions.has(PermissionFlagsBits.ManageGuild) || member.id === member.guild.ownerId;
}
export function canReview(member: GuildMember): boolean {
  if (member.permissions.has(PermissionFlagsBits.ManageMessages) || member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
  const reviewerRoleId = getGuildConfig(member.guild.id)?.reviewer_role_id;
  return Boolean(reviewerRoleId && member.roles.cache.has(reviewerRoleId));
}
