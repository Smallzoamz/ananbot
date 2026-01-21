"use client";
import React, { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "../../../context/LanguageContext";
import { useServer } from "../../../context/ServerContext";
import ClaimTrialModal from "../../../components/ClaimTrialModal";
import ResultModal from "../../../components/ResultModal";

const MiniProfileCard = ({ planType, level, tierName }) => {
    const { data: session } = useSession();

    // Determine gradient for the badge based on plan
    const badgeGradient = planType === 'premium' ? 'linear-gradient(90deg, #ffd700, #ff8c00)' :
        planType === 'pro' ? 'linear-gradient(90deg, #e2e8f0, #94a3b8)' :
            'rgba(0,0,0,0.1)';

    const badgeText = planType === 'premium' ? 'PREMIUM' : planType === 'pro' ? 'PRO' : 'MEMBER';
    const badgeColor = planType === 'free' ? '#555' : '#fff';

    // Using a placeholder image if session is missing to keep layout consistent
    const userImage = session?.user?.image || "https://cdn.discordapp.com/embed/avatars/0.png";

    return (
        <div className="pm-card animate-pop">
            {/* Glass Background for the Mini Card */}
            <div className="pm-glass-bg"></div>

            <div className={`pm-hero ${planType}`}>
                <div className="pm-img-container">
                    <img src={userImage} alt="Avatar" className="pm-img" />

                    {/* Background Glow/Gradient Ring */}
                    {planType === 'premium' && <div className="pm-ring premium"></div>}
                    {planType === 'pro' && <div className="pm-ring pro"></div>}

                    {/* Crown Logic */}
                    {(planType === 'premium' || planType === 'pro') && (
                        <div className="pm-crown-wrapper">
                            <svg className="pm-crown-svg" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 70 L5 20 L30 45 L50 5 L70 45 L95 20 L90 70 Z" fill="rgba(255,255,255,0.2)" filter="blur(4px)" />
                                <path
                                    className={planType === 'premium' ? 'crown-gold-path' : 'crown-silver-path'}
                                    d="M10 70 L5 20 L30 45 L50 5 L70 45 L95 20 L90 70 H10 Z"
                                    stroke="rgba(0,0,0,0.1)" strokeWidth="1"
                                />
                                <path d="M10 65 L90 65 V73 H10 Z" fill="rgba(0,0,0,0.05)" />
                                <circle cx="50" cy="5" r="4" fill="url(#gemGradient)" />
                                <circle cx="5" cy="20" r="3" fill="url(#gemGradient)" />
                                <circle cx="95" cy="20" r="3" fill="url(#gemGradient)" />
                                <rect x="45" y="45" width="10" height="10" transform="rotate(45 50 50)" fill="url(#rubyGradient)" rx="1" />

                                {/* Decorative Dots - Added for 100% accuracy with Leaderboard */}
                                <circle cx="20" cy="68" r="1.5" fill="white" />
                                <circle cx="50" cy="68" r="1.5" fill="white" />
                                <circle cx="80" cy="68" r="1.5" fill="white" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Level Icon */}
                <div
                    className="pm-level-icon"
                    style={{ backgroundImage: `url('/assets/levels/LV${level}.png')` }}
                ></div>
            </div>

            {/* User Info */}
            <div className="pm-info">
                <div className="pm-name">{session?.user?.name || "Papa"}</div>
                <div className="pm-badge" style={{ background: badgeGradient, color: badgeColor }}>{badgeText}</div>
            </div>
        </div>
    );
};

const PricingCard = ({ tier, priceTHB, features, btnText, isFeatured, isPremium, currentPlan, level, planType, onClick }) => {
    const cardRef = useRef(null);
    const { language } = useLanguage();
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const exRate = 31.47;
    const isThai = language === 'th';

    const convertedPrice = priceTHB === "0" ? "0" : (priceTHB / exRate).toFixed(2);
    const displayPrice = isThai ? priceTHB : convertedPrice;
    const currencySymbol = isThai ? "" : "$";
    const currencySuffix = isThai ? " บ." : "";
    const period = isThai ? "/เดือน" : "/month";

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setTilt({ x: x * 10, y: y * -10 });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };

    return (
        <div
            ref={cardRef}
            className={`premium-pricing-card ${isFeatured ? 'featured' : ''} ${isPremium ? 'is-premium' : ''}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) scale(${tilt.x !== 0 ? 1.02 : 1})`,
                transition: tilt.x === 0 ? 'all 0.5s ease' : 'none',
                position: 'relative'
            }}
        >
            {isPremium && <div className="premium-shimmer"></div>}
            {isPremium && <div className="best-value-tag">{language === 'th' ? 'คุ้มค่าที่สุด' : 'BEST VALUE'}</div>}

            <div className="card-content">
                {/* Tier Name - Centered */}
                <div className="tier-name">{tier}</div>

                {/* Price - Centered */}
                <div className="price-tag">
                    <span className="currency">{currencySymbol}</span>
                    <span className="amount">{displayPrice}</span>
                    <span className="currency-suffix">{currencySuffix}</span>
                    <span className="period">{period}</span>
                </div>

                {/* Profile Mockup - Centered, Above Features */}
                <MiniProfileCard planType={planType} level={level} tierName={tier} />

                {/* Features */}
                <ul className="feature-list">
                    {features.map((feat, i) => (
                        <li key={i}>
                            <span className="check">✦</span>
                            {feat}
                        </li>
                    ))}
                </ul>


                <button className={`p-action-btn ${isPremium ? 'premium' : isFeatured ? 'pro' : 'free'}`} onClick={onClick} disabled={currentPlan}>
                    {currentPlan ? (language === 'th' ? 'แพ็กเกจปัจจุบัน' : 'Current Plan') : btnText}
                </button>
            </div>


            <div
                className="plugin-sitting-icon"
                style={{
                    backgroundImage: `url('/assets/levels/LV${level}.png')`,
                    bottom: '-22px',
                    right: '-22px',
                    width: '85px',
                    height: '85px',
                    zIndex: 20,
                    animation: 'jump-wiggle 1.5s infinite ease-in-out'
                }}
            ></div>
        </div>
    );
};

