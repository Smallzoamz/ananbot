# templates.py

# An An v4.2 - Pattern Library System with Multi-Language Support
# Logic: Language -> Pattern -> GlobalChannels (No Category) -> Zones (Categories with Mixed Text/Voice)

# ============================================
# PATTERN LIBRARY
# ============================================

# Channel Name Patterns - Use consistent pattern across all channels
# IMPORTANT: Discord converts spaces to hyphens, so we use special Unicode separators
PATTERNS = {
    "classic": {
        "name": "Classic An An",
        "channel": "｜・{emoji}：{name}",
        "category": "{emoji}｜{name}",
        "example_th": "｜・📢：ประกาศ",
        "example_en": "｜・📢：announcements"
    },
    "ribbon": {
        "name": "Ribbon Cute 🎀",
        "channel": "🎀┊{emoji}·{name}",
        "category": "✿{name}✿",
        "example_th": "🎀┊📢·ประกาศ",
        "example_en": "🎀┊📢·announcements"
    },
    "minimal": {
        "name": "Minimal Elegant ✦",
        "channel": "·{emoji}⸝{name}",
        "category": "⊹{name}",
        "example_th": "·📢⸝ประกาศ",
        "example_en": "·📢⸝announcements"
    },
    "star": {
        "name": "Starlight ★",
        "channel": "✦┊{emoji}:{name}",
        "category": "★{name}★",
        "example_th": "✦┊📢:ประกาศ",
        "example_en": "✦┊📢:announcements"
    },
    "heart": {
        "name": "Heart Pastel ♡",
        "channel": "♡·{emoji}─{name}",
        "category": "💕{name}",
        "example_th": "♡·📢─ประกาศ",
        "example_en": "♡·📢─announcements"
    },
    "arrow": {
        "name": "Arrow Modern →",
        "channel": "├→{emoji}{name}",
        "category": "▸{name}",
        "example_th": "├→📢ประกาศ",
        "example_en": "├→📢announcements"
    }
}

