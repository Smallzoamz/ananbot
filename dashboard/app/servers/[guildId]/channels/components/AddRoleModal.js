import React, { useState } from 'react';
import Portal from '../../../../components/Portal';

// Uses global modal styles from globals.css (.fixed-overlay, .modal-card, etc.)

export default function AddRoleModal({ show, roles, onClose, onSelect }) {
    const [search, setSearch] = useState("");

    if (!show) return null;

    const filteredRoles = roles.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.id.includes(search)
    );

    return (
        <Portal>
            <div className="fixed-overlay">
                <div className="modal-card animate-pop" style={{ width: '400px' }}>

                    {/* Header */}
                    <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '24px' }}>👤</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#4a4a68' }}>Add Role Override</h3>
                                <p style={{ margin: 0, fontSize: '12px', opacity: 0.6 }}>Select a role to configure permissions.</p>
                            </div>
                        </div>
                        <button className="modal-close-btn" onClick={onClose} style={{ fontSize: '24px', cursor: 'pointer', background: 'transparent', border: 'none', color: '#999' }}>×</button>
                    </div>

                    {/* Body */}
                    <div className="modal-body">

                        <div className="input-group">
                            <label>Search Role</label>
                            <input
                                type="text"
                                className="glass-input"
                                placeholder="Search by name or ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="role-list-scroll" style={{ maxHeight: '250px', overflowY: 'auto', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {filteredRoles.map(role => (
                                <div
                                    key={role.id}
                                    onClick={() => onSelect(role)}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '12px',
                                        background: 'rgba(255,255,255,0.5)',
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        transition: '0.2s'
                                    }}
                                    className="hover:bg-white hover:shadow-sm"
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : '#999'
                                        }} />
                                        <span style={{ fontWeight: '700', fontSize: '13px', color: '#4a4a68' }}>{role.name}</span>
                                    </div>
                                    <span style={{ fontSize: '10px', opacity: 0.4 }}>{role.id}</span>
                                </div>
                            ))}
                            {filteredRoles.length === 0 && (
                                <p style={{ textAlign: 'center', opacity: 0.5, fontSize: '12px', padding: '20px' }}>No roles found.</p>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </Portal>
    );
}
