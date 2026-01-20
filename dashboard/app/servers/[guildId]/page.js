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
        <>
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

            <style jsx>{`
                .hero-banner { 
                    position: relative; 
                    background: linear-gradient(135deg, #ffb7e2 0%, #d6cfff 100%); 
                    border-radius: 32px; 
                    padding: 60px; 
                    color: white; 
                    overflow: hidden; 
                    display: flex; 
                    align-items: center; 
                    justify-content: space-between;
                    margin-bottom: 40px;
                    box-shadow: 0 20px 40px rgba(255, 183, 226, 0.2);
                }
                .hero-bg-anime { position: absolute; inset: 0; pointer-events: none; }
                .hero-bg-icon { 
                    position: absolute; 
                    width: 40px; height: 40px; 
                    background-size: contain; 
                    background-repeat: no-repeat; 
                    opacity: 0.15;
                    animation: float-slow 10s infinite ease-in-out;
                }
                .lvl-1 { top: 10%; left: 5%; animation-delay: 0s; }
                .lvl-2 { top: 30%; right: 10%; animation-delay: 1s; }
                .lvl-3 { bottom: 20%; left: 15%; animation-delay: 2s; }
                .lvl-4 { top: 50%; left: 2%; animation-delay: 3s; }
                .lvl-5 { bottom: 10%; right: 5%; animation-delay: 4s; }
                .lvl-6 { top: 5%; right: 40%; animation-delay: 5s; }
                .lvl-7 { bottom: 50%; right: 15%; animation-delay: 6s; }
                .lvl-8 { top: 40%; left: 40%; animation-delay: 7s; }
                .lvl-9 { bottom: 5%; left: 50%; animation-delay: 8s; }
                .lvl-10 { top: 60%; right: 30%; animation-delay: 9s; }

                @keyframes float-slow {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    50% { transform: translate(20px, -20px) rotate(10deg); }
                }

                .hero-text { position: relative; z-index: 2; max-width: 500px; }
                .hero-text h1 { font-size: 42px; font-weight: 900; line-height: 1.2; margin-bottom: 20px; }
                .hero-text h1 span { color: #fff; text-shadow: 0 0 20px rgba(255,255,255,0.5); }
                .hero-buttons { display: flex; gap: 15px; }
                .hero-btn { 
                    padding: 14px 28px; 
                    border-radius: 16px; 
                    font-weight: 800; 
                    font-size: 16px; 
                    cursor: pointer; 
                    transition: 0.3s; 
                    border: none;
                }
                .hero-btn.primary { background: white; color: #ff85c1; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
                .hero-btn.secondary { background: rgba(255,255,255,0.2); color: white; border: 1.5px solid rgba(255,255,255,0.3); backdrop-filter: blur(10px); }
                .hero-btn:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.15); }

                .mission-card-wrapper { position: relative; z-index: 3; perspective: 1000px; }
                .mission-card {
                    width: 320px;
                    background: rgba(255, 255, 255, 0.45);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 28px;
                    padding: 24px;
                    box-shadow: 0 25px 50px rgba(0,0,0,0.1);
                    transform: rotateY(-15deg) rotateX(10deg);
                    transition: 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .mission-card-wrapper:hover .mission-card { transform: rotateY(0) rotateX(0) scale(1.02); }
                .mission-leaderboard {
                    position: absolute;
                    top: -20px;
                    right: -20px;
                    background: white;
                    padding: 8px 16px;
                    border-radius: 12px;
                    font-weight: 800;
                    font-size: 12px;
                    color: #4a4a68;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                    z-index: 4;
                }

                .mc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .mc-title { display: flex; align-items: center; gap: 10px; font-weight: 800; color: #4a4a68; }
                .mc-done { font-size: 12px; font-weight: 700; color: #ff85c1; background: rgba(255,133,193,0.1); padding: 4px 10px; border-radius: 20px; }
                
                .mission-list { display: flex; flex-direction: column; gap: 12px; }
                .mission-item { background: rgba(255,255,255,0.5); padding: 12px; border-radius: 16px; display: flex; align-items: center; gap: 12px; transition: 0.3s; }
                .mission-item.completed { background: rgba(74, 222, 128, 0.1); }
                .mi-info { flex: 1; }
                .mi-head { display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; color: #4a4a68; margin-bottom: 6px; }
                .mi-xp { color: #ff85c1; }
                .mi-progress-bar { height: 6px; background: rgba(0,0,0,0.05); border-radius: 10px; overflow: hidden; }
                .mi-progress-fill { height: 100%; background: linear-gradient(90deg, #ffb7e2, #ff85c1); border-radius: 10px; transition: 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
                .claim-btn-mini { background: #ff85c1; color: white; border: none; padding: 4px 12px; border-radius: 10px; font-size: 10px; font-weight: 800; cursor: pointer; }

                .plugins-section { margin-top: 40px; }
                .plugins-section h2 { font-size: 24px; font-weight: 900; color: #4a4a68; margin-bottom: 25px; }
                .plugin-tabs { display: flex; gap: 10px; margin-bottom: 30px; overflow-x: auto; padding-bottom: 10px; }
                .tab-item { 
                    padding: 10px 20px; 
                    background: white; 
                    border-radius: 14px; 
                    font-weight: 800; 
                    font-size: 14px; 
                    color: #9ca3af; 
                    cursor: pointer; 
                    transition: 0.3s; 
                    white-space: nowrap;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.02);
                }
                .tab-item:hover { color: #4a4a68; transform: translateY(-2px); }
                .tab-item.active { background: #ff85c1; color: white; box-shadow: 0 8px 20px rgba(255,133,193,0.3); }

                .plugins-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; }
                .plugin-card { 
                    padding: 30px; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 15px; 
                    position: relative; 
                    transition: 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); 
                }
                .plugin-card:hover { transform: translateY(-10px); }
                .pc-header { display: flex; justify-content: space-between; align-items: flex-start; }
                .pc-icon { font-size: 32px; background: white; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 18px; box-shadow: 0 8px 16px rgba(0,0,0,0.03); }
                .p-badge { font-size: 9px; font-weight: 900; background: #ff85c1; color: white; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.05em; }
                .p-badge-s { background: #ffd700; color: #8a6d3b; font-size: 10px; padding: 4px; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(255,215,0,0.3); }
                
                .pc-body h3 { font-size: 18px; font-weight: 850; color: #4a4a68; margin-bottom: 8px; }
                .pc-body p { font-size: 13px; color: #6b7280; line-height: 1.5; }
                
                .pc-btn { 
                    width: 100%; 
                    padding: 12px; 
                    background: white; 
                    border: 2px solid #f3f4f6; 
                    border-radius: 14px; 
                    font-weight: 800; 
                    color: #4a4a68; 
                    cursor: pointer; 
                    transition: 0.3s;
                }
                .pc-btn:hover { border-color: #ff85c1; color: #ff85c1; background: #fff1f8; }
                .pc-btn.active { background: #ff85c1; color: white; border-color: #ff85c1; box-shadow: 0 8px 16px rgba(255,133,193,0.3); }

                .plugin-sitting-icon { 
                    position: absolute; 
                    bottom: -15px; 
                    right: -10px; 
                    width: 50px; 
                    height: 50px; 
                    background-size: contain; 
                    background-repeat: no-repeat; 
                    transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
                    z-index: 10;
                    pointer-events: none;
                }
                .plugin-card:hover .plugin-sitting-icon { transform: translateY(-10px) rotate(5deg) scale(1.1); }

                /* Modals */
                .modal-overlay { position: fixed; inset: 0; background: rgba(255,255,255,0.4); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; padding: 20px; }
                .modal-card { width: 100%; max-width: 500px; padding: 40px; border-radius: 32px; position: relative; }
                .modal-card.wide-card { max-width: 900px; padding: 0; display: flex; flex-direction: column; height: 80vh; overflow: hidden; }
                
                .modal-header { margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
                .modal-header h2 { font-size: 24px; font-weight: 900; color: #4a4a68; margin-bottom: 5px; }
                .modal-header p { color: #6b7280; font-size: 14px; font-weight: 600; }
                .modal-close { background: none; border: none; font-size: 28px; color: #9ca3af; cursor: pointer; transition: 0.3s; }
                .modal-close:hover { color: #ff85c1; transform: rotate(90deg); }

                .modal-btn { padding: 14px 28px; border-radius: 16px; font-weight: 800; cursor: pointer; transition: 0.3s; border: none; }
                .modal-btn.primary { background: #ff85c1; color: white; box-shadow: 0 8px 20px rgba(255,133,193,0.3); }
                .modal-btn.secondary { background: #f3f4f6; color: #4a4a68; }
                .modal-btn.primary-danger { background: #ff4d4f; color: white; box-shadow: 0 8px 20px rgba(255,77,79,0.3); }
                .modal-btn.ghost { background: none; color: #9ca3af; }
                .modal-btn:hover { transform: translateY(-3px); filter: brightness(1.1); }
                .modal-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

                /* Setup Options */
                .setup-grid { display: grid; gap: 15px; }
                .setup-option { 
                    display: flex; 
                    align-items: center; 
                    gap: 20px; 
                    padding: 20px; 
                    background: white; 
                    border-radius: 20px; 
                    cursor: pointer; 
                    transition: 0.3s; 
                    border: 2px solid transparent; 
                    box-shadow: 0 4px 10px rgba(0,0,0,0.02);
                }
                .setup-option:hover { transform: translateX(10px); border-color: #ff85c1; }
                .so-icon { font-size: 28px; width: 50px; height: 50px; background: #fdf2f8; display: flex; align-items: center; justify-content: center; border-radius: 14px; }
                .so-info h4 { font-weight: 800; color: #4a4a68; margin-bottom: 2px; }
                .so-info p { font-size: 13px; color: #6b7280; }
                .so-arrow { margin-left: auto; color: #ff85c1; font-weight: 900; }

                /* Pricing Modal */
                .pricing-modal { width: 100%; max-width: 900px; padding: 50px; border-radius: 40px; text-align: center; }
                .pricing-header h2 span { color: #ff85c1; }
                .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; margin: 40px 0; }
                .pricing-card { background: white; border-radius: 28px; padding: 35px; display: flex; flex-direction: column; gap: 20px; border: 1px solid rgba(0,0,0,0.05); }
                .pricing-card.featured { border-color: #ff85c1; transform: scale(1.05); box-shadow: 0 20px 40px rgba(255,133,193,0.15); z-index: 2; position: relative; }
                .p-badge-promo { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: #ff85c1; color: white; padding: 6px 15px; border-radius: 20px; font-weight: 900; font-size: 10px; }
                .p-tier { font-weight: 900; color: #9ca3af; letter-spacing: 0.1em; }
                .p-price { font-size: 32px; font-weight: 900; color: #4a4a68; }
                .p-price span { font-size: 14px; font-weight: 700; color: #9ca3af; }
                .p-features { list-style: none; display: flex; flex-direction: column; gap: 12px; font-size: 13px; font-weight: 600; text-align: left; }
                .p-btn { width: 100%; padding: 14px; border-radius: 14px; font-weight: 800; border: none; cursor: pointer; transition: 0.3s; }
                .p-btn.pro { background: #d6cfff; color: #5b21b6; }
                .p-btn.premium { background: #ff85c1; color: white; }
                .p-btn:hover { transform: scale(1.05); }

                /* Structure Manager (Discord Style) */
                .selective-header { padding: 30px; display: flex; align-items: center; gap: 20px; background: rgba(255,255,255,0.3); border-bottom: 1px solid rgba(0,0,0,0.05); }
                .selective-body { flex: 1; overflow-y: auto; padding: 20px; background: rgba(255,255,255,0.1); }
                .discord-cat-section { margin-bottom: 25px; }
                .discord-cat-header { display: flex; align-items: center; gap: 10px; padding: 10px; cursor: pointer; transition: 0.2s; border-radius: 8px; }
                .discord-cat-header:hover { background: rgba(0,0,0,0.03); }
                .cat-arrow { font-size: 10px; color: #6b7280; width: 15px; }
                .cat-name { font-weight: 800; font-size: 12px; color: #6b7280; flex: 1; }
                .cat-count { font-size: 10px; background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 10px; color: #9ca3af; }
                .discord-ch-list { padding-left: 15px; margin-top: 5px; }
                .discord-ch-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: 0.2s; }
                .discord-ch-item:hover { background: rgba(255,133,193,0.05); color: #ff85c1; }
                .discord-ch-item.selected { background: rgba(255,133,193,0.1); color: #ff85c1; }
                .ch-icon { font-size: 16px; color: #9ca3af; width: 20px; text-align: center; }
                .selected .ch-icon { color: #ff85c1; }
                .ch-checkbox-wrap { display: flex; align-items: center; }
                .m-checkbox { width: 18px; height: 18px; cursor: pointer; accent-color: #ff85c1; }
                .modal-footer { padding: 25px 40px; background: white; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(0,0,0,0.05); }

                /* Custom Editor Styles */
                .custom-list { display: flex; flex-direction: column; gap: 10px; }
                .custom-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 12px; }
                .role-color-picker { width: 30px; height: 30px; border: none; border-radius: 50%; cursor: pointer; appearance: none; background: none; }
                .role-color-picker::-webkit-color-swatch { border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.1); }
                .mini-input { flex: 1; background: white; border: 1.5px solid #f3f4f6; padding: 8px 12px; border-radius: 8px; font-weight: 700; font-size: 13px; }
                .mini-select { background: white; border: 1.5px solid #f3f4f6; padding: 8px; border-radius: 8px; font-weight: 700; font-size: 13px; }
                .mini-perm-btn { background: #f3f4f6; border: none; width: 35px; height: 35px; border-radius: 8px; cursor: pointer; }
                .mini-perm-btn.active { background: #ff85c1; color: white; }
                
                .custom-split { display: grid; grid-template-columns: 240px 1fr; gap: 30px; height: 400px; }
                .split-left { overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 10px; }
                .zone-tab { padding: 15px; border-radius: 14px; background: rgba(255,255,255,0.5); border: 1.5px solid transparent; cursor: pointer; transition: 0.3s; }
                .zone-tab.active { background: white; border-color: #ff85c1; box-shadow: 0 10px 20px rgba(255,133,193,0.1); }
                .zone-tab-main { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
                .zone-tab-main input { width: 80%; border: none; background: none; font-weight: 900; font-size: 14px; color: #4a4a68; outline: none; }
                .zone-access { display: flex; align-items: center; }
                .access-tags { display: flex; flex-wrap: wrap; gap: 4px; }
                .access-tag.mini { width: 20px; height: 20px; border-radius: 4px; background: #f3f4f6; color: #9ca3af; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; cursor: pointer; }
                .access-tag.mini.active { background: #ff85c1; color: white; }

                .chan-list { background: rgba(255,255,255,0.3); border-radius: 16px; padding: 15px; height: 320px; overflow-y: auto; }
                .chan-row { margin-bottom: 10px; }
                .chan-item-main { display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 10px; }
                .chan-item-main input { flex: 1; border: none; background: none; font-weight: 700; font-size: 13px; color: #4a4a68; outline: none; }
                .ch-type-icon { color: #9ca3af; font-size: 16px; width: 20px; }
                .chan-adds { display: flex; gap: 10px; margin-top: 20px; }
                .chan-adds button { flex: 1; padding: 10px; background: white; border: 1.5px dashed #ff85c1; color: #ff85c1; border-radius: 10px; font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.3s; }
                .chan-adds button:hover { background: #ff85c1; color: white; border-style: solid; }

                .access-tag.mini-dot { width: 14px; height: 14px; border-radius: 50%; background: #f3f4f6; color: transparent; font-size: 0; cursor: pointer; }
                .access-tag.mini-dot.active { background: #ff85c1; border: 2px solid white; box-shadow: 0 0 5px rgba(255,133,193,0.5); }
                .dot-preview { width: 30px; height: 30px; border-radius: 50%; background: #f3f4f6; color: #9ca3af; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; }
                .dot-preview.active { background: #ff85c1; color: white; }

                @keyframes pop { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .animate-pop { animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                .animate-pop-slow { animation: pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                
                @keyframes blur-in { from { backdrop-filter: blur(0); background: rgba(255,255,255,0); } to { backdrop-filter: blur(12px); background: rgba(255,255,255,0.4); } }
                .blur-in { animation: blur-in 0.4s forwards; }

                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
                .animate-float { animation: float 5s ease-in-out infinite; }
            `}</style>
        </>
    );
}
