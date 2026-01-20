"use client";
import React from "react";
import Portal from "../../../components/Portal";

const PricingModal = ({ show, userPlan, onClose }) => {
    if (!show) return null;

    return (
        <Portal>
            <div className="fixed-overlay z-pricing blur-in" onClick={onClose}>
                <div className="pricing-modal glass animate-pop" onClick={e => e.stopPropagation()}>
                    <div className="setup-header" style={{ width: '100%', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div className="so-icon" style={{ background: '#fff0f5', color: '#ec4899' }}>👑</div>
                            <div className="m-title">
                                <h3>Choose Your Power</h3>
                                <p>Unlock exclusive features to grow your community 🌸</p>
                            </div>
                        </div>
                        <button className="modal-close" onClick={onClose} style={{ position: 'relative', top: '0', right: '0' }}>×</button>
                    </div>
                    <div className="pricing-grid">
                        <div className="pricing-card">
                            <div className="p-tier">FREE</div>
                            <div className="p-price">$0 <span>/month</span></div>
                            <ul className="p-features">
                                <li>✅ Basic Template Deploy</li>
                                <li>✅ Daily Missions</li>
                                <li>✅ General Commands</li>
                            </ul>
                            <button className="p-btn disabled">
                                {userPlan?.plan_type === 'free' ? 'Current Plan' : 'Standard Tier'}
                            </button>
                        </div>
                        <div className="pricing-card featured pro">
                            <div className="p-tier">PRO 💎</div>
                            <div className="p-price">$4.99 <span>/month</span></div>
                            <ul className="p-features">
                                <li>✅ All Free Features</li>
                                <li>✅ Pro Badge on Profile</li>
                                <li>✅ anan-terminal Access</li>
                                <li>✅ Advanced Management</li>
                            </ul>
                            <button className="p-btn pro">
                                {userPlan?.plan_type === 'pro' ? 'Current Plan' : 'Get Pro 🚀'}
                            </button>
                        </div>
                        <div className="pricing-card featured premium">
                            <div className="p-badge-promo">BEST VALUE</div>
                            <div className="p-tier">PREMIUM ✨</div>
                            <div className="p-price">$9.99 <span>/month</span></div>
                            <ul className="p-features">
                                <li>✅ Everything in Pro</li>
                                <li>✅ Lifetime Updates</li>
                                <li>✅ Custom Bot Branding</li>
                                <li>✅ Priority Support 24/7</li>
                            </ul>
                            <button className="p-btn premium">
                                {userPlan?.plan_type === 'premium' ? 'Current Plan' : 'Get Premium 👑'}
                            </button>
                        </div>
                    </div>
                    <div className="pricing-footer" style={{ marginTop: '30px', opacity: 0.6, fontSize: '13px' }}>
                        <p>An An will handle everything for Papa! 🌸💖</p>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default PricingModal;
