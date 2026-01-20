"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useLanguage } from "../context/LanguageContext";
import { useServer } from "../context/ServerContext";

export default function ServerHeader() {
    const { data: session } = useSession();
    const { userPlan } = useServer();
    const { t } = useLanguage();
    const router = useRouter();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="mee6-header">
            <div className="header-left">
                <div className="logo-text">AN AN</div>
            </div>
            <div className="header-right">
                {userPlan.plan_type === "premium" ? (
                    <div className="plan-badge-top premium animate-glow">PREMIUM ✨</div>
                ) : userPlan.plan_type === "pro" ? (
                    <div className="plan-badge-top pro">PRO 💎</div>
                ) : (
                    <button className="premium-btn">Upgrade to Premium 👑</button>
                )}
                <div className="header-icon">🔔</div>
                <div className="user-profile-wrapper" ref={profileRef}>
                    <div className="user-profile" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                        <img src={session?.user?.image || "/ANAN1.png"} alt="U" />
                        <div className="chevron">⌵</div>
                    </div>
                    {isProfileOpen && (
                        <div className="profile-dropdown glass animate-pop">
                            <div className="dropdown-section">
                                <div className="section-label">AN AN BOT</div>
                                <div className="dropdown-link">{t.dashboard.rankCard}</div>
                                <div className="dropdown-link">{t.dashboard.pro}</div>
                                <div className="dropdown-link">{t.dashboard.aiCharacters}</div>
                            </div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-section">
                                <div className="section-label">SERVERS OWNERS</div>
                                <div className="dropdown-link" onClick={() => router.push("/servers?redirect=false")}>{t.dashboard.myServers}</div>
                                <div className="dropdown-link">{t.dashboard.transferPremium}</div>
                            </div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-section">
                                <div className="section-label">{t.dashboard.supportCat}</div>
                                <div className="dropdown-link">{t.dashboard.language}</div>
                                <div className="dropdown-link">{t.dashboard.changelogs}</div>
                                <div className="dropdown-link">{t.dashboard.supportServer}</div>
                            </div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-link logout-item" onClick={() => signOut({ callbackUrl: '/login' })}>{t.selection.logout}</div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .mee6-header { height: 80px; background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(214, 207, 255, 0.2); display: flex; align-items: center; justify-content: space-between; padding: 0 50px; position: sticky; top: 0; z-index: 100; }
                .logo-text { font-size: 24px; font-weight: 950; color: var(--primary); letter-spacing: -0.05em; }
                .header-right { display: flex; align-items: center; gap: 20px; }
                
                .plan-badge-top { padding: 8px 16px; border-radius: 12px; font-size: 12px; font-weight: 900; letter-spacing: 0.05em; }
                .plan-badge-top.premium { background: linear-gradient(135deg, #ff85c1, #ffd6ed); color: white; box-shadow: 0 0 20px rgba(255,133,193,0.4); }
                .plan-badge-top.pro { background: #d6cfff; color: #7c3aed; }
                
                .premium-btn { background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 15px rgba(255,183,226,0.3); }
                .premium-btn:hover { transform: translateY(-2px); filter: brightness(1.05); }
                
                .header-icon { font-size: 20px; color: #94a3b8; cursor: pointer; transition: 0.2s; }
                .header-icon:hover { color: var(--primary); }
                
                .user-profile-wrapper { position: relative; }
                .user-profile { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px; border-radius: 12px; transition: 0.2s; }
                .user-profile:hover { background: #f1f5f9; }
                .user-profile img { width: 36px; height: 36px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                .user-profile .chevron { font-size: 12px; color: #94a3b8; }

                .profile-dropdown { position: absolute; top: calc(100% + 15px); right: 0; width: 220px; background: white; border-radius: 20px; padding: 15px; box-shadow: 0 15px 40px rgba(0,0,0,0.1); z-index: 1000; }
                .dropdown-section { display: flex; flex-direction: column; gap: 4px; }
                .section-label { font-size: 10px; font-weight: 900; color: #cbd5e1; margin-bottom: 8px; padding: 0 10px; text-transform: uppercase; letter-spacing: 0.1em; }
                .dropdown-link { padding: 10px; border-radius: 10px; font-size: 13px; font-weight: 700; color: #64748b; cursor: pointer; transition: 0.2s; }
                .dropdown-link:hover { background: #f8fafc; color: var(--primary); }
                .dropdown-divider { height: 1px; background: #f1f5f9; margin: 10px 0; }
                .logout-item { color: #f43f5e; }
                .logout-item:hover { background: #fff1f2; color: #e11d48; }

                @keyframes glow { 0%, 100% { box-shadow: 0 0 15px rgba(255,133,193,0.3); } 50% { box-shadow: 0 0 25px rgba(255,133,193,0.6); } }
                .animate-glow { animation: glow 2s infinite ease-in-out; }
                @keyframes pop { from { opacity: 0; transform: scale(0.95) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .animate-pop { animation: pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            `}</style>
        </header>
    );
}
