import disnake
from disnake.ext import tasks, commands
import aiohttp
import asyncio
import datetime
import os

class SocialManager:
    """
    Modular Social Alerts Manager for An An Bot.
    Handles Live Stream detection for Twitch and YouTube.
    """
    def __init__(self, bot):
        self.bot = bot
        self.session = None
        self.last_status = {} # {guild_id: {platform: {channel_id: is_live}}}
        self.social_loop.start()

    def cog_unload(self):
        self.social_loop.cancel()

    async def get_session(self):
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession()
        return self.session

    @tasks.loop(minutes=2)
    async def social_loop(self):
        await self.bot.wait_until_ready()
        
        # Check all guilds the bot is in
        for guild in self.bot.guilds:
            try:
                # 1. Fetch settings from Supabase (via bot's helper)
                from utils.supabase_client import get_guild_settings
                settings = await get_guild_settings(str(guild.id))
                if not settings or 'social_config' not in settings:
                    continue
                
                social_config = settings.get('social_config', {})
                
                # Check Twitch
                twitch_config = social_config.get('twitch', {})
                if twitch_config.get('enabled'):
                    for alert in twitch_config.get('alerts', []):
                        await self.check_twitch(guild, alert)
                
                # Check YouTube
                yt_config = social_config.get('youtube', {})
                if yt_config.get('enabled'):
                    for alert in yt_config.get('alerts', []):
                        await self.check_youtube(guild, alert)
            except Exception as e:
                print(f"[Social] Loop Error for {guild.name}: {e}")

    async def check_twitch(self, guild, alert):
        channel_name = alert.get('channel_id') # For twitch it's username
        target_ch_id = alert.get('target_discord_ch')
        
        if not channel_name or not target_ch_id: return

        # Identify unique key
        key = f"{guild.id}_twitch_{channel_name}"
        was_live = self.last_status.get(key, False)

        # Logic for Twitch LIVE check (Requires Client ID/Secret)
        # For now, let's implement a placeholder that Papa can fill with his API keys
        # We will use the Twitch Helix API
        
        # Placeholder for actual API call
        is_live = False 
        stream_data = None
        
        # If we had keys:
        # res = await self.call_twitch_api(channel_name)
        # is_live = res['is_live']
        
        # Simulation Logic for now (so Papa can see it works if we force it)
        # if is_live and not was_live:
        #    await self.trigger_alert(guild, target_ch_id, platform='Twitch', name=channel_name, data=stream_data)
        
        self.last_status[key] = is_live

    async def check_youtube(self, guild, alert):
        channel_id = alert.get('channel_id') # YouTube Channel ID
        target_ch_id = alert.get('target_discord_ch')
        
        if not channel_id or not target_ch_id: return

        key = f"{guild.id}_youtube_{channel_id}"
        was_live = self.last_status.get(key, False)
        
        # Placeholder for YouTube Live Logic
        is_live = False
        
        self.last_status[key] = is_live

    async def trigger_alert(self, guild, channel_id, platform, name, data):
        channel = guild.get_channel(int(channel_id))
        if not channel: return

        embed = disnake.Embed(
            title=f"🌸 {name} is LIVE on {platform}!",
            description=data.get('title', 'มาดูสตรีมกันเถอะค๊าาา! ✨'),
            url=data.get('url'),
            color=disnake.Color.purple() if platform == 'Twitch' else disnake.Color.red()
        )
        if data.get('thumbnail'):
            embed.set_image(url=data.get('thumbnail'))
        
        embed.add_field(name="Game / Category", value=data.get('game', 'Just Chatting'), inline=True)
        embed.set_footer(text="An An Social Alerts 🎀", icon_url=self.bot.user.display_avatar.url)
        embed.timestamp = datetime.datetime.now()

        message = data.get('custom_message', f"@everyone ✨ **{name}** is live now! 🌸")
        await channel.send(content=message, embed=embed)

    # Note: Papa will need to provide:
    # TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET
    # YOUTUBE_API_KEY
