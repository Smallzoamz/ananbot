import disnake
from disnake.ext import commands, tasks
from utils.templates import TEMPLATES
import os
import json
import asyncio
from aiohttp import web
from dotenv import load_dotenv
from utils.supabase_client import (
    update_mission_progress, 
    get_user_missions, 
    get_user_stats,
    get_user_plan,
    claim_mission_reward,
    save_rollback_data,
    get_rollback_data,
    get_guild_settings,
    save_guild_settings
)

load_dotenv() # Load variables from .env

# An An Bot v4.1 - Hybrid Precision
# Developed by Antigravity for You

import datetime

# Global memory for rollback (Guild ID -> {timestamp, channels_data, roles_data})
ROLLBACK_MEMORY = {}

# Core Logic for Guild Setup
def get_game_genre(game_name):
    name = game_name.lower()
    # FPS keywords
    if any(k in name for k in ["valorant", "csgo", "cs2", "pubg", "apex", "overwatch", "fps", "warzone", "pointblank"]):
        return "FPS"
    # FiveM keywords
    if "fivem" in name or "gta" in name:
        return "FIVEM"
    # Strategy keywords
    if any(k in name for k in ["rov", "mlbb", "dota", "lol", "league", "wildrift", "strategy", "moba", "aov"]):
        return "STRATEGY"
    return "RPG/COMMUNITY"

