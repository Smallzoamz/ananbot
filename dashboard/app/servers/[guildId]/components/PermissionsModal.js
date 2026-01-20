"use client";
import React from "react";
import Portal from "../../../components/Portal";

const PermissionsModal = ({ show, activeRoleIndex, customRoles, availablePermissions, onUpdateRoles, onClose }) => {
    if (!show || activeRoleIndex === null) return null;

    return (
        <Portal>
            <div className="fixed-overlay z-perms blur-in">
                <div className="modal-card perms-modal glass animate-pop">
                    <div className="setup-header">
                        <div className="so-icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>🔐</div>
                        <div className="m-title">
                            <h3>Advanced Permissions</h3>
                            <p>Configure rights for <span style={{ color: 'var(--primary)', fontWeight: '800' }}>{customRoles[activeRoleIndex]?.name || 'Role'}</span></p>
                        </div>
                        <button className="modal-close" onClick={onClose} style={{ position: 'absolute', top: '25px', right: '25px' }}>×</button>
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
                                        onUpdateRoles(newRoles);
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
                        <button className="modal-btn primary" onClick={onClose}>Save & Close</button>
                        <button className="modal-btn secondary" onClick={() => {
                            const newRoles = [...customRoles];
                            delete newRoles[activeRoleIndex].permissions_bitmask;
                            onUpdateRoles(newRoles);
                            onClose();
                        }}>Reset to Default</button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default PermissionsModal;
