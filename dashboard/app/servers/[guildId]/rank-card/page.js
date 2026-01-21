"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "../../../context/LanguageContext";
import { useServer } from "../../../context/ServerContext";
import ResultModal from "../../../components/ResultModal";

export default function RankCardPage({ params }) {
    const { guildId } = React.use(params);
    const { data: session } = useSession();
    const { t } = useLanguage();
    const { userPlan } = useServer();

    // Configuration State
    const [config, setConfig] = useState({
        theme: "pink", // pink, blue, purple, green
        bgType: "glass", // glass, solid, image
        overlayOpacity: 0.2,
        showTape: true,
        stickers: [] // { id, type, x, y, rotation }
    });

    const [saving, setSaving] = useState(false);
    const [modalState, setModalState] = useState({ show: false, type: 'success', message: '' });

    // Load Existing Config
    useEffect(() => {
        if (session?.user?.id && guildId) {
            fetchConfig();
        }
    }, [session, guildId]);

    const fetchConfig = async () => {
        try {
            const res = await fetch(`/api/proxy/guild/${guildId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_rank_card',
                    user_id: session.user.id,
                    guild_id: guildId
                })
            });
            const data = await res.json();
            if (data.config) {
                setConfig(prev => ({
                    ...prev,
                    ...data.config,
                    stickers: Array.isArray(data.config.stickers) ? data.config.stickers : []
                }));
            }
        } catch (err) {
            console.error("Failed to fetch rank card config:", err);
        }
    };

    // Mock User Data for Preview
    const user = {
        name: session?.user?.name || "An An User",
        avatar: session?.user?.image || "/assets/mascot/ANAN1.png",
        discriminator: "0000",
        rank: 1,
        level: 15,
        xp: 2450,
        maxXp: 5000
    };

    const stickersList = ["🌸", "✨", "⭐", "🐾", "🎀", "💖", "🍓", "🍦"];
    const themes = {
        pink: { primary: "#FF9A9E", secondary: "#FECFEF", gradient: "linear-gradient(135deg, #FF9A9E, #FECFEF)" },
        blue: { primary: "#A1C4FD", secondary: "#C2E9FB", gradient: "linear-gradient(135deg, #A1C4FD, #C2E9FB)" },
        purple: { primary: "#D49EFD", secondary: "#F2D0FE", gradient: "linear-gradient(135deg, #D49EFD, #F2D0FE)" },
        green: { primary: "#8FD3F4", secondary: "#84FAB0", gradient: "linear-gradient(135deg, #84FAB0, #8FD3F4)" },
    };

    const addSticker = (sticker) => {
        if (config.stickers.length >= 5) return;
        const newSticker = {
            id: Date.now(),
            type: sticker,
            x: Math.random() * 80, // Random position %
            y: Math.random() * 80,
            rotation: (Math.random() - 0.5) * 40
        };
        setConfig(prev => ({ ...prev, stickers: [...prev.stickers, newSticker] }));
    };

    const removeSticker = (id) => {
        setConfig(prev => ({ ...prev, stickers: prev.stickers.filter(s => s.id !== id) }));
    };

    const handleSave = async () => {
        if (!session?.user?.id) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/proxy/guild/${guildId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_rank_card',
                    user_id: session.user.id,
                    guild_id: guildId,
                    config: config
                })
            });
            const data = await res.json();
            if (data.success) {
                setModalState({ show: true, type: 'success', message: "Rank Card Design Saved! 🎨✨" });
            } else {
                setModalState({ show: true, type: 'error', message: data.error || "Failed to save design 🥺" });
            }
        } catch (err) {
            setModalState({ show: true, type: 'error', message: "Connection Error! 🥺" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="rank-editor-page animate-fade">
            <div className="page-header">
                <h1>{t.dashboard?.rankCard || "Personal Rank Card"}</h1>
                <p>Design your unique profile card. Make it pop with stickers and glass style! ✨</p>
            </div>

            <div className="editor-grid">
                {/* CONFIG PANEL */}
                <div className="config-panel glass">
                    <h2>🎨 Customization</h2>

                    {/* Theme Selector */}
                    <div className="control-group">
                        <label>Color Theme</label>
                        <div className="theme-selector">
                            {Object.keys(themes).map(key => (
                                <button
                                    key={key}
                                    className={`theme-btn ${config.theme === key ? 'active' : ''}`}
                                    style={{ background: themes[key].gradient }}
                                    onClick={() => setConfig({ ...config, theme: key })}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Stickers */}
                    <div className="control-group">
                        <label>Add Stickers (Max 5)</label>
                        <div className="sticker-selector">
                            {stickersList.map(s => (
                                <button key={s} className="sticker-btn" onClick={() => addSticker(s)}>{s}</button>
                            ))}
                        </div>
                        <p className="hint">Click to add. Click on sticker in preview to remove.</p>
                    </div>

                    {/* Toggles */}
                    <div className="control-group">
                        <label className="toggle-label">
                            <span>Washi Tape Effect</span>
                            <input
                                type="checkbox"
                                checked={config.showTape}
                                onChange={(e) => setConfig({ ...config, showTape: e.target.checked })}
                            />
                        </label>
                    </div>

                    <div className="actions">
                        <button className="rank-save-btn" onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Design 💾"}
                        </button>
                    </div>
                </div>

                {/* PREVIEW AREA */}
                <div className="preview-container">
                    <h3>Live Preview</h3>
                    <div className="rank-card-canvas">
                        {/* Glass Background */}
                        <div className="glass-card" style={{
                            background: `rgba(255, 255, 255, ${config.overlayOpacity})`,
                            borderColor: themes[config.theme].secondary
                        }}>
                            {/* Washi Tapes */}
                            {config.showTape && (
                                <>
                                    <div className="tape tape-top-left" style={{ background: themes[config.theme].primary }}></div>
                                    <div className="tape tape-bottom-right" style={{ background: themes[config.theme].primary }}></div>
                                </>
                            )}

                            {/* Stickers Layer */}
                            {config.stickers.map(s => (
                                <div
                                    key={s.id}
                                    className="sticker-item"
                                    style={{ left: `${s.x}%`, top: `${s.y}%`, transform: `rotate(${s.rotation}deg)` }}
                                    onClick={() => removeSticker(s.id)}
                                    title="Click to remove"
                                >
                                    {s.type}
                                </div>
                            ))}

                            {/* Content Layer */}
                            <div className="card-content">
                                <div className="avatar-section">
                                    <div className="polaroid-frame">
                                        <img src={user.avatar} alt="Avatar" className="avatar-img" />
                                    </div>
                                    <div className="rank-badge" style={{ background: themes[config.theme].gradient }}>
                                        #{user.rank}
                                    </div>
                                </div>

                                <div className="info-section">
                                    <div className="user-name" style={{ color: '#4a4a68' }}>
                                        {user.name}
                                        <span className="discriminator">#{user.discriminator}</span>
                                    </div>

                                    <div className="level-info">
                                        <span className="level-label" style={{ color: themes[config.theme].primary }}>LEVEL {user.level}</span>
                                        <span className="xp-label">{user.xp} / {user.maxXp} XP</span>
                                    </div>

                                    <div className="progress-bar-bg">
                                        <div
                                            className="progress-bar-fill"
                                            style={{
                                                width: `${(user.xp / user.maxXp) * 100}%`,
                                                background: themes[config.theme].gradient
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ResultModal show={modalState.show} type={modalState.type} message={modalState.message} onClose={() => setModalState({ ...modalState, show: false })} />

        </div>
    );
}