async def perform_guild_setup(guild, template_name, extra_data=None, user_id=None):
    template_data = TEMPLATES.get(template_name)
    if not template_data: return
    
    # Mission: Setup Template (Use triggering user)
    if user_id:
        await update_mission_progress(str(user_id), "setup_template", 1)
    
    extra_data = extra_data or {}
    
    # helper for permissions
    def get_role_perms(p_type):
        perms = disnake.Permissions.none()
        if p_type == "admin": return disnake.Permissions.all()
        elif p_type == "staff":
            perms.update(manage_channels=True, manage_messages=True, mute_members=True, 
                         deafen_members=True, move_members=True, manage_nicknames=True,
                         view_channel=True, send_messages=True, connect=True, speak=True,
                         read_message_history=True, attach_files=True, embed_links=True,
                         use_external_emojis=True, add_reactions=True)
        elif p_type == "member":
            perms.update(view_channel=True, send_messages=True, connect=True, speak=True,
                         read_message_history=True, attach_files=True, embed_links=True,
                         use_external_emojis=True, add_reactions=True)
        return perms

    # layout helper for premium look (No hyphens)
    def format_name(emoji, name, is_voice=False):
        if is_voice:
            return f"｜・{emoji}：{name.upper()}"
        return f"｜・{emoji}：{name.lower()}"

    def get_all_discord_permissions_info():
        # List of important permissions with Thai descriptions
        perms_list = [
            ("administrator", "ผู้ดูแลระบบ (สิทธิสูงสุด)"),
            ("manage_guild", "จัดการเซิร์ฟเวอร์"),
            ("manage_roles", "จัดการยศ"),
            ("manage_channels", "จัดการช่อง"),
            ("kick_members", "เตะสมาชิก"),
            ("ban_members", "แบนสมาชิก"),
            ("create_instant_invite", "สร้างคำเชิญ"),
            ("change_nickname", "เปลี่ยนชื่อเล่นตัวเอง"),
            ("manage_nicknames", "จัดการชื่อเล่นผู้อื่น"),
            ("manage_emojis", "จัดการอีโมจิ"),
            ("manage_webhooks", "จัดการเว็บฮุค"),
            ("view_audit_log", "ดูบันทึกการตรวจสอบ"),
            ("view_channel", "ดูช่องข้อมูล"),
            ("send_messages", "ส่งข้อความ"),
            ("embed_links", "ฝังลิงก์"),
            ("attach_files", "แนบไฟล์"),
            ("read_message_history", "ดูประวัติข้อความ"),
            ("mention_everyone", "พูดคุยถึงทุกคน (@everyone)"),
            ("use_external_emojis", "ใช้อีโมจินอกเซิร์ฟเวอร์"),
            ("add_reactions", "เพิ่มปฏิกิริยา"),
            ("connect", "เชื่อมต่อห้องเสียง"),
            ("speak", "พูดในห้องเสียง"),
            ("stream", "วิดีโอ/สตรีมหน้าจอ"),
            ("use_voice_activation", "ใช้การตรวจจับเสียง"),
            ("priority_speaker", "ผู้พูดคนสำคัญ"),
            ("mute_members", "ปิดเสียงสมาชิก"),
            ("deafen_members", "ปิดหูสมาชิก"),
            ("move_members", "ย้ายสมาชิก"),
            ("manage_messages", "จัดการข้อความ (ลบ/ปักหมุด)"),
        ]
        return perms_list

    # 1. Create Roles
    roles_map = {}
    role_levels = {} # role_obj -> level
    main_roles = template_data["Roles"]
    
    # Dynamic Roles based on extra_data
    dynamic_roles = []
    if template_name == "Community" and "games" in extra_data:
        for game in extra_data["games"]:
            dynamic_roles.append({"name": f"🎮 {game.strip().upper()} PLAYER", "color": 0x3498DB, "hoist": True, "permissions": "member"})
    elif template_name == "Fanclub" and "platforms" in extra_data:
        for plat in extra_data["platforms"]:
            dynamic_roles.append({"name": f"✨ {plat.strip().upper()} STREAMER", "color": 0xFD79A8, "hoist": True, "permissions": "member"})
    elif template_name == "Custom" and "custom_roles" in extra_data:
        for crole in extra_data["custom_roles"]:
            color_val = crole.get("color", "FFFFFF")
            if isinstance(color_val, str):
                color_val = color_val.lstrip("#")
                color_val = int(color_val, 16)
            
            level = crole.get("permissions", "member")
            
            # Check for bitmask from Dashboard
            bitmask = crole.get("permissions_bitmask")
            
            # --- Role Design Layer ---
            # Automatically assign emoji based on permission level
            role_emoji = "👥"
            if level == "admin": role_emoji = "👑"
            elif level == "staff": role_emoji = "🛡️"
            
            raw_name = crole["name"].strip().upper()
            # Apply design format if not already present
            role_name = f"｜・{role_emoji}：{raw_name}" if "｜・" not in raw_name else raw_name
            
            dynamic_roles.append({
                "name": role_name,
                "color": color_val,
                "hoist": True,
                "permissions": level,
                "bitmask": bitmask
            })

    all_roles_to_create = main_roles + dynamic_roles
    
    for role_info in reversed(all_roles_to_create):
        # Use bitmask if provided, otherwise fallback to level-based perms
        if role_info.get("bitmask") is not None:
            role_perms = disnake.Permissions(int(role_info["bitmask"]))
        else:
            role_perms = get_role_perms(role_info.get("permissions", "member"))

        role = await guild.create_role(
            name=role_info["name"],
            color=disnake.Color(role_info["color"]),
            hoist=role_info["hoist"],
            permissions=role_perms,
            reason=f"An An Bot: Setup"
        )
        roles_map[role_info["name"]] = role
        role_levels[role] = role_info.get("permissions", "member")

    # Explicitly fix order (Top to Bottom)
    new_positions = {roles_map[r["name"]]: len(all_roles_to_create) - i for i, r in enumerate(all_roles_to_create)}
    try: await guild.edit_role_positions(positions=new_positions)
    except: pass

    # Helper for robust role matching (An An Role Design Layer aware)
    def find_role_smart(name):
        # 1. Direct match
        if name in roles_map: return roles_map[name]
        # 2. Case-insensitive & Emoji-aware match
        name_clean = name.strip().upper()
        for r_name, r_obj in roles_map.items():
            r_name_clean = r_name.strip().upper()
            if name_clean == r_name_clean: return r_obj
            if name_clean in r_name_clean: return r_obj # Partial match (for 'Admin' matching '👑：ADMIN')
        return None

    # Help apply overwrites
    async def apply_setup_overwrites(target, perm_data):
        overwrites = {}
        target_name_lower = target.name.lower()
        
        # Security: Enforce Visibility (Only Rules, Verify, Welcome are visible to @everyone)
        starter_keywords = ["กฎกติกา", "verify", "welcome"]
        is_starter = any(k in target_name_lower for k in starter_keywords)
        
        # 1. Start with Default Role (@everyone)
        everyone_overwrite = disnake.PermissionOverwrite()
        
        is_category = target.type == disnake.ChannelType.category
        has_category = hasattr(target, "category") and target.category is not None
        is_global_room = not is_category and not has_category
        
        # Keywords for Intelligent Mapping
        readonly_keywords = ["ประกาศ", "news", "info", "แจ้ง", "rules", "วิธี", "ประวัติ", "ประเภท", "สินค้า", "ticket", "payment"]
        staff_keywords = ["staff", "พนักงาน", "🛠"]
        admin_keywords = ["admin", "แอดมิน", "👑"]
        
        is_readonly_room = any(k in target_name_lower for k in readonly_keywords)
        
        if is_global_room:
            # Global channels MUST have explicit visibility for everyone
            everyone_overwrite.view_channel = is_starter
        elif is_category:
            # Categories: Usually private except for starter categories
            if "everyone" in perm_data and "view" in perm_data["everyone"]:
                everyone_overwrite.view_channel = perm_data["everyone"]["view"]
            elif is_readonly_room:
                # Papa's Request: Hide from @everyone
                everyone_overwrite.view_channel = False
            else:
                everyone_overwrite.view_channel = is_starter
        else:
            # Channels in category: INHERIT by default
            if "everyone" in perm_data and "view" in perm_data["everyone"]:
                everyone_overwrite.view_channel = perm_data["everyone"]["view"]
            elif is_readonly_room:
                # Force hide from @everyone if it's a readonly type (even if category is public)
                everyone_overwrite.view_channel = False
            else:
                everyone_overwrite.view_channel = None # Inherit from Category
        
        # Apply other template values for everyone if present
        if "everyone" in perm_data:
            p = perm_data["everyone"]
            if "send" in p: everyone_overwrite.send_messages = p["send"]
            if "connect" in p: everyone_overwrite.connect = p["connect"]
            
        overwrites[guild.default_role] = everyone_overwrite

        # 2. Intelligent Defaults for Managed Roles
        # We process all roles by default to ensure they appear in the UI list
        # Keywords for specific logic
        readonly_keywords = ["ประกาศ", "news", "info", "แจ้ง", "rules", "วิธี", "ประวัติ", "ประเภท", "สินค้า", "ticket", "payment"]
        staff_keywords = ["staff", "พนักงาน", "🛠"]
        admin_keywords = ["admin", "แอดมิน", "👑"]
        
        for role_obj, level in role_levels.items():
            if not is_starter:
                overwrite = disnake.PermissionOverwrite()
                
                is_admin_room = any(k in target_name_lower for k in admin_keywords)
                is_staff_room = any(k in target_name_lower for k in staff_keywords)
                is_managed_room = is_admin_room or is_staff_room
                
                # Visibility Check
                can_view = True
                
                # Papa's Request: ทุกยศสามารถมองเห็นได้ยกเว้น @everyone
                # So if it's a readonly room, we keep can_view=True
                if not is_readonly_room:
                    if is_admin_room and level != "admin": can_view = False
                    if is_staff_room and level not in ["admin", "staff"]: can_view = False
                
                # Inheritance logic
                if is_category:
                    # ALWAYS set explicit visibility on Categories so roles show in the list
                    overwrite.view_channel = can_view
                elif has_category and can_view and not is_managed_room:
                    # For channels in category, INHERIT to follow Papa's category settings
                    overwrite.view_channel = None 
                else:
                    overwrite.view_channel = can_view
                
                if can_view or (overwrite.view_channel is None):
                    # Determine if we should set granular perms
                    # If it's a channel inheriting view, we should probably also inherit other standard perms
                    # unless it's a special room (readonly/voice)
                    
                    should_set_granular = True
                    if has_category and not is_managed_room and not is_readonly_room:
                        # Inherit send/connect by default for standard rooms in category
                        should_set_granular = False
                        
                    if should_set_granular or is_category:
                        # Custom Granular Logic for Management
                        if level in ["admin", "staff"]:
                            overwrite.manage_messages = True
                            overwrite.mute_members = True
                            overwrite.move_members = True
                            if level == "admin":
                                overwrite.manage_channels = True
                                overwrite.manage_permissions = True
                        
                        # Identify if it's a voice channel
                        if hasattr(target, "bitrate") or (target.type == disnake.ChannelType.voice):
                            overwrite.connect = True
                            overwrite.speak = True
                        else:
                            if is_readonly_room and level != "admin":
                                overwrite.send_messages = False
                            else:
                                overwrite.send_messages = True
                else:
                    # If can't view and it's in a category, just inherit unless it's a managed room
                    if has_category and not is_managed_room:
                        overwrite.view_channel = None
                
                overwrites[role_obj] = overwrite

        # 3. Apply Explicit Custom Roles from Template (Overrides defaults)
        for role_key, perms in perm_data.items():
            if role_key == "everyone": continue
            
            # Find role by partial name in roles_map
            role_obj = next((r for name, r in roles_map.items() if role_key in name), None)
            
            if role_obj:
                overwrite = overwrites.get(role_obj, disnake.PermissionOverwrite())
                if "view" in perms: overwrite.view_channel = perms["view"]
                if "send" in perms: overwrite.send_messages = perms["send"]
                if "connect" in perms: overwrite.connect = perms["connect"]
                overwrites[role_obj] = overwrite
                
        if overwrites: await target.edit(overwrites=overwrites)

    # 2. Global Channels
    for ch in template_data.get("GlobalChannels", []):
        new_ch = await (guild.create_text_channel(name=ch["name"]) if ch["type"] == "text" else guild.create_voice_channel(name=ch["name"]))
        # Always call apply_setup_overwrites to enforce everyone restriction
        await apply_setup_overwrites(new_ch, ch.get("permissions", {}))

    # 3. Zones & Channels
    for zone in template_data["Zones"]:
        # Skip specific zones based on Shop options
        if template_name == "Shop" and "options" in extra_data:
            if "เม็ด Boost" not in extra_data["options"] and "BOOST" in zone["name"]: continue
            if "Stream Status" not in extra_data["options"] and "STATUS" in zone["name"]: continue
            
        category = await guild.create_category(name=zone["name"])
        # Always call apply_setup_overwrites to enforce everyone restriction
        await apply_setup_overwrites(category, zone.get("permissions", {}))
        
        for ch in zone["channels"]:
            new_ch = await (guild.create_text_channel(name=ch["name"], category=category) if ch["type"] == "text" else guild.create_voice_channel(name=ch["name"], category=category))
            # If standard channel has no explicit perms, SYNC with category!
            # (Allows inheriting the visibility set on category)
            perms = ch.get("permissions", {})
            
            # Auto-Sync logic for Standard Templates:
            # Sync if: No explicit permissions AND not a special room keyword
            special_keywords = ["กฎกติกา", "verify", "welcome", "news", "info", "แจ้ง", "admin", "staff"]
            is_special = any(k in ch["name"].lower() for k in special_keywords)
            
            if not perms and not is_special:
                try: await new_ch.edit(sync_permissions=True)
                except: pass
            else:
                await apply_setup_overwrites(new_ch, perms)

    # 4. Custom Zones (For Custom Template)
    if template_name == "Custom" and "custom_zones" in extra_data:
        for zone in extra_data["custom_zones"]:
            category = await guild.create_category(name=zone["name"])
            
            # Handle explicit RBAC for Category
            if "allowedRoles" in zone:
                await category.set_permissions(guild.default_role, view_channel=False)
                for rname in zone["allowedRoles"]:
                    role_obj = find_role_smart(rname)
                    if role_obj:
                        await category.set_permissions(role_obj, view_channel=True, connect=True, speak=True, send_messages=True)
            else:
                await apply_setup_overwrites(category, zone.get("permissions", {}))
            
            for ch in zone["channels"]:
                ch_name = ch["name"]
                if "｜・" not in ch_name:
                    ch_emoji = ch.get("emoji", "💬" if ch["type"] == "text" else "🔊")
                    ch_name = format_name(ch_emoji, ch_name, is_voice=(ch["type"]=="voice"))
                
                new_ch = await (guild.create_text_channel(name=ch_name, category=category) if ch["type"] == "text" else guild.create_voice_channel(name=ch_name, category=category))
                
                # Handle explicit RBAC for Channel
                if "allowedRoles" in ch:
                    await new_ch.set_permissions(guild.default_role, view_channel=False)
                    for rname in ch["allowedRoles"]:
                        role_obj = find_role_smart(rname)
                        if role_obj:
                            await new_ch.set_permissions(role_obj, view_channel=True, connect=True, speak=True, send_messages=True)
                elif "allowedRoles" in zone:
                    # If category has allowedRoles but channel doesn't, SYNC with category!
                    try: 
                        await new_ch.edit(sync_permissions=True)
                    except Exception as e:
                        print(f"Non-critical: Sync permissions failed for {new_ch.name}: {e}")
                else:
                    await apply_setup_overwrites(new_ch, ch.get("permissions", {}))

    # Dynamic Channels
    if template_name == "Community" and "games" in extra_data:
        for game in extra_data["games"]:
            g_name = game.strip().upper()
            
            # Create a dedicated category for the game
            cat = await guild.create_category(name=f"🎮 ⎯  {g_name} SPACE")
            
            # Specific Role for this game
            game_role = roles_map.get(f"🎮 {g_name} PLAYER")
            
            # helper for game-specific channels
            async def create_game_ch(name, emoji, type="text", is_private=True):
                ch_name = format_name(emoji, name, is_voice=(type=="voice"))
                if type == "text":
                    ch = await guild.create_text_channel(name=ch_name, category=cat)
                else:
                    ch = await guild.create_voice_channel(name=ch_name, category=cat)
                
                if is_private and game_role:
                    await ch.set_permissions(guild.default_role, view_channel=False)
                    await ch.set_permissions(game_role, view_channel=True, send_messages=True, connect=True)
                return ch

            # 4 Text Channels (Upgraded Emojis & Thai Naming)
            await create_game_ch("ข้อมูล", "📣")
            await create_game_ch("พูดคุย", "💬")
            await create_game_ch("ไฮไลท์", "🎞️")
            await create_game_ch("หาเพื่อน", "🧩")
            
            # Dynamic Voice Channels based on Genre
            genre = get_game_genre(game)
            vc_names = ["LOBBY ⎯ นั่งเล่น", "นั่งเล่น [2]", "นั่งเล่น [3]"]
            if genre == "FPS":
                vc_names = ["LOBBY ⎯ นั่งเล่น", "TEAM A", "TEAM B"]
            elif genre == "FIVEM":
                vc_names = ["LOBBY ⎯ นั่งเล่น", "GANG A", "GANG B"]
            elif genre == "STRATEGY":
                vc_names = ["LOBBY ⎯ นั่งเล่น", "TEAM RED", "TEAM BLUE"]
            
            for i, vname in enumerate(vc_names):
                emoji = "🛋️" if i == 0 else "🔊"
                await create_game_ch(vname, emoji, type="voice")

    elif template_name == "Fanclub" and "platforms" in extra_data:
        for plat in extra_data["platforms"]:
            p_name = plat.strip().upper()
            cat = await guild.create_category(name=f"📺 ⎯  {p_name} HUB")
            
            # Permission for streamer role
            plat_role = roles_map.get(f"✨ {p_name} STREAMER")
            
            await guild.create_text_channel(name=format_name("📣", f"notice-{plat.lower()}"), category=cat)
            await guild.create_voice_channel(name=format_name("🎬", f"{plat.lower()}-live", is_voice=True), category=cat)
            
            if plat_role:
                await guild.create_text_channel(name=format_name("💎", f"{plat.lower()}-staff"), category=cat, overwrites={
                    guild.default_role: disnake.PermissionOverwrite(view_channel=False),
                    plat_role: disnake.PermissionOverwrite(view_channel=True, send_messages=True)
                })

    # New: Role Assignment Systems
    # ----------------------------
    
    # 4. Final step: Post Verification/Role selection messages
    verify_ch = next((c for c in guild.text_channels if "verify" in c.name), None)
    if verify_ch:
        embed = disnake.Embed(
            title="✅ ยืนยันตัวตนเพื่อเข้าสู่เซิร์ฟเวอร์",
            description=(
                "ยินดีต้อนรับเข้าสู่ครอบครัวของเราค่ะ! ✨\n\n"
                "กรุณากดปุ่มด้านล่างเพื่อยืนยันตัวตนและรับยศเพื่อเข้าถึงคอมมูนิตี้ของเรานะคะ\n\n"
                "*(Please click the button below to verify and access the server)*"
            ),
            color=disnake.Color.green()
        )
        # Determine member role name based on template
        member_role_name = ""
        if template_name == "Shop": member_role_name = "🛒 ลูกค้าทั่วไป | CUSTOMER"
        elif template_name == "Community": member_role_name = "👥 สมาชิก | MEMBER"
        elif template_name == "Fanclub": member_role_name = "❤️ ครอบครัว | FANCLUB"
        
        await verify_ch.send(embed=embed, view=VerificationView(member_role_name))


    # If it's a game community, post role selection in "รับยศผู้เล่น"
    if template_name == "Community" and "games" in extra_data:
        game_role_ch = next((c for c in guild.text_channels if "รับยศผู้เล่น" in c.name), None)
        if game_role_ch:
            embed_roles = disnake.Embed(
                title="🎮 เลือกยศเกมที่ คุณ เล่น",
                description="กดปุ่มด้านล่างเพื่อรับยศเกมที่ต้องการ เพื่อเปิดห้องลับเฉพาะสำหรับเกมนั้นๆ ค่ะ! ✨",
                color=disnake.Color.blue()
            )
            await game_role_ch.send(embed=embed_roles, view=GameRoleView(extra_data["games"]))

    # 5. Post Guild Rules
    await post_guild_rules(guild, template_name)

