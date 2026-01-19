# templates.py

# An An v4.1 - Aesthetic Templates with Permissions & Universal Channels
# Logic: GlobalChannels (No Category) -> Zones (Categories with Mixed Text/Voice)

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
