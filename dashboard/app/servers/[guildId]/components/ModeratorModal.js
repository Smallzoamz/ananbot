
"use client";
import React, { useState, useEffect } from "react";
import Portal from "../../../components/Portal";
import TagInput from "../../../components/TagInput";

const ModeratorModal = ({ show, onClose, guildId, userId }) => {
    if (!show) return null;

    const [activeTab, setActiveTab] = useState("automod");
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
        enabled: false, // Master toggle for spam? Or just individual? Let's use individual + master if needed.
        max_mentions: 5,
        rate_limit_enabled: false,
        rate_limit_count: 5,
        rate_limit_window: 10,
        repeat_text_enabled: false,
        repeat_text_count: 3,
        action: "warn"
    });

    const [channels, setChannels] = useState([]);

    useEffect(() => {
        if (show && guildId) {
            fetchAllConfigs();
        }
    }, [show, guildId]);

    const fetchAllConfigs = async () => {
        setLoading(true);
        try {
            // 1. Fetch Existing Moderator Config
            const modRes = await fetch(`/api/proxy/guild/${guildId}/settings`);
            const modData = await modRes.json();
            if (modData.moderator_config) {
                setModConfig(prev => ({ ...prev, ...modData.moderator_config }));
            }

            // 2. Fetch New Anti-Spam Config
            const spamRes = await fetch(`/api/guild/${guildId}/anti-spam`);
            const spamData = await spamRes.json();
            if (spamData.config) {
                setSpamConfig(prev => ({ ...prev, ...spamData.config }));
            }

            // 3. Fetch Channels (for Log Channel selection)
            const channelsRes = await fetch(`/api/proxy/guild/${guildId}/action`, {
                method: 'POST',
                body: JSON.stringify({ action: 'get_channels', user_id: userId })
            });
            const channelsData = await channelsRes.json();
            setChannels(channelsData.channels || []);

        } catch (error) {
            console.error("Failed to load configs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save Moderator Config
            await fetch(`/api/proxy/guild/${guildId}/action`, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'save_moderator_settings',
                    user_id: userId,
                    config: modConfig
                })
            });

            // Save Anti-Spam Config
            await fetch(`/api/guild/${guildId}/anti-spam`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ config: spamConfig })
            });

            // Close after simplified success (or show toast? User wants practical. Close is practical if success.)
            // Let's show a quick success state on the button or just close.
            // For now, let's close to be snappy, maybe with a small delay?
            // User requested "Practical", "Reduce Lag".
            onClose();
        } catch (error) {
            console.error("Save error:", error);
            alert("Failed to save settings. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const renderTabs = () => (
        <div className="mod-sidebar">
            <div className="sidebar-header">
                <h3>🛠️ Moderator</h3>
                <p>Control Center</p>
            </div>
            <div className="sidebar-menu">
                <button className={`menu-item ${activeTab === 'automod' ? 'active' : ''}`} onClick={() => setActiveTab('automod')}>
                    <span className="icon">🤖</span> Auto-Mod
                </button>
                <button className={`menu-item ${activeTab === 'antispam' ? 'active' : ''}`} onClick={() => setActiveTab('antispam')}>
                    <span className="icon">🛡️</span> Anti-Spam
                    <span className="badge-new">NEW</span>
                </button>
                <button className={`menu-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
                    <span className="icon">📜</span> Audit Logs
                </button>
            </div>
        </div>
    );

    const renderContent = () => {
        if (loading) return <div className="loading-state">Loading configuration... 🌸</div>;

        switch (activeTab) {
            case 'automod':
                return (
                    <div className="tab-content animate-fade">
                        <div className="content-header">
                            <h2>Auto-Moderation</h2>
                            <p>Basic protection against invites, links, and bad words.</p>
                        </div>

                        <div className="params-grid">
                            {/* Anti-Invite */}
                            <div className="param-card">
                                <div className="param-header">
                                    <div className="label-group">
                                        <span className="emoji-icon bg-blue-100">🚫</span>
                                        <div>
                                            <h4>Anti-Invite</h4>
                                            <p>Block Discord invite links</p>
                                        </div>
                                    </div>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={modConfig.anti_invite_enabled}
                                            onChange={() => setModConfig({ ...modConfig, anti_invite_enabled: !modConfig.anti_invite_enabled })}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </div>

                            {/* Anti-Link */}
                            <div className="param-card">
                                <div className="param-header">
                                    <div className="label-group">
                                        <span className="emoji-icon bg-purple-100">🔗</span>
                                        <div>
                                            <h4>Anti-Link</h4>
                                            <p>Block external links</p>
                                        </div>
                                    </div>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={modConfig.anti_link_enabled}
                                            onChange={() => setModConfig({ ...modConfig, anti_link_enabled: !modConfig.anti_link_enabled })}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </div>

                            {/* Bad Words */}
                            <div className="param-card full-width">
                                <div className="param-header">
                                    <div className="label-group">
                                        <span className="emoji-icon bg-red-100">🤬</span>
                                        <div>
                                            <h4>Bad Words Filter</h4>
                                            <p>Automatically delete messages containing these words.</p>
                                        </div>
                                    </div>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={modConfig.auto_mod_enabled}
                                            onChange={() => setModConfig({ ...modConfig, auto_mod_enabled: !modConfig.auto_mod_enabled })}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                {modConfig.auto_mod_enabled && (
                                    <div className="param-body">
                                        <TagInput
                                            tags={modConfig.bad_words || []}
                                            onChange={(newTags) => setModConfig({ ...modConfig, bad_words: newTags })}
                                            placeholder="Add words..."
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 'antispam':
                return (
                    <div className="tab-content animate-fade">
                        <div className="content-header">
                            <h2>Anti-Spam System</h2>
                            <p>Advanced protection against floods and raids.</p>
                        </div>

                        <div className="params-grid two-col">
                            {/* Excessive Mentions */}
                            <div className="param-card">
                                <div className="param-header">
                                    <div>
                                        <h4>📢 Max Mentions</h4>
                                        <p>Limit mentions per message</p>
                                    </div>
                                    <input
                                        type="number"
                                        className="number-input"
                                        value={spamConfig.max_mentions}
                                        onChange={(e) => setSpamConfig({ ...spamConfig, max_mentions: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            {/* Repeated Text */}
                            <div className="param-card">
                                <div className="param-header">
                                    <div>
                                        <h4>📝 Repeated Text</h4>
                                        <p>Block duplicated messages</p>
                                    </div>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={spamConfig.repeat_text_enabled}
                                            onChange={(e) => setSpamConfig({ ...spamConfig, repeat_text_enabled: e.target.checked })}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                <div className="param-body">
                                    <div className="flex-row-center">
                                        <span>Max Repeats:</span>
                                        <input
                                            type="number"
                                            className="number-input small"
                                            value={spamConfig.repeat_text_count}
                                            onChange={(e) => setSpamConfig({ ...spamConfig, repeat_text_count: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Rate Limit */}
                            <div className="param-card full-width">
                                <div className="param-header">
                                    <div className="label-group">
                                        <span className="emoji-icon bg-orange-100">⚡</span>
                                        <div>
                                            <h4>Rate Limiting</h4>
                                            <p>Prevent fast message flooding.</p>
                                        </div>
                                    </div>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={spamConfig.rate_limit_enabled}
                                            onChange={(e) => setSpamConfig({ ...spamConfig, rate_limit_enabled: e.target.checked })}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                {spamConfig.rate_limit_enabled && (
                                    <div className="param-body flex-gap">
                                        <div className="input-group">
                                            <label>Max Messages</label>
                                            <input
                                                type="number"
                                                className="modern-input"
                                                value={spamConfig.rate_limit_count}
                                                onChange={(e) => setSpamConfig({ ...spamConfig, rate_limit_count: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Time Window (sec)</label>
                                            <input
                                                type="number"
                                                className="modern-input"
                                                value={spamConfig.rate_limit_window}
                                                onChange={(e) => setSpamConfig({ ...spamConfig, rate_limit_window: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Punishment Action */}
                            <div className="param-card full-width danger-zone">
                                <div className="param-header">
                                    <div className="label-group">
                                        <span className="emoji-icon bg-red-100">⚖️</span>
                                        <div>
                                            <h4>Punishment Action</h4>
                                            <p>What should An An do when spam is detected?</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="param-body">
                                    <div className="action-select-group">
                                        {['warn', 'mute', 'kick', 'ban'].map(action => (
                                            <div
                                                key={action}
                                                className={`action-option ${spamConfig.action === action ? 'selected' : ''}`}
                                                onClick={() => setSpamConfig({ ...spamConfig, action })}
                                            >
                                                {action.toUpperCase()}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'logs':
                return (
                    <div className="tab-content animate-fade">
                        <div className="content-header">
                            <h2>Audit Logs</h2>
                            <p>Track server events and moderation actions.</p>
                        </div>

                        <div className="params-grid">
                            <div className="param-card full-width">
                                <div className="param-header">
                                    <div className="label-group">
                                        <span className="emoji-icon bg-green-100">📜</span>
                                        <div>
                                            <h4>Enable Logging</h4>
                                            <p>Master switch for all audit logs.</p>
                                        </div>
                                    </div>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={modConfig.audit_logs_enabled}
                                            onChange={() => setModConfig({ ...modConfig, audit_logs_enabled: !modConfig.audit_logs_enabled })}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </div>

                            <div className="param-card full-width">
                                <label className="input-label">Log Channel</label>
                                <select
                                    className="modern-select"
                                    value={modConfig.log_channel_id}
                                    onChange={(e) => setModConfig({ ...modConfig, log_channel_id: e.target.value })}
                                >
                                    <option value="">-- Select Channel --</option>
                                    {channels.map(ch => (
                                        <option key={ch.id} value={ch.id}># {ch.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Portal>
            <div className={`fixed-overlay blur-in ${!show ? 'hiding' : ''}`}>
                <div className="modal-container-large animate-pop">
                    {renderTabs()}

                    <div className="mod-content-area">
                        <button className="close-btn-abs" onClick={onClose}>×</button>
                        {renderContent()}

                        <div className="mod-footer">
                            <button className="cancel-btn" onClick={onClose}>Cancel</button>
                            <button className="save-btn" onClick={handleSave} disabled={saving || loading}>
                                {saving ? "Saving..." : "Save Changes 💾"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .fixed-overlay {
                    position: fixed;
                    top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(8px);
                    z-index: 5000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .modal-container-large {
                    width: 900px;
                    max-width: 95vw;
                    height: 600px;
                    max-height: 90vh;
                    background: white;
                    border-radius: 24px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    display: flex;
                    overflow: hidden;
                    position: relative;
                }

                /* Sidebar */
                .mod-sidebar {
                    width: 260px;
                    background: #f8fafc;
                    border-right: 1px solid #edf2f7;
                    display: flex;
                    flex-direction: column;
                    padding: 24px;
                    flex-shrink: 0;
                }
                .sidebar-header { margin-bottom: 32px; }
                .sidebar-header h3 { font-size: 1.25rem; font-weight: 700; color: #1e293b; }
                .sidebar-header p { font-size: 0.875rem; color: #64748b; }

                .sidebar-menu { display: flex; flex-direction: column; gap: 8px; }
                .menu-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border-radius: 12px;
                    background: transparent;
                    border: none;
                    color: #64748b;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: left;
                    font-size: 0.95rem;
                }
                .menu-item:hover { background: #e2e8f0; color: #0f172a; }
                .menu-item.active { background: white; color: #ec4899; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
                .badge-new { 
                    font-size: 0.6rem; background: #ec4899; color: white; 
                    padding: 2px 6px; border-radius: 99px; margin-left: auto; 
                }

                /* Content Area */
                .mod-content-area {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    background: white;
                }
                .close-btn-abs {
                    position: absolute; top: 16px; right: 20px;
                    background: none; border: none; font-size: 24px; color: #94a3b8;
                    cursor: pointer; z-index: 10;
                }
                .close-btn-abs:hover { color: #475569; }

                .tab-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 32px 40px;
                }
                .content-header { margin-bottom: 32px; }
                .content-header h2 { font-size: 1.8rem; font-weight: 800; color: #1e293b; margin-bottom: 4px; }
                .content-header p { color: #64748b; font-size: 0.95rem; }

                /* Params Grid */
                .params-grid { display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); }
                .params-grid.two-col { grid-template-columns: 1fr 1fr; }
                .param-card.full-width { grid-column: 1 / -1; }

                .param-card {
                    padding: 20px;
                    border-radius: 16px;
                    border: 1px solid #f1f5f9;
                    background: white;
                    transition: border-color 0.2s;
                }
                .param-card:hover { border-color: #ec4899; }
                .param-card.danger-zone { border-color: #fca5a5; background: #fef2f2; }

                .param-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
                .label-group { display: flex; gap: 12px; align-items: center; }
                .emoji-icon { 
                    width: 42px; height: 42px; border-radius: 10px; 
                    display: flex; align-items: center; justify-content: center; font-size: 20px; 
                }
                .param-header h4 { font-weight: 700; color: #334155; margin-bottom: 2px; }
                .param-header p { font-size: 0.8rem; color: #94a3b8; }

                .param-body { margin-top: 16px; padding-top: 16px; border-top: 1px solid #f1f5f9; }
                .flex-gap { display: flex; gap: 20px; }
                .flex-row-center { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; color: #64748b; }

                /* Inputs */
                .number-input { 
                    width: 60px; padding: 8px; border-radius: 8px; border: 1px solid #cbd5e1; 
                    text-align: center; font-weight: 600; outline: none;
                }
                .number-input.small { width: 50px; padding: 4px; }
                .number-input:focus { border-color: #ec4899; ring: 2px solid #fbcfe8; }
                
                .modern-input, .modern-select {
                    width: 100%; padding: 10px 14px; border-radius: 10px;
                    border: 1px solid #e2e8f0; font-size: 0.95rem; outline: none;
                }
                .modern-input:focus, .modern-select:focus { border-color: #ec4899; }

                /* Action Select */
                .action-select-group { display: flex; gap: 10px; }
                .action-option {
                    flex: 1; padding: 10px; text-align: center;
                    border: 1px solid #e2e8f0; border-radius: 8px;
                    font-weight: 600; font-size: 0.85rem; color: #64748b;
                    cursor: pointer; background: white; transition: all 0.2s;
                }
                .action-option:hover { background: #f8fafc; }
                .action-option.selected { 
                    background: #ef4444; color: white; border-color: #ef4444; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.3);
                }

                /* Footer */
                .mod-footer {
                    padding: 20px 40px;
                    border-top: 1px solid #f1f5f9;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    background: #f8fafc;
                }
                .cancel-btn { 
                    padding: 10px 20px; border-radius: 12px; font-weight: 600; 
                    color: #64748b; background: transparent; border: 1px solid transparent; cursor: pointer; 
                }
                .cancel-btn:hover { background: #e2e8f0; }
                .save-btn { 
                    padding: 10px 24px; border-radius: 12px; font-weight: 600; 
                    color: white; background: linear-gradient(135deg, #ec4899, #f43f5e); 
                    border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(236, 72, 153, 0.25);
                    transition: transform 0.2s;
                }
                .save-btn:hover { transform: translateY(-2px); }
                .save-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

                /* Toggle Switch (Reused) */
                .switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
                .switch input { opacity: 0; width: 0; height: 0; }
                .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .4s; border-radius: 34px; }
                .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
                input:checked + .slider { background-color: #ec4899; }
                input:checked + .slider:before { transform: translateX(20px); }

            `}</style>
        </Portal>
    );
};

export default ModeratorModal;