class VerificationView(disnake.ui.View):
    def __init__(self, role_name):
        super().__init__(timeout=None)
        self.role_name = role_name

    @disnake.ui.button(label="ยืนยันตัวตน (Verify)", style=disnake.ButtonStyle.success, emoji="✅", custom_id="verify_button")
    async def verify(self, button: disnake.ui.Button, inter: disnake.MessageInteraction):
        role = disnake.utils.get(inter.guild.roles, name=self.role_name)
        if role:
            if role in inter.author.roles:
                await inter.response.send_message(f"{inter.author.mention} มียศนี้อยู่แล้วนะคะ! 🌸", ephemeral=True)
            else:
                await inter.author.add_roles(role)
                await inter.response.send_message(f"ยินดีด้วยค่ะ! {inter.author.mention} ได้รับยศ **{self.role_name}** เรียบร้อยแล้วค่ะ ✨💖", ephemeral=True)
        else:
            await inter.response.send_message("อุ๊ย! An An หาไม่เจอเลยค่ะว่าต้องให้ยศไหน รบกวนแอดมินตรวจสอบหน่อยนะคะ 🥺", ephemeral=True)

class GameRoleView(disnake.ui.View):
    def __init__(self, games):
        super().__init__(timeout=None)
        for game in games:
            game_name = game.strip().upper()
            button = disnake.ui.Button(
                label=game_name,
                style=disnake.ButtonStyle.secondary,
                emoji="🎮",
                custom_id=f"game_role_{game_name}"
            )
            button.callback = self.make_callback(game_name)
            self.add_item(button)

    def make_callback(self, game_name):
        async def callback(inter: disnake.MessageInteraction):
            role_name = f"🎮 {game_name} PLAYER"
            role = disnake.utils.get(inter.guild.roles, name=role_name)
            if role:
                if role in inter.author.roles:
                    await inter.author.remove_roles(role)
                    await inter.response.send_message(f"ยกเลิกยศ **{role_name}** เรียบร้อยค่ะ 🌸", ephemeral=True)
                else:
                    await inter.author.add_roles(role)
                    await inter.response.send_message(f"รับยศ **{role_name}** เรียบร้อยค่ะ! ลุยเกมกันเลย ✨🎮", ephemeral=True)
            else:
                await inter.response.send_message(f"An An หายศไม่เจอค่ะ 🥺", ephemeral=True)
        return callback

class SetupModal(disnake.ui.Modal):
    def __init__(self, template_name, title, label, placeholder):
        self.template_name = template_name
        components = [
            disnake.ui.TextInput(
                label=label,
                placeholder=placeholder,
                custom_id="input_value",
                style=disnake.TextInputStyle.paragraph,
                max_length=200,
            )
        ]
        super().__init__(title=title, components=components)

    async def callback(self, inter: disnake.ModalInteraction):
        value = inter.text_values["input_value"]
        items = value.split(",")
        await inter.response.send_message(f"รับทราบค่ะ! An An กำลังสร้างระบบสำหรับ {self.template_name} พร้อมข้อมูลที่ {inter.author.mention} ให้มานะคะ... ✨", ephemeral=True)
        
        extra_key = "games" if self.template_name == "Community" else "platforms"
        await perform_guild_setup(inter.guild, self.template_name, {extra_key: items})
        await inter.edit_original_response(content=f"เรียบร้อยแล้วค่ะ {inter.author.mention}! โครงสร้างแบบปรับแต่งเองเสร็จสมบูรณ์แล้วค่ะ! 🌸💖")

class ShopOptionView(disnake.ui.View):
    def __init__(self):
        super().__init__(timeout=60)
        self.options = []

    @disnake.ui.button(label="Nitro + Stream Status + เม็ด Boost", style=disnake.ButtonStyle.premium, emoji="💎")
    async def full_pack(self, button: disnake.ui.Button, inter: disnake.MessageInteraction):
        await inter.response.send_message("เลือกแบบจัดเต็ม! กำลังร่ายมนตร์สร้างร้านให้เลยค่ะ... 🛒✨", ephemeral=True)
        await perform_guild_setup(inter.guild, "Shop", {"options": ["Nitro", "Stream Status", "เม็ด Boost"]})
        await inter.edit_original_response(content=f"ร้านค้าแบบจัดเต็มสร้างเสร็จแล้วค่ะ {inter.author.mention}! 🌸")

    @disnake.ui.button(label="Nitro + Stream Status", style=disnake.ButtonStyle.primary, emoji="🛒")
    async def mid_pack(self, button: disnake.ui.Button, inter: disnake.MessageInteraction):
        await inter.response.send_message("เลือกแบบมาตรฐาน! กำลังจัดการให้นะคะ... 🛠️", ephemeral=True)
        await perform_guild_setup(inter.guild, "Shop", {"options": ["Nitro", "Stream Status"]})
        await inter.edit_original_response(content=f"ร้านค้าแบบมาตรฐานสร้างเสร็จแล้วค่ะ {inter.author.mention}! 🌸")

class CommunityTypeView(disnake.ui.View):
    def __init__(self):
        super().__init__(timeout=60)

    @disnake.ui.button(label="สายแชททั่วไป (Friend)", style=disnake.ButtonStyle.success, emoji="👥")
    async def friend_type(self, button: disnake.ui.Button, inter: disnake.MessageInteraction):
        await inter.response.send_message("สายแชทเน้นมิตรภาพ! กำลังจัดให้เลยค่ะ... 🌸", ephemeral=True)
        await perform_guild_setup(inter.guild, "Community")
        await inter.edit_original_response(content=f"คอมมูนิตี้สายแชทสร้างเสร็จแล้วค่ะ {inter.author.mention}! 💖")

    @disnake.ui.button(label="สายเกมเมอร์ (Game)", style=disnake.ButtonStyle.danger, emoji="🎮")
    async def game_type(self, button: disnake.ui.Button, inter: disnake.MessageInteraction):
        await inter.response.send_modal(SetupModal("Community", "ปรับแต่งห้องเกม", "ระบุชื่อเกม (คั่นด้วยเครื่องหมาย ,)", "เช่น Valorant, Roblox, Minecraft"))

