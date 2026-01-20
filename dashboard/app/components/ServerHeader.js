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
                        <img src={session?.user?.image || "/assets/mascot/ANAN1.png"} alt="U" />
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

        </header>
    );
}
