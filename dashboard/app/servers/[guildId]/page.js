"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useLanguage } from "../../context/LanguageContext";

export default function GuildDashboard() {
    const { guildId } = useParams();
    const { data: session, status: authStatus } = useSession();
    const { t, language } = useLanguage();
    const [guildData, setGuildData] = useState(null);
    const [stats, setStats] = useState({ total_members: 0, online_members: 0, status: "loading" });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("All Plugins");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [manageableGuilds, setManageableGuilds] = useState([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [setupStep, setSetupStep] = useState(1); // 1: Template, 2: Flavor, 3: Details
    const [selectedTemplate, setSelectedTemplate] = useState("Shop");
    const [setupFlavor, setSetupFlavor] = useState(""); // "Friend", "Game", "Full", "Standard"
    const [extraData, setExtraData] = useState("");
    const [pendingAction, setPendingAction] = useState(null);

    // Default bitmask values (Strings for BigInt compatibility in payload if needed)
    const DEFAULT_PERMS = {
        admin: "8", // Administrator
        staff: "268553232", // View, Send, Connect, Speak, Manage Messages, Mute, Move, etc.
        member: "104190464" // View, Send, Connect, Speak, History
    };

    const [customRoles, setCustomRoles] = useState([
        { name: "SUPER ADMIN", permissions: "admin", color: "#FFD700", permissions_bitmask: DEFAULT_PERMS.admin }
    ]);
    const [customZones, setCustomZones] = useState([
        {
            name: "GENERAL",
            allowedRoles: ["SUPER ADMIN"],
            channels: [
                { name: "chat", type: "text", allowedRoles: ["SUPER ADMIN"] },
                { name: "voice", type: "voice", allowedRoles: ["SUPER ADMIN"] }
            ]
        }
    ]);
    const [activeZoneIndex, setActiveZoneIndex] = useState(0);
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [showPermsModal, setShowPermsModal] = useState(false);
    const [activeRoleIndex, setActiveRoleIndex] = useState(null);
    const [showSelectiveModal, setShowSelectiveModal] = useState(false);
    const [serverStructure, setServerStructure] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [missions, setMissions] = useState([]);
    const [userPlan, setUserPlan] = useState({ plan_type: "free" });
    const [showPricingModal, setShowPricingModal] = useState(false);
    const router = useRouter();

    const profileRef = useRef(null);
    const guildRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (guildRef.current && !guildRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (authStatus === "unauthenticated") router.push("/");
    }, [authStatus, router]);

    useEffect(() => {
        if (!guildId) return;
        localStorage.setItem("last_managed_guild_id", guildId);

        const fetchGuild = async () => {
            try {
                const res = await fetch("/api/proxy/guilds");
                const data = await res.json();
                const current = data.find(g => g.id === guildId);
                setGuildData(current);
            } catch (err) {
                console.error("Failed to fetch guild details:", err);
            } finally {
                setLoading(false);
            }
        };

        const fetchStats = async () => {
            try {
                const res = await fetch(`/api/proxy/guild/${guildId}/stats`);
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch guild stats:", err);
            }
        };

        const fetchPerms = async () => {
            try {
                const res = await fetch("/api/proxy/discord-permissions");
                const data = await res.json();
                setAvailablePermissions(data);
            } catch (err) {
                console.error("Failed to fetch permissions:", err);
            }
        };

        fetchGuild();
        fetchStats();
        fetchPerms();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, [guildId]);

    const fetchStructure = async () => {
        if (!guildId) return;
        try {
            const res = await fetch(`/api/proxy/guild/${guildId}/structure`);
            const data = await res.json();
            setServerStructure(data);
        } catch (err) {
            console.error("Failed to fetch structure:", err);
        }
    };

    const fetchMissions = async () => {
        if (!session?.user?.id) return;
        try {
            const res = await fetch("/api/proxy/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "get_missions",
                    user_id: session.user.id,
                    guild_id: guildId
                })
            });
            const data = await res.json();
            if (data.missions) setMissions(data.missions);
            if (data.plan) setUserPlan(data.plan);
        } catch (err) {
            console.error("Failed to fetch missions:", err);
        }
    };

    useEffect(() => {
        if (!guildId) return;
        fetchStructure();
        fetchMissions();
    }, [guildId, session]);

    const handleDeleteSelective = async () => {
        if (selectedIds.length === 0) return;
        setIsDeleting(true);
        try {
            const res = await fetch("/api/proxy/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "delete_selective",
                    ids: selectedIds,
                    guild_id: guildId
                })
            });
            const data = await res.json();
            if (data.status) {
                alert("Selective deletion started! ✨");
                setShowSelectiveModal(false);
                setSelectedIds([]);
            }
        } catch (err) {
            console.error("Delete Error:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleSelection = (id, targetType = "channel", children = []) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                if (targetType === "category") {
                    return prev.filter(item => item !== id && !children.some(c => c.id === item));
                }
                return prev.filter(item => item !== id);
            } else {
                if (targetType === "category") {
                    const childrenIds = children.map(c => c.id);
                    return Array.from(new Set([...prev, id, ...childrenIds]));
                }
                return [...prev, id];
            }
        });
    };

    // Fetch manageable guilds for dropdown
    useEffect(() => {
        if (authStatus !== "authenticated") return;

        const fetchManageable = async () => {
            try {
                // Use session cache if available
                const cached = sessionStorage.getItem("discord_guilds_cache");
                let guilds;
                if (cached) {
                    guilds = JSON.parse(cached);
                } else {
                    const res = await fetch("https://discord.com/api/users/@me/guilds", {
                        headers: { Authorization: `Bearer ${session.accessToken}` },
                    });
                    guilds = await res.json();
                    if (Array.isArray(guilds)) {
                        sessionStorage.setItem("discord_guilds_cache", JSON.stringify(guilds));
                        sessionStorage.setItem("discord_guilds_cache_time", Date.now().toString());
                    }
                }

                // Also fetch bot guilds to know which ones we can switch TO
                const botRes = await fetch("/api/proxy/guilds");
                const botG = await botRes.json();

                if (Array.isArray(guilds)) {
                    const manageable = guilds.filter(g =>
                        ((g.permissions & 0x8) || (g.permissions & 0x20) || g.owner) &&
                        botG.some(bg => bg.id === g.id)
                    );
                    setManageableGuilds(manageable);
                }
            } catch (err) {
                console.error("Failed to fetch manageable guilds:", err);
            }
        };
        fetchManageable();
    }, [authStatus, session]);

    const handleAction = async (action, template = "Shop") => {
        // Intercept destructive actions
        if (action === "clear" && !showConfirmModal) {
            setPendingAction({ action, template });
            setShowConfirmModal(true);
            return;
        }

        if (action === "setup" && !showSetupModal) {
            setSetupStep(1);
            setSetupFlavor("");
            setExtraData("");
            setShowSetupModal(true);
            return;
        }

        try {
            // Prepare extra_data based on template
            let finalExtra = {};
            if (action === "setup") {
                if (template === "Shop") {
                    finalExtra = { options: setupFlavor === "Full" ? ["Nitro", "Stream Status", "เม็ด Boost"] : ["Nitro", "Stream Status"] };
                } else if (template === "Community") {
                    if (setupFlavor === "Game") {
                        finalExtra = { games: extraData.split(",").map(s => s.trim()) };
                    }
                    // Friend has no extra_data
                    finalExtra = { platforms: extraData.split(",").map(s => s.trim()) };
                } else if (template === "Custom") {
                    finalExtra = {
                        custom_roles: customRoles.map(r => ({
                            name: r.name,
                            color: r.color,
                            permissions: r.permissions,
                            permissions_bitmask: r.permissions_bitmask // Send bitmask if it exists
                        })),
                        custom_zones: customZones
                    };
                }
            }

            const res = await fetch("/api/proxy/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    template,
                    guild_id: guildId,
                    user_id: session?.user?.id,
                    extra_data: finalExtra
                })
            });
            const data = await res.json();
            if (data.status) {
                alert(`Successfully triggered: ${action}! ✨`);
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            console.error("Dashboard Fetch Error (Action):", err.message, err);
            alert("Failed to communicate with An An Bot API.");
        } finally {
            setShowConfirmModal(false);
            setShowSetupModal(false);
            setPendingAction(null);
        }
    };

    const handleClaimReward = async (missionKey) => {
        if (!session?.user?.id) return;
        try {
            const res = await fetch("/api/proxy/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "claim_mission",
                    user_id: session.user.id,
                    mission_key: missionKey
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Claimed ${data.xp_added} XP! 🌸✨`);
                fetchMissions();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            console.error("Claim Error:", err);
        }
    };

    if (loading) return <div className="loader">🌸 Fetching Server Secrets...</div>;
    if (!guildData) return <div className="loader">❌ Server Not Found</div>;

    const tabs = ["All Plugins", "Essentials", "Server Management", "Security", "Utilities"];

    return (
        <div className="mee6-container">
            {/* Sidebar */}
            <aside className="mee6-sidebar">
                <div className="guild-switcher-wrapper" ref={guildRef}>
                    <div className={`guild-selector glass ${isDropdownOpen ? 'active' : ''}`} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                        <div className="guild-current">
                            {guildData.icon ? <img src={guildData.icon} alt="G" /> : <div className="guild-init">{guildData.name[0]}</div>}
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
                    <div className="menu-item active">{t.sidebar.dashboard}</div>
                    <div className="menu-item" onClick={() => router.push(`/servers/${guildId}/leaderboard`)}>{t.sidebar.leaderboard} <span className="p-badge-s">{t.dashboard.pro}</span></div>
                    <div className="menu-item">{t.sidebar.personalizer}</div>

                    <div className="menu-category">{t.sidebar.catEssentials}</div>
                    <div className="menu-item" onClick={() => router.push(`/servers/${guildId}/welcome`)}>{t.sidebar.welcome}</div>
                    <div className="menu-item">{t.sidebar.reaction}</div>
                    <div className="menu-item">{t.sidebar.moderator}</div>

                    <div className="menu-category">{t.sidebar.catManagement}</div>
                    <div className="menu-item">{t.sidebar.automation}</div>
                    <div className="menu-item">{t.sidebar.commands}</div>
                    <div className="menu-item" onClick={() => handleAction("clear")}>{t.sidebar.reset}</div>
                </div>

                <div className="sidebar-footer">
                    <button className="invite-btn" onClick={() => router.push("/servers?redirect=false")}>← {t.sidebar.switch}</button>
                </div>
            </aside>

            {/* Main Wrapper */}
            <div className="mee6-main-wrapper">
                {/* Header */}
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
                            <button className="premium-btn" onClick={() => setShowPricingModal(true)}>Upgrade to Premium 👑</button>
                        )}
                        <div className="header-icon">🔔</div>
                        <div className="user-profile-wrapper" ref={profileRef}>
                            <div className="user-profile" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                                <img src={session?.user?.image} alt="U" />
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

                {/* Content Area */}
                <main className="mee6-content animate-fade">
                    {/* Membership Pricing Modal UI */}
                    {showPricingModal && (
                        <div className="modal-overlay blur-in" onClick={() => setShowPricingModal(false)}>
                            <div className="pricing-modal glass animate-pop" onClick={e => e.stopPropagation()}>
                                <div className="pricing-header">
                                    <h2>Choose Your <span>Power</span> 👑</h2>
                                    <p>Unlock exclusive features to grow your community 🌸</p>
                                    <button className="close-x" onClick={() => setShowPricingModal(false)}>×</button>
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
                                        <button className="p-btn disabled">Current Plan</button>
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
                                        <button className="p-btn pro">Get Pro 🚀</button>
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
                                        <button className="p-btn premium">Get Premium 👑</button>
                                    </div>
                                </div>
                                <div className="pricing-footer">
                                    <p>An An will handle everything for Papa! 🌸💖</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {showConfirmModal && (
                        <div className="modal-overlay blur-in">
                            <div className="modal-card mini-card glass animate-pop">
                                <h3>⚠️ {t.dashboard.modal.confirm}</h3>
                                <div className="modal-actions">
                                    <button className="confirm-btn danger" onClick={() => { setShowConfirmModal(false); pendingAction(); }}>Reset Now</button>
                                    <button className="cancel-btn" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Hero Banner (Mission Center) */}
                    <div className="hero-banner mission-center">
                        <div className="hero-bg-anime">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(lvl => (
                                <div
                                    key={lvl}
                                    className={`hero-bg-icon lvl-${lvl}`}
                                    style={{ backgroundImage: `url('/assets/levels/LV${lvl}.png')` }}
                                ></div>
                            ))}
                        </div>
                        <div className="hero-text">
                            <h1>Grow your server with <span>Missions</span></h1>
                            <div className="hero-buttons">
                                <button className="hero-btn primary" onClick={() => router.push(`/servers/${guildId}/leaderboard`)}>Do a Mission 🚀</button>
                                <button className="hero-btn secondary" onClick={() => router.push(`/servers/${guildId}/leaderboard`)}>View Rewards</button>
                            </div>
                        </div>

                        <div className="mission-card-wrapper animate-float">
                            <div className="mission-leaderboard glass animate-pop">
                                <span>🏆 Leaderboard</span>
                            </div>
                            <div className="mission-card glass">
                                <div className="mc-header">
                                    <div className="mc-title">
                                        <span className="mc-icon">🎯</span>
                                        <span>Active Missions</span>
                                    </div>
                                    <div className="mc-done">{missions.filter(m => m.current_count >= m.target_count).length}/{missions.length} Done</div>
                                </div>
                                <div className="mission-list">
                                    {missions.length > 0 ? (
                                        missions.map(m => (
                                            <div key={m.key} className={`mission-item ${m.current_count >= m.target_count ? 'completed' : ''}`}>
                                                <div className="mi-info">
                                                    <div className="mi-head">
                                                        <span>{language === 'en' ? m.description_en : m.description_th}</span>
                                                        <span className="mi-xp">+{m.reward_xp} XP</span>
                                                    </div>
                                                    {m.current_count < m.target_count ? (
                                                        <div className="mi-progress-bar">
                                                            <div className="mi-progress-fill" style={{ width: `${Math.min(100, (m.current_count / m.target_count) * 100)}%` }}></div>
                                                        </div>
                                                    ) : (
                                                        <div className="mi-claimed-status">
                                                            {m.is_claimed ? <span>Claimed ✅</span> : <button className="claim-btn-mini" onClick={() => handleClaimReward(m.key)}>Claim Reward! 🎁</button>}
                                                        </div>
                                                    )}
                                                </div>
                                                {m.current_count >= m.target_count && m.is_claimed && <div className="mi-check">✓</div>}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="loader-mini">Loading Missions...</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="hero-stats">
                            <div className="mini-stat">
                                <div className="ms-val">{stats.total_members}</div>
                                <div className="ms-lab">Members</div>
                            </div>
                            <div className="mini-stat">
                                <div className="ms-val">{stats.online_members}</div>
                                <div className="ms-lab">Online</div>
                            </div>
                        </div>
                    </div>

                    {/* Plugins Section */}
                    <div className="plugins-section">
                        <h2>Plugins</h2>
                        <div className="plugin-tabs">
                            {tabs.map(tab => (
                                <div
                                    key={tab}
                                    className={`tab-item ${activeTab === tab ? "active" : ""}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </div>
                            ))}
                        </div>

                        <div className="plugins-grid">
                            {(() => {
                                const plugins = [
                                    {
                                        id: "clear",
                                        name: "Clear & Reset",
                                        icon: "🧹",
                                        badge: "ESSENTIAL",
                                        badgeClass: "p-badge",
                                        category: "Essentials",
                                        desc: "Wipe all channels and roles instantly to prepare for clean deployment.",
                                        action: () => handleAction("clear"),
                                        btnText: "+ Enable"
                                    },
                                    {
                                        id: "welcome",
                                        name: "Welcome & Goodbye",
                                        icon: "👋",
                                        badge: "ESSENTIAL",
                                        badgeClass: "p-badge",
                                        category: "Essentials",
                                        desc: "Greet new members and say goodbye with style. Fully customizable messages and images.",
                                        action: () => router.push(`/servers/${guildId}/welcome`),
                                        btnText: "Configure",
                                        isActive: true
                                    },
                                    {
                                        id: "setup",
                                        name: "Template Deploy",
                                        icon: "🪄",
                                        badge: "ESSENTIAL",
                                        badgeClass: "p-badge",
                                        category: "Essentials",
                                        desc: "Deploy professional server templates (Shop, Community, etc.) with An An 🌸",
                                        action: () => handleAction("setup"),
                                        btnText: "Manage",
                                        isActive: true
                                    },
                                    {
                                        id: "structure",
                                        name: "Structure Manager",
                                        icon: "🏗️",
                                        badge: "PRO",
                                        badgeClass: "p-badge-s",
                                        category: "Server Management",
                                        desc: "Selectively delete categories or specific channels from your server.",
                                        action: () => { fetchStructure(); setShowSelectiveModal(true); },
                                        btnText: "+ Configure"
                                    },
                                    {
                                        id: "terminal",
                                        name: "anan-terminal",
                                        icon: "💻",
                                        badge: "PREMIUM",
                                        badgeClass: "p-badge-s",
                                        category: "Utilities",
                                        desc: "Exclusive command center for Papa and Server Owners only.",
                                        action: null,
                                        btnText: "Settings",
                                        isActive: true
                                    },
                                    {
                                        id: "security",
                                        name: "Security Center",
                                        icon: "🛡️",
                                        badge: "PREMIUM",
                                        badgeClass: "p-badge-s",
                                        category: "Security",
                                        desc: "Protect your server with instant lockdown and audit log visibility.",
                                        action: () => setActiveTab("Security"),
                                        btnText: "+ Enable"
                                    },
                                    {
                                        id: "temproom",
                                        name: "Temporary Rooms",
                                        icon: "🔊",
                                        badge: "PRO",
                                        badgeClass: "p-badge pro",
                                        category: "Utilities",
                                        desc: "Auto-create voice channels for users. Empty rooms delete automatically.",
                                        action: () => handleAction("setup_temproom"),
                                        btnText: "+ Enable"
                                    }
                                ];

                                const filteredPlugins = activeTab === "All Plugins"
                                    ? plugins
                                    : plugins.filter(p => p.category === activeTab);

                                return filteredPlugins.map((plugin, index) => (
                                    <div key={plugin.id} className="plugin-card glass">
                                        <div className="pc-header">
                                            <div className="pc-icon">{plugin.icon}</div>
                                            <div className={plugin.badgeClass}>{plugin.badge}</div>
                                        </div>
                                        <div className="pc-body">
                                            <h3>{plugin.name}</h3>
                                            <p>{plugin.desc}</p>
                                        </div>
                                        <div className="pc-footer">
                                            <button
                                                className={`pc-btn ${plugin.isActive ? 'active' : ''}`}
                                                onClick={plugin.action}
                                            >
                                                {plugin.btnText}
                                            </button>
                                        </div>
                                        <div
                                            className="plugin-sitting-icon"
                                            style={{
                                                backgroundImage: `url('/assets/levels/LV${(index % 10) + 1}.png')`
                                            }}
                                        ></div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </main>

                {/* Safety Confirmation Modal */}
                {showConfirmModal && (
                    <div className="modal-overlay">
                        <div className="modal-card glass animate-pop">
                            <div className="modal-icon">⚠️</div>
                            <h2>Are you sure, Papa?</h2>
                            <p>
                                This will <strong>wipe all channels and roles</strong> instantly to prepare for a clean deployment.
                                This action is permanent and cannot be undone!
                            </p>
                            <div className="modal-actions">
                                <button className="modal-btn secondary" onClick={() => setShowConfirmModal(false)}>
                                    No, take me back! 🌸
                                </button>
                                <button
                                    className="modal-btn primary-danger"
                                    onClick={() => handleAction(pendingAction.action, pendingAction.template)}
                                >
                                    Yes, Clean & Reset! 🚀
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Advanced Permissions Modal */}
                {showPermsModal && activeRoleIndex !== null && (
                    <div className="modal-overlay blur-in" style={{ zIndex: 4000 }}>
                        <div className="modal-card perms-modal glass animate-pop">
                            <div className="modal-header">
                                <div>
                                    <h2>Advanced Permissions</h2>
                                    <p>Configure granular rights for <strong>{customRoles[activeRoleIndex]?.name || 'Role'}</strong></p>
                                </div>
                                <button className="modal-close" onClick={() => setShowPermsModal(false)}>×</button>
                            </div>
                            <div className="perms-grid">
                                {availablePermissions.map(p => {
                                    const currentBitmask = BigInt(customRoles[activeRoleIndex]?.permissions_bitmask || 0);
                                    const permValue = BigInt(p.value);
                                    const isSet = (currentBitmask & permValue) === permValue;

                                    return (
                                        <div
                                            key={p.id}
                                            className={`perm-toggle-item ${isSet ? 'active' : ''}`}
                                            onClick={() => {
                                                const newRoles = [...customRoles];
                                                let newBitmask;
                                                if (isSet) {
                                                    newBitmask = currentBitmask & ~permValue;
                                                } else {
                                                    newBitmask = currentBitmask | permValue;
                                                }
                                                newRoles[activeRoleIndex].permissions_bitmask = newBitmask.toString();
                                                setCustomRoles(newRoles);
                                            }}
                                        >
                                            <div className="perm-info">
                                                <span className="p-name">{p.name}</span>
                                                <span className="p-id">{p.id}</span>
                                            </div>
                                            <div className="p-switch">
                                                <div className="switch-knob"></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="modal-actions">
                                <button className="modal-btn primary" onClick={() => setShowPermsModal(false)}>Save & Close</button>
                                <button className="modal-btn ghost" onClick={() => {
                                    const newRoles = [...customRoles];
                                    delete newRoles[activeRoleIndex].permissions_bitmask;
                                    setCustomRoles(newRoles);
                                    setShowPermsModal(false);
                                }}>Reset to Default</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Setup Selection Modal */}
                {showSetupModal && (
                    <div className="modal-overlay blur-in" style={{ zIndex: 1000 }}>
                        <div className={`modal-card glass animate-pop-slow ${setupStep === 'custom_roles' || setupStep === 'custom_zones' ? 'setup-modal' : ''}`}>
                            <div className="modal-header">
                                <div>
                                    <h2>{t.dashboard.modal.title}</h2>
                                    <p>
                                        {setupStep === 'custom_roles' ? t.dashboard.modal.stepCustomRoles :
                                            setupStep === 'custom_zones' ? t.dashboard.modal.stepCustomZones :
                                                `Phase ${setupStep} of 3 • ${setupStep === 1 ? t.dashboard.modal.step1 : setupStep === 2 ? t.dashboard.modal.step2 : t.dashboard.modal.step3}`}
                                    </p>
                                </div>
                                <button className="modal-close" onClick={() => setShowSetupModal(false)}>×</button>
                            </div>

                            {setupStep === 1 && (
                                <div className="setup-grid">
                                    <div className="setup-option" onClick={() => { setSelectedTemplate("Shop"); setSetupStep(2); }}>
                                        <div className="so-icon">🛒</div>
                                        <div className="so-info">
                                            <h4>Shop (ร้านค้า)</h4>
                                            <p>Optimized for selling nitro & services.</p>
                                        </div>
                                        <div className="so-arrow">→</div>
                                    </div>

                                    <div className="setup-option" onClick={() => { setSelectedTemplate("Community"); setSetupStep(2); }}>
                                        <div className="so-icon">🎮</div>
                                        <div className="so-info">
                                            <h4>Community (คอมมู)</h4>
                                            <p>Social spaces for friends or gamers.</p>
                                        </div>
                                        <div className="so-arrow">→</div>
                                    </div>

                                    <div className="setup-option" onClick={() => { setSelectedTemplate("Fanclub"); setSetupStep(3); }}>
                                        <div className="so-icon">👑</div>
                                        <div className="so-info">
                                            <h4>Fanclub (แฟนคลับ)</h4>
                                            <p>Perfect for streamers & creators.</p>
                                        </div>
                                        <div className="so-arrow">→</div>
                                    </div>

                                    <div className="setup-option custom-opt" onClick={() => { setSelectedTemplate("Custom"); setSetupStep('custom_roles'); }}>
                                        <div className="so-icon">🎨</div>
                                        <div className="so-info">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <h4>{t.dashboard.custom}</h4>
                                                <span className="p-badge-s">PRO</span>
                                            </div>
                                            <p>{t.dashboard.customDesc}</p>
                                        </div>
                                        <div className="so-arrow">→</div>
                                    </div>
                                </div>
                            )}

                            {setupStep === 2 && (
                                <div className="setup-grid animate-fade">
                                    {selectedTemplate === "Shop" ? (
                                        <>
                                            <div className="setup-option" onClick={() => { setSetupFlavor("Full"); handleAction("setup", "Shop"); }}>
                                                <div className="so-icon">💎</div>
                                                <div className="so-info">
                                                    <h4>Full Pack (จัดเต็ม)</h4>
                                                    <p>Includes Nitro, Status, and Boost zones.</p>
                                                </div>
                                                <div className="so-arrow">✓</div>
                                            </div>
                                            <div className="setup-option" onClick={() => { setSetupFlavor("Standard"); handleAction("setup", "Shop"); }}>
                                                <div className="so-icon">🛒</div>
                                                <div className="so-info">
                                                    <h4>Standard Pack (มาตรฐาน)</h4>
                                                    <p>Includes Nitro & Status zones only.</p>
                                                </div>
                                                <div className="so-arrow">✓</div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="setup-option" onClick={() => { setSetupFlavor("Friend"); handleAction("setup", "Community"); }}>
                                                <div className="so-icon">👥</div>
                                                <div className="so-info">
                                                    <h4>สายแชททั่วไป (Friend)</h4>
                                                    <p>Social spaces for general chatting.</p>
                                                </div>
                                                <div className="so-arrow">✓</div>
                                            </div>
                                            <div className="setup-option" onClick={() => { setSetupFlavor("Game"); setSetupStep(3); }}>
                                                <div className="so-icon">🎮</div>
                                                <div className="so-info">
                                                    <h4>สายเกมเมอร์ (Game)</h4>
                                                    <p>Add specific game categories!</p>
                                                </div>
                                                <div className="so-arrow">→</div>
                                            </div>
                                        </>
                                    )}
                                    <button className="modal-btn ghost" onClick={() => setSetupStep(1)}>← Back to selection</button>
                                </div>
                            )}

                            {setupStep === 3 && (
                                <div className="setup-config-area animate-fade">
                                    <div className="config-group">
                                        <label>
                                            {selectedTemplate === "Community" ? "List of Games (comma separated)" : "List of Platforms (comma separated)"}
                                        </label>
                                        <input
                                            className="cute-input"
                                            placeholder={selectedTemplate === "Community" ? "Valorant, Roblox, Minecraft" : "Twitch, YouTube, TikTok"}
                                            value={extraData}
                                            onChange={(e) => setExtraData(e.target.value)}
                                            autoFocus
                                        />
                                        <span className="input-hint">An An will create dedicated zones for each item! 🪄</span>
                                    </div>

                                    <div className="modal-actions-v">
                                        <button
                                            className="modal-btn primary"
                                            onClick={() => handleAction("setup", selectedTemplate)}
                                        >
                                            Create My Server! ✨
                                        </button>
                                        <button className="modal-btn ghost" onClick={() => setSetupStep(selectedTemplate === "Fanclub" ? 1 : 2)}>
                                            ← Back
                                        </button>
                                    </div>
                                </div>
                            )}

                            {setupStep === 'custom_roles' && (
                                <div className="setup-config-area animate-fade">
                                    <div className="custom-list">
                                        {customRoles.map((role, idx) => (
                                            <div key={idx} className="custom-item glass">
                                                <input
                                                    type="color"
                                                    className="role-color-picker"
                                                    value={role.color}
                                                    onChange={(e) => {
                                                        const NewR = [...customRoles];
                                                        NewR[idx].color = e.target.value;
                                                        setCustomRoles(NewR);
                                                    }}
                                                />
                                                <input
                                                    className="mini-input"
                                                    placeholder="Role Name (e.g. VIP)"
                                                    value={role.name}
                                                    onChange={(e) => {
                                                        const NewR = [...customRoles];
                                                        NewR[idx].name = e.target.value;
                                                        setCustomRoles(NewR);
                                                    }}
                                                />
                                                <select
                                                    className="mini-select"
                                                    value={role.permissions}
                                                    onChange={(e) => {
                                                        const pType = e.target.value;
                                                        const NewR = [...customRoles];
                                                        NewR[idx].permissions = pType;
                                                        // Automatically update bitmask if it wasn't manually customized yet, 
                                                        // or if user is switching between defaults.
                                                        NewR[idx].permissions_bitmask = DEFAULT_PERMS[pType];
                                                        setCustomRoles(NewR);
                                                    }}
                                                >
                                                    <option value="member">Member</option>
                                                    <option value="staff">Staff</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                <button
                                                    className={`mini-perm-btn ${role.permissions_bitmask ? 'active' : ''}`}
                                                    onClick={() => { setActiveRoleIndex(idx); setShowPermsModal(true); }}
                                                    title="Advanced Permissions"
                                                >
                                                    🛡️
                                                </button>
                                                <button className="del-btn" onClick={() => setCustomRoles(customRoles.filter((_, i) => i !== idx))}>×</button>
                                            </div>
                                        ))}
                                        <button className="add-btn" onClick={() => setCustomRoles([...customRoles, { name: "NEW ROLE", permissions: "member", color: "#FFFFFF", permissions_bitmask: DEFAULT_PERMS.member }])}>+ Add Role</button>
                                    </div>
                                    <div className="modal-actions-v" style={{ marginTop: '20px' }}>
                                        <button className="modal-btn primary" onClick={() => setSetupStep('custom_zones')}>Next Step →</button>
                                        <button className="modal-btn ghost" onClick={() => setSetupStep(1)}>← Back</button>
                                    </div>
                                </div>
                            )}

                            {setupStep === 'custom_zones' && (
                                <div className="setup-config-area animate-fade">
                                    <div className="custom-split">
                                        {/* Categories List */}
                                        <div className="split-left">
                                            <label>Categories</label>
                                            {customZones.map((zone, idx) => (
                                                <div key={idx} className={`zone-tab ${activeZoneIndex === idx ? 'active' : ''}`} onClick={() => setActiveZoneIndex(idx)}>
                                                    <div className="zone-tab-main">
                                                        <input
                                                            value={zone.name}
                                                            onChange={(e) => {
                                                                const NewZ = [...customZones];
                                                                NewZ[idx].name = e.target.value.toUpperCase();
                                                                setCustomZones(NewZ);
                                                            }}
                                                        />
                                                        <button className="zone-del" onClick={(e) => { e.stopPropagation(); setCustomZones(customZones.filter((_, i) => i !== idx)); }}>×</button>
                                                    </div>
                                                    <div className="zone-access" onClick={(e) => e.stopPropagation()}>
                                                        <div className="access-tags">
                                                            {customRoles.map(role => (
                                                                <span
                                                                    key={role.name}
                                                                    className={`access-tag mini ${zone.allowedRoles?.includes(role.name) ? 'active' : ''}`}
                                                                    onClick={() => {
                                                                        const NewZ = [...customZones];
                                                                        const current = NewZ[idx].allowedRoles || [];
                                                                        if (current.includes(role.name)) {
                                                                            NewZ[idx].allowedRoles = current.filter(r => r !== role.name);
                                                                        } else {
                                                                            NewZ[idx].allowedRoles = [...current, role.name];
                                                                        }
                                                                        setCustomZones(NewZ);
                                                                    }}
                                                                >
                                                                    {role.name[0]}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button className="add-zone" onClick={() => setCustomZones([...customZones, { name: "NEW ZONE", channels: [], allowedRoles: ["SUPER ADMIN"] }])}>+</button>
                                        </div>

                                        {/* Channels List for Active Category */}
                                        <div className="split-right">
                                            <label>Channels in {customZones[activeZoneIndex]?.name}</label>
                                            <div className="chan-list">
                                                {customZones[activeZoneIndex]?.channels.map((ch, idx) => (
                                                    <div key={idx} className="chan-row">
                                                        <div className="chan-item-main">
                                                            <span className="ch-type-icon">{ch.type === 'text' ? '#' : '🔊'}</span>
                                                            <input
                                                                value={ch.name}
                                                                onChange={(e) => {
                                                                    const NewZ = [...customZones];
                                                                    NewZ[activeZoneIndex].channels[idx].name = e.target.value;
                                                                    setCustomZones(NewZ);
                                                                }}
                                                            />
                                                            <div className="chan-access-horizontal">
                                                                {customRoles.map(role => (
                                                                    <span
                                                                        key={role.name}
                                                                        className={`access-tag mini-dot ${ch.allowedRoles?.includes(role.name) ? 'active' : ''}`}
                                                                        title={role.name}
                                                                        onClick={() => {
                                                                            const NewZ = [...customZones];
                                                                            const current = NewZ[activeZoneIndex].channels[idx].allowedRoles || [];
                                                                            if (current.includes(role.name)) {
                                                                                NewZ[activeZoneIndex].channels[idx].allowedRoles = current.filter(r => r !== role.name);
                                                                            } else {
                                                                                NewZ[activeZoneIndex].channels[idx].allowedRoles = [...current, role.name];
                                                                            }
                                                                            setCustomZones(NewZ);
                                                                        }}
                                                                    >
                                                                        {role.name[0]}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <button className="ch-del" onClick={() => {
                                                                const NewZ = [...customZones];
                                                                NewZ[activeZoneIndex].channels = NewZ[activeZoneIndex].channels.filter((_, i) => i !== idx);
                                                                setCustomZones(NewZ);
                                                            }}>×</button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="chan-adds">
                                                    <button onClick={() => {
                                                        const NewZ = [...customZones];
                                                        NewZ[activeZoneIndex].channels.push({ name: "new-text", type: "text", allowedRoles: ["SUPER ADMIN"] });
                                                        setCustomZones(NewZ);
                                                    }}>+ Text</button>
                                                    <button onClick={() => {
                                                        const NewZ = [...customZones];
                                                        NewZ[activeZoneIndex].channels.push({ name: "New Voice", type: "voice", allowedRoles: ["SUPER ADMIN"] });
                                                        setCustomZones(NewZ);
                                                    }}>+ Voice</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Role Legend Tips */}
                                    <div className="role-legend glass animate-fade" style={{ marginTop: '20px', padding: '12px 20px', borderRadius: '15px' }}>
                                        <div className="legend-title">💡 Role Legend (Tips)</div>
                                        <div className="legend-items">
                                            {customRoles.map(role => (
                                                <div key={role.name} className="legend-item">
                                                    <span className="dot-preview active">{role.name[0]}</span>
                                                    <span className="dot-fullname">: {role.name}</span>
                                                </div>
                                            ))}
                                            <div className="legend-note">Click the dots to toggle access for each category/channel! ✨</div>
                                        </div>
                                    </div>

                                    <div className="modal-actions-v" style={{ marginTop: '30px' }}>
                                        <button className="modal-btn primary" onClick={() => handleAction("setup", "Custom")}>Create My Server! ✨</button>
                                        <button className="modal-btn ghost" onClick={() => setSetupStep('custom_roles')}>← Back to Roles</button>
                                    </div>
                                </div>
                            )}

                            {setupStep === 1 && (
                                <button className="modal-btn secondary" style={{ marginTop: '20px' }} onClick={() => setShowSetupModal(false)}>
                                    Not now, maybe later 🌸
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Selective Management Modal */}
                {showSelectiveModal && (
                    <div className="modal-overlay blur-in">
                        <div className="modal-card wide-card glass animate-pop" style={{ textAlign: 'left' }}>
                            <button className="modal-close" onClick={() => setShowSelectiveModal(false)}>×</button>

                            <div className="selective-header">
                                <div className="m-icon">🏗️</div>
                                <div className="m-title">
                                    <h3>Structure Manager</h3>
                                    <p>จัดการโครงสร้างเซิร์ฟเวอร์แบบเจาะจง</p>
                                </div>
                            </div>

                            <div className="selective-body discord-sidebar custom-list">
                                {serverStructure.map(cat => (
                                    <div key={cat.id} className="discord-cat-section">
                                        <div className="discord-cat-header" onClick={() => toggleSelection(cat.id, "category", cat.channels)}>
                                            <div className="ch-checkbox-wrap">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(cat.id)}
                                                    onChange={() => { }}
                                                    className="m-checkbox"
                                                />
                                            </div>
                                            <span className="cat-arrow">{cat.name === "UNCATEGORIZED" ? "📂" : "⌵"}</span>
                                            <span className="cat-name">{cat.name.toUpperCase()}</span>
                                            <span className="cat-count">{cat.channels.length}</span>
                                        </div>
                                        <div className="discord-ch-list">
                                            {cat.channels.map(ch => (
                                                <div key={ch.id} className={`discord-ch-item ${selectedIds.includes(ch.id) ? 'selected' : ''}`} onClick={(e) => { e.stopPropagation(); toggleSelection(ch.id); }}>
                                                    <div className="ch-checkbox-wrap">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(ch.id)}
                                                            onChange={() => { }}
                                                            className="m-checkbox"
                                                        />
                                                    </div>
                                                    <span className="ch-icon">
                                                        {ch.type === "0" || ch.type === "text" ? "#" : (ch.type === "2" || ch.type === "voice" ? "🔊" : "💬")}
                                                    </span>
                                                    <span className="ch-name">{ch.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="modal-footer">
                                <div className="selection-count">Selected: <b>{selectedIds.length}</b> items</div>
                                <div className="modal-actions-row">
                                    <button className="modal-btn ghost" onClick={() => setShowSelectiveModal(false)}>ยกเลิก</button>
                                    <button
                                        className="modal-btn danger"
                                        onClick={handleDeleteSelective}
                                        disabled={selectedIds.length === 0 || isDeleting}
                                    >
                                        {isDeleting ? "กำลังลบ..." : `ลบรายการที่เลือก (${selectedIds.length})`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .mee6-container {
                    display: flex;
                    min-height: 100vh;
                    background: #fdf2f8; /* Darker pastel pink for depth */
                    color: #4a4a68;
                    font-family: var(--font-main);
                }

                /* Sidebar & Switcher */
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

                .sidebar-list { flex: 1; }
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

                /* Header */
                .mee6-main-wrapper { flex: 1; display: flex; flex-direction: column; }
                .mee6-header {
                    height: 80px;
                    border-bottom: 1px solid rgba(214, 207, 255, 0.2);
                    background: rgba(255, 255, 255, 0.6);
                    backdrop-filter: blur(12px);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 50px;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }
                .logo-text { font-size: 24px; font-weight: 900; color: #ff85c1; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(255,133,193,0.1); }
                .header-right { display: flex; align-items: center; gap: 25px; }
                .premium-btn {
                    background: linear-gradient(135deg, #ffc107, #ff9800);
                    color: white;
                    border: none;
                    padding: 10px 22px;
                    border-radius: 20px;
                    font-weight: 800;
                    font-size: 13px;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(255,193,7,0.3);
                    transition: 0.3s;
                }
                .premium-btn:hover { transform: scale(1.05); filter: brightness(1.1); }
                .header-icon { font-size: 22px; color: #4a4a68; opacity: 0.6; cursor: pointer; transition: 0.3s; }
                .header-icon:hover { opacity: 1; transform: rotate(15deg); }
                .user-profile-wrapper { position: relative; z-index: 1000; }
                .user-profile img { width: 38px; height: 38px; border-radius: 50%; cursor: pointer; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1); transition: 0.3s; }
                .user-profile img:hover { border-color: var(--primary); transform: scale(1.1); }

                .profile-dropdown {
                    position: absolute;
                    top: calc(100% + 15px);
                    right: 0;
                    width: 220px;
                    background: white;
                    border-radius: var(--radius-soft);
                    border: 1px solid rgba(255, 183, 226, 0.2);
                    box-shadow: 0 15px 40px rgba(0,0,0,0.1);
                    padding: 15px;
                    z-index: 2000;
                }
                .section-label { font-size: 10px; font-weight: 900; color: #9ca3af; padding: 5px 10px 10px; letter-spacing: 0.1em; }
                .dropdown-link {
                    padding: 12px 14px;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 800;
                    color: #2d2d3f; /* Much darker for contrast */
                    cursor: pointer;
                    transition: 0.2s;
                }
                .dropdown-link:hover { background: #fdf2f8; color: var(--primary); }
                .logout-item { color: #ff4757; margin-top: 5px; }
                .logout-item:hover { background: #fff1f2; color: #ff4757; }

                /* Main Content */
                .mee6-content { padding: 50px; max-width: 1400px; margin: 0 auto; width: 100%; }
                .hero-banner {
                    background: 
                        radial-gradient(circle at 0% 0%, rgba(255, 220, 240, 0.8) 0%, transparent 30%),
                        radial-gradient(circle at 100% 20%, rgba(216, 180, 254, 0.6) 0%, transparent 25%),
                        radial-gradient(circle at 50% 100%, rgba(255, 183, 226, 0.5) 0%, transparent 40%),
                        radial-gradient(circle at 80% 80%, rgba(192, 132, 252, 0.3) 0%, transparent 20%),
                        radial-gradient(circle at 20% 60%, rgba(255, 133, 193, 0.25) 0%, transparent 25%),
                        linear-gradient(135deg, #fff5f8 0%, #fdf4ff 50%, #f5f3ff 100%);
                    border-radius: var(--radius-bubbly);
                    padding: 80px 100px 80px 60px;
                    margin: 60px 20px 80px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border: 2px solid rgba(255, 255, 255, 0.8);
                    box-shadow: 
                        0 30px 60px rgba(255, 183, 226, 0.2),
                        inset 0 0 80px rgba(255, 255, 255, 0.5);
                    position: relative;
                    overflow: visible;
                }
                .hero-banner::before {
                    content: '';
                    position: absolute;
                    width: 200px;
                    height: 200px;
                    top: -50px;
                    left: 30%;
                    background: radial-gradient(circle, rgba(255, 133, 193, 0.15) 0%, transparent 70%);
                    border-radius: 50%;
                    animation: pulse-glow 4s ease-in-out infinite;
                }
                @keyframes pulse-glow {
                    0%, 100% { transform: scale(1); opacity: 0.6; }
                    50% { transform: scale(1.2); opacity: 0.9; }
                }
                .hero-banner::after {
                    content: '🌸 ✨ 💖';
                    position: absolute;
                    font-size: 40px;
                    right: 450px;
                    top: 25px;
                    opacity: 0.2;
                    letter-spacing: 20px;
                    animation: sparkle 3s ease-in-out infinite;
                }
                @keyframes sparkle {
                    0%, 100% { opacity: 0.15; transform: scale(1); }
                    50% { opacity: 0.3; transform: scale(1.1); }
                }
                .hero-text h1 { font-size: 38px; margin-bottom: 30px; font-weight: 900; max-width: 450px; line-height: 1.2; color: #4a4a68; }
                .hero-text h1 span { color: #ff85c1; }
                .hero-buttons { display: flex; gap: 20px; }
                .hero-btn { padding: 14px 30px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.4s; font-size: 15px; border: none; }
                .hero-btn.primary { background: var(--primary); color: white; box-shadow: 0 10px 20px rgba(255,183,226,0.4); }
                .hero-btn.secondary { background: white; color: #4a4a68; border: 1px solid rgba(214, 207, 255, 0.4); }
                .hero-btn:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(255,183,226,0.5); }
                
                /* Animated Background Level Icons */
                .hero-bg-anime {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    z-index: 0;
                    overflow: hidden;
                    border-radius: 40px;
                }
                .hero-bg-icon {
                    position: absolute;
                    width: 70px;
                    height: 70px;
                    background-size: contain;
                    background-repeat: no-repeat;
                    opacity: 0.12;
                    filter: blur(1px) grayscale(0.2);
                    transition: opacity 0.5s;
                }
                .hero-bg-icon.lvl-1 { animation: bounce-x 20s linear infinite, bounce-y 12s linear infinite; }
                .hero-bg-icon.lvl-2 { animation: bounce-x 25s linear infinite 2s, bounce-y 15s linear infinite 1s; }
                .hero-bg-icon.lvl-3 { animation: bounce-x 30s linear infinite 4s, bounce-y 18s linear infinite 2s; }
                .hero-bg-icon.lvl-4 { animation: bounce-x 22s linear infinite 6s, bounce-y 14s linear infinite 3s; }
                .hero-bg-icon.lvl-5 { animation: bounce-x 28s linear infinite 1s, bounce-y 16s linear infinite 4s; }
                .hero-bg-icon.lvl-6 { animation: bounce-x 35s linear infinite 3s, bounce-y 20s linear infinite 5s; }
                .hero-bg-icon.lvl-7 { animation: bounce-x 24s linear infinite 5s, bounce-y 13s linear infinite 6s; }
                .hero-bg-icon.lvl-8 { animation: bounce-x 32s linear infinite 7s, bounce-y 19s linear infinite 7s; }
                .hero-bg-icon.lvl-9 { animation: bounce-x 21s linear infinite 8s, bounce-y 11s linear infinite 8s; }
                .hero-bg-icon.lvl-10 { animation: bounce-x 26s linear infinite 9s, bounce-y 17s linear infinite 9s; }

                @keyframes bounce-x {
                    0%, 100% { left: 0%; }
                    50% { left: calc(100% - 70px); }
                }
                @keyframes bounce-y {
                    0%, 100% { top: 0%; }
                    50% { top: calc(100% - 70px); }
                }

                /* Mission Card Styling */
                .mission-card-wrapper {
                    position: absolute;
                    right: -40px; /* Float way outside the right border */
                    top: -50px;   /* Overlap the top border dramatically */
                    perspective: 1000px;
                    transition: 0.5s;
                    z-index: 100;
                }
                .mission-card-wrapper:hover {
                    transform: scale(1.08) translateY(-10px);
                }
                .mission-leaderboard {
                    position: absolute;
                    top: -25px;
                    right: 0;
                    background: var(--primary);
                    padding: 8px 18px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 900;
                    color: white;
                    border: 1px solid rgba(255,133,193,0.3);
                    box-shadow: 0 10px 25px rgba(255,133,193,0.3);
                    z-index: 20;
                    transform: rotate(5deg);
                }
                .mission-card {
                    background: 
                        radial-gradient(circle at 10% 20%, rgba(255, 133, 193, 0.08) 0%, transparent 20%),
                        radial-gradient(circle at 90% 30%, rgba(192, 132, 252, 0.08) 0%, transparent 15%),
                        radial-gradient(circle at 30% 80%, rgba(255, 133, 193, 0.06) 0%, transparent 18%),
                        radial-gradient(circle at 70% 70%, rgba(192, 132, 252, 0.05) 0%, transparent 12%),
                        rgba(255, 255, 255, 0.2); /* Soft glass with cute bubbles */
                    width: 340px;
                    padding: 24px;
                    border-radius: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.4);
                    box-shadow: 
                        0 25px 60px -12px rgba(255, 183, 226, 0.35),
                        inset 0 0 20px rgba(255, 255, 255, 0.15); 
                    backdrop-filter: blur(30px);
                    -webkit-backdrop-filter: blur(30px);
                    transform: rotate(-3deg);
                    transition: 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative;
                    overflow: hidden;
                }
                .mission-card::before {
                    content: '🌸';
                    position: absolute;
                    font-size: 100px;
                    top: -30px;
                    right: -30px;
                    opacity: 0.08;
                    pointer-events: none;
                }
                .mission-card::after {
                    content: '✨';
                    position: absolute;
                    font-size: 60px;
                    bottom: -15px;
                    left: -15px;
                    opacity: 0.06;
                    pointer-events: none;
                }
                .mission-card-wrapper:hover .mission-card {
                    transform: rotate(0deg);
                    box-shadow: 0 35px 60px -12px rgba(255,183,226,0.4);
                }

                .mc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
                .mc-title { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 14px; color: #4a4a68; }
                .mc-icon { font-size: 18px; }
                .mc-done { font-size: 10px; font-weight: 900; background: #fdf2f8; color: var(--primary); padding: 5px 12px; border-radius: 20px; border: 1px solid rgba(255,133,193,0.2); }
                
                .mission-list { display: flex; flex-direction: column; gap: 14px; }
                .mission-item { 
                    background: rgba(255, 255, 255, 0.1); 
                    padding: 16px 20px; 
                    border-radius: 18px; 
                    display: flex; 
                    align-items: center; 
                    gap: 12px; 
                    transition: 0.3s;
                    border: 1px solid rgba(255,255,255,0.1);
                    backdrop-filter: blur(5px);
                }
                .mission-item:hover { background: white; transform: scale(1.03) translateX(8px); border-color: var(--primary); }
                .mi-info { flex: 1; }
                .mi-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
                .mi-head span:first-child { font-size: 13px; font-weight: 800; color: #4a4a68; }
                .mi-xp { font-size: 10px; font-weight: 900; color: var(--primary); }
                
                .mi-progress-bar { height: 8px; background: rgba(0,0,0,0.05); border-radius: 10px; overflow: hidden; }
                .mi-progress-fill { height: 100%; background: linear-gradient(90deg, #ff85c1, #c084fc); border-radius: 10px; position: relative; box-shadow: 0 0 10px rgba(255,133,193,0.3); }
                
                .mission-item.completed { background: rgba(187, 247, 208, 0.15); border-color: rgba(52, 211, 153, 0.2); }
                .mission-item.completed .mi-head span:first-child { color: #059669; }
                .mi-check { color: white; background: #10b981; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; box-shadow: 0 4px 10px rgba(16,185,129,0.2); }
                
                .mi-claimed-status { font-size: 11px; font-weight: 800; color: #6b7280; }
                .claim-btn-mini { background: var(--primary); color: white; border: none; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 10px rgba(255,183,226,0.3); }
                .claim-btn-mini:hover { background: #ff85c1; transform: scale(1.05); }
                .loader-mini { font-size: 13px; color: var(--primary); text-align: center; padding: 20px; font-weight: 800; animation: pulse 1.5s infinite; }
                @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }

                @keyframes shine {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(2deg); }
                }

                .hero-stats { 
                    position: absolute;
                    bottom: 30px;
                    right: 380px;
                    display: flex; 
                    gap: 15px; 
                    align-items: center; 
                }
                .mini-stat { text-align: center; background: white; padding: 10px 15px; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.03); border: 1px solid #fdf2f8; }
                .ms-val { font-size: 18px; font-weight: 900; color: var(--primary); }
                .ms-lab { font-size: 9px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; }

                .hero-stats { display: flex; gap: 40px; text-align: right; }
                .ms-val { font-size: 42px; font-weight: 900; color: #ffb7e2; text-shadow: 0 4px 10px rgba(255,183,226,0.2); }
                .ms-lab { font-size: 13px; color: #4a4a68; font-weight: 700; opacity: 0.6; text-transform: uppercase; margin-top: 8px; }

                /* Plugins Grid */
                .plugins-section h2 { font-size: 28px; margin-bottom: 30px; font-weight: 900; color: #4a4a68; }
                .plugin-tabs { display: flex; gap: 15px; border-bottom: 2px solid #f3f4f6; margin-bottom: 50px; }
                .tab-item {
                    padding: 15px 25px;
                    font-size: 15px;
                    font-weight: 800;
                    color: #9ca3af;
                    cursor: pointer;
                    position: relative;
                    transition: 0.3s;
                }
                .tab-item:hover { color: #4a4a68; }
                .tab-item.active { color: #8b5cf6; }
                .tab-item.active::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 2px; background: #8b5cf6; }

                .plugins-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 35px;
                }
                .plugin-card {
                    background: white;
                    border-radius: var(--radius-soft);
                    padding: 40px 30px;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid rgba(255,183,226,0.1);
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    box-shadow: 0 10px 25px rgba(255,183,226,0.05);
                    position: relative;
                }
                .plugin-card:hover { transform: translateY(-10px); border-color: var(--primary); box-shadow: 0 15px 35px rgba(255,183,226,0.15); }
                
                /* Sitting Icons for Plugins */
                .plugin-sitting-icon {
                    position: absolute;
                    bottom: -15px;
                    right: -15px;
                    width: 50px;
                    height: 50px;
                    background-size: contain;
                    background-repeat: no-repeat;
                    z-index: 10;
                    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
                    transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .plugin-card:hover .plugin-sitting-icon {
                    transform: scale(1.2) rotate(10deg);
                    animation: jump-wiggle 0.5s ease-in-out infinite;
                }
                @keyframes jump-wiggle {
                    0%, 100% { transform: scale(1.2) translateY(0) rotate(10deg); }
                    50% { transform: scale(1.2) translateY(-10px) rotate(-5deg); }
                }
                .pc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
                .pc-icon { font-size: 42px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.05)); }
                .p-badge { background: #fdf2f8; color: #ff85c1; font-size: 10px; font-weight: 900; padding: 5px 10px; border-radius: 8px; border: 1px solid rgba(255,183,226,0.2); }
                .p-badge-s { background: #fffbeb; color: #d97706; font-size: 10px; font-weight: 900; padding: 5px 10px; border-radius: 8px; border: 1px solid rgba(252,211,77,0.3); }
                
                .pc-body h3 { font-size: 20px; margin-bottom: 12px; font-weight: 800; color: #4a4a68; }
                .pc-body p { font-size: 14px; color: #6b7280; line-height: 1.7; margin-bottom: 30px; flex: 1; }
                
                .pc-btn {
                    width: 100%;
                    padding: 12px;
                    border-radius: 12px;
                    background: #fdf2f8;
                    color: #ff85c1;
                    border: 1px solid rgba(255,183,226,0.2);
                    font-weight: 800;
                    font-size: 14px;
                    cursor: pointer;
                    transition: 0.3s;
                }
                .pc-btn.active { background: #f5f3ff; color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.2); }
                .pc-btn:hover { background: #ff85c1; color: white; transform: scale(1.02); }

                .invite-btn { width: 100%; padding: 14px; background: #f5f3ff; color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.3s; }
                .invite-btn:hover { background: #8b5cf6; color: white; }
                .loader { height: 100vh; display: flex; align-items: center; justify-content: center; font-size: 28px; color: var(--primary); background: var(--background-hex); font-weight: 800; }
                @keyframes float-mini { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
                .plugin-card:nth-child(even) { animation: float-mini 4s ease-in-out infinite; }
                .plugin-card:nth-child(odd) { animation: float-mini 5s ease-in-out infinite; }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(255, 241, 242, 0.4);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    padding: 20px;
                }
                .modal-card {
                    background: white;
                    max-width: 480px;
                    width: 100%;
                    padding: 40px;
                    text-align: center;
                    border: 2px solid var(--primary);
                    position: relative;
                }
                .modal-close {
                    position: absolute;
                    top: 25px;
                    right: 25px;
                    background: transparent;
                    border: none;
                    font-size: 32px;
                    color: #9ca3af;
                    cursor: pointer;
                    transition: all 0.3s;
                    line-height: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                }
                .modal-close:hover {
                    color: var(--primary);
                    background: var(--primary-glow);
                    transform: rotate(90deg);
                }
                .modal-icon { font-size: 50px; margin-bottom: 20px; }
                .modal-card h2 { font-size: 28px; margin-bottom: 15px; color: #4a4a68; }
                .modal-card p { font-size: 16px; color: #6b7280; line-height: 1.6; margin-bottom: 35px; }
                .modal-card p strong { color: #ff85c1; }
                
                .modal-actions { display: flex; gap: 15px; flex-direction: column; }
                .modal-btn {
                    padding: 14px;
                    border-radius: 12px;
                    font-weight: 800;
                    font-size: 15px;
                    cursor: pointer;
                    transition: 0.3s;
                    border: none;
                    width: 100%;
                }
                .modal-btn.primary-danger {
                    background: #ff4757;
                    color: white;
                    box-shadow: 0 8px 20px rgba(255, 71, 87, 0.3);
                }
                .modal-btn.primary-danger:hover { transform: translateY(-3px); filter: brightness(1.1); }
                .modal-btn.secondary {
                    background: #f3f4f6;
                    color: #4a4a68;
                }
                .modal-btn.secondary:hover { background: #e5e7eb; }

                @keyframes pop {
                    0% { transform: scale(0.9); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-pop { animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

                /* Setup Modal Specifics */
                .setup-modal { max-width: 650px !important; }
                .setup-grid { display: flex; flex-direction: column; gap: 12px; margin-top: 10px; }
                .setup-option {
                    display: flex;
                    align-items: center;
                    padding: 20px;
                    background: #fff;
                    border: 2px solid #f3f4f6;
                    border-radius: 18px;
                    cursor: pointer;
                    transition: all 0.3s;
                    text-align: left;
                }
                .setup-option:hover {
                    border-color: var(--primary);
                    background: var(--primary-glow);
                    transform: translateX(5px);
                }
                .so-icon { font-size: 32px; margin-right: 20px; }
                .so-info { flex: 1; }
                .so-info h4 { margin: 0; color: #4a4a68; font-size: 18px; }
                .so-info p { margin: 4px 0 0 0; font-size: 13px; color: #6b7280; }
                .so-arrow { font-size: 20px; color: #cbd5e1; font-weight: bold; }
                .setup-option:hover .so-arrow { color: var(--primary); transform: translateX(5px); }

                .setup-config-area { padding-top: 10px; text-align: left; }
                .config-banner-mini {
                    background: var(--primary-glow);
                    padding: 15px;
                    border-radius: 12px;
                    font-size: 14px;
                    color: #4a4a68;
                    margin-bottom: 20px;
                    border: 1px dashed var(--primary);
                }
                .config-group { margin-bottom: 25px; }
                .config-group label {
                    display: block;
                    font-weight: 700;
                    margin-bottom: 10px;
                    color: #4a4a68;
                    font-size: 14px;
                }
                .cute-input {
                    width: 100%;
                    padding: 15px;
                    border-radius: 14px;
                    border: 2px solid #f3f4f6;
                    font-family: inherit;
                    font-size: 15px;
                    transition: 0.3s;
                    outline: none;
                }
                .cute-input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-glow); }
                .input-hint { display: block; margin-top: 8px; font-size: 12px; color: #9ca3af; }

                .modal-actions-v { display: flex; flex-direction: column; gap: 10px; }
                .modal-btn.primary { background: var(--primary); color: white; box-shadow: 0 5px 15px rgba(255, 183, 226, 0.4); }
                .modal-btn.primary:hover { transform: translateY(-2px); filter: brightness(1.05); }
                .modal-btn.ghost { background: transparent; color: #9ca3af; font-size: 13px; }
                .modal-btn.ghost:hover { color: #4a4a68; }

                /* Custom Template UI */
                .custom-list { display: flex; flex-direction: column; gap: 15px; max-height: 380px; overflow-y: auto; padding: 10px; scrollbar-width: thin; scrollbar-color: var(--primary-glow) transparent; }
                .custom-list::-webkit-scrollbar { width: 6px; }
                .custom-list::-webkit-scrollbar-track { background: transparent; }
                .custom-list::-webkit-scrollbar-thumb { background: var(--primary-glow); border-radius: 10px; }
                .custom-item { 
                    display: flex; 
                    gap: 15px; 
                    align-items: center; 
                    padding: 18px; 
                    border-radius: 20px; 
                    background: #fff; 
                    border: 2px solid #f8fafc; 
                    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
                    transition: 0.3s;
                }
                .custom-item:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(255,133,193,0.1); border-color: var(--primary-glow); }
                .mini-input { 
                    flex: 1; 
                    padding: 12px 18px; 
                    border-radius: 14px; 
                    border: 2px solid #f1f5f9; 
                    font-family: inherit; 
                    font-weight: 700; 
                    outline: none; 
                    font-size: 15px;
                    transition: 0.3s;
                }
                .mini-input:focus { border-color: var(--primary); background: #fdf2f8; }
                .role-color-picker { 
                    width: 32px; 
                    height: 32px; 
                    min-width: 32px;
                    border-radius: 50%; 
                    border: 3px solid #fff; 
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1); 
                    cursor: pointer; 
                    padding: 0; 
                    overflow: hidden; 
                    transition: 0.3s;
                }
                .role-color-picker:hover { transform: scale(1.15); }
                .role-color-picker::-webkit-color-swatch-wrapper { padding: 0; }
                .role-color-picker::-webkit-color-swatch { border: none; border-radius: 50%; }
                .mini-select { 
                    padding: 12px; 
                    border-radius: 14px; 
                    border: 2px solid #f1f5f9; 
                    font-family: inherit; 
                    cursor: pointer; 
                    font-weight: 700;
                    color: #4a4a68;
                    transition: 0.3s;
                }
                .mini-select:hover { border-color: var(--primary); }
                .del-btn { 
                    background: #fff1f2; 
                    color: #f43f5e; 
                    border: none; 
                    width: 32px; 
                    height: 32px; 
                    min-width: 32px;
                    border-radius: 50%; 
                    cursor: pointer; 
                    font-weight: 800; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    transition: 0.3s;
                    font-size: 18px;
                }
                .del-btn:hover { background: #f43f5e; color: white; transform: rotate(90deg); }
                .add-btn { margin-top: 15px; padding: 15px; border-radius: 15px; border: 2px dashed #e2e8f0; background: transparent; color: #94a3b8; cursor: pointer; transition: 0.3s; font-weight: 800; font-size: 14px; }
                .add-btn:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-glow); transform: scale(1.02); }

                .custom-split { display: grid; grid-template-columns: 200px 1fr; gap: 20px; text-align: left; max-height: 500px; }
                .split-left { border-right: 2px solid #f3f4f6; padding-right: 15px; display: flex; flex-direction: column; gap: 8px; max-height: 450px; overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none; }
                .split-left::-webkit-scrollbar { display: none; }
                .split-left label, .split-right label { font-size: 11px; font-weight: 900; color: #9ca3af; letter-spacing: 0.1em; margin-bottom: 5px; display: block; }

                .zone-tab { padding: 10px; border-radius: 10px; background: #fff; display: flex; flex-direction: column; gap: 5px; cursor: pointer; transition: 0.2s; border: 1px solid #f3f4f6; margin-bottom: 5px; }
                .zone-tab.active { background: #fffceb; border-color: #ffd700; transform: scale(1.02); }
                .zone-tab-main { display: flex; align-items: center; justify-content: space-between; width: 100%; }
                .zone-tab input { border: none; background: transparent; font-weight: 800; font-size: 13px; color: inherit; outline: none; flex: 1; pointer-events: none; }
                .zone-tab.active input { pointer-events: auto; }
                .zone-del { background: none; border: none; font-size: 14px; opacity: 0; cursor: pointer; color: #ef4444; }
                .zone-tab:hover .zone-del { opacity: 1; }
                .add-zone { padding: 8px; border-radius: 10px; border: 2px dashed #e2e8f0; background: none; color: #94a3b8; cursor: pointer; font-size: 20px; width: 100%; transition: 0.3s; }
                .add-zone:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-glow); }

                .zone-access { display: flex; flex-wrap: wrap; gap: 3px; }
                .access-tags { display: flex; flex-wrap: wrap; gap: 3px; }
                .access-tag { 
                    font-size: 9px; 
                    padding: 2px 4px; 
                    border-radius: 4px; 
                    background: #f1f5f9; 
                    color: #64748b; 
                    font-weight: 900; 
                    cursor: pointer; 
                    transition: 0.2s;
                    user-select: none;
                }
                .access-tag.active { 
                    background: #ff85c1; 
                    color: white; 
                }
                .access-tag.mini-dot {
                    width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: #f1f5f9;
                    font-size: 8px;
                }
                .access-tag.mini-dot.active { background: #ff85c1; color: white; }

                .access-tag.mini-dot.active { background: #ff85c1; color: white; }

                .chan-list { display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto; padding-right: 5px; scrollbar-width: thin; scrollbar-color: var(--primary-glow) transparent; }
                .chan-list::-webkit-scrollbar { width: 6px; }
                .chan-list::-webkit-scrollbar-track { background: transparent; }
                .chan-list::-webkit-scrollbar-thumb { background: var(--primary-glow); border-radius: 10px; }
                .chan-row { display: flex; align-items: center; gap: 10px; padding: 10px 15px; background: white; border: 1px solid #f3f4f6; border-radius: 12px; }
                .chan-item-main { display: flex; align-items: center; gap: 10px; flex: 1; }
                .chan-item-main input { flex: 1; border: none; font-size: 14px; font-family: inherit; outline: none; font-weight: 700; color: #4a4a68; }
                .chan-access-horizontal { display: flex; gap: 4px; align-items: center; padding: 0 10px; border-left: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; }
                .ch-del { background: none; border: none; color: #cbd5e1; cursor: pointer; font-size: 18px; transition: 0.2s; }
                .ch-del:hover { color: #f43f5e; }
                .ch-del:hover { color: #f43f5e; }
                .chan-adds { display: flex; gap: 10px; margin-top: 10px; }
                .chan-adds button { flex: 1; padding: 8px; border-radius: 8px; border: 1px solid #f3f4f6; background: #f9fafb; font-size: 12px; font-weight: 700; color: #6b7280; cursor: pointer; transition: 0.2s; }
                .chan-adds button:hover { background: #f3f4f6; color: var(--primary); }

                /* Selective Manager Styles (Discord Redesign) */
                .selective-header { display: flex; align-items: center; gap: 20px; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9; width: 100%; text-align: left; }
                .m-icon { font-size: 32px; background: #fdf2f8; min-width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 20px; border: 1px solid #ffb7e2; }
                .m-title h3 { font-size: 22px; font-weight: 900; color: #4b4b6b; margin: 0; }
                .m-title p { font-size: 14px; color: #94bcbe; margin: 5px 0 0; font-weight: 700; opacity: 0.8; }

                .discord-sidebar { display: flex; flex-direction: column; gap: 2px; padding: 10px 0; max-height: 450px; overflow-y: auto; text-align: left; }
                .discord-cat-section { margin-bottom: 15px; }
                .discord-cat-header { display: flex; align-items: center; padding: 8px 15px; cursor: pointer; border-radius: 8px; transition: 0.2s; user-select: none; }
                .discord-cat-header:hover { background: rgba(0,0,0,0.03); }
                .ch-checkbox-wrap { width: 30px; display: flex; align-items: center; justify-content: flex-start; }
                .cat-arrow { font-size: 12px; color: #94a3af; width: 20px; }
                .cat-name { font-size: 12px; font-weight: 900; color: #94a3af; flex: 1; letter-spacing: 0.05em; margin-left: 2px; }
                .cat-count { font-size: 10px; font-weight: 800; color: #bdc3c7; background: #f8fafc; padding: 2px 8px; border-radius: 10px; border: 1px solid #f1f5f9; }

                .discord-ch-list { display: flex; flex-direction: column; gap: 2px; margin-top: 4px; }
                .discord-ch-item { display: flex; align-items: center; padding: 8px 15px 8px 45px; border-radius: 8px; cursor: pointer; transition: 0.2s; position: relative; }
                .discord-ch-item:hover { background: rgba(255, 133, 193, 0.08); color: var(--primary); }
                .discord-ch-item.selected { background: rgba(255, 133, 193, 0.12); color: var(--primary); border-left: 4px solid var(--primary); padding-left: 41px; }
                .ch-icon { font-size: 18px; color: #94a3af; margin-right: 10px; width: 20px; text-align: center; font-weight: 800; }
                .ch-name { font-size: 15px; font-weight: 700; color: #4a4a68; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .discord-ch-item:hover .ch-icon, .discord-ch-item.selected .ch-icon { color: var(--primary); }

                .modal-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 25px; border-top: 1px solid #f1f5f9; margin-top: 25px; width: 100%; }
                .modal-actions-row { display: flex; gap: 15px; }
                .m-checkbox { width: 18px; height: 18px; accent-color: var(--primary); cursor: pointer; border-radius: 6px; }
                .wide-card { width: 680px !important; border-radius: 30px !important; }

                /* Role Legend */
                .role-legend { background: rgba(255, 255, 255, 0.6); border: 1px solid #f1f5f9; }
                .legend-title { font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; }
                .legend-items { display: flex; flex-wrap: wrap; gap: 15px; align-items: center; }
                .legend-item { display: flex; align-items: center; gap: 6px; }
                .dot-preview { width: 16px; height: 16px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 900; }
                .dot-preview.active { background: #ff85c1; color: white; }
                .dot-fullname { font-size: 12px; font-weight: 700; color: #4a4a68; }
                .legend-note { font-size: 11px; color: #94a3b8; font-style: italic; margin-left: auto; }
                .mini-perm-btn {
                    padding: 10px;
                    border: 2px solid #f1f5f9;
                    background: #fff;
                    border-radius: 14px;
                    cursor: pointer;
                    transition: 0.3s;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 42px;
                    height: 42px;
                }
                .mini-perm-btn:hover { background: #f3f4f6; border-color: var(--primary); transform: translateY(-2px); }
                .mini-perm-btn.active { background: #fdf2f8; border-color: var(--primary); }

                .perms-modal { width: 600px !important; max-height: 80vh; overflow-y: auto; }
                .perms-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin: 20px 0;
                    max-height: 50vh;
                    overflow-y: auto;
                    padding-right: 10px;
                }
                .perm-toggle-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px;
                    background: #fdf2f8;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: 0.2s;
                    border: 2px solid transparent;
                }
                .perm-toggle-item:hover { transform: translateY(-2px); border-color: rgba(255,183,226,0.3); }
                .perm-toggle-item.active { background: white; border-color: var(--primary); }
                
                .perm-info { display: flex; flex-direction: column; }
                .p-name { font-weight: 700; font-size: 13px; color: #4a4a68; }
                .p-id { font-size: 10px; font-weight: 900; color: #9ca3af; text-transform: uppercase; }
                
                .p-switch {
                    width: 36px;
                    height: 20px;
                    background: #ddd;
                    border-radius: 20px;
                    position: relative;
                    transition: 0.3s;
                }
                .perm-toggle-item.active .p-switch { background: var(--primary); }
                .switch-knob {
                    width: 14px;
                    height: 14px;
                    background: white;
                    border-radius: 50%;
                    position: absolute;
                    top: 3px;
                    left: 3px;
                    transition: 0.3s;
                }
                .perm-toggle-item.active .switch-knob { left: calc(100% - 17px); }

                /* Custom Scrollbar for perms-grid */
                .perms-grid::-webkit-scrollbar { width: 6px; }
                .perms-grid::-webkit-scrollbar-track { background: transparent; }
                .perms-grid::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
                .perms-grid::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }

                /* Plan Badges & Premium UI */
                .plan-badge-top { padding: 6px 14px; border-radius: 10px; font-weight: 900; font-size: 11px; margin-right: 15px; }
                .plan-badge-top.premium { background: linear-gradient(135deg, #c084fc, #9333ea); color: white; box-shadow: 0 0 15px rgba(147,51,234,0.4); }
                .plan-badge-top.pro { background: linear-gradient(135deg, #4ade80, #16a34a); color: white; box-shadow: 0 0 15px rgba(22,163,74,0.3); }

                /* Pricing Modal */
                .pricing-modal { width: 900px; padding: 50px; position: relative; }
                .pricing-header { text-align: center; margin-bottom: 40px; }
                .pricing-header h2 { font-size: 32px; color: #1e293b; }
                .pricing-header h2 span { color: var(--primary); }
                .pricing-header p { color: #64748b; font-weight: 600; }
                .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
                .pricing-card { background: white; padding: 30px; border-radius: 24px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; position: relative; }
                .pricing-card.featured { border: 2px solid var(--primary-glow); transform: scale(1.05); }
                .pricing-card.pro { border-color: #4ade80; }
                .pricing-card.premium { border-color: #c084fc; box-shadow: 0 20px 40px rgba(192,132,252,0.1); }
                .p-badge-promo { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--primary); color: white; padding: 4px 15px; border-radius: 20px; font-size: 10px; font-weight: 900; }
                .p-tier { font-weight: 900; font-size: 14px; color: #64748b; margin-bottom: 10px; }
                .p-price { font-size: 32px; font-weight: 900; color: #1e293b; margin-bottom: 25px; }
                .p-price span { font-size: 14px; color: #94a3b8; }
                .p-features { list-style: none; padding: 0; margin-bottom: 30px; flex: 1; }
                .p-features li { font-size: 13px; color: #475569; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
                .p-btn { width: 100%; padding: 12px; border-radius: 12px; border: none; font-weight: 800; cursor: pointer; transition: 0.3s; }
                .p-btn.disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }
                .p-btn.pro { background: #16a34a; color: white; }
                .p-btn.premium { background: var(--primary); color: white; }
                .p-btn:hover { transform: translateY(-3px); filter: brightness(1.1); }
                .close-x { position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 28px; color: #94a3b8; cursor: pointer; transition: 0.3s; }
                .close-x:hover { color: #ef4444; }
                .pricing-footer { text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8; font-weight: 700; }

                @keyframes animate-glow {
                    0% { box-shadow: 0 0 10px rgba(147,51,234,0.3); }
                    50% { box-shadow: 0 0 25px rgba(147,51,234,0.6); }
                    100% { box-shadow: 0 0 10px rgba(147,51,234,0.3); }
                }
                .animate-glow { animation: animate-glow 3s infinite; }
            `}</style>
        </div >
    );
}
