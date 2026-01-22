import os
import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Warning: SUPABASE_URL or SUPABASE_KEY not found in environment variables.")
    supabase: Client = None
else:
    supabase: Client = create_client(url, key)

def get_last_reset_time():
    # Thai time is UTC+7
    tz = datetime.timezone(datetime.timedelta(hours=7))
    now = datetime.datetime.now(tz)
    reset_today = now.replace(hour=6, minute=0, second=0, microsecond=0)
    if now < reset_today:
        return reset_today - datetime.timedelta(days=1)
    return reset_today

def is_reset_needed(last_updated_str):
    if not last_updated_str: return True
    try:
        # Supabase timestamps are usually ISO format
        # last_updated might be "2026-01-19T..."
        last_updated = datetime.datetime.fromisoformat(last_updated_str.replace("Z", "+00:00"))
        # Ensure it has timezone info for comparison
        if last_updated.tzinfo is None:
            last_updated = last_updated.replace(tzinfo=datetime.timezone.utc)
            
        reset_time = get_last_reset_time()
        return last_updated < reset_time
    except Exception as e:
        print(f"Time parse error: {e}")
        return True

async def update_mission_progress(user_id: str, mission_key: str, increment: int = 1):
    if not supabase: return
    
    # 1. We still need to check current progress to handle Increment + Reset logic
    res = supabase.table("user_progress").select("id, current_count, last_updated, is_claimed").eq("user_id", user_id).eq("mission_key", mission_key).execute()
    
    if not res.data:
        # Create new entry
        supabase.table("user_progress").insert({
            "user_id": user_id,
            "mission_key": mission_key,
            "current_count": increment,
            "is_claimed": False
        }).execute()
    else:
        current = res.data[0]
        # Check if reset needed
        if is_reset_needed(current.get("last_updated")):
            supabase.table("user_progress").update({
                "current_count": increment,
                "is_claimed": False,
                "last_updated": "now()"
            }).eq("id", current["id"]).execute() # Use ID for faster update
        elif not current["is_claimed"]:
            new_count = current["current_count"] + increment
            supabase.table("user_progress").update({
                "current_count": new_count,
                "last_updated": "now()"
            }).eq("id", current["id"]).execute()

async def get_user_missions(user_id: str):
    if not supabase: return []
    
    # Get all missions and user progress
    missions_res = supabase.table("missions").select("*").execute()
    progress_res = supabase.table("user_progress").select("*").eq("user_id", user_id).execute()
    
    progress_dict = {}
    for p in progress_res.data:
        if is_reset_needed(p.get("last_updated")):
            progress_dict[p["mission_key"]] = {"current_count": 0, "is_claimed": False}
        else:
            progress_dict[p["mission_key"]] = p
    
    combined = []
    for m in missions_res.data:
        p = progress_dict.get(m["key"], {"current_count": 0, "is_claimed": False})
        combined.append({
            **m,
            "current_count": p["current_count"],
            "is_claimed": p["is_claimed"]
        })
    return combined

async def get_user_stats(user_id: str):
    if not supabase: return {"xp_balance": 0, "total_missions_completed": 0}
    res = supabase.table("user_stats").select("*").eq("user_id", user_id).execute()
    if res.data:
        return res.data[0]
    return {"xp_balance": 0, "total_missions_completed": 0}

async def get_user_plan(user_id: str):
    # Papa is ALWAYS Premium/Pro Lifetime 👑
    PAPA_UID = "956866340474478642"
    if str(user_id) == PAPA_UID:
        return {"plan_type": "premium", "expires_at": None, "is_lifetime": True, "trial_claimed": True}
        
    if not supabase: return {"plan_type": "free", "expires_at": None}
    
    res = supabase.table("user_stats").select("plan_type, expires_at, trial_claimed").eq("user_id", str(user_id)).execute()
    if res.data:
        plan = res.data[0]
        expires_at_str = plan.get("expires_at")
        
        if expires_at_str:
            try:
                # Handle Z or +00:00
                expires_at = datetime.datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
                # Ensure timezone aware comparison
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=datetime.timezone.utc)
                
                now = datetime.datetime.now(datetime.timezone.utc)
                
                if now > expires_at:
                    # Plan EXPIRED! 🥀
                    return {"plan_type": "free", "expires_at": expires_at_str, "trial_claimed": plan.get("trial_claimed", False), "is_expired": True}
            except Exception as e:
                print(f"Plan expiry check error: {e}")
                
        return plan
        
    return {"plan_type": "free", "expires_at": None, "trial_claimed": False}

