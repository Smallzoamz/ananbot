"use client";
import React from "react";
import Portal from "./Portal";
import { useLanguage } from "../context/LanguageContext";

const ClaimTrialModal = ({ show, onClose, onConfirm, loading }) => {
    const { t } = useLanguage();

    if (!show) return null;

    return (
        <Portal>
            <div className="fixed-overlay z-pricing blur-in" onClick={!loading ? onClose : undefined}>
                <div className="modal-card glass animate-pop" onClick={e => e.stopPropagation()}>
                    {!loading && <button className="modal-close" onClick={onClose}>×</button>}

                    <div className="setup-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column' }}>
                        <div className="so-icon" style={{
                            background: 'linear-gradient(135deg, #fff1f2 0%, #fff7ed 100%)',
                            fontSize: '48px',
                            width: '100px',
                            height: '100px',
                            marginBottom: '20px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 10px 30px rgba(255, 183, 226, 0.2)'
                        }}>
                            🎁
                        </div>
                        <div className="m-title" style={{ textAlign: 'center' }}>
                            <h3 style={{ color: '#ec4899', fontSize: '24px', marginBottom: '10px' }}>
                                {t.freeTrial?.modal?.title || "Claim 7-Day Free Trial?"}
                            </h3>
                            <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
                                {t.freeTrial?.modal?.desc || "Enjoy Pro features for free! No credit card required."}
                            </p>
                        </div>
                    </div>

                    <div className="modal-actions" style={{ marginTop: '30px' }}>
                        <button
                            className="modal-btn secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            {t.freeTrial?.modal?.cancel || "Maybe Later"}
                        </button>
                        <button
                            className="modal-btn"
                            style={{
                                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                                color: 'white',
                                boxShadow: '0 8px 25px rgba(236, 72, 153, 0.4)'
                            }}
                            onClick={onConfirm}
                            disabled={loading}
                        >
                            {loading ? "Activating... ⏳" : (t.freeTrial?.modal?.confirm || "Activate Now 🚀")}
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default ClaimTrialModal;
