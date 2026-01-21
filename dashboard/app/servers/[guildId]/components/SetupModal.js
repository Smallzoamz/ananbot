"use client";
import React from "react";
import Portal from "../../../components/Portal";
import { ArrowIcon, ProBadge } from "../../../components/Icons";

const SetupModal = ({
    show,
    setupStep,
    setSetupStep,
    templates,
    selectedTemplate,
    setSelectedTemplate,
    setupFlavor,
    setSetupFlavor,
    extraDataInput,
    setExtraDataInput,
    customRoles,
    setCustomRoles,
    customZones,
    setCustomZones,
    isDeploying,
    onDeploy,
    onClose,
    onShowPermissions,
    userPlan,
    onShowProWall
}) => {
    const [activeZoneIndex, setActiveZoneIndex] = React.useState(0);
    // Permission Modal State
    const [showPermModal, setShowPermModal] = React.useState(false);
    const [permModalZoneIdx, setPermModalZoneIdx] = React.useState(null);
    // New Zone Modal State
    const [showNewZoneModal, setShowNewZoneModal] = React.useState(false);
    const [newZoneName, setNewZoneName] = React.useState("");
    const [newZoneRoles, setNewZoneRoles] = React.useState([]);

    if (!show) return null;

    const handleBack = () => {
        if (setupStep === 3) setSetupStep(2);
        else if (setupStep === 2) setSetupStep(1);
        else if (setupStep === 'custom_role' || setupStep === 'custom_zone') setSetupStep(1);
    };

    const handleTemplateClick = (key) => {
        // Allow Pro and Premium plans
        if (key === 'Custom' && userPlan?.plan_type === 'free') {
            onShowProWall("Custom-Designed Template");
            return;
        }
        setSelectedTemplate(key);
        if (key === 'Custom') {
            setSetupStep('custom_role');
        } else {
            setSetupStep(2);
        }
    };

    return (
        <Portal>
            <div className="fixed-overlay z-setup blur-in">
                <div className={`modal-card glass animate-pop ${setupStep === 'custom_role' || setupStep === 'custom_zone' ? 'wide-card' : ''}`}>
                    <button className="modal-close" onClick={onClose}>×</button>

                    <div className="setup-header">
                        {(setupStep !== 1) && <button className="back-btn" onClick={handleBack}>←</button>}
                        <div className="m-title">
                            <h3>{setupStep === 'custom_role' || setupStep === 'custom_zone' ? "Custom Template" : "Template Deployment"}</h3>
                            <p>
                                {setupStep === 1 && "Phase 1 of 3 • Select a Template"}
                                {setupStep === 2 && "Phase 2 of 3 • Choose Type"}
                                {setupStep === 3 && "Phase 3 of 3 • Final Details"}
                                {setupStep === 'custom_role' && "Customize Roles"}
                                {setupStep === 'custom_zone' && "Customize Zones"}
                            </p>
                        </div>
                    </div>

                    {setupStep === 1 && (
                        <div className="setup-grid">
                            {Object.entries(templates).map(([key, t]) => (
                                <div key={key} className="setup-option" onClick={() => handleTemplateClick(key)}>
                                    <div className="so-icon">{t.icon}</div>
                                    <div className="so-info">
                                        <h4>
                                            {t.name}
                                            {key === 'Custom' && (
                                                <ProBadge />
                                            )}
                                        </h4>
                                        <p>{t.desc}</p>
                                    </div>
                                    <div className="so-arrow">→</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {setupStep === 2 && (
                        <div className="setup-grid">
                            {selectedTemplate === "Shop" && (
                                <>
                                    <div className="setup-option" onClick={() => { setSetupFlavor("Full"); onDeploy(); }}>
                                        <div className="so-icon">💎</div>
                                        <div className="so-info">
                                            <h4>Full Pack (จัดเต็ม)</h4>
                                            <p>Nitro + Stream Status + เม็ด Boost</p>
                                        </div>
                                    </div>
                                    <div className="setup-option" onClick={() => { setSetupFlavor("Standard"); onDeploy(); }}>
                                        <div className="so-icon">🛒</div>
                                        <div className="so-info">
                                            <h4>Standard (มาตรฐาน)</h4>
                                            <p>Nitro + Stream Status</p>
                                        </div>
                                    </div>
                                </>
                            )}
                            {selectedTemplate === "Community" && (
                                <>
                                    <div className="setup-option" onClick={() => { setSetupFlavor("Friend"); onDeploy(); }}>
                                        <div className="so-icon">👥</div>
                                        <div className="so-info">
                                            <h4>สายแชททั่วไป (Friend)</h4>
                                            <p>เน้นการพูดคุยและมิตรภาพ</p>
                                        </div>
                                    </div>
                                    <div className="setup-option" onClick={() => { setSetupFlavor("Game"); setSetupStep(3); }}>
                                        <div className="so-icon">🎮</div>
                                        <div className="so-info">
                                            <h4>สายเกมเมอร์ (Game)</h4>
                                            <p>มีห้องเกมแยกตามรายชื่อเกม</p>
                                        </div>
                                    </div>
                                </>
                            )}
                            {selectedTemplate === "Fanclub" && (
                                <div className="setup-option" onClick={() => setSetupStep(3)}>
                                    <div className="so-icon">✨</div>
                                    <div className="so-info">
                                        <h4>Fanclub Setup</h4>
                                        <p>ตั้งค่าช่องทางการติดตามสำหรับแฟนคลับ</p>
                                    </div>
                                    <div className="so-arrow">→</div>
                                </div>
                            )}
                        </div>
                    )}

                    {setupStep === 3 && (
                        <div className="setup-details">
                            <div className="input-group">
                                <label>
                                    {selectedTemplate === "Community" ? "ระบุชื่อเกม (คั่นด้วยเครื่องหมาย ,)" : "ช่องทางการติดตาม (คั่นด้วยเครื่องหมาย ,)"}
                                </label>
                                <textarea
                                    className="m-textarea"
                                    placeholder={selectedTemplate === "Community" ? "เช่น Valorant, Roblox, Minecraft" : "เช่น Facebook, TikTok, YouTube"}
                                    value={extraDataInput || ""}
                                    onChange={(e) => setExtraDataInput(e.target.value)}
                                />
                            </div>
                            <div className="setup-footer">
                                <button className="modal-btn primary-long" onClick={onDeploy} disabled={isDeploying}>
                                    {isDeploying ? "Deploying..." : "Magic Deploy 🪄"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Custom Template Logic */}
                    {setupStep === 'custom_role' && (
                        <div className="setup-flow">
                            <div className="custom-scroll-list">
                                {customRoles.map((role, idx) => (
                                    <div key={idx} className="role-edit-item">
                                        <input
                                            type="color"
                                            value={role.color || "#000000"}
                                            onChange={(e) => {
                                                const newRoles = [...customRoles];
                                                newRoles[idx].color = e.target.value;
                                                setCustomRoles(newRoles);
                                            }}
                                            className="role-color-input"
                                        />
                                        <input
                                            type="text"
                                            value={role.name || ""}
                                            onChange={(e) => {
                                                const newRoles = [...customRoles];
                                                newRoles[idx].name = e.target.value;
                                                setCustomRoles(newRoles);
                                            }}
                                            className="role-name-input"
                                        />
                                        <button className="role-settings-btn" onClick={() => onShowPermissions(idx)}>⚙️</button>
                                        <button className="role-del-btn" onClick={() => setCustomRoles(customRoles.filter((_, i) => i !== idx))}>🗑️</button>
                                    </div>
                                ))}
                                <button className="add-btn" onClick={() => setCustomRoles([...customRoles, { name: "NEW ROLE", color: "#FFFFFF", permissions: "member" }])}>+ Add Role</button>
                            </div>
                            <div className="setup-footer">
                                <button className="modal-btn ghost" onClick={() => setSetupStep('custom_zone')}>Next: Customize Zones</button>
                            </div>
                        </div>
                    )}

                    {setupStep === 'custom_zone' && (
                        <div className="split-view">
                            {/* Left Panel: Zone List */}
                            <div className="zone-list-panel">
                                {customZones.map((zone, idx) => (
                                    <div
                                        key={idx}
                                        className={`zone-item-select ${activeZoneIndex === idx ? 'active' : ''}`}
                                        onClick={() => setActiveZoneIndex(idx)}
                                    >
                                        <div className="zone-item-header">
                                            <div className="zone-item-info">
                                                <input
                                                    type="text"
                                                    className="bare-input"
                                                    value={zone.name || ""}
                                                    placeholder="UNTITLED ZONE"
                                                    onChange={(e) => {
                                                        const newZones = [...customZones];
                                                        newZones[idx].name = e.target.value;
                                                        setCustomZones(newZones);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <p>{zone.channels.length} Channels • {zone.allowedRoles?.length || 0} Roles</p>
                                            </div>
                                            <div className="zone-item-actions">
                                                <button
                                                    className="zone-settings-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPermModalZoneIdx(idx);
                                                        setShowPermModal(true);
                                                    }}
                                                    title="Role Permissions"
                                                >⚙️</button>
                                                <button
                                                    className="mini-del-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newZones = customZones.filter((_, i) => i !== idx);
                                                        setCustomZones(newZones);
                                                        if (activeZoneIndex === idx) setActiveZoneIndex(Math.max(0, idx - 1));
                                                        else if (activeZoneIndex > idx) setActiveZoneIndex(activeZoneIndex - 1);
                                                    }}
                                                >×</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button className="add-btn" onClick={() => {
                                    setNewZoneName("");
                                    setNewZoneRoles([]);
                                    setShowNewZoneModal(true);
                                }}>+ New Zone</button>
                            </div>

                            {/* Right Panel: Active Zone Details */}
                            <div className="zone-detail-panel">
                                {customZones[activeZoneIndex] ? (
                                    <>

                                        <div className="ch-list">
                                            {customZones[activeZoneIndex].channels.map((ch, cidx) => (
                                                <div key={cidx} className="ch-item">
                                                    <div className="ch-item-header">
                                                        <span
                                                            className="ch-type-toggle"
                                                            onClick={() => {
                                                                const newZones = [...customZones];
                                                                newZones[activeZoneIndex].channels[cidx].type = ch.type === 'text' ? 'voice' : 'text';
                                                                setCustomZones(newZones);
                                                            }}
                                                            title="Toggle Text/Voice"
                                                        >
                                                            {ch.type === 'text' ? '#' : '🔊'}
                                                        </span>
                                                        <input
                                                            type="text"
                                                            value={ch.name || ""}
                                                            onChange={(e) => {
                                                                const newZones = [...customZones];
                                                                newZones[activeZoneIndex].channels[cidx].name = e.target.value;
                                                                setCustomZones(newZones);
                                                            }}
                                                        />
                                                        <button
                                                            className="delete-btn"
                                                            onClick={() => {
                                                                const newZones = [...customZones];
                                                                newZones[activeZoneIndex].channels = newZones[activeZoneIndex].channels.filter((_, ci) => ci !== cidx);
                                                                setCustomZones(newZones);
                                                            }}
                                                        >×</button>
                                                    </div>

                                                    <div className="role-toggler-wrap ch-access">
                                                        <span className="access-label">ACCESS:</span>
                                                        {customRoles.map((r, rIdx) => (
                                                            <span
                                                                key={rIdx}
                                                                className={`role-badge mini ${ch.allowedRoles?.includes(r.name) ? 'active' : ''}`}
                                                                style={{
                                                                    borderColor: r.color,
                                                                    color: ch.allowedRoles?.includes(r.name) ? 'white' : r.color,
                                                                    background: ch.allowedRoles?.includes(r.name) ? r.color : 'transparent',
                                                                    fontSize: '9px',
                                                                    padding: '2px 6px'
                                                                }}
                                                                onClick={() => {
                                                                    const newZones = [...customZones];
                                                                    const currentAllowed = newZones[activeZoneIndex].channels[cidx].allowedRoles || [];
                                                                    if (currentAllowed.includes(r.name)) {
                                                                        newZones[activeZoneIndex].channels[cidx].allowedRoles = currentAllowed.filter(n => n !== r.name);
                                                                    } else {
                                                                        newZones[activeZoneIndex].channels[cidx].allowedRoles = [...currentAllowed, r.name];
                                                                    }
                                                                    setCustomZones(newZones);
                                                                }}
                                                            >
                                                                {r.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="add-ch-group">
                                                <button className="add-ch-btn" onClick={() => {
                                                    const newZones = [...customZones];
                                                    newZones[activeZoneIndex].channels.push({ name: "new-text", type: "text", allowedRoles: [] });
                                                    setCustomZones(newZones);
                                                }}>+ Add Text</button>
                                                <button className="add-ch-btn" onClick={() => {
                                                    const newZones = [...customZones];
                                                    newZones[activeZoneIndex].channels.push({ name: "NEW VOICE", type: "voice", allowedRoles: [] });
                                                    setCustomZones(newZones);
                                                }}>+ Add Voice</button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="empty-state">
                                        <span>👈</span>
                                        <p>Select a Zone to edit</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="setup-footer" style={{ marginTop: '20px' }}>
                        <button className="modal-btn primary-long" onClick={onDeploy} disabled={isDeploying}>
                            {isDeploying ? "Deploying..." : "Finalize & Deploy 🚀"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Permission Modal */}
            {showPermModal && permModalZoneIdx !== null && (
                <div className="sub-modal-overlay" onClick={() => setShowPermModal(false)}>
                    <div className="sub-modal perm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sub-modal-header">
                            <h4>🔐 Role Permissions</h4>
                            <p>Select roles that can access "{customZones[permModalZoneIdx]?.name}"</p>
                        </div>
                        <div className="perm-role-list">
                            {customRoles.map((r, rIdx) => {
                                const isSelected = customZones[permModalZoneIdx]?.allowedRoles?.includes(r.name);
                                return (
                                    <div
                                        key={rIdx}
                                        className={`perm-role-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => {
                                            const newZones = [...customZones];
                                            const currentAllowed = newZones[permModalZoneIdx].allowedRoles || [];
                                            if (currentAllowed.includes(r.name)) {
                                                newZones[permModalZoneIdx].allowedRoles = currentAllowed.filter(n => n !== r.name);
                                            } else {
                                                newZones[permModalZoneIdx].allowedRoles = [...currentAllowed, r.name];
                                            }
                                            setCustomZones(newZones);
                                        }}
                                    >
                                        <span className="perm-role-color" style={{ background: r.color }}></span>
                                        <span className="perm-role-name">{r.name}</span>
                                        <span className="perm-role-check">{isSelected ? '✓' : ''}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <button className="sub-modal-btn" onClick={() => setShowPermModal(false)}>Done ✨</button>
                    </div>
                </div>
            )}

            {/* New Zone Modal */}
            {showNewZoneModal && (
                <div className="sub-modal-overlay" onClick={() => setShowNewZoneModal(false)}>
                    <div className="sub-modal new-zone-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sub-modal-header">
                            <h4>✨ Create New Zone</h4>
                            <p>Enter zone name and select roles</p>
                        </div>
                        <div className="new-zone-form">
                            <label>Zone Name</label>
                            <input
                                type="text"
                                className="new-zone-input"
                                placeholder="e.g. VIP LOUNGE"
                                value={newZoneName}
                                onChange={(e) => setNewZoneName(e.target.value)}
                                autoFocus
                            />
                            <label>Allowed Roles</label>
                            <div className="perm-role-list compact">
                                {customRoles.map((r, rIdx) => {
                                    const isSelected = newZoneRoles.includes(r.name);
                                    return (
                                        <div
                                            key={rIdx}
                                            className={`perm-role-item ${isSelected ? 'selected' : ''}`}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setNewZoneRoles(newZoneRoles.filter(n => n !== r.name));
                                                } else {
                                                    setNewZoneRoles([...newZoneRoles, r.name]);
                                                }
                                            }}
                                        >
                                            <span className="perm-role-color" style={{ background: r.color }}></span>
                                            <span className="perm-role-name">{r.name}</span>
                                            <span className="perm-role-check">{isSelected ? '✓' : ''}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="sub-modal-actions">
                            <button className="sub-modal-btn cancel" onClick={() => setShowNewZoneModal(false)}>Cancel</button>
                            <button className="sub-modal-btn primary" onClick={() => {
                                const newZones = [...customZones, {
                                    name: newZoneName || "NEW ZONE",
                                    channels: [],
                                    allowedRoles: newZoneRoles
                                }];
                                setCustomZones(newZones);
                                setActiveZoneIndex(newZones.length - 1);
                                setShowNewZoneModal(false);
                            }}>Create Zone 🚀</button>
                        </div>
                    </div>
                </div>
            )}
        </Portal>
    );
};

export default SetupModal;
