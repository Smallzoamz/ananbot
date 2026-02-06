"use client";
import React from "react";
import Portal from "../../../components/Portal";
import { ArrowIcon, ProBadge } from "../../../components/Icons";

// ============================================
// PATTERN LIBRARY (Synced with templates.py)
// ============================================
const PATTERNS = {
    classic: { name: "Classic An An", example: "｜・📢：ประกาศ" },
    ribbon: { name: "Ribbon Cute 🎀", example: "🎀 ┊ 📢 · ประกาศ" },
    minimal: { name: "Minimal Elegant ✦", example: "· 📢 ⸝ ประกาศ" },
    star: { name: "Starlight ★", example: "✦ ┊ 📢 : ประกาศ" },
    heart: { name: "Heart Pastel ♡", example: "♡ · 📢 ─ ประกาศ" },
    arrow: { name: "Arrow Modern →", example: "├ : → 📢 ประกาศ" }
};

const EMOJI_THEMES = {
    kawaii: { name: "Kawaii Cute 🎀", emojis: "🎀 🌸 🍰 🧸 💕 ✨" },
    elegant: { name: "Minimal Elegant ✦", emojis: "✦ ◇ ◈ ⊹ ⁺ ⋆" },
    nature: { name: "Nature Pastel 🌿", emojis: "🌿 🍃 🌻 🌼 🌺 ☁️" },
    gaming: { name: "Gaming Cool 🎮", emojis: "🎮 ⚔️ 🔥 💎 🏆 ⭐" },
    food: { name: "Food & Sweets 🍮", emojis: "🍮 🍡 🍎 🧁 🍪 ☕" }
};