async def activate_free_trial(user_id: str):
    """
    Activates a 7-day free trial for the user.
    """
    if not supabase: return False

    # Check if already claimed
    current_plan = await get_user_plan(user_id)
    if current_plan.get("trial_claimed") or current_plan.get("plan_type") != "free":
        return False

    # Activate Trial
    expires_at = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)).isoformat()
    
    # Update user_stats
    data = {
        "plan_type": "pro",
        "expires_at": expires_at,
        "trial_claimed": True,
        "notification_sent": False
    }
    
    # Check if entry exists to update or insert
    res = supabase.table("user_stats").select("*").eq("user_id", str(user_id)).execute()
    if res.data:
         supabase.table("user_stats").update(data).eq("user_id", str(user_id)).execute()
    else:
         data["user_id"] = str(user_id)
         supabase.table("user_stats").insert(data).execute()
         
    return True

async def check_expiring_trials():
    """
    Checks for trials expiring in exactly 1 day (within the next hour window) and returns list of user_ids to notify.
    Also updates notification_sent to True.
    """
    if not supabase: return []
    
    # We want to notify users effectively 1 day before expiry.
    # Logic: Find users with plan_type='pro' AND trial_claimed=true AND notification_sent=false AND expires_at <= now + 24h
    
    now = datetime.datetime.now(datetime.timezone.utc)
    tomorrow = (now + datetime.timedelta(days=1)).isoformat()
    
    # Supabase filter: expires_at <= tomorrow (meaning less than 24 hours left)
    res = supabase.table("user_stats").select("user_id, expires_at")\
        .eq("plan_type", "pro")\
        .eq("trial_claimed", True)\
        .eq("notification_sent", False)\
        .lte("expires_at", tomorrow)\
        .execute()
        
    ids_to_notify = []
    if res.data:
        for user in res.data:
            # Secondary check to ensure it's not already expired (if it is, it's blocked by get_user_plan anyway)
            ids_to_notify.append(user["user_id"])
            # Mark as notified immediately to prevent double sending
            supabase.table("user_stats").update({"notification_sent": True}).eq("user_id", user["user_id"]).execute()
            
    return ids_to_notify

async def claim_mission_reward(user_id: str, mission_key: str):
    if not supabase: return {"success": False, "error": "Database not connected"}
    
    # 1. Check if mission is complete and not yet claimed
    m_res = supabase.table("missions").select("*").eq("key", mission_key).execute()
    p_res = supabase.table("user_progress").select("*").eq("user_id", user_id).eq("mission_key", mission_key).execute()
    
    if not m_res.data or not p_res.data:
        return {"success": False, "error": "Mission or progress not found"}
    
    mission = m_res.data[0]
    progress = p_res.data[0]
    
    if progress["is_claimed"]:
        return {"success": False, "error": "Already claimed"}
    
    if progress["current_count"] < mission["target_count"]:
        return {"success": False, "error": "Mission not yet completed"}
    
    # 2. Mark as claimed
    supabase.table("user_progress").update({"is_claimed": True}).eq("user_id", user_id).eq("mission_key", mission_key).execute()
    
    # 3. Add XP to user_stats
    stats_res = supabase.table("user_stats").select("*").eq("user_id", user_id).execute()
    if not stats_res.data:
        supabase.table("user_stats").insert({
            "user_id": user_id,
            "xp_balance": mission["reward_xp"],
            "total_missions_completed": 1
        }).execute()
    else:
        current_stats = stats_res.data[0]
        supabase.table("user_stats").update({
            "xp_balance": current_stats["xp_balance"] + mission["reward_xp"],
            "total_missions_completed": current_stats["total_missions_completed"] + 1,
            "last_updated": "now()"
        }).eq("user_id", user_id).execute()
        
    return {"success": True, "xp_added": mission["reward_xp"]}

async def save_rollback_data(guild_id: str, data: dict):
    if not supabase: return
    supabase.table("rollback_memory").upsert({
        "guild_id": str(guild_id),
        "timestamp": data["timestamp"].isoformat(),
        "globals": data["globals"],
        "categories": data["categories"],
        "roles": data["roles"]
    }).execute()

async def get_rollback_data(guild_id: str):
    if not supabase: return None
    res = supabase.table("rollback_memory").select("*").eq("guild_id", str(guild_id)).execute()
    return res.data[0] if res.data else None

async def get_guild_settings(guild_id: str):
    if not supabase: return None
    res = supabase.table("guild_settings").select("*").eq("guild_id", str(guild_id)).execute()
    return res.data[0] if res.data else None

