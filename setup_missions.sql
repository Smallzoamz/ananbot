DROP TABLE IF EXISTS user_missions CASCADE;
DROP TABLE IF EXISTS missions CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE; -- Also drop the old table linking to it

-- Create Missions Table
CREATE TABLE missions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL, -- e.g. 'daily_msg_50'
    title TEXT NOT NULL,
    description TEXT,
    mission_type TEXT NOT NULL, -- 'daily', 'weekly', 'lifetime'
    target_count INT DEFAULT 1,
    reward_xp INT DEFAULT 0,
    reward_coins INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE, -- For rotation logic
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create User Missions Progress Table
CREATE TABLE IF NOT EXISTS user_missions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    guild_id TEXT, -- Optional, if mission is server-specific
    mission_key TEXT REFERENCES missions(key) ON DELETE CASCADE,
    current_count INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    is_claimed BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, mission_key)
);

-- Enable RLS
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY;

-- Policies (Public Read for Missions, User-specific for Progress)
CREATE POLICY "Public Read Missions" ON missions FOR SELECT USING (true);
CREATE POLICY "User View Own Progress" ON user_missions FOR SELECT USING (auth.uid()::text = user_id);
-- Note: Bot needs Service Role to update progress, so we don't strictly need detailed RLS for writes if using Service Role.

-- Initial Seed Data (20 Draft Missions)
INSERT INTO missions (key, title, description, mission_type, target_count, reward_xp, reward_coins) VALUES
-- Daily
('daily_msg_50', 'Chatbox Star', 'Send 50 messages today', 'daily', 50, 200, 100),
('daily_greet', 'Morning Greeting', 'Say Good Morning or สวัสดี', 'daily', 1, 100, 50),
('daily_voice_30m', 'Voice Chatter', 'Stay in voice channel for 30m', 'daily', 30, 150, 80),
('daily_react_10', 'Emoji Lover', 'React to 10 messages', 'daily', 10, 50, 30),
('daily_bump', 'Bumper', 'Use /bump command', 'daily', 1, 300, 150),
('daily_game_1h', 'Gamer Zone', 'Play any game for 1 hour', 'daily', 60, 200, 100),
('daily_night_msg', 'Night Owl', 'Send message between 02:00-05:00', 'daily', 1, 250, 120),

-- Weekly
('weekly_mention_5', 'Social Butterfly', 'Mention 5 different friends', 'weekly', 5, 300, 150),
('weekly_voice_10h', 'Voice Marathon', 'Stay in voice for 10 hours', 'weekly', 600, 1000, 500),
('weekly_media_5', 'Content Creator', 'Post 5 images in media', 'weekly', 5, 500, 250),
('weekly_weekend_active', 'Weekend Warrior', 'Active Sat & Sun', 'weekly', 2, 600, 300),
('weekly_boost', 'Server Booster', 'Boost the server', 'weekly', 1, 5000, 2000),
('weekly_invite_1', 'Inviter', 'Invite 1 new member', 'weekly', 1, 800, 400),

-- Lifetime
('life_lvl_5', 'First Steps', 'Reach Level 5', 'lifetime', 5, 500, 0),
('life_rich_10k', 'Big Saver', 'Accumulate 10,000 Coins', 'lifetime', 10000, 1000, 0),
('life_popular_100', 'Friendly Neighbor', 'Get 100 reactions total', 'lifetime', 100, 800, 0),
('life_voice_100h', 'Voice Legend', 'Spend 100 hours in voice', 'lifetime', 6000, 2000, 0),
('life_shop_buy', 'Supporter', 'Buy first shop item', 'lifetime', 1, 300, 100),
('life_theme_1', 'Profile Decorator', 'Change profile theme', 'lifetime', 1, 200, 50),
('life_quest_50', 'Quest Master', 'Complete 50 Daily Missions', 'lifetime', 50, 2500, 0),
-- New System Missions 🌸
('setup_template', 'Grand Architect', 'Setup server using a template', 'lifetime', 1, 500, 200),
('invite_bot', 'Bot Welcomer', 'Invite An An to your server', 'lifetime', 1, 200, 100),
('invite_friends', 'Social Recruiter', 'Invite friends to join the server', 'lifetime', 1, 100, 50),
('clear_guild', 'Clean Slate', 'Perform a guild reset', 'lifetime', 1, 100, 50)
ON CONFLICT (key) DO NOTHING;
