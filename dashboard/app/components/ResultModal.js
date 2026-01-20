"use client";
import React from "react";
import Portal from "./Portal";

const ResultModal = ({ show, type, message, onClose }) => {
    if (!show) return null;
    return (
        <Portal>
            <div className={`fixed-overlay z-pricing blur-in`} onClick={onClose}>
                <div className="modal-card glass animate-pop" onClick={e => e.stopPropagation()}>
                    <button className="modal-close" onClick={onClose}>×</button>

                    <div className="setup-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column' }}>
                        <div className="so-icon" style={{
                            background: type === 'success' ? '#f0fdf4' : '#fff1f2',
                            fontSize: '42px',
                            width: '80px',
                            height: '80px',
                            marginBottom: '15px'
                        }}>
                            {type === 'success' ? '✨' : '⚠️'}
                        </div>
                        <div className="m-title" style={{ textAlign: 'center' }}>
                            <h3 style={{ color: type === 'success' ? '#10b981' : '#ef4444', fontSize: '24px' }}>
                                {type === 'success' ? 'Task Completed!' : 'Something Went Wrong'}
                            </h3>
                            <p>{type === 'success' ? 'ทุกอย่างเรียบร้อยแล้วค่ะ Papa' : 'พบข้อผิดพลาดบางประการ'}</p>
                        </div>
                    </div>

                    <div className="modal-body" style={{ margin: '20px 0' }}>
                        <p style={{ fontSize: '16px', color: '#4a4a68' }}>{message}</p>
                    </div>

                    <div className="modal-footer" style={{ border: 'none', marginTop: '0', paddingTop: '0' }}>
                        <button
                            className="primary-long"
                            style={{ background: type === 'success' ? '#10b981' : '#ff4757', boxShadow: type === 'success' ? '0 8px 25px rgba(16, 185, 129, 0.3)' : '0 8px 25px rgba(255, 71, 87, 0.3)' }}
                            onClick={onClose}
                        >
                            {type === 'success' ? 'Got it! 💖' : 'I\'ll fix it! 🔧'}
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default ResultModal;