async def save_guild_settings(guild_id: str, settings: dict):
    if not supabase: return {"success": False, "error": "Database not connected"}
    
    # Whitelist valid columns to prevent "missing column" errors from PostgREST
    # NOTE: Personalizer columns (bot_nickname, activity_type, etc.) are removed
    # until the user runs the SQL to add them to the table.
    VALID_COLUMNS = [
        "guild_id", "welcome_enabled", "welcome_channel_id", "welcome_message", 
        "welcome_image_url", "goodbye_enabled", "goodbye_channel_id", 
        "goodbye_message", "goodbye_image_url", "ticket_config", "social_config",
        "reaction_roles_config", "moderator_config",
        "bot_nickname", "bot_bio", "activity_type", "status_text", "avatar_url", "banner_color"
    ]
    
    # Create sanitized data dict
    sanitized_data = {"guild_id": str(guild_id)}
    for key, value in settings.items():
        if key in VALID_COLUMNS:
            sanitized_data[key] = value
            
    try:
        res = supabase.table("guild_settings").upsert(sanitized_data).execute()
        return {"success": True}
    except Exception as e:
        print(f"Database Upsert Error: {e}")
        return {"success": False, "error": str(e)}

async def create_ticket(guild_id: str, user_id: str, channel_id: str, topic_code: str, ticket_number: int):
    if not supabase: return {"success": False}
    try:
        supabase.table("tickets").insert({
            "guild_id": str(guild_id),
            "user_id": str(user_id),
            "channel_id": str(channel_id),
            "topic_code": topic_code,
            "ticket_id": ticket_number,
            "status": "open",
            "last_message_at": "now()"
        }).execute()
        return {"success": True}
    except Exception as e:
        print(f"Create Ticket Error: {e}")
        return {"success": False, "error": str(e)}

async def get_ticket_by_channel(channel_id: str):
    if not supabase: return None
    try:
        res = supabase.table("tickets").select("*").eq("channel_id", str(channel_id)).execute()
        return res.data[0] if res.data else None
    except:
        return None

async def update_ticket_activity(channel_id: str):
    if not supabase: return
    try:
        supabase.table("tickets").update({"last_message_at": "now()"}).eq("channel_id", str(channel_id)).execute()
    except: pass

async def close_ticket_db(channel_id: str, log_url: str = None):
    if not supabase: return
    try:
        data = {"status": "closed", "closed_at": "now()"}
        if log_url: data["log_url"] = log_url
        supabase.table("tickets").update(data).eq("channel_id", str(channel_id)).execute()
    except Exception as e:
        print(f"Close Ticket Error: {e}")

async def get_active_tickets(guild_id: str):
    if not supabase: return []
    try:
        res = supabase.table("tickets").select("*").eq("guild_id", str(guild_id)).eq("status", "open").execute()
        return res.data
    except: return []

async def check_daily_ticket_limit(user_id: str):
    if not supabase: return True
    try:
        # Check tickets created by user in last 24h
        time_limit = (datetime.datetime.now() - datetime.timedelta(days=1)).isoformat()
        res = supabase.table("tickets").select("id", count="exact").eq("user_id", str(user_id)).gte("created_at", time_limit).execute()
        count = res.count if res.count is not None else len(res.data)
        return count < 3000 # Limit as requested (though 3000 is huge, maybe per server?)
    except: return True

async def get_closed_tickets(guild_id: str, limit: int = 20):
    if not supabase: return []
    try:
        # Fetch recently closed tickets
        res = supabase.table("tickets").select("*").eq("guild_id", str(guild_id)).eq("status", "closed").order("closed_at", desc=True).limit(limit).execute()
        return res.data
    except Exception as e:
        print(f"Get History Error: {e}")
        return []

async def save_rank_card_db(user_id: str, guild_id: str, config: dict):
    if not supabase: return {"success": False, "error": "Database not connected"}
    try:
        data = {
            "user_id": str(user_id),
            "guild_id": str(guild_id),
            "theme": config.get("theme", "pink"),
            "bg_type": config.get("bgType", "glass"),
            "overlay_opacity": config.get("overlayOpacity", 0.2),
            "show_tape": config.get("showTape", True),
            "stickers": config.get("stickers", []),
            "updated_at": "now()"
        }
        supabase.table("rank_cards").upsert(data).execute()
        return {"success": True}
    except Exception as e:
        print(f"Save Rank Card Error: {e}")
        return {"success": False, "error": str(e)}