# Emoji Theme Collections
EMOJI_THEMES = {
    "kawaii": {
        "name": "Kawaii Cute 🎀",
        "emojis": ["🎀", "🌸", "🍰", "🧸", "💕", "✨", "🌷", "🍓", "🍡", "🎂"],
        # Core channels
        "rules": "📋", "verify": "✅", "welcome": "👋", "announce": "📢",
        "chat": "💬", "voice": "🔊", "support": "🎫", "shop": "🛍️",
        # Social channels
        "show_work": "🎤", "share_photo": "📸", "meme": "😂", "find_friends": "🌸",
        "general": "💬", "food": "🍰", "lifestyle": "🌷",
        # Game channels
        "leaderboard": "🏆", "highlights": "✨", "trade": "🎁",
        # Fan channels
        "stream": "📺", "schedule": "📅", "fc_chat": "💕", "meet_greet": "🌸",
        "giveaway": "🎁", "ideas": "💡", "fan_art": "🎨", "clips": "🎬"
    },
    "elegant": {
        "name": "Minimal Elegant ✦",
        "emojis": ["✦", "◇", "◈", "⊹", "⁺", "⋆", "∘", "•", "─", "│"],
        "rules": "◈", "verify": "✓", "welcome": "⊹", "announce": "◇",
        "chat": "⋆", "voice": "∘", "support": "•", "shop": "◈",
        "show_work": "✦", "share_photo": "◇", "meme": "⁺", "find_friends": "⊹",
        "general": "⋆", "food": "◇", "lifestyle": "⊹",
        "leaderboard": "★", "highlights": "✦", "trade": "◈",
        "stream": "◇", "schedule": "•", "fc_chat": "⊹", "meet_greet": "✦",
        "giveaway": "◈", "ideas": "✦", "fan_art": "◇", "clips": "•"
    },
    "nature": {
        "name": "Nature Pastel 🌿",
        "emojis": ["🌿", "🍃", "🌻", "🌼", "🌺", "☁️", "🌙", "🍂", "🦋", "🌈"],
        "rules": "🍃", "verify": "🌿", "welcome": "🌸", "announce": "🌻",
        "chat": "🦋", "voice": "☁️", "support": "🌼", "shop": "🌺",
        "show_work": "🌻", "share_photo": "📷", "meme": "🌈", "find_friends": "🦋",
        "general": "🍃", "food": "🍂", "lifestyle": "🌸",
        "leaderboard": "🏆", "highlights": "✨", "trade": "🌼",
        "stream": "☁️", "schedule": "🌙", "fc_chat": "🌸", "meet_greet": "🌷",
        "giveaway": "🌻", "ideas": "💡", "fan_art": "🎨", "clips": "🎬"
    },
    "gaming": {
        "name": "Gaming Cool 🎮",
        "emojis": ["🎮", "⚔️", "🔥", "💎", "🏆", "⭐", "🎯", "🚀", "💀", "👑"],
        "rules": "📜", "verify": "🛡️", "welcome": "⚔️", "announce": "📢",
        "chat": "💬", "voice": "🎮", "support": "🎯", "shop": "💎",
        "show_work": "🔥", "share_photo": "📸", "meme": "💀", "find_friends": "👥",
        "general": "💬", "food": "🍕", "lifestyle": "🎮",
        "leaderboard": "🏆", "highlights": "🔥", "trade": "💎",
        "stream": "📺", "schedule": "📅", "fc_chat": "💬", "meet_greet": "⚔️",
        "giveaway": "🎁", "ideas": "💡", "fan_art": "🎨", "clips": "🎬"
    },
    "food": {
        "name": "Food & Sweets 🍮",
        "emojis": ["🍮", "🍡", "🍎", "🍌", "🍊", "🧁", "🍪", "🍩", "☕", "🧋"],
        "rules": "🍮", "verify": "🍡", "welcome": "🍰", "announce": "🧁",
        "chat": "☕", "voice": "🧋", "support": "🍪", "shop": "🍩",
        "show_work": "🧁", "share_photo": "📸", "meme": "🍡", "find_friends": "🍰",
        "general": "☕", "food": "🍮", "lifestyle": "🍓",
        "leaderboard": "🏆", "highlights": "✨", "trade": "🍪",
        "stream": "📺", "schedule": "📅", "fc_chat": "☕", "meet_greet": "🍰",
        "giveaway": "🎁", "ideas": "💡", "fan_art": "🎨", "clips": "🎬"
    }
}

# Role Layout Patterns
ROLE_LAYOUTS = {
    "classic": {
        "name": "Classic Badge",
        "format": "{emoji} {name}",
        "example_th": "👑 เจ้าของ | OWNER",
        "example_en": "👑 Owner"
    },
    "numbered": {
        "name": "Numbered Rank @",
        "format": "@{rank} ⁺ ☆ : {name} ∶ {emoji}",
        "example_th": "@1 ⁺ ☆ : Pudding ∶ 🍮",
        "example_en": "@1 ⁺ ☆ : Owner ∶ 👑"
    },
    "bracket": {
        "name": "Bracket Style 【】",
        "format": "【{emoji}】{name}",
        "example_th": "【👑】เจ้าของ",
        "example_en": "【👑】Owner"
    },
    "heart": {
        "name": "Heart Cute ♡",
        "format": "♡ ⊱ {name} · {emoji}",
        "example_th": "♡ ⊱ เจ้าของ · 👑",
        "example_en": "♡ ⊱ Owner · 👑"
    },
    "arrow": {
        "name": "Arrow Modern →",
        "format": "◦ {name} › {emoji}",
        "example_th": "◦ เจ้าของ › 👑",
        "example_en": "◦ Owner › 👑"
    },
    "symbol": {
        "name": "Symbol Minimal ⫻",
        "format": "{emoji} ⫻ {name}",
        "example_th": "👑 ⫻ เจ้าของ",
        "example_en": "👑 ⫻ Owner"
    }
}