export default function PremiumPage() {
    const { t, language } = useLanguage();
    const { userPlan, refreshData, guildId } = useServer();
    const { data: session } = useSession();
    const [openFaq, setOpenFaq] = useState(null);

    // Trial & Modal State
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [isClaimingTrial, setIsClaimingTrial] = useState(false);
    const [modalState, setModalState] = useState({ show: false, type: 'success', message: '' });

    const handleClaimTrial = async () => {
        setIsClaimingTrial(true);
        try {
            const res = await fetch(`/api/proxy/guild/${guildId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: "claim_trial", user_id: session?.user?.id || session?.user?.uid })
            });
            const data = await res.json();

            if (data.success) {
                setModalState({ show: true, type: 'success', message: "Start your 7-Day Free Trial! Enjoy Pro features! 🌸✨" });
                setShowClaimModal(false);
                refreshData();
            } else {
                setModalState({ show: true, type: 'error', message: data.error || "Failed to claim trial." });
            }
        } catch (e) {
            console.error(e);
            setModalState({ show: true, type: 'error', message: "Network error occurred." });
        } finally {
            setIsClaimingTrial(false);
        }
    };

    const isEligibleForTrial = userPlan?.plan_type === 'free' && !userPlan?.trial_claimed;

    return (
        <div className="premium-hub-root">
            {/* SVG Gradients for Crowns & Frames */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
                        <stop offset="30%" style={{ stopColor: '#fffacb', stopOpacity: 1 }} />
                        <stop offset="60%" style={{ stopColor: '#ffcc00', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#ff8c00', stopOpacity: 1 }} />
                    </linearGradient>
                    <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#cbd5e1', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#94a3b8', stopOpacity: 1 }} />
                    </linearGradient>
                    <radialGradient id="gemGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#60a5fa', stopOpacity: 1 }} />
                    </radialGradient>
                    <radialGradient id="rubyGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" style={{ stopColor: '#ff9999', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#ef4444', stopOpacity: 1 }} />
                    </radialGradient>
                </defs>
            </svg>

            {/* Mesh Gradient Background */}
            <div className="mesh-gradient-bg"></div>

            <div className="premium-hub-content">
                {/* Hero Section */}
                <header className="hub-hero">
                    <div className="hero-badge animate-pop">{language === 'th' ? 'จำนวนจำกัด 💎' : 'LIMITED EDITION 💎'}</div>
                    <h1 className="holographic-text">{t.premium.title}</h1>
                    <p className="hero-subtitle">{t.premium.subtitle}</p>
                </header>

                {/* Pricing Grid */}
                <section className="pricing-experience">
                    <div className="experience-grid">
                        <PricingCard
                            tier="FREE"
                            priceTHB="0"
                            features={t.premium.features.free}
                            btnText={language === 'th' ? "เทียร์พื้นฐาน" : "Standard Tier"}
                            currentPlan={userPlan?.plan_type === 'free'}
                            level={1}
                            planType="free"
                        />
                        <PricingCard
                            tier="PRO 💎"
                            priceTHB="199"
                            features={t.premium.features.pro}
                            btnText={isEligibleForTrial ? t.premium.try7Days : t.premium.getPro}
                            isFeatured={true}
                            currentPlan={userPlan?.plan_type === 'pro'}
                            level={5}
                            planType="pro"
                            onClick={isEligibleForTrial ? () => setShowClaimModal(true) : undefined}
                        />
                        <PricingCard
                            tier="PREMIUM ✨"
                            priceTHB="599"
                            features={t.premium.features.premium}
                            btnText={t.premium.getPremium}
                            isFeatured={true}
                            isPremium={true}
                            currentPlan={userPlan?.plan_type === 'premium'}
                            level={10}
                            planType="premium"
                        />
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="faq-experience">
                    <h2 className="faq-title">{t.faq.title}</h2>
                    <div className="faq-tiles">
                        {t.faq.items.map((item, index) => (
                            <div
                                key={index}
                                className={`faq-tile ${openFaq === index ? 'active' : ''}`}
                                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                            >
                                <div className="tile-header">
                                    <h3>{item.q}</h3>
                                    <div className="tile-icon">{openFaq === index ? '✦' : '✧'}</div>
                                </div>
                                <div className="tile-body">
                                    <p>{item.a}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>


            <ClaimTrialModal
                show={showClaimModal}
                loading={isClaimingTrial}
                onClose={() => setShowClaimModal(false)}
                onConfirm={handleClaimTrial}
            />
            <ResultModal
                show={modalState.show}
                type={modalState.type}
                message={modalState.message}
                onClose={() => setModalState({ ...modalState, show: false })}
            />
        </div >
    );
}
