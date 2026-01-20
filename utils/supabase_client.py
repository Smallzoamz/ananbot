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
    
    # 1. Get current progress
    res = supabase.table("user_progress").select("*").eq("user_id", user_id).eq("mission_key", mission_key).execute()
    
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
            }).eq("user_id", user_id).eq("mission_key", mission_key).execute()
        elif not current["is_claimed"]:
            new_count = current["current_count"] + increment
            supabase.table("user_progress").update({
                "current_count": new_count,
                "last_updated": "now()"
            }).eq("user_id", user_id).eq("mission_key", mission_key).execute()

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
        return {"plan_type": "premium", "expires_at": None, "is_lifetime": True}
        
    if not supabase: return {"plan_type": "free", "expires_at": None}
    
    res = supabase.table("user_stats").select("plan_type, expires_at").eq("user_id", str(user_id)).execute()
    if res.data:
        return res.data[0]
    return {"plan_type": "free", "expires_at": None}

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
    VALID_COLUMNS = [
        "guild_id", "welcome_enabled", "welcome_channel_id", "welcome_message", 
        "welcome_image_url", "goodbye_enabled", "goodbye_channel_id", 
        "goodbye_message", "goodbye_image_url", "bot_nickname", "bot_bio",
        "activity_type", "status_text", "avatar_url", "banner_color"
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
