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
    get_rollback_data
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
            return f"๏ฝใป{emoji}๏ผ{name.upper()}"
        return f"๏ฝใป{emoji}๏ผ{name.lower()}"

    def get_all_discord_permissions_info():
        # List of important permissions with Thai descriptions
        perms_list = [
            ("administrator", "เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (เธชเธดเธ—เธเธดเธชเธนเธเธชเธธเธ”)"),
            ("manage_guild", "เธเธฑเธ”เธเธฒเธฃเน€เธเธดเธฃเนเธเน€เธงเธญเธฃเน"),
            ("manage_roles", "เธเธฑเธ”เธเธฒเธฃเธขเธจ"),
            ("manage_channels", "เธเธฑเธ”เธเธฒเธฃเธเนเธญเธ"),
            ("kick_members", "เน€เธ•เธฐเธชเธกเธฒเธเธดเธ"),
            ("ban_members", "เนเธเธเธชเธกเธฒเธเธดเธ"),
            ("create_instant_invite", "เธชเธฃเนเธฒเธเธเธณเน€เธเธดเธ"),
            ("change_nickname", "เน€เธเธฅเธตเนเธขเธเธเธทเนเธญเน€เธฅเนเธเธ•เธฑเธงเน€เธญเธ"),
            ("manage_nicknames", "เธเธฑเธ”เธเธฒเธฃเธเธทเนเธญเน€เธฅเนเธเธเธนเนเธญเธทเนเธ"),
            ("manage_emojis", "เธเธฑเธ”เธเธฒเธฃเธญเธตเนเธกเธเธด"),
            ("manage_webhooks", "เธเธฑเธ”เธเธฒเธฃเน€เธงเนเธเธฎเธธเธ"),
            ("view_audit_log", "เธ”เธนเธเธฑเธเธ—เธถเธเธเธฒเธฃเธ•เธฃเธงเธเธชเธญเธ"),
            ("view_channel", "เธ”เธนเธเนเธญเธเธเนเธญเธกเธนเธฅ"),
            ("send_messages", "เธชเนเธเธเนเธญเธเธงเธฒเธก"),
            ("embed_links", "เธเธฑเธเธฅเธดเธเธเน"),
            ("attach_files", "เนเธเธเนเธเธฅเน"),
            ("read_message_history", "เธ”เธนเธเธฃเธฐเธงเธฑเธ•เธดเธเนเธญเธเธงเธฒเธก"),
            ("mention_everyone", "เธเธนเธ”เธเธธเธขเธ–เธถเธเธ—เธธเธเธเธ (@everyone)"),
            ("use_external_emojis", "เนเธเนเธญเธตเนเธกเธเธดเธเธญเธเน€เธเธดเธฃเนเธเน€เธงเธญเธฃเน"),
            ("add_reactions", "เน€เธเธดเนเธกเธเธเธดเธเธดเธฃเธดเธขเธฒ"),
            ("connect", "เน€เธเธทเนเธญเธกเธ•เนเธญเธซเนเธญเธเน€เธชเธตเธขเธ"),
            ("speak", "เธเธนเธ”เนเธเธซเนเธญเธเน€เธชเธตเธขเธ"),
            ("stream", "เธงเธดเธ”เธตเนเธญ/เธชเธ•เธฃเธตเธกเธซเธเนเธฒเธเธญ"),
            ("use_voice_activation", "เนเธเนเธเธฒเธฃเธ•เธฃเธงเธเธเธฑเธเน€เธชเธตเธขเธ"),
            ("priority_speaker", "เธเธนเนเธเธนเธ”เธเธเธชเธณเธเธฑเธ"),
            ("mute_members", "เธเธดเธ”เน€เธชเธตเธขเธเธชเธกเธฒเธเธดเธ"),
            ("deafen_members", "เธเธดเธ”เธซเธนเธชเธกเธฒเธเธดเธ"),
            ("move_members", "เธขเนเธฒเธขเธชเธกเธฒเธเธดเธ"),
            ("manage_messages", "เธเธฑเธ”เธเธฒเธฃเธเนเธญเธเธงเธฒเธก (เธฅเธ/เธเธฑเธเธซเธกเธธเธ”)"),
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
            dynamic_roles.append({"name": f"๐ฎ {game.strip().upper()} PLAYER", "color": 0x3498DB, "hoist": True, "permissions": "member"})
    elif template_name == "Fanclub" and "platforms" in extra_data:
        for plat in extra_data["platforms"]:
            dynamic_roles.append({"name": f"โจ {plat.strip().upper()} STREAMER", "color": 0xFD79A8, "hoist": True, "permissions": "member"})
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
            role_emoji = "๐‘ฅ"
            if level == "admin": role_emoji = "๐‘‘"
            elif level == "staff": role_emoji = "๐ก๏ธ"
            
            raw_name = crole["name"].strip().upper()
            # Apply design format if not already present
            role_name = f"๏ฝใป{role_emoji}๏ผ{raw_name}" if "๏ฝใป" not in raw_name else raw_name
            
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
            if name_clean in r_name_clean: return r_obj # Partial match (for 'Admin' matching '๐‘‘๏ผADMIN')
        return None

    # Help apply overwrites
    async def apply_setup_overwrites(target, perm_data):
        overwrites = {}
        target_name_lower = target.name.lower()
        
        # Security: Enforce Visibility (Only Rules, Verify, Welcome are visible to @everyone)
        starter_keywords = ["เธเธเธเธ•เธดเธเธฒ", "verify", "welcome"]
        is_starter = any(k in target_name_lower for k in starter_keywords)
        
        # 1. Start with Default Role (@everyone)
        everyone_overwrite = disnake.PermissionOverwrite()
        
        is_category = target.type == disnake.ChannelType.category
        has_category = hasattr(target, "category") and target.category is not None
        is_global_room = not is_category and not has_category
        
        # Keywords for Intelligent Mapping
        readonly_keywords = ["เธเธฃเธฐเธเธฒเธจ", "news", "info", "เนเธเนเธ", "rules", "เธงเธดเธเธต", "เธเธฃเธฐเธงเธฑเธ•เธด", "เธเธฃเธฐเน€เธ เธ—", "เธชเธดเธเธเนเธฒ", "ticket", "payment"]
        staff_keywords = ["staff", "เธเธเธฑเธเธเธฒเธ", "๐ "]
        admin_keywords = ["admin", "เนเธญเธ”เธกเธดเธ", "๐‘‘"]
        
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
        readonly_keywords = ["เธเธฃเธฐเธเธฒเธจ", "news", "info", "เนเธเนเธ", "rules", "เธงเธดเธเธต", "เธเธฃเธฐเธงเธฑเธ•เธด", "เธเธฃเธฐเน€เธ เธ—", "เธชเธดเธเธเนเธฒ", "ticket", "payment"]
        staff_keywords = ["staff", "เธเธเธฑเธเธเธฒเธ", "๐ "]
        admin_keywords = ["admin", "เนเธญเธ”เธกเธดเธ", "๐‘‘"]
        
        for role_obj, level in role_levels.items():
            if not is_starter:
                overwrite = disnake.PermissionOverwrite()
                
                is_admin_room = any(k in target_name_lower for k in admin_keywords)
                is_staff_room = any(k in target_name_lower for k in staff_keywords)
                is_managed_room = is_admin_room or is_staff_room
                
                # Visibility Check
                can_view = True
                
                # Papa's Request: เธ—เธธเธเธขเธจเธชเธฒเธกเธฒเธฃเธ–เธกเธญเธเน€เธซเนเธเนเธ”เนเธขเธเน€เธงเนเธ @everyone
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
            if "เน€เธกเนเธ” Boost" not in extra_data["options"] and "BOOST" in zone["name"]: continue
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
            special_keywords = ["เธเธเธเธ•เธดเธเธฒ", "verify", "welcome", "news", "info", "เนเธเนเธ", "admin", "staff"]
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
                if "๏ฝใป" not in ch_name:
                    ch_emoji = ch.get("emoji", "๐’ฌ" if ch["type"] == "text" else "๐”")
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
            cat = await guild.create_category(name=f"๐ฎ โฏ  {g_name} SPACE")
            
            # Specific Role for this game
            game_role = roles_map.get(f"๐ฎ {g_name} PLAYER")
            
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
            await create_game_ch("เธเนเธญเธกเธนเธฅ", "๐“ฃ")
            await create_game_ch("เธเธนเธ”เธเธธเธข", "๐’ฌ")
            await create_game_ch("เนเธฎเนเธฅเธ—เน", "๐๏ธ")
            await create_game_ch("เธซเธฒเน€เธเธทเนเธญเธ", "๐งฉ")
            
            # Dynamic Voice Channels based on Genre
            genre = get_game_genre(game)
            vc_names = ["LOBBY โฏ เธเธฑเนเธเน€เธฅเนเธ", "เธเธฑเนเธเน€เธฅเนเธ [2]", "เธเธฑเนเธเน€เธฅเนเธ [3]"]
            if genre == "FPS":
                vc_names = ["LOBBY โฏ เธเธฑเนเธเน€เธฅเนเธ", "TEAM A", "TEAM B"]
            elif genre == "FIVEM":
                vc_names = ["LOBBY โฏ เธเธฑเนเธเน€เธฅเนเธ", "GANG A", "GANG B"]
            elif genre == "STRATEGY":
                vc_names = ["LOBBY โฏ เธเธฑเนเธเน€เธฅเนเธ", "TEAM RED", "TEAM BLUE"]
            
            for i, vname in enumerate(vc_names):
                emoji = "๐๏ธ" if i == 0 else "๐”"
                await create_game_ch(vname, emoji, type="voice")

    elif template_name == "Fanclub" and "platforms" in extra_data:
        for plat in extra_data["platforms"]:
            p_name = plat.strip().upper()
            cat = await guild.create_category(name=f"๐“บ โฏ  {p_name} HUB")
            
            # Permission for streamer role
            plat_role = roles_map.get(f"โจ {p_name} STREAMER")
            
            await guild.create_text_channel(name=format_name("๐“ฃ", f"notice-{plat.lower()}"), category=cat)
            await guild.create_voice_channel(name=format_name("๐ฌ", f"{plat.lower()}-live", is_voice=True), category=cat)
            
            if plat_role:
                await guild.create_text_channel(name=format_name("๐’", f"{plat.lower()}-staff"), category=cat, overwrites={
                    guild.default_role: disnake.PermissionOverwrite(view_channel=False),
                    plat_role: disnake.PermissionOverwrite(view_channel=True, send_messages=True)
                })

    # New: Role Assignment Systems
    # ----------------------------
    
    # 4. Final step: Post Verification/Role selection messages
    verify_ch = next((c for c in guild.text_channels if "verify" in c.name), None)
    if verify_ch:
        embed = disnake.Embed(
            title="โ… เธขเธทเธเธขเธฑเธเธ•เธฑเธงเธ•เธเน€เธเธทเนเธญเน€เธเนเธฒเธชเธนเนเน€เธเธดเธฃเนเธเน€เธงเธญเธฃเน",
            description=(
                "เธขเธดเธเธ”เธตเธ•เนเธญเธเธฃเธฑเธเน€เธเนเธฒเธชเธนเนเธเธฃเธญเธเธเธฃเธฑเธงเธเธญเธเน€เธฃเธฒเธเนเธฐ! โจ\n\n"
                "เธเธฃเธธเธ“เธฒเธเธ”เธเธธเนเธกเธ”เนเธฒเธเธฅเนเธฒเธเน€เธเธทเนเธญเธขเธทเธเธขเธฑเธเธ•เธฑเธงเธ•เธเนเธฅเธฐเธฃเธฑเธเธขเธจเน€เธเธทเนเธญเน€เธเนเธฒเธ–เธถเธเธเธญเธกเธกเธนเธเธดเธ•เธตเนเธเธญเธเน€เธฃเธฒเธเธฐเธเธฐ\n\n"
                "*(Please click the button below to verify and access the server)*"
            ),
            color=disnake.Color.green()
        )
        # Determine member role name based on template
        member_role_name = ""
        if template_name == "Shop": member_role_name = "๐’ เธฅเธนเธเธเนเธฒเธ—เธฑเนเธงเนเธ | CUSTOMER"
        elif template_name == "Community": member_role_name = "๐‘ฅ เธชเธกเธฒเธเธดเธ | MEMBER"
        elif template_name == "Fanclub": member_role_name = "โค๏ธ เธเธฃเธญเธเธเธฃเธฑเธง | FANCLUB"
        
        await verify_ch.send(embed=embed, view=VerificationView(member_role_name))


    # If it's a game community, post role selection in "เธฃเธฑเธเธขเธจเธเธนเนเน€เธฅเนเธ"
    if template_name == "Community" and "games" in extra_data:
        game_role_ch = next((c for c in guild.text_channels if "เธฃเธฑเธเธขเธจเธเธนเนเน€เธฅเนเธ" in c.name), None)
        if game_role_ch:
            embed_roles = disnake.Embed(
                title="๐ฎ เน€เธฅเธทเธญเธเธขเธจเน€เธเธกเธ—เธตเน เธเธธเธ“ เน€เธฅเนเธ",
                description="เธเธ”เธเธธเนเธกเธ”เนเธฒเธเธฅเนเธฒเธเน€เธเธทเนเธญเธฃเธฑเธเธขเธจเน€เธเธกเธ—เธตเนเธ•เนเธญเธเธเธฒเธฃ เน€เธเธทเนเธญเน€เธเธดเธ”เธซเนเธญเธเธฅเธฑเธเน€เธเธเธฒเธฐเธชเธณเธซเธฃเธฑเธเน€เธเธกเธเธฑเนเธเน เธเนเธฐ! โจ",
                color=disnake.Color.blue()
            )
            await game_role_ch.send(embed=embed_roles, view=GameRoleView(extra_data["games"]))

    # 5. Post Guild Rules
    await post_guild_rules(guild, template_name)

class VerificationView(disnake.ui.View):
    def __init__(self, role_name):
        super().__init__(timeout=None)
        self.role_name = role_name

    @disnake.ui.button(label="เธขเธทเธเธขเธฑเธเธ•เธฑเธงเธ•เธ (Verify)", style=disnake.ButtonStyle.success, emoji="โ…", custom_id="verify_button")
    async def verify(self, button: disnake.ui.Button, inter: disnake.MessageInteraction):
        role = disnake.utils.get(inter.guild.roles, name=self.role_name)
        if role:
            if role in inter.author.roles:
                await inter.response.send_message(f"{inter.author.mention} เธกเธตเธขเธจเธเธตเนเธญเธขเธนเนเนเธฅเนเธงเธเธฐเธเธฐ! ๐ธ", ephemeral=True)
            else:
                await inter.author.add_roles(role)
                await inter.response.send_message(f"เธขเธดเธเธ”เธตเธ”เนเธงเธขเธเนเธฐ! {inter.author.mention} เนเธ”เนเธฃเธฑเธเธขเธจ **{self.role_name}** เน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธงเธเนเธฐ โจ๐’–", ephemeral=True)
        else:
            await inter.response.send_message("เธญเธธเนเธข! An An เธซเธฒเนเธกเนเน€เธเธญเน€เธฅเธขเธเนเธฐเธงเนเธฒเธ•เนเธญเธเนเธซเนเธขเธจเนเธซเธ เธฃเธเธเธงเธเนเธญเธ”เธกเธดเธเธ•เธฃเธงเธเธชเธญเธเธซเธเนเธญเธขเธเธฐเธเธฐ ๐ฅบ", ephemeral=True)

class GameRoleView(disnake.ui.View):
    def __init__(self, games):
        super().__init__(timeout=None)
        for game in games:
            game_name = game.strip().upper()
            button = disnake.ui.Button(
                label=game_name,
                style=disnake.ButtonStyle.secondary,
                emoji="๐ฎ",
                custom_id=f"game_role_{game_name}"
            )
            button.callback = self.make_callback(game_name)
            self.add_item(button)

    def make_callback(self, game_name):
        async def callback(inter: disnake.MessageInteraction):
            role_name = f"๐ฎ {game_name} PLAYER"
            role = disnake.utils.get(inter.guild.roles, name=role_name)
            if role:
                if role in inter.author.roles:
                    await inter.author.remove_roles(role)
                    await inter.response.send_message(f"เธขเธเน€เธฅเธดเธเธขเธจ **{role_name}** เน€เธฃเธตเธขเธเธฃเนเธญเธขเธเนเธฐ ๐ธ", ephemeral=True)
                else:
                    await inter.author.add_roles(role)
                    await inter.response.send_message(f"เธฃเธฑเธเธขเธจ **{role_name}** เน€เธฃเธตเธขเธเธฃเนเธญเธขเธเนเธฐ! เธฅเธธเธขเน€เธเธกเธเธฑเธเน€เธฅเธข โจ๐ฎ", ephemeral=True)
            else:
                await inter.response.send_message(f"An An เธซเธฒเธขเธจเนเธกเนเน€เธเธญเธเนเธฐ ๐ฅบ", ephemeral=True)
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
        await inter.response.send_message(f"เธฃเธฑเธเธ—เธฃเธฒเธเธเนเธฐ! An An เธเธณเธฅเธฑเธเธชเธฃเนเธฒเธเธฃเธฐเธเธเธชเธณเธซเธฃเธฑเธ {self.template_name} เธเธฃเนเธญเธกเธเนเธญเธกเธนเธฅเธ—เธตเน {inter.author.mention} เนเธซเนเธกเธฒเธเธฐเธเธฐ... โจ", ephemeral=True)
        
        extra_key = "games" if self.template_name == "Community" else "platforms"
        await perform_guild_setup(inter.guild, self.template_name, {extra_key: items})
        await inter.edit_original_response(content=f"เน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธงเธเนเธฐ {inter.author.mention}! เนเธเธฃเธเธชเธฃเนเธฒเธเนเธเธเธเธฃเธฑเธเนเธ•เนเธเน€เธญเธเน€เธชเธฃเนเธเธชเธกเธเธนเธฃเธ“เนเนเธฅเนเธงเธเนเธฐ! ๐ธ๐’–")

class ShopOptionView(disnake.ui.View):
    def __init__(self):
        super().__init__(timeout=60)
        self.options = []

    @disnake.ui.button(label="Nitro + Stream Status + เน€เธกเนเธ” Boost", style=disnake.ButtonStyle.premium, emoji="๐’")
    async def full_pack(self, button: disnake.ui.Button, inter: disnake.MessageInteraction):
        await inter.response.send_message("เน€เธฅเธทเธญเธเนเธเธเธเธฑเธ”เน€เธ•เนเธก! เธเธณเธฅเธฑเธเธฃเนเธฒเธขเธกเธเธ•เธฃเนเธชเธฃเนเธฒเธเธฃเนเธฒเธเนเธซเนเน€เธฅเธขเธเนเธฐ... ๐’โจ", ephemeral=True)
        await perform_guild_setup(inter.guild, "Shop", {"options": ["Nitro", "Stream Status", "เน€เธกเนเธ” Boost"]})
        await inter.edit_original_response(content=f"เธฃเนเธฒเธเธเนเธฒเนเธเธเธเธฑเธ”เน€เธ•เนเธกเธชเธฃเนเธฒเธเน€เธชเธฃเนเธเนเธฅเนเธงเธเนเธฐ {inter.author.mention}! ๐ธ")

    @disnake.ui.button(label="Nitro + Stream Status", style=disnake.ButtonStyle.primary, emoji="๐’")
    async def mid_pack(self, button: disnake.ui.Button, inter: disnake.MessageInteraction):
        await inter.response.send_message("เน€เธฅเธทเธญเธเนเธเธเธกเธฒเธ•เธฃเธเธฒเธ! เธเธณเธฅเธฑเธเธเธฑเธ”เธเธฒเธฃเนเธซเนเธเธฐเธเธฐ... ๐ ๏ธ", ephemeral=True)
        await perform_guild_setup(inter.guild, "Shop", {"options": ["Nitro", "Stream Status"]})
        await inter.edit_original_response(content=f"เธฃเนเธฒเธเธเนเธฒเนเธเธเธกเธฒเธ•เธฃเธเธฒเธเธชเธฃเนเธฒเธเน€เธชเธฃเนเธเนเธฅเนเธงเธเนเธฐ {inter.author.mention}! ๐ธ")

class CommunityTypeView(disnake.ui.View):
    def __init__(self):
        super().__init__(timeout=60)

    @disnake.ui.button(label="เธชเธฒเธขเนเธเธ—เธ—เธฑเนเธงเนเธ (Friend)", style=disnake.ButtonStyle.success, emoji="๐‘ฅ")
    async def friend_type(self, button: disnake.ui.Button, inter: disnake.MessageInteraction):
        await inter.response.send_message("เธชเธฒเธขเนเธเธ—เน€เธเนเธเธกเธดเธ•เธฃเธ เธฒเธ! เธเธณเธฅเธฑเธเธเธฑเธ”เนเธซเนเน€เธฅเธขเธเนเธฐ... ๐ธ", ephemeral=True)
        await perform_guild_setup(inter.guild, "Community")
        await inter.edit_original_response(content=f"เธเธญเธกเธกเธนเธเธดเธ•เธตเนเธชเธฒเธขเนเธเธ—เธชเธฃเนเธฒเธเน€เธชเธฃเนเธเนเธฅเนเธงเธเนเธฐ {inter.author.mention}! ๐’–")

    @disnake.ui.button(label="เธชเธฒเธขเน€เธเธกเน€เธกเธญเธฃเน (Game)", style=disnake.ButtonStyle.danger, emoji="๐ฎ")
    async def game_type(self, button: disnake.ui.Button, inter: disnake.MessageInteraction):
        await inter.response.send_modal(SetupModal("Community", "เธเธฃเธฑเธเนเธ•เนเธเธซเนเธญเธเน€เธเธก", "เธฃเธฐเธเธธเธเธทเนเธญเน€เธเธก (เธเธฑเนเธเธ”เนเธงเธขเน€เธเธฃเธทเนเธญเธเธซเธกเธฒเธข ,)", "เน€เธเนเธ Valorant, Roblox, Minecraft"))

class TemplateView(disnake.ui.View):
    def __init__(self, bot):
        super().__init__(timeout=60)
        self.bot = bot

    @disnake.ui.select(
        placeholder="เน€เธฅเธทเธญเธเธเธฃเธฐเน€เธ เธ— Discord Guild เธ—เธตเน เธเธธเธ“ เธ•เนเธญเธเธเธฒเธฃเธชเธฃเนเธฒเธ...",
        options=[
            disnake.SelectOption(label="Shop (เธฃเนเธฒเธเธเนเธฒ)", value="Shop", emoji="๐’", description="เธชเธฃเนเธฒเธเธซเนเธญเธเธชเธณเธซเธฃเธฑเธเธเธฒเธขเธเธญเธเนเธเธเน€เธฅเธทเธญเธเนเธเนเธเน€เธเธ"),
            disnake.SelectOption(label="Community (เธเธญเธกเธกเธนเธเธดเธ•เธตเน)", value="Community", emoji="๐ฎ", description="เน€เธเนเธเธเธนเธ”เธเธธเธขเธซเธฃเธทเธญเธฃเธฐเธเธธเน€เธเธกเธ—เธตเนเน€เธฅเนเธเนเธ”เน"),
            disnake.SelectOption(label="Fanclub (เนเธเธเธเธฅเธฑเธ)", value="Fanclub", emoji="๐‘‘", description="เธฃเธฐเธเธธเนเธเธฅเธ•เธเธญเธฃเนเธกเธ—เธตเนเนเธเนเธชเธ•เธฃเธตเธกเธกเธดเนเธเนเธ”เน"),
        ]
    )
    async def select_template(self, select: disnake.ui.Select, interaction: disnake.MessageInteraction):
        choice = select.values[0]
        
        if choice == "Shop":
            await interaction.response.send_message(f"{interaction.author.mention} เธญเธขเธฒเธเธเธฒเธขเธญเธฐเนเธฃเธเนเธฒเธเธเธฐ? เน€เธฅเธทเธญเธเนเธเนเธเน€เธเธเธ—เธตเนเธ•เนเธญเธเธเธฒเธฃเนเธ”เนเน€เธฅเธขเธเนเธฐ โจ", view=ShopOptionView(), ephemeral=True)
        elif choice == "Community":
            await interaction.response.send_message(f"เธเธญเธกเธกเธนเธเธดเธ•เธตเนเธเธญเธ {interaction.author.mention} เน€เธเนเธเนเธเธงเนเธซเธเธ”เธตเธเธฐ? ๐ฎ", view=CommunityTypeView(), ephemeral=True)
        elif choice == "Fanclub":
            await interaction.response.send_modal(SetupModal("Fanclub", "เธเธฃเธฑเธเนเธ•เนเธเธเนเธญเธเธชเธ•เธฃเธตเธก", "เธฃเธฐเธเธธเนเธเธฅเธ•เธเธญเธฃเนเธก (เธเธฑเนเธเธ”เนเธงเธขเน€เธเธฃเธทเนเธญเธเธซเธกเธฒเธข ,)", "เน€เธเนเธ Twitch, YouTube, TikTok"))

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

    async def run_web_server(self):
        app = web.Application()
        app.router.add_get('/api/stats', self.handle_stats)
        app.router.add_get('/api/guilds', self.handle_guilds)
        app.router.add_get('/api/guild/{guild_id}/stats', self.handle_guild_stats)
        app.router.add_get('/api/discord-permissions', self.handle_discord_permissions)
        app.router.add_get('/api/guild/{guild_id}/structure', self.handle_guild_structure)
        app.router.add_get('/api/ping', lambda r: web.Response(text="pong"))
        app.router.add_post('/api/action', self.handle_action)
        app.router.add_options('/api/action', self.handle_options)
        app.router.add_options('/api/stats', self.handle_options)
        app.router.add_options('/api/guilds', self.handle_options)
        app.router.add_options('/api/guild/{guild_id}/stats', self.handle_options)
        app.router.add_options('/api/guild/{guild_id}/structure', self.handle_options)
        app.router.add_options('/api/discord-permissions', self.handle_options)
        
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
                ("administrator", "เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (เธชเธดเธ—เธเธดเธชเธนเธเธชเธธเธ”)"),
                ("manage_guild", "เธเธฑเธ”เธเธฒเธฃเน€เธเธดเธฃเนเธเน€เธงเธญเธฃเน"),
                ("manage_roles", "เธเธฑเธ”เธเธฒเธฃเธขเธจ"),
                ("manage_channels", "เธเธฑเธ”เธเธฒเธฃเธเนเธญเธ"),
                ("kick_members", "เน€เธ•เธฐเธชเธกเธฒเธเธดเธ"),
                ("ban_members", "เนเธเธเธชเธกเธฒเธเธดเธ"),
                ("view_audit_log", "เธ”เธนเธเธฑเธเธ—เธถเธเธเธฒเธฃเธ•เธฃเธงเธเธชเธญเธ"),
                ("manage_messages", "เธเธฑเธ”เธเธฒเธฃเธเนเธญเธเธงเธฒเธก"),
                ("manage_nicknames", "เธเธฑเธ”เธเธฒเธฃเธเธทเนเธญเน€เธฅเนเธ"),
                ("manage_emojis", "เธเธฑเธ”เธเธฒเธฃเธญเธตเนเธกเธเธด"),
                ("view_channel", "เธ”เธนเธเนเธญเธเธเนเธญเธกเธนเธฅ"),
                ("send_messages", "เธชเนเธเธเนเธญเธเธงเธฒเธก"),
                ("embed_links", "เธเธฑเธเธฅเธดเธเธเน"),
                ("attach_files", "เนเธเธเนเธเธฅเน"),
                ("read_message_history", "เธ”เธนเธเธฃเธฐเธงเธฑเธ•เธดเธเนเธญเธเธงเธฒเธก"),
                ("mention_everyone", "เธเธนเธ”เธเธธเธขเธ–เธถเธเธ—เธธเธเธเธ"),
                ("add_reactions", "เน€เธเธดเนเธกเธเธเธดเธเธดเธฃเธดเธขเธฒ"),
                ("connect", "เน€เธเธทเนเธญเธกเธ•เนเธญเธซเนเธญเธเน€เธชเธตเธขเธ"),
                ("speak", "เธเธนเธ”เนเธเธซเนเธญเธเน€เธชเธตเธขเธ"),
                ("stream", "เธชเธ•เธฃเธตเธกเธซเธเนเธฒเธเธญ"),
                ("mute_members", "เธเธดเธ”เน€เธชเธตเธขเธเธชเธกเธฒเธเธดเธ"),
                ("deafen_members", "เธเธดเธ”เธซเธนเธชเธกเธฒเธเธดเธ"),
                ("move_members", "เธขเนเธฒเธขเธชเธกเธฒเธเธดเธ"),
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
                
                # Papa is ALWAYS Level 10 ๐‘‘
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

            # For other actions, guild is required
            guild = self.get_guild(int(guild_id)) if guild_id else (self.guilds[0] if self.guilds else None)
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
                return web.json_response({"status": "clearing"}, headers={"Access-Control-Allow-Origin": "*"})
                
            elif action == "rollback":
                success = await perform_rollback(guild)
                return web.json_response({"status": "rollback_triggered", "success": success}, headers={"Access-Control-Allow-Origin": "*"})
                
            elif action == "setup":
                template = body.get("template", "Shop")
                extra_data = body.get("extra_data", {})
                user_id = body.get("user_id")
                # Perform setup in background
                async def safe_setup():
                    try: await perform_guild_setup(guild, template, extra_data, user_id=user_id)
                    except Exception as e:
                        print(f"Setup Error: {e}")
                        import traceback; traceback.print_exc()
                asyncio.create_task(safe_setup())
                return web.json_response({"status": "setup_started"}, headers={"Access-Control-Allow-Origin": "*"})
                
            elif action == "delete_selective":
                ids = body.get("ids", [])
                async def safe_delete():
                    try: await perform_selective_delete(guild, ids)
                    except Exception as e:
                        print(f"Selective Delete Error: {e}")
                        import traceback; traceback.print_exc()
                asyncio.create_task(safe_delete())
                return web.json_response({"status": "deletion_started"}, headers={"Access-Control-Allow-Origin": "*"})
            
            return web.json_response({"error": "Unknown action"}, status=400, headers={"Access-Control-Allow-Origin": "*"})
            
        except Exception as e:
            print(f"API Action Error: {e}")
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
        print("An An is ready to serve you! ๐ธ")
        
        # Auto-ensure management system in all guilds on startup
        for guild in self.guilds:
            await self.ensure_management_system(guild)

    async def on_guild_join(self, guild):
        print(f"Joined a new guild: {guild.name} (ID: {guild.id})")
        # Mission: Invite Bot (Attribute to Guild Owner for now)
        if guild.owner_id:
            await update_mission_progress(str(guild.owner_id), "invite_bot", 1)
            
        # Ensure management system exists immediately
        terminal_ch = await self.ensure_management_system(guild)
        
        # Send greeting in the first available channel
        for channel in guild.text_channels:
            if channel.permissions_for(guild.me).send_messages and channel != terminal_ch:
                await channel.send("เธชเธงเธฑเธชเธ”เธตเธเนเธฐ! An An เธกเธฒเธ–เธถเธเนเธฅเนเธงเธเนเธฐ! เนเธเนเธเธณเธชเธฑเนเธ `/setup` เน€เธเธทเนเธญเน€เธฃเธดเนเธกเธ•เนเธเธ•เธฑเนเธเธเนเธฒเธซเนเธญเธเธ•เนเธฒเธเน เนเธ”เนเน€เธฅเธขเธเธฐเธเธฐ ๐’–")
                break

    async def on_member_join(self, member):
        # 1. Update Stats & Latest Member
        await self.ensure_management_system(member.guild)
        
        # 2. Original Welcome Logic
        success = await send_welcome_message(member)
        if success:
            print(f"Sent welcome to {member.name}")
            # Mission: Invite Friends (Attribute to the owner or recruiter)
            # Simplest for now: attribute to guild owner if they invited
            await update_mission_progress(str(member.guild.owner_id), "invite_friends", 1)

    async def on_member_remove(self, member):
        # Update Stats when member leaves
        await self.ensure_management_system(member.guild)

    # Security: Superuser Check (Only Papa and Guild Owner)
    def is_superuser(self, user, guild):
        papa_uid = 956866340474478642
        return user.id == papa_uid or (guild and user.id == guild.owner_id)

    async def ensure_management_system(self, guild):
        # Names for the channels
        terminal_name = "๏ฝใป๐’ฌ๏ผanan-terminal"
        
        # 1. Calculate Stats
        total_members = guild.member_count
        online_members = sum(1 for m in guild.members if m.status != disnake.Status.offline)
        stats_name = f"๏ฝใป๐“๏ผMEMBERS โฏ {online_members}/{total_members}"
        
        # 2. Get Latest Member
        # Sort members by join date
        sorted_members = sorted([m for m in guild.members if not m.bot], key=lambda m: m.joined_at or datetime.datetime.min, reverse=True)
        latest_name = f"๏ฝใป๐‘ฃ๏ผLATEST โฏ {sorted_members[0].display_name[:15]}" if sorted_members else "๏ฝใป๐‘ฃ๏ผLATEST โฏ None"

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
            # Find existing by Icon Identifier (๐“, ๐‘ฃ, ๐’ฌ)
            icons = ["๐“", "๐‘ฃ", "๐’ฌ"]
            my_icon = next((i for i in icons if i in name), None)
            
            existing = None
            if my_icon:
                existing = next((c for c in (guild.text_channels if ch_type == "text" else guild.voice_channels) if my_icon in c.name), None)
            
            if not existing:
                # Fallback to broad search if icon matching fails
                keyword = name.split("๏ผ")[0] if "๏ผ" in name else name[:3]
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
            await inter.response.send_message(f"เธเธญเนเธ—เธฉเธเธฐเธเธฐ {inter.author.mention} เนเธ•เนเธเธณเธชเธฑเนเธเธเธตเนเธฅเนเธญเธเนเธงเนเธชเธณเธซเธฃเธฑเธ Papa เนเธฅเธฐเน€เธเนเธฒเธเธญเธเธเธดเธฅเธ”เนเน€เธ—เนเธฒเธเธฑเนเธเธเนเธฐ! ๐…โ€โ€๏ธ๐ธ", ephemeral=True)
            return False
        return True

bot = AnAnBot()

@bot.slash_command(description="เน€เธฃเธดเนเธกเธ•เนเธเธ•เธฑเนเธเธเนเธฒเนเธเธฃเธเธชเธฃเนเธฒเธเธซเนเธญเธเธ•เธฒเธก Template")
async def setup(inter: disnake.ApplicationCommandInteraction):
    # (Global interaction_check ensures safety, removed redundant admin check)
        
    embed = disnake.Embed(
        title="โจ An An Guild Setup Assistant",
        description="เน€เธฅเธทเธญเธเธเธฃเธฐเน€เธ เธ— Discord เธ—เธตเน เธเธธเธ“ เธ•เนเธญเธเธเธฒเธฃเนเธซเน An An เธเนเธงเธขเธเธฑเธ”เธเธฒเธฃเธชเธฃเนเธฒเธเธซเนเธญเธเนเธฅเธฐเธขเธจเนเธซเนเนเธ”เนเน€เธฅเธขเธเนเธฐ! เนเธ•เนเธฅเธฐเนเธเธเธเธฐเธกเธฒเธเธฃเนเธญเธกเนเธเธเธ—เธตเนเธเธฑเธ”เน€เธเนเธเธฃเธฐเน€เธเธตเธขเธเธชเธงเธขเธเธฒเธก 4 เนเธเธ เนเธเธเธฅเธฐ 5 เธซเนเธญเธเธเนเธฐ",
        color=disnake.Color.from_rgb(255, 182, 193) # เธชเธตเธเธกเธเธน An An
    )
    embed.set_footer(text="An An v4.1 Hybrid Precision")
    
    await inter.response.send_message(embed=embed, view=TemplateView(bot))

@bot.slash_command(description="เนเธชเธ”เธเน€เธกเธเธนเธเนเธงเธขเน€เธซเธฅเธทเธญเธชเธณเธซเธฃเธฑเธเนเธญเธ”เธกเธดเธ")
async def admin_help(inter: disnake.ApplicationCommandInteraction):
    # (Global interaction_check ensures safety)
        
    embed = disnake.Embed(
        title="๐ ๏ธ Admin Assistance Menu",
        description="An An เธเธฃเนเธญเธกเธเนเธงเธข เธเธธเธ“ เธ”เธนเนเธฅเธเธดเธฅเธ”เนเนเธฅเนเธงเธเนเธฐ! เธเธตเนเธเธทเธญเธชเธดเนเธเธ—เธตเนเธเธธเธ“เธ—เธณเนเธ”เน:",
        color=disnake.Color.blue()
    )
    embed.add_field(name="`/setup`", value="เธชเธฃเนเธฒเธเธซเธกเธงเธ”เธซเธกเธนเน เธซเนเธญเธ เนเธฅเธฐเธขเธจเธ•เธฒเธก Template เนเธซเธกเนเธ—เธฑเนเธเธซเธกเธ”", inline=False)
    embed.add_field(name="`/clear_guild`", value="เธฅเนเธฒเธเธซเนเธญเธเธ—เธฑเนเธเธซเธกเธ” (เน€เธเธเธฒเธฐ Owner)", inline=False)
    embed.add_field(name="`/rollback`", value="เธเธนเนเธเธทเธเธซเนเธญเธเธ—เธตเนเธฅเธเนเธเธ เธฒเธขเนเธ 30 เธเธฒเธ—เธต", inline=False)
    embed.add_field(name="`/guild_stats`", value="เธ”เธนเธชเธ–เธดเธ•เธดเธเธณเธเธงเธเธชเธกเธฒเธเธดเธเนเธฅเธฐเธซเนเธญเธเธ•เนเธฒเธเน เนเธเธเธดเธฅเธ”เนเธเธตเน", inline=False)
    embed.set_footer(text="เธเธงเธฒเธกเนเธงเนเธงเธฒเธเนเธเธเธญเธ เธเธธเธ“ เธเธทเธญเธชเธดเนเธเธชเธณเธเธฑเธเธ—เธตเนเธชเธธเธ”เธเธญเธ An An ๐’–")
    
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
            f"๐งน **เธฅเนเธฒเธเธเนเธญเธกเธนเธฅเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธงเธเนเธฐ!**\n\n"
            f"An An เนเธ”เนเธเนเธงเธขเธเธ”เธเธณเนเธเธฃเธเธชเธฃเนเธฒเธเธซเนเธญเธเนเธฅเธฐเธขเธจเน€เธ”เธดเธกเนเธงเนเนเธซเนเนเธฅเนเธงเธเนเธฐ\n"
            f"เธซเธฒเธเธ•เนเธญเธเธเธฒเธฃเน€เธญเธฒเธ—เธธเธเธญเธขเนเธฒเธเธเธฅเธฑเธเธเธทเธเธกเธฒ เธชเธฒเธกเธฒเธฃเธ–เธเธดเธกเธเน `!rollback` เธซเธฃเธทเธญ `/rollback` เนเธ”เนเธ—เธตเนเธซเนเธญเธเธเธตเนเธ—เธฑเธเธ—เธตเธเธฐเธเธฐ\n"
            f"*(เน€เธซเธฅเธทเธญเน€เธงเธฅเธฒเธญเธตเธ 30 เธเธฒเธ—เธตเธเนเธฐ)* ๐ธ๐’–"
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

@bot.slash_command(description="เธฅเนเธฒเธเธซเนเธญเธเธ—เธฑเนเธเธซเธกเธ”เนเธเธเธดเธฅเธ”เน (Backup เธเนเธญเธกเธนเธฅเนเธงเน 30 เธเธฒเธ—เธต)")
async def clear_guild(inter: disnake.ApplicationCommandInteraction):
    # (Global interaction_check ensures safety)
    await inter.response.send_message(f"เธเธณเธฅเธฑเธเธฅเนเธฒเธเธเธดเธฅเธ”เนเนเธซเนเธเธฐเธเธฐ {inter.author.mention}... ๐งน", ephemeral=True)
    await perform_clear(inter.guild)
    try:
        await inter.edit_original_response(content="เธฅเนเธฒเธเน€เธฃเธตเธขเธเธฃเนเธญเธข! เธเธดเธกเธเน `/rollback` เธซเธฃเธทเธญ `!rollback` เน€เธเธทเนเธญเธเธนเนเธเธทเธเธ เธฒเธขเนเธ 30 เธเธฒเธ—เธตเธเนเธฐ ๐ธ")
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
        await terminal_ch.send(f"โ… **เธฅเธเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเน€เธฅเธทเธญเธเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธงเธเนเธฐ!** ({len(ids)} เธฃเธฒเธขเธเธฒเธฃ) ๐งน๐ธ")

@bot.slash_command(description="เธฅเธเธซเนเธญเธเธซเธฃเธทเธญเธซเธกเธงเธ”เธซเธกเธนเนเธ—เธตเนเธฃเธฐเธเธธ (เน€เธเนเธฒเธเธญเธเน€เธ—เนเธฒเธเธฑเนเธ)")
async def clear_selective(inter: disnake.ApplicationCommandInteraction, channel_ids: str):
    # (Global interaction_check ensures safety)
    ids = [i.strip() for i in channel_ids.split(",")]
    await inter.response.send_message(f"เธเธณเธฅเธฑเธเธฅเธ {len(ids)} เธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเน€เธฅเธทเธญเธเนเธซเนเธเธฐเธเธฐ... ๐งน", ephemeral=True)
    await perform_selective_delete(inter.guild, ids)
    await inter.edit_original_response(content="เธเธฑเธ”เธเธฒเธฃเธฅเธเนเธซเนเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธงเธเนเธฐ! โจ")

@bot.slash_command(description="เธเธนเนเธเธทเธเธซเนเธญเธเธ—เธตเนเน€เธเธดเนเธเธฅเธเนเธ (เธ—เธณเนเธ”เนเธ เธฒเธขเนเธ 30 เธเธฒเธ—เธต)")
async def rollback(inter: disnake.ApplicationCommandInteraction):
    # (Global interaction_check ensures safety)
        
    await inter.response.send_message("เธเธณเธฅเธฑเธเธเธนเนเธเธทเธเธเนเธญเธกเธนเธฅเนเธซเนเธเธฐเธเธฐ... ๐ช", ephemeral=True)
    if await perform_rollback(inter.guild):
        await inter.edit_original_response(content=f"เน€เธขเน! เธเธนเนเธเธทเธเธชเธณเน€เธฃเนเธเนเธฅเนเธงเธเนเธฐ {inter.author.mention}! ๐’–")
    else:
        await inter.edit_original_response(content=f"An An เธซเธฒเธเนเธญเธกเธนเธฅเนเธกเนเน€เธเธญเน€เธฅเธขเธเนเธฐ {inter.author.mention} ")

# Fallback Prefix Commands (Working instantly)
@bot.command(name="clear")
async def prefix_clear(ctx):
    if ctx.author.id != ctx.guild.owner_id: return
    await ctx.send(f"เธเธณเธฅเธฑเธเธฅเนเธฒเธเธเธดเธฅเธ”เนเนเธซเนเธเธฐเธเธฐ {ctx.author.mention}... ๐งน")
    await perform_clear(ctx.guild)

@bot.command(name="rollback")
async def prefix_rollback(ctx):
    if ctx.author.id != ctx.guild.owner_id: return
    await ctx.send("เธเธณเธฅเธฑเธเธเธนเนเธเธทเธเธเนเธญเธกเธนเธฅเนเธซเนเธเธฐเธเธฐ... ๐ช")
    if await perform_rollback(ctx.guild):
        await ctx.send(f"เน€เธขเน! เธเธนเนเธเธทเธเธชเธณเน€เธฃเนเธเนเธฅเนเธงเธเนเธฐ {ctx.author.mention}! ๐’–")
    else:
        await ctx.send(f"An An เธซเธฒเธเนเธญเธกเธนเธฅเนเธกเนเน€เธเธญเน€เธฅเธขเธเนเธฐ {ctx.author.mention} ")

@bot.command(name="testw")
async def prefix_test_welcome(ctx):
    if not bot.is_superuser(ctx.author, ctx.guild): return
    await ctx.send(f"เธเธณเธฅเธฑเธเธเธณเธฅเธญเธเธเนเธญเธเธงเธฒเธกเธ•เนเธญเธเธฃเธฑเธเนเธซเน {ctx.author.mention} เธ”เธนเธเธฐเธเธฐ... โจ๐ธ")
    success = await send_welcome_message(ctx.author)
    if not success:
        await ctx.send(f"เธญเธธเนเธข! {ctx.author.mention} An An เธซเธฒเธซเนเธญเธเธ—เธตเนเธกเธตเธเธทเนเธญ **'welcome'** เนเธกเนเน€เธเธญเน€เธฅเธขเธเนเธฐ เธฃเธเธเธงเธเธชเธฃเนเธฒเธเธซเนเธญเธเธเนเธญเธเธเธฐเธเธฐ! ๐ฅบ")

@bot.check
async def globally_restrict_prefix_commands(ctx):
    if not bot.is_superuser(ctx.author, ctx.guild):
        # We don't necessarily want to spam a message for every random message that might be a wrong command
        # but for prefix commands, we can silence or notify.
        return False
    return True

# Helpers for Rules and Welcome
async def post_guild_rules(guild, template_name):
    rules_ch = next((c for c in guild.text_channels if "เธเธเธเธ•เธดเธเธฒ" in c.name), None)
    if not rules_ch: return
    
    rules_data = {
        "Shop": [
            "๐’ เธชเธฑเนเธเธเธทเนเธญเธเนเธฒเธเธเนเธญเธเธ—เธฒเธเธ—เธตเนเธเธณเธซเธเธ”เนเธฅเธฐเธฃเธฐเธเธธเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เนเธซเนเธเธฃเธเธ–เนเธงเธ",
            "โณ เธเธเธฑเธเธเธฒเธเธเธฐเน€เธฃเธดเนเธกเธเธดเธงเธ•เธฒเธกเธฅเธณเธ”เธฑเธเธเธฒเธฃเนเธเนเธเธเธณเธฃเธฐเน€เธเธดเธเธเนเธฐ",
            "๐ซ เธซเนเธฒเธกเธชเนเธเธกเธเนเธญเธเธงเธฒเธกเธซเธฃเธทเธญเธชเนเธเน€เธเธทเนเธญเธซเธฒเธ—เธตเนเนเธกเนเน€เธเธตเนเธขเธงเธเนเธญเธเนเธเธซเนเธญเธ Support",
            "๐’– เธชเธธเธ เธฒเธเธเธฑเธเธ—เธตเธกเธเธฒเธ เน€เธเธทเนเธญเธเธฒเธฃเธเธฃเธดเธเธฒเธฃเธ—เธตเนเธฃเธงเธ”เน€เธฃเนเธงเธเธฐเธเธฐ"
        ],
        "Community": [
            "๐ค เนเธซเนเน€เธเธตเธขเธฃเธ•เธดเนเธฅเธฐเน€เธเธฒเธฃเธเธเธถเนเธเธเธฑเธเนเธฅเธฐเธเธฑเธเน€เธชเธกเธญ",
            "๐ซ เธเธ”เนเธเนเธ–เนเธญเธขเธเธณเธซเธขเธฒเธเธเธฒเธข เธฃเธธเธเนเธฃเธ เธซเธฃเธทเธญเธชเธฃเนเธฒเธเธเธฃเธฃเธขเธฒเธเธฒเธจ Toxic",
            "๐‘พ เธซเธฒเน€เธเธทเนเธญเธเน€เธฅเนเธเน€เธเธกเนเธเธซเนเธญเธเธ—เธตเนเธเธฑเธ”เนเธงเนเนเธซเน เน€เธเธทเนเธญเธเธงเธฒเธกเน€เธเนเธเธฃเธฐเน€เธเธตเธขเธเธเนเธฐ",
            "๐“ข เธซเนเธฒเธกเนเธเธฉเธ“เธฒ เธเธฒเธขเธเธญเธ เธซเธฃเธทเธญเธชเนเธเธฅเธดเธเธเนเนเธเธฅเธเธเธฅเธญเธกเน€เธ”เนเธ”เธเธฒเธ”"
        ],
        "Fanclub": [
            "โจ เธกเธฒเธฃเนเธงเธกเธชเธฃเนเธฒเธเธเธฅเธฑเธเธเธงเธเนเธฅเธฐเธเธฑเธเธเธญเธฃเนเธ•เธเธฃเธตเน€เธญเน€เธ•เธญเธฃเนเธ—เธตเนเธเธงเธเน€เธฃเธฒเธฃเธฑเธเธเธฑเธเธเนเธฐ",
            "๐คซ เธซเนเธฒเธกเน€เธเธขเนเธเธฃเนเธเนเธญเธกเธนเธฅเธฅเธฑเธ (Leak) เธซเธฃเธทเธญเธชเธเธญเธขเธฅเนเน€เธเธทเนเธญเธซเธฒเธเนเธญเธเนเธ”เนเธฃเธฑเธเธญเธเธธเธเธฒเธ•",
            "๐ซ เธเธ”เธ”เธฃเธฒเธกเนเธฒเธซเธฃเธทเธญเธเธฒเธ”เธเธดเธเธ–เธถเธเธเธธเธเธเธฅเธญเธทเนเธเนเธเน€เธเธดเธเธฅเธเธเธฐเธเธฐ",
            "๐“ธ เนเธเธฃเนเธเธฅเธเธฒเธเนเธเธเธญเธฒเธฃเนเธ•เนเธฅเธฐเนเธกเน€เธกเธเธ•เนเธชเธงเธขเน เนเธ”เนเน€เธ•เนเธกเธ—เธตเนเน€เธฅเธขเธเนเธฐ"
        ]
    }
    
    rules_list = rules_data.get(template_name, ["เธฃเธฑเธเธฉเธฒเธเธงเธฒเธกเธชเธเธเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธเธเธดเธฅเธ”เนเธเธฐเธเธฐ ๐ธ"])
    
    embed = disnake.Embed(
        title=f"๐“ เธเธเธเธ•เธดเธเธฒเธเธญเธ {guild.name}",
        description=f"เธขเธดเธเธ”เธตเธ•เนเธญเธเธฃเธฑเธเธชเธกเธฒเธเธดเธเธ—เธธเธเธ—เนเธฒเธเธเธฐเธเธฐ! เน€เธเธทเนเธญเธเธงเธฒเธกเธชเธเธเธชเธธเธเธเธญเธเธเธงเธเน€เธฃเธฒ An An เธเธญเธเธงเธฒเธกเธฃเนเธงเธกเธกเธทเธญเธเธเธดเธเธฑเธ•เธดเธ•เธฒเธกเธเธเธเธตเนเธ”เนเธงเธขเธเธฐเธเธฐ โจ",
        color=disnake.Color.purple()
    )
    
    content = "\n\n".join([f"**{i+1}.** {rule}" for i, rule in enumerate(rules_list)])
    embed.add_field(name="เธเนเธญเธเธเธดเธเธฑเธ•เธดเธชเนเธงเธเธฃเธงเธก", value=content, inline=False)
    embed.set_footer(text="เธเธงเธฒเธกเนเธงเนเธงเธฒเธเนเธเธเธญเธ Papa เธเธทเธญเธชเธดเนเธเธชเธณเธเธฑเธเธ—เธตเนเธชเธธเธ”เธเธญเธ An An ๐’–")
    
    await rules_ch.send(embed=embed)

async def send_welcome_message(member):
    welcome_ch = next((c for c in member.guild.text_channels if "welcome" in c.name.lower()), None)
    if not welcome_ch: return False
    
    embed = disnake.Embed(
        title="โจ เธขเธดเธเธ”เธตเธ•เนเธญเธเธฃเธฑเธเธชเธกเธฒเธเธดเธเนเธซเธกเน! โจ",
        description=f"เธ—เธฑเธเธ—เธฒเธขเธเธธเธ“ {member.mention} เธ—เธตเนเนเธ”เนเธเนเธฒเธงเน€เธเนเธฒเธชเธนเนเธเธฃเธญเธเธเธฃเธฑเธงเธเธญเธเน€เธฃเธฒเธเธฐเธเธฐ! ๐ธ\nAn An เธ”เธตเนเธเธกเธฒเธเน€เธฅเธขเธเนเธฐเธ—เธตเนเธกเธตเธชเธกเธฒเธเธดเธเน€เธเธดเนเธกเธเธถเนเธเธญเธตเธเธ—เนเธฒเธเนเธฅเนเธง โจ",
        color=disnake.Color.from_rgb(255, 182, 193),
        timestamp=datetime.datetime.now()
    )
    
    embed.add_field(name="๐  เธเนเธญเธกเธนเธฅเธเธดเธฅเธ”เน", value=f"เธ•เธญเธเธเธตเนเน€เธฃเธฒเธกเธตเน€เธเธทเนเธญเธเธเนเธญเธเธ—เธฑเนเธเธซเธกเธ” **{member.guild.member_count}** เธ—เนเธฒเธเนเธฅเนเธงเธเนเธฐ!", inline=False)
    embed.add_field(name="๐“ เน€เธฃเธดเนเธกเธ•เนเธเธ—เธตเนเธเธตเน", value=f"เธญเธขเนเธฒเธฅเธทเธกเนเธเธฃเธฒเธขเธเธฒเธเธ•เธฑเธงเธ—เธตเนเธซเนเธญเธ <#เธเนเธญเธVerify> เนเธฅเธฐเธญเนเธฒเธเธเธ•เธดเธเธฒเธ—เธตเนเธซเนเธญเธ <#เธเนเธญเธเธเธ•เธดเธเธฒ> เธเธฐเธเธฐ {member.mention}! ๐’–", inline=False)
    
    if member.avatar:
        embed.set_thumbnail(url=member.avatar.url)
    
    embed.set_image(url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMHEybXgxZ3B6Z3B6Z3B6Z3B6Z3B6Z3B6Z3B6Z3B6Z3B6Z3B6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKVUn7iM8FMEU24/giphy.gif") # Sweet welcome gif
    embed.set_footer(text=f"Welcome to {member.guild.name} | An An v4.1 โจ", icon_url=member.guild.me.display_avatar.url if member.guild.me.display_avatar else None)
    
    # Try to find verify and rules channels to replace placeholders
    v_ch = next((c for c in member.guild.text_channels if "verify" in c.name), None)
    r_ch = next((c for c in member.guild.text_channels if "เธเธเธเธ•เธดเธเธฒ" in c.name), None)
    
    desc = embed.fields[1].value
    if v_ch: desc = desc.replace("<#เธเนเธญเธVerify>", v_ch.mention)
    if r_ch: desc = desc.replace("<#เธเนเธญเธเธเธ•เธดเธเธฒ>", r_ch.mention)
    embed.set_field_at(1, name="๐“ เน€เธฃเธดเนเธกเธ•เนเธเธ—เธตเนเธเธตเน", value=desc, inline=False)
    
    await welcome_ch.send(content=f"Welcome to the family, {member.mention}! ๐", embed=embed)
    return True



@bot.slash_command(description="เธชเนเธเธ•เธฑเธงเธญเธขเนเธฒเธเธเนเธญเธเธงเธฒเธกเธ•เนเธญเธเธฃเธฑเธ (Welcome) เนเธซเน เธเธธเธ“ เธ”เธนเธเนเธฐ")
async def test_welcome(inter: disnake.ApplicationCommandInteraction):
    # (Global interaction_check ensures safety)
    await inter.response.send_message(f"เธเธณเธฅเธฑเธเธเธณเธฅเธญเธเธเนเธญเธเธงเธฒเธกเธ•เนเธญเธเธฃเธฑเธเนเธซเน {inter.author.mention} เธ”เธนเธเธฐเธเธฐ... โจ๐ธ", ephemeral=True)
    success = await send_welcome_message(inter.author)
    if not success:
        await inter.edit_original_response(content=f"เธญเธธเนเธข! {inter.author.mention} An An เธซเธฒเธซเนเธญเธเธ—เธตเนเธกเธตเธเธทเนเธญ **'welcome'** เนเธกเนเน€เธเธญเน€เธฅเธขเธเนเธฐ เธฃเธเธเธงเธเธชเธฃเนเธฒเธเธซเนเธญเธเธเนเธญเธเธเธฐเธเธฐ! ๐ฅบ")

@bot.slash_command(description="เธ”เธนเธชเธ–เธดเธ•เธดเธเธญเธเธเธดเธฅเธ”เนเธเธตเน")
async def guild_stats(inter: disnake.ApplicationCommandInteraction):
    guild = inter.guild
    embed = disnake.Embed(title=f"๐“ เธชเธ–เธดเธ•เธดเธเธญเธ {guild.name}", color=disnake.Color.green())
    embed.add_field(name="เธชเธกเธฒเธเธดเธเธ—เธฑเนเธเธซเธกเธ”", value=f"{guild.member_count} เธ—เนเธฒเธ", inline=True)
    embed.add_field(name="เธเธ—เธเธฒเธ— (Roles)", value=f"{len(guild.roles)} เธขเธจ", inline=True)
    embed.add_field(name="เธซเนเธญเธเธ—เธฑเนเธเธซเธกเธ”", value=f"{len(guild.channels)} เธซเนเธญเธ", inline=True)
    await inter.response.send_message(embed=embed)

if __name__ == "__main__":
    # เธเธธเธ“ เธ•เนเธญเธเนเธชเน TOKEN เนเธ .env เธซเธฃเธทเธญเน€เธเธฅเธตเนเธขเธเธ•เธฃเธเธเธตเน
    TOKEN = os.getenv("DISCORD_TOKEN", "YOUR_BOT_TOKEN_HERE")
    if TOKEN == "YOUR_BOT_TOKEN_HERE":
        print("เนเธเธฃเธ”เธฃเธฐเธเธธ TOKEN เธเธญเธเธเธญเธ—เนเธเธ•เธฑเธงเนเธเธฃเธชเธ เธฒเธเนเธงเธ”เธฅเนเธญเธกเธซเธฃเธทเธญเนเธเธฅเน .env เธเธฐเธเธฐ!")
    else:
        bot.run(TOKEN)
