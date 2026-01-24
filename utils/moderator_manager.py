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
                try:
                    # Optimized regex for bad words
                    # If the list is huge, regex might crash/hang. Use try-except.
                    pattern = re.compile("|".join(map(re.escape, bad_words)), re.IGNORECASE)
                    if pattern.search(message.content):
                        try:
                            await message.delete()
                            await message.channel.send(f"❌ {message.author.mention} **รบกวนงดใช้คำไม่สุภาพในห้องแชทด้วยนะค๊าาา 🌸**", delete_after=5)
                            await self.log_violation(message.guild, message.author, "Auto-Mod (Bad Word)", message.content)
                            return
                        except: pass
                except Exception as e:
                    # Fallback to simple string searching if regex fails
                    print(f"Regex Compile Error for Bad Words: {e}")
                    content_lower = message.content.lower()
                    for word in bad_words:
                        if word.lower() in content_lower:
                            try:
                                await message.delete()
                                await message.channel.send(f"❌ {message.author.mention} **รบกวนงดใช้คำไม่สุภาพในห้องแชทด้วยนะค๊าาา 🌸** (Fallback Mode)", delete_after=5)
                                await self.log_violation(message.guild, message.author, "Auto-Mod (Bad Word - Fallback)", message.content)
                                return
                            except: pass
                            break
        
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

        # 4. Anti-Spam System
        # We use a separate config key "anti_spam_config" if available, or fallback/merge logic
        # For now, let's assume it might be in the main settings passed via get_guild_settings
        # But get_config currently only returns "moderator_config".
        # Let's fetch the full settings again if we want "anti_spam_config" or just assume it's part of moderator_config for simplicity
        # if the user enabled it in the new dashboard page.
        # WAIT: The plan says "anti_spam_config" is a separate column.
        # So we need to update get_config to fetch IT as well or just fetch it here.
        # To avoid double DB calls, we should probably update get_config to return a merged dict or handle it.
        # For this iteration, I will fetch it via get_guild_settings inside get_config or just fetch here?
        # Better: Update get_config in the future. For now, let's assume `anti_spam_config` is merged into what we get
        # OR just fetch it directly to be safe as `get_config` is cached.

        # Let's verify `get_config` implementation in this file:
        # It gets `moderator_config`.
        # I should probably update `get_config` to ALSO return `anti_spam_config` merged or separate.
        # Let's just update `get_config` to be smarter (fetch all guild settings and cache them) or
        # For this step, I'll stick to logic. I'll modify `get_config` in a separate Block if needed, but let's assume likely
        # the user will save it into `moderator_config` OR we update `get_config` right now.
        
        # Let's update `check_message` to call `self.check_spam`.
        await self.check_spam(message)

    async def check_spam(self, message):
        """
        Advanced Anti-Spam Checks
        - Rate Limit: Messages per X seconds
        - Repeated Text: Same exact content
        - Mentions: Max mentions per message
        """
        # Fetch Anti-Spam Config
        # We need a way to get it efficiently. accessing supabase_client again might be cached if we rely on get_guild_settings caching in supabase_client (it's not cached there).
        # We should use our local cache.
        
        # HACK: Let's assume for now we use the same `self.get_config` but we need to modify it to include `anti_spam_config`.
        # Since I cannot easily modify `get_config` and `check_message` in one `replace_file_content` accurately if they are far apart,
        # I will modify `get_config` in a separate `replace_file_content` if I could, but `check_message` calls `get_config`.
        
        # Let's just fetch settings directly here for now to ensure we get the fresh `anti_spam_config`.
        # Optimization: We should update `get_config` later to return `anti_spam_config` too.
        # For now, let's try to get it from `self.config_cache` if I update `get_config` first?
        # Actually, let's just implement the logic assuming `config` passed to `check_message` MIGHT have it, 
        # but `get_config` filters it out.
        
        # Let's fetch it explicitly for now to be safe and robust.
        from utils.supabase_client import get_guild_settings
        
        # Local Caching for Anti-Spam Config (Similar to Moderator Config)
        guild_id = message.guild.id
        now = datetime.datetime.now().timestamp()
        
        # Use a separate cache key or just repurpose
        if not hasattr(self, "spam_config_cache"):
            self.spam_config_cache = {}
            self.spam_config_last_updated = {}
            
        spam_config = {}
        if guild_id in self.spam_config_cache and (now - self.spam_config_last_updated.get(guild_id, 0)) < 60:
            spam_config = self.spam_config_cache[guild_id]
        else:
            settings = await get_guild_settings(guild_id) or {}
            if settings.get("plan_type") != "free":
                spam_config = settings.get("anti_spam_config", {})
            self.spam_config_cache[guild_id] = spam_config
            self.spam_config_last_updated[guild_id] = now

        if not spam_config or not spam_config.get("enabled", False):
            return

        # Initialize Tracking
        if not hasattr(self, "spam_tracking"):
            self.spam_tracking = {} # {guild_id: {user_id: {failed_attempts, history: [(timestamp, content), ...]}}}
            
        if guild_id not in self.spam_tracking: self.spam_tracking[guild_id] = {}
        if message.author.id not in self.spam_tracking[guild_id]:
            self.spam_tracking[guild_id][message.author.id] = {"history": [], "violations": 0}
            
        user_data = self.spam_tracking[guild_id][message.author.id]
        history = user_data["history"]
        
        # Clean old history (older than max window, say 10s)
        history = [h for h in history if now - h[0] < 10]
        user_data["history"] = history
        
        # Add current message
        history.append((now, message.content))
        
        violation_reason = None
        
        # 1. Excessive Mentions
        max_mentions = int(spam_config.get("max_mentions", 5))
        if len(message.mentions) > max_mentions:
            violation_reason = f"Excessive Mentions ({len(message.mentions)} > {max_mentions})"
            
        # 2. Rate Limiting (Messages per X seconds)
        # Config: limit (count), window (seconds)
        if not violation_reason and spam_config.get("rate_limit_enabled", False):
            limit = int(spam_config.get("rate_limit_count", 5))
            window = int(spam_config.get("rate_limit_window", 5))
            
            # Count messages in window
            recent_count = len([h for h in history if now - h[0] < window])
            if recent_count > limit:
                violation_reason = f"Rate Limit ({recent_count} msgs / {window}s)"
                
        # 3. Repeated Text
        if not violation_reason and spam_config.get("repeat_text_enabled", False):
            threshold = int(spam_config.get("repeat_text_count", 3))
            # Count exact matches in history
            dupes = [h for h in history if h[1] == message.content]
            if len(dupes) >= threshold:
                violation_reason = f"Repeated Text ({len(dupes)}x)"

        # Execute Action
        if violation_reason:
            action = spam_config.get("action", "warn") # warn, mute, kick, ban, delete
            await self.take_spam_action(message, action, violation_reason)
            
            # Clear history to prevent infinite loop of punishment for the same burst
            user_data["history"] = []

    async def take_spam_action(self, message, action, reason):
        try:
            # Always delete the spam message
            try: await message.delete()
            except: pass
            
            user = message.author
            guild = message.guild
            
            log_msg = f"🛡️ **Anti-Spam Triggered!**\n👤 {user.mention}\n📝 Reason: {reason}\n⚡ Action: {action.upper()}"
            
            if action == "warn":
                await message.channel.send(f"⚠️ {user.mention} **Stop spamming!** ({reason}) 🌸", delete_after=5)
                
            elif action == "mute":
                # Timeout for 5 minutes
                duration = datetime.timedelta(minutes=5)
                try:
                    await user.timeout(duration=duration, reason="An An Anti-Spam")
                    await message.channel.send(f"🔇 {user.mention} has been muted for 5 mins due to spam. 🌸", delete_after=10)
                except Exception as e:
                    print(f"Failed to timeout: {e}")
                    await message.channel.send(f"⚠️ {user.mention} **Stop spamming!** (Failed to mute)", delete_after=5)

            elif action == "kick":
                try:
                    await user.kick(reason="An An Anti-Spam Triggered")
                    await message.channel.send(f"👋 Kicked {user.name} for spamming.", delete_after=10)
                except:
                    await message.channel.send(f"⚠️ Could not kick {user.mention}.", delete_after=5)
            
            elif action == "ban":
                try:
                    await user.ban(reason="An An Anti-Spam Triggered")
                    await message.channel.send(f"🔨 Banned {user.name} for spamming.", delete_after=10)
                except:
                    await message.channel.send(f"⚠️ Could not ban {user.mention}.", delete_after=5)

            # Log to System
            await self.log_violation(guild, user, f"Anti-Spam: {reason} ({action})", message.content)
            
        except Exception as e:
            print(f"Error in take_spam_action: {e}")

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
