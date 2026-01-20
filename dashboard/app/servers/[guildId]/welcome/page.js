"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLanguage } from "../../../context/LanguageContext";

export default function WelcomeSettings() {
    const { guildId } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const { t, language } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [channels, setChannels] = useState([]);
    const [stats, setStats] = useState({ total_members: 0, online_members: 0, status: "loading" });
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [manageableGuilds, setManageableGuilds] = useState([]);
    const [guildData, setGuildData] = useState(null);

    const [settings, setSettings] = useState({
        welcome_enabled: false,
        welcome_channel_id: "",
        welcome_message: "",
        welcome_image_url: "",
        goodbye_enabled: false,
        goodbye_channel_id: "",
        goodbye_message: "",
        goodbye_image_url: ""
    });

    const profileRef = React.useRef(null);
    const guildRef = React.useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (guildRef.current && !guildRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!guildId) return;

        const fetchData = async () => {
            try {
                // Fetch Channels & Structure
                const structRes = await fetch(`/api/proxy/guild/${guildId}/structure`);
                const structData = await structRes.json();

                const allChannels = [];
                if (Array.isArray(structData)) {
                    structData.forEach(cat => {
                        cat.channels.forEach(ch => {
                            if (ch.type === 0 || ch.type === "text") { // text
                                allChannels.push(ch);
                            }
                        });
                    });
                }
                setChannels(allChannels);

                // Fetch Guild Stats
                const statsRes = await fetch(`/api/proxy/guild/${guildId}/stats`);
                const statsData = await statsRes.json();
                setStats(statsData);

                // Fetch Guild Basic Info
                const guildsRes = await fetch("/api/proxy/guilds");
                const guildsData = await guildsRes.json();
                const current = guildsData.find(g => g.id === guildId);
                setGuildData(current);
                setManageableGuilds(guildsData);

                // Fetch Settings
                const settingsRes = await fetch(`/api/proxy/guild/${guildId}/settings`);
                const settingsData = await settingsRes.json();
                if (settingsData && !settingsData.error) {
                    setSettings({
                        ...settings,
                        ...settingsData
                    });
                }
            } catch (err) {
                console.error("Failed to fetch data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [guildId]);

    const handleTestWelcome = async () => {
        const res = await fetch("/api/proxy/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "test_welcome_web",
                guild_id: guildId,
                user_id: session?.user?.id,
                settings: settings
            })
        });
        const data = await res.json();
        if (data.success) {
            alert("Test Welcome message sent to Discord! ✨🌸");
        } else {
            alert("Error sending test: " + (data.error || "Unknown error"));
        }
    };

    const handleTestGoodbye = async () => {
        const res = await fetch("/api/proxy/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "test_goodbye_web",
                guild_id: guildId,
                user_id: session?.user?.id,
                settings: settings
            })
        });
        const data = await res.json();
        if (data.success) {
            alert("Test Goodbye message sent to Discord! 🌸");
        } else {
            alert("Error sending test: " + (data.error || "Unknown error"));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/proxy/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "save_welcome_settings",
                    guild_id: guildId,
                    settings: settings
                })
            });
            const data = await res.json();
            if (data.success) {
                alert("Settings saved successfully! ✨🌸");
            } else {
                alert("Error saving settings: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            console.error("Save Error:", err);
            alert("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loader">🌸 Unfolding Settings...</div>;

    return (
        <div className="mee6-container">
            {/* Sidebar (Perfect match with main dashboard) */}
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
                    {isDropdownOpen && (
                        <div className="guild-dropdown glass animate-pop">
                            <div className="dropdown-label">{t.sidebar.yourServers}</div>
                            {manageableGuilds.filter(g => g.id !== guildId).map(g => (
                                <div key={g.id} className="dropdown-item" onClick={() => {
                                    setIsDropdownOpen(false);
                                    router.push(`/servers/${g.id}`);
                                }}>
                                    {g.icon ?
                                        <img src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`} alt="G" className="guild-icon-mini" /> :
                                        <div className="guild-init-mini">{g.name[0]}</div>
                                    }
                                    <span>{g.name}</span>
                                </div>
                            ))}
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-item back-item" onClick={() => router.push("/servers?redirect=false")}>
                                <span className="icon">←</span>
                                <span>{t.sidebar.selection}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="sidebar-list">
                    <div className="menu-item" onClick={() => router.push(`/servers/${guildId}`)}>{t.sidebar.dashboard}</div>
                    <div className="menu-item" onClick={() => router.push(`/servers/${guildId}/leaderboard`)}>{t.sidebar.leaderboard}</div>
                    <div className="menu-item">{t.sidebar.personalizer}</div>

                    <div className="menu-category">{t.sidebar.catEssentials}</div>
                    <div className="menu-item active">{t.sidebar.welcome}</div>
                    <div className="menu-item">{t.sidebar.reaction}</div>
                    <div className="menu-item">{t.sidebar.moderator}</div>

                    <div className="menu-category">{t.sidebar.catManagement}</div>
                    <div className="menu-item">{t.sidebar.automation}</div>
                    <div className="menu-item">{t.sidebar.commands}</div>
                </div>

                <div className="sidebar-footer">
                    <button className="invite-btn" onClick={() => router.push("/servers?redirect=false")}>← {t.sidebar.switch}</button>
                </div>
            </aside>

            {/* Main Wrapper */}
            <div className="mee6-main-wrapper">
                <header className="mee6-header">
                    <div className="header-left">
                        <div className="logo-text">WELCOME & GOODBYE</div>
                    </div>
                    <div className="header-right">
                        <button className={`pc-btn primary ${saving ? 'loading' : ''}`} onClick={handleSave} disabled={saving} style={{ background: '#ff85c1', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,133,193,0.3)' }}>
                            {saving ? "Saving..." : "Save Changes ✨"}
                        </button>
                        <div className="header-icon">🔔</div>
                        <div className="user-profile-wrapper" ref={profileRef}>
                            <div className="user-profile" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                                <img src={session?.user?.image} alt="U" />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="mee6-content animate-fade">
                    <div className="settings-grid">

                        {/* Welcome Card */}
                        <div className="settings-card glass animate-pop">
                            <div className="sc-header">
                                <div className="sc-icon">✨</div>
                                <h3>Welcome Message</h3>
                                <div className="sc-toggle">
                                    <input
                                        type="checkbox"
                                        id="welcome_enabled"
                                        checked={settings.welcome_enabled}
                                        onChange={(e) => setSettings({ ...settings, welcome_enabled: e.target.checked })}
                                    />
                                    <label htmlFor="welcome_enabled"></label>
                                </div>
                            </div>
                            <div className="sc-body">
                                <p className="sc-desc">Send a warm welcome to new members when they join your server.</p>

                                <div className="input-group">
                                    <label>Welcome Channel</label>
                                    <select
                                        className="glass-input"
                                        value={settings.welcome_channel_id}
                                        onChange={(e) => setSettings({ ...settings, welcome_channel_id: e.target.value })}
                                    >
                                        <option value="">Search for a channel...</option>
                                        {channels.map(ch => (
                                            <option key={ch.id} value={ch.id}># {ch.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label>Welcome Message</label>
                                    <textarea
                                        className="glass-input"
                                        rows="4"
                                        placeholder="ทักทายคุณ {user} ที่ได้ก้าวเข้าสู่ครอบครัวของเรานะคะ! 🌸\nAn An ดีใจมากเลยค่ะที่มีสมาชิกเพิ่มขึ้นอีกท่านแล้ว ✨"
                                        value={settings.welcome_message}
                                        onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
                                    ></textarea>
                                    <span className="input-hint">Use <b>{"{user}"}</b>, <b>{"{guild}"}</b>, <b>{"{count}"}</b> as placeholders.</span>
                                    <span className="input-hint" style={{ color: 'var(--primary)', fontWeight: '800' }}>✨ Leave empty to use An An's Premium Welcome Embed!</span>
                                </div>

                                <div className="input-group">
                                    <label>Image / GIF URL</label>
                                    <input
                                        type="text"
                                        className="glass-input"
                                        placeholder="https://media.giphy.com/media/.../giphy.gif"
                                        value={settings.welcome_image_url}
                                        onChange={(e) => setSettings({ ...settings, welcome_image_url: e.target.value })}
                                    />
                                    <span className="input-hint">Leave empty to use the default welcome GIF.</span>
                                </div>
                                <div style={{ marginTop: '20px' }}>
                                    <button className="glass-button secondary" onClick={handleTestWelcome}>
                                        🧪 Test Welcome Message
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Goodbye Card */}
                        <div className="settings-card glass animate-pop" style={{ animationDelay: "0.1s" }}>
                            <div className="sc-header">
                                <div className="sc-icon">😢</div>
                                <h3>Goodbye Message</h3>
                                <div className="sc-toggle">
                                    <input
                                        type="checkbox"
                                        id="goodbye_enabled"
                                        checked={settings.goodbye_enabled}
                                        onChange={(e) => setSettings({ ...settings, goodbye_enabled: e.target.checked })}
                                    />
                                    <label htmlFor="goodbye_enabled"></label>
                                </div>
                            </div>
                            <div className="sc-body">
                                <p className="sc-desc">Say goodbye to members when they leave your server.</p>

                                <div className="input-group">
                                    <label>Goodbye Channel</label>
                                    <select
                                        className="glass-input"
                                        value={settings.goodbye_channel_id}
                                        onChange={(e) => setSettings({ ...settings, goodbye_channel_id: e.target.value })}
                                    >
                                        <option value="">Search for a channel...</option>
                                        {channels.map(ch => (
                                            <option key={ch.id} value={ch.id}># {ch.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label>Goodbye Message</label>
                                    <textarea
                                        className="glass-input"
                                        rows="4"
                                        placeholder="ลาก่อนนะคะคุณ {user} หวังว่าจะได้พบกันใหม่อีกครั้งค่ะ 🌸"
                                        value={settings.goodbye_message}
                                        onChange={(e) => setSettings({ ...settings, goodbye_message: e.target.value })}
                                    ></textarea>
                                    <span className="input-hint" style={{ color: 'var(--primary)', fontWeight: '800' }}>✨ Leave empty to use An An's Default Goodbye message!</span>
                                </div>

                                <div className="input-group">
                                    <label>Image / GIF URL</label>
                                    <input
                                        type="text"
                                        className="glass-input"
                                        placeholder="https://media.giphy.com/media/.../giphy.gif"
                                        value={settings.goodbye_image_url}
                                        onChange={(e) => setSettings({ ...settings, goodbye_image_url: e.target.value })}
                                    />
                                </div>
                                <div style={{ marginTop: '20px' }}>
                                    <button className="glass-button secondary" onClick={handleTestGoodbye}>
                                        🧪 Test Goodbye Message
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>

            <style jsx>{`
                .mee6-container { display: flex; min-height: 100vh; background: #fdf2f8; color: #4a4a68; font-family: var(--font-main); }
                
                /* Sidebar */
                .mee6-sidebar { 
                    width: 280px; 
                    background: white; 
                    border-right: 1px solid rgba(214, 207, 255, 0.3); 
                    display: flex; 
                    flex-direction: column; 
                    padding: 30px 15px; 
                    position: sticky; 
                    top: 0; 
                    height: 100vh; 
                    z-index: 200; 
                    box-shadow: 10px 0 30px rgba(0,0,0,0.02); 
                }
                .guild-switcher-wrapper { position: relative; margin-bottom: 35px; z-index: 300; }
                .guild-selector { padding: 15px; border-radius: 24px; cursor: pointer; background: #fdf2f8; border: 1px solid rgba(255,183,226,0.2); transition: 0.3s; }
                .guild-selector:hover, .guild-selector.active { transform: scale(1.02); background: #fce7f3; border-color: var(--primary); }
                .guild-current { display: flex; align-items: center; gap: 12px; }
                .guild-current img { width: 36px; height: 36px; border-radius: 10px; border: 2px solid white; }
                .guild-init { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; font-weight: 800; color: white; }
                .guild-current span { flex: 1; font-weight: 800; font-size: 15px; color: #4a4a68; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .chevron { opacity: 0.4; font-size: 18px; }

                .guild-dropdown { position: absolute; top: calc(100% + 10px); left: 0; width: 100%; background: white; border-radius: 24px; border: 1px solid rgba(139, 92, 246, 0.1); box-shadow: 0 15px 40px rgba(0,0,0,0.1); padding: 10px; z-index: 1000; }
                .dropdown-label { font-size: 10px; font-weight: 900; color: #9ca3af; padding: 10px 15px; letter-spacing: 0.1em; }
                .dropdown-item { display: flex; align-items: center; gap: 12px; padding: 10px 15px; border-radius: 12px; cursor: pointer; transition: 0.2s; color: #4a4a68; font-weight: 700; font-size: 14px; }
                .dropdown-item:hover { background: #f5f3ff; color: #8b5cf6; }
                .guild-icon-mini { width: 24px; height: 24px; border-radius: 6px; }
                .guild-init-mini { width: 24px; height: 24px; border-radius: 6px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; }
                .dropdown-divider { height: 1px; background: #f3f4f6; margin: 8px 0; }
                .back-item { color: #8b5cf6; background: #f5f3ff; margin-top: 5px; }

                .sidebar-list { flex: 1; }
                .menu-item { padding: 12px 18px; margin-bottom: 8px; border-radius: 12px; font-size: 14px; font-weight: 700; color: #6b7280; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
                .menu-item:hover { background: #f5f3ff; color: #8b5cf6; transform: translateX(5px); }
                .menu-item.active { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(255,183,226,0.4); }
                .menu-category { font-size: 11px; font-weight: 900; color: #9ca3af; margin: 30px 0 12px 18px; letter-spacing: 0.1em; }

                /* Header */
                .mee6-main-wrapper { flex: 1; display: flex; flex-direction: column; }
                .mee6-header { height: 80px; border-bottom: 1px solid rgba(214, 207, 255, 0.2); background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: space-between; padding: 0 50px; position: sticky; top: 0; z-index: 100; }
                .logo-text { font-size: 24px; font-weight: 900; color: #ff85c1; letter-spacing: 1px; }
                .header-right { display: flex; align-items: center; gap: 25px; }
                .header-icon { font-size: 22px; color: #4a4a68; opacity: 0.6; cursor: pointer; }
                .user-profile img { width: 38px; height: 38px; border-radius: 50%; cursor: pointer; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }

                /* Content */
                .mee6-content { padding: 50px; max-width: 1400px; margin: 0 auto; width: 100%; }
                .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 30px; }
                .settings-card { padding: 40px; border-radius: 24px; position: relative; }
                .sc-header { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; }
                .sc-icon { font-size: 24px; background: white; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
                .sc-header h3 { flex: 1; font-size: 20px; font-weight: 800; color: #4a4a68; }
                .sc-desc { color: #6b7280; font-size: 14px; margin-bottom: 30px; line-height: 1.6; }

                .input-group { margin-bottom: 25px; }
                .input-group label { display: block; font-size: 13px; font-weight: 800; color: #4a4a68; margin-bottom: 12px; }
                .glass-input { width: 100%; background: white; border: 2px solid #f3f4f6; border-radius: 14px; padding: 14px 18px; font-size: 15px; color: #4a4a68; outline: none; transition: 0.3s; }
                .glass-input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-glow); }
                .input-hint { display: block; font-size: 12px; color: #9ca3af; margin-top: 10px; }

                /* Toggle */
                .sc-toggle label { display: block; width: 54px; height: 30px; background: #e5e7eb; border-radius: 100px; cursor: pointer; position: relative; transition: 0.3s; }
                .sc-toggle input { display: none; }
                .sc-toggle label::after { content: ''; position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; background: white; border-radius: 50%; transition: 0.3s; }
                .sc-toggle input:checked + label { background: #4ade80; }
                .sc-toggle input:checked + label::after { left: 27px; }

                .loader { height: 100vh; display: flex; align-items: center; justify-content: center; font-size: 24px; color: var(--primary); font-weight: 800; background: #fdf2f8; }
                .invite-btn { width: 100%; padding: 14px; background: #f5f3ff; color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.1); border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.3s; text-align: center; }
                .invite-btn:hover { background: #8b5cf6; color: white; }

                .glass-button {
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    padding: 12px 24px;
                    font-weight: 800;
                    font-family: var(--font-main);
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 15px rgba(255, 183, 226, 0.3);
                }

                .glass-button.secondary {
                    background: rgba(255, 255, 255, 0.8);
                    color: #4a4a68;
                    border: 2px solid var(--primary-glow);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                }

                .glass-button:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.1);
                    box-shadow: 0 6px 20px rgba(255, 183, 226, 0.4);
                }

                .glass-button.secondary:hover {
                    background: white;
                    border-color: var(--primary);
                }

                @keyframes pop { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
                .animate-pop { animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade { animation: fadeIn 0.6s ease-out forwards; }
            `}</style>
        </div>
    );
}