# Multi-Language Translations
TRANSLATIONS = {
    "th": {
        "roles": {
            "owner": "เจ้าของ",
            "admin": "ผู้ดูแล",
            "staff": "พนักงาน",
            "moderator": "ผู้พิทักษ์",
            "vip": "VIP",
            "pro_player": "โปรเพลเยอร์",
            "member": "สมาชิก",
            "customer": "ลูกค้า",
            "creator": "ครีเอเตอร์",
            "manager": "แอดมินจิ๋ว",
            "super_fan": "แฟนตัวยง",
            "fanclub": "ครอบครัว"
        },
        "categories": {
            "shop_info": "ข้อมูลร้านค้า",
            "nitro_service": "NITRO & STATUS SERVICE",
            "boost_service": "BOOSTING SERVICE",
            "customer_service": "บริการลูกค้า",
            "welcome_zone": "ต้อนรับ",
            "social_hub": "พูดคุยสังสรรค์",
            "game_lobby": "ล็อบบี้เกม",
            "competitive": "แข่งขัน",
            "creator_area": "พื้นที่ครีเอเตอร์",
            "fan_zone": "โซนแฟนคลับ",
            "media_hub": "มีเดียฮับ",
            "exclusive_lounge": "ห้องพิเศษ"
        },
        "channels": {
            "rules": "กฎกติกา",
            "verify": "ยืนยันตัวตน",
            "welcome": "ต้อนรับ",
            "announce": "ประกาศ",
            "products": "ประเภทสินค้า",
            "how_to_buy": "วิธีสั่งซื้อ",
            "payment": "ช่องทางชำระเงิน",
            "history": "ประวัติการสั่งซื้อ",
            "reviews": "รีวิวลูกค้า",
            "ticket": "ติดต่อสอบถาม",
            "general_chat": "พูดคุยทั่วไป",
            "problem": "แจ้งปัญหา",
            "live_support": "ห้องซัพพอร์ต",
            "get_roles": "รับยศ",
            "server_info": "ข้อมูลเซิร์ฟเวอร์",
            "show_work": "โชว์ผลงาน",
            "share_photo": "แชร์รูปภาพ",
            "meme": "ห้องมีม",
            "find_friends": "หาเพื่อนเล่น",
            "leaderboard": "จัดอันดับ",
            "highlights": "ไฮไลท์เกม",
            "trade": "แลกเปลี่ยน",
            "stream_notify": "แจ้งสตรีม",
            "schedule": "ตารางงาน",
            "fc_chat": "คุยเล่นกับ FC",
            "meet_greet": "กระทบไหล่",
            "giveaway": "กิจกรรม",
            "ideas": "เสนอไอเดีย",
            "fan_art": "แฟนอาร์ต",
            "clips": "คลิปตัดต่อ",
            "food": "ห้องอาหาร",
            "lifestyle": "ไลฟ์สไตล์",
            "chat": "พูดคุย",
            "support": "ซัพพอร์ต",
            "general": "ทั่วไป",
            "voice": "ห้องเสียง",
            "shop": "ร้านค้า",
            "stream": "สตรีม"
        },
        "messages": {
            "verify_title": "✅ ยืนยันตัวตนเพื่อเข้าสู่เซิร์ฟเวอร์",
            "verify_desc": "ยินดีต้อนรับเข้าสู่ครอบครัวของเราค่ะ! ✨\n\nกรุณากดปุ่มด้านล่างเพื่อยืนยันตัวตนและรับยศเพื่อเข้าถึงคอมมูนิตี้ของเรานะคะ",
            "verify_button": "ยืนยันตัวตน (Verify)",
            "clear_data_success": "✅ ล้างข้อมูลเรียบร้อยแล้วค่ะ!",
            "setup_complete": "🎉 ตั้งค่าเซิร์ฟเวอร์เสร็จสิ้น!",
            "rollback_info": "หากต้องการเอาทุกอย่างกลับคืนมา สามารถพิมพ์ `!rollback` หรือ `/rollback` ได้ที่ห้องนี้นะคะ",
            "rollback_expire": "(เหลือเวลาอีก {time} นาทีค่ะ)",
            "rollback_link": "จัดการต่อได้ที่ ananbot.xyz 🌸✨"
        }
    },
    "en": {
        "roles": {
            "owner": "Owner",
            "admin": "Admin",
            "staff": "Staff",
            "moderator": "Moderator",
            "vip": "VIP",
            "pro_player": "Pro Player",
            "member": "Member",
            "customer": "Customer",
            "creator": "Creator",
            "manager": "Manager",
            "super_fan": "Super Fan",
            "fanclub": "Fan Club"
        },
        "categories": {
            "shop_info": "Shop Information",
            "nitro_service": "Nitro & Status Service",
            "boost_service": "Boosting Service",
            "customer_service": "Customer Service",
            "welcome_zone": "Welcome Zone",
            "social_hub": "Social Hub",
            "game_lobby": "Game Lobby",
            "competitive": "Competitive",
            "creator_area": "Creator Area",
            "fan_zone": "Fan Zone",
            "media_hub": "Media Hub",
            "exclusive_lounge": "Exclusive Lounge"
        },
        "channels": {
            "rules": "Rules",
            "verify": "Verify",
            "welcome": "Welcome",
            "announce": "Announcements",
            "products": "Products",
            "how_to_buy": "How to Buy",
            "payment": "Payment Methods",
            "history": "Order History",
            "reviews": "Reviews",
            "ticket": "Ticket Support",
            "general_chat": "General Chat",
            "problem": "Report Issues",
            "live_support": "Live Support",
            "get_roles": "Get Roles",
            "server_info": "Server Info",
            "show_work": "Show Your Work",
            "share_photo": "Share Photos",
            "meme": "Memes",
            "find_friends": "Find Players",
            "leaderboard": "Leaderboard",
            "highlights": "Game Highlights",
            "trade": "Trading",
            "stream_notify": "Stream Alerts",
            "schedule": "Schedule",
            "fc_chat": "Fan Chat",
            "meet_greet": "Meet & Greet",
            "giveaway": "Giveaways",
            "ideas": "Ideas & Suggestions",
            "fan_art": "Fan Art",
            "clips": "Clips & Edits",
            "food": "Food Room",
            "lifestyle": "Lifestyle",
            "chat": "Chat",
            "support": "Support",
            "general": "General",
            "voice": "Voice",
            "shop": "Shop",
            "stream": "Stream"
        },
        "messages": {
            "verify_title": "✅ Verify to Access the Server",
            "verify_desc": "Welcome to our community! ✨\n\nPlease click the button below to verify and access the server.",
            "verify_button": "Verify",
            "clear_data_success": "✅ Data cleared successfully!",
            "setup_complete": "🎉 Server setup complete!",
            "rollback_info": "If you want to restore everything, type `!rollback` or `/rollback` in this channel.",
            "rollback_expire": "({time} minutes remaining)",
            "rollback_link": "Manage your server at ananbot.xyz 🌸✨"
        }
    }
}

