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
                        <div className="chevron">⌵</div>
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
                <div className={`menu-item ${isActive(`/servers/${guildId}`) ? 'active' : ''}`} onClick={() => router.push(`/servers/${guildId}`)}>{t.sidebar.dashboard}</div>
                <div className={`menu-item ${isActive(`/servers/${guildId}/leaderboard`) ? 'active' : ''}`} onClick={() => router.push(`/servers/${guildId}/leaderboard`)}>{t.sidebar.leaderboard} <span className="p-badge-s" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}><CrownIcon /></span></div>
                <div className={`menu-item ${isActive(`/servers/${guildId}/personalizer`) ? 'active' : ''}`} onClick={() => router.push(`/servers/${guildId}/personalizer`)}>{t.sidebar.personalizer}</div>

                <div className="menu-category">{t.sidebar.catEssentials}</div>
                <div className={`menu-item ${isActive(`/servers/${guildId}/welcome`) ? 'active' : ''}`} onClick={() => router.push(`/servers/${guildId}/welcome`)}>{t.sidebar.welcome} <span className="p-badge-s" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px', marginLeft: 'auto' }}><CrownIcon /></span></div>
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
                .mee6-sidebar { width: 280px; background: white; border-right: 1px solid rgba(214, 207, 255, 0.3); padding: 30px 15px; position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; }
                .guild-switcher-wrapper { position: relative; margin-bottom: 20px; }
                .guild-selector { display: flex; align-items: center; justify-content: space-between; padding: 12px 15px; border-radius: 16px; cursor: pointer; transition: 0.3s; border: 2px solid transparent; }
                .guild-selector:hover { border-color: var(--primary); background: white; box-shadow: 0 10px 25px rgba(255,183,226,0.15); }
                .guild-selector.active { border-color: var(--primary); background: white; }
                .guild-current { display: flex; align-items: center; gap: 12px; font-weight: 800; color: #4a4a68; width: 100%; }
                .guild-current img { width: 32px; height: 32px; border-radius: 10px; }
                .guild-init { width: 32px; height: 32px; border-radius: 10px; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; }
                .guild-current span { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 15px; }
                .chevron { font-size: 14px; color: #cbd5e1; }

                .sidebar-list { flex: 1; overflow-y: auto; margin-top: 10px; padding-right: 5px; }
                .sidebar-list::-webkit-scrollbar { width: 4px; }
                .sidebar-list::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
                
                .menu-item { padding: 12px 18px; margin-bottom: 5px; border-radius: 14px; font-weight: 700; color: #6b7280; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 10px; }
                .menu-item:hover { background: #fdf2f8; color: var(--primary); }
                .menu-item.active { background: var(--primary); color: white; box-shadow: 0 8px 20px rgba(255,183,226,0.4); }
                .menu-category { font-size: 11px; font-weight: 900; color: #cbd5e1; margin: 25px 0 10px 18px; text-transform: uppercase; letter-spacing: 0.1em; }
                
                .guild-dropdown { position: absolute; top: calc(100% + 10px); left: 0; right: 0; background: white; border-radius: 20px; padding: 15px; box-shadow: 0 15px 40px rgba(0,0,0,0.1); z-index: 1000; }
                .dropdown-label { font-size: 11px; font-weight: 900; color: #94a3b8; margin-bottom: 10px; padding: 0 10px; text-transform: uppercase; }
                .dropdown-item { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 12px; cursor: pointer; transition: 0.2s; }
                .dropdown-item:hover { background: #f8fafc; }
                .guild-icon-mini { width: 24px; height: 24px; border-radius: 6px; }
                .guild-init-mini { width: 24px; height: 24px; border-radius: 6px; background: #f1f5f9; color: #94a3b8; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; }
                .dropdown-item span { font-size: 14px; font-weight: 700; color: #4a4a68; }
                .dropdown-divider { height: 1px; background: #f1f5f9; margin: 10px 0; }
                .back-item { color: var(--primary); font-weight: 800; }

                .sidebar-footer { padding-top: 20px; border-top: 1px solid #f1f5f9; }
                .invite-btn { width: 100%; padding: 12px; border-radius: 14px; border: 2px solid #f1f5f9; background: white; color: #6b7280; font-weight: 800; cursor: pointer; transition: 0.3s; }
                .invite-btn:hover { border-color: var(--primary); color: var(--primary); background: #fdf2f8; }

                .p-badge-s { font-size: 10px; background: rgba(255,255,255,0.2); border-radius: 6px; }
                .menu-item:not(.active) .p-badge-s { background: #f1f5f9; color: var(--primary); }

                @keyframes pop { from { opacity: 0; transform: scale(0.95) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .animate-pop { animation: pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            `}</style>
        </aside>
    );
}
