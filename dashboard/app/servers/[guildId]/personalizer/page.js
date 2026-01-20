"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLanguage } from "../../../context/LanguageContext";

export default function PersonalizerPage() {
    const { guildId } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const { t, language } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [guildData, setGuildData] = useState(null);
    const [manageableGuilds, setManageableGuilds] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [userPlan, setUserPlan] = useState({ plan_type: "free" });

    const [settings, setSettings] = useState({
        bot_nickname: "An An",
        bot_bio: "Cheerfully serving Papa! 🌸✨",
        activity_type: "LISTENING", // PLAYING, LISTENING, WATCHING, COMPETING
        status_text: "/help",
        avatar_url: "/ANAN1.png",
        banner_color: "#ff85c1"
    });

    const profileRef = React.useRef(null);
    const guildRef = React.useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
            if (guildRef.current && !guildRef.current.contains(event.target)) setIsDropdownOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!guildId) return;

        const fetchData = async () => {
            try {
                // Fetch Guild Stats & Info
                const guildsRes = await fetch("/api/proxy/guilds");
                const guildsData = await guildsRes.json();
                const current = guildsData.find(g => g.id === guildId);
                setGuildData(current);
                setManageableGuilds(guildsData);

                // Fetch current settings
                const settingsRes = await fetch(`/api/proxy/guild/${guildId}/settings`);
                const settingsData = await settingsRes.json();
                if (settingsData && !settingsData.error) {
                    setSettings(prev => ({
                        ...prev,
                        ...settingsData
                    }));
                }

                // Fetch Plan
                if (session?.user?.id) {
                    const planRes = await fetch("/api/proxy/action", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            action: "get_missions",
                            user_id: session.user.id,
                            guild_id: guildId
                        })
                    });
                    const planData = await planRes.json();
                    if (planData.plan) setUserPlan(planData.plan);
                }
            } catch (err) {
                console.error("Failed to fetch data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [guildId]);

    const handleSave = async () => {
        if (userPlan.plan_type === 'free') return;
        setSaving(true);
        try {
            const res = await fetch("/api/proxy/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "save_personalizer_settings",
                    guild_id: guildId,
                    user_id: session?.user?.id,
                    settings: settings
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(t.personalizer.saveSuccess);
            } else {
                alert("Error: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            console.error("Save Error:", err);
            alert("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loader">🌸 Transforming An An...</div>;

    const activityLabel = {
        PLAYING: "Playing",
        LISTENING: "Listening to",
        WATCHING: "Watching",
        COMPETING: "Competing in"
    };

    return (
        <div className="mee6-container">
            <aside className="mee6-sidebar">
                <div className="guild-switcher-wrapper">
                    <div className={`guild-selector ${isDropdownOpen ? 'active' : ''}`} ref={guildRef} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                        <div className="guild-current">
                            {guildData?.icon ?
                                <img src={`https://cdn.discordapp.com/icons/${guildId}/${guildData.icon}.png`} alt="G" className="guild-icon" /> :
                                <div className="guild-init">{guildData?.name?.[0] || 'A'}</div>
                            }
                            <span>{guildData?.name || "Loading..."}</span>
                            <div className="chevron">⌵</div>
                        </div>
                    </div>
                </div>

                <div className="sidebar-list">
                    <div className="menu-item" onClick={() => router.push(`/servers/${guildId}`)}>{t.sidebar.dashboard}</div>
                    <div className="menu-item" onClick={() => router.push(`/servers/${guildId}/leaderboard`)}>{t.sidebar.leaderboard}</div>
                    <div className="menu-item active">{t.sidebar.personalizer}</div>

                    <div className="menu-category">{t.sidebar.catEssentials}</div>
                    <div className="menu-item" onClick={() => router.push(`/servers/${guildId}/welcome`)}>{t.sidebar.welcome}</div>
                    <div className="menu-item">{t.sidebar.reaction}</div>
                    <div className="menu-item">{t.sidebar.moderator}</div>
                </div>
            </aside>

            <div className="mee6-main-wrapper">
                <header className="mee6-header">
                    <div className="header-left">
                        <div className="logo-text">{t.personalizer.title.toUpperCase()} 🌸</div>
                    </div>
                    <div className="header-right">
                        <button
                            className={`save-btn ${saving ? 'loading' : ''}`}
                            onClick={handleSave}
                            disabled={saving || userPlan.plan_type === 'free'}
                        >
                            {saving ? "Saving..." : "Save Changes ✨"}
                        </button>
                    </div>
                </header>

                <main className="mee6-content animate-fade">
                    <div className="personalizer-layout">
                        {/* Forms Column */}
                        <div className="forms-col">
                            <div className="settings-card glass">
                                <h3>{t.personalizer.nickname}</h3>
                                <p className="sc-desc">{t.personalizer.nicknameDesc}</p>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="glass-input"
                                        value={settings.bot_nickname}
                                        onChange={(e) => setSettings({ ...settings, bot_nickname: e.target.value })}
                                        placeholder="An An"
                                    />
                                </div>

                                <div className="divider"></div>

                                <h3>{t.personalizer.activity}</h3>
                                <p className="sc-desc">{t.personalizer.globalWarning}</p>
                                <div className="input-row">
                                    <div className="input-group" style={{ flex: 1 }}>
                                        <label>{t.personalizer.activityType}</label>
                                        <select
                                            className="glass-input"
                                            value={settings.activity_type}
                                            onChange={(e) => setSettings({ ...settings, activity_type: e.target.value })}
                                        >
                                            <option value="PLAYING">Playing</option>
                                            <option value="LISTENING">Listening to</option>
                                            <option value="WATCHING">Watching</option>
                                            <option value="COMPETING">Competing in</option>
                                        </select>
                                    </div>
                                    <div className="input-group" style={{ flex: 2 }}>
                                        <label>{t.personalizer.statusText}</label>
                                        <input
                                            type="text"
                                            className="glass-input"
                                            value={settings.status_text}
                                            onChange={(e) => setSettings({ ...settings, status_text: e.target.value })}
                                            placeholder={t.personalizer.statusPlaceholder}
                                        />
                                    </div>
                                </div>

                                <div className="divider"></div>

                                <h3>Appearance (Coming Soon)</h3>
                                <div className="input-group">
                                    <label>{t.personalizer.avatarUrl}</label>
                                    <input type="text" className="glass-input" disabled value={settings.avatar_url} />
                                </div>
                                <div className="input-group">
                                    <label>{t.personalizer.bio}</label>
                                    <textarea
                                        className="glass-input"
                                        rows="3"
                                        value={settings.bot_bio}
                                        onChange={(e) => setSettings({ ...settings, bot_bio: e.target.value })}
                                        placeholder={t.personalizer.bioPlaceholder}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Preview Column */}
                        <div className="preview-col">
                            <div className="preview-sticky">
                                <h4 className="preview-label">{t.personalizer.preview}</h4>

                                {/* Member List Preview */}
                                <div className="discord-preview-card member-list-preview">
                                    <span className="dp-label">{t.personalizer.memberList}</span>
                                    <div className="member-item">
                                        <div className="avatar-wrapper">
                                            <img src={settings.avatar_url} alt="B" />
                                            <div className="status-indicator online"></div>
                                        </div>
                                        <div className="member-info">
                                            <div className="member-name">
                                                {settings.bot_nickname}
                                                <span className="bot-tag">APP</span>
                                            </div>
                                            <div className="member-status">
                                                {activityLabel[settings.activity_type]} {settings.status_text}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Profile Card Preview */}
                                <div className="discord-preview-card profile-preview">
                                    <span className="dp-label">{t.personalizer.profilePreview}</span>
                                    <div className="profile-card">
                                        <div className="profile-banner" style={{ background: settings.banner_color }}></div>
                                        <div className="profile-body">
                                            <div className="profile-avatar-wrapper">
                                                <img src={settings.avatar_url} alt="B" />
                                                <div className="status-indicator-large online"></div>
                                            </div>
                                            <div className="profile-content">
                                                <div className="profile-name">
                                                    {settings.bot_nickname}
                                                    <span className="bot-tag">APP</span>
                                                </div>
                                                <div className="profile-username">anan_bot#0001</div>

                                                <div className="profile-divider"></div>

                                                <div className="profile-section">
                                                    <h5>ABOUT ME</h5>
                                                    <div className="profile-bio">{settings.bot_bio}</div>
                                                </div>

                                                <div className="profile-section">
                                                    <h5>{activityLabel[settings.activity_type].toUpperCase()}</h5>
                                                    <div className="profile-activity">
                                                        <div className="activity-icon">🌸</div>
                                                        <div className="activity-details">
                                                            <div className="activity-name">{settings.status_text}</div>
                                                            <div className="activity-state">Working hard for Papa!</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <style jsx>{`
                .mee6-container { display: flex; min-height: 100vh; background: #fdf2f8; color: #4a4a68; }
                .mee6-sidebar { width: 280px; background: white; border-right: 1px solid rgba(214, 207, 255, 0.3); padding: 30px 15px; position: sticky; top: 0; height: 100vh; }
                .sidebar-list { margin-top: 30px; }
                .menu-item { padding: 12px 18px; margin-bottom: 8px; border-radius: 12px; font-weight: 700; color: #6b7280; cursor: pointer; transition: 0.2s; }
                .menu-item:hover { background: #f5f3ff; color: #8b5cf6; }
                .menu-item.active { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(255,183,226,0.4); }
                .menu-category { font-size: 11px; font-weight: 900; color: #9ca3af; margin: 30px 0 12px 18px; letter-spacing: 0.1em; }

                .mee6-main-wrapper { flex: 1; display: flex; flex-direction: column; }
                .mee6-header { height: 80px; background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(214, 207, 255, 0.2); display: flex; align-items: center; justify-content: space-between; padding: 0 50px; position: sticky; top: 0; z-index: 100; }
                .logo-text { font-size: 20px; font-weight: 950; color: #ff85c1; }
                .save-btn { background: #ff85c1; color: white; border: none; padding: 12px 25px; border-radius: 12px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 12px rgba(255,133,193,0.3); transition: 0.3s; }
                .save-btn:hover:not(:disabled) { transform: scale(1.05); filter: brightness(1.1); }
                .save-btn:disabled { background: #cbd5e1; cursor: not-allowed; box-shadow: none; }

                .mee6-content { padding: 40px; max-width: 1300px; margin: 0 auto; width: 100%; }
                .personalizer-layout { display: grid; grid-template-columns: 1fr 400px; gap: 40px; }
                
                .settings-card { padding: 40px; border-radius: 24px; }
                .settings-card h3 { font-size: 18px; font-weight: 850; margin-bottom: 5px; }
                .sc-desc { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
                .divider { height: 1px; background: rgba(0,0,0,0.05); margin: 30px 0; }
                
                .input-group { margin-bottom: 20px; }
                .input-group label { display: block; font-size: 12px; font-weight: 800; margin-bottom: 8px; color: #6b7280; }
                .input-row { display: flex; gap: 20px; }
                .glass-input { width: 100%; background: white; border: 2px solid #f3f4f6; border-radius: 14px; padding: 12px 16px; font-size: 14px; outline: none; transition: 0.3s; }
                .glass-input:focus { border-color: var(--primary); }

                /* Discord Preview Styles */
                .preview-sticky { position: sticky; top: 120px; }
                .preview-label { font-size: 12px; font-weight: 900; color: #9ca3af; margin-bottom: 20px; letter-spacing: 0.1em; }
                .discord-preview-card { background: #2f3136; border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 1px solid rgba(255,255,255,0.05); }
                .dp-label { display: block; font-size: 11px; font-weight: 800; color: #8e9297; margin-bottom: 15px; text-transform: uppercase; }

                /* Member List Item */
                .member-item { display: flex; align-items: center; gap: 12px; }
                .avatar-wrapper { position: relative; width: 32px; height: 32px; }
                .avatar-wrapper img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
                .status-indicator { position: absolute; bottom: -2px; right: -2px; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #2f3136; }
                .online { background: #3ba55c; }
                .member-info { display: flex; flex-direction: column; overflow: hidden; }
                .member-name { color: #8e9297; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 5px; }
                .bot-tag { background: #5865f2; color: white; font-size: 9px; padding: 1px 4px; border-radius: 3px; font-weight: 700; }
                .member-status { color: #b9bbbe; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

                /* Profile Card */
                .profile-card { background: #18191c; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 16px rgba(0,0,0,0.3); }
                .profile-banner { height: 60px; }
                .profile-body { padding: 0 16px 16px; margin-top: -30px; }
                .profile-avatar-wrapper { position: relative; width: 80px; height: 80px; margin-bottom: 10px; }
                .profile-avatar-wrapper img { width: 100%; height: 100%; border-radius: 50%; border: 6px solid #18191c; object-fit: cover; }
                .status-indicator-large { position: absolute; bottom: 5px; right: 5px; width: 16px; height: 16px; border-radius: 50%; border: 4px solid #18191c; }
                .profile-name { color: white; font-weight: 700; font-size: 18px; display: flex; align-items: center; gap: 8px; }
                .profile-username { color: #b9bbbe; font-size: 13px; margin-bottom: 12px; }
                .profile-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 12px 0; }
                .profile-section h5 { color: white; font-size: 11px; font-weight: 800; margin-bottom: 8px; }
                .profile-bio { color: #dcddde; font-size: 13px; line-height: 1.4; margin-bottom: 15px; }
                .profile-activity { display: flex; gap: 12px; align-items: center; }
                .activity-icon { font-size: 24px; width: 40px; height: 40px; background: #2f3136; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
                .activity-name { color: white; font-weight: 700; font-size: 14px; }
                .activity-state { color: #b9bbbe; font-size: 13px; }

                /* Transitions */
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade { animation: fadeIn 0.5s ease-out forwards; }
                .loader { height: 100vh; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #ff85c1; font-weight: 800; background: #fdf2f8; }
            `}</style>
        </div>
    );
}
