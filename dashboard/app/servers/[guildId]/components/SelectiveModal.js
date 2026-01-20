"use client";
import React from "react";
import Portal from "../../../components/Portal";

const SelectiveModal = ({ show, serverStructure, selectedIds, isDeleting, onToggle, onDelete, onClose }) => {
    if (!show) return null;

    return (
        <Portal>
            <div className="fixed-overlay z-selective blur-in">
                <div className="modal-card wide-card glass animate-pop left-align" style={{ textAlign: 'left' }}>
                    <button className="modal-close" onClick={onClose}>×</button>
                    <div className="setup-header">
                        <div className="so-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>🏗️</div>
                        <div className="m-title">
                            <h3>Structure Manager</h3>
                            <p>จัดการโครงสร้างเซิร์ฟเวอร์แบบเจาะจง</p>
                        </div>
                    </div>
                    <div className="selective-body discord-sidebar custom-list">
                        {serverStructure.map(cat => (
                            <div key={cat.id} className="discord-cat-section">
                                <div className="discord-cat-header" onClick={() => onToggle(cat.id, "category", cat.channels)}>
                                    <div className="ch-checkbox-wrap">
                                        <input type="checkbox" checked={selectedIds.includes(cat.id)} onChange={() => { }} className="m-checkbox" />
                                    </div>
                                    <span className="cat-arrow">{cat.name === "UNCATEGORIZED" ? "📂" : "⌵"}</span>
                                    <span className="cat-name">{cat.name.toUpperCase()}</span>
                                    <span className="cat-count">{cat.channels.length}</span>
                                </div>
                                <div className="discord-ch-list">
                                    {cat.channels.map(ch => (
                                        <div key={ch.id} className={`discord-ch-item ${selectedIds.includes(ch.id) ? 'selected' : ''}`} onClick={(e) => { e.stopPropagation(); onToggle(ch.id); }}>
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
                            <button className="modal-btn ghost" onClick={onClose}>ยกเลิก</button>
                            <button className="modal-btn danger" onClick={onDelete} disabled={selectedIds.length === 0 || isDeleting}>
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
