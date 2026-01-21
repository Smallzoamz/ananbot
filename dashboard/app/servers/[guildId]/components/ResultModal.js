"use client";
import React from "react";
import Portal from "../../../components/Portal";

const ResultModal = ({ isOpen, onClose, type = 'success', title, message }) => {
    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed-overlay z-modal blur-in" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
                <div className="modal-card animate-pop text-center"
                    style={{
                        maxWidth: '400px',
                        width: '90%',
                        padding: '40px 30px',
                        background: 'white',
                        borderRadius: '32px',
                        boxShadow: '0 20px 60px -10px rgba(0,0,0,0.1)',
                        border: '2px solid #fff5f7'
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: 'transparent',
                            border: 'none',
                            color: '#9ca3af',
                            fontSize: '20px',
                            cursor: 'pointer'
                        }}
                    >
                        ×
                    </button>

                    {/* Icon Container */}
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: '#ecfdf5', // Light green bg
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        margin: '0 auto 20px auto',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                    }}>
                        {type === 'success' ? '✨' : '⚠️'}
                    </div>

                    {/* Title */}
                    <h3 style={{
                        fontSize: '24px',
                        marginBottom: '8px',
                        color: type === 'success' ? '#10b981' : '#ef4444',
                        fontWeight: '800',
                        fontFamily: 'var(--font-outfit), sans-serif'
                    }}>
                        {title}
                    </h3>

                    {/* Subtitle / Message */}
                    {type === 'success' && (
                        <p style={{
                            color: '#4b5563',
                            marginBottom: '4px',
                            fontSize: '16px',
                            fontWeight: '500'
                        }}>
                            ทุกอย่างเรียบร้อยแล้วค่ะ Papa
                        </p>
                    )}
                    <p style={{
                        color: type === 'success' ? '#9ca3af' : '#ef4444',
                        marginBottom: '30px',
                        fontSize: '14px'
                    }}>
                        {message} {type === 'success' && '✨ 🌸'}
                    </p>

                    {/* Button */}
                    <button
                        onClick={onClose}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: type === 'success' ? '#ffb6c1' : '#f87171',
                            color: 'white',
                            border: '2px solid #000',
                            borderRadius: '16px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'transform 0.1s',
                            boxShadow: '0 4px 0 #000'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                        {type === 'success' ? 'Got it! 💖' : 'Close'}
                    </button>
                </div>
            </div>
        </Portal>
    );
};

export default ResultModal;
