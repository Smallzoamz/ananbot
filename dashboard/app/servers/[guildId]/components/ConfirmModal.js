"use client";
import React from "react";
import Portal from "../../../components/Portal";

const ConfirmModal = ({ show, actionName, template, onConfirm, onClose }) => {
    if (!show) return null;

    return (
        <Portal>
            <div className="fixed-overlay z-overlay-base blur-in">
                <div className="modal-card glass animate-pop">
                    <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#4a4a68', marginBottom: '15px' }}>Wait a sec! 🚨</h2>
                    <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '30px' }}>
                        Are you sure you want to <strong>{actionName}</strong>?
                        <br />This will wipe existing data!
                    </p>
                    <div className="modal-actions">
                        <button className="modal-btn secondary" onClick={onClose}>No, take me back! 🌸</button>
                        <button className="modal-btn primary-danger" onClick={() => onConfirm(actionName, template)}>Yes, Clean & Reset! 🚀</button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default ConfirmModal;
