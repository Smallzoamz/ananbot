"use client";
import React from "react";
import Portal from "./Portal";

const ResultModal = ({ type, message, onClose }) => {
    return (
        <Portal>
            <div className={`fixed-overlay z-alert blur-in`} onClick={onClose}>
                <div className="modal-card animate-pop" onClick={e => e.stopPropagation()}>
                    <button className="modal-close" onClick={onClose}>×</button>
                    <div className="modal-header">
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                            {type === 'success' ? '✨🌸' : '⚠️🔥'}
                        </div>
                        <h2 style={{ color: type === 'success' ? '#4ade80' : '#f87171' }}>
                            {type === 'success' ? 'Success!' : 'Oopsie!'}
                        </h2>
                    </div>
                    <div className="modal-body">
                        <p>{message}</p>
                    </div>
                    <div className="modal-actions">
                        <button
                            className={`modal-btn ${type === 'success' ? 'primary' : 'danger'}`}
                            onClick={onClose}
                        >
                            {type === 'success' ? 'Awesome! 💖' : 'Try Again 🔧'}
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default ResultModal;
