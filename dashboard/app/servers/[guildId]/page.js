"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLanguage } from "../../context/LanguageContext";
import { useServer } from "../../context/ServerContext";
import { CrownIcon } from "../../components/Icons";

export default function GuildDashboard() {
    const { data: session, status: authStatus } = useSession();
    const { t, language } = useLanguage();
    const { guildId, guildData, stats, userPlan, loading: serverLoading } = useServer();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState("All Plugins");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [setupStep, setSetupStep] = useState(1);
    const [selectedTemplate, setSelectedTemplate] = useState("Shop");
    const [setupFlavor, setSetupFlavor] = useState("");
    const [extraData, setExtraData] = useState("");
    const [pendingAction, setPendingAction] = useState(null);
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [missions, setMissions] = useState([]);

    // Default bitmask values
    const DEFAULT_PERMS = {
        admin: "8",
        staff: "268553232",
        member: "104190464"
    };

    const [customRoles, setCustomRoles] = useState([
        { name: "SUPER ADMIN", permissions: "admin", color: "#FFD700", permissions_bitmask: DEFAULT_PERMS.admin }
    ]);
    const [customZones, setCustomZones] = useState([
        {
            name: "GENERAL",
            allowedRoles: ["SUPER ADMIN"],
            channels: [
                { name: "chat", type: "text", allowedRoles: ["SUPER ADMIN"] },
                { name: "voice", type: "voice", allowedRoles: ["SUPER ADMIN"] }
            ]
        }
    ]);
    const [activeZoneIndex, setActiveZoneIndex] = useState(0);
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [showPermsModal, setShowPermsModal] = useState(false);
    const [activeRoleIndex, setActiveRoleIndex] = useState(null);
    const [showSelectiveModal, setShowSelectiveModal] = useState(false);
    const [serverStructure, setServerStructure] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (authStatus === "unauthenticated") router.push("/");
    }, [authStatus, router]);

    const fetchMissions = async () => {
        if (!session?.user?.id || !guildId) return;
        try {
            const res = await fetch("/api/proxy/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "get_missions", user_id: session.user.id, guild_id: guildId })
            });
            const data = await res.json();
            if (data.missions) setMissions(data.missions);
        } catch (err) {
            console.error("Missions Error:", err);
        }
    };

    const fetchPerms = async () => {
        try {
            const res = await fetch("/api/proxy/discord-permissions");
            const data = await res.json();
            setAvailablePermissions(data);
        } catch (err) {
            console.error("Failed to fetch permissions:", err);
        }
    };

    const fetchStructure = async () => {
        if (!guildId) return;
        try {
            const res = await fetch(`/api/proxy/guild/${guildId}/structure`);
            const data = await res.json();
            setServerStructure(data);
        } catch (err) {
            console.error("Failed to fetch structure:", err);
        }
    };

    useEffect(() => {
        if (guildId) {
            fetchMissions();
            fetchPerms();
        }
    }, [guildId, session?.user?.id]);

    const handleAction = async (action, templateArg = "Shop") => {
        if (!guildId) return;

        // Intercept destructive actions
        if (action === "clear" && !showConfirmModal) {
            setPendingAction({ action, template: templateArg });
            setShowConfirmModal(true);
            return;
        }

        if (action === "setup" && !showSetupModal) {
            setSetupStep(1);
            setSetupFlavor("");
            setExtraData("");
            setShowSetupModal(true);
            return;
        }

        try {
            // Prepare extra_data based on template
            let finalExtra = {};
            if (action === "setup") {
                if (templateArg === "Shop") {
                    finalExtra = { options: setupFlavor === "Full" ? ["Nitro", "Stream Status", "เม็ด Boost"] : ["Nitro", "Stream Status"] };
                } else if (templateArg === "Community") {
                    if (setupFlavor === "Game") {
                        finalExtra = { games: extraData.split(",").map(s => s.trim()) };
                    }
                    finalExtra = { platforms: extraData.split(",").map(s => s.trim()) };
                } else if (templateArg === "Custom") {
                    finalExtra = {
                        custom_roles: customRoles.map(r => ({
                            name: r.name,
                            color: r.color,
                            permissions: r.permissions,
                            permissions_bitmask: r.permissions_bitmask
                        })),
                        custom_zones: customZones
                    };
                }
            }

            const res = await fetch("/api/proxy/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    template: templateArg,
                    guild_id: guildId,
                    user_id: session?.user?.id,
                    extra_data: finalExtra
                })
            });
            const data = await res.json();
            if (data.status) {
                alert(`Successfully triggered: ${action}! ✨`);
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            console.error("Action Error:", err);
            alert("Failed to communicate with An An Bot API.");
        } finally {
            setShowConfirmModal(false);
            setShowSetupModal(false);
            setPendingAction(null);
        }
    };

    const handleClaimReward = async (missionKey) => {
        if (!session?.user?.id) return;
        try {
            const res = await fetch("/api/proxy/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "claim_mission", user_id: session.user.id, mission_key: missionKey })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Claimed ${data.xp_added} XP! 🌸✨`);
                fetchMissions();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            console.error("Claim Error:", err);
        }
    };

    const toggleSelection = (id, targetType = "channel", children = []) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                if (targetType === "category") {
                    return prev.filter(item => item !== id && !children.some(c => c.id === item));
                }
                return prev.filter(item => item !== id);
            } else {
                if (targetType === "category") {
                    const childrenIds = children.map(c => c.id);
                    return Array.from(new Set([...prev, id, ...childrenIds]));
                }
                return [...prev, id];
            }
        });
    };

    const handleDeleteSelective = async () => {
        if (selectedIds.length === 0) return;
        setIsDeleting(true);
        try {
            const res = await fetch("/api/proxy/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "delete_selective",
                    ids: selectedIds,
                    guild_id: guildId
                })
            });
            const data = await res.json();
            if (data.status) {
                alert("Selective deletion started! ✨");
                setShowSelectiveModal(false);
                setSelectedIds([]);
            }
        } catch (err) {
            console.error("Delete Error:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    if (serverLoading) return <div className="loader">🌸 Fetching Server Secrets...</div>;
    if (!guildData) return <div className="loader">❌ Server Not Found</div>;

    const tabs = ["All Plugins", "Essentials", "Server Management", "Security", "Utilities"];

    return (
        <div className="mee6-content">
            {/* Membership Pricing Modal */}
            {showPricingModal && (
                <div className="modal-overlay blur-in" onClick={() => setShowPricingModal(false)} style={{ zIndex: 3000 }}>
                    <div className="pricing-modal glass animate-pop" onClick={e => e.stopPropagation()}>
                        <div className="pricing-header">
                            <h2>Choose Your <span>Power</span> 👑</h2>
                            <p>Unlock exclusive features to grow your community 🌸</p>
                            <button className="close-x" onClick={() => setShowPricingModal(false)}>×</button>
                        </div>
                        <div className="pricing-grid">
                            <div className="pricing-card">
                                <div className="p-tier">FREE</div>
                                <div className="p-price">$0 <span>/month</span></div>
                                <ul className="p-features">
                                    <li>✅ Basic Template Deploy</li>
                                    <li>✅ Daily Missions</li>
                                    <li>✅ General Commands</li>
                                </ul>
                                <button className="p-btn disabled">Current Plan</button>
                            </div>
                            <div className="pricing-card featured pro">
                                <div className="p-tier">PRO 💎</div>
                                <div className="p-price">$4.99 <span>/month</span></div>
                                <ul className="p-features">
                                    <li>✅ All Free Features</li>
                                    <li>✅ Pro Badge on Profile</li>
                                    <li>✅ anan-terminal Access</li>
                                    <li>✅ Advanced Management</li>
                                </ul>
                                <button className="p-btn pro">Get Pro 🚀</button>
                            </div>
                            <div className="pricing-card featured premium">
                                <div className="p-badge-promo">BEST VALUE</div>
                                <div className="p-tier">PREMIUM ✨</div>
                                <div className="p-price">$9.99 <span>/month</span></div>
                                <ul className="p-features">
                                    <li>✅ Everything in Pro</li>
                                    <li>✅ Lifetime Updates</li>
                                    <li>✅ Custom Bot Branding</li>
                                    <li>✅ Priority Support 24/7</li>
                                </ul>
                                <button className="p-btn premium">Get Premium 👑</button>
                            </div>
                        </div>
                        <div className="pricing-footer">
                            <p>An An will handle everything for Papa! 🌸💖</p>
                        </div>
                    </div>
                </div>
            )}

            {showConfirmModal && (
                <div className="modal-overlay blur-in" style={{ zIndex: 3500 }}>
                    <div className="modal-card glass animate-pop">
                        <div className="modal-icon">⚠️</div>
                        <h2>{t.dashboard.modal.confirm}</h2>
                        <p>
                            This will <strong>wipe all channels and roles</strong> instantly to prepare for a clean deployment.
                            This action is permanent and cannot be undone!
                        </p>
                        <div className="modal-actions">
                            <button className="modal-btn secondary" onClick={() => setShowConfirmModal(false)}>No, take me back! 🌸</button>
                            <button className="modal-btn primary-danger" onClick={() => handleAction(pendingAction.action, pendingAction.template)}>Yes, Clean & Reset! 🚀</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Advanced Permissions Modal */}
            {showPermsModal && activeRoleIndex !== null && (
                <div className="modal-overlay blur-in" style={{ zIndex: 4000 }}>
                    <div className="modal-card perms-modal glass animate-pop">
                        <div className="modal-header">
                            <div>
                                <h2>Advanced Permissions</h2>
                                <p>Configure granular rights for <strong>{customRoles[activeRoleIndex]?.name || 'Role'}</strong></p>
                            </div>
                            <button className="modal-close" onClick={() => setShowPermsModal(false)}>×</button>
                        </div>
                        <div className="perms-grid">
                            {availablePermissions.map(p => {
                                const currentBitmask = BigInt(customRoles[activeRoleIndex]?.permissions_bitmask || 0);
                                const permValue = BigInt(p.value);
                                const isSet = (currentBitmask & permValue) === permValue;

                                return (
                                    <div
                                        key={p.id}
                                        className={`perm-toggle-item ${isSet ? 'active' : ''}`}
                                        onClick={() => {
                                            const newRoles = [...customRoles];
                                            let newBitmask;
                                            if (isSet) {
                                                newBitmask = currentBitmask & ~permValue;
                                            } else {
                                                newBitmask = currentBitmask | permValue;
                                            }
                                            newRoles[activeRoleIndex].permissions_bitmask = newBitmask.toString();
                                            setCustomRoles(newRoles);
                                        }}
                                    >
                                        <div className="perm-info">
                                            <span className="p-name">{p.name}</span>
                                            <span className="p-id">{p.id}</span>
                                        </div>
                                        <div className="p-switch">
                                            <div className="switch-knob"></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="modal-actions">
                            <button className="modal-btn primary" onClick={() => setShowPermsModal(false)}>Save & Close</button>
                            <button className="modal-btn ghost" onClick={() => {
                                const newRoles = [...customRoles];
                                delete newRoles[activeRoleIndex].permissions_bitmask;
                                setCustomRoles(newRoles);
                                setShowPermsModal(false);
                            }}>Reset to Default</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Setup Selection Modal */}
            {showSetupModal && (
                <div className="modal-overlay blur-in" style={{ zIndex: 2900 }}>
                    <div className={`modal-card glass animate-pop-slow ${setupStep === 'custom_roles' || setupStep === 'custom_zones' ? 'setup-modal' : ''}`}>
                        <div className="modal-header">
                            <div>
                                <h2>{t.dashboard.modal.title}</h2>
                                <p>
                                    {setupStep === 'custom_roles' ? t.dashboard.modal.stepCustomRoles :
                                        setupStep === 'custom_zones' ? t.dashboard.modal.stepCustomZones :
                                            `Phase ${setupStep} of 3 • ${setupStep === 1 ? t.dashboard.modal.step1 : setupStep === 2 ? t.dashboard.modal.step2 : t.dashboard.modal.step3}`}
                                </p>
                            </div>
                            <button className="modal-close" onClick={() => setShowSetupModal(false)}>×</button>
                        </div>

                        {setupStep === 1 && (
                            <div className="setup-grid">
                                <div className="setup-option" onClick={() => { setSelectedTemplate("Shop"); setSetupStep(2); }}>
                                    <div className="so-icon">🛒</div>
                                    <div className="so-info">
                                        <h4>Shop (ร้านค้า)</h4>
                                        <p>Optimized for selling nitro & services.</p>
                                    </div>
                                    <div className="so-arrow">→</div>
                                </div>
                                <div className="setup-option" onClick={() => { setSelectedTemplate("Community"); setSetupStep(2); }}>
                                    <div className="so-icon">🎮</div>
                                    <div className="so-info">
                                        <h4>Community (คอมมู)</h4>
                                        <p>Social spaces for friends or gamers.</p>
                                    </div>
                                    <div className="so-arrow">→</div>
                                </div>
                                <div className="setup-option" onClick={() => { setSelectedTemplate("Fanclub"); setSetupStep(3); }}>
                                    <div className="so-icon">👑</div>
                                    <div className="so-info">
                                        <h4>Fanclub (แฟนคลับ)</h4>
                                        <p>Perfect for streamers & creators.</p>
                                    </div>
                                    <div className="so-arrow">→</div>
                                </div>
                                <div className="setup-option custom-opt" onClick={() => {
                                    if (userPlan.plan_type === 'free') {
                                        setShowSetupModal(false);
                                        setShowPricingModal(true);
                                    } else {
                                        setSelectedTemplate("Custom");
                                        setSetupStep('custom_roles');
                                    }
                                }}>
                                    <div className="so-icon">🎨</div>
                                    <div className="so-info">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h4>{t.dashboard.custom}</h4>
                                            <span className="p-badge-s" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}><CrownIcon /></span>
                                        </div>
                                        <p>{t.dashboard.customDesc}</p>
                                    </div>
                                    <div className="so-arrow">→</div>
                                </div>
                            </div>
                        )}

                        {setupStep === 2 && (
                            <div className="setup-grid animate-fade">
                                {selectedTemplate === "Shop" ? (
                                    <>
                                        <div className="setup-option" onClick={() => { setSetupFlavor("Full"); handleAction("setup", "Shop"); }}>
                                            <div className="so-icon">💎</div>
                                            <div className="so-info">
                                                <h4>Full Pack (จัดเต็ม)</h4>
                                                <p>Includes Nitro, Status, and Boost zones.</p>
                                            </div>
                                            <div className="so-arrow">✓</div>
                                        </div>
                                        <div className="setup-option" onClick={() => { setSetupFlavor("Standard"); handleAction("setup", "Shop"); }}>
                                            <div className="so-icon">🛒</div>
                                            <div className="so-info">
                                                <h4>Standard Pack (มาตรฐาน)</h4>
                                                <p>Includes Nitro & Status zones only.</p>
                                            </div>
                                            <div className="so-arrow">✓</div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="setup-option" onClick={() => { setSetupFlavor("Friend"); handleAction("setup", "Community"); }}>
                                            <div className="so-icon">👥</div>
                                            <div className="so-info">
                                                <h4>สายแชททั่วไป (Friend)</h4>
                                                <p>Social spaces for general chatting.</p>
                                            </div>
                                            <div className="so-arrow">✓</div>
                                        </div>
                                        <div className="setup-option" onClick={() => { setSetupFlavor("Game"); setSetupStep(3); }}>
                                            <div className="so-icon">🎮</div>
                                            <div className="so-info">
                                                <h4>สายเกมเมอร์ (Game)</h4>
                                                <p>Add specific game categories!</p>
                                            </div>
                                            <div className="so-arrow">→</div>
                                        </div>
                                    </>
                                )}
                                <button className="modal-btn ghost" onClick={() => setSetupStep(1)}>← Back to selection</button>
                            </div>
                        )}

                        {setupStep === 3 && (
                            <div className="setup-config-area animate-fade">
                                <div className="config-group">
                                    <label>
                                        {selectedTemplate === "Community" ? "List of Games (comma separated)" : "List of Platforms (comma separated)"}
                                    </label>
                                    <input
                                        className="cute-input"
                                        placeholder={selectedTemplate === "Community" ? "Valorant, Roblox, Minecraft" : "Twitch, YouTube, TikTok"}
                                        value={extraData}
                                        onChange={(e) => setExtraData(e.target.value)}
                                        autoFocus
                                    />
                                    <span className="input-hint">An An will create dedicated zones for each item! 🪄</span>
                                </div>
                                <div className="modal-actions-v">
                                    <button className="modal-btn primary" onClick={() => handleAction("setup", selectedTemplate)}>Create My Server! ✨</button>
                                    <button className="modal-btn ghost" onClick={() => setSetupStep(selectedTemplate === "Fanclub" ? 1 : 2)}>← Back</button>
                                </div>
                            </div>
                        )}

                        {setupStep === 'custom_roles' && (
                            <div className="setup-config-area animate-fade">
                                <div className="custom-list">
                                    {customRoles.map((role, idx) => (
                                        <div key={idx} className="custom-item glass">
                                            <input type="color" className="role-color-picker" value={role.color} onChange={e => {
                                                const NewR = [...customRoles];
                                                NewR[idx].color = e.target.value;
                                                setCustomRoles(NewR);
                                            }} />
                                            <input className="mini-input" value={role.name} onChange={e => {
                                                const NewR = [...customRoles];
                                                NewR[idx].name = e.target.value;
                                                setCustomRoles(NewR);
                                            }} />
                                            <select className="mini-select" value={role.permissions} onChange={e => {
                                                const pType = e.target.value;
                                                const NewR = [...customRoles];
                                                NewR[idx].permissions = pType;
                                                NewR[idx].permissions_bitmask = DEFAULT_PERMS[pType];
                                                setCustomRoles(NewR);
                                            }}>
                                                <option value="member">Member</option>
                                                <option value="staff">Staff</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <button className={`mini-perm-btn ${role.permissions_bitmask ? 'active' : ''}`} onClick={() => { setActiveRoleIndex(idx); setShowPermsModal(true); }}>🛡️</button>
                                            <button className="del-btn" onClick={() => setCustomRoles(customRoles.filter((_, i) => i !== idx))}>×</button>
                                        </div>
                                    ))}
                                    <button className="add-btn" onClick={() => setCustomRoles([...customRoles, { name: "NEW ROLE", permissions: "member", color: "#FFFFFF", permissions_bitmask: DEFAULT_PERMS.member }])}>+ Add Role</button>
                                </div>
                                <div className="modal-actions-v" style={{ marginTop: '20px' }}>
                                    <button className="modal-btn primary" onClick={() => setSetupStep('custom_zones')}>Next Step →</button>
                                    <button className="modal-btn ghost" onClick={() => setSetupStep(1)}>← Back</button>
                                </div>
                            </div>
                        )}

                        {setupStep === 'custom_zones' && (
                            <div className="setup-config-area animate-fade">
                                <div className="custom-split">
                                    <div className="split-left">
                                        <label>Categories</label>
                                        {customZones.map((zone, idx) => (
                                            <div key={idx} className={`zone-tab ${activeZoneIndex === idx ? 'active' : ''}`} onClick={() => setActiveZoneIndex(idx)}>
                                                <div className="zone-tab-main">
                                                    <input value={zone.name} onChange={e => {
                                                        const NewZ = [...customZones];
                                                        NewZ[idx].name = e.target.value.toUpperCase();
                                                        setCustomZones(NewZ);
                                                    }} />
                                                    <button className="zone-del" onClick={e => { e.stopPropagation(); setCustomZones(customZones.filter((_, i) => i !== idx)); }}>×</button>
                                                </div>
                                                <div className="zone-access" onClick={e => e.stopPropagation()}>
                                                    <div className="access-tags">
                                                        {customRoles.map(role => (
                                                            <span key={role.name} className={`access-tag mini ${zone.allowedRoles?.includes(role.name) ? 'active' : ''}`} onClick={() => {
                                                                const NewZ = [...customZones];
                                                                const current = NewZ[idx].allowedRoles || [];
                                                                NewZ[idx].allowedRoles = current.includes(role.name) ? current.filter(r => r !== role.name) : [...current, role.name];
                                                                setCustomZones(NewZ);
                                                            }}>{role.name[0]}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button className="add-zone" onClick={() => setCustomZones([...customZones, { name: "NEW ZONE", channels: [], allowedRoles: ["SUPER ADMIN"] }])}>+</button>
                                    </div>
                                    <div className="split-right">
                                        <label>Channels in {customZones[activeZoneIndex]?.name}</label>
                                        <div className="chan-list">
                                            {customZones[activeZoneIndex]?.channels.map((ch, idx) => (
                                                <div key={idx} className="chan-row">
                                                    <div className="chan-item-main">
                                                        <span className="ch-type-icon">{ch.type === 'text' ? '#' : '🔊'}</span>
                                                        <input value={ch.name} onChange={e => {
                                                            const NewZ = [...customZones];
                                                            NewZ[activeZoneIndex].channels[idx].name = e.target.value;
                                                            setCustomZones(NewZ);
                                                        }} />
                                                        <div className="chan-access-horizontal">
                                                            {customRoles.map(role => (
                                                                <span key={role.name} className={`access-tag mini-dot ${ch.allowedRoles?.includes(role.name) ? 'active' : ''}`} onClick={() => {
                                                                    const NewZ = [...customZones];
                                                                    const current = NewZ[activeZoneIndex].channels[idx].allowedRoles || [];
                                                                    NewZ[activeZoneIndex].channels[idx].allowedRoles = current.includes(role.name) ? current.filter(r => r !== role.name) : [...current, role.name];
                                                                    setCustomZones(NewZ);
                                                                }}>{role.name[0]}</span>
                                                            ))}
                                                        </div>
                                                        <button className="ch-del" onClick={() => {
                                                            const NewZ = [...customZones];
                                                            NewZ[activeZoneIndex].channels = NewZ[activeZoneIndex].channels.filter((_, i) => i !== idx);
                                                            setCustomZones(NewZ);
                                                        }}>×</button>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="chan-adds">
                                                <button onClick={() => {
                                                    const NewZ = [...customZones];
                                                    NewZ[activeZoneIndex].channels.push({ name: "new-text", type: "text", allowedRoles: ["SUPER ADMIN"] });
                                                    setCustomZones(NewZ);
                                                }}>+ Text</button>
                                                <button onClick={() => {
                                                    const NewZ = [...customZones];
                                                    NewZ[activeZoneIndex].channels.push({ name: "New Voice", type: "voice", allowedRoles: ["SUPER ADMIN"] });
                                                    setCustomZones(NewZ);
                                                }}>+ Voice</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="role-legend glass" style={{ marginTop: '20px', padding: '12px 20px', borderRadius: '15px' }}>
                                    <div className="legend-title">💡 Role Legend (Tips)</div>
                                    <div className="legend-items">
                                        {customRoles.map(role => (
                                            <div key={role.name} className="legend-item">
                                                <span className="dot-preview active">{role.name[0]}</span>
                                                <span className="dot-fullname">: {role.name}</span>
                                            </div>
                                        ))}
                                        <div className="legend-note">Click the dots to toggle access! ✨</div>
                                    </div>
                                </div>
                                <div className="modal-actions-v" style={{ marginTop: '30px' }}>
                                    <button className="modal-btn primary" onClick={() => handleAction("setup", "Custom")}>Create My Server! ✨</button>
                                    <button className="modal-btn ghost" onClick={() => setSetupStep('custom_roles')}>← Back to Roles</button>
                                </div>
                            </div>
                        )}
                        {setupStep === 1 && <button className="modal-btn secondary" style={{ marginTop: '20px' }} onClick={() => setShowSetupModal(false)}>Not now, maybe later 🌸</button>}
                    </div>
                </div>
            )}

            {/* Selective Management Modal */}
            {showSelectiveModal && (
                <div className="modal-overlay blur-in" style={{ zIndex: 3200 }}>
                    <div className="modal-card wide-card glass animate-pop" style={{ textAlign: 'left' }}>
                        <button className="modal-close" onClick={() => setShowSelectiveModal(false)}>×</button>
                        <div className="selective-header">
                            <div className="m-icon">🏗️</div>
                            <div className="m-title">
                                <h3>Structure Manager</h3>
                                <p>จัดการโครงสร้างเซิร์ฟเวอร์แบบเจาะจง</p>
                            </div>
                        </div>
                        <div className="selective-body discord-sidebar custom-list">
                            {serverStructure.map(cat => (
                                <div key={cat.id} className="discord-cat-section">
                                    <div className="discord-cat-header" onClick={() => toggleSelection(cat.id, "category", cat.channels)}>
                                        <div className="ch-checkbox-wrap">
                                            <input type="checkbox" checked={selectedIds.includes(cat.id)} onChange={() => { }} className="m-checkbox" />
                                        </div>
                                        <span className="cat-arrow">{cat.name === "UNCATEGORIZED" ? "📂" : "⌵"}</span>
                                        <span className="cat-name">{cat.name.toUpperCase()}</span>
                                        <span className="cat-count">{cat.channels.length}</span>
                                    </div>
                                    <div className="discord-ch-list">
                                        {cat.channels.map(ch => (
                                            <div key={ch.id} className={`discord-ch-item ${selectedIds.includes(ch.id) ? 'selected' : ''}`} onClick={(e) => { e.stopPropagation(); toggleSelection(ch.id); }}>
                                                <div className="ch-checkbox-wrap">
                                                    <input type="checkbox" checked={selectedIds.includes(ch.id)} onChange={() => { }} className="m-checkbox" />
                                                </div>
                                                <span className="ch-icon">{ch.type === "0" || ch.type === "text" ? "#" : (ch.type === "2" || ch.type === "voice" ? "🔊" : "💬")}</span>
                                                <span className="ch-name">{ch.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="modal-footer">
                            <div className="selection-count">Selected: <b>{selectedIds.length}</b> items</div>
                            <div className="modal-actions-row">
                                <button className="modal-btn ghost" onClick={() => setShowSelectiveModal(false)}>ยกเลิก</button>
                                <button className="modal-btn danger" onClick={handleDeleteSelective} disabled={selectedIds.length === 0 || isDeleting}>
                                    {isDeleting ? "กำลังลบ..." : `ลบรายการที่เลือก (${selectedIds.length})`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Banner (Mission Center) */}
            <div className="hero-banner mission-center">
                <div className="hero-bg-anime">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(lvl => (
                        <div key={lvl} className={`hero-bg-icon lvl-${lvl}`} style={{ backgroundImage: `url('/assets/levels/LV${lvl}.png')` }}></div>
                    ))}
                </div>
                <div className="hero-text">
                    <h1>Grow your server with <span>Missions</span></h1>
                    <div className="hero-buttons">
                        <button className="hero-btn primary" onClick={() => router.push(`/servers/${guildId}/leaderboard`)}>Do a Mission 🚀</button>
                        <button className="hero-btn secondary" onClick={() => router.push(`/servers/${guildId}/leaderboard`)}>View Rewards</button>
                    </div>
                </div>
                <div className="mission-card-wrapper animate-float">
                    <div className="mission-leaderboard glass animate-pop"><span>🏆 Leaderboard</span></div>
                    <div className="mission-card glass">
                        <div className="mc-header">
                            <div className="mc-title">
                                <span className="mc-icon">🎯</span>
                                <span>Active Missions</span>
                            </div>
                            <div className="mc-done">{missions.filter(m => m.current_count >= m.target_count).length}/{missions.length} Done</div>
                        </div>
                        <div className="mission-list">
                            {missions.length > 0 ? (
                                missions.map(m => (
                                    <div key={m.key} className={`mission-item ${m.current_count >= m.target_count ? 'completed' : ''}`}>
                                        <div className="mi-info">
                                            <div className="mi-head">
                                                <span>{language === 'en' ? m.description_en : m.description_th}</span>
                                                <span className="mi-xp">+{m.reward_xp} XP</span>
                                            </div>
                                            {m.current_count < m.target_count ? (
                                                <div className="mi-progress-bar">
                                                    <div className="mi-progress-fill" style={{ width: `${Math.min(100, (m.current_count / m.target_count) * 100)}%` }}></div>
                                                </div>
                                            ) : (
                                                <div className="mi-claimed-status">
                                                    {m.is_claimed ? <span>Claimed ✅</span> : <button className="claim-btn-mini" onClick={() => handleClaimReward(m.key)}>Claim Reward! 🎁</button>}
                                                </div>
                                            )}
                                        </div>
                                        {m.current_count >= m.target_count && m.is_claimed && <div className="mi-check">✓</div>}
                                    </div>
                                ))
                            ) : (
                                <div className="loader-mini">Loading Missions...</div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="hero-stats">
                    <div className="mini-stat"><div className="ms-val">{stats.total_members}</div><div className="ms-lab">Members</div></div>
                    <div className="mini-stat"><div className="ms-val">{stats.online_members}</div><div className="ms-lab">Online</div></div>
                </div>
            </div>

            {/* Plugins Section */}
            <div className="plugins-section">
                <h2>Plugins</h2>
                <div className="plugin-tabs">
                    {tabs.map(tab => (
                        <div key={tab} className={`tab-item ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>{tab}</div>
                    ))}
                </div>
                <div className="plugins-grid">
                    {(() => {
                        const plugins = [
                            {
                                id: "clear",
                                name: "Clear & Reset",
                                icon: "🧹",
                                badge: "ESSENTIAL",
                                badgeClass: "p-badge",
                                category: "Essentials",
                                desc: "Wipe all channels and roles instantly to prepare for clean deployment.",
                                action: () => handleAction("clear"),
                                btnText: "+ Enable"
                            },
                            {
                                id: "welcome",
                                name: "Welcome & Goodbye",
                                icon: "👋",
                                badge: <CrownIcon />,
                                badgeClass: "p-badge-s",
                                category: "Essentials",
                                desc: "Greet new members and say goodbye with style. Fully customizable messages and images.",
                                action: () => router.push(`/servers/${guildId}/welcome`),
                                btnText: "Configure",
                                isActive: true
                            },
                            {
                                id: "setup",
                                name: "Mission Center",
                                icon: "🪄",
                                badge: "ESSENTIAL",
                                badgeClass: "p-badge",
                                category: "Essentials",
                                desc: "Deploy professional server templates (Shop, Community, etc.) with An An 🌸",
                                action: () => handleAction("setup"),
                                btnText: "Do a Mission",
                                isActive: true
                            },
                            {
                                id: "structure",
                                name: "Structure Manager",
                                icon: "🏗️",
                                badge: <CrownIcon />,
                                badgeClass: "p-badge-s",
                                category: "Server Management",
                                desc: "Selectively delete categories or specific channels from your server.",
                                action: () => { fetchStructure(); setShowSelectiveModal(true); },
                                btnText: "+ Configure"
                            },
                            {
                                id: "terminal",
                                name: "anan-terminal",
                                icon: "💻",
                                badge: <CrownIcon />,
                                badgeClass: "p-badge-s",
                                category: "Utilities",
                                desc: "Exclusive command center for Papa and Server Owners only.",
                                action: null,
                                btnText: "Settings",
                                isActive: true
                            },
                            {
                                id: "security",
                                name: "Security Center",
                                icon: "🛡️",
                                badge: <CrownIcon />,
                                badgeClass: "p-badge-s",
                                category: "Security",
                                desc: "Protect your server with instant lockdown and audit log visibility.",
                                action: () => setActiveTab("Security"),
                                btnText: "+ Enable"
                            },
                            {
                                id: "temproom",
                                name: "Temporary Rooms",
                                icon: "🔊",
                                badge: <CrownIcon />,
                                badgeClass: "p-badge-s",
                                category: "Utilities",
                                desc: "Auto-create voice channels for users. Empty rooms delete automatically.",
                                action: () => handleAction("setup_temproom"),
                                btnText: "+ Enable"
                            },
                            {
                                id: "personalizer",
                                name: "Bot Personalizer",
                                icon: "🎭",
                                badge: <CrownIcon />,
                                badgeClass: "p-badge-s",
                                category: "Essentials",
                                desc: "Customize your bot's name, profile, and status for this server.",
                                action: () => router.push(`/servers/${guildId}/personalizer`),
                                btnText: "Configure",
                                isActive: true
                            }
                        ];

                        const filteredPlugins = activeTab === "All Plugins" ? plugins : plugins.filter(p => p.category === activeTab);

                        return filteredPlugins.map((plugin, index) => (
                            <div key={plugin.id} className="plugin-card glass">
                                <div className="pc-header">
                                    <div className="pc-icon">{plugin.icon}</div>
                                    <div className={plugin.badgeClass}>{plugin.badge}</div>
                                </div>
                                <div className="pc-body">
                                    <h3>{plugin.name}</h3>
                                    <p>{plugin.desc}</p>
                                </div>
                                <div className="pc-footer">
                                    <button className={`pc-btn ${plugin.isActive ? 'active' : ''}`} onClick={plugin.action}>{plugin.btnText}</button>
                                </div>
                                <div className="plugin-sitting-icon" style={{ backgroundImage: `url('/assets/levels/LV${(index % 10) + 1}.png')` }}></div>
                            </div>
                        ));
                    })()}
                </div>
            </div>
        </div>
    );
}
