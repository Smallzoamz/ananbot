"use client";
import React, { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../context/LanguageContext";
import Portal from "../../../components/Portal";
import ResultModal from "../../../components/ResultModal";
import { CrownIcon } from "../../../components/Icons";
import TagInput from "../../../components/TagInput";

export default function ModeratorPage({ params }) {
    const { guildId } = use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const { t } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Config State (Merged)
    const [modConfig, setModConfig] = useState({
        auto_mod_enabled: false,
        bad_words: [],
        anti_invite_enabled: false,
        anti_link_enabled: false,
        audit_logs_enabled: false,
        log_channel_id: "",
        warning_system_enabled: false,
        lockdown_enabled: false
    });

    const [spamConfig, setSpamConfig] = useState({
        enabled: false,
        max_mentions: 5,
        rate_limit_enabled: false,
        rate_limit_count: 5,
        rate_limit_window: 10,
        repeat_text_enabled: false,
        repeat_text_count: 3,
        action: "warn"
    });

    const [channels, setChannels] = useState([]);
    const [userPlan, setUserPlan] = useState(null);
    const [modalState, setModalState] = useState({ show: false, title: "", message: "", type: "success" });
    const [activeModal, setActiveModal] = useState(null); // 'autoMod', 'antiSpam', 'auditLogs'

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

            // 2. Fetch Moderator Config
            const modRes = await fetch(`/api/proxy/guild/${guildId}/settings`);
            const modData = await modRes.json();
            if (modData.moderator_config) {
                setModConfig(prev => ({ ...prev, ...modData.moderator_config }));
            }

            // 3. Fetch Anti-Spam Config
            const spamRes = await fetch(`/api/guild/${guildId}/anti-spam`);
            const spamData = await spamRes.json();
            if (spamData.config) {
                setSpamConfig(prev => ({ ...prev, ...spamData.config }));
            }

            // 4. Fetch Channels
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

    const handleSave = async (type, overrideConfig = null) => {
        setSaving(true);
        try {
            if (type === 'moderator') {
                const configToSave = overrideConfig || modConfig;
                await fetch(`/api/proxy/guild/${guildId}/action`, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'save_moderator_settings',
                        user_id: session.user.id,
                        config: configToSave
                    })
                });
            } else if (type === 'antispam') {
                const configToSave = overrideConfig || spamConfig;
                await fetch(`/api/guild/${guildId}/anti-spam`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ config: configToSave })
                });
            }
            if (!overrideConfig) {
                setModalState({ show: true, title: "Success", message: "Settings saved successfully! ✨", type: "success" });
                setActiveModal(null);
            }
        } catch (error) {
            setModalState({ show: true, title: "Error", message: "Failed to save settings.", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="loading-screen">
            <div className="loader"></div>
            <p>An An is preparing your Moderator Center... 🌸</p>
            <style jsx>{`
                .loading-screen { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff5f7; }
                .loader { width: 50px; height: 50px; border: 5px solid #ffd1dc; border-top: 5px solid #ff85a2; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                p { color: #ff85a2; font-weight: 600; font-family: 'Outfit', sans-serif; }
            `}</style>
        </div>
    );

    const cards = [
        {
            id: 'autoMod',
            name: "Auto-Mod System",
            desc: "Protection against bad words, links, and invites.",
            icon: "🤖",
            enabled: modConfig.auto_mod_enabled || modConfig.anti_invite_enabled || modConfig.anti_link_enabled,
            toggleKey: 'auto_mod_enabled',
            configType: 'moderator'
        },
        {
            id: 'antiSpam',
            name: "Anti-Spam Shield",
            desc: "Prevent floods, raids, and repetitive messages.",
            icon: "🛡️",
            enabled: spamConfig.enabled,
            toggleKey: 'enabled',
            configType: 'antispam',
            isNew: true
        },
        {
            id: 'auditLogs',
            name: "Audit Logs",
            desc: "Detailed history of server events and moderation.",
            icon: "📜",
            enabled: modConfig.audit_logs_enabled,
            toggleKey: 'audit_logs_enabled',
            configType: 'moderator'
        },
        {
            id: 'warnings',
            name: "Warning System",
            desc: "Issue warnings to users and track their history.",
            icon: "⚠️",
            enabled: modConfig.warning_system_enabled,
            toggleKey: 'warning_system_enabled',
            configType: 'moderator'
        },
        {
            id: 'lockdown',
            name: "Server Lockdown",
            desc: "Temporarily lock the server to prevent raids.",
            icon: "🚨",
            enabled: modConfig.lockdown_enabled,
            toggleKey: 'lockdown_enabled',
            configType: 'moderator',
            color: 'danger'
        }
    ];

    return (
        <div className="mod-center page-animate">
            <div className="container">
                <div className="page-header">
                    <div className="header-content">
                        <span className="subtitle">SECURITY CONTROL</span>
                        <h1>Moderator Center 🛡️</h1>
                        <p>Advanced security tools to keep your community safe and pure.</p>
                    </div>
                    <div className="pro-indicator">
                        <CrownIcon size={20} />
                        <span>PRO PLAN ACTIVE</span>
                    </div>
                </div>

                <div className="mod-grid">
                    {cards.map(card => (
                        <div key={card.id} className={`mod-card shadow-glass ${card.color || ''}`}>
                            {card.isNew && <span className="badge-new">NEW</span>}
                            <div className="card-top">
                                <span className="card-icon">{card.icon}</span>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={card.configType === 'moderator' ? modConfig[card.toggleKey] : spamConfig[card.toggleKey]}
                                        onChange={() => {
                                            if (card.configType === 'moderator') {
                                                const newMod = { ...modConfig, [card.toggleKey]: !modConfig[card.toggleKey] };
                                                setModConfig(newMod);
                                                handleSave('moderator', newMod);
                                            } else {
                                                const newSpam = { ...spamConfig, [card.toggleKey]: !spamConfig[card.toggleKey] };
                                                setSpamConfig(newSpam);
                                                handleSave('antispam', newSpam);
                                            }
                                        }}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            <div className="card-info">
                                <h3>{card.name}</h3>
                                <p>{card.desc}</p>
                            </div>
                            <button className="configure-btn" onClick={() => setActiveModal(card.id)}>
                                Configure ⚙️
                            </button>
                        </div>
                    ))}
                </div>

                {/* MODALS */}
                {activeModal === 'autoMod' && (
                    <Portal>
                        <div className="modal-overlay blur-in">
                            <div className="modal-content animate-pop">
                                <button className="close-btn" onClick={() => setActiveModal(null)}>×</button>
                                <div className="modal-header">
                                    <h2>🤖 Auto-Mod Config</h2>
                                    <p>Configure automated protection layers.</p>
                                </div>
                                <div className="modal-body">
                                    <div className="setting-row">
                                        <div className="setting-label">
                                            <h4>Anti-Invite</h4>
                                            <span>Delete Discord guild invites.</span>
                                        </div>
                                        <label className="switch">
                                            <input type="checkbox" checked={modConfig.anti_invite_enabled} onChange={() => setModConfig({ ...modConfig, anti_invite_enabled: !modConfig.anti_invite_enabled })} />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                    <div className="setting-row">
                                        <div className="setting-label">
                                            <h4>Anti-Link</h4>
                                            <span>Block all external websites.</span>
                                        </div>
                                        <label className="switch">
                                            <input type="checkbox" checked={modConfig.anti_link_enabled} onChange={() => setModConfig({ ...modConfig, anti_link_enabled: !modConfig.anti_link_enabled })} />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                    <div className="setting-block">
                                        <h4>Bad Words Filter</h4>
                                        <TagInput
                                            tags={modConfig.bad_words || []}
                                            onChange={(tags) => setModConfig({ ...modConfig, bad_words: tags })}
                                            placeholder="Add words to filter..."
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="save-button" onClick={() => handleSave('moderator')} disabled={saving}>
                                        {saving ? "Saving..." : "Save Changes ✨"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Portal>
                )}

                {activeModal === 'antiSpam' && (
                    <Portal>
                        <div className="modal-overlay blur-in">
                            <div className="modal-content modal-large animate-pop">
                                <button className="close-btn" onClick={() => setActiveModal(null)}>×</button>
                                <div className="modal-header">
                                    <h2>🛡️ Anti-Spam Details</h2>
                                    <p>Fine-tune your spam protection thresholds.</p>
                                </div>
                                <div className="modal-body scrollable">
                                    <div className="setting-group-grid">
                                        <div className="setting-card">
                                            <div className="s-card-head">
                                                <h4>📢 Max Mentions</h4>
                                                <input type="number" className="num-input" value={spamConfig.max_mentions} onChange={(e) => setSpamConfig({ ...spamConfig, max_mentions: parseInt(e.target.value) })} />
                                            </div>
                                            <p>Allow up to X mentions per message.</p>
                                        </div>
                                        <div className="setting-card">
                                            <div className="s-card-head">
                                                <h4>📝 Repeat Text</h4>
                                                <label className="switch">
                                                    <input type="checkbox" checked={spamConfig.repeat_text_enabled} onChange={(e) => setSpamConfig({ ...spamConfig, repeat_text_enabled: e.target.checked })} />
                                                    <span className="slider"></span>
                                                </label>
                                            </div>
                                            <div className="s-card-body">
                                                <span>Limit:</span>
                                                <input type="number" className="num-input small" value={spamConfig.repeat_text_count} onChange={(e) => setSpamConfig({ ...spamConfig, repeat_text_count: parseInt(e.target.value) })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="setting-card full-w">
                                        <div className="s-card-head">
                                            <h4>⚡ Rate Limiting</h4>
                                            <label className="switch">
                                                <input type="checkbox" checked={spamConfig.rate_limit_enabled} onChange={(e) => setSpamConfig({ ...spamConfig, rate_limit_enabled: e.target.checked })} />
                                                <span className="slider"></span>
                                            </label>
                                        </div>
                                        {spamConfig.rate_limit_enabled && (
                                            <div className="s-card-flex">
                                                <div className="input-box">
                                                    <label>Max Messages</label>
                                                    <input type="number" value={spamConfig.rate_limit_count} onChange={(e) => setSpamConfig({ ...spamConfig, rate_limit_count: parseInt(e.target.value) })} />
                                                </div>
                                                <div className="input-box">
                                                    <label>Window (sec)</label>
                                                    <input type="number" value={spamConfig.rate_limit_window} onChange={(e) => setSpamConfig({ ...spamConfig, rate_limit_window: parseInt(e.target.value) })} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="setting-card full-w danger">
                                        <h4>⚖️ Punishment Action</h4>
                                        <div className="punish-options">
                                            {['warn', 'mute', 'kick', 'ban'].map(opt => (
                                                <div key={opt} className={`punish-btn ${spamConfig.action === opt ? 'active' : ''}`} onClick={() => setSpamConfig({ ...spamConfig, action: opt })}>
                                                    {opt.toUpperCase()}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="save-button" onClick={() => handleSave('antispam')} disabled={saving}>
                                        {saving ? "Saving..." : "Save Anti-Spam ✨"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Portal>
                )}

                {activeModal === 'auditLogs' && (
                    <Portal>
                        <div className="modal-overlay blur-in">
                            <div className="modal-content animate-pop">
                                <button className="close-btn" onClick={() => setActiveModal(null)}>×</button>
                                <div className="modal-header">
                                    <h2>📜 Audit Log Config</h2>
                                    <p>Track server actions in a channel.</p>
                                </div>
                                <div className="modal-body">
                                    <div className="setting-block">
                                        <h4>Log Channel</h4>
                                        <select
                                            className="pastel-select"
                                            value={modConfig.log_channel_id}
                                            onChange={(e) => setModConfig({ ...modConfig, log_channel_id: e.target.value })}
                                        >
                                            <option value="">-- Choose Channel --</option>
                                            {channels.map(ch => <option key={ch.id} value={ch.id}># {ch.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="save-button" onClick={() => handleSave('moderator')} disabled={saving}>
                                        {saving ? "Saving..." : "Apply Logs ✨"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Portal>
                )}
            </div>

            <ResultModal
                isOpen={modalState.show}
                onClose={() => setModalState({ ...modalState, show: false })}
                {...modalState}
            />

            <style jsx>{`
                .mod-center { min-height: 100vh; background: #fffcfd; padding: 60px 20px; }
                .container { max-width: 1100px; margin: 0 auto; }
                
                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 50px; }
                .subtitle { color: #ff85a2; font-weight: 800; font-size: 0.8rem; letter-spacing: 2px; }
                h1 { font-size: 3rem; color: #4a4a68; margin: 5px 0; font-family: 'Outfit', sans-serif; }
                p { color: #8e8eaf; font-size: 1.1rem; }

                .pro-indicator { display: flex; align-items: center; gap: 8px; background: #fff5e6; color: #d99c00; padding: 8px 16px; border-radius: 99px; font-weight: 700; font-size: 0.85rem; border: 1px solid #ffe4b3; }

                .mod-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
                
                .mod-card { 
                    background: white; border-radius: 30px; padding: 40px; border: 1px solid #f0f0f5; 
                    position: relative; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex; flex-direction: column;
                }
                .mod-card:hover { transform: translateY(-10px); border-color: #ff85a2; box-shadow: 0 20px 40px rgba(255, 133, 162, 0.1); }
                
                .mod-card.danger { border-bottom: 4px solid #ff4d4d; }
                .mod-card.danger:hover { border-color: #ff4d4d; box-shadow: 0 20px 40px rgba(255, 77, 77, 0.1); }
                .mod-card.danger .card-icon { background: #fff1f1; color: #ff4d4d; }
                .mod-card.danger .configure-btn:hover { background: #ff4d4d; border-color: #ff4d4d; }
                
                .badge-new { position: absolute; top: 20px; right: -10px; background: #ff477e; color: white; padding: 4px 12px; border-radius: 10px; font-size: 0.7rem; font-weight: 900; box-shadow: 0 4px 10px rgba(255, 71, 126, 0.3); }

                .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; }
                .card-icon { font-size: 2.5rem; background: #fff5f7; width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; border-radius: 20px; }
                
                .card-info h3 { font-size: 1.6rem; color: #4a4a68; margin-bottom: 10px; }
                .card-info p { font-size: 0.95rem; color: #8e8eaf; line-height: 1.6; margin-bottom: 30px; flex: 1; }

                .configure-btn { 
                    width: 100%; padding: 14px; border-radius: 18px; border: 2px solid #f0f0f5; 
                    background: white; color: #4a4a68; font-weight: 700; cursor: pointer; transition: all 0.2s;
                }
                .configure-btn:hover { background: #ff85a2; color: white; border-color: #ff85a2; }

                /* Switch CSS */
                .switch { position: relative; display: inline-block; width: 60px; height: 32px; }
                .switch input { opacity: 0; width: 0; height: 0; }
                .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #e2e8f0; transition: .4s; border-radius: 34px; }
                .slider:before { position: absolute; content: ""; height: 24px; width: 24px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                input:checked + .slider { background-color: #ff85a2; }
                input:checked + .slider:before { transform: translateX(28px); }

                /* MODAL STYLES */
                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(74, 74, 104, 0.4); backdrop-filter: blur(10px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
                .modal-content { background: white; width: 500px; max-width: 90vw; border-radius: 40px; padding: 40px; position: relative; box-shadow: 0 30px 60px rgba(0,0,0,0.15); }
                .modal-large { width: 700px; }
                .close-btn { position: absolute; top: 25px; right: 25px; background: #f0f0f5; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 1.5rem; color: #8e8eaf; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                
                .modal-header h2 { font-size: 2rem; color: #4a4a68; margin-bottom: 5px; }
                .modal-header p { margin-bottom: 30px; font-size: 1rem; }

                .modal-body { display: flex; flex-direction: column; gap: 20px; }
                .modal-body.scrollable { max-height: 60vh; overflow-y: auto; padding-right: 10px; }
                .modal-body.scrollable::-webkit-scrollbar { width: 6px; }
                .modal-body.scrollable::-webkit-scrollbar-thumb { background: #ffd1dc; border-radius: 10px; }

                .setting-row { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: #fffcfd; border-radius: 20px; border: 1px solid #fef0f3; }
                .setting-label h4 { font-size: 1.1rem; color: #4a4a68; margin-bottom: 2px; }
                .setting-label span { font-size: 0.85rem; color: #bcbcce; }

                .setting-block h4 { font-size: 1.1rem; color: #4a4a68; margin-bottom: 12px; }
                
                .setting-group-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .setting-card { background: #fffcfd; padding: 20px; border-radius: 24px; border: 1px solid #fef0f3; }
                .setting-card.full-w { grid-column: 1 / -1; }
                .s-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
                .s-card-head h4 { font-size: 1rem; color: #4a4a68; }
                .setting-card p { font-size: 0.85rem; color: #bcbcce; }
                
                .s-card-body { display: flex; align-items: center; gap: 10px; margin-top: 15px; }
                .s-card-flex { display: flex; gap: 20px; margin-top: 20px; }
                .input-box { flex: 1; }
                .input-box label { font-size: 0.8rem; font-weight: 700; color: #bcbcce; display: block; margin-bottom: 8px; }
                .input-box input { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #f0f0f5; outline: none; transition: border-color 0.2s; }
                .input-box input:focus { border-color: #ff85a2; }

                .num-input { width: 70px; padding: 8px; border-radius: 10px; border: 1px solid #f0f0f5; text-align: center; font-weight: 700; }
                .num-input.small { width: 50px; }

                .punish-options { display: flex; gap: 10px; margin-top: 15px; }
                .punish-btn { flex: 1; padding: 12px; text-align: center; background: #f8f9fa; border-radius: 15px; font-weight: 800; font-size: 0.8rem; cursor: pointer; color: #94a3b8; border: 2px solid transparent; transition: all 0.2s; }
                .punish-btn:hover { background: #fff1f3; color: #ff85a2; }
                .punish-btn.active { background: #ff4d4d; color: white; border-color: #ff4d4d; box-shadow: 0 4px 15px rgba(255, 77, 77, 0.3); }

                .modal-footer { margin-top: 40px; display: flex; justify-content: flex-end; }
                .save-button { background: linear-gradient(135deg, #ff85a2, #ff4d4d); color: white; padding: 16px 32px; border-radius: 20px; border: none; font-weight: 800; font-size: 1rem; cursor: pointer; box-shadow: 0 10px 25px rgba(255, 133, 162, 0.3); transition: all 0.3s; }
                .save-button:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(255, 133, 162, 0.4); }
                .save-button:disabled { opacity: 0.6; cursor: not-allowed; }

                .pastel-select { width: 100%; padding: 14px; border-radius: 15px; border: 1px solid #f0f0f5; background: #fffcfd; color: #4a4a68; outline: none; }
                
                .blur-in { animation: blurIn 0.3s ease-out; }
                @keyframes blurIn { from { backdrop-filter: blur(0); background: rgba(0,0,0,0); } to { backdrop-filter: blur(10px); background: rgba(74, 74, 104, 0.4); } }
                
                .animate-pop { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                @keyframes popIn { from { opacity: 0; transform: scale(0.8) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            `}</style>
        </div>
    );
}

// Result Modal and Portal are already available as components, so I'm using them directly as imports.