const ROLE_LAYOUTS = {
    classic: { name: "Classic Badge", example: "👑 Owner" },
    numbered: { name: "Numbered Rank @", example: "@1 ⁺ ☆ : Owner ∶ 👑" },
    bracket: { name: "Bracket Style 【】", example: "【👑】Owner" },
    heart: { name: "Heart Cute ♡", example: "♡ ⊱ Owner · 👑" },
    arrow: { name: "Arrow Modern →", example: "◦ Owner › 👑" },
    symbol: { name: "Symbol Minimal ⫻", example: "👑 ⫻ Owner" }
};

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
    onShowProWall,
    // New Pattern Library props (will be added to parent)
    patternSettings,
    setPatternSettings
}) => {
    const [activeZoneIndex, setActiveZoneIndex] = React.useState(0);
    const [activeTab, setActiveTab] = React.useState('roles'); // 'roles' or 'zones'

    // Pattern Library State (local fallback if props not provided)
    const [localPatternSettings, setLocalPatternSettings] = React.useState({
        language: "th",
        pattern_id: "classic",
        emoji_theme: "kawaii",
        role_layout_id: "classic"
    });

    // Use props if provided, otherwise use local state
    const currentSettings = patternSettings || localPatternSettings;
    const updateSettings = setPatternSettings || setLocalPatternSettings;

    // Permission Modal State
    const [showPermModal, setShowPermModal] = React.useState(false);
    const [permModalZoneIdx, setPermModalZoneIdx] = React.useState(null);
    // New Zone Modal State
    const [showNewZoneModal, setShowNewZoneModal] = React.useState(false);
    const [newZoneName, setNewZoneName] = React.useState("");
    const [newZoneRoles, setNewZoneRoles] = React.useState([]);
    const [roleSearch, setRoleSearch] = React.useState("");

    if (!show) return null;

    const filteredRoles = customRoles.filter(r =>
        r.name.toLowerCase().includes(roleSearch.toLowerCase())
    );

    const isCustomMode = setupStep === 'custom_role' || setupStep === 'custom_zone';

    const handleBack = () => {
        if (setupStep === 3) setSetupStep(2);
        else if (setupStep === 2) setSetupStep(1);
        else if (setupStep === 1) setSetupStep(0); // Back to Style Selection
        else if (isCustomMode) setSetupStep(1);
    };

    const handleStyleConfirm = () => {
        setSetupStep(1); // Proceed to Template Selection
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
            setActiveTab('roles');
        } else {
            setSetupStep(2);
        }
    };

    return (
        <Portal>
            <div className="fixed-overlay z-setup blur-in">
                <div className={`modal-card glass animate-pop ${isCustomMode ? 'wide-card' : ''}`}>
                    <button className="modal-close" onClick={onClose}>×</button>

                    <div className="setup-header">
                        {(setupStep !== 0) && <button className="back-btn" onClick={handleBack}>←</button>}
                        <div className="m-title">
                            <h3>{isCustomMode ? "Custom Template Builder" : "Template Deployment"}</h3>
                            <p>
                                {setupStep === 0 && "Phase 1 of 4 • Choose Style & Language"}
                                {setupStep === 1 && "Phase 2 of 4 • Select a Template"}
                                {setupStep === 2 && "Phase 3 of 4 • Choose Type"}
                                {setupStep === 3 && "Phase 4 of 4 • Final Details"}
                                {isCustomMode && "Design your own server structure with An An's magic 🪄"}
                            </p>
                        </div>
                    </div>

                    {/* ============================================ */}
                    {/* STEP 0: Style & Language Selection */}
                    {/* ============================================ */}
                    {setupStep === 0 && (
                        <div className="setup-style-section">
                            {/* Language Selection */}
                            <div className="style-group">
                                <label className="style-label">🌐 Language / ภาษา</label>
                                <div className="style-options">
                                    <button
                                        className={`style-option ${currentSettings.language === 'th' ? 'active' : ''}`}
                                        onClick={() => updateSettings({ ...currentSettings, language: 'th' })}
                                    >
                                        <span className="style-icon">🇹🇭</span>
                                        <span className="style-name">ไทย</span>
                                    </button>
                                    <button
                                        className={`style-option ${currentSettings.language === 'en' ? 'active' : ''}`}
                                        onClick={() => updateSettings({ ...currentSettings, language: 'en' })}
                                    >
                                        <span className="style-icon">🇺🇸</span>
                                        <span className="style-name">English</span>
                                    </button>
                                </div>
                            </div>

                            {/* Pattern Selection */}
                            <div className="style-group">
                                <label className="style-label">✨ Channel Pattern</label>
                                <div className="style-grid">
                                    {Object.entries(PATTERNS).map(([key, p]) => (
                                        <button
                                            key={key}
                                            className={`style-card ${currentSettings.pattern_id === key ? 'active' : ''}`}
                                            onClick={() => updateSettings({ ...currentSettings, pattern_id: key })}
                                        >
                                            <span className="style-name">{p.name}</span>
                                            <span className="style-example">{p.example}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Emoji Theme Selection */}
                            <div className="style-group">
                                <label className="style-label">🎨 Emoji Theme</label>
                                <div className="style-grid small">
                                    {Object.entries(EMOJI_THEMES).map(([key, t]) => (
                                        <button
                                            key={key}
                                            className={`style-card ${currentSettings.emoji_theme === key ? 'active' : ''}`}
                                            onClick={() => updateSettings({ ...currentSettings, emoji_theme: key })}
                                        >
                                            <span className="style-name">{t.name}</span>
                                            <span className="style-emojis">{t.emojis}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Role Layout Selection */}
                            <div className="style-group">
                                <label className="style-label">👑 Role Layout</label>
                                <div className="style-grid">
                                    {Object.entries(ROLE_LAYOUTS).map(([key, r]) => (
                                        <button
                                            key={key}
                                            className={`style-card ${currentSettings.role_layout_id === key ? 'active' : ''}`}
                                            onClick={() => updateSettings({ ...currentSettings, role_layout_id: key })}
                                        >
                                            <span className="style-name">{r.name}</span>
                                            <span className="style-example">{r.example}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button className="modal-btn primary-long" onClick={handleStyleConfirm}>
                                Continue → Select Template 🚀
                            </button>
                        </div>
                    )}

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

                    {/* Shadcn-style Custom Template Builder */}
                    {isCustomMode && (
                        <div className="sn-tabs">
                            <div className="sn-tabs-list">
                                <button
                                    className={`sn-tabs-trigger ${activeTab === 'roles' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('roles')}
                                >
                                    🛡️ Manage Roles
                                </button>
                                <button
                                    className={`sn-tabs-trigger ${activeTab === 'zones' ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTab('zones');
                                        setSetupStep('custom_zone');
                                    }}
                                >
                                    📂 Manage Zones
                                </button>
                            </div>

                            {activeTab === 'roles' ? (
                                <div className="setup-flow">
                                    {customRoles.length > 5 && (
                                        <div className="sn-search-wrapper" style={{ maxWidth: '300px' }}>
                                            <span className="sn-search-icon">🔍</span>
                                            <input
                                                type="text"
                                                className="sn-search-input"
                                                placeholder="Search roles..."
                                                value={roleSearch}
                                                onChange={(e) => setRoleSearch(e.target.value)}
                                            />
                                        </div>
                                    )}
                                    <div className="custom-scroll-list sn-role-scroll" style={{ maxHeight: '400px' }}>
                                        {filteredRoles.map((role, idx) => (
                                            <div key={idx} className="sn-card" style={{ marginBottom: '8px' }}>
                                                <div className="sn-card-content" style={{ gap: '12px', padding: '10px' }}>
                                                    <input
                                                        type="color"
                                                        value={role.color || "#000000"}
                                                        onChange={(e) => {
                                                            const newRoles = [...customRoles];
                                                            const roleIdx = customRoles.indexOf(role);
                                                            newRoles[roleIdx].color = e.target.value;
                                                            setCustomRoles(newRoles);
                                                        }}
                                                        style={{ width: '32px', height: '32px', borderRadius: '4px', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                                                    />
                                                    <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                                                        <input
                                                            type="text"
                                                            value={role.name || ""}
                                                            onChange={(e) => {
                                                                const newRoles = [...customRoles];
                                                                const roleIdx = customRoles.indexOf(role);
                                                                newRoles[roleIdx].name = e.target.value;
                                                                setCustomRoles(newRoles);
                                                            }}
                                                            className="bare-input"
                                                            placeholder="Role Name"
                                                            style={{ width: '100%', fontSize: '14px', fontWeight: '600', paddingRight: '40px' }}
                                                        />

                                                        {/* Shield Icon Toggle (Inside Input) */}
                                                        <button
                                                            className={`sn-shield-btn ${role.isVerified ? 'verified' : ''}`}
                                                            style={{
                                                                position: 'absolute',
                                                                right: '5px',
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                fontSize: '18px',
                                                                opacity: role.isVerified ? 1 : 0.3,
                                                                transition: 'all 0.2s',
                                                                zIndex: 5
                                                            }}
                                                            onClick={() => {
                                                                const newRoles = customRoles.map((r, idx) => ({
                                                                    ...r,
                                                                    isVerified: idx === customRoles.indexOf(role) ? !r.isVerified : false
                                                                }));
                                                                setCustomRoles(newRoles);
                                                            }}
                                                            title={role.isVerified ? "Verified Role Active" : "Click to set as Verification Role"}
                                                        >
                                                            🛡️
                                                        </button>
                                                    </div>

                                                    {/* Mascot Tip Removed (Moved to Footer) */}

                                                    <button className="sn-button-ghost" style={{ flexShrink: 0 }} onClick={() => onShowPermissions(customRoles.indexOf(role))} title="Permissions">⚙️</button>
                                                    <button className="sn-button-ghost" style={{ flexShrink: 0 }} onClick={() => setCustomRoles(customRoles.filter(r => r !== role))} title="Delete">🗑️</button>
                                                </div>
                                            </div>
                                        ))}
                                        <button className="sn-button-outline" style={{ width: '100%', marginTop: '10px', borderStyle: 'dashed' }} onClick={() => setCustomRoles([...customRoles, { name: "NEW ROLE", color: "#FFFFFF", permissions: "member" }])}>
                                            + Add New Role
                                        </button>
                                    </div>
                                </div>
                            ) : (
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
                                                            className="sn-button-ghost"
                                                            style={{ padding: '4px' }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPermModalZoneIdx(idx);
                                                                setShowPermModal(true);
                                                            }}
                                                        >⚙️</button>
                                                        <button
                                                            className="sn-button-ghost"
                                                            style={{ padding: '4px', color: '#ef4444' }}
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
                                        <button className="sn-button-outline" style={{ marginTop: '10px', borderStyle: 'dashed' }} onClick={() => {
                                            setNewZoneName("");
                                            setNewZoneRoles([]);
                                            setShowNewZoneModal(true);
                                        }}>+ New Zone</button>
                                    </div>

                                    {/* Right Panel: Active Zone Details */}
                                    <div className="zone-detail-panel" style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px' }}>
                                        {customZones[activeZoneIndex] ? (
                                            <div className="ch-list" style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '5px' }}>
                                                {customZones[activeZoneIndex].channels.map((ch, cidx) => (
                                                    <div key={cidx} className="sn-card">
                                                        <div className="sn-card-header">
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                                <span
                                                                    className="sn-button-ghost"
                                                                    style={{ width: '28px', height: '28px', background: '#f1f5f9' }}
                                                                    onClick={() => {
                                                                        const newZones = [...customZones];
                                                                        newZones[activeZoneIndex].channels[cidx].type = ch.type === 'text' ? 'voice' : 'text';
                                                                        setCustomZones(newZones);
                                                                    }}
                                                                >
                                                                    {ch.type === 'text' ? '#' : '🔊'}
                                                                </span>
                                                                <input
                                                                    type="text"
                                                                    className="bare-input"
                                                                    style={{ fontWeight: '600', fontSize: '14px' }}
                                                                    value={ch.name || ""}
                                                                    onChange={(e) => {
                                                                        const newZones = [...customZones];
                                                                        newZones[activeZoneIndex].channels[cidx].name = e.target.value;
                                                                        setCustomZones(newZones);
                                                                    }}
                                                                />
                                                            </div>
                                                            <button
                                                                className="sn-button-ghost"
                                                                style={{ color: '#ef4444' }}
                                                                onClick={() => {
                                                                    const newZones = [...customZones];
                                                                    newZones[activeZoneIndex].channels = newZones[activeZoneIndex].channels.filter((_, ci) => ci !== cidx);
                                                                    setCustomZones(newZones);
                                                                }}
                                                            >×</button>
                                                        </div>
                                                        <div className="sn-card-content" style={{ gap: '12px', padding: '16px' }}>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', width: '100%' }}>
                                                                <span style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', marginRight: '4px' }}>ACCESS:</span>
                                                                {customRoles.map((r, rIdx) => {
                                                                    const isActive = ch.allowedRoles?.includes(r.name);
                                                                    return (
                                                                        <span
                                                                            key={rIdx}
                                                                            className={`sn-badge ${isActive ? 'sn-badge-pink' : 'sn-badge-outline'}`}
                                                                            style={{
                                                                                cursor: 'pointer',
                                                                                borderColor: isActive ? r.color : '#e2e8f0',
                                                                                color: isActive ? (r.color === '#FFFFFF' ? '#ec4899' : r.color) : '#64748b',
                                                                                backgroundColor: isActive ? `${r.color}15` : 'transparent',
                                                                                marginBottom: '2px'
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
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="add-ch-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                                    <button className="sn-button-outline" onClick={() => {
                                                        const newZones = [...customZones];
                                                        newZones[activeZoneIndex].channels.push({ name: "new-text", type: "text", allowedRoles: [] });
                                                        setCustomZones(newZones);
                                                    }}>+ Add Text</button>
                                                    <button className="sn-button-outline" onClick={() => {
                                                        const newZones = [...customZones];
                                                        newZones[activeZoneIndex].channels.push({ name: "NEW VOICE", type: "voice", allowedRoles: [] });
                                                        setCustomZones(newZones);
                                                    }}>+ Add Voice</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="empty-state">
                                                <span>👈</span>
                                                <p>Select a Zone to edit</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="setup-footer" style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>

                        {/* Mascot Tip (Dynamic) 🌸 */}
                        {isCustomMode && (
                            <div className="mascot-footer-tip animate-pop" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fff0f5', padding: '10px 16px', borderRadius: '12px', border: '1px dashed #f9a8d4' }}>
                                <img
                                    src={customRoles.some(r => r.isVerified) ? "/images/anan_kimono_2.png" : "/images/anan_kimono_1.jpg"}
                                    alt="An An"
                                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #ec4899' }}
                                />
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '13px', color: '#831843', fontWeight: 'bold', margin: 0 }}>
                                        {customRoles.some(r => r.isVerified)
                                            ? `Perfect! "${customRoles.find(r => r.isVerified)?.name}" will be the Citizen Role! 🛡️`
                                            : "Tip: Don't forget to click the Shield 🛡️ on a role to enable Verification!"
                                        }
                                    </p>
                                </div>
                            </div>
                        )}

                        <button className="modal-btn primary-long" onClick={onDeploy} disabled={isDeploying}>
                            {isDeploying ? "Deploying..." : (isCustomMode ? "Finalize & Magic Deploy 🚀" : "Magic Deploy 🪄")}
                        </button>
                    </div>
                </div>
            </div>

            {/* Permission Modal */}
            {showPermModal && permModalZoneIdx !== null && (
                <div className="sub-modal-overlay" onClick={() => setShowPermModal(false)}>
                    <div className="sn-sub-modal glass animate-pop" onClick={(e) => e.stopPropagation()}>
                        <div className="sn-sub-header">
                            <h4>🔐 Role Permissions</h4>
                            <p>Select roles that can access "{customZones[permModalZoneIdx]?.name}"</p>
                        </div>
                        <div className="sn-field-group">
                            <label className="sn-label-caps">Allowed Roles</label>
                            {customRoles.length > 5 && (
                                <div className="sn-search-wrapper">
                                    <span className="sn-search-icon">🔍</span>
                                    <input
                                        type="text"
                                        className="sn-search-input"
                                        placeholder="Search roles..."
                                        value={roleSearch}
                                        onChange={(e) => setRoleSearch(e.target.value)}
                                    />
                                </div>
                            )}
                            <div className="sn-role-scroll">
                                {filteredRoles.map((r, rIdx) => {
                                    const roleOriginalIdx = customRoles.indexOf(r);
                                    const isSelected = customZones[permModalZoneIdx]?.allowedRoles?.includes(r.name);
                                    return (
                                        <div
                                            key={rIdx}
                                            className={`sn-role-item-card ${isSelected ? 'active' : ''}`}
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
                                            <span className="sn-role-indicator" style={{ background: r.color, boxShadow: `0 0 10px ${r.color}50` }}></span>
                                            <span className="sn-role-text">{r.name}</span>
                                            {isSelected && <span style={{ color: '#ec4899', fontWeight: '800' }}>✓</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <button className="sn-btn-primary" style={{ width: '100%' }} onClick={() => setShowPermModal(false)}>
                            Save Settings ✨
                        </button>
                    </div>
                </div>
            )}

            {/* New Zone Modal */}
            {showNewZoneModal && (
                <div className="sub-modal-overlay" onClick={() => setShowNewZoneModal(false)}>
                    <div className="sn-sub-modal glass animate-pop" onClick={(e) => e.stopPropagation()}>
                        <div className="sn-sub-header">
                            <h4>✨ Create New Zone</h4>
                            <p>Enter zone name and select roles</p>
                        </div>
                        <div className="sn-field-group">
                            <label className="sn-label-caps">Zone Name</label>
                            <input
                                type="text"
                                className="sn-input"
                                placeholder="e.g. VIP LOUNGE"
                                value={newZoneName}
                                onChange={(e) => setNewZoneName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="sn-field-group">
                            <label className="sn-label-caps">Initial Roles</label>
                            {customRoles.length > 5 && (
                                <div className="sn-search-wrapper">
                                    <span className="sn-search-icon">🔍</span>
                                    <input
                                        type="text"
                                        className="sn-search-input"
                                        placeholder="Search roles..."
                                        value={roleSearch}
                                        onChange={(e) => setRoleSearch(e.target.value)}
                                    />
                                </div>
                            )}
                            <div className="sn-role-scroll">
                                {filteredRoles.map((r, rIdx) => {
                                    const isSelected = newZoneRoles.includes(r.name);
                                    return (
                                        <div
                                            key={rIdx}
                                            className={`sn-role-item-card ${isSelected ? 'active' : ''}`}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setNewZoneRoles(newZoneRoles.filter(n => n !== r.name));
                                                } else {
                                                    setNewZoneRoles([...newZoneRoles, r.name]);
                                                }
                                            }}
                                        >
                                            <span className="sn-role-indicator" style={{ background: r.color, boxShadow: `0 0 10px ${r.color}50` }}></span>
                                            <span className="sn-role-text">{r.name}</span>
                                            {isSelected && <span style={{ color: '#ec4899', fontWeight: '800' }}>✓</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="sn-action-grid">
                            <button className="sn-btn-cancel" onClick={() => setShowNewZoneModal(false)}>Cancel</button>
                            <button className="sn-btn-primary" onClick={() => {
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