async def get_rank_card_db(user_id: str, guild_id: str):
    if not supabase: return None
    try:
        res = supabase.table("rank_cards").select("*").eq("user_id", str(user_id)).eq("guild_id", str(guild_id)).execute()
        if res.data:
            c = res.data[0]
            # Convert DB fields back to Frontend camelCase
            return {
                "theme": c.get("theme"),
                "bgType": c.get("bg_type"),
                "overlayOpacity": float(c.get("overlay_opacity", 0.2)),
                "showTape": c.get("show_tape"),
                "stickers": c.get("stickers")
            }
        return None
    except Exception as e:
        print(f"Get Rank Card Error: {e}")
        return None

async def get_active_missions(mission_type: str):
    """
    Get currently active missions of a specific type.
    """
    if not supabase: return []
    res = supabase.table("missions").select("*").eq("mission_type", mission_type).eq("is_active", True).execute()
    return res.data

async def rotate_daily_missions():
    """
    Randomly select 4 daily missions to be active.
    """
    if not supabase: return
    
    # 1. Deactivate all daily missions
    supabase.table("missions").update({"is_active": False}).eq("mission_type", "daily").execute()
    
    # 2. Get all daily missions
    all_daily = supabase.table("missions").select("id").eq("mission_type", "daily").execute()
    if not all_daily.data: return
    
    import random
    selected = random.sample(all_daily.data, k=min(4, len(all_daily.data)))
    selected_ids = [m["id"] for m in selected]
    
    # 3. Activate selected
    supabase.table("missions").update({"is_active": True}).in_("id", selected_ids).execute()
    print(f"Rotated Daily Missions: {selected_ids}")

async def rotate_weekly_missions():
    """
    Randomly select 2 weekly missions to be active.
    """
    if not supabase: return
    
    # 1. Deactivate all weekly missions
    supabase.table("missions").update({"is_active": False}).eq("mission_type", "weekly").execute()
    
    # 2. Get all weekly missions
    all_weekly = supabase.table("missions").select("id").eq("mission_type", "weekly").execute()
    if not all_weekly.data: return
    
    import random
    selected = random.sample(all_weekly.data, k=min(2, len(all_weekly.data)))
    selected_ids = [m["id"] for m in selected]
    
    # 3. Activate selected
    supabase.table("missions").update({"is_active": True}).in_("id", selected_ids).execute()
    print(f"Rotated Weekly Missions: {selected_ids}")

async def get_user_active_missions(user_id: str):
    """
    Get user progress ONLY for currently active missions + lifetime.
    Optimized to fetch only relevant progress rows.
    """
    if not supabase: return []
    
    # 1. Get active daily/weekly + all lifetime missions
    m_res = supabase.table("missions").select("*").or_("mission_type.eq.lifetime,is_active.eq.true").execute()
    active_missions = m_res.data
    if not active_missions: return []

    active_keys = [m["key"] for m in active_missions]
    
    # 2. Get progress ONLY for these active keys
    progress_res = supabase.table("user_progress").select("mission_key, current_count, is_claimed, last_updated")\
        .eq("user_id", user_id)\
        .in_("mission_key", active_keys)\
        .execute()
        
    progress_dict = {p["mission_key"]: p for p in progress_res.data}
    
    combined = []
    for m in active_missions:
        p = progress_dict.get(m["key"], {"current_count": 0, "is_claimed": False, "last_updated": None})
        
        # Reset Logic check for daily missions
        if m["mission_type"] == "daily" and is_reset_needed(p.get("last_updated")):
             p = {"current_count": 0, "is_claimed": False}
        
        combined.append({
            **m,
            "current_count": p["current_count"],
            "is_claimed": p["is_claimed"]
        })
        
    return combined

async def update_user_plan(user_id: str, plan_type: str):
    """
    Updates user plan and sets expiry date (1 month).
    """
    if not supabase: return False
    
    # 1 Month = 31 days just to be safe
    expires_at = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=31)).isoformat()
    
    data = {
        "plan_type": plan_type,
        "expires_at": expires_at,
        "trial_claimed": True, # Upgrading counts as trial used
        "notification_sent": False
    }
    
    try:
        res = supabase.table("user_stats").select("*").eq("user_id", str(user_id)).execute()
        if res.data:
            supabase.table("user_stats").update(data).eq("user_id", str(user_id)).execute()
        else:
            data["user_id"] = str(user_id)
            supabase.table("user_stats").insert(data).execute()
        return True
    except Exception as e:
        print(f"Update User Plan Error: {e}")
        return False