# ============================================
# HELPER FUNCTIONS
# ============================================

def format_channel_name(pattern_id: str, emoji: str, name: str) -> str:
    """Format channel name using selected pattern"""
    pattern = PATTERNS.get(pattern_id, PATTERNS["classic"])
    return pattern["channel"].format(emoji=emoji, name=name)

def format_category_name(pattern_id: str, emoji: str, name: str) -> str:
    """Format category name using selected pattern"""
    pattern = PATTERNS.get(pattern_id, PATTERNS["classic"])
    return pattern["category"].format(emoji=emoji, name=name)

def format_role_name(layout_id: str, emoji: str, name: str, rank: int = None) -> str:
    """Format role name using selected layout"""
    layout = ROLE_LAYOUTS.get(layout_id, ROLE_LAYOUTS["classic"])
    fmt = layout["format"]
    if "{rank}" in fmt and rank is not None:
        return fmt.format(emoji=emoji, name=name, rank=rank)
    return fmt.replace("{rank} ", "").format(emoji=emoji, name=name)

def get_translation(lang: str, category: str, key: str) -> str:
    """Get translated text for given language"""
    translations = TRANSLATIONS.get(lang, TRANSLATIONS["th"])
    return translations.get(category, {}).get(key, key)

def get_emoji_for_channel(theme_id: str, channel_type: str) -> str:
    """Get appropriate emoji for channel type from theme"""
    theme = EMOJI_THEMES.get(theme_id, EMOJI_THEMES["kawaii"])
    return theme.get(channel_type, "📝")

