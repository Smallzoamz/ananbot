"use client";
import React, { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../context/LanguageContext";
import Portal from "../../../components/Portal";
import ResultModal from "../../../components/ResultModal";
import { CrownIcon } from "../../../components/Icons";

export default function ModeratorPage({ params }) {
    const { guildId } = use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const { t } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        auto_mod_enabled: false,
        bad_words: [],
        anti_invite_enabled: false,
        anti_link_enabled: false,
        audit_logs_enabled: false,
        log_channel_id: "",
        warning_system_enabled: false,
        lockdown_enabled: false
    });
    const [channels, setChannels] = useState([]);
    const [userPlan, setUserPlan] = useState(null);
    const [modalState, setModalState] = useState({ show: false, title: "", message: "", type: "success" });

    // UI State for Setting Modals
    const [activeModal, setActiveModal] = useState(null); // 'autoMod', 'auditLogs', etc.

    useEffect(() => {
        if (session?.accessToken && guildId) {
            fetchInitialData();
        }
    }, [session, guildId]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch User Plan
            const planRes = await fetch(`/api/proxy/guild/${guildId}/action`, {
                method: 'POST',
                body: JSON.stringify({ action: 'get_user_info', user_id: session.user.id })
            });
            const planData = await planRes.json();

            if (planData.plan?.plan_type === 'free') {
                router.push(`/servers/${guildId}`);
                return;
            }
            setUserPlan(planData.plan);

            // 2. Fetch Settings
            const settingsRes = await fetch(`/api/proxy/guild/${guildId}/settings`);
            const settingsData = await settingsRes.json();
            if (settingsData.moderator_config) {
                setConfig(prev => ({ ...prev, ...settingsData.moderator_config }));
            }

            // 3. Fetch Channels for Logs
            const channelsRes = await fetch(`/api/proxy/guild/${guildId}/action`, {
                method: 'POST',
                body: JSON.stringify({ action: 'get_channels', user_id: session.user.id })
            });
            const channelsData = await channelsRes.json();
            setChannels(channelsData.channels || []);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (updatedConfig = config) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/proxy/guild/${guildId}/action`, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'save_moderator_settings',
                    user_id: session.user.id,
                    config: updatedConfig
                })
            });
            const data = await res.json();
            if (data.success) {
                setModalState({ show: true, title: "Success", message: t.moderator.saveSuccess, type: "success" });
            } else {
                setModalState({ show: true, title: "Error", message: data.error || "Failed to save", type: "error" });
            }
        } catch (error) {
            setModalState({ show: true, title: "Error", message: "Network error", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    const toggleFeature = (key) => {
        const newConfig = { ...config, [key]: !config[key] };
        setConfig(newConfig);
        handleSave(newConfig);
    };

    if (loading) return <div className="loading-screen">Papa is waiting... An An is working... 🌸</div>;

    const cards = [
        {
            id: 'autoMod',
            name: t.moderator.autoMod,
            desc: t.moderator.autoModDesc,
            icon: "🤖",
            enabled: config.auto_mod_enabled || config.anti_invite_enabled || config.anti_link_enabled,
            toggleKey: 'auto_mod_enabled', // Base toggle
            hasSettings: true
        },
        {
            id: 'auditLogs',
            name: t.moderator.auditLogs,
            desc: t.moderator.auditLogsDesc,
            icon: "📜",
            enabled: config.audit_logs_enabled,
            toggleKey: 'audit_logs_enabled',
            hasSettings: true
        },
        {
            id: 'warnings',
            name: t.moderator.warnings,
            desc: t.moderator.warningsDesc,
            icon: "⚠️",
            enabled: config.warning_system_enabled,
            toggleKey: 'warning_system_enabled',
            hasSettings: false
        },
        {
            id: 'lockdown',
            name: t.moderator.lockdown,
            desc: t.moderator.lockdownDesc,
            icon: "🚨",
            enabled: config.lockdown_enabled,
            toggleKey: 'lockdown_enabled',
            hasSettings: false,
            color: 'danger'
        }
    ];

    return (
        <div className="moderator-page page-animate">
            <div className="page-header">
                <div className="header-info">
                    <h1>{t.moderator.title}</h1>
                    <p>{t.moderator.desc}</p>
                </div>
                <div className="pro-badge-large">
                    <CrownIcon size={24} /> <span>PRO FEATURE</span>
                </div>
            </div>

            <div className="moderator-grid">
                {cards.map(card => (
                    <div key={card.id} className={`mod-card glass ${card.color || ''}`}>
                        <div className="mod-card-header">
                            <span className="mod-icon">{card.icon}</span>
                            <div className="mod-status-toggle">
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={config[card.toggleKey]}
                                        onChange={() => toggleFeature(card.toggleKey)}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>
                        <div className="mod-card-body">
                            <h3>{card.name}</h3>
                            <p>{card.desc}</p>
                        </div>
                        <div className="mod-card-footer">
                            {card.hasSettings && (
                                <button className="mod-settings-btn" onClick={() => setActiveModal(card.id)}>
                                    ⚙️ Settings
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Popup Modals */}
            {activeModal === 'autoMod' && (
                <Portal>
                    <div className="fixed-overlay blur-in">
                        <div className="modal-card animate-pop" style={{ maxWidth: '500px' }}>
                            <button className="modal-close" onClick={() => setActiveModal(null)}>×</button>
                            <div className="modal-header">
                                <h2>🛡️ {t.moderator.autoMod} Settings</h2>
                                <p>Configure your automated security layers ✨</p>
                            </div>
                            <div className="modal-body" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="config-item">
                                    <div className="config-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '700', color: '#4a4a68' }}>{t.moderator.antiInvite}</span>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={config.anti_invite_enabled}
                                                onChange={() => setConfig({ ...config, anti_invite_enabled: !config.anti_invite_enabled })}
                                            />
                                            <span className="slider round"></span>
                                        </label>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>Delete discord invite links from non-staff members.</p>
                                </div>

                                <div className="config-item">
                                    <div className="config-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '700', color: '#4a4a68' }}>{t.moderator.antiLink}</span>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={config.anti_link_enabled}
                                                onChange={() => setConfig({ ...config, anti_link_enabled: !config.anti_link_enabled })}
                                            />
                                            <span className="slider round"></span>
                                        </label>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>Delete all external links from non-staff members.</p>
                                </div>

                                <div className="divider" style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '10px 0' }}></div>

                                <div className="config-item">
                                    <label style={{ fontWeight: '700', color: '#4a4a68', display: 'block', marginBottom: '8px' }}>{t.moderator.badWords}</label>
                                    <textarea
                                        className="glass-input"
                                        style={{ width: '100%', minHeight: '100px', borderRadius: '15px', padding: '15px', background: '#f8f9fb', border: 'none', resize: 'none' }}
                                        placeholder={t.moderator.badWordsHint}
                                        value={(config.bad_words || []).join(", ")}
                                        onChange={(e) => setConfig({ ...config, bad_words: e.target.value.split(",").map(w => w.trim()).filter(w => w !== "") })}
                                    />
                                    <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '6px' }}>Messages containing these words will be deleted automatically.</p>
                                </div>
                            </div>
                            <div className="modal-actions" style={{ marginTop: '20px' }}>
                                <button className="modal-btn primary-long" onClick={() => { handleSave(); setActiveModal(null); }} disabled={saving}>
                                    {saving ? "Saving..." : "Apply Settings ✨"}
                                </button>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}

            {activeModal === 'auditLogs' && (
                <Portal>
                    <div className="fixed-overlay blur-in">
                        <div className="modal-card animate-pop" style={{ maxWidth: '500px' }}>
                            <button className="modal-close" onClick={() => setActiveModal(null)}>×</button>
                            <div className="modal-header">
                                <h2>📜 {t.moderator.auditLogs} Settings</h2>
                                <p>Keep track of everything happening in your server ✨</p>
                            </div>
                            <div className="modal-body" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="config-item">
                                    <div className="config-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '700', color: '#4a4a68' }}>{t.moderator.auditEnabled}</span>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={config.audit_logs_enabled}
                                                onChange={() => setConfig({ ...config, audit_logs_enabled: !config.audit_logs_enabled })}
                                            />
                                            <span className="slider round"></span>
                                        </label>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>Enable or disable activity logging globally.</p>
                                </div>

                                <div className="divider" style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '10px 0' }}></div>

                                <div className="config-item">
                                    <label style={{ fontWeight: '700', color: '#4a4a68', display: 'block', marginBottom: '8px' }}>{t.moderator.logChannel}</label>
                                    <select
                                        className="glass-input"
                                        style={{ width: '100%', borderRadius: '15px', padding: '12px', background: '#f8f9fb', border: 'none' }}
                                        value={config.log_channel_id}
                                        onChange={(e) => setConfig({ ...config, log_channel_id: e.target.value })}
                                    >
                                        <option value="">Select a channel</option>
                                        {channels.map(ch => (
                                            <option key={ch.id} value={ch.id}># {ch.name}</option>
                                        ))}
                                    </select>
                                    <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '8px' }}>The bot will send logs (deletes, edits, roles) to this channel.</p>
                                </div>
                            </div>
                            <div className="modal-actions" style={{ marginTop: '20px' }}>
                                <button className="modal-btn primary-long" onClick={() => { handleSave(); setActiveModal(null); }} disabled={saving}>
                                    {saving ? "Saving..." : "Apply Settings ✨"}
                                </button>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}

            <ResultModal
                isOpen={modalState.show}
                onClose={() => setModalState({ ...modalState, show: false })}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
            />

            <style jsx>{`
                .moderator-page {
                    padding: 40px;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 40px;
                }
                .header-info h1 {
                    font-size: 2.5rem;
                    color: #4a4a4a;
                    margin-bottom: 10px;
                    background: linear-gradient(135deg, #FF9A9E, #FAD0C4);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .header-info p {
                    color: #888;
                }
                .pro-badge-large {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #FFF9E6;
                    color: #D4AF37;
                    padding: 10px 20px;
                    border-radius: 50px;
                    font-weight: 700;
                    font-size: 0.9rem;
                    border: 1px solid #FFEBB3;
                    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.1);
                }

                .moderator-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 25px;
                }

                .mod-card {
                    padding: 25px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    position: relative;
                    transition: all 0.3s ease;
                }
                .mod-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                }
                .mod-card.danger {
                    border-bottom: 3px solid #ff4d4d;
                }

                .mod-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .mod-icon {
                    font-size: 2rem;
                    background: #F0F2F5;
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                }

                .mod-card-body h3 {
                    font-size: 1.25rem;
                    margin-bottom: 8px;
                    color: #333;
                }
                .mod-card-body p {
                    font-size: 0.9rem;
                    color: #777;
                    line-height: 1.4;
                }

                .mod-card-footer {
                    margin-top: auto;
                    display: flex;
                    justify-content: flex-end;
                }
                .mod-settings-btn {
                    background: #f8f9fa;
                    border: 1px solid #eee;
                    padding: 6px 15px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    color: #666;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .mod-settings-btn:hover {
                    background: #FF9A9E;
                    color: white;
                    border-color: #FF9A9E;
                }

                /* Standard Switch */
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 46px;
                    height: 24px;
                }
                .switch input { opacity: 0; width: 0; height: 0; }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                    border-radius: 34px;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }
                input:checked + .slider { background-color: #FF9A9E; }
                input:checked + .slider:before { transform: translateX(22px); }

                /* Modal Specifics */
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.4);
                    backdrop-filter: blur(5px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-content {
                    width: 90%;
                    max-width: 500px;
                    padding: 0;
                    overflow: hidden;
                    border: none;
                }
                .modal-header {
                    padding: 20px 30px;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #fafafa;
                }
                .modal-body {
                    padding: 30px;
                    display: flex;
                    flex-direction: column;
                    gap: 25px;
                }
                .config-item {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                .config-label {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: 600;
                    color: #444;
                }
                .config-hint {
                    font-size: 0.8rem;
                    color: #999;
                }
                textarea, select {
                    width: 100%;
                    padding: 12px;
                    border-radius: 10px;
                    border: 1px solid #eee;
                    margin-top: 5px;
                    font-size: 0.9rem;
                }
                textarea { height: 80px; resize: none; }
                
                .modal-footer {
                    padding: 15px 30px;
                    background: #fafafa;
                    border-top: 1px solid #eee;
                    display: flex;
                    justify-content: flex-end;
                }
                .save-btn {
                    background: #FF9A9E;
                    color: white;
                    padding: 10px 25px;
                    border-radius: 10px;
                    font-weight: 600;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .save-btn:hover:not(:disabled) {
                    transform: scale(1.05);
                    box-shadow: 0 5px 15px rgba(255, 154, 158, 0.3);
                }
                .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
            `}</style>
        </div>
    );
}