class TemplateView(disnake.ui.View):
    def __init__(self, bot):
        super().__init__(timeout=60)
        self.bot = bot

    @disnake.ui.select(
        placeholder="เลือกประเภท Discord Guild ที่ คุณ ต้องการสร้าง...",
        options=[
            disnake.SelectOption(label="Shop (ร้านค้า)", value="Shop", emoji="🛒", description="สร้างห้องสำหรับขายของแบบเลือกแพ็กเกจ"),
            disnake.SelectOption(label="Community (คอมมูนิตี้)", value="Community", emoji="🎮", description="เน้นพูดคุยหรือระบุเกมที่เล่นได้"),
            disnake.SelectOption(label="Fanclub (แฟนคลับ)", value="Fanclub", emoji="👑", description="ระบุแพลตฟอร์มที่ใช้สตรีมมิ่งได้"),
        ]
    )
    async def select_template(self, select: disnake.ui.Select, interaction: disnake.MessageInteraction):
        choice = select.values[0]
        
        if choice == "Shop":
            await interaction.response.send_message(f"{interaction.author.mention} อยากขายอะไรบ้างคะ? เลือกแพ็กเกจที่ต้องการได้เลยค่ะ ✨", view=ShopOptionView(), ephemeral=True)
        elif choice == "Community":
            await interaction.response.send_message(f"คอมมูนิตี้ของ {interaction.author.mention} เป็นแนวไหนดีคะ? 🎮", view=CommunityTypeView(), ephemeral=True)
        elif choice == "Fanclub":
            await interaction.response.send_modal(SetupModal("Fanclub", "ปรับแต่งช่องสตรีม", "ระบุแพลตฟอร์ม (คั่นด้วยเครื่องหมาย ,)", "เช่น Twitch, YouTube, TikTok"))

