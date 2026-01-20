"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLanguage } from "../../../context/LanguageContext";
import { useServer } from "../../../context/ServerContext";
import { createPortal } from "react-dom";

const Portal = ({ children }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    return createPortal(children, document.body);
};

const ResultModal = ({ type, message, onClose }) => {
    return (
        <Portal>
            <div className={`fixed-overlay z-alert blur-in`} onClick={onClose}>
                <div className="modal-card animate-pop" onClick={e => e.stopPropagation()}>
                    <button className="modal-close" onClick={onClose}>×</button>
                    <div className="modal-header">
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                            {type === 'success' ? '✨🌸' : '⚠️🔥'}
                        </div>
                        <h2 style={{ color: type === 'success' ? '#4ade80' : '#f87171' }}>
                            {type === 'success' ? 'Success!' : 'Oopsie!'}
                        </h2>
                    </div>
                    <div className="modal-body">
                        <p>{message}</p>
                    </div>
                    <div className="modal-actions">
                        <button
                            className={`modal-btn ${type === 'success' ? 'primary' : 'danger'}`}
                            onClick={onClose}
                        >
                            {type === 'success' ? 'Awesome! 💖' : 'Try Again 🔧'}
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default function WelcomeSettings() {
    const { data: session } = useSession();
    const { t } = useLanguage();
    const { guildId, guildData, userPlan, loading: serverLoading } = useServer();
    const router = useRouter();

    const [saving, setSaving] = useState(false);
    const [channels, setChannels] = useState([]);
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

    const [modalState, setModalState] = useState({ show: false, type: 'success', message: '' });

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
                            if (ch.type === 0 || ch.type === "text") {
                                allChannels.push(ch);
                            }
                        });
                    });
                }
                setChannels(allChannels);

                // Fetch Settings
                const settingsRes = await fetch(`/api/proxy/guild/${guildId}/settings`);
                const settingsData = await settingsRes.json();
                if (settingsData && !settingsData.error) {
                    setSettings(prev => ({
                        ...prev,
                        ...settingsData
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch welcome data:", err);
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
            setModalState({ show: true, type: 'success', message: "Test Welcome message sent to Discord! ✨🌸" });
        } else {
            setModalState({ show: true, type: 'error', message: "Error sending test: " + (data.error || "Unknown error") });
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
            setModalState({ show: true, type: 'success', message: "Test Goodbye message sent to Discord! 🌸" });
        } else {
            setModalState({ show: true, type: 'error', message: "Error sending test: " + (data.error || "Unknown error") });
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
                    user_id: session?.user?.id,
                    settings: settings
                })
            });
            const data = await res.json();
            if (data.success) {
                setModalState({ show: true, type: 'success', message: "Settings saved successfully! ✨🌸" });
            } else {
                setModalState({ show: true, type: 'error', message: "Error saving settings: " + (data.error || "Unknown error") });
            }
        } catch (err) {
            console.error("Save Error:", err);
            setModalState({ show: true, type: 'error', message: "Failed to save settings." });
        } finally {
            setSaving(false);
        }
    };

    if (serverLoading) return <div className="loader">🌸 Unfolding Settings...</div>;

    return (
        <>

            {modalState.show && <ResultModal type={modalState.type} message={modalState.message} onClose={() => setModalState({ ...modalState, show: false })} />}
            <div className="welcome-header-actions">
                <div className="title-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2>WELCOME & GOODBYE</h2>
                    <span style={{ color: '#d97706', display: 'flex', alignItems: 'center' }}>
                        <svg viewBox="0 0 24 24" width="22" height="22">
                            <path fill="currentColor" d="M5,16 L19,16 L19,18 L5,18 L5,16 Z M19,8 L15.5,11 L12,5 L8.5,11 L5,8 L5,14 L19,14 L19,8 Z" />
                        </svg>
                    </span>
                </div>
                <button
                    className={`save-btn ${saving ? 'loading' : ''}`}
                    onClick={handleSave}
                    disabled={saving || userPlan.plan_type === 'free'}
                    style={{ background: userPlan.plan_type === 'free' ? '#cbd5e1' : '#ff85c1' }}
                >
                    {saving ? "Saving..." : "Save Changes ✨"}
                </button>
            </div>

            <div className="settings-container animate-fade" style={{ position: 'relative' }}>
                {userPlan.plan_type === 'free' && (
                    <div className="pro-lock-overlay glass blur-in">
                        <div className="lock-content animate-pop">
                            <div className="crown-icon">
                                <svg viewBox="0 0 24 24" width="80" height="80">
                                    <path fill="currentColor" d="M5,16 L19,16 L19,18 L5,18 L5,16 Z M19,8 L15.5,11 L12,5 L8.5,11 L5,8 L5,14 L19,14 L19,8 Z" />
                                </svg>
                            </div>
                            <h2>Pro Plan Required 👑</h2>
                            <p>This feature is exclusive for Papa's <strong>Pro</strong> and <strong>Premium</strong> plans. Upgrade now to unlock customized welcome & goodbye messages!</p>
                            <button className="pricing-upgrade-btn" onClick={() => router.push(`/servers/${guildId}?showPricing=true`)}>
                                Upgrade to Pro 🚀
                            </button>
                        </div>
                    </div>
                )}

                <div className={`settings-grid ${userPlan.plan_type === 'free' ? 'content-locked' : ''}`}>
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
                                    value={settings.welcome_channel_id || ""}
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
                                    value={settings.welcome_message || ""}
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
                                    value={settings.welcome_image_url || ""}
                                    onChange={(e) => setSettings({ ...settings, welcome_image_url: e.target.value })}
                                />
                                <span className="input-hint">Leave empty to use the default welcome GIF.</span>
                            </div>
                            <div style={{ marginTop: '20px' }}>
                                <button className="glass-button secondary" onClick={handleTestWelcome} disabled={userPlan.plan_type === 'free'}>
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
                                    value={settings.goodbye_channel_id || ""}
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
                                    placeholder="ลาก่อนนะคะคุณ {user} หวังว่าจะได้พบกันใหมีกครั้งค่ะ 🌸"
                                    value={settings.goodbye_message || ""}
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
                                    value={settings.goodbye_image_url || ""}
                                    onChange={(e) => setSettings({ ...settings, goodbye_image_url: e.target.value })}
                                />
                            </div>
                            <div style={{ marginTop: '20px' }}>
                                <button className="glass-button secondary" onClick={handleTestGoodbye} disabled={userPlan.plan_type === 'free'}>
                                    🧪 Test Goodbye Message
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </>
    );


}
