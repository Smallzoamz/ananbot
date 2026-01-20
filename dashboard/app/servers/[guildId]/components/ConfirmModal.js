"use client";
import React from "react";
import Portal from "../../../components/Portal";

const ConfirmModal = ({ show, actionName, template, onConfirm, onClose }) => {
    if (!show) return null;

    return (
        <Portal>
            <div className="fixed-overlay z-setup blur-in">
                <div className="modal-card glass animate-pop">
                    <button className="modal-close" onClick={onClose}>×</button>

                    <div className="setup-header">
                        <div className="so-icon" style={{ background: '#fff1f2', color: '#ef4444' }}>🚨</div>
                        <div className="m-title">
                            <h3>Wait a sec!</h3>
                            <p>โปรดยืนยันการดำเนินการของคุณ</p>
                        </div>
                    </div>

                    <div className="modal-body" style={{ textAlign: 'left', padding: '0 10px' }}>
                        <p style={{ fontSize: '16px', color: '#4a4a68', fontWeight: '600' }}>
                            Are you sure you want to <span style={{ color: '#ef4444', textDecoration: 'underline' }}>{actionName}</span>?
                        </p>
                        <p style={{ marginTop: '10px', fontSize: '14px' }}>
                            การดำเนินการนี้จะทำการล้างข้อมูลเดิมและตั้งค่าใหม่ทั้งหมด ซึ่งไม่สามารถย้อนคืนได้
                        </p>
                    </div>

                    <div className="modal-actions" style={{ marginTop: '30px' }}>
                        <button className="modal-btn ghost" onClick={onClose} style={{ border: '1px solid #e5e7eb' }}>No, take me back! 🌸</button>
                        <button className="modal-btn primary-danger" onClick={() => onConfirm(actionName, template)} style={{ background: '#ff4757', color: 'white', fontWeight: '900' }}>Yes, Clean & Reset! 🚀</button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default ConfirmModal;
