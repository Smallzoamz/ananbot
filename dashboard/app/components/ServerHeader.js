"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useLanguage } from "../context/LanguageContext";
import { useServer } from "../context/ServerContext";
import ClaimTrialModal from "./ClaimTrialModal";
import ResultModal from "./ResultModal";
import ChangelogModal from "./ChangelogModal";

export default function ServerHeader() {
    const { data: session } = useSession();
    const { userPlan } = useServer();
    const { t, language, toggleLanguage } = useLanguage();
    const router = useRouter();
    const isThai = language === 'th';
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef(null);
    // Modals
    const [showChangelog, setShowChangelog] = useState(false);
    const [modalState, setModalState] = useState({ show: false, type: 'info', message: '' });

    // Trial State
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [isClaimingTrial, setIsClaimingTrial] = useState(false);
    const { refreshData, guildId } = useServer();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
                refreshData(); // Refresh global server data
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

    return (
        <header className="mee6-header">
            <div className="header-left">
                <div className="logo-text">AN AN</div>
            </div>
            <div className="header-right">
                {userPlan.plan_type === "premium" ? (
                    <div className="plan-badge-top premium animate-glow">PREMIUM ✨</div>
                ) : userPlan.plan_type === "pro" ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="plan-badge-top pro">PRO 💎</div>
                        {userPlan.expires_at && !userPlan.is_lifetime && (
                            <div className="plan-badge-top" style={{ background: '#fffbeb', color: '#b45309', fontSize: '10px', boxShadow: 'none' }}>
                                {t.freeTrial?.badge?.endsIn?.replace("{days}", Math.max(0, Math.ceil((new Date(userPlan.expires_at) - Date.now()) / (1000 * 60 * 60 * 24)))) || "Trial Active"}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {userPlan.plan_type === "free" && !userPlan.trial_claimed && (
                            <button
                                className="premium-btn"
                                style={{
                                    background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                                    marginRight: '10px',
                                    border: 'none'
                                }}
                                onClick={() => setShowClaimModal(true)}
                            >
                                {t.freeTrial?.btn || (language === 'th' ? "รับ Pro ฟรี 7 วัน 🎁" : "Get Pro Free 7 Days 🎁")}
                            </button>
                        )}
                        <button className="premium-btn">Upgrade to Premium 👑</button>
                    </>
                )}
                <div className="header-icon">🔔</div>
                <div className="user-profile-wrapper" ref={profileRef}>
                    <div className="user-profile" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                        <img src={session?.user?.image || "/assets/mascot/ANAN1.png"} alt="U" />
                    </div>
                    {isProfileOpen && (
                        <div className="profile-dropdown glass animate-pop">
                            <div className="dropdown-section">
                                <div className="section-label">AN AN BOT</div>
                                <div className="dropdown-link" onClick={() => router.push(`/servers/${guildId}/rank-card`)}>{t.dashboard?.rankCard || "Personal Rank Card"}</div>
                                <div className="dropdown-link" onClick={() => router.push(`/servers/${guildId}/premium`)}>{t.dashboard?.pro || "Pro"}</div>
                                <div className="dropdown-link" onClick={() => setModalState({ show: true, type: 'info', message: isThai ? "ระบบนี้กำลังมาเร็วๆ นี้ค่า สปอยล์: คุยเก่งมาก! 🤖💕" : "AI Characters are Coming Soon! Handcrafted with ❤️" })}>{t.dashboard?.aiCharacters || "AI Characters"}</div>
                            </div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-section">
                                <div className="section-label">SERVERS OWNERS</div>
                                <div className="dropdown-link" onClick={() => router.push("/servers?redirect=false")}>{t.dashboard?.myServers || "My Servers"}</div>
                                <div className="dropdown-link" onClick={() => setModalState({ show: true, type: 'info', message: isThai ? "กรุณาติดต่อซัพพอร์ตเพื่อโอนย้ายพรีเมียมนะค๊า 🌸" : "Please contact support to transfer premium slots! 🌸" })}>{t.dashboard?.transferPremium || "Transfer Premium"}</div>
                            </div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-section">
                                <div className="section-label">{t.dashboard?.supportCat || "SUPPORT"}</div>
                                <div className="dropdown-link" onClick={() => toggleLanguage(language === 'en' ? 'th' : 'en')}>
                                    {language === 'en' ? "🇺🇸 English" : "🇹🇭 ภาษาไทย"}
                                </div>
                                <div className="dropdown-link" onClick={() => setShowChangelog(true)}>{t.dashboard?.changelogs || "Changelogs"}</div>
                                <div className="dropdown-link" onClick={() => window.open('https://discord.gg/xArvbwjVYp', '_blank')}>{t.dashboard?.supportServer || "Support Server"}</div>
                            </div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-link logout-item" onClick={() => signOut({ callbackUrl: '/login' })}>{t.selection?.logout || "Logout"}</div>
                        </div>
                    )}
                </div>
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
            <ChangelogModal
                show={showChangelog}
                onClose={() => setShowChangelog(false)}
            />
        </header>
    );
}
