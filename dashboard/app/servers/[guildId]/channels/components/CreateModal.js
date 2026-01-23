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
            <div className="sub-modal-overlay">
                <div className="sub-modal channel-create-modal">
                    <div className="sub-modal-header">
                        <div className="create-modal-icon">🪄</div>
                        <div>
                            <h4>{titles[type] || "Create New"}</h4>
                            <p>ระบุชื่อที่คุณต้องการได้เลยนะคะ Papa</p>
                        </div>
                        <button className="modal-close-inline" onClick={onClose}>×</button>
                    </div>

                    <div className="create-modal-body">
                        <div className="create-input-group">
                            <label className="create-label">NAME / ชื่อเรียก</label>
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

                    <div className="sub-modal-actions">
                        <button className="sub-modal-btn cancel" onClick={onClose}>ยกเลิก 🌸</button>
                        <button
                            className="sub-modal-btn primary"
                            disabled={!name.trim()}
                            onClick={() => onConfirm(type, name.trim())}
                            style={{ opacity: name.trim() ? 1 : 0.5 }}
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
