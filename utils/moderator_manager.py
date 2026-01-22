import disnake
from disnake.ext import commands
import datetime
import re
import asyncio

class ModeratorManager:
    def __init__(self, bot):
        self.bot = bot
        self.invites_pattern = re.compile(r"(discord\.gg/|discord\.com/invite/)")
        # Cache to prevent database spam (Guild ID -> Config)
        self.config_cache = {}
        self.cache_ttl = 60 # 60 seconds
        self.cache_last_updated = {}

    async def get_config(self, guild_id):
        """Fetch config with simple caching to prevent DB overload on every message."""
        now = datetime.datetime.now().timestamp()
        if guild_id in self.config_cache and (now - self.cache_last_updated.get(guild_id, 0)) < self.cache_ttl:
            return self.config_cache[guild_id]

        from utils.supabase_client import get_guild_settings
        settings = await get_guild_settings(guild_id) or {}
        
        # Pro Plan Check: If not Pro, treat as no config enabled
        if settings.get("plan_type") == "free":
            config = {}
        else:
            config = settings.get("moderator_config", {})
        
        self.config_cache[guild_id] = config
        self.cache_last_updated[guild_id] = now
        return config

    async def check_message(self, message):
        """Main entry point for on_message moderation."""
        if not message.guild or message.author.bot:
            return

        # Exempt staff members
        if message.author.guild_permissions.manage_messages:
            return

        config = await self.get_config(message.guild.id)
        if not config:
            return

        # 1. Anti-Invite
        if config.get("anti_invite_enabled", False):
            if self.invites_pattern.search(message.content):
                try:
                    await message.delete()
                    await message.channel.send(f"❌ {message.author.mention} **ไม่อนุญาตให้ส่งลิ้งก์เชิญในเซิร์ฟเวอร์นี้ค่ะ!** 🌸", delete_after=5)
                    await self.log_violation(message.guild, message.author, "Anti-Invite", message.content)
                    return
                except: pass

        # 2. Auto-Mod (Bad Words)
        if config.get("auto_mod_enabled", False):
            bad_words = config.get("bad_words", [])
            if bad_words:
                # Optimized regex for bad words
                pattern = re.compile("|".join(map(re.escape, bad_words)), re.IGNORECASE)
                if pattern.search(message.content):
                    try:
                        await message.delete()
                        await message.channel.send(f"❌ {message.author.mention} **รบกวนงดใช้คำไม่สุภาพในห้องแชทด้วยนะค๊าาา 🌸**", delete_after=5)
                        await self.log_violation(message.guild, message.author, "Auto-Mod (Bad Word)", message.content)
                        return
                    except: pass
        
        # 3. Anti-Link (External)
        if config.get("anti_link_enabled", False):
            # Check for generic http/https links excluding discord app links maybe
            if "http://" in message.content or "https://" in message.content:
                try:
                    await message.delete()
                    await message.channel.send(f"❌ {message.author.mention} **ไม่อนุญาตให้ส่งลิ้งก์ภายนอกนะคะ 🌸**", delete_after=5)
                    await self.log_violation(message.guild, message.author, "Anti-Link", message.content)
                    return
                except: pass

    async def log_violation(self, guild, member, reason, content=None):
        """Log a moderation violation to the audit channel."""
        embed = disnake.Embed(
            title="🛡️ Moderation Violation",
            description=f"**User:** {member.mention} ({member.id})\n**Reason:** {reason}",
            color=disnake.Color.orange(),
            timestamp=datetime.datetime.now()
        )
        if content:
            embed.add_field(name="Offending Content", value=content[:1024], inline=False)
        
        # 1. Local Guild Log (If enabled)
        await self.send_to_log(guild, embed)
        
        # 2. Central Log Center (Always for Papa)
        try:
            if hasattr(self.bot, "send_anan_log"):
                # Use a separate embed for central to avoid footer conflicts
                central_embed = disnake.Embed(
                    title=f"🛡️ Network Violation: {reason}",
                    description=f"**User:** {member.mention} ({member.id})\n**Server:** {guild.name}",
                    color=disnake.Color.dark_orange(),
                    timestamp=datetime.datetime.now()
                )
                if content:
                    central_embed.add_field(name="Content", value=content[:1024], inline=False)
                
                await self.bot.send_anan_log(guild, "security", central_embed)
        except Exception as e:
            print(f"Error sending central violation log: {e}")

    async def send_to_log(self, guild, embed):
        """Utility to send embeds to the configured log channel."""
        config = await self.get_config(guild.id)
        log_ch_id = config.get("log_channel_id")
        if log_ch_id:
            channel = guild.get_channel(int(log_ch_id))
            if channel:
                try:
                    await channel.send(embed=embed)
                except: pass

    # --- Event Listeners ---

    async def on_message_delete(self, message):
        if not message.guild or message.author.bot: return
        
        config = await self.get_config(message.guild.id)
        if not config.get("audit_logs_enabled", False): return

        embed = disnake.Embed(
            title="🗑️ Message Deleted",
            description=f"**Author:** {message.author.mention} ({message.author.id})\n**Channel:** {message.channel.mention}",
            color=disnake.Color.red(),
            timestamp=datetime.datetime.now()
        )
        if message.content:
            embed.add_field(name="Content", value=message.content[:1024], inline=False)
        
        # Attachment checking (Pro Feature hint)
        if message.attachments:
            files_info = "\n".join([f"[{a.filename}]({a.url})" for a in message.attachments])
            embed.add_field(name="Attachments", value=files_info, inline=False)

        await self.send_to_log(message.guild, embed)

    async def on_message_edit(self, before, after):
        if not before.guild or before.author.bot or before.content == after.content: return
        
        config = await self.get_config(before.guild.id)
        if not config.get("audit_logs_enabled", False): return

        embed = disnake.Embed(
            title="📝 Message Edited",
            description=f"**Author:** {before.author.mention} ({before.author.id})\n**Channel:** {before.channel.mention}",
            color=disnake.Color.blue(),
            timestamp=datetime.datetime.now()
        )
        embed.add_field(name="Before", value=before.content[:1024] or "*Empty/Sticker*", inline=False)
        embed.add_field(name="After", value=after.content[:1024] or "*Empty/Sticker*", inline=False)
        
        await self.send_to_log(before.guild, embed)

    async def on_member_join(self, member):
        config = await self.get_config(member.guild.id)
        if not config.get("audit_logs_enabled", False): return

        embed = disnake.Embed(
            title="📥 Member Joined",
            description=f"**User:** {member.mention}\n**ID:** {member.id}\n**Account Created:** {member.created_at.strftime('%Y-%m-%d %H:%M:%S')}",
            color=disnake.Color.green(),
            timestamp=datetime.datetime.now()
        )
        embed.set_thumbnail(url=member.display_avatar.url)
        
        # Account Age Warning
        account_age = (datetime.datetime.now(datetime.timezone.utc) - member.created_at).days
        if account_age < 7:
            embed.add_field(name="⚠️ Warning", value=f"New account detected! (Age: {account_age} days)", inline=False)
            embed.color = disnake.Color.yellow()

        await self.send_to_log(member.guild, embed)

    async def on_member_remove(self, member):
        config = await self.get_config(member.guild.id)
        if not config.get("audit_logs_enabled", False): return

        embed = disnake.Embed(
            title="📤 Member Left",
            description=f"**User:** {member.name}#{member.discriminator} ({member.mention})\n**ID:** {member.id}",
            color=disnake.Color.light_grey(),
            timestamp=datetime.datetime.now()
        )
        embed.set_thumbnail(url=member.display_avatar.url)
        await self.send_to_log(member.guild, embed)
