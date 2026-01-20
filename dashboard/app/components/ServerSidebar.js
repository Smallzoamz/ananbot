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
                <div className={`guild-selector ${isDropdownOpen ? 'active' : ''}`} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                    <div className="guild-current">
                        {guildData.icon ?
                            <img className="guild-icon-small" src={guildData.icon.startsWith('http') ? guildData.icon : `https://cdn.discordapp.com/icons/${guildId}/${guildData.icon}.png`} alt="G" />
                            : <div className="guild-init-small">{guildData.name[0]}</div>
                        }
                        <span className="guild-name">{guildData.name}</span>
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

        </aside>
    );
}
