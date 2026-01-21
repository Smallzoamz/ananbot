"use client";
import React, { useState, useEffect } from "react";
import Portal from "../../../../components/Portal";

const CreateModal = ({ show, type, onClose, onConfirm }) => {
    const [name, setName] = useState("");

    useEffect(() => {
        if (show) setName("");
    }, [show]);

    if (!show) return null;

    const titles = {
        category: "สร้างหมวดหมู่ใหม่ 📂",
        text: "สร้างห้องแชทใหม่ 💬",
        voice: "สร้างห้องเสียงใหม่ 🔊"
    };

    const placeholders = {
        category: "เช่น SHOPPING ZONE",
        text: "เช่น chat-room",
        voice: "เช่น Lounge"
    };

    return (
        <Portal>
            <div className="fixed-overlay z-setup blur-in">
                <div className="modal-card glass animate-pop" style={{ maxWidth: '450px', border: 'none' }}>
                    <button className="modal-close" onClick={onClose}>×</button>

                    <div className="setup-header">
                        <div className="so-icon" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', fontSize: '20px' }}>🪄</div>
                        <div className="m-title">
                            <h3 style={{ fontSize: '18px', fontWeight: '900' }}>{titles[type] || "Create New"}</h3>
                            <p style={{ fontSize: '13px', opacity: 0.7 }}>ระบุชื่อที่คุณต้องการได้เลยนะคะ Papa</p>
                        </div>
                    </div>

                    <div className="modal-body" style={{ padding: '24px 0' }}>
                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '900', color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                NAME / ชื่อเรียก
                            </label>
                            <input
                                type="text"
                                className="premium-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={placeholders[type]}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && name.trim()) onConfirm(type, name.trim());
                                }}
                            />
                        </div>
                    </div>

                    <div className="modal-actions" style={{ marginTop: '10px' }}>
                        <button className="modal-btn ghost" onClick={onClose} style={{ background: 'rgba(0,0,0,0.03)', color: '#64748b' }}>ยกเลิก 🌸</button>
                        <button
                            className="modal-btn"
                            disabled={!name.trim()}
                            onClick={() => onConfirm(type, name.trim())}
                            style={{
                                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                                color: 'white',
                                opacity: name.trim() ? 1 : 0.5,
                                fontWeight: '900',
                                boxShadow: '0 8px 20px rgba(236, 72, 153, 0.25)'
                            }}
                        >
                            ตกลงค่ะ 🚀
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default CreateModal;
