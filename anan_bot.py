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
    save_guild_settings,
    create_ticket, 
    close_ticket_db, 
    update_ticket_activity,
    check_daily_ticket_limit,
    get_closed_tickets,
    activate_free_trial,
    check_expiring_trials,
    update_user_plan,
    rotate_daily_missions,
    rotate_weekly_missions,
    get_user_active_missions
)
from utils.social_manager import SocialManager
from utils.moderator_manager import ModeratorManager
import dateutil.parser

load_dotenv() # Load variables from .env

# An An Bot v4.1 - Hybrid Precision
# Developed by Antigravity for You

import datetime

# Global memory for rollback (Guild ID -> {timestamp, channels_data, roles_data})
ROLLBACK_MEMORY = {}

# Global memory for statistics caching (Guild ID -> {data, timestamp})
STATS_CACHE = {}

# --- Discord Log Center Configuration ---
ANAN_LOG_CENTER_ID = 1257086834962596041
# ----------------------------------------

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

    # 4.1 Save Verification Role ID to DB (Unified Strategy) 🛡️
    target_role_id = None
    
    # Standard Templates: Auto-detect
    if template_name in ["Shop", "Community", "Fanclub"]:
        if member_role_name:
             # Find role object
             role_obj = disnake.utils.get(guild.roles, name=member_role_name)
             if role_obj: target_role_id = str(role_obj.id)
             
    # Custom Template: Use index from extra_data
    elif template_name == "Custom" and "verification_role_index" in extra_data:
        try:
            idx = int(extra_data["verification_role_index"])
            # dynamic_roles is created in step 1. We need to access the created role object.
            # We can use the name from dynamic_roles[idx] to find in roles_map
            if 0 <= idx < len(dynamic_roles):
                role_name_to_find = dynamic_roles[idx]["name"]
                if role_name_to_find in roles_map:
                    target_role_id = str(roles_map[role_name_to_find].id)
        except Exception as e:
            print(f"Error finding verification role: {e}")

    # Save to DB if found
    if target_role_id:
        # Default enable if set up
        await save_guild_settings(guild.id, {
            "verification_role_id": target_role_id,
            "verification_enabled": True,
            "verification_channel_id": str(verify_ch.id) if verify_ch else None
        })
        print(f"✅ Auto-configured Verification Role: {target_role_id}")


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
        elif choice == "Fanclub":
            await interaction.response.send_modal(SetupModal("Fanclub", "ปรับแต่งช่องสตรีม", "ระบุแพลตฟอร์ม (คั่นด้วยเครื่องหมาย ,)", "เช่น Twitch, YouTube, TikTok"))

class TicketView(disnake.ui.View):
    def __init__(self, topics):
        super().__init__(timeout=None)
        
        # Max 3 topics as per requirement
        colors = [disnake.ButtonStyle.primary, disnake.ButtonStyle.success, disnake.ButtonStyle.danger]
        
        for i, topic in enumerate(topics):
            # topic = {name, code, desc, first_msg}
            btn = disnake.ui.Button(
                label=topic.get("name", f"Topic {i+1}"),
                emoji="📩",
                style=colors[i % 3],
                custom_id=f"open_ticket_{i}_{topic.get('code', 'GEN')}"
            )
            self.add_item(btn)

