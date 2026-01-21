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
    const [imgErrors, setImgErrors] = useState({});
    const guildRef = useRef(null);

    const getIconUrl = (id, hash) => {
        if (!hash) return null;
        if (hash.startsWith('http')) return hash;
        const format = hash.startsWith('a_') ? 'gif' : 'png';
        return `https://cdn.discordapp.com/icons/${id}/${hash}.${format}`;
    };

    const handleImgError = (id) => {
        setImgErrors(prev => ({ ...prev, [id]: true }));
    };

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
                        {guildData.icon && !imgErrors[guildId] ?
                            <img
                                className="guild-icon-small"
                                src={getIconUrl(guildId, guildData.icon)}
                                alt="G"
                                onError={() => handleImgError(guildId)}
                            />
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
                                {g.icon && !imgErrors[g.id] ?
                                    <img
                                        src={getIconUrl(g.id, g.icon)}
                                        alt="G"
                                        className="guild-icon-mini"
                                        onError={() => handleImgError(g.id)}
                                    /> :
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
                <div className={`menu-item ${isActive(`/servers/${guildId}/premium`) ? 'active' : ''}`} onClick={() => router.push(`/servers/${guildId}/premium`)}>
                    {t.sidebar.premiumMenu}
                </div>
                <div className={`menu-item ${isActive(`/servers/${guildId}/leaderboard`) ? 'active' : ''}`} onClick={() => router.push(`/servers/${guildId}/leaderboard`)}>
                    {t.sidebar.leaderboard}
                    <span className="crown-badge-bubble"><CrownIcon /></span>
                </div>
                <div className={`menu-item ${isActive(`/servers/${guildId}/personalizer`) ? 'active' : ''}`} onClick={() => router.push(`/servers/${guildId}/personalizer`)}>
                    {t.sidebar.personalizer}
                    <span className="crown-badge-bubble" style={{ marginLeft: 'auto' }}><CrownIcon /></span>
                </div>

                <div className="menu-category">{t.sidebar.catEssentials}</div>
                <div className={`menu-item ${isActive(`/servers/${guildId}/welcome`) ? 'active' : ''}`} onClick={() => router.push(`/servers/${guildId}/welcome`)}>
                    {t.sidebar.welcome}
                    <span className="crown-badge-bubble" style={{ marginLeft: 'auto' }}><CrownIcon /></span>
                </div>
                <div className={`menu-item ${isActive(`/servers/${guildId}/reaction-roles`) ? 'active' : ''}`} onClick={() => router.push(`/servers/${guildId}/reaction-roles`)}>
                    {t.sidebar.reaction}
                    <span className="crown-badge-bubble" style={{ marginLeft: 'auto' }}><CrownIcon /></span>
                </div>
                <div className={`menu-item ${isActive(`/servers/${guildId}/moderator`) ? 'active' : ''}`} onClick={() => router.push(`/servers/${guildId}/moderator`)}>
                    {t.sidebar.moderator}
                    <span className="crown-badge-bubble" style={{ marginLeft: 'auto' }}><CrownIcon /></span>
                </div>

                <div className="menu-category">{t.sidebar.catStream}</div>
                <div className={`menu-item ${isActive(`/servers/${guildId}/twitch-alerts`) ? 'active' : ''}`} onClick={() => router.push(`/servers/${guildId}/twitch-alerts`)}>
                    {t.sidebar.twitchAlerts}
                    <span className="crown-badge-bubble" style={{ marginLeft: 'auto' }}><CrownIcon /></span>
                </div>
                <div className={`menu-item ${isActive(`/servers/${guildId}/youtube-alerts`) ? 'active' : ''}`} onClick={() => router.push(`/servers/${guildId}/youtube-alerts`)}>
                    {t.sidebar.youtubeAlerts}
                    <span className="crown-badge-bubble" style={{ marginLeft: 'auto' }}><CrownIcon /></span>
                </div>

                <div className="menu-category">{t.sidebar.catManagement}</div>
                <div className={`menu-item ${isActive(`/servers/${guildId}/ticket`) ? 'active' : ''}`} onClick={() => router.push(`/servers/${guildId}/ticket`)}>
                    Ticket System
                    <span className="crown-badge-bubble" style={{ marginLeft: 'auto' }}><CrownIcon /></span>
                </div>
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
