import disnake
import aiohttp
import json
import re

class TranslationManager:
    """
    Handles automatic translation between Thai and English for An An Bot.
    Uses a free/accessible translation API approach.
    """
    def __init__(self, bot):
        self.bot = bot
        self.api_url = "https://translate.googleapis.com/translate_a/single"
        # Channels to monitor for auto-translation
        self.target_channel_keywords = ["en-chat", "international", "global-chat"]

    async def translate(self, text, target_lang):
        """Translate text using Google Translate's free API endpoint."""
        params = {
            "client": "gtx",
            "sl": "auto",
            "tl": target_lang,
            "dt": "t",
            "q": text
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(self.api_url, params=params) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    # Google Translate JSON format for 'single' endpoint: [[["translated", "source", ...], ...]]
                    translated_text = "".join([part[0] for part in data[0] if part[0]])
                    return translated_text
                return None

    def is_thai(self, text):
        """Simple check if text contains Thai characters."""
        return bool(re.search(r'[\u0e00-\u0e7f]', text))

    async def handle_message(self, message):
        """Process messages in target channels for auto-translation."""
        if message.author.bot or not message.content:
            return

        # Check if channel is a target for translation
        is_target = any(kw in message.channel.name.lower() for kw in self.target_channel_keywords)
        if not is_target:
            return

        source_text = message.content
        target_lang = "en" if self.is_thai(source_text) else "th"
        
        # Avoid translating if it's already in the target language (rough check)
        # If it's English and we want Thai, proceed. 
        # If it's Thai and we want English, proceed.
        
        translated = await self.translate(source_text, target_lang)
        
        if translated and translated.strip().lower() != source_text.strip().lower():
            embed = disnake.Embed(
                description=translated,
                color=disnake.Color.from_rgb(255, 182, 193)
            )
            name = "🇺🇸 Translated to English" if target_lang == "en" else "🇹🇭 แปลเป็นไทย"
            embed.set_author(name=name)
            embed.set_footer(text=f"Translated for {message.author.display_name}", icon_url=message.author.display_avatar.url)
            
            await message.reply(embed=embed, mention_author=False)