class TicketControlView(disnake.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @disnake.ui.button(label="Close Ticket", style=disnake.ButtonStyle.danger, emoji="🔒", custom_id="close_ticket_btn")
    async def close_btn(self, button: disnake.ui.Button, inter: disnake.MessageInteraction):
        await inter.response.send_message("⚠️ กำลังปิด Ticket ใน 5 วินาทีค่ะ... (An An กำลังบันทึกประวัติ 📝)", ephemeral=False)
        # Logic is handled in global listener or separate function to avoid huge view logic
        # But for cleaner code, we can call a helper
        await asyncio.sleep(5)
        await close_ticket_logic(inter)

    @disnake.ui.button(label="Claim / Transcript", style=disnake.ButtonStyle.secondary, emoji="📝", custom_id="transcript_btn")
    async def transcript_btn(self, button: disnake.ui.Button, inter: disnake.MessageInteraction):
        await inter.response.send_message("📝 ระบบ Transcript จะถูกส่งเข้า DM ของคุณหลังจากปิด Ticket นะคะ!", ephemeral=True)

async def close_ticket_logic(inter):
    # Retrieve ticket info
    from utils.supabase_client import close_ticket_db
    try:
        # Save transcript (Simple text dump for now)
        messages = [f"[{m.created_at.strftime('%Y-%m-%d %H:%M')}] {m.author.name}: {m.content}" async for m in inter.channel.history(limit=500)]
        messages.reverse()
        log_content = "\n".join(messages)
        
        # In real production we might upload this to a pastebin or S3. 
        # For now, we just save it as text in DB if small enough, or skip full body.
        # But checking requirements "Log Ticket ... 48 hr".
        # We will update DB status.
        await close_ticket_db(inter.channel.id, log_url=log_content)
        
        await inter.channel.delete()
        
        # Notify user (if not performed by user? or just confirm close)
        # DM Transcript logic could go here
    except Exception as e:
        print(f"Close Ticket Error: {e}")

class AnAnBot(commands.Bot):
    def __init__(self):
        intents = disnake.Intents.default()
        intents.members = True
        intents.message_content = True
        intents.presences = True # Needed for counting online members
        super().__init__(command_prefix="!", intents=intents, help_command=None)
        
        self.db_ready = False
        self.social_manager = SocialManager(self)
        self.moderator = ModeratorManager(self)
        
        self.sync_locks = set()
        self.start_time = datetime.datetime.now() # Track Uptime
        self.update_stats_loop.start()
        self.check_trial_expiry_task.start()
        self.mission_rotation_task.start()
        self.web_server_task = None

    async def start(self, *args, **kwargs):
        # Start web server as a background task
        self.web_server_task = asyncio.create_task(self.run_web_server())
        return await super().start(*args, **kwargs)

    @tasks.loop(hours=1)
    async def check_trial_expiry_task(self):
        if not self.db_ready: return
        
        try:
            # check_expiring_trials returns users who expire in < 24h
            users_to_notify = await check_expiring_trials()
            for user_id in users_to_notify:
                try:
                    user = await self.fetch_user(int(user_id))
                    if user:
                        # Cute customized message
                        embed = disnake.Embed(
                            title="⏳ Your Pro Trial is Ending Soon!",
                            description=(
                                "ขอบคุณที่เข้าร่วมทดสอบนะคะ Papa! 🌸✨\n"
                                "ช่วงเวลาทดลองใช้งาน 7 วันของคุณกำลังจะหมดลงในอีก 24 ชั่วโมงค่ะ\n\n"
                                "หากระบบการชำระเงินพร้อมเมื่อไหร่ อย่าลืมแวะกลับมาอุดหนุนกันน๊า~ \n"
                                "อันอันดีใจมากๆ ที่ได้ดูแลคุณค่ะ! 💖"
                            ),
                            color=disnake.Color.gold()
                        )
                        embed.set_thumbnail(url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMHEybXgxZ3B6Z3B6Z3B6Z3B6Z3B6Z3B6Z3B6Z3B6Z3B6Z3B6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1nM/M90mJvCqxJvUs/giphy.gif")
                        embed.set_footer(text="An An Notification System 🔔")
                        await user.send(embed=embed)
                        print(f"Notified user {user_id} about trial expiry")
                except Exception as e:
                    print(f"Failed to notify user {user_id}: {e}")
            
            # Additional cleanup/sync loop for all guilds to reflect plan status
            for guild in self.guilds:
                await self.ensure_management_system(guild)
                
                # --- Log Center: Plan Status Periodic Update ---
                try:
                    plan = await get_user_plan(str(guild.owner_id))
                    plan_type = plan.get("plan_type", "free").upper()
                    expires_at = plan.get("expires_at")
                    
                    if expires_at:
                        if isinstance(expires_at, str):
                            import dateutil.parser
                            exp_date = dateutil.parser.isoparse(expires_at)
                        else: exp_date = expires_at
                        
                        delta = exp_date - datetime.datetime.now(datetime.timezone.utc)
                        days_left = max(0, delta.days)
                        duration_str = f"{days_left} Days Remaining"
                    else:
                        duration_str = "Permanent" if plan_type != "FREE" else "N/A"

                    embed_st = disnake.Embed(
                        title="📊 Periodic Plan Status Update",
                        description=f"Current Plan: **{plan_type}**\nDuration: `{duration_str}`",
                        color=disnake.Color.purple() if plan_type != "FREE" else disnake.Color.light_gray(),
                        timestamp=datetime.datetime.now()
                    )
                    await self.send_anan_log(guild, "plan", embed_st)
                except: pass
                
        except Exception as e:
            print(f"Error in check_trial_expiry_task: {e}")

    @check_trial_expiry_task.before_loop
    async def before_check_trial_expiry_task(self):
        await self.wait_until_ready()

    # --- Mission Rotation System ---
    @tasks.loop(hours=1)
    async def mission_rotation_task(self):
        if not self.db_ready: return
        
        now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7))) # Thai Time
        
        # Check if it's roughly 06:00 AM (run once per day)
        # We use a simple latch or just check if hour == 6
        # To avoid multiple runs in 06:00-06:59 window, can use a DB flag or simpler approach:
        # But for now, let's just rotate if current hour is 6.
        # Ideally should check "last_rotation" in DB. 
        # For simplicity in this iteration: We rely on manual triggers or improved logic later.
        if now.hour == 6:
            print("🔄 Auto-Rotating Daily Missions...")
            await rotate_daily_missions()
            
            # If Monday
            if now.weekday() == 0:
                print("📅 Auto-Rotating Weekly Missions...")
                await rotate_weekly_missions()

    @mission_rotation_task.before_loop
    async def before_mission_rotation_task(self):
        await self.wait_until_ready()

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
        # --- Mission: Voice Tracking ---
        # When LEAVING (or switching), calculate duration if we tracked start time
        # This requires a global cache.
        if before.channel and (not after.channel or before.channel.id != after.channel.id):
             # Simple approximation: If user was in voice, we can't easily retrospective without cache.
             # Plan B: Just give fixed points for 'Joining' for now (simpler MVP)
             # OR: Use a cache. Let's use a simple cache.
             pass
        
        if after.channel and (not before.channel or before.channel.id != after.channel.id):
             # Joined a channel
             # Mission: Voice Chatter (Join = 1 step? No, need duration)
             # Let's pivot: Give points per MINUTE loop? That's heavy.
             # Let's Stick to: "Joined Voice Channel" trigger for now to verify system, or use a loop check.
             pass

        # 1. Check for Joining Hub
        if after.channel and after.channel.name == "｜・➕：CREATE ROOM":
            # Plan Check 🛡️
            from utils.supabase_client import get_user_plan
            plan = await get_user_plan(str(member.guild.owner_id))
            if plan.get("plan_type") == "free":
                try:
                    is_owner = member.id == member.guild.owner_id
                    msg = "🌸 Papa คะ! Plan ของเซิร์ฟเวอร์หมดอายุแล้วค่ะ\nกรุณาอัปเกรดเพื่อใช้งานระบบ Temporary Room ต่อนะคะ ✨" if is_owner else \
                          f"ไม่สามารถใช้งานระบบได้นะคะ เนื่องจากแผนของเซิร์ฟเวอร์หมดอายุแล้ว\nกรุณาติดต่อเจ้าของเซิร์ฟเวอร์ ({member.guild.owner.display_name}) นะคะ 🌸"
                    
                    embed = disnake.Embed(description=msg, color=disnake.Color.red())
                    await member.send(embed=embed)
                except: pass
                
                # Disconnect member
                try: await member.move_to(None)
                except: pass
                return

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

    async def send_anan_log(self, guild, channel_type, embed):
        """
        Sends a log to the centralized Log Center.
        channel_type: 'security', 'plan', 'system', 'access'
        """
        log_center = self.get_guild(ANAN_LOG_CENTER_ID)
        if not log_center: return
        
        # Find category for this guild
        cat_name = f"📁 {guild.name[:20]} ({guild.id})"
        category = disnake.utils.get(log_center.categories, name=cat_name)
        if not category:
            category = next((c for c in log_center.categories if str(guild.id) in c.name), None)
        
        if not category: return
        
        type_map = {
            "security": "🛡️-security-logs",
            "plan": "💎-plan-status",
            "system": "⚙️-system-logs",
            "access": "📡-access-logs"
        }
        
        target_name = type_map.get(channel_type)
        if not target_name: return
        
        channel = disnake.utils.get(category.text_channels, name=target_name)
        if channel:
            if not embed.footer.text:
                embed.set_footer(text=f"Server: {guild.name} | ID: {guild.id}", icon_url=guild.icon.url if guild.icon else None)
            await channel.send(embed=embed)

    async def on_guild_join(self, guild):
        # 1. Automatic Category Creation in Log Center
        log_center = self.get_guild(ANAN_LOG_CENTER_ID)
        if log_center:
            try:
                # Limit name length and sanitize
                safe_name = guild.name[:20]
                
                # Check if category already exists
                existing_cat = disnake.utils.get(log_center.categories, name=f"📁 {safe_name} ({guild.id})")
                if existing_cat: return

                # Create Category
                cat_name = f"📁 {safe_name} ({guild.id})"
                category = await log_center.create_category(name=cat_name)
                
                # Channels to create
                channels = [
                    ("🛡️-security-logs", "แจ้งเตือนการจัดการห้อง/ยศ/การบุกรุก"),
                    ("💎-plan-status", "รายงานแพลนปัจจุบันและจำนวนวันที่เหลือ (Plan | Duration)"),
                    ("⚙️-system-logs", "รายงานสถานะบอทและ Error ต่างๆ"),
                    ("📡-access-logs", "รายงานการเข้า/ออก และกิจกรรมสมาชิก")
                ]
                
                for ch_name, ch_desc in channels:
                    new_ch = await log_center.create_text_channel(name=ch_name, category=category, topic=ch_desc)
                    # Initial Greeting
                    embed = disnake.Embed(
                        title=f"📡 Log System Initialized",
                        description=f"ระบบบันทึกข้อมูลสำหรับ **{guild.name}** เริ่มทำงานแล้วค่ะ! ✨\nหมวดหมู่: `{ch_name}`",
                        color=disnake.Color.from_rgb(255, 182, 193),
                        timestamp=datetime.datetime.now()
                    )
                    embed.set_footer(text=f"Server ID: {guild.id}")
                    await new_ch.send(embed=embed)
                
                print(f"✅ Created Log Category and Channels for {guild.name} in Log Center")
                
                # Send Initial Plan Status
                try:
                    plan = await get_user_plan(str(guild.owner_id))
                    plan_type = plan.get("plan_type", "free").upper()
                    embed_plan = disnake.Embed(
                        title="📊 Initial Plan Status",
                        description=f"Current Plan: **{plan_type}**\nStatus: `Initialized`",
                        color=disnake.Color.purple(),
                        timestamp=datetime.datetime.now()
                    )
                    await self.send_anan_log(guild, "plan", embed_plan)
                except: pass

            except Exception as e:
                print(f"❌ Error creating log channels for guild {guild.id}: {e}")

    async def on_member_join(self, member):
        # 1. Access Log
        embed = disnake.Embed(
            title="📥 Member Joined",
            description=f"คุณ **{member.name}** ({member.mention}) เข้าร่วมเซิร์ฟเวอร์แล้วค่ะ!",
            color=disnake.Color.green(),
            timestamp=datetime.datetime.now()
        )
        embed.set_thumbnail(url=member.display_avatar.url)
        embed.add_field(name="Account Created", value=member.created_at.strftime('%Y-%m-%d %H:%M'), inline=True)
        embed.add_field(name="Member Count", value=str(member.guild.member_count), inline=True)
        await self.send_anan_log(member.guild, "access", embed)
        
        # 2. Existing Welcome Logic (Call helper)
        from utils.supabase_client import get_guild_settings
        settings = await get_guild_settings(str(member.guild.id))
        await send_welcome_message(member, settings=settings)

    async def on_member_remove(self, member):
        # 1. Access Log
        embed = disnake.Embed(
            title="📤 Member Left",
            description=f"คุณ **{member.name}** ({member.mention}) ออกจากเซิร์ฟเวอร์แล้วค่ะ...",
            color=disnake.Color.red(),
            timestamp=datetime.datetime.now()
        )
        embed.set_thumbnail(url=member.display_avatar.url)
        embed.add_field(name="Member Count", value=str(member.guild.member_count), inline=True)
        await self.send_anan_log(member.guild, "access", embed)
        
        # 2. Existing Goodbye Logic (Call helper)
        from utils.supabase_client import get_guild_settings
        settings = await get_guild_settings(str(member.guild.id))
        await send_goodbye_message(member, settings=settings)

    # --- Security Log Events ---
    async def on_guild_channel_create(self, channel):
        embed = disnake.Embed(
            title="🆕 Channel Created",
            description=f"ห้องใหม่ถูกสร้างขึ้น: {channel.mention} (`{channel.name}`)",
            color=disnake.Color.blue(),
            timestamp=datetime.datetime.now()
        )
        embed.add_field(name="Type", value=str(channel.type), inline=True)
        embed.add_field(name="Category", value=channel.category.name if channel.category else "None", inline=True)
        await self.send_anan_log(channel.guild, "security", embed)

    async def on_guild_channel_delete(self, channel):
        embed = disnake.Embed(
            title="🗑️ Channel Deleted",
            description=f"ห้องถูกลบออก: `{channel.name}`",
            color=disnake.Color.orange(),
            timestamp=datetime.datetime.now()
        )
        embed.add_field(name="Type", value=str(channel.type), inline=True)
        await self.send_anan_log(channel.guild, "security", embed)

    async def on_guild_role_create(self, role):
        embed = disnake.Embed(
            title="🆕 Role Created",
            description=f"ยศใหม่ถูกสร้างขึ้น: {role.mention} (`{role.name}`)",
            color=disnake.Color.blue(),
            timestamp=datetime.datetime.now()
        )
        await self.send_anan_log(role.guild, "security", embed)

    async def on_guild_role_delete(self, role):
        embed = disnake.Embed(
            title="🗑️ Role Deleted",
            description=f"ยศถูกลบออก: `{role.name}`",
            color=disnake.Color.orange(),
            timestamp=datetime.datetime.now()
        )
        await self.send_anan_log(role.guild, "security", embed)

    async def on_error(self, event, *args, **kwargs):
        # Log to System Logs
        embed = disnake.Embed(
            title="⚠️ System Error",
            description=f"Event: `{event}`\nAn error occurred in the bot's core logic.",
            color=disnake.Color.red(),
            timestamp=datetime.datetime.now()
        )
        
        guild = None
        for arg in args:
            if hasattr(arg, "guild"): guild = arg.guild; break
            elif isinstance(arg, disnake.Guild): guild = arg; break
        
        if guild:
            await self.send_anan_log(guild, "system", embed)
        
        await super().on_error(event, *args, **kwargs)

    async def on_slash_command_error(self, inter, error):
        embed = disnake.Embed(
            title="❌ Command Error",
            description=f"Command: `{inter.data.name}`\nError: `{str(error)}`",
            color=disnake.Color.red(),
            timestamp=datetime.datetime.now()
        )
        if inter.guild:
            await self.send_anan_log(inter.guild, "system", embed)
        
        await super().on_slash_command_error(inter, error)

    async def on_message(self, message):
        if message.author.bot: return
        
        # 1. Mission: Chatbox Star (Any message)
        await update_mission_progress(str(message.author.id), "daily_msg_50", 1)
        
        # 2. Mission: Morning Greeting
        content = message.content.lower()
        if any(w in content for w in ["good morning", "morning", "สวัสดี", "อรุณสวัสดิ์", "มอนิ่ง"]):
            # Check 05:00 - 10:00 AM (Thai Time UTC+7)
            now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7)))
            if 5 <= now.hour <= 10:
                await update_mission_progress(str(message.author.id), "daily_greet", 1)
                
        # 3. Mission: Night Owl (02:00 - 05:00)
        now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7)))
        if 2 <= now.hour < 5:
            await update_mission_progress(str(message.author.id), "daily_night_msg", 1)

        # 4. Mission: Social Butterfly (Mentions)
        if message.mentions:
            # Count unique mentions (excluding bots)
            humans = [u for u in message.mentions if not u.bot]
            if len(humans) > 0:
                await update_mission_progress(str(message.author.id), "weekly_mention_5", len(humans))
                
        # 5. Mission: Content Creator (Image in #media)
        if message.attachments and "media" in message.channel.name.lower():
             await update_mission_progress(str(message.author.id), "weekly_media_5", 1)

        # Allow commands to process
        await self.process_commands(message)

    async def on_reaction_add(self, reaction, user):
        if user.bot: return
        # Mission: Emoji Lover
        await update_mission_progress(str(user.id), "daily_react_10", 1)
        
        # Mission: Friendly Neighbor (Receiver gets point)
        # Check if reactor != author
        if reaction.message.author.id != user.id:
             await update_mission_progress(str(reaction.message.author.id), "life_popular_100", 1)

    async def handle_claim_reward(self, request):
         try:
             guild_id = request.match_info['guild_id']
             data = await request.json()
             user_id = data.get("user_id")
             mission_key = data.get("mission_key")
             
             if not user_id or not mission_key:
                 return web.json_response({"error": "Missing user_id or mission_key"}, status=400)
                 
             result = await claim_mission_reward(user_id, mission_key)
             if result["success"]:
                 return web.json_response(result)
             else:
                 return web.json_response(result, status=400)
         except Exception as e:
             return web.json_response({"error": str(e)}, status=500)

    async def handle_user_missions(self, request):
         try:
             user_id = request.match_info['user_id']
             missions = await get_user_active_missions(user_id)
             return web.json_response(missions)
         except Exception as e:
             return web.json_response({"error": str(e)}, status=500)

    async def run_web_server(self):
        app = web.Application()
        app.router.add_get('/api/stats', self.handle_stats)
        app.router.add_get('/api/guilds', self.handle_guilds)
        app.router.add_get('/api/guild/{guild_id}/stats', self.handle_guild_stats)
        app.router.add_get('/api/user/{user_id}/missions', self.handle_user_missions) # New Endpoint
        app.router.add_get('/api/discord-permissions', self.handle_discord_permissions)
        app.router.add_get('/api/guild/{guild_id}/structure', self.handle_guild_structure)
        app.router.add_get('/api/guild/{guild_id}/roles', self.handle_guild_roles)
        app.router.add_get('/api/guild/{guild_id}/tickets/history', self.handle_guild_ticket_history) # New History API
        app.router.add_get('/api/guild/{guild_id}/settings', self.handle_guild_settings)
        app.router.add_get('/api/ping', lambda r: web.Response(text="pong"))
        app.router.add_post('/api/action', self.handle_action)
        app.router.add_post('/api/guild/{guild_id}/action', self.handle_action)
        app.router.add_post('/api/guild/{guild_id}/claim-reward', self.handle_claim_reward) # Missing handler
        app.router.add_options('/api/action', self.handle_options)
        app.router.add_options('/api/stats', self.handle_options)
        app.router.add_options('/api/guilds', self.handle_options)
        app.router.add_options('/api/user/{user_id}/missions', self.handle_options)
        app.router.add_options('/api/guild/{guild_id}/stats', self.handle_options)
        app.router.add_options('/api/guild/{guild_id}/structure', self.handle_options)
        app.router.add_options('/api/guild/{guild_id}/roles', self.handle_options)
        app.router.add_options('/api/guild/{guild_id}/tickets/history', self.handle_options)
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
            
        # Check Cache 🛡️ (5 Minutes)
        now = datetime.datetime.now()
        cache_entry = STATS_CACHE.get(guild_id)
        if cache_entry and (now - cache_entry["timestamp"]).total_seconds() < 300:
            return web.json_response(cache_entry["data"], headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            })

        online_count = sum(1 for m in guild.members if m.status != disnake.Status.offline)
        data = {
            "name": guild.name,
            "total_members": guild.member_count,
            "online_members": online_count,
            "status": "online",
            "uptime": "99.9%"
        }
        
        # Save to Cache
        STATS_CACHE[guild_id] = {"data": data, "timestamp": now}
        
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
            
        def get_overwrites(ch):
            ow = []
            for target, p_ow in ch.overwrites.items():
                if isinstance(target, disnake.Role):
                    allow, deny = p_ow.pair()
                    ow.append({
                        "id": str(target.id),
                        "name": target.name,
                        "type": "role",
                        "allow": allow.value,
                        "deny": deny.value
                    })
            return ow

        structure = []
        # Categories and their channels
        for cat in sorted(guild.categories, key=lambda c: c.position):
            channels = []
            for ch in sorted(cat.channels, key=lambda c: c.position):
                channels.append({
                    "id": str(ch.id),
                    "name": ch.name,
                    "type": str(ch.type),
                    "overwrites": get_overwrites(ch)
                })
            structure.append({
                "id": str(cat.id),
                "name": cat.name,
                "type": "category",
                "channels": channels,
                "overwrites": get_overwrites(cat)
            })
            
        # Orphan channels (no category)
        orphans = [ch for ch in guild.channels if ch.category is None]
        if orphans:
            structure.append({
                "id": "orphans",
                "name": "UNCATEGORIZED",
                "type": "category",
                "channels": [{
                    "id": str(ch.id), 
                    "name": ch.name, 
                    "type": str(ch.type),
                    "overwrites": get_overwrites(ch)
                } for ch in sorted(orphans, key=lambda c: c.position)],
                "overwrites": [] # Orphans don't have cat overwrites obviously
            })

        return web.json_response(structure, headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        })

    async def handle_guild_roles(self, request):
        guild_id = request.match_info.get('guild_id')
        guild = self.get_guild(int(guild_id))
        if not guild:
            return web.json_response({"error": "Guild not found"}, status=404, headers={"Access-Control-Allow-Origin": "*"})
        
        # Return roles sorted by position (reversed) so highest is top
        roles = []
        for role in reversed(guild.roles):
            if role.is_default(): continue # Skip @everyone if wanted, or keep it
            roles.append({
                "id": str(role.id),
                "name": role.name,
                "color": role.color.value,
                "permissions": role.permissions.value,
                "position": role.position
            })
            
        return web.json_response(roles, headers={"Access-Control-Allow-Origin": "*"})


    async def handle_guild_ticket_history(self, request):
        guild_id = request.match_info.get('guild_id')
        
        history = await get_closed_tickets(guild_id, limit=20)
        
        data = []
        for ticket in history:
            closed_at_str = ticket.get("closed_at")
            ago_str = "Recently"
            if closed_at_str:
                try:
                    closed_dt = datetime.datetime.fromisoformat(str(closed_at_str).replace("Z", "+00:00"))
                    time_diff = datetime.datetime.now(datetime.timezone.utc) - closed_dt
                    
                    if time_diff.total_seconds() < 3600:
                        ago_str = f"{int(time_diff.total_seconds() // 60)}m ago"
                    elif time_diff.total_seconds() < 86400:
                        ago_str = f"{int(time_diff.total_seconds() // 3600)}h ago"
                    else:
                        ago_str = f"{int(time_diff.total_seconds() // 86400)}d ago"
                except: pass

            data.append({
                "ticket_id": f"#{ticket['topic_code']}{str(ticket['ticket_id']).zfill(3)}",
                "topic": ticket.get("topic_code"),
                "status": "Closed",
                "ago": ago_str,
                "log_url": ticket.get("log_url")
            })
            
        return web.json_response(data, headers={"Access-Control-Allow-Origin": "*"})

    async def handle_action(self, request):
        print(f"API Request: POST /api/action from {request.remote}")
        try:
            body = await request.json()
            action = body.get("action")
            guild_id = body.get("guild_id") or request.match_info.get('guild_id')
            user_id = body.get("user_id")
            
            print(f"Web API triggering {action}")
            
            # These actions don't need a guild context
            if action == "claim_trial":
                user_id = body.get("user_id")
                if not user_id: return web.json_response({"error": "user_id required"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                
                success = await activate_free_trial(user_id)
                if success:
                    return web.json_response({"success": True}, headers={"Access-Control-Allow-Origin": "*"})
                else:
                    return web.json_response({"success": False, "error": "Unable to claim trial (Already claimed or active plan)"}, status=400, headers={"Access-Control-Allow-Origin": "*"})

            if action == "get_missions":
                user_id = body.get("user_id")
                guild_id = body.get("guild_id")
                if not user_id: return web.json_response({"error": "user_id required"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                
                # Dynamic Parallel fetching! 🚀
                tasks = [
                    get_user_active_missions(user_id),
                    get_user_stats(user_id),
                    get_user_plan(user_id)
                ]
                
                # Optimization: Include Guild Stats if requested (Consolidation) 💎
                if guild_id:
                    guild = self.get_guild(int(guild_id))
                    if guild:
                        now = datetime.datetime.now()
                        cache_entry = STATS_CACHE.get(str(guild_id))
                        if cache_entry and (now - cache_entry["timestamp"]).total_seconds() < 300:
                            tasks.append(asyncio.sleep(0, result=cache_entry["data"])) # Fake task for consistency
                        else:
                            async def get_stats_and_cache():
                                online = sum(1 for m in guild.members if m.status != disnake.Status.offline)
                                d = {"total_members": guild.member_count, "online_members": online}
                                STATS_CACHE[str(guild_id)] = {"data": d, "timestamp": now}
                                return d
                            tasks.append(get_stats_and_cache())

                results = await asyncio.gather(*tasks)
                missions, user_stats, plan = results[0], results[1], results[2]
                guild_stats = results[3] if len(results) > 3 else None
                
                # Calculate Level (Max 10)
                xp_balance = user_stats.get("xp_balance", 0)
                
                def get_level_info(total_xp):
                    if total_xp <= 0: return 1, 0, 5000
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
                    level = max(1, level) # Safety
                    return level, current_level_xp, xp_needed_for_next

                level, current_xp, next_xp = get_level_info(xp_balance)
                if str(user_id) == "956866340474478642":
                    level = 10
                    current_xp = 0
                    next_xp = 0
                user_stats["level"] = level
                user_stats["current_level_xp"] = current_xp
                user_stats["xp_needed_for_next"] = next_xp
                
                final_res = {"missions": missions, "stats": user_stats, "plan": plan}
                if guild_stats: final_res["guild_stats"] = guild_stats # Add consolidated stats
                
                return web.json_response(final_res, headers={"Access-Control-Allow-Origin": "*"})
                
            elif action == "claim_mission":
                user_id = body.get("user_id")
                mission_key = body.get("mission_key")
                if not user_id or not mission_key: return web.json_response({"error": "user_id and mission_key required"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                result = await claim_mission_reward(user_id, mission_key)
                return web.json_response(result, headers={"Access-Control-Allow-Origin": "*"})

            elif action == "save_rank_card":
                user_id = body.get("user_id")
                guild_id = body.get("guild_id")
                config = body.get("config")
                if not user_id or not guild_id or not config:
                    return web.json_response({"error": "Missing params"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                from utils.supabase_client import save_rank_card_db
                result = await save_rank_card_db(user_id, guild_id, config)
                return web.json_response(result, headers={"Access-Control-Allow-Origin": "*"})

            elif action == "get_rank_card":
                user_id = body.get("user_id")
                guild_id = body.get("guild_id")
                if not user_id or not guild_id:
                    return web.json_response({"error": "Missing params"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                from utils.supabase_client import get_rank_card_db
                config = await get_rank_card_db(user_id, guild_id)
                return web.json_response({"config": config}, headers={"Access-Control-Allow-Origin": "*"})

            if action == "save_welcome_settings":
                user_id = body.get("user_id")
                if not user_id: return web.json_response({"error": "user_id required"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                plan = await get_user_plan(user_id)
                if plan.get("plan_type") == "free":
                    return web.json_response({"error": "Pro Plan required for this feature"}, status=403, headers={"Access-Control-Allow-Origin": "*"})
                settings = body.get("settings", {})
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
            
            if action == "clear":
                user_id = body.get("user_id")
                async def safe_clear():
                    try: await perform_clear(guild, user_id=user_id)
                    except Exception as e:
                        print(f"Clear Error: {e}")
                asyncio.create_task(safe_clear())
                return web.json_response({"success": True, "message": "Cleaning up the guild... 🧹"}, headers={"Access-Control-Allow-Origin": "*"})
                
            elif action == "rollback":
                success = await perform_rollback(guild)
                return web.json_response({"success": success, "message": "Rollback triggered!"}, headers={"Access-Control-Allow-Origin": "*"})
            
            elif action == "delete_selective":
                ids = body.get("ids", [])
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
                if template == "Custom":
                    plan = await get_user_plan(user_id)
                    if plan.get("plan_type") == "free":
                        return web.json_response({"error": "Pro Plan required for Custom Template"}, status=403, headers={"Access-Control-Allow-Origin": "*"})
                extra_data = body.get("extra_data", {})
                async def safe_setup():
                    try: await perform_guild_setup(guild, template, extra_data, user_id=user_id)
                    except Exception as e:
                        print(f"Setup Error: {e}")
                asyncio.create_task(safe_setup())
                return web.json_response({"success": True, "message": "Setup started! 🚀"}, headers={"Access-Control-Allow-Origin": "*"})
                
            elif action == "test_welcome_web":
                user_id = body.get("user_id")
                if not user_id: return web.json_response({"error": "user_id required"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                plan = await get_user_plan(user_id)
                if plan.get("plan_type") == "free":
                    return web.json_response({"error": "Pro Plan required for this feature"}, status=403, headers={"Access-Control-Allow-Origin": "*"})
                settings = body.get("settings", {})
                user_obj = guild.get_member(int(user_id)) if user_id else None
                if not user_obj: return web.json_response({"error": "Member not found in guild"}, status=404, headers={"Access-Control-Allow-Origin": "*"})
                success = await send_welcome_message(user_obj, settings=settings)
                return web.json_response({"success": success}, headers={"Access-Control-Allow-Origin": "*"})

            elif action == "get_channels":
                user_id = body.get("user_id")
                plan = await get_user_plan(user_id) if user_id else {"plan_type": "free"}
                if plan.get("plan_type") == "free":
                    return web.json_response({"error": "Pro Plan required"}, status=403, headers={"Access-Control-Allow-Origin": "*"})
                channels = [{"id": str(ch.id), "name": ch.name} for ch in guild.text_channels]
                return web.json_response({"channels": channels}, headers={"Access-Control-Allow-Origin": "*"})

            elif action == "get_server_emojis":
                user_id = body.get("user_id")
                plan = await get_user_plan(user_id) if user_id else {"plan_type": "free"}
                if plan.get("plan_type") == "free":
                    return web.json_response({"error": "Pro Plan required"}, status=403, headers={"Access-Control-Allow-Origin": "*"})
                emojis = [{"id": str(e.id), "name": e.name, "url": e.url, "animated": e.animated} for e in guild.emojis]
                return web.json_response({"emojis": emojis}, headers={"Access-Control-Allow-Origin": "*"})

            elif action == "verify_execute":
                user_id = body.get("user_id")
                if not user_id: return web.json_response({"error": "user_id required"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                
                # Check DB for settings
                settings = await get_guild_settings(guild_id)
                if not settings or not settings.get("verification_enabled"):
                     return web.json_response({"error": "Verification is disabled on this server."}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                
                role_id = settings.get("verification_role_id")
                if not role_id:
                     return web.json_response({"error": "Verification Role not configured."}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                
                member = guild.get_member(int(user_id))
                if not member:
                     return web.json_response({"error": "Member not found in Discord."}, status=404, headers={"Access-Control-Allow-Origin": "*"})
                
                role = guild.get_role(int(role_id))
                if not role:
                     return web.json_response({"error": "Configured Role not found on server."}, status=404, headers={"Access-Control-Allow-Origin": "*"})
                
                try:
                    await member.add_roles(role)
                    return web.json_response({"success": True, "message": f"Verified! Assigned role {role.name}"}, headers={"Access-Control-Allow-Origin": "*"})
                except Exception as e:
                    return web.json_response({"error": f"Failed to assign role: {str(e)}"}, status=500, headers={"Access-Control-Allow-Origin": "*"})

            elif action == "save_verification_config":
                user_id = body.get("user_id")
                plan = await get_user_plan(user_id) if user_id else {"plan_type": "free"}
                if plan.get("plan_type") == "free":
                    return web.json_response({"error": "Pro Plan required"}, status=403, headers={"Access-Control-Allow-Origin": "*"})
                
                config = body.get("config", {}) # {enabled, role_id, channel_id}
                
                # Validate Role
                role_id = config.get("role_id")
                if role_id:
                    r = guild.get_role(int(role_id))
                    if not r: return web.json_response({"error": "Role not found"}, status=404, headers={"Access-Control-Allow-Origin": "*"})
                
                update_data = {
                    "verification_enabled": config.get("enabled", False),
                    "verification_role_id": role_id,
                }
                if "channel_id" in config: update_data["verification_channel_id"] = config["channel_id"]
                
                await save_guild_settings(guild_id, update_data)
                
                # Send beautiful verification Embed when enabled
                if config.get("enabled"):
                    # Find or create verification channel
                    verify_ch = next((ch for ch in guild.text_channels if "verify" in ch.name.lower() or "ยืนยัน" in ch.name), None)
                    
                    # If no channel found, try to find a welcome or general channel
                    if not verify_ch:
                        verify_ch = next((ch for ch in guild.text_channels if "welcome" in ch.name.lower() or "ต้อนรับ" in ch.name), None)
                    if not verify_ch:
                        verify_ch = next((ch for ch in guild.text_channels if ch.permissions_for(guild.me).send_messages), None)
                    
                    if verify_ch:
                        # Create beautiful Embed
                        embed = disnake.Embed(
                            title="🌸 ยืนยันตัวตน | Verification",
                            description=(
                                "**สวัสดีค่ะ ยินดีต้อนรับสู่เซิร์ฟเวอร์ของเรา!** 💕\n\n"
                                "เพื่อความปลอดภัยของสมาชิกทุกคน กรุณายืนยันตัวตนก่อนเข้าถึงห้องต่างๆ นะคะ\n\n"
                                "**🛡️ ขั้นตอน:**\n"
                                "1️⃣ กดปุ่ม **เข้าสู่ประตู** ด้านล่าง\n"
                                "2️⃣ เชื่อมต่อบัญชี Discord\n"
                                "3️⃣ รับ Role และเริ่มสนุกได้เลย!\n\n"
                                "*ขอบคุณที่เลือกเราค่ะ~* 🌷"
                            ),
                            color=disnake.Color.from_rgb(255, 182, 193)
                        )
                        embed.set_thumbnail(url=guild.icon.url if guild.icon else None)
                        embed.set_footer(text="An An Gatekeeper 🛡️ | Powered by ananbot.xyz", icon_url=self.user.avatar.url if self.user.avatar else None)
                        embed.timestamp = datetime.datetime.now()
                        
                        # Create verify link button
                        verify_url = f"https://ananbot.xyz/verify/{guild_id}"
                        
                        view = disnake.ui.View(timeout=None)
                        view.add_item(disnake.ui.Button(
                            label="🏰 เข้าสู่ประตู",
                            url=verify_url,
                            style=disnake.ButtonStyle.link
                        ))
                        
                        try:
                            await verify_ch.send(embed=embed, view=view)
                        except Exception as e:
                            print(f"Failed to send verify embed: {e}")
                
                return web.json_response({"success": True}, headers={"Access-Control-Allow-Origin": "*"})

            elif action == "get_roles":
                user_id = body.get("user_id")
                plan = await get_user_plan(user_id) if user_id else {"plan_type": "free"}
                if plan.get("plan_type") == "free":
                    return web.json_response({"error": "Pro Plan required"}, status=403, headers={"Access-Control-Allow-Origin": "*"})
                roles = []
                for role in reversed(guild.roles):
                    if role.is_default() or role.managed: continue
                    roles.append({"id": str(role.id), "name": role.name, "color": role.color.value})
                return web.json_response({"roles": roles}, headers={"Access-Control-Allow-Origin": "*"})

            elif action == "save_reaction_role_config":
                user_id = body.get("user_id")
                plan = await get_user_plan(user_id) if user_id else {"plan_type": "free"}
                if plan.get("plan_type") == "free":
                    return web.json_response({"error": "Pro Plan required"}, status=403, headers={"Access-Control-Allow-Origin": "*"})
                config = body.get("config", {})
                await save_guild_settings(guild_id, {"reaction_roles_config": config})
                return web.json_response({"success": True}, headers={"Access-Control-Allow-Origin": "*"})

            elif action == "save_moderator_settings":
                user_id = body.get("user_id")
                plan = await get_user_plan(user_id) if user_id else {"plan_type": "free"}
                if plan.get("plan_type") == "free":
                    return web.json_response({"error": "Pro Plan required"}, status=403, headers={"Access-Control-Allow-Origin": "*"})
                config = body.get("config", {})
                await save_guild_settings(guild_id, {"moderator_config": config})
                self.moderator.config_cache.pop(int(guild_id), None)
                return web.json_response({"success": True}, headers={"Access-Control-Allow-Origin": "*"})

            elif action == "post_reaction_role":
                user_id = body.get("user_id")
                plan = await get_user_plan(user_id) if user_id else {"plan_type": "free"}
                if plan.get("plan_type") == "free":
                    return web.json_response({"error": "Pro Plan required"}, status=403, headers={"Access-Control-Allow-Origin": "*"})
                config = body.get("config", {})
                target_ch_id = config.get("channel_id")
                if not target_ch_id: return web.json_response({"error": "Target channel required"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                channel = guild.get_channel(int(target_ch_id))
                if not channel: return web.json_response({"error": "Channel not found"}, status=404, headers={"Access-Control-Allow-Origin": "*"})
                title = config.get("title", "Reaction Roles")
                desc = config.get("description", "Select your roles below!")
                mappings = config.get("mappings", [])
                embed = disnake.Embed(title=title, description=desc, color=disnake.Color.from_rgb(255, 182, 193))
                if mappings:
                    mappings_desc = "\n".join([f"{m.get('emoji', '✨')} **{m.get('label', 'Role')}** - {m.get('desc', 'Click to get role')}" for m in mappings])
                    embed.add_field(name="Available Roles", value=mappings_desc, inline=False)
                embed.set_footer(text="An An Reaction Roles 🌸")
                embed.timestamp = datetime.datetime.now()
                await channel.send(embed=embed, view=ReactionRoleView(mappings))
                return web.json_response({"success": True}, headers={"Access-Control-Allow-Origin": "*"})

            elif action == "test_goodbye_web":
                user_id = body.get("user_id")
                if not user_id: return web.json_response({"error": "user_id required"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                plan = await get_user_plan(user_id)
                if plan.get("plan_type") == "free":
                    return web.json_response({"error": "Pro Plan required for this feature"}, status=403, headers={"Access-Control-Allow-Origin": "*"})
                settings = body.get("settings", {})
                user_obj = guild.get_member(int(user_id)) if user_id else None
                if not user_obj: return web.json_response({"error": "Member not found in guild"}, status=404, headers={"Access-Control-Allow-Origin": "*"})
                success = await send_goodbye_message(user_obj, settings=settings)
                return web.json_response({"success": success}, headers={"Access-Control-Allow-Origin": "*"})

            elif action == "save_personalizer_settings":
                user_id = body.get("user_id")
                if not user_id: return web.json_response({"error": "user_id required"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                plan = await get_user_plan(user_id)
                if plan.get("plan_type") == "free":
                    return web.json_response({"error": "Pro Plan required for this feature"}, status=403, headers={"Access-Control-Allow-Origin": "*"})
                settings = body.get("settings", {})
                await save_guild_settings(guild_id, settings)
                if guild:
                    try:
                        nickname = settings.get("bot_nickname")
                        if nickname: await guild.me.edit(nick=nickname)
                    except Exception as e:
                        print(f"Error changing nickname: {e}")
                try:
                    avatar_url = settings.get("avatar_url")
                    if avatar_url and avatar_url.startswith("http"):
                        import aiohttp
                        async with aiohttp.ClientSession() as session:
                            async with session.get(avatar_url) as resp:
                                if resp.status == 200:
                                    avatar_data = await resp.read()
                                    await self.user.edit(avatar=avatar_data)
                                    print(f"Bot avatar updated successfully via {avatar_url}")
                except Exception as e:
                    print(f"Error changing avatar: {e}")

                try:
                    act_type_str = settings.get("activity_type") or "LISTENING"
                    status_text = settings.get("status_text") or "/help"
                    act_type = getattr(disnake.ActivityType, act_type_str.lower(), disnake.ActivityType.listening)
                    await self.change_presence(activity=disnake.Activity(type=act_type, name=status_text))
                except Exception as e:
                    print(f"Error changing presence: {e}")
                return web.json_response({"success": True}, headers={"Access-Control-Allow-Origin": "*"})

            elif action == "save_ticket_settings":
                settings = body.get("settings", {})
                current = await get_guild_settings(guild_id) or {}
                current_ticket = current.get("ticket_config", {})
                if "counts" in current_ticket:
                    settings["counts"] = current_ticket["counts"]
                await save_guild_settings(guild_id, {"ticket_config": settings})
                return web.json_response({"success": True}, headers={"Access-Control-Allow-Origin": "*"})

            elif action == "send_ticket_panel":
                user_id = body.get("user_id")
                settings = body.get("settings", {})
                result = await self.perform_ticket_setup(guild, settings, user_id)
                return web.json_response(result, status=200 if result.get("success") else 400, headers={"Access-Control-Allow-Origin": "*"})

            elif action == "test_social_alert":
                user_id = body.get("user_id")
                if not user_id: return web.json_response({"error": "user_id required"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                plan = await get_user_plan(user_id)
                if plan.get("plan_type") == "free":
                    return web.json_response({"error": "Pro Plan required for this feature"}, status=403, headers={"Access-Control-Allow-Origin": "*"})
                success = await self.social_manager.test_alert(guild_id)
                return web.json_response({"success": success}, headers={"Access-Control-Allow-Origin": "*"})

            elif action in ["create_channel_live", "delete_channel_live", "update_channel_permissions_live"]:
                papa_id = "956866340474478642"
                if str(user_id) != papa_id:
                    return web.json_response({"error": "🚫 Forbidden: Papa access only!"}, status=403, headers={"Access-Control-Allow-Origin": "*"})
                
                if action == "create_channel_live":
                    name = body.get("name", "new-channel")
                    ch_type = body.get("type", "text")
                    cat_id = body.get("category_id")
                    emoji = body.get("emoji", "💬" if ch_type == "text" else "🔊" if ch_type == "voice" else "📂")
                    try:
                        final_name = name
                        if ch_type == "category": final_name = f"{emoji} ⎯  {name.upper()}"
                        else:
                            def internal_format(e, n, is_v=False): return f"｜・{e}：{n.upper() if is_v else n.lower()}"
                            final_name = internal_format(emoji, name, is_v=(ch_type == "voice"))
                        cat = guild.get_channel(int(cat_id)) if cat_id else None
                        if ch_type == "category": new_ch = await guild.create_category(name=final_name)
                        elif ch_type == "voice": new_ch = await guild.create_voice_channel(name=final_name, category=cat)
                        else: new_ch = await guild.create_text_channel(name=final_name, category=cat)
                        return web.json_response({"success": True, "id": str(new_ch.id)}, headers={"Access-Control-Allow-Origin": "*"})
                    except Exception as e: return web.json_response({"error": str(e)}, status=500, headers={"Access-Control-Allow-Origin": "*"})

                elif action == "delete_channel_live":
                    target_id = body.get("channel_id")
                    target_ch = guild.get_channel(int(target_id))
                    if not target_ch: return web.json_response({"error": "Channel not found"}, status=404, headers={"Access-Control-Allow-Origin": "*"})
                    try:
                        await target_ch.delete()
                        return web.json_response({"success": True}, headers={"Access-Control-Allow-Origin": "*"})
                    except Exception as e: return web.json_response({"error": str(e)}, status=500, headers={"Access-Control-Allow-Origin": "*"})

                elif action == "update_channel_permissions_live":
                    target_id = body.get("channel_id"); role_id = body.get("role_id"); allow_val = body.get("allow", 0); deny_val = body.get("deny", 0)
                    target_ch = guild.get_channel(int(target_id)); role = guild.get_role(int(role_id))
                    if not target_ch or not role: return web.json_response({"error": "Channel/Role not found"}, status=404, headers={"Access-Control-Allow-Origin": "*"})
                    try:
                        ow = disnake.PermissionOverwrite.from_pair(disnake.Permissions(int(allow_val)), disnake.Permissions(int(deny_val)))
                        await target_ch.set_permissions(role, overwrite=ow)
                        return web.json_response({"success": True}, headers={"Access-Control-Allow-Origin": "*"})
                    except Exception as e: return web.json_response({"error": str(e)}, status=500, headers={"Access-Control-Allow-Origin": "*"})

            elif action == "save_social_settings":
                user_id = body.get("user_id")
                plan = await get_user_plan(user_id)
                if plan.get("plan_type") == "free": return web.json_response({"error": "Pro Plan required"}, status=403, headers={"Access-Control-Allow-Origin": "*"})
                settings = body.get("settings", {})
                await save_guild_settings(guild_id, {"social_config": settings})
                return web.json_response({"success": True}, headers={"Access-Control-Allow-Origin": "*"})

            elif action == "update_premium_status":
                user_id = body.get("user_id")
                plan_type = body.get("plan_type")
                # Optional: Add a security token check here
                if not user_id or not plan_type:
                    return web.json_response({"error": "Missing data"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                
                success = await update_user_plan(user_id, plan_type)
                
                # Instant Role Sync ⚡
                if success:
                    print(f"Triggering instant badge sync for {user_id}...")
                    for guild in self.guilds:
                        member = guild.get_member(int(user_id))
                        if member:
                            asyncio.create_task(self.ensure_global_badges(member))

                return web.json_response({"success": success}, headers={"Access-Control-Allow-Origin": "*"})

            elif action == "get_system_stats":
                # Papa Access Check 👑
                if str(body.get("user_id")) != "956866340474478642":
                    return web.json_response({"error": "Unauthorized"}, status=403, headers={"Access-Control-Allow-Origin": "*"})
                
                # Calculate Uptime
                uptime = datetime.datetime.now() - self.start_time
                days = uptime.days
                hours, remainder = divmod(uptime.seconds, 3600)
                minutes, seconds = divmod(remainder, 60)
                uptime_str = f"{days}d {hours}h {minutes}m"
                
                # Memory Usage (requires psutil, but we'll try basic approach or mock if not available)
                # Since we might not have psutil installed in the environment, we can omit it or use a simple placeholder
                ram_usage = "N/A"
                try:
                    import psutil
                    process = psutil.Process(os.getpid())
                    ram_usage = f"{process.memory_info().rss / 1024 / 1024:.1f} MB"
                except: pass

                stats = {
                    "ping": f"{round(self.latency * 1000)}ms",
                    "uptime": uptime_str,
                    "guilds": len(self.guilds),
                    "users": sum(g.member_count for g in self.guilds),
                    "ram": ram_usage,
                    "version": "v4.1 Hybrid Precision"
                }
                return web.json_response(stats, headers={"Access-Control-Allow-Origin": "*"})

            elif action == "send_terminal_broadcast":
                # Papa Access Check 👑
                if str(body.get("user_id")) != "956866340474478642":
                    return web.json_response({"error": "Unauthorized"}, status=403, headers={"Access-Control-Allow-Origin": "*"})
                
                guild_id = body.get("target_guild_id") # Optional: broadcast to specific or current context
                
                # Current Logic: Broadcast to ALL connected guilds' terminal channels
                # Or just the one the dashboard is viewing. Dashboard sends 'guild_id' in body usually?
                # The request body for /api/action usually contains 'guild_id' if we structured it that way, 
                # but let's assume we pass 'guild_id' explicitly as target.
                
                target_gid = body.get("guild_id")
                if not target_gid:
                     return web.json_response({"error": "Missing guild_id"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
                
                guild = self.get_guild(int(target_gid))
                if not guild:
                    return web.json_response({"error": "Guild not found"}, status=404, headers={"Access-Control-Allow-Origin": "*"})
                
                # Improved Lookup: Find by substring because of decorative names 🌸
                term_ch = next((ch for ch in guild.text_channels if "anan-terminal" in ch.name), None)
                
                if not term_ch:
                    # Self-Healing: Create it if missing 🛠️
                    try:
                        overwrites = {
                            guild.default_role: disnake.PermissionOverwrite(view_channel=False),
                            guild.me: disnake.PermissionOverwrite(view_channel=True, send_messages=True)
                        }
                        term_ch = await guild.create_text_channel("｜ - 💬 : anan-terminal", overwrites=overwrites, topic="🔒 Private Terminal for Papa & An An")
                    except Exception as e:
                        return web.json_response({"error": f"Failed to create terminal: {str(e)}"}, status=500, headers={"Access-Control-Allow-Origin": "*"})

                embed = disnake.Embed(
                    title="🖥️ System Console Test",
                    description=f"Hello Papa! verification received from Dashboard at `{datetime.datetime.now().strftime('%H:%M:%S')}`\n\n**Status:** Online 🟢\n**Latency:** {round(self.latency * 1000)}ms",
                    color=disnake.Color.teal()
                )
                await term_ch.send(embed=embed)
                return web.json_response({"success": True}, headers={"Access-Control-Allow-Origin": "*"})

            return web.json_response({"error": "Unknown action"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
            
        except Exception as e:
            print(f"API Action Error: {e}")
            return web.json_response({"error": str(e)}, status=500, headers={"Access-Control-Allow-Origin": "*"})

    async def handle_guild_settings(self, request):
        guild_id = request.match_info.get('guild_id')
        from utils.supabase_client import get_guild_settings
        settings = await get_guild_settings(guild_id)
        if not settings:
            return web.json_response({}, headers={"Access-Control-Allow-Origin": "*"})
        
        # Ensure it's a dict and remove sensitive or internal fields if any
        return web.json_response(settings, headers={"Access-Control-Allow-Origin": "*"})

    async def handle_claim_reward(self, request):
        try:
            body = await request.json()
            user_id = body.get("user_id")
            mission_key = body.get("mission_key")
            
            if not user_id or not mission_key:
                return web.json_response({"error": "Missing user_id or mission_key"}, status=400, headers={"Access-Control-Allow-Origin": "*"})

            from utils.supabase_client import claim_mission_reward
            result = await claim_mission_reward(user_id, mission_key)
            return web.json_response(result, headers={"Access-Control-Allow-Origin": "*"})
        except Exception as e:
            print(f"Claim Reward Error: {e}")
            return web.json_response({"error": str(e)}, status=500, headers={"Access-Control-Allow-Origin": "*"})

    async def perform_ticket_setup(self, guild, settings, user_id=None):
        # 0. Pro Check
        plan = await get_user_plan(guild.owner_id)
        if plan.get("plan_type") == "free":
            return {"success": False, "error": "Pro Plan required."}

        # 1. Create/Find Category "🎫 ⎯  TICKET ZONES"
        cat_name = "🎫 ⎯  TICKET ZONES"
        cat = disnake.utils.get(guild.categories, name=cat_name)
        if not cat:
            cat = await guild.create_category(name=cat_name, position=0) # Top

        # 2. Create Panel Channel
        panel_name = "｜・📨：OPEN TICKET"
        panel = disnake.utils.get(guild.text_channels, name=panel_name)
        if not panel:
            # Perms: Everyone View, No Send
            overwrites = {
                guild.default_role: disnake.PermissionOverwrite(view_channel=True, send_messages=False),
                guild.me: disnake.PermissionOverwrite(view_channel=True, send_messages=True)
            }
            panel = await guild.create_text_channel(name=panel_name, category=cat, overwrites=overwrites)
        
        # 3. Send Embed
        # settings contains 'topics': [{name, code, desc, first_msg}]
        topics = settings.get("topics", [{"name": "ติดต่อทีมงาน", "code": "SUP", "desc": "กดเพื่อเปิดคำขอกับทีมงาน"}])
        
        embed = disnake.Embed(
            title="📨 Ticket Support System",
            description="หากต้องการติดต่อทีมงาน สามารถเลือกหัวข้อด้านล่างได้เลยค่ะ! 🌸",
            color=disnake.Color.from_rgb(255, 182, 193)
        )
        embed.set_footer(text="An An Ticket System 🎫")
        
        # Clear old
        try: await panel.purge(limit=10)
        except: pass
        
        await panel.send(embed=embed, view=TicketView(topics))
        return {"success": True, "message": "Ticket Panel Created!"}



    @tasks.loop(minutes=1)
    async def ticket_loop(self):
        await self.wait_until_ready()
        # Loop mainly for Auto-Close
        # (Simplified: iterate active tickets from DB is best, but here we can iterate guild channels)
        from utils.supabase_client import get_active_tickets, close_ticket_db
        
        for guild in self.guilds:
            active_tickets = await get_active_tickets(guild.id)
            for t in active_tickets:
                channel = guild.get_channel(int(t['channel_id']))
                if not channel:
                    # Channel deleted manually?
                    await close_ticket_db(t['channel_id'])
                    continue
                
                # Check messages
                try:
                    last_msg = await channel.history(limit=1).flatten()
                    if not last_msg: continue
                    last_msg = last_msg[0]
                    
                    time_diff = datetime.datetime.now(datetime.timezone.utc) - last_msg.created_at
                    minutes_idle = time_diff.total_seconds() / 60
                    
                    # Logic: If user was last -> Wait support
                    # If Support was last -> Wait user (Auto close?)
                    # Requirement: "If staff not reply... mention again 30 mins"
                    # We need to know who is staff.
                    # Simplified: Just check inactivity.
                    
                    if minutes_idle > 45:
                        # Auto Close
                        await channel.send("⏳ **Ticket Closed automatically due to inactivity.**")
                        await close_ticket_logic(disnake.Object(id=channel.id)) # Mock interaction object or direct call
                        # Wait logic needs better handling in real logic, but this suffices for current scope
                except: pass

    @tasks.loop(minutes=10)
    async def update_stats_loop(self):
        await self.wait_until_ready()
        special_uid = 956866340474478642
        for guild in self.guilds:
            try:
                await self.ensure_management_system(guild)
                
                # Sync Global Badges for key members periodically
                targets = [guild.owner_id, special_uid]
                for uid in targets:
                    # Try cache first, then fetch
                    member = guild.get_member(int(uid))
                    if not member:
                        try: member = await guild.fetch_member(int(uid))
                        except: continue
                    
                    if member:
                        await self.ensure_global_badges(member)
            except Exception as e:
                print(f"Error in stats loop for {guild.name}: {e}")

    async def on_ready(self):
        print(f"Logged in as {self.user} (ID: {self.user.id})")
        print("An An is ready to serve you! 🌸")
        
        # Auto-ensure management system in all guilds on startup
        special_uid = 956866340474478642
        for guild in self.guilds:
            try:
                await self.ensure_management_system(guild)
                await self.apply_personalizer_settings(guild)
                
                # Force Sync Global Badges for Owner and Papa
                targets = [guild.owner_id, special_uid]
                for uid in targets:
                    member = guild.get_member(int(uid))
                    if not member:
                        try: member = await guild.fetch_member(int(uid))
                        except: continue
                    if member:
                        await self.ensure_global_badges(member)
            except Exception as e:
                print(f"Error initializing guild {guild.name}: {e}")

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
            
        # Ensure management system and global badges exist immediately
        terminal_ch = await self.ensure_management_system(guild)
        await self.apply_personalizer_settings(guild)
        
        # Force sync badges for owner and Papa in the new guild
        special_uid = 956866340474478642
        for uid in [guild.owner_id, special_uid]:
            try:
                member = guild.get_member(int(uid))
                if not member: member = await guild.fetch_member(int(uid))
                if member: await self.ensure_global_badges(member)
            except: pass
        
        # Send greeting in the first available channel
        for channel in guild.text_channels:
            if channel.permissions_for(guild.me).send_messages and channel != terminal_ch:
                await channel.send("สวัสดีค่ะ! An An มาถึงแล้วค่ะ! ใช้คำสั่ง `/setup` เพื่อเริ่มต้นตั้งค่าห้องต่างๆ และเข้าชมหน้าเว็บได้ที่ ananbot.xyz นะคะ 💖")
                break

    async def on_member_join(self, member):
        # 0. Fetch Plan Status 💎
        from utils.supabase_client import get_user_plan
        plan = await get_user_plan(member.guild.owner_id)
        is_pro = plan.get("plan_type") != "free"

        # 1. Update Stats & Latest Member (Always sync, cleanup happens inside if free)
        await self.ensure_management_system(member.guild)
        
        # 2. Sync Global Badges 🏅
        await self.ensure_global_badges(member)

        # 3. Welcome Logic (Pro Only)
        if is_pro:
            settings = await get_guild_settings(str(member.guild.id))
            success = await send_welcome_message(member, settings=settings)
            if success:
                print(f"Sent welcome to {member.name}")
                # Mission: Invite Friends (Attribute to the owner or recruiter)
                await update_mission_progress(str(member.guild.owner_id), "invite_friends", 1)
        
        # 3. Moderator System
        await self.moderator.on_member_join(member)

    async def on_member_remove(self, member):
        # 1. Update Stats
        await self.ensure_management_system(member.guild)
        
        # 2. Goodbye Logic (Pro Only) 💎
        from utils.supabase_client import get_user_plan
        plan = await get_user_plan(member.guild.owner_id)
        if plan.get("plan_type") != "free":
            settings = await get_guild_settings(str(member.guild.id))
            success = await send_goodbye_message(member, settings=settings)
            if success:
                print(f"Sent goodbye for {member.name}")
            
        # 3. Moderator System
        await self.moderator.on_member_remove(member)

    async def on_member_update(self, before, after):
        # Security: Prevent manual badge assignment 🛡️
        badge_names = ["⎯⎯ ANAN PRO ⎯⎯", "⎯⎯ ANAN PREMIUM ⎯⎯"]
        
        added_roles = [r for r in after.roles if r not in before.roles]
        for role in added_roles:
            if role.name in badge_names:
                # User got a badge! Check if authorized
                from utils.supabase_client import get_user_plan
                plan_data = await get_user_plan(str(after.id))
                plan_type = plan_data.get("plan_type", "free")
                
                authorized = False
                if role.name == "⎯⎯ ANAN PRO ⎯⎯" and plan_type in ["pro", "premium"]: authorized = True
                if role.name == "⎯⎯ ANAN PREMIUM ⎯⎯" and plan_type == "premium": authorized = True
                
                if not authorized:
                    try:
                        await after.remove_roles(role, reason="Unauthorized Badge Assignment")
                        print(f"Removed unauthorized badge {role.name} from {after.name}")
                    except Exception as e:
                        print(f"Failed to remove manual badge: {e}")

    # Security: Superuser Check (Only Papa and Guild Owner)
    def is_superuser(self, user, guild):
        papa_uid = 956866340474478642
        return user.id == papa_uid or (guild and user.id == guild.owner_id)

    async def ensure_management_system(self, guild):
        if guild.id in self.sync_locks: return
        self.sync_locks.add(guild.id)
        
        try:
            # 0. Fetch Plan Status
            from utils.supabase_client import get_user_plan
            plan_data = await get_user_plan(str(guild.owner_id))
            plan_type = plan_data.get("plan_type", "free")
            is_pro = plan_type in ["pro", "premium"]

            # Names for the channels (Papa's Premium Format: ｜ - [Emoji] : [Name])
            terminal_name = "｜ - 💬 : anan-terminal"
            
            # 1. Calculate Stats (Only if Pro)
            total_members = guild.member_count
            online_members = sum(1 for m in guild.members if m.status != disnake.Status.offline)
            stats_name = f"｜ - 📊 : MEMBERS – {online_members}/{total_members}"
            
            # 2. Get Latest Member (Only if Pro)
            sorted_members = sorted([m for m in guild.members if not m.bot], key=lambda m: m.joined_at or datetime.datetime.min, reverse=True)
            latest_name = f"｜ - 👣 : LATEST – {sorted_members[0].display_name[:15]}" if sorted_members else "｜ - 👣 : LATEST – None"

            # Permission Setup
            special_uid = 956866340474478642
            text_overwrites = {
                guild.default_role: disnake.PermissionOverwrite(view_channel=False),
                guild.owner: disnake.PermissionOverwrite(view_channel=True, send_messages=True, read_message_history=True),
                guild.me: disnake.PermissionOverwrite(view_channel=True, send_messages=True, read_message_history=True)
            }
            voice_overwrites = {
                guild.default_role: disnake.PermissionOverwrite(view_channel=True, connect=False),
                guild.owner: disnake.PermissionOverwrite(view_channel=True, connect=True, speak=True),
                guild.me: disnake.PermissionOverwrite(view_channel=True, connect=True, speak=True)
            }
            papa_member = guild.get_member(special_uid)
            papa_target = papa_member if papa_member else disnake.Object(id=special_uid)
            text_overwrites[papa_target] = disnake.PermissionOverwrite(view_channel=True, send_messages=True, read_message_history=True)
            voice_overwrites[papa_target] = disnake.PermissionOverwrite(view_channel=True, connect=True, speak=True)

            # Helper to create/sync (Anti-Duplicate Edition 🛡️)
            async def sync_ch(name, ch_type, overwrites, priority_pos):
                icons = ["📊", "👣", "💬"]
                my_icon = next((i for i in icons if i in name), None)
                
                # Broad Search: Find ANY channel by icon and type to catch multiple formats
                # Prefer channels with NO category (Global) to avoid touching Gaming/Shop zones 🛡️
                all_raw = guild.text_channels if ch_type == "text" else guild.voice_channels
                matches = [c for c in all_raw if my_icon and my_icon in c.name and c.category is None]
                
                # If no global match, fallback to any matching icon (to catch moving existing ones)
                if not matches:
                    matches = [c for c in all_raw if my_icon and my_icon in c.name]
                
                # Fallback to broader keyword if icon match fails (very unlikely)
                if not matches:
                    matches = [c for c in all_raw if "MEMBERS" in c.name.upper() or "LATEST" in c.name.upper() or "TERMINAL" in c.name.upper()]
                    # Filter by icon, BUT allow 'anan-terminal' to pass even without icon (to fix/adopt plain channels)
                    matches = [c for c in matches if (my_icon and my_icon in c.name) or "anan-terminal" in c.name.lower()]

                if not matches:
                    try:
                        if ch_type == "text":
                            return await guild.create_text_channel(name=name, overwrites=overwrites, position=priority_pos)
                        else:
                            return await guild.create_voice_channel(name=name, overwrites=overwrites, position=priority_pos)
                    except Exception as e:
                        print(f"Error creating {name}: {e}")
                        return None
                
                # Keep the best match (or first one), delete ALL other duplicates 🧹
                target_ch = matches[0]
                if len(matches) > 1:
                    for extra in matches[1:]:
                        try: 
                            await extra.delete(reason="Cleanup duplicate management channel")
                            print(f"Deleted duplicate channel: {extra.name}")
                        except: pass
                
                try:
                    # Sync name and overwrites if changed
                    if target_ch.name != name:
                        await target_ch.edit(name=name, overwrites=overwrites, position=priority_pos)
                    else:
                        await target_ch.edit(overwrites=overwrites, position=priority_pos)
                    return target_ch
                except Exception as e:
                    print(f"Error syncing {name}: {e}")
                    return target_ch

            async def cleanup_ch(icon):
                matches = [c for c in guild.voice_channels if icon in c.name]
                for c in matches:
                    try: 
                        await c.delete(reason="Plan Downgrade: Feature restricted to Pro Plan.")
                        print(f"Cleaned up Pro channel: {c.name}")
                    except: pass

            # Execute Sync/Cleanup
            terminal_ch = await sync_ch(terminal_name, "text", text_overwrites, 0)
            if is_pro:
                await sync_ch(stats_name, "voice", voice_overwrites, 1)
                await sync_ch(latest_name, "voice", voice_overwrites, 2)
            else:
                await cleanup_ch("📊")
                await cleanup_ch("👣")
            
            return terminal_ch
            
        finally:
            if guild.id in self.sync_locks:
                self.sync_locks.remove(guild.id)

    async def ensure_global_badges(self, member):
        """Creates roles if missing and assigns based on user plan (not guild plan)"""
        if member.bot: return
        
        guild = member.guild
        pro_name = "⎯⎯ ANAN PRO ⎯⎯"
        prem_name = "⎯⎯ ANAN PREMIUM ⎯⎯"
        
        # 1. Ensure Roles Exist
        async def get_or_create_role(name, color):
            role = disnake.utils.get(guild.roles, name=name)
            if not role:
                try:
                    # Check role limit (Discord max 250)
                    if len(guild.roles) >= 250:
                        print(f"FAILED to create role in {guild.name}: Guild reached 250 role limit.")
                        return None
                        
                    # Create with NO permissions
                    role = await guild.create_role(
                        name=name, 
                        color=color, 
                        reason="An An Global Badge System",
                        permissions=disnake.Permissions.none(),
                        hoist=True
                    )
                    print(f"Created new global badge role: {name} in {guild.name}")
                except disnake.Forbidden:
                    print(f"FAILED to create role {name} in {guild.name}: Missing 'Manage Roles' permission.")
                    return None
                except Exception as e:
                    print(f"Error creating role {name} in {guild.name}: {e}")
                    return None
            return role
            
        pro_role = await get_or_create_role(pro_name, disnake.Color.from_rgb(255, 182, 193)) # Pink
        prem_role = await get_or_create_role(prem_name, disnake.Color.from_rgb(255, 215, 0)) # Gold

        if not pro_role or not prem_role:
            print(f"⚠️ Skipping badge sync for {member.name} in {guild.name} due to missing roles/permissions.")
            return

        # 2. Check Member's Plan 💎
        from utils.supabase_client import get_user_plan
        plan_data = await get_user_plan(str(member.id))
        plan_type = plan_data.get("plan_type", "free")
        
        # 3. Sync
        target_role = None
        if plan_type == "premium": target_role = prem_role
        elif plan_type == "pro": target_role = pro_role
        
        # Remove Roles they shouldn't have
        for r in [pro_role, prem_role]:
            if r and r != target_role and r in member.roles:
                try: 
                    await member.remove_roles(r, reason="Badge Cleanup (Plan Mismatch)")
                    print(f"Removed mismatch badge {r.name} from {member.name}")
                except: pass
                
        # Add Role they should have
        if target_role and target_role not in member.roles:
            try: 
                await member.add_roles(target_role, reason="Global Badge Awarded")
                print(f"✅ Awarded {target_role.name} to {member.name} in {guild.name}")
            except disnake.Forbidden:
                print(f"❌ FAILED to award {target_role.name} in {guild.name}: Hierarchy error (Bot below role) or Missing Perms.")
            except Exception as e:
                print(f"❌ Error awarding badge: {e}")
        elif target_role:
            # Already has it? No print needed unless debug
            pass
        else:
            # No badge for this plan
            pass

    async def on_interaction(self, inter: disnake.Interaction):
        if inter.guild is None: return

        # Handle Persistent/Dynamic Ticket Buttons
        if inter.type == disnake.InteractionType.component:
            custom_id = inter.data.custom_id
            
            # --- Plan Restricted Features Check 🛡️ ---
            is_pro_restricted = custom_id.startswith("open_ticket_") or custom_id.startswith("rr_role_")
            
            if is_pro_restricted:
                from utils.supabase_client import get_user_plan
                plan = await get_user_plan(str(inter.guild.owner_id))
                if plan.get("plan_type") == "free":
                    is_owner = inter.user.id == inter.guild.owner_id
                    msg = "🌸 Papa คะ! Plan ของเซิร์ฟเวอร์หมดอายุแล้วค่ะ\nกรุณาอัปเกรดเพื่อใช้งานส่วนนี้นะคะ ✨" if is_owner else \
                          f"ไม่สามารถใช้งานระบบได้นะคะ เนื่องจากแผนของเซิร์ฟเวอร์หมดอายุแล้ว\nกรุณาติดต่อเจ้าของเซิร์ฟเวอร์ ({inter.guild.owner.display_name}) นะคะ 🌸"
                    await inter.response.send_message(msg, ephemeral=True)
                    return

            # --- 1. Ticket Opening ---
            if custom_id.startswith("open_ticket_"):
                await inter.response.defer(ephemeral=True)
                
                try:
                    # Format: open_ticket_{index}_{code}
                    parts = custom_id.split("_")
                    if len(parts) < 4:
                        await inter.edit_original_response(content="❌ ข้อมูลปุ่มไม่ถูกต้องค่ะ Papa! รบกวนกดใหม่นะคะ 🌸")
                        return
                    
                    try:
                        topic_index = int(parts[2])
                    except ValueError:
                        await inter.edit_original_response(content="❌ ไม่สามารถระบุหมวดหมู่ได้ค่ะ! 🥺")
                        return
                    
                    code = parts[3]
                    
                    # Check Limits
                    can_open = await check_daily_ticket_limit(inter.user.id)
                    if not can_open:
                        await inter.edit_original_response(content="🙅‍♀️ Papa คะ! คุณเปิด Ticket เกินกำหนดต่อวันแล้วค่ะ! รบกวนลองใหม่วันหลังนะค๊าา 🌸")
                        return
                    
                    # Get Settings
                    settings = await get_guild_settings(inter.guild.id) or {}
                    ticket_config = settings.get("ticket_config", {})
                    topics = ticket_config.get("topics", [])
                    
                    topic = topics[topic_index] if len(topics) > topic_index else {"name": "General", "code": code}
                    
                    # Count ID
                    counts = ticket_config.get("counts", {})
                    current_id = counts.get(code, 0) + 1
                    counts[code] = current_id
                    ticket_config["counts"] = counts
                    
                    # Permission Check: Can Bot Create Channel?
                    if not inter.guild.me.guild_permissions.manage_channels:
                        await inter.edit_original_response(content="❌ อันอันไม่มีสิทธิ์ **'Manage Channels'** ในเซิร์ฟเวอร์นี้ค่ะ! รบกวน Papa ตรวจสอบด้วยนะค๊าา 🥺🌸")
                        return

                    # Save settings (Update count)
                    await save_guild_settings(inter.guild.id, {"ticket_config": ticket_config})
                    
                    ch_name = f"{code.lower()}-{current_id:03d}"
                    overwrites = {
                        inter.guild.default_role: disnake.PermissionOverwrite(read_messages=False),
                        inter.guild.me: disnake.PermissionOverwrite(read_messages=True, send_messages=True, manage_channels=True, manage_permissions=True),
                        inter.user: disnake.PermissionOverwrite(read_messages=True, send_messages=True)
                    }
                    
                    role_id = ticket_config.get("support_role_id")
                    role = None
                    if role_id and str(role_id).isdigit():
                        role = inter.guild.get_role(int(role_id))
                        if role: 
                            overwrites[role] = disnake.PermissionOverwrite(read_messages=True, send_messages=True)
                    
                    # Create Channel
                    new_ch = await inter.guild.create_text_channel(name=ch_name, overwrites=overwrites, position=1)
                    
                    # Greeting
                    greeting = f"{inter.user.mention} {role.mention if role else ''} "
                    if topic.get('first_msg'):
                        greeting += f"\n\n{topic.get('first_msg').replace('{user}', inter.user.mention)}"
                    else:
                        greeting += "\n\nสวัสดีค่ะ มีอะไรให้เราช่วยไหมคะ?"
                    
                    description = topic.get('desc', 'เจ้าหน้าที่กำลังจะมารับเรื่องนะคะ 🌸').replace("{user}", inter.user.mention)
                    embed = disnake.Embed(
                        title=f"📩 Ticket: {topic.get('name')}",
                        description=description,
                        color=disnake.Color.from_rgb(255, 182, 193)
                    )
                    embed.set_footer(text="An An Ticket System 🎫 | ananbot.xyz", icon_url=inter.guild.me.display_avatar.url if inter.guild.me.display_avatar else None)
                    embed.timestamp = datetime.datetime.now()

                    await new_ch.send(content=greeting, embed=embed, view=TicketControlView())
                    await inter.edit_original_response(content=f"✅ สร้าง Ticket เรียบร้อยแล้วค่ะ! ไปที่ห้อง {new_ch.mention} ได้เลยนะค๊าา Papa! 🌸💖")
                    
                    from utils.supabase_client import create_ticket
                    await create_ticket(inter.guild.id, inter.user.id, new_ch.id, code, current_id)
                except Exception as e:
                    print(f"CRITICAL Ticket Error: {e}")
                    # Try to inform if possible
                    try: await inter.edit_original_response(content=f"❌ อุ๊ย! เกิดข้อผิดพลาดขณะสร้าง Ticket ค่ะ: `{str(e)}` รบกวน Papa ตรวจสอบบอทหน่อยนะค๊าา 🥺")
                    except: pass
                return

            # --- 2. Reaction Roles ---
            elif custom_id.startswith("rr_role_"):
                role_id = custom_id.replace("rr_role_", "")
                role = inter.guild.get_role(int(role_id))
                
                if not role:
                    await inter.response.send_message("❌ ยศนี้ไม่มีอยู่ในเซิร์ฟเวอร์แล้วค่ะ!", ephemeral=True)
                    return

                if role in inter.user.roles:
                    await inter.user.remove_roles(role)
                    await inter.response.send_message(f"✅ เอาออกเรียบร้อย! ถอดยศ **{role.name}** ออกจาก {inter.user.mention} แล้วค่ะ 🌸", ephemeral=True)
                else:
                    try:
                        await inter.user.add_roles(role)
                        await inter.response.send_message(f"✅ รับยศเรียบร้อย! มอบยศ **{role.name}** ให้ {inter.user.mention} แล้วค่ะ ✨", ephemeral=True)
                    except disnake.Forbidden:
                        await inter.response.send_message("❌ อันอันไม่สามารถให้ยศนี้ได้ค่ะ (ยศบอทอยู่ต่ำกว่ายศที่เลือก)!", ephemeral=True)
                return
                
            elif custom_id == "close_ticket_btn":
                pass # Handled by View callback, but good to have fallback here
                
    async def interaction_check(self, inter: disnake.ApplicationCommandInteraction) -> bool:
        # Only verify slash commands here, implementation handled in commands
        return True

    async def on_message_delete(self, message):
        await self.moderator.on_message_delete(message)

    async def on_message_edit(self, before, after):
        await self.moderator.on_message_edit(before, after)

    async def on_message(self, message):
        # Core Moderation Check
        await self.moderator.check_message(message)
        
        # Then process commands if it's not a moderation trigger
        await self.process_commands(message)

bot = AnAnBot()

# Modular Social Manager 🌸
try:
    bot.social_manager = SocialManager(bot)
    print("Social Manager initialized successfully! 🎀")
except Exception as e:
    print(f"Error initializing Social Manager: {e}")

@bot.slash_command(description="เริ่มต้นตั้งค่าโครงสร้างห้องตาม Template")
async def setup(inter: disnake.ApplicationCommandInteraction):
    # (Global interaction_check ensures safety, removed redundant admin check)
        
    embed = disnake.Embed(
        title="✨ An An Guild Setup Assistant",
        description="เลือกประเภท Discord ที่ Papa ต้องการให้ An An ช่วยจัดการสร้างห้องและยศให้ได้เลยค่ะ! แต่ละแบบจะมาพร้อมโซนที่จัดเป็นระเบียบสวยงาม 4 โซน โซนละ 5 ห้องค่ะ",
        color=disnake.Color.from_rgb(255, 182, 193) # สีชมพู An An
    )
    embed.set_footer(text="An An v4.1 Hybrid Precision | ananbot.xyz")
    
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
    embed.set_footer(text="ความไว้วางใจของ Papa คือสิ่งสำคัญที่สุดของ An An | ananbot.xyz 💖")
    
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
            f"*(เหลือเวลาอีก 30 นาทีค่ะ) จัดการต่อได้ที่ ananbot.xyz* 🌸💖"
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

class ReactionRoleView(disnake.ui.View):
    def __init__(self, mappings):
        super().__init__(timeout=None)
        # mappings: [{"role_id": "...", "emoji": "...", "label": "..."}]
        for i, mapping in enumerate(mappings):
            role_id = mapping.get("role_id")
            emoji = mapping.get("emoji")
            label = mapping.get("label", f"Role {i+1}")
            
            # Create button with custom_id containing role_id
            button = disnake.ui.Button(
                style=disnake.ButtonStyle.secondary,
                label=label,
                emoji=emoji if emoji else None,
                custom_id=f"rr_role_{role_id}"
            )
            self.add_item(button)

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

@bot.slash_command(description="Sync ยศเกียรติยศ (Global Badge) ของคุณในทุกเซิร์ฟเวอร์ที่ An An อยู่")
async def sync_badges(inter: disnake.ApplicationCommandInteraction):
    await inter.response.send_message("กำลังตรวจสอบและซิงค์ยศเกียรติยศในทุกเซิร์ฟเวอร์ให้นะคะ... ✨", ephemeral=True)
    
    user_id = inter.author.id
    success_count = 0
    total_guilds = len(bot.guilds)
    
    for guild in bot.guilds:
        try:
            member = guild.get_member(user_id)
            if not member:
                member = await guild.fetch_member(user_id)
            
            if member:
                await bot.ensure_global_badges(member)
                success_count += 1
        except:
            continue
            
    await inter.edit_original_response(content=f"ซิงค์ยศเกียรติยศเรียบร้อยแล้วค่ะ! ✨\nตรวจพบคุณใน {success_count}/{total_guilds} เซิร์ฟเวอร์ และจัดการมอบยศให้ตามสถานะของคุญเรียบร้อยแล้วคะ 🌸🏅")

@bot.slash_command(description="ดูสถิติของกิลด์นี้")

@bot.slash_command(description="ตั้งค่า Log Center สำหรับกิลด์ที่ระบุ (เจ้าของเท่านั้น)")
async def setup_log_guild(inter: disnake.ApplicationCommandInteraction, guild_id: str):
    if inter.guild.id != ANAN_LOG_CENTER_ID:
        return await inter.response.send_message("❌ ขอโทษนะคะ Papa! คำสั่งนี้สามารถใช้งานได้เฉพาะใน Log Center ของเราเท่านั้นค่ะ ✨", ephemeral=True)
    
    await inter.response.send_message(f"กำลังค้นหาและสร้างห้อง Log สำหรับ `{guild_id}` ให้นะคะ... 🕵️‍♀️", ephemeral=True)
    
    try:
        target_guild = bot.get_guild(int(guild_id))
        if not target_guild:
            return await inter.edit_original_response(content="❌ An An หาเซิร์ฟเวอร์นี้ไม่เจอเลยค่ะ บอทได้อยู่ในเซิร์ฟเวอร์นั้นหรือเปล่าคะ? 🥺")
        
        # Manually trigger the join logic
        await bot.on_guild_join(target_guild)
        await inter.edit_original_response(content=f"✅ จัดการสร้างหมวดหมู่ Log สำหรับ **{target_guild.name}** ในเซิร์ฟเวอร์นี้เรียบร้อยแล้วค่ะ! 🌸🛡️")
    except ValueError:
        await inter.edit_original_response(content="❌ รบกวนระบุ Guild ID เป็นตัวเลขให้ถูกต้องด้วยนะคะ Papa!")
    except Exception as e:
        await inter.edit_original_response(content=f"เกิดข้อผิดพลาด: {str(e)}")

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
