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

            <style jsx>{`
                    .z-alert { z-index: 5000; }
                    .welcome-header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                    .welcome-header-actions h2 { font-size: 24px; font-weight: 900; color: var(--primary); }
                    .save-btn { color: white; border: none; padding: 12px 25px; border-radius: 12px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 12px rgba(255,133,193,0.3); transition: 0.3s; }
                    .save-btn:hover:not(:disabled) { transform: scale(1.05); filter: brightness(1.1); }
                    .save-btn:disabled { cursor: not-allowed; box-shadow: none; }

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

                    .glass-button {
                        background: var(--primary);
                        color: white;
                        border: none;
                        border-radius: 12px;
                        padding: 12px 24px;
                        font-weight: 800;
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

                    /* Pro Lock Overlay */
                    .pro-lock-overlay {
                        position: absolute;
                        inset: 0;
                        background: rgba(255, 255, 255, 0.4);
                        backdrop-filter: blur(8px);
                        z-index: 50;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 24px;
                    }
                    .lock-content {
                        background: white;
                        padding: 50px;
                        border-radius: 30px;
                        text-align: center;
                        max-width: 450px;
                        box-shadow: 0 20px 50px rgba(255, 183, 226, 0.3);
                        border: 2px solid var(--primary);
                    }
                    .crown-icon { color: #ffd700; margin-bottom: 20px; filter: drop-shadow(0 4px 10px rgba(255, 215, 0, 0.4)); }
                    .lock-content h2 { font-size: 28px; margin-bottom: 15px; color: #4a4a68; }
                    .lock-content p { color: #6b7280; line-height: 1.6; margin-bottom: 30px; }
                    .lock-content p strong { color: var(--primary); }
                    .pricing-upgrade-btn {
                        background: var(--primary);
                        color: white;
                        border: none;
                        padding: 15px 40px;
                        border-radius: 15px;
                        font-weight: 800;
                        font-size: 16px;
                        cursor: pointer;
                        transition: 0.3s;
                        box-shadow: 0 10px 20px rgba(255, 183, 226, 0.4);
                    }
                    .pricing-upgrade-btn:hover { transform: translateY(-3px); filter: brightness(1.1); }
                    .content-locked { filter: blur(2px); pointer-events: none; }

                    @keyframes pop { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                    .animate-pop { animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    .animate-fade { animation: fadeIn 0.6s ease-out forwards; }
                    .loader { height: 100vh; display: flex; align-items: center; justify-content: center; font-size: 24px; color: var(--primary); font-weight: 800; }
                `}</style>
        </>
    );


}