class AnAnBot(commands.Bot):
    def __init__(self):
        intents = disnake.Intents.default()
        intents.members = True
        intents.message_content = True
        intents.presences = True # Needed for counting online members
        super().__init__(command_prefix="!", intents=intents, help_command=None)
        self.update_stats_loop.start()
        self.web_server_task = None

    async def start(self, *args, **kwargs):
        # Start web server as a background task
        self.web_server_task = asyncio.create_task(self.run_web_server())
        return await super().start(*args, **kwargs)

    # --- Temporary Room System (Pro Plan) ---
    async def perform_temproom_setup(self, guild, user_id=None):
        # Check for Pro Plan
        user_plan = await get_user_plan(str(guild.owner_id))
        if user_plan["plan_type"] == "free":
            return {"success": False, "error": "This feature is restricted to Pro Plan users."}

        # Check for existing setup
        existing_cat = disnake.utils.get(guild.categories, name="🔊 ⎯  TEMPORARY ZONES")
        if existing_cat:
            return {"success": False, "error": "Temporary Room system is already installed."}

        # Create Category & Hub
        cat = await guild.create_category(name="🔊 ⎯  TEMPORARY ZONES")
        
        # Hub Channel
        hub = await guild.create_voice_channel(name="｜・➕：CREATE ROOM", category=cat)
        
        return {"success": True, "message": f"Temporary Room system installed! Hub: {hub.mention}"}

    # Commands must be registered inside setup or via @bot.command if instance exists, 
    # BUT since we are inside class, we use @commands.command/listener and self

    async def on_voice_state_update(self, member, before, after):
        # 1. Check for Joining Hub
        if after.channel and after.channel.name == "｜・➕：CREATE ROOM":
            # Create Temp Room
            guild = member.guild
            cat = after.channel.category
            
            # Name Format: ｜・🔊：[NAME]
            room_name = f"｜・🔊：{member.display_name.upper()}"
            
            # Permissions: Owner full control, Everyone view/connect/speak
            overwrites = {
                guild.default_role: disnake.PermissionOverwrite(view_channel=True, connect=True, speak=True),
                member: disnake.PermissionOverwrite(manage_channels=True, connect=True, speak=True, mute_members=True, move_members=True)
            }
            
            # Create & Move
            temp_ch = await guild.create_voice_channel(name=room_name, category=cat, overwrites=overwrites)
            try:
                await member.move_to(temp_ch)
            except:
                await temp_ch.delete() # Cleanup if move fails
                
        # 2. Check for Leaving Temp Room (Cleanup)
        if before.channel and before.channel.category and before.channel.category.name == "🔊 ⎯  TEMPORARY ZONES":
            if before.channel.name != "｜・➕：CREATE ROOM":
                # If empty, delete
                if len(before.channel.members) == 0:
                    await before.channel.delete()

    async def run_web_server(self):
        app = web.Application()
        app.router.add_get('/api/stats', self.handle_stats)
        app.router.add_get('/api/guilds', self.handle_guilds)
        app.router.add_get('/api/guild/{guild_id}/stats', self.handle_guild_stats)
        app.router.add_get('/api/discord-permissions', self.handle_discord_permissions)
        app.router.add_get('/api/guild/{guild_id}/structure', self.handle_guild_structure)
        app.router.add_get('/api/guild/{guild_id}/settings', self.handle_guild_settings)
        app.router.add_get('/api/ping', lambda r: web.Response(text="pong"))
        app.router.add_post('/api/action', self.handle_action)
        app.router.add_options('/api/action', self.handle_options)
        app.router.add_options('/api/stats', self.handle_options)
        app.router.add_options('/api/guilds', self.handle_options)
        app.router.add_options('/api/guild/{guild_id}/stats', self.handle_options)
        app.router.add_options('/api/guild/{guild_id}/structure', self.handle_options)
        app.router.add_options('/api/discord-permissions', self.handle_options)
        app.router.add_options('/api/guild/{guild_id}/settings', self.handle_options)
        
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, '0.0.0.0', 5000)
        print("API Bridge running on http://127.0.0.1:5000 (Local Interface)")
        await site.start()



    async def handle_stats(self, request):
        print(f"API Request: GET /api/stats from {request.remote}")
        # Aggregate stats across all guilds
        total_members = sum(guild.member_count for guild in self.guilds)
        total_guilds = len(self.guilds)
        online_members = sum(
            sum(1 for m in guild.members if m.status != disnake.Status.offline)
            for guild in self.guilds
        )
        
        data = {
            "total_members": total_members,
            "total_guilds": total_guilds,
            "online_members": online_members,
            "status": "online",
            "uptime": "99.9%", # Mock for now
            "guilds": [{"id": str(g.id), "name": g.name} for g in self.guilds]
        }
        return web.json_response(data, headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        })

    async def handle_guilds(self, request):
        print(f"API Request: GET /api/guilds from {request.remote}")
        data = []
        for guild in self.guilds:
            data.append({
                "id": str(guild.id),
                "name": guild.name,
                "member_count": guild.member_count,
                "icon": str(guild.icon.url) if guild.icon else None
            })
        return web.json_response(data, headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        })

    async def handle_options(self, request):
        return web.Response(headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        })

    async def handle_discord_permissions(self, request):
        # Dynamically generate permissions info
        perms_list = [
            {"id": p[0], "name": p[1], "value": getattr(disnake.Permissions, p[0]).flag}
            for p in [
                ("administrator", "ผู้ดูแลระบบ (สิทธิสูงสุด)"),
                ("manage_guild", "จัดการเซิร์ฟเวอร์"),
                ("manage_roles", "จัดการยศ"),
                ("manage_channels", "จัดการช่อง"),
                ("kick_members", "เตะสมาชิก"),
                ("ban_members", "แบนสมาชิก"),
                ("view_audit_log", "ดูบันทึกการตรวจสอบ"),
                ("manage_messages", "จัดการข้อความ"),
                ("manage_nicknames", "จัดการชื่อเล่น"),
                ("manage_emojis", "จัดการอีโมจิ"),
                ("view_channel", "ดูช่องข้อมูล"),
                ("send_messages", "ส่งข้อความ"),
                ("embed_links", "ฝังลิงก์"),
                ("attach_files", "แนบไฟล์"),
                ("read_message_history", "ดูประวัติข้อความ"),
                ("mention_everyone", "พูดคุยถึงทุกคน"),
                ("add_reactions", "เพิ่มปฏิกิริยา"),
                ("connect", "เชื่อมต่อห้องเสียง"),
                ("speak", "พูดในห้องเสียง"),
                ("stream", "สตรีมหน้าจอ"),
                ("mute_members", "ปิดเสียงสมาชิก"),
                ("deafen_members", "ปิดหูสมาชิก"),
                ("move_members", "ย้ายสมาชิก"),
            ]
        ]
        return web.json_response(perms_list, headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        })

    async def handle_guild_stats(self, request):
        guild_id = request.match_info.get('guild_id')
        print(f"API Request: GET /api/guild/{guild_id}/stats from {request.remote}")
        
        guild = self.get_guild(int(guild_id))
        if not guild:
            return web.json_response({"error": "Guild not found"}, status=404)
            
        data = {
            "name": guild.name,
            "total_members": guild.member_count,
            "online_members": sum(1 for m in guild.members if m.status != disnake.Status.offline),
            "status": "online",
            "uptime": "99.9%"
        }
        return web.json_response(data, headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        })

    async def handle_guild_structure(self, request):
        guild_id = request.match_info.get('guild_id')
        print(f"API Request: GET /api/guild/{guild_id}/structure from {request.remote}")
        
        guild = self.get_guild(int(guild_id))
        if not guild:
            return web.json_response({"error": "Guild not found"}, status=404, headers={"Access-Control-Allow-Origin": "*"})
            
        structure = []
        # Categories and their channels
        for cat in sorted(guild.categories, key=lambda c: c.position):
            channels = []
            for ch in sorted(cat.channels, key=lambda c: c.position):
                channels.append({
                    "id": str(ch.id),
                    "name": ch.name,
                    "type": str(ch.type)
                })
            structure.append({
                "id": str(cat.id),
                "name": cat.name,
                "type": "category",
                "channels": channels
            })
            
        # Orphan channels (no category)
        orphans = [ch for ch in guild.channels if ch.category is None]
        if orphans:
            structure.append({
                "id": "orphans",
                "name": "UNCATEGORIZED",
                "type": "category",
                "channels": [{"id": str(ch.id), "name": ch.name, "type": str(ch.type)} for ch in sorted(orphans, key=lambda c: c.position)]
            })

        return web.json_response(structure, headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        })

    async def handle_action(self, request):
        print(f"API Request: POST /api/action from {request.remote}")
        try:
            body = await request.json()
            action = body.get("action")
            guild_id = body.get("guild_id")
            user_id = body.get("user_id")
            
            print(f"Web API triggering {action}")
            
            # These actions don't need a guild context
            if action == "get_missions":
                user_id = body.get("user_id")
                if not user_id: return web.json_response({"error": "user_id required"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                missions = await get_user_missions(user_id)
                stats = await get_user_stats(user_id)
                plan = await get_user_plan(user_id)
                
                # Calculate Level (Max 10)
                # XP for Level n: 2500 * n * (n-1)
                xp_balance = stats.get("xp_balance", 0)
                
                def get_level_info(total_xp):
                    if total_xp <= 0: return 1, 0, 5000
                    
                    # Solve 2500 * L * (L-1) <= total_xp
                    # L^2 - L - (total_xp/2500) <= 0
                    import math
                    l_exact = (1 + math.sqrt(1 + total_xp / 625)) / 2
                    level = min(10, math.floor(l_exact))
                    
                    if level >= 10:
                        xp_for_current = 2500 * 10 * 9
                        return 10, total_xp - xp_for_current, 0
                    
                    xp_for_current = 2500 * level * (level - 1)
                    xp_for_next = 2500 * (level + 1) * level
                    current_level_xp = total_xp - xp_for_current
                    xp_needed_for_next = xp_for_next - xp_for_current
                    
                    return level, current_level_xp, xp_needed_for_next

                level, current_xp, next_xp = get_level_info(xp_balance)
                
                # Papa is ALWAYS Level 10 👑
                if str(user_id) == "956866340474478642":
                    level = 10
                    current_xp = 0
                    next_xp = 0

                stats["level"] = level
                stats["current_level_xp"] = current_xp
                stats["xp_needed_for_next"] = next_xp
                
                print(f"Returning {len(missions)} missions for user {user_id} (Level {level})")
                return web.json_response({"missions": missions, "stats": stats, "plan": plan}, headers={"Access-Control-Allow-Origin": "*"})
                
            elif action == "claim_mission":
                user_id = body.get("user_id")
                mission_key = body.get("mission_key")
                if not user_id or not mission_key: return web.json_response({"error": "user_id and mission_key required"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                result = await claim_mission_reward(user_id, mission_key)
                return web.json_response(result, headers={"Access-Control-Allow-Origin": "*"})

            if action == "save_welcome_settings":
                user_id = body.get("user_id")
                if not user_id: return web.json_response({"error": "user_id required"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                
                # Pro Plan Check
                plan = await get_user_plan(user_id)
                if plan.get("plan_type") == "free":
                    return web.json_response({"error": "Pro Plan required for this feature"}, status=403, headers={"Access-Control-Allow-Origin": "*"})

                settings = body.get("settings", {})
                print(f"Saving welcome settings for guild {guild_id}")
                
                # Whitelist filtering for welcome/goodbye settings 🛡️
                welcome_keys = [
                    "welcome_enabled", "welcome_channel_id", "welcome_message", 
                    "welcome_image_url", "goodbye_enabled", "goodbye_channel_id", 
                    "goodbye_message", "goodbye_image_url"
                ]
                filtered_settings = {k: v for k, v in settings.items() if k in welcome_keys}
                
                result = await save_guild_settings(guild_id, filtered_settings)
                return web.json_response(result, headers={"Access-Control-Allow-Origin": "*"})

            # For other actions, guild is required
            try:
                guild = self.get_guild(int(guild_id)) if guild_id else (self.guilds[0] if self.guilds else None)
            except:
                guild = None
                
            if not guild:
                return web.json_response({"error": "Guild not found"}, status=404, headers={"Access-Control-Allow-Origin": "*"})
            
            print(f"Processing guild action {action} for {guild.name}")
            
            if action == "clear":
                user_id = body.get("user_id")
                # Start clear in background to avoid blocking API
                async def safe_clear():
                    try: await perform_clear(guild, user_id=user_id)
                    except Exception as e:
                        print(f"Clear Error: {e}")
                        import traceback; traceback.print_exc()
                asyncio.create_task(safe_clear())
                return web.json_response({"success": True, "message": "Cleaning up the guild... 🧹"}, headers={"Access-Control-Allow-Origin": "*"})
                
            elif action == "rollback":
                success = await perform_rollback(guild)
                return web.json_response({"success": success, "message": "Rollback triggered!"}, headers={"Access-Control-Allow-Origin": "*"})
            
            elif action == "delete_selective":
                ids = body.get("ids", [])
                user_id = body.get("user_id")
                print(f"Selective deleting {len(ids)} items...")
                async def safe_delete():
                    try: await perform_selective_delete(guild, ids)
                    except Exception as e:
                        print(f"Delete Error: {e}")
                asyncio.create_task(safe_delete())
                return web.json_response({"success": True, "message": f"Deleting {len(ids)} items..."}, headers={"Access-Control-Allow-Origin": "*"})

            elif action == "setup_temproom":
                result = await self.perform_temproom_setup(guild, user_id)
                if result["success"]:
                    return web.json_response({"success": True, "message": result["message"]}, headers={"Access-Control-Allow-Origin": "*"})
                else:
                    return web.json_response({"success": False, "message": result["error"]}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                
            elif action == "setup":
                template = body.get("template", "Shop")
                user_id = body.get("user_id")
                if not user_id: return web.json_response({"error": "user_id required"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                
                # Pro Plan Check for Custom Template
                if template == "Custom":
                    plan = await get_user_plan(user_id)
                    if plan.get("plan_type") == "free":
                        return web.json_response({"error": "Pro Plan required for Custom Template"}, status=403, headers={"Access-Control-Allow-Origin": "*"})

                extra_data = body.get("extra_data", {})
                # Perform setup in background
                async def safe_setup():
                    try: await perform_guild_setup(guild, template, extra_data, user_id=user_id)
                    except Exception as e:
                        print(f"Setup Error: {e}")
                        import traceback; traceback.print_exc()
                asyncio.create_task(safe_setup())
                return web.json_response({"success": True, "message": "Setup started! 🚀"}, headers={"Access-Control-Allow-Origin": "*"})
                
            elif action == "test_welcome_web":
                user_id = body.get("user_id")
                if not user_id: return web.json_response({"error": "user_id required"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                
                # Pro Plan Check
                plan = await get_user_plan(user_id)
                if plan.get("plan_type") == "free":
                    return web.json_response({"error": "Pro Plan required for this feature"}, status=403, headers={"Access-Control-Allow-Origin": "*"})

                settings = body.get("settings", {})
                user_obj = guild.get_member(int(user_id)) if user_id else None
                if not user_obj: return web.json_response({"error": "Member not found in guild"}, status=404, headers={"Access-Control-Allow-Origin": "*"})
                
                print(f"Web API triggering Test Welcome for {user_obj.name}")
                success = await send_welcome_message(user_obj, settings=settings)
                return web.json_response({"success": success}, headers={"Access-Control-Allow-Origin": "*"})

            elif action == "test_goodbye_web":
                user_id = body.get("user_id")
                if not user_id: return web.json_response({"error": "user_id required"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                
                # Pro Plan Check
                plan = await get_user_plan(user_id)
                if plan.get("plan_type") == "free":
                    return web.json_response({"error": "Pro Plan required for this feature"}, status=403, headers={"Access-Control-Allow-Origin": "*"})

                settings = body.get("settings", {})
                user_obj = guild.get_member(int(user_id)) if user_id else None
                if not user_obj: return web.json_response({"error": "Member not found in guild"}, status=404, headers={"Access-Control-Allow-Origin": "*"})
                
                print(f"Web API triggering Test Goodbye for {user_obj.name}")
                success = await send_goodbye_message(user_obj, settings=settings)
                return web.json_response({"success": success}, headers={"Access-Control-Allow-Origin": "*"})

            elif action == "save_personalizer_settings":
                user_id = body.get("user_id")
                if not user_id: return web.json_response({"error": "user_id required"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                
                # Pro Plan Check
                plan = await get_user_plan(user_id)
                if plan.get("plan_type") == "free":
                    return web.json_response({"error": "Pro Plan required for this feature"}, status=403, headers={"Access-Control-Allow-Origin": "*"})

                settings = body.get("settings", {})
                print(f"Saving personalizer settings for guild {guild_id}")
                
                # 1. Update DB (Filter out columns that don't exist in guild_settings yet)
                # This prevents "Could not find column" errors if the table schema isn't updated
                db_settings = {
                    k: v for k, v in settings.items()
                    if k not in ["bot_nickname", "status_text", "activity_type", "banner_color", "avatar_url", "bot_bio"]
                }
                await save_guild_settings(guild_id, db_settings)
                
                # 2. Apply Nickname (Local)
                try:
                    nickname = settings.get("bot_nickname")
                    if nickname:
                        await guild.me.edit(nick=nickname)
                except Exception as e:
                    print(f"Error changing nickname: {e}")
                
                # 3. Apply Presence (Global)
                try:
                    act_type_str = settings.get("activity_type", "LISTENING")
                    status_text = settings.get("status_text", "/help")
                    
                    act_type = getattr(disnake.ActivityType, act_type_str.lower(), disnake.ActivityType.listening)
                    await self.change_presence(activity=disnake.Activity(type=act_type, name=status_text))
                except Exception as e:
                    print(f"Error changing presence: {e}")
                
                return web.json_response({"success": True}, headers={"Access-Control-Allow-Origin": "*"})

            return web.json_response({"error": "Unknown action"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
            
        except Exception as e:
            print(f"API Action Error: {e}")
            return web.json_response({"error": str(e)}, status=500, headers={"Access-Control-Allow-Origin": "*"})

    async def handle_guild_settings(self, request):
        guild_id = request.match_info.get('guild_id') or request.query.get('guild_id')
        if not guild_id:
            return web.json_response({"error": "Missing guild_id"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
        
        try:
            settings = await get_guild_settings(guild_id)
            if not settings:
                # Provide default structure if not found
                return web.json_response({
                    "welcome_enabled": True,
                    "welcome_channel_id": None,
                    "welcome_message": None,
                    "welcome_image_url": None,
                    "goodbye_enabled": False,
                    "goodbye_channel_id": None,
                    "goodbye_message": None,
                    "goodbye_image_url": None,
                    "bot_nickname": "An An",
                    "bot_bio": "Cheerfully serving Papa! 🌸✨",
                    "activity_type": "LISTENING",
                    "status_text": "/help",
                    "avatar_url": "/ANAN1.png",
                    "banner_color": "#ff85c1"
                }, headers={"Access-Control-Allow-Origin": "*"})
            return web.json_response(settings, headers={"Access-Control-Allow-Origin": "*"})
        except Exception as e:
            print(f"API Guild Settings Error: {e}")
            return web.json_response({"error": str(e)}, status=500, headers={"Access-Control-Allow-Origin": "*"})

    @tasks.loop(minutes=10)
    async def update_stats_loop(self):
        await self.wait_until_ready()
        for guild in self.guilds:
            try:
                await self.ensure_management_system(guild)
            except Exception as e:
                print(f"Error in stats loop for {guild.name}: {e}")

    async def on_ready(self):
        print(f"Logged in as {self.user} (ID: {self.user.id})")
        print("An An is ready to serve you! 🌸")
        
        # Auto-ensure management system in all guilds on startup
        for guild in self.guilds:
            await self.ensure_management_system(guild)
            await self.apply_personalizer_settings(guild)

    async def apply_personalizer_settings(self, guild):
        try:
            settings = await get_guild_settings(str(guild.id))
            if not settings: return

            # Apply Nickname
            nickname = settings.get("bot_nickname")
            if nickname:
                await guild.me.edit(nick=nickname)
            
            # Apply Presence (Global - last one wins, but usually it's consistent)
            act_type_str = settings.get("activity_type")
            status_text = settings.get("status_text")
            if act_type_str and status_text:
                act_type = getattr(disnake.ActivityType, act_type_str.lower(), disnake.ActivityType.listening)
                await self.change_presence(activity=disnake.Activity(type=act_type, name=status_text))
        except Exception as e:
            print(f"Error applying personalizer for {guild.name}: {e}")

    async def on_guild_join(self, guild):
        print(f"Joined a new guild: {guild.name} (ID: {guild.id})")
        # Mission: Invite Bot (Attribute to Guild Owner for now)
        if guild.owner_id:
            await update_mission_progress(str(guild.owner_id), "invite_bot", 1)
            
        # Ensure management system exists immediately
        terminal_ch = await self.ensure_management_system(guild)
        await self.apply_personalizer_settings(guild)
        
        # Send greeting in the first available channel
        for channel in guild.text_channels:
            if channel.permissions_for(guild.me).send_messages and channel != terminal_ch:
                await channel.send("สวัสดีค่ะ! An An มาถึงแล้วค่ะ! ใช้คำสั่ง `/setup` เพื่อเริ่มต้นตั้งค่าห้องต่างๆ ได้เลยนะคะ 💖")
                break

    async def on_member_join(self, member):
        # 1. Update Stats & Latest Member
        await self.ensure_management_system(member.guild)
        
        # 2. Original Welcome Logic (with Database Settings Override)
        settings = await get_guild_settings(str(member.guild.id))
        success = await send_welcome_message(member, settings=settings)
        if success:
            print(f"Sent welcome to {member.name}")
            # Mission: Invite Friends (Attribute to the owner or recruiter)
            await update_mission_progress(str(member.guild.owner_id), "invite_friends", 1)

    async def on_member_remove(self, member):
        # 1. Update Stats
        await self.ensure_management_system(member.guild)
        
        # 2. Goodbye Logic
        settings = await get_guild_settings(str(member.guild.id))
        success = await send_goodbye_message(member, settings=settings)
        if success:
            print(f"Sent goodbye for {member.name}")

    # Security: Superuser Check (Only Papa and Guild Owner)
    def is_superuser(self, user, guild):
        papa_uid = 956866340474478642
        return user.id == papa_uid or (guild and user.id == guild.owner_id)

    async def ensure_management_system(self, guild):
        # Names for the channels
        terminal_name = "｜・💬：anan-terminal"
        
        # 1. Calculate Stats
        total_members = guild.member_count
        online_members = sum(1 for m in guild.members if m.status != disnake.Status.offline)
        stats_name = f"｜・📊：MEMBERS ⎯ {online_members}/{total_members}"
        
        # 2. Get Latest Member
        # Sort members by join date
        sorted_members = sorted([m for m in guild.members if not m.bot], key=lambda m: m.joined_at or datetime.datetime.min, reverse=True)
        latest_name = f"｜・👣：LATEST ⎯ {sorted_members[0].display_name[:15]}" if sorted_members else "｜・👣：LATEST ⎯ None"

        # Permission Setup (Public View, Private Use)
        special_uid = 956866340474478642
        
        # Text Overwrites (Terminal) - PRIVATE
        text_overwrites = {
            guild.default_role: disnake.PermissionOverwrite(view_channel=False),
            guild.owner: disnake.PermissionOverwrite(view_channel=True, send_messages=True, read_message_history=True),
            guild.me: disnake.PermissionOverwrite(view_channel=True, send_messages=True, read_message_history=True)
        }
        
        # Voice Overwrites (Stats)
        voice_overwrites = {
            guild.default_role: disnake.PermissionOverwrite(view_channel=True, connect=False),
            guild.owner: disnake.PermissionOverwrite(view_channel=True, connect=True, speak=True),
            guild.me: disnake.PermissionOverwrite(view_channel=True, connect=True, speak=True)
        }

        # Add Papa to both
        papa_member = guild.get_member(special_uid)
        papa_target = papa_member if papa_member else disnake.Object(id=special_uid)
        text_overwrites[papa_target] = disnake.PermissionOverwrite(view_channel=True, send_messages=True, read_message_history=True)
        voice_overwrites[papa_target] = disnake.PermissionOverwrite(view_channel=True, connect=True, speak=True)

        # Helper to create/sync
        async def sync_ch(name, ch_type, overwrites, priority_pos):
            # Find existing by Icon Identifier (📊, 👣, 💬)
            icons = ["📊", "👣", "💬"]
            my_icon = next((i for i in icons if i in name), None)
            
            existing = None
            if my_icon:
                existing = next((c for c in (guild.text_channels if ch_type == "text" else guild.voice_channels) if my_icon in c.name), None)
            
            if not existing:
                # Fallback to broad search if icon matching fails
                keyword = name.split("：")[0] if "：" in name else name[:3]
                existing = next((c for c in (guild.text_channels if ch_type == "text" else guild.voice_channels) if keyword in c.name), None)
            
            if not existing:
                try:
                    if ch_type == "text":
                        new_ch = await guild.create_text_channel(name=name, overwrites=overwrites, position=priority_pos)
                    else:
                        new_ch = await guild.create_voice_channel(name=name, overwrites=overwrites, position=priority_pos)
                    return new_ch
                except Exception as e:
                    print(f"Error creating {name}: {e}")
            else:
                try:
                    # Only update if name or permissions changed
                    if existing.name != name:
                        await existing.edit(name=name, overwrites=overwrites, position=priority_pos)
                    else:
                        await existing.edit(overwrites=overwrites, position=priority_pos)
                    return existing
                except Exception as e:
                    print(f"Error syncing {name}: {e}")
            return None

        # Execute Sync for all 3
        terminal_ch = await sync_ch(terminal_name, "text", text_overwrites, 0)
        await sync_ch(stats_name, "voice", voice_overwrites, 1)
        await sync_ch(latest_name, "voice", voice_overwrites, 2)
        
        return terminal_ch

    async def interaction_check(self, inter: disnake.ApplicationCommandInteraction) -> bool:
        if not self.is_superuser(inter.author, inter.guild):
            await inter.response.send_message(f"ขอโทษนะคะ {inter.author.mention} แต่คำสั่งนี้ล็อคไว้สำหรับ Papa และเจ้าของกิลด์เท่านั้นค่ะ! 🙅‍♀️🌸", ephemeral=True)
            return False
        return True

bot = AnAnBot()

@bot.slash_command(description="เริ่มต้นตั้งค่าโครงสร้างห้องตาม Template")
async def setup(inter: disnake.ApplicationCommandInteraction):
    # (Global interaction_check ensures safety, removed redundant admin check)
        
    embed = disnake.Embed(
        title="✨ An An Guild Setup Assistant",
        description="เลือกประเภท Discord ที่ คุณ ต้องการให้ An An ช่วยจัดการสร้างห้องและยศให้ได้เลยค่ะ! แต่ละแบบจะมาพร้อมโซนที่จัดเป็นระเบียบสวยงาม 4 โซน โซนละ 5 ห้องค่ะ",
        color=disnake.Color.from_rgb(255, 182, 193) # สีชมพู An An
    )
    embed.set_footer(text="An An v4.1 Hybrid Precision")
    
    await inter.response.send_message(embed=embed, view=TemplateView(bot))

@bot.slash_command(description="แสดงเมนูช่วยเหลือสำหรับแอดมิน")
async def admin_help(inter: disnake.ApplicationCommandInteraction):
    # (Global interaction_check ensures safety)
        
    embed = disnake.Embed(
        title="🛠️ Admin Assistance Menu",
        description="An An พร้อมช่วย คุณ ดูแลกิลด์แล้วค่ะ! นี่คือสิ่งที่คุณทำได้:",
        color=disnake.Color.blue()
    )
    embed.add_field(name="`/setup`", value="สร้างหมวดหมู่ ห้อง และยศตาม Template ใหม่ทั้งหมด", inline=False)
    embed.add_field(name="`/clear_guild`", value="ล้างห้องทั้งหมด (เฉพาะ Owner)", inline=False)
    embed.add_field(name="`/rollback`", value="กู้คืนห้องที่ลบไปภายใน 30 นาที", inline=False)
    embed.add_field(name="`/guild_stats`", value="ดูสถิติจำนวนสมาชิกและห้องต่างๆ ในกิลด์นี้", inline=False)
    embed.set_footer(text="ความไว้วางใจของ คุณ คือสิ่งสำคัญที่สุดของ An An 💖")
    
    await inter.response.send_message(embed=embed)

# Core Logic for Clear & Rollback
async def perform_clear(guild, user_id=None):
    # 0. Backup Roles
    roles_backup = []
    for role in guild.roles:
        if role.is_default() or role.managed:
            continue
        roles_backup.append({
            "id": str(role.id),
            "name": role.name,
            "color": role.color.value,
            "hoist": role.hoist,
            "permissions": role.permissions.value
        })

    # 1. Backup Channels
    channels_backup = []
    for category in guild.categories:
        cat_data = {
            "name": category.name,
            "overwrites": {str(target.id): [p.value for p in perms.pair()] for target, perms in category.overwrites.items()},
            "channels": []
        }
        for channel in category.channels:
            cat_data["channels"].append({
                "name": channel.name,
                "type": "text" if isinstance(channel, disnake.TextChannel) else "voice",
                "overwrites": {str(target.id): [p.value for p in perms.pair()] for target, perms in channel.overwrites.items()}
            })
        channels_backup.append(cat_data)
        
    globals_backup = []
    for channel in guild.channels:
        if channel.category is None:
            globals_backup.append({
                "name": channel.name,
                "type": "text" if isinstance(channel, disnake.TextChannel) else "voice",
                "overwrites": {str(target.id): [p.value for p in perms.pair()] for target, perms in channel.overwrites.items()}
            })
            
    rollback_data = {
        "timestamp": datetime.datetime.now(),
        "globals": globals_backup,
        "categories": channels_backup,
        "roles": roles_backup
    }
    ROLLBACK_MEMORY[guild.id] = rollback_data
    
    # Supabase persistence
    await save_rollback_data(guild.id, rollback_data)
    
    # Mission: Clear Guild (Use triggering user)
    if user_id:
        await update_mission_progress(str(user_id), "clear_guild", 1)
    
    # 2. Delete everything
    for channel in guild.channels:
        try: await channel.delete()
        except: pass
        
    for r_data in roles_backup:
        role = guild.get_role(int(r_data["id"]))
        if role:
            try: await role.delete()
            except: pass
            
    # 3. Create/Ensure Management system for Papa
    terminal_ch = await bot.ensure_management_system(guild)
    if terminal_ch:
        await terminal_ch.send(
            f"🧹 **ล้างข้อมูลเรียบร้อยแล้วค่ะ!**\n\n"
            f"An An ได้ช่วยจดจำโครงสร้างห้องและยศเดิมไว้ให้แล้วค่ะ\n"
            f"หากต้องการเอาทุกอย่างกลับคืนมา สามารถพิมพ์ `!rollback` หรือ `/rollback` ได้ที่ห้องนี้ทันทีนะคะ\n"
            f"*(เหลือเวลาอีก 30 นาทีค่ะ)* 🌸💖"
        )

async def perform_rollback(guild):
    data = ROLLBACK_MEMORY.get(guild.id)
    if not data: 
        # Fallback to Supabase
        data = await get_rollback_data(guild.id)
        if not data: return False
        # Transform ISO string back to datetime if needed
        if isinstance(data["timestamp"], str):
            import dateutil.parser
            data["timestamp"] = dateutil.parser.isoparse(data["timestamp"])
    
    # 0. Restore Roles first and map old IDs to new objects
    role_map = {}
    new_roles = []
    # Roles are backed up in creation order (Top to Bottom)
    # Reversing for creation so we can easily set positions later
    for r_data in data.get("roles", []):
        try:
            new_role = await guild.create_role(
                name=r_data["name"],
                color=disnake.Color(r_data["color"]),
                hoist=r_data["hoist"],
                permissions=disnake.Permissions(r_data["permissions"]),
                reason="An An Rollback"
            )
            role_map[r_data["id"]] = new_role
            new_roles.append(new_role)
        except: continue

    # Sync positions for restored roles
    if new_roles:
        new_positions = {}
        total_restored = len(data.get("roles", []))
        for i, r_data in enumerate(data.get("roles", [])):
            role_obj = role_map.get(r_data["id"])
            if role_obj:
                new_positions[role_obj] = total_restored - i
        try:
            await guild.edit_role_positions(positions=new_positions)
        except Exception as e:
            print(f"Rollback role reorder error: {e}")

    async def apply_mapped_overwrites(target, overwrites_data):
        overwrites = {}
        for tid, pair in overwrites_data.items():
            # Try to find in mapping first, then guild
            target_obj = role_map.get(tid) or guild.get_role(int(tid)) or guild.get_member(int(tid))
            if target_obj:
                overwrites[target_obj] = disnake.PermissionOverwrite.from_pair(*pair)
        if overwrites: await target.edit(overwrites=overwrites)

    # 1. Restore Globals
    for ch in data["globals"]:
        new_ch = await (guild.create_text_channel(name=ch["name"]) if ch["type"] == "text" else guild.create_voice_channel(name=ch["name"]))
        await apply_mapped_overwrites(new_ch, ch["overwrites"])
        
    # 2. Restore Categories & Channels
    for cat in data["categories"]:
        new_cat = await guild.create_category(name=cat["name"])
        await apply_mapped_overwrites(new_cat, cat["overwrites"])
        
        for ch in cat["channels"]:
            new_ch = await (guild.create_text_channel(name=ch["name"], category=new_cat) if ch["type"] == "text" else guild.create_voice_channel(name=ch["name"], category=new_cat))
            await apply_mapped_overwrites(new_ch, ch["overwrites"])
            
    del ROLLBACK_MEMORY[guild.id]
    return True

@bot.slash_command(description="ล้างห้องทั้งหมดในกิลด์ (Backup ข้อมูลไว้ 30 นาที)")
async def clear_guild(inter: disnake.ApplicationCommandInteraction):
    # (Global interaction_check ensures safety)
    await inter.response.send_message(f"กำลังล้างกิลด์ให้นะคะ {inter.author.mention}... 🧹", ephemeral=True)
    await perform_clear(inter.guild)
    try:
        await inter.edit_original_response(content="ล้างเรียบร้อย! พิมพ์ `/rollback` หรือ `!rollback` เพื่อกู้คืนภายใน 30 นาทีค่ะ 🌸")
    except:
        pass

async def perform_selective_delete(guild, ids):
    """
    targeted deletion of channels and categories.
    If a category ID is provided, all its channels are deleted too.
    """
    for item_id in ids:
        try:
            target = guild.get_channel(int(item_id))
            if not target: continue
            
            # If it's a category, we delete all channels in it first (Cascade)
            if isinstance(target, disnake.CategoryChannel):
                for ch in target.channels:
                    try: await ch.delete()
                    except: pass
            
            # Delete the target itself
            await target.delete()
        except Exception as e:
            print(f"Error deleting {item_id}: {e}")
            
    # Send confirmation to management system
    terminal_ch = await bot.ensure_management_system(guild)
    if terminal_ch:
        await terminal_ch.send(f"✅ **ลบรายการที่เลือกเรียบร้อยแล้วค่ะ!** ({len(ids)} รายการ) 🧹🌸")

@bot.slash_command(description="ลบห้องหรือหมวดหมู่ที่ระบุ (เจ้าของเท่านั้น)")
async def clear_selective(inter: disnake.ApplicationCommandInteraction, channel_ids: str):
    # (Global interaction_check ensures safety)
    ids = [i.strip() for i in channel_ids.split(",")]
    await inter.response.send_message(f"กำลังลบ {len(ids)} รายการที่เลือกให้นะคะ... 🧹", ephemeral=True)
    await perform_selective_delete(inter.guild, ids)
    await inter.edit_original_response(content="จัดการลบให้เรียบร้อยแล้วค่ะ! ✨")

@bot.slash_command(description="กู้คืนห้องที่เพิ่งลบไป (ทำได้ภายใน 30 นาที)")
async def rollback(inter: disnake.ApplicationCommandInteraction):
    # (Global interaction_check ensures safety)
        
    await inter.response.send_message("กำลังกู้คืนข้อมูลให้นะคะ... 🪄", ephemeral=True)
    if await perform_rollback(inter.guild):
        await inter.edit_original_response(content=f"เย้! กู้คืนสำเร็จแล้วค่ะ {inter.author.mention}! 💖")
    else:
        await inter.edit_original_response(content=f"An An หาข้อมูลไม่เจอเลยค่ะ {inter.author.mention} ")

# Helper functions and Slash Commands below...

# Helpers for Welcome/Goodbye

async def send_welcome_message(member, settings=None):
    if settings and not settings.get("welcome_enabled", True):
        return False
        
    welcome_ch = None
    if settings and settings.get("welcome_channel_id"):
        try: welcome_ch = member.guild.get_channel(int(settings["welcome_channel_id"]))
        except: pass
        
    if not welcome_ch:
        welcome_ch = next((c for c in member.guild.text_channels if "welcome" in c.name.lower()), None)
        
    if not welcome_ch: return False
    
    # Check for custom message in settings
    custom_msg = settings.get("welcome_message") if settings else None
    custom_img = settings.get("welcome_image_url") if settings else None

    if custom_msg:
        description = custom_msg.replace("{user}", member.mention).replace("{guild}", member.guild.name).replace("{count}", str(member.guild.member_count))
        embed = disnake.Embed(
            description=description,
            color=disnake.Color.from_rgb(255, 182, 193),
            timestamp=datetime.datetime.now()
        )
    else:
        # Default Content
        embed = disnake.Embed(
            title="✨ ยินดีต้อนรับสมาชิกใหม่! ✨",
            description=f"ทักทายคุณ {member.mention} ที่ได้ก้าวเข้าสู่ครอบครัวของเรานะคะ! 🌸\nAn An ดีใจมากเลยค่ะที่มีสมาชิกเพิ่มขึ้นอีกท่านแล้ว ✨",
            color=disnake.Color.from_rgb(255, 182, 193),
            timestamp=datetime.datetime.now()
        )
        embed.add_field(name="🏠 ข้อมูลกิลด์", value=f"ตอนนี้เรามีเพื่อนพ้องทั้งหมด **{member.guild.member_count}** ท่านแล้วค่ะ!", inline=False)
        embed.add_field(name="📌 เริ่มต้นที่นี่", value=f"อย่าลืมไปรายงานตัวที่ห้อง <#ช่องVerify> และอ่านกติกาที่ห้อง <#ช่องกติกา> นะคะ {member.mention}! 💖", inline=False)
        
        # Try to find verify and rules channels to replace placeholders
        v_ch = next((c for c in member.guild.text_channels if "verify" in c.name), None)
        r_ch = next((c for c in member.guild.text_channels if "กฎกติกา" in c.name), None)
        
        desc = embed.fields[1].value
        if v_ch: desc = desc.replace("<#ช่องVerify>", v_ch.mention)
        if r_ch: desc = desc.replace("<#ช่องกติกา>", r_ch.mention)
        embed.set_field_at(1, name="📌 เริ่มต้นที่นี่", value=desc, inline=False)

    if member.avatar:
        embed.set_thumbnail(url=member.avatar.url)
    
    img_url = custom_img or "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMHEybXgxZ3B6Z3B6Z3B6Z3B6Z3B6Z3B6Z3B6Z3B6Z3B6Z3B6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKVUn7iM8FMEU24/giphy.gif"
    embed.set_image(url=img_url)
    
    embed.set_footer(text=f"Welcome to {member.guild.name} | An An v4.1 ✨", icon_url=member.guild.me.display_avatar.url if member.guild.me.display_avatar else None)
    
    await welcome_ch.send(content=f"Welcome to the family, {member.mention}! 🎊", embed=embed)
    return True

async def send_goodbye_message(member, settings=None):
    if settings and not settings.get("goodbye_enabled", True):
        return False
        
    goodbye_ch = None
    if settings and settings.get("goodbye_channel_id"):
        try: goodbye_ch = member.guild.get_channel(int(settings["goodbye_channel_id"]))
        except: pass
        
    if not goodbye_ch:
        goodbye_ch = next((c for c in member.guild.text_channels if "goodbye" in c.name.lower() or "welcome" in c.name.lower()), None)
        
    if not goodbye_ch: return False
    
    # Check for custom message in settings
    custom_msg = settings.get("goodbye_message") if settings else None
    custom_img = settings.get("goodbye_image_url") if settings else None

    if custom_msg:
        description = custom_msg.replace("{user}", member.display_name).replace("{guild}", member.guild.name).replace("{count}", str(member.guild.member_count))
        embed = disnake.Embed(
            description=description,
            color=disnake.Color.from_rgb(255, 182, 193),
            timestamp=datetime.datetime.now()
        )
    else:
        # Default Content
        embed = disnake.Embed(
            title="🌸 ลาก่อนนะค๊าาา...แล้วเจอกันใหม่นะคะ! 🌸",
            description=f"ลาก่อนนะคะคุณ {member.display_name} หวังว่าจะได้พบกันใหม่อีกครั้งค่ะ 🌸\nAn An จะรอการกลับมาของทุกท่านเสมอนะค๊าาา ✨",
            color=disnake.Color.from_rgb(255, 182, 193),
            timestamp=datetime.datetime.now()
        )
        embed.add_field(name="🏠 ข้อมูลสมาชิก", value=f"ตอนนี้กิลด์ของเราเหลือเพื่อนพ้องอยู่ **{member.guild.member_count}** ท่านค่ะ", inline=False)
        embed.add_field(name="🎀 ความทรงจำดีๆ", value=f"ขอบคุณที่เป็นส่วนหนึ่งของ {member.guild.name} ค๊าาา! 💖", inline=False)

    if member.avatar:
        embed.set_thumbnail(url=member.avatar.url)
    
    img_url = custom_img or "https://media.giphy.com/media/M90mJvCqxJvUs/giphy.gif"
    embed.set_image(url=img_url)
    
    embed.set_footer(text=f"Goodbye from {member.guild.name} | An An v4.1 ✨", icon_url=member.guild.me.display_avatar.url if member.guild.me.display_avatar else None)
    
    await goodbye_ch.send(embed=embed)
    return True



@bot.slash_command(description="ส่งตัวอย่างข้อความต้อนรับ (Welcome) ให้ คุณ ดูค่ะ")
async def test_welcome(inter: disnake.ApplicationCommandInteraction):
    await inter.response.send_message(f"กำลังจำลองข้อความต้อนรับให้ {inter.author.mention} ดูนะคะ... ✨🌸", ephemeral=True)
    settings = await get_guild_settings(str(inter.guild.id))
    success = await send_welcome_message(inter.author, settings=settings)
    if not success:
        await inter.edit_original_response(content=f"อุ๊ย! {inter.author.mention} An An หาห้องที่มีชื่อ **'welcome'** ไม่เจอเลยค่ะ รบกวนสร้างห้องหรือตั้งค่าใน Dashboard ก่อนนะคะ! 🥺")

@bot.slash_command(description="ส่งตัวอย่างข้อความอำลา (Goodbye) ให้ คุณ ดูค่ะ")
async def test_goodbye(inter: disnake.ApplicationCommandInteraction):
    await inter.response.send_message(f"กำลังจำลองข้อความอำลาให้ {inter.author.mention} ดูนะคะ... 🌸", ephemeral=True)
    settings = await get_guild_settings(str(inter.guild.id))
    success = await send_goodbye_message(inter.author, settings=settings)
    if not success:
        await inter.edit_original_response(content=f"อุ๊ย! {inter.author.mention} An An หาห้องสำหรับอำลาไม่เจอเลยค่ะ รบกวนตั้งค่าใน Dashboard ก่อนนะคะ! 🥺")

@bot.slash_command(description="ดูสถิติของกิลด์นี้")
async def guild_stats(inter: disnake.ApplicationCommandInteraction):
    guild = inter.guild
    embed = disnake.Embed(title=f"📊 สถิติของ {guild.name}", color=disnake.Color.green())
    embed.add_field(name="สมาชิกทั้งหมด", value=f"{guild.member_count} ท่าน", inline=True)
    embed.add_field(name="บทบาท (Roles)", value=f"{len(guild.roles)} ยศ", inline=True)
    embed.add_field(name="ห้องทั้งหมด", value=f"{len(guild.channels)} ห้อง", inline=True)
    await inter.response.send_message(embed=embed)

if __name__ == "__main__":
    # คุณ ต้องใส่ TOKEN ใน .env หรือเปลี่ยนตรงนี้
    TOKEN = os.getenv("DISCORD_TOKEN", "YOUR_BOT_TOKEN_HERE")
    if TOKEN == "YOUR_BOT_TOKEN_HERE":
        print("โปรดระบุ TOKEN ของบอทในตัวแปรสภาพแวดล้อมหรือไฟล์ .env นะคะ!")
    else:
        bot.run(TOKEN)
