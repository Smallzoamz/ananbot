"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import { useServer } from "../context/ServerContext";
import { CrownIcon } from "./Icons";

export default function ServerSidebar() {
    const { guildId, guildData, manageableGuilds } = useServer();
    const { t } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const guildRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (guildRef.current && !guildRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isActive = (path) => pathname === path;

    if (!guildData) return null;

    return (
        <aside className="mee6-sidebar">
            <div className="guild-switcher-wrapper" ref={guildRef}>
                <div className={`guild-selector glass ${isDropdownOpen ? 'active' : ''}`} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                    <div className="guild-current">
                        {guildData.icon ?
                            <img src={guildData.icon.startsWith('http') ? guildData.icon : `https://cdn.discordapp.com/icons/${guildId}/${guildData.icon}.png`} alt="G" />
                            : <div className="guild-init">{guildData.name[0]}</div>
                        }
                        <span>{guildData.name}</span>
                        <div className="chevron">{isDropdownOpen ? "⌃" : "⌄"}</div>
                    </div>
                </div>
                {isDropdownOpen && (
                    <div className="guild-dropdown glass animate-pop">
                        <div className="dropdown-label">{t.sidebar.yourServers}</div>
                        {manageableGuilds.filter(g => g.id !== guildId).map(g => (
                            <div key={g.id} className="dropdown-item" onClick={() => {
                                setIsDropdownOpen(false);
                                router.push(`/servers/${g.id}`);
                            }}>
                                {g.icon ?
                                    <img src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`} alt="G" className="guild-icon-mini" /> :
                                    <div className="guild-init-mini">{g.name[0]}</div>
                                }
                                <span>{g.name}</span>
                            </div>
                        ))}
                        <div className="dropdown-divider"></div>
                        <div className="dropdown-item back-item" onClick={() => router.push("/servers?redirect=false")}>
                            <span className="icon">←</span>
                            <span>{t.sidebar.selection}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="sidebar-list">
                <div className={`menu-item ${isActive(`/servers/${guildId}`) ? 'active' : ''}`} onClick={() => router.push(`/servers/${guildId}`)}>
                    {t.sidebar.dashboard}
                </div>
                <div className={`menu-item ${isActive(`/servers/${guildId}/leaderboard`) ? 'active' : ''}`} onClick={() => router.push(`/servers/${guildId}/leaderboard`)}>
                    {t.sidebar.leaderboard}
                    <span className="p-badge-s" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}><CrownIcon /></span>
                </div>
                <div className={`menu-item ${isActive(`/servers/${guildId}/personalizer`) ? 'active' : ''}`} onClick={() => router.push(`/servers/${guildId}/personalizer`)}>
                    {t.sidebar.personalizer}
                </div>

                <div className="menu-category">{t.sidebar.catEssentials}</div>
                <div className={`menu-item ${isActive(`/servers/${guildId}/welcome`) ? 'active' : ''}`} onClick={() => router.push(`/servers/${guildId}/welcome`)}>
                    {t.sidebar.welcome}
                    <span className="p-badge-s" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px', marginLeft: 'auto' }}><CrownIcon /></span>
                </div>
                <div className="menu-item">{t.sidebar.reaction}</div>
                <div className="menu-item">{t.sidebar.moderator}</div>

                <div className="menu-category">{t.sidebar.catManagement}</div>
                <div className="menu-item">{t.sidebar.automation}</div>
                <div className="menu-item">{t.sidebar.commands}</div>
                <div className="menu-item" onClick={() => router.push(`/servers/${guildId}?action=clear`)}>{t.sidebar.reset}</div>
            </div>

            <div className="sidebar-footer">
                <button className="invite-btn" onClick={() => router.push("/servers?redirect=false")}>← {t.sidebar.switch}</button>
            </div>

            <style jsx>{`
                .mee6-sidebar {
                    width: 280px;
                    background: white;
                    border-right: 1px solid rgba(214, 207, 255, 0.3);
                    display: flex;
                    flex-direction: column;
                    padding: 30px 15px;
                    position: sticky;
                    top: 0;
                    height: 100vh;
                    z-index: 200;
                    box-shadow: 10px 0 30px rgba(0,0,0,0.02);
                }
                .guild-switcher-wrapper { position: relative; margin-bottom: 35px; z-index: 300; }
                .guild-selector {
                    padding: 15px;
                    border-radius: var(--radius-soft);
                    cursor: pointer;
                    background: #fdf2f8;
                    border: 1px solid rgba(255,183,226,0.2);
                    transition: 0.3s;
                }
                .guild-selector:hover, .guild-selector.active { transform: scale(1.02); background: #fce7f3; border-color: var(--primary); }
                .guild-current { display: flex; align-items: center; gap: 12px; }
                .guild-current img { width: 36px; height: 36px; border-radius: 10px; border: 2px solid white; }
                .guild-init { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; font-weight: 800; color: white; }
                .guild-current span { flex: 1; font-weight: 800; font-size: 15px; color: #4a4a68; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .chevron { opacity: 0.4; font-size: 18px; }

                .guild-dropdown {
                    position: absolute;
                    top: calc(100% + 10px);
                    left: 0;
                    width: 100%;
                    background: white;
                    border-radius: var(--radius-soft);
                    border: 1px solid rgba(139, 92, 246, 0.1);
                    box-shadow: 0 15px 40px rgba(0,0,0,0.1);
                    padding: 10px;
                    z-index: 1000;
                }
                .dropdown-label { font-size: 10px; font-weight: 900; color: #9ca3af; padding: 10px 15px; letter-spacing: 0.1em; }
                .dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 15px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: 0.2s;
                    color: #4a4a68;
                    font-weight: 700;
                    font-size: 14px;
                }
                .dropdown-item:hover { background: #f5f3ff; color: #8b5cf6; }
                .guild-icon-mini { width: 24px; height: 24px; border-radius: 6px; }
                .guild-init-mini { width: 24px; height: 24px; border-radius: 6px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; }
                .dropdown-divider { height: 1px; background: #f3f4f6; margin: 8px 0; }
                .back-item { color: #8b5cf6; background: #f5f3ff; margin-top: 5px; }

                .sidebar-list { flex: 1; overflow-y: auto; }
                .sidebar-list::-webkit-scrollbar { width: 4px; }
                .sidebar-list::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }

                .menu-item {
                    padding: 12px 18px;
                    margin-bottom: 8px;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 700;
                    color: #6b7280;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .menu-item:hover { background: #f5f3ff; color: #8b5cf6; transform: translateX(5px); }
                .menu-item.active { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(255,183,226,0.4); }
                .menu-category {
                    font-size: 11px;
                    font-weight: 900;
                    color: #9ca3af;
                    margin: 30px 0 12px 18px;
                    letter-spacing: 0.1em;
                }

                .sidebar-footer { padding-top: 20px; border-top: 1px solid #f3f4f6; }
                .invite-btn { width: 100%; padding: 14px; background: #f5f3ff; color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.3s; }
                .invite-btn:hover { background: #8b5cf6; color: white; }

                .p-badge-s { background: rgba(255,255,255,0.2); border-radius: 6px; }
                .menu-item:not(.active) .p-badge-s { background: #fffbeb; color: #d97706; border: 1px solid rgba(252,211,77,0.3); }

                @keyframes pop { from { opacity: 0; transform: scale(0.95) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .animate-pop { animation: pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            `}</style>
        </aside>
    );
}
