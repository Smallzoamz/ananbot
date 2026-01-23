import React, { useState } from 'react';
import Portal from '../../../../components/Portal';

export default function AddRoleModal({ show, roles, onClose, onSelect }) {
    const [search, setSearch] = useState("");

    if (!show) return null;

    const filteredRoles = roles.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.id.includes(search)
    );

    return (
        <Portal>
            <div className="sub-modal-overlay">
                <div className="sub-modal add-role-modal">
                    <div className="sub-modal-header">
                        <div className="add-role-icon">👤</div>
                        <div>
                            <h4>Add Role Override</h4>
                            <p>Select a role to configure permissions.</p>
                        </div>
                        <button className="modal-close-inline" onClick={onClose}>×</button>
                    </div>

                    <div className="add-role-body">
                        <div className="add-role-search">
                            <label className="create-label">Search Role</label>
                            <input
                                type="text"
                                className="premium-input"
                                placeholder="Search by name or ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="add-role-list">
                            {filteredRoles.map(role => (
                                <div
                                    key={role.id}
                                    className="add-role-item"
                                    onClick={() => onSelect(role)}
                                >
                                    <div className="add-role-left">
                                        <div
                                            className="add-role-color"
                                            style={{ background: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : '#999' }}
                                        />
                                        <span className="add-role-name">{role.name}</span>
                                    </div>
                                    <span className="add-role-id">{role.id}</span>
                                </div>
                            ))}
                            {filteredRoles.length === 0 && (
                                <p className="add-role-empty">No roles found.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
}
