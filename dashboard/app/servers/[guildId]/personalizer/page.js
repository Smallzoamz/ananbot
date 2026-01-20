"use client";
import React, { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useLanguage } from "../../../context/LanguageContext";
import { useServer } from "../../../context/ServerContext";

export default function PersonalizerPage() {
    const { data: session } = useSession();
    const { t } = useLanguage();
    const { guildId, userPlan, loading: serverLoading } = useServer();

    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        bot_nickname: "An An",
        bot_bio: "Cheerfully serving Papa! 🌸✨",
        activity_type: "LISTENING", // PLAYING, LISTENING, WATCHING, COMPETING
        status_text: "/help",
        avatar_url: "/assets/mascot/ANAN1.png",
        banner_color: "#ff85c1"
    });

    useEffect(() => {
        if (!guildId) return;
        const fetchSettings = async () => {
            try {
                const res = await fetch(`/api/proxy/guild/${guildId}/settings`);
                const data = await res.json();
                if (data && !data.error) {
                    setSettings(prev => ({ ...prev, ...data }));
                }
            } catch (err) {
                console.error("Failed to fetch personalizer settings:", err);
            }
        };
        fetchSettings();
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

    if (serverLoading) return <div className="loader">🌸 Transforming An An...</div>;

    const activityLabel = {
        PLAYING: "Playing",
        LISTENING: "Listening to",
        WATCHING: "Watching",
        COMPETING: "Competing in"
    };

    const isPro = userPlan.plan_type !== 'free';

    return (
        <>
            <div className="personalizer-header-actions">
                <h2>{t.personalizer.title}</h2>
                {isPro ? (
                    <button
                        className={`save-btn ${saving ? 'loading' : ''}`}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Save Changes ✨"}
                    </button>
                ) : (
                    <button className="unlock-btn-header" onClick={() => alert("Please upgrade to Pro to unlock this feature! 💎")}>
                        Unlock Personalizer 🔒
                    </button>
                )}
            </div>

            <div className="personalizer-layout animate-fade">
                {/* Forms Column */}
                <div className="forms-col">
                    <div className={`settings-card glass ${!isPro ? 'locked' : ''}`}>
                        {!isPro && (
                            <div className="pro-lock-overlay">
                                <div className="lock-content">
                                    <div className="lock-icon">🔒</div>
                                    <h3>Pro Feature</h3>
                                    <p>Unlock custom bot branding, status, and profile customization!</p>
                                    <button className="unlock-btn" onClick={() => alert("Open Pricing Modal (Simulated)")}>
                                        Unlock Bot Personalizer
                                    </button>
                                </div>
                            </div>
                        )}

                        <h3>{t.personalizer.nickname}</h3>
                        <p className="sc-desc">{t.personalizer.nicknameDesc}</p>
                        <div className="input-group">
                            <input
                                type="text"
                                className="glass-input"
                                value={settings.bot_nickname}
                                onChange={(e) => setSettings({ ...settings, bot_nickname: e.target.value })}
                                placeholder="An An"
                                disabled={!isPro}
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
                                    disabled={!isPro}
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
                                    disabled={!isPro}
                                />
                            </div>
                        </div>

                        <div className="divider"></div>

                        <h3>Appearance (Custom Bot)</h3>
                        <div className="input-group">
                            <label>{t.personalizer.avatarUrl}</label>
                            <input
                                type="text"
                                className="glass-input"
                                value={settings.avatar_url}
                                onChange={(e) => setSettings({ ...settings, avatar_url: e.target.value })}
                                placeholder="https://..."
                                disabled={!isPro}
                            />
                        </div>
                        <div className="input-group">
                            <label>{t.personalizer.bio}</label>
                            <textarea
                                className="glass-input"
                                rows="3"
                                value={settings.bot_bio}
                                onChange={(e) => setSettings({ ...settings, bot_bio: e.target.value })}
                                placeholder={t.personalizer.bioPlaceholder}
                                disabled={!isPro}
                            />
                        </div>
                    </div>
                </div>

                {/* Preview Column */}
                <div className="preview-col">
                    <div className="preview-sticky">
                        <h4 className="preview-label">{t.personalizer.preview}</h4>

                        <div className="discord-preview-card member-list-preview">
                            <span className="dp-label">{t.personalizer.memberList}</span>
                            <div className="member-item">
                                <div className="avatar-wrapper">
                                    <img src={settings.avatar_url} alt="B" onError={(e) => e.target.src = "/assets/mascot/ANAN1.png"} />
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

                        <div className="discord-preview-card profile-preview">
                            <span className="dp-label">{t.personalizer.profilePreview}</span>
                            <div className="profile-card">
                                <div className="profile-banner" style={{ background: settings.banner_color }}></div>
                                <div className="profile-body">
                                    <div className="profile-avatar-wrapper">
                                        <img src={settings.avatar_url} alt="B" onError={(e) => e.target.src = "/assets/mascot/ANAN1.png"} />
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
                                                <div className="activity-icon">
                                                    {settings.activity_type === 'PLAYING' ? '🎮' :
                                                        settings.activity_type === 'LISTENING' ? '🎵' :
                                                            settings.activity_type === 'WATCHING' ? '📺' : '🏆'}
                                                </div>
                                                <div className="activity-details">
                                                    <div className="activity-name">{settings.status_text}</div>
                                                    <div className="activity-state">
                                                        {settings.activity_type === 'LISTENING' ? 'Spotify' : 'An An Bot'}
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
            </div>
        </>
    );
}
