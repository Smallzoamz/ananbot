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
                .mee6-header {
                    height: 80px;
                    border-bottom: 1px solid rgba(255, 183, 226, 0.15);
                    background: rgba(255, 255, 255, 0.4);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 40px;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }
                .logo-text { 
                    font-size: 26px; 
                    font-weight: 900; 
                    color: #ff85c1; 
                    letter-spacing: 1.5px; 
                    text-shadow: 0 2px 10px rgba(255,133,193,0.25); 
                }
                .header-right { display: flex; align-items: center; gap: 20px; }
                
                .plan-badge-top {
                    padding: 10px 22px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 0.05em;
                }
                .plan-badge-top.premium {
                    background: linear-gradient(135deg, #ff85c1, #c084fc);
                    color: white;
                    box-shadow: 0 4px 15px rgba(255,133,193,0.3);
                }
                .plan-badge-top.pro {
                    background: white;
                    color: #8b5cf6;
                    border: 1px solid rgba(139, 92, 246, 0.2);
                }

                .premium-btn {
                    background: linear-gradient(135deg, #ffc107, #ff9800);
                    color: white;
                    border: none;
                    padding: 11px 24px;
                    border-radius: 20px;
                    font-weight: 900;
                    font-size: 13px;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(255,193,7,0.35);
                    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .premium-btn:hover { transform: translateY(-2px) scale(1.02); filter: brightness(1.1); box-shadow: 0 8px 25px rgba(255,193,7,0.45); }
                
                .header-icon { font-size: 22px; color: #4a4a68; opacity: 0.5; cursor: pointer; transition: 0.3s; }
                .header-icon:hover { opacity: 1; transform: rotate(15deg); color: var(--primary); }
                
                .user-profile-wrapper { position: relative; z-index: 1000; }
                .user-profile img { width: 40px; height: 40px; border-radius: 50%; cursor: pointer; border: 3px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.08); transition: 0.3s; }
                .user-profile img:hover { border-color: var(--primary); transform: scale(1.1); box-shadow: 0 8px 25px rgba(255,183,226,0.3); }

                .profile-dropdown {
                    position: absolute;
                    top: calc(100% + 15px);
                    right: 0;
                    width: 230px;
                    background: white;
                    border-radius: 24px;
                    border: 1px solid rgba(255, 183, 226, 0.2);
                    box-shadow: 0 15px 50px rgba(0,0,0,0.12);
                    padding: 15px;
                    z-index: 2000;
                }
                .section-label { font-size: 10px; font-weight: 950; color: #cbd5e1; padding: 5px 10px 10px; letter-spacing: 0.1em; text-transform: uppercase; }
                .dropdown-link {
                    padding: 12px 14px;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 800;
                    color: #4a4a68;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .dropdown-link:hover { background: #fdf2f8; color: var(--primary); transform: translateX(5px); }
                .dropdown-divider { height: 1px; background: #fdf2f8; margin: 10px 0; }
                .logout-item { color: #ff4757; margin-top: 5px; font-weight: 900; }
                .logout-item:hover { background: #fff1f2; color: #ff4757; }

                @keyframes glow { 0%, 100% { box-shadow: 0 0 15px rgba(255,133,193,0.3); } 50% { box-shadow: 0 0 25px rgba(255,133,193,0.6); } }
                .animate-glow { animation: glow 2s infinite ease-in-out; }
                @keyframes pop { from { opacity: 0; transform: scale(0.95) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .animate-pop { animation: pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            `}</style>
        </header>
    );
}
