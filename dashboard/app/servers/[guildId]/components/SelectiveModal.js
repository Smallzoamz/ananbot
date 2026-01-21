"use client";
import React from "react";
import Portal from "../../../components/Portal";

const SelectiveModal = ({ show, serverStructure, selectedIds, isDeleting, onToggle, onDelete, onClose }) => {
    if (!show) return null;

    return (
        <Portal>
            <div className="fixed-overlay z-selective blur-in">
                <div className="modal-card wide-card glass animate-pop" style={{ textAlign: 'left', borderRadius: '24px' }}>
                    <button className="modal-close" onClick={onClose} style={{ top: '20px', right: '20px' }}>×</button>

                    <div className="setup-header" style={{ marginBottom: '24px' }}>
                        <div className="so-icon" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>🏗️</div>
                        <div className="m-title">
                            <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Structure Manager</h3>
                            <p style={{ color: '#64748b' }}>จัดการโครงสร้างเซิร์ฟเวอร์แบบเจาะจง</p>
                        </div>
                    </div>

                    <div className="sn-selective-card custom-scrollbar" style={{ padding: '0 4px' }}>
                        {serverStructure.map(cat => (
                            <div key={cat.id} className="sn-selective-group">
                                <div className="sn-selective-cat" onClick={() => onToggle(cat.id, "category", cat.channels)}>
                                    <div className={`sn-custom-checkbox ${selectedIds.includes(cat.id) ? 'checked' : ''}`}></div>
                                    <span style={{ fontSize: '14px' }}>{cat.name === "UNCATEGORIZED" ? "📂" : "⌵"}</span>
                                    <span>{cat.name.toUpperCase()}</span>
                                    <span className="sn-badge sn-badge-outline" style={{ marginLeft: 'auto', fontSize: '10px' }}>{cat.channels.length}</span>
                                </div>
                                <div className="sn-selective-ch-list">
                                    {cat.channels.map(ch => (
                                        <div
                                            key={ch.id}
                                            className={`sn-selective-item ${selectedIds.includes(ch.id) ? 'selected' : ''}`}
                                            onClick={(e) => { e.stopPropagation(); onToggle(ch.id); }}
                                            style={{ marginLeft: '24px' }}
                                        >
                                            <div className={`sn-custom-checkbox ${selectedIds.includes(ch.id) ? 'checked' : ''}`}></div>
                                            <span className="sn-selective-ch-icon">
                                                {ch.type === "0" || ch.type === "text" ? "#" : (ch.type === "2" || ch.type === "voice" ? "🔊" : "💬")}
                                            </span>
                                            <span className="sn-selective-ch-name">{ch.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="setup-footer" style={{ marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="sn-footer-stats">
                            Selected: <b>{selectedIds.length}</b> items
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="sn-button-outline" style={{ padding: '10px 24px' }} onClick={onClose}>ยกเลิก</button>
                            <button
                                className="sn-btn-primary"
                                style={{
                                    padding: '10px 24px',
                                    background: selectedIds.length > 0 ? '#ef4444' : '#ffb7e2',
                                    color: 'white',
                                    borderRadius: '12px'
                                }}
                                onClick={onDelete}
                                disabled={selectedIds.length === 0 || isDeleting}
                            >
                                {isDeleting ? "กำลังลบ..." : `ลบรายการที่เลือก (${selectedIds.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default SelectiveModal;
