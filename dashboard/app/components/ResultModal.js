"use client";
import React from "react";
import Portal from "./Portal";

const ResultModal = ({ show, isOpen, type = 'success', title, message, onClose }) => {
    const isVisible = show || isOpen;
    if (!isVisible) return null;

    const modalTitle = title || (type === 'success' ? 'Task Completed!' : 'Something Went Wrong');

    return (
        <Portal>
            <div className={`fixed-overlay blur-in`} onClick={onClose} style={{ zIndex: 5000 }}>
                <div className="modal-card glass animate-pop text-center" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                    <button className="modal-close" onClick={onClose}>×</button>

                    <div className="setup-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', border: 'none' }}>
                        <div className="so-icon" style={{
                            background: type === 'success' ? '#f0fdf4' : '#fff1f2',
                            fontSize: '42px',
                            width: '80px',
                            height: '80px',
                            marginBottom: '15px',
                            borderRadius: '24px',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.05)'
                        }}>
                            {type === 'success' ? '✨' : '⚠️'}
                        </div>
                        <div className="m-title" style={{ textAlign: 'center' }}>
                            <h3 style={{ color: type === 'success' ? '#10b981' : '#ef4444', fontSize: '24px', fontWeight: '850' }}>
                                {modalTitle}
                            </h3>
                            {type === 'success' && <p style={{ color: '#4b5563', fontWeight: '600' }}>ทุกอย่างเรียบร้อยแล้วค่ะ Papa ✨ 🌸</p>}
                        </div>
                    </div>

                    <div className="modal-body" style={{ margin: '15px 0 25px 0' }}>
                        <p style={{ fontSize: '15px', color: type === 'success' ? '#6b7280' : '#ef4444' }}>{message}</p>
                    </div>

                    <div className="modal-footer" style={{ border: 'none', marginTop: '0', paddingTop: '0' }}>
                        <button
                            className="primary-long"
                            style={{
                                background: type === 'success' ? '#ffb7e2' : '#ff4757',
                                border: '2px solid #000',
                                color: 'white',
                                borderRadius: '16px',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 0 #000'
                            }}
                            onClick={onClose}
                        >
                            {type === 'success' ? 'Got it! 💖' : 'I\'ll fix it! 🔧'}
                        </button>
                    </div>
                </div>
            </div>
        </Portal >
    );
};

export default ResultModal;