# ============================================
# TEMPLATES (Legacy support - uses default pattern)
# ============================================

TEMPLATES = {
    "Shop": {
        "GlobalChannels": [
            {"name": "｜・📋：กฎกติกา", "type": "text", "permissions": {"everyone": {"view": True, "send": False}}},
            {"name": "｜・✅：verify", "type": "text", "permissions": {"everyone": {"view": True, "send": True}}},
            {"name": "｜・👋：welcome", "type": "text", "permissions": {"everyone": {"view": True, "send": False}}}
        ],
        "Roles": [
            {"name": "👑 店主 | OWNER", "color": 0xFFD700, "hoist": True, "permissions": "admin"},
            {"name": "🛠️ พนักงาน | STAFF", "color": 0x3498DB, "hoist": True, "permissions": "staff"},
            {"name": "💎 ลูกค้า VIP | VIP", "color": 0x9B59B6, "hoist": True, "permissions": "member"},
            {"name": "🛒 ลูกค้าทั่วไป | CUSTOMER", "color": 0x2ECC71, "hoist": True, "permissions": "member"}
        ],
        "Zones": [
            {
                "name": "🛍️ | SHOP INFORMATION",
                "permissions": {"everyone": {"view": False, "send": False}, "admin": {"send": True}},
                "channels": [
                    {"name": "｜・📢：ประกาศจากร้าน", "type": "text"},
                    {"name": "｜・📦：ประเภทสินค้า", "type": "text"},
                    {"name": "｜・📝：วิธีใช้งานและสั่งซื้อ", "type": "text"},
                    {"name": "｜・💳：ช่องทางชำระเงิน", "type": "text"},
                    {"name": "｜・📜：ประวัติการสั่งซื้อ", "type": "text"},
                    {"name": "｜・⭐：รีวิวลูกค้า", "type": "text", "permissions": {"everyone": {"view": False, "send": True}}}
                ]
            },
            {
                "name": "📦 | NITRO & STATUS SERVICE",
                "permissions": {"everyone": {"view": False, "send": False}},
                "channels": [
                    {"name": "｜・🚀：nitro-gaming", "type": "text"},
                    {"name": "｜・💎：nitro-classic", "type": "text"},
                    {"name": "｜・🔮：เช่าสถานะสตรีม", "type": "text"},
                    {"name": "｜・🔊：status-support", "type": "voice"}
                ]
            },
            {
                "name": "💎 | BOOSTING SERVICE",
                "permissions": {"everyone": {"view": False, "send": False}},
                "channels": [
                    {"name": "｜・📈：เม็ดบูสต์-2เม็ด", "type": "text"},
                    {"name": "｜・🔥：เม็ดบูสต์-14เม็ด", "type": "text"},
                    {"name": "｜・🔊：boost-talk", "type": "voice"}
                ]
            },
            {
                "name": "💬 | CUSTOMER SERVICE",
                "permissions": {"everyone": {"view": False, "send": True}},
                "channels": [
                    {"name": "｜・🎫：ticket-support", "type": "text"},
                    {"name": "｜・💬：สอบถามทั่วไป", "type": "text"},
                    {"name": "｜・🛠：แจ้งปัญหา", "type": "text"},
                    {"name": "｜・🔊：live-support", "type": "voice", "permissions": {"everyone": {"view": False, "connect": True}}}
                ]
            }
        ]
    },
    "Community": {
        "GlobalChannels": [
            {"name": "｜・📋：กฎกติกา", "type": "text", "permissions": {"everyone": {"view": True, "send": False}}},
            {"name": "｜・✅：verify", "type": "text", "permissions": {"everyone": {"view": True, "send": True}}},
            {"name": "｜・👋：welcome", "type": "text", "permissions": {"everyone": {"view": True, "send": False}}}
        ],
        "Roles": [
            {"name": "⚔️ ผู้ดูแล | ADMIN", "color": 0xE74C3C, "hoist": True, "permissions": "admin"},
            {"name": "🛡️ ผู้พิทักษ์ | MODERATOR", "color": 0xE67E22, "hoist": True, "permissions": "staff"},
            {"name": "🔥 เกมเมอร์ | PRO PLAYER", "color": 0xF1C40F, "hoist": True, "permissions": "member"},
            {"name": "👥 สมาชิก | MEMBER", "color": 0xA6A6A6, "hoist": True, "permissions": "member"}
        ],
        "Zones": [
            {
                "name": "👋 | WELCOME ZONE",
                "permissions": {"everyone": {"view": False, "send": False}},
                "channels": [
                    {"name": "｜・🎫：รับยศผู้เล่น", "type": "text", "permissions": {"everyone": {"view": True, "send": True}}},
                    {"name": "｜・📌：ข้อมูลเซิร์ฟเวอร์", "type": "text"},
                    {"name": "｜・📢：ประกาศข่าวสาร", "type": "text"},
                    {"name": "｜・🔊：waiting-room", "type": "voice"}
                ]
            },
            {
                "name": "💬 | SOCIAL HUB",
                "permissions": {"everyone": {"view": True, "send": True}},
                "channels": [
                    {"name": "｜・🗨️：แชทพูดคุย", "type": "text"},
                    {"name": "｜・🎨：โชว์ผลงาน", "type": "text"},
                    {"name": "｜・📸：แชร์รูปภาพ", "type": "text"},
                    {"name": "｜・🔊：general-voice", "type": "voice"},
                    {"name": "｜・💩：ห้องมีม", "type": "text"}
                ]
            },
            {
                "name": "🎮 | GAME LOBBY",
                "permissions": {"everyone": {"view": True, "send": True}},
                "channels": [
                    {"name": "｜・🎮：หาเพื่อนเล่น", "type": "text"},
                    {"name": "｜・🏆：จัดอันดับ", "type": "text"},
                    {"name": "｜・🎬：ไฮไลท์เกม", "type": "text"},
                    {"name": "｜・🔊：squad-talk", "type": "voice"},
                    {"name": "｜・🤝：แลกเปลี่ยน", "type": "text"}
                ]
            },
            {
                "name": "🔊 | COMPETITIVE",
                "permissions": {"everyone": {"view": True, "connect": False}, "PRO PLAYER": {"connect": True}},
                "channels": [
                    {"name": "｜・🔥：pro-chat", "type": "text"},
                    {"name": "｜・🔊：rank-match", "type": "voice"},
                    {"name": "｜・🔊：tournament", "type": "voice"},
                    {"name": "｜・🔊：training", "type": "voice"},
                    {"name": "｜・🔊：private", "type": "voice"}
                ]
            }
        ]
    },
    "Fanclub": {
        "GlobalChannels": [
            {"name": "｜・📋：กฎกติกา", "type": "text", "permissions": {"everyone": {"view": True, "send": False}}},
            {"name": "｜・✅：verify", "type": "text", "permissions": {"everyone": {"view": True, "send": True}}},
            {"name": "｜・👋：welcome", "type": "text", "permissions": {"everyone": {"view": True, "send": False}}}
        ],
        "Roles": [
            {"name": "👑 ครีเอเตอร์ | CREATOR", "color": 0xFFFFFF, "hoist": True, "permissions": "admin"},
            {"name": "💎 แอดมินจิ๋ว | MANAGER", "color": 0xFD79A8, "hoist": True, "permissions": "staff"},
            {"name": "🌟 แฟนตัวยง | SUPER FAN", "color": 0x00CEC9, "hoist": True, "permissions": "member"},
            {"name": "❤️ ครอบครัว | FANCLUB", "color": 0xFF7675, "hoist": True, "permissions": "member"}
        ],
        "Zones": [
            {
                "name": "👑 | CREATOR AREA",
                "permissions": {"everyone": {"view": False, "send": False}, "admin": {"send": True}},
                "channels": [
                    {"name": "｜・📺：แจ้งสตรีม", "type": "text"},
                    {"name": "｜・📱：tiktok-reels", "type": "text"},
                    {"name": "｜・🐦：x-twitter", "type": "text"},
                    {"name": "｜・🔊：special-talk", "type": "voice", "permissions": {"everyone": {"view": False, "connect": False}, "staff": {"connect": True}}},
                    {"name": "｜・🗓️：ตารางงาน", "type": "text"}
                ]
            },
            {
                "name": "💖 | FAN ZONE",
                "permissions": {"everyone": {"view": True, "send": True}},
                "channels": [
                    {"name": "｜・🗨️：คุยเล่นกับ-fc", "type": "text"},
                    {"name": "｜・📸：กระทบไหล่", "type": "text"},
                    {"name": "｜・🎁：กิจกรรม-giveaway", "type": "text"},
                    {"name": "｜・🔊：meeting-hall", "type": "voice"},
                    {"name": "｜・💡：เสนอไอเดีย", "type": "text"}
                ]
            },
            {
                "name": "🎬 | MEDIA HUB",
                "permissions": {"everyone": {"view": True, "send": True}},
                "channels": [
                    {"name": "｜・🎨：แฟนอาร์ต", "type": "text"},
                    {"name": "｜・🎬：คลิปตัดต่อ", "type": "text"},
                    {"name": "｜・🔊：music-listening", "type": "voice"},
                    {"name": "｜・🍱：ห้องอาหาร", "type": "text"},
                    {"name": "｜・🎭：ไลฟ์สไตล์", "type": "text"}
                ]
            },
            {
                "name": "🔊 | EXCLUSIVE LOUNGE",
                "permissions": {"everyone": {"view": True, "connect": False}, "SUPER FAN": {"connect": True}},
                "channels": [
                    {"name": "｜・🌟：super-fan-chat", "type": "text"},
                    {"name": "｜・🔊：gaming-with-sub", "type": "voice"},
                    {"name": "｜・🔊：private-chitchat", "type": "voice"},
                    {"name": "｜・🔊：secret-room", "type": "voice", "permissions": {"everyone": {"view": False}, "SUPER FAN": {"view": True}}},
                    {"name": "｜・🔊：radio-fanclub", "type": "voice", "permissions": {"everyone": {"connect": True}}}
                ]
            }
        ]
    },
    "Custom": {
        "GlobalChannels": [
            {"name": "｜・📋：กฎกติกา", "type": "text", "permissions": {"everyone": {"view": True, "send": False}}},
            {"name": "｜・✅：verify", "type": "text", "permissions": {"everyone": {"view": True, "send": True}}},
            {"name": "｜・👋：welcome", "type": "text", "permissions": {"everyone": {"view": True, "send": False}}}
        ],
        "Roles": [],
        "Zones": []
    }
}
