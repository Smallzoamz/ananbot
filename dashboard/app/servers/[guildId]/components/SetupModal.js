"use client";
import React from "react";
import Portal from "../../../components/Portal";
import { ArrowIcon } from "../../../components/Icons";

const SetupModal = ({
    show,
    setupStep,
    setSetupStep,
    templates,
    selectedTemplate,
    setSelectedTemplate,
    customRoles,
    setCustomRoles,
    customZones,
    setCustomZones,
    isDeploying,
    onDeploy,
    onClose,
    onShowPermissions
}) => {
    if (!show) return null;

    const handleBack = () => {
        if (setupStep === 'custom_role' || setupStep === 'custom_zone') setSetupStep('options');
        else if (setupStep === 'options') setSetupStep('select');
    };

    return (
        <Portal>
            <div className="fixed-overlay z-setup blur-in">
                <div className="modal-card wide-card glass animate-pop">
                    <button className="modal-close" onClick={onClose}>×</button>

                    {setupStep === 'select' && (
                        <div className="setup-flow">
                            <div className="setup-header">
                                <div className="m-icon">🪄</div>
                                <div className="m-title">
                                    <h3>Select a Template</h3>
                                    <p>เลือกรูปแบบเซิร์ฟเวอร์ที่คุณต้องการ</p>
                                </div>
                            </div>
                            <div className="template-grid">
                                {Object.entries(templates).map(([key, t]) => (
                                    <div key={key} className="template-card" onClick={() => { setSelectedTemplate(key); setSetupStep('options'); }}>
                                        <div className="t-icon">{t.icon}</div>
                                        <div className="t-info">
                                            <h4>{t.name}</h4>
                                            <p>{t.desc}</p>
                                        </div>
                                        <ArrowIcon />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {setupStep === 'options' && templates[selectedTemplate] && (
                        <div className="setup-flow">
                            <div className="setup-header">
                                <button className="back-btn" onClick={handleBack}>←</button>
                                <div className="m-title">
                                    <h3>{templates[selectedTemplate].name} Options</h3>
                                    <p>ปรับแต่งรายละเอียดเซิร์ฟเวอร์ของคุณ</p>
                                </div>
                            </div>
                            <div className="options-list">
                                <div className="option-item" onClick={() => setSetupStep('custom_role')}>
                                    <div className="o-icon">👤</div>
                                    <div className="o-text">
                                        <h4>Customize Roles</h4>
                                        <p>ปรับแต่งชื่อและสีของยศ ({customRoles.length} roles)</p>
                                    </div>
                                    <ArrowIcon />
                                </div>
                                <div className="option-item" onClick={() => setSetupStep('custom_zone')}>
                                    <div className="o-icon">📂</div>
                                    <div className="o-text">
                                        <h4>Customize Zones</h4>
                                        <p>จัดการหมวดหมู่และโซนที่ต้องการ ({customZones.length} zones)</p>
                                    </div>
                                    <ArrowIcon />
                                </div>
                            </div>
                            <div className="setup-footer">
                                <button className="modal-btn primary-long" onClick={onDeploy} disabled={isDeploying}>
                                    {isDeploying ? "Deploying..." : "Finalize & Deploy 🚀"}
                                </button>
                            </div>
                        </div>
                    )}

                    {setupStep === 'custom_role' && (
                        <div className="setup-flow">
                            <div className="setup-header">
                                <button className="back-btn" onClick={handleBack}>←</button>
                                <div className="m-title">
                                    <h3>Customize Roles</h3>
                                    <p>จัดการยศทั้งหมดในเทมเพลตนี้</p>
                                </div>
                            </div>
                            <div className="custom-scroll-list">
                                {customRoles.map((role, idx) => (
                                    <div key={idx} className="role-edit-item">
                                        <input
                                            type="color"
                                            value={role.color}
                                            onChange={(e) => {
                                                const newRoles = [...customRoles];
                                                newRoles[idx].color = e.target.value;
                                                setCustomRoles(newRoles);
                                            }}
                                            className="role-color-input"
                                        />
                                        <input
                                            type="text"
                                            value={role.name}
                                            onChange={(e) => {
                                                const newRoles = [...customRoles];
                                                newRoles[idx].name = e.target.value;
                                                setCustomRoles(newRoles);
                                            }}
                                            className="role-name-input"
                                        />
                                        <button className="role-settings-btn" onClick={() => onShowPermissions(idx)}>⚙️</button>
                                    </div>
                                ))}
                            </div>
                            <div className="setup-footer">
                                <button className="modal-btn ghost" onClick={() => setSetupStep('options')}>Save & Back</button>
                            </div>
                        </div>
                    )}

                    {setupStep === 'custom_zone' && (
                        <div className="setup-flow">
                            <div className="setup-header">
                                <button className="back-btn" onClick={handleBack}>←</button>
                                <div className="m-title">
                                    <h3>Customize Zones</h3>
                                    <p>เลือกหมวดหมู่ที่ต้องการให้ An An สร้าง</p>
                                </div>
                            </div>
                            <div className="custom-scroll-list">
                                {customZones.map((zone, idx) => (
                                    <div key={idx} className="zone-edit-item" onClick={() => {
                                        const newZones = [...customZones];
                                        newZones[idx].enabled = !newZones[idx].enabled;
                                        setCustomZones(newZones);
                                    }}>
                                        <input type="checkbox" checked={zone.enabled} readOnly className="m-checkbox" />
                                        <div className="z-info">
                                            <h4>{zone.name}</h4>
                                            <p>{zone.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="setup-footer">
                                <button className="modal-btn ghost" onClick={() => setSetupStep('options')}>Save & Back</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Portal>
    );
};

export default SetupModal;
