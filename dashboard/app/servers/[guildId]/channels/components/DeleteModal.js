"use client";
import React from "react";
import Portal from "../../../../components/Portal";

const DeleteModal = ({ show, channelId, channelName, onClose, onConfirm }) => {
    if (!show) return null;

    return (
        <Portal>
            <div className="fixed-overlay z-setup blur-in">
                <div className="modal-card glass animate-pop" style={{ maxWidth: '420px', border: 'none' }}>
                    <button className="modal-close" onClick={onClose}>×</button>

                    <div className="setup-header">
                        <div className="so-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '20px' }}>🗑️</div>
                        <div className="m-title">
                            <h3 style={{ fontSize: '18px', fontWeight: '900' }}>ลบห้องนี้ใช่ไหมค๊าา?</h3>
                            <p style={{ fontSize: '13px', opacity: 0.7 }}>โปรดยืนยันการลบห้องนะคะ Papa</p>
                        </div>
                    </div>

                    <div className="modal-body" style={{ padding: '24px 0', textAlign: 'center' }}>
                        <div style={{ padding: '15px', borderRadius: '15px', background: 'rgba(239, 68, 68, 0.03)', border: '1px dashed rgba(239, 68, 68, 0.2)' }}>
                            <p style={{ fontSize: '18px', fontWeight: '800', color: '#ef4444', margin: 0 }}>
                                {channelName}
                            </p>
                        </div>
                        <p style={{ marginTop: '16px', fontSize: '13px', opacity: 0.6, lineHeight: '1.6' }}>
                            การดำเนินการนี้ไม่สามารถย้อนคืนได้นะคะ <br /> ห้องและประวัติข้อความจะหายไปทันทีค่ะ 🥺
                        </p>
                    </div>

                    <div className="modal-actions" style={{ marginTop: '10px' }}>
                        <button className="modal-btn ghost" onClick={onClose} style={{ background: 'rgba(0,0,0,0.03)', color: '#64748b' }}>ยังไม่อยากลบ 🌸</button>
                        <button
                            className="modal-btn"
                            onClick={onConfirm}
                            style={{
                                background: '#ef4444',
                                color: 'white',
                                fontWeight: '900',
                                boxShadow: '0 8px 20px rgba(239, 68, 68, 0.25)'
                            }}
                        >
                            ยืนยันลบเลย! 🚀
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default DeleteModal;
