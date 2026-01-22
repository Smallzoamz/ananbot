"use client";
import React, { useState, useEffect } from "react";
import Portal from "../../../components/Portal";

const VerificationModal = ({ show, onClose, guildId, user }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [config, setConfig] = useState({ enabled: false, role_id: null, channel_id: null });
    const [roles, setRoles] = useState([]);
    const [statusMsg, setStatusMsg] = useState("");

    useEffect(() => {
        if (!show || !user) return;
        const fetchData = async () => {
            try {
                // Fetch Settings
                const resSettings = await fetch(`/api/proxy/guild/${guildId}/settings`);
                const dataSettings = await resSettings.json();
                if (dataSettings.verification) setConfig(dataSettings.verification);

                // Fetch Roles
                const resRoles = await fetch(`/api/proxy/guild/${guildId}/action`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: "get_roles", user_id: user.id })
                });
                const dataRoles = await resRoles.json();
                if (dataRoles.roles) setRoles(dataRoles.roles);

                setIsLoading(false);
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();
    }, [show, guildId, user]);

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        setStatusMsg("🔄 Synchronizing...");
        try {
            const res = await fetch(`/api/proxy/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_verification_config',
                    user_id: user.id || user.uid,
                    guild_id: guildId,
                    config: config
                })
            });
            const data = await res.json();
            if (data.success) {
                setStatusMsg("✅ Synced!");
                setTimeout(() => setStatusMsg(""), 3000);
            }
            else setStatusMsg("❌ " + (data.error || "Error"));
        } catch (e) {
            setStatusMsg("❌ Network Error");
        } finally {
            setIsSaving(false);
        }
    };

    if (!show) return null;

    const verifyLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${guildId}`;

    const getStatusClass = () => {
        if (statusMsg.includes('Error')) return 'error';
        if (statusMsg.includes('Synced')) return 'success';
        if (statusMsg.includes('Synchronizing')) return 'syncing';
        if (statusMsg) return 'success';
        return '';
    };

    return (
        <Portal>
            <div className="gatekeeper-overlay">
                <div className="gatekeeper-modal">

                    {/* Header */}
                    <div className="gatekeeper-header">
                        <div className="gatekeeper-header-left">
                            <h2><span>🛡️</span> Gatekeeper</h2>
                            <p>Official Anti-Raid Protocol</p>
                        </div>
                        <button onClick={onClose} className="gatekeeper-close">×</button>
                    </div>

                    {/* Body */}
                    <div className="gatekeeper-body">
                        {isLoading ? (
                            <div className="gk-loader">
                                <div className="gk-spinner"></div>
                            </div>
                        ) : (
                            <>
                                {/* System Enable Toggle */}
                                <div className="gk-enable-panel">
                                    <div className="gk-enable-info">
                                        <h3>System Enable</h3>
                                        <p>Require verification for new members</p>
                                    </div>
                                    <div
                                        className={`gk-toggle ${config.enabled ? 'active' : ''}`}
                                        onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                                    >
                                        <div className="gk-toggle-handle"></div>
                                    </div>
                                </div>

                                {/* Role Selection */}
                                <div className="gk-form-group">
                                    <label className="gk-label">CITIZEN ROLE (VERIFIED)</label>
                                    <select
                                        className="gk-select"
                                        value={config.role_id || ""}
                                        onChange={(e) => setConfig({ ...config, role_id: e.target.value })}
                                    >
                                        <option value="">-- Select Role --</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Verification Link */}
                                <div className="gk-form-group">
                                    <label className="gk-label">🔗 VERIFICATION LINK</label>
                                    <div className="gk-input-group">
                                        <input
                                            type="text"
                                            readOnly
                                            value={verifyLink}
                                            className="gk-input"
                                        />
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(verifyLink);
                                                setStatusMsg("Copied!");
                                                setTimeout(() => setStatusMsg(""), 1000);
                                            }}
                                            className="gk-copy-btn"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="gatekeeper-footer">
                        <div className="gk-status">
                            <div className={`gk-status-dot ${getStatusClass()}`}></div>
                            <span>{statusMsg || "Ready to sync"}</span>
                        </div>
                        <div className="gk-actions">
                            <button onClick={onClose} className="gk-btn gk-btn-cancel">Cancel</button>
                            <button
                                onClick={handleSave}
                                className="gk-btn gk-btn-save"
                                disabled={isSaving}
                            >
                                {isSaving ? '🔄 Syncing...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </Portal>
    );
};

export default VerificationModal;
