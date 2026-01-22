"use client";
import React, { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import ResultModal from "../components/ResultModal";
import ChangelogModal from "../components/ChangelogModal";

export default function ServerSelection() {
    const { data: session, status: authStatus } = useSession();
    const { t, language, toggleLanguage } = useLanguage();
    const [userGuilds, setUserGuilds] = useState([]);
    const [botGuilds, setBotGuilds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    const [lastManagedId, setLastManagedId] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [imgErrors, setImgErrors] = useState({});
    const profileRef = useRef(null);

    const handleImgError = (id) => {
        setImgErrors(prev => ({ ...prev, [id]: true }));
    };

    const getIconUrl = (id, hash) => {
        if (!hash) return null;
        const format = hash.startsWith('a_') ? 'gif' : 'png';
        return `https://cdn.discordapp.com/icons/${id}/${hash}.${format}`;
    };

    // Modals
    const [showChangelog, setShowChangelog] = useState(false);
    const [modalState, setModalState] = useState({ show: false, type: 'info', message: '' });
    const isThai = language === 'th';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (authStatus === "unauthenticated") {
            router.push("/");
        } else if (authStatus === "authenticated") {
            setLastManagedId(localStorage.getItem("anan_last_guild_id"));
        }
    }, [authStatus, router]);

    useEffect(() => {
        if (authStatus !== "authenticated") return;

        const fetchData = async () => {
            try {
                // Rate Limit Protection - Check Cache (LocalStorage)
                const cachedData = localStorage.getItem("discord_guilds_cache");
                const cacheTime = localStorage.getItem("discord_guilds_cache_time");
                const now = Date.now();
                const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes validity

                let userG;
                // 1. Try to use FRESH cache
                if (cachedData && cacheTime && (now - parseInt(cacheTime) < CACHE_DURATION)) {
                    console.log("Using cached guild data to avoid Rate Limit");
                    userG = JSON.parse(cachedData);
                } else {
                    // 2. Fetch from Discord API
                    const userRes = await fetch("https://discord.com/api/users/@me/guilds", {
                        headers: { Authorization: `Bearer ${session.accessToken}` },
                    });

                    if (userRes.status === 429) {
                        // 3. Rate Limit Hit -> Fallback to STALE cache if possible
                        console.warn("Discord 429 Rate Limit hit. Attempting fallback to stale cache.");
                        if (cachedData) {
                            userG = JSON.parse(cachedData);
                        } else {
                            throw new Error("Discord is rate limiting us. Please wait a moment and try again.");
                        }
                    } else if (userRes.ok) {
                        userG = await userRes.json();
                        // Update Check
                        if (Array.isArray(userG)) {
                            localStorage.setItem("discord_guilds_cache", JSON.stringify(userG));
                            localStorage.setItem("discord_guilds_cache_time", now.toString());
                        }
                    } else {
                        throw new Error(`Failed to fetch guilds: ${userRes.statusText}`);
                    }
                }

                const botRes = await fetch("/api/proxy/guilds");
                let botG = [];
                try {
                    const botData = await botRes.json();
                    if (Array.isArray(botData)) {
                        botG = botData;
                    } else {
                        console.warn("Bot API returned non-array:", botData);
                    }
                } catch (e) {
                    console.warn("Failed to parse Bot API response", e);
                }

                if (Array.isArray(userG)) {
                    // 0x8 is MANAGE_GUILD, 0x20 is MANAGE_CHANNELS
                    const manageable = userG.filter(g => (g.permissions & 0x8) || (g.permissions & 0x20) || g.owner);
                    setUserGuilds(manageable);
                } else {
                    throw new Error("Failed to load your servers from Discord.");
                }

                setBotGuilds(botG);

                // Auto-redirect to last managed server (ONLY if not switching)
                const savedGuildId = localStorage.getItem("anan_last_guild_id");
                const isSwitching = window.location.search.includes("redirect=false");

                if (!isSwitching && savedGuildId && botG.some(bg => bg.id === savedGuildId)) {
                    console.log("Auto-redirecting to last active guild...");
                    router.push(`/servers/${savedGuildId}`);
                    return; // Don't show selection page
                }
            } catch (err) {
                console.error("Failed to fetch guilds:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Auto-refresh when coming back from Invite Popup 🔄
        const onFocus = () => {
            console.log("Window focused: Refreshing guild data...");
            fetchData();
        };
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [authStatus, session, router]);

    if (loading) return <div className="loader">🌸 {t.selection.loading}</div>;

    if (error) return (
        <div className="loader">
            <div className="error-card glass">
                <h2>❌ Oops! {error}</h2>
                <p>Discord might be busy. Let's try again in a few seconds?</p>
                <button className="login-btn glass" onClick={() => window.location.reload()} style={{ marginTop: '20px', width: 'auto', padding: '12px 30px' }}>
                    Try Again
                </button>
            </div>
        </div>
    );

    return (
        <div className="server-container glass-bg">
            <header className="selection-header">
                <div className="profile-top-wrapper" ref={profileRef}>
                    <div className="profile-top" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                        <img src={session?.user?.image} alt="Avatar" className="avatar-small" />
                        <span>{session?.user?.name} <span style={{ marginLeft: '5px' }}>⌵</span></span>
                    </div>
                    {isProfileOpen && (
                        <div className="profile-dropdown glass animate-pop">
                            <div className="dropdown-section">
                                <div className="section-label">AN AN BOT</div>
                                <div className="dropdown-link" onClick={() => {
                                    if (lastManagedId) router.push(`/servers/${lastManagedId}/rank-card`);
                                    else alert(t.selection.selectFirst || "Please select a server first 🌸");
                                }}>{t.dashboard?.rankCard || "Personal Rank Card"}</div>
                                <div className="dropdown-link" onClick={() => {
                                    if (lastManagedId) router.push(`/servers/${lastManagedId}/premium`);
                                    else alert(t.selection.selectFirst || "Please select a server first 🌸");
                                }}>{t.dashboard?.pro || "Pro"}</div>
                                <div className="dropdown-link" onClick={() => setModalState({ show: true, type: 'info', message: isThai ? "ระบบนี้กำลังมาเร็วๆ นี้ค่า สปอยล์: คุยเก่งมาก! 🤖💕" : "AI Characters are Coming Soon! Handcrafted with ❤️" })}>{t.dashboard?.aiCharacters || "AI Characters"}</div>
                            </div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-section">
                                <div className="section-label">SERVERS OWNERS</div>
                                <div className="dropdown-link active" onClick={() => router.push('/servers?redirect=false')}>{t.dashboard?.myServers || "My Servers"}</div>
                                <div className="dropdown-link" onClick={() => setModalState({ show: true, type: 'info', message: isThai ? "กรุณาติดต่อซัพพอร์ตเพื่อโอนย้ายพรีเมียมนะค๊า 🌸" : "Please contact support to transfer premium slots! 🌸" })}>{t.dashboard?.transferPremium || "Transfer Premium"}</div>
                            </div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-section">
                                <div className="section-label">SUPPORT</div>
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
                <h1>{t.selection.title}</h1>
                <p>{t.selection.desc}</p>
            </header>

            <div className="server-grid">
                {userGuilds.map((guild) => {
                    const isBotPresent = botGuilds.some(bg => bg.id === guild.id);
                    const isLastManaged = guild.id === lastManagedId;

                    return (
                        <div
                            key={guild.id}
                            className={`server-card glass ${!isBotPresent ? 'not-added' : ''} ${isLastManaged ? 'last-managed' : ''}`}
                            onClick={() => {
                                if (isBotPresent) {
                                    localStorage.setItem("anan_last_guild_id", guild.id);
                                    router.push(`/servers/${guild.id}`);

                                } else {
                                    const url = `https://discord.com/oauth2/authorize?client_id=1462487393692291123&permissions=6765110361586815&integration_type=0&scope=bot+applications.commands&guild_id=${guild.id}`;
                                    const w = 500;
                                    const h = 800;
                                    const left = (window.innerWidth / 2) - (w / 2) + window.screenX;
                                    const top = (window.innerHeight / 2) - (h / 2) + window.screenY;
                                    window.open(url, 'Invite An An', `width=${w},height=${h},top=${top},left=${left},scrollbars=yes,status=no,location=no,toolbar=no`);
                                }
                            }}
                        >
                            <div className="server-icon-wrapper">
                                {guild.icon && !imgErrors[guild.id] ? (
                                    <img
                                        src={getIconUrl(guild.id, guild.icon)}
                                        alt={guild.name}
                                        className="server-icon"
                                        onError={() => handleImgError(guild.id)}
                                    />
                                ) : (
                                    <div className="server-icon-placeholder">{guild.name[0]}</div>
                                )}
                                {isBotPresent && <div className="bot-active-badge">✨</div>}
                                {isLastManaged && <div className="last-managed-label">{t.selection.lastManaged}</div>}
                            </div>
                            <h3>{guild.name}</h3>
                            <span className="server-status">
                                {isBotPresent ? t.selection.manage : t.selection.invite}
                            </span>
                        </div>
                    );
                })}
            </div>

            <button
                className="refresh-btn"
                onClick={() => {
                    localStorage.removeItem("discord_guilds_cache");
                    localStorage.removeItem("discord_guilds_cache_time");
                    window.location.reload();
                }}
            >
                🔄 {t.selection.refresh}
            </button>

            <style jsx>{`
         .server-container {
          min-height: 100vh;
          padding: 80px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #fdf2f8; /* Synced darker pastel pink */
          font-family: var(--font-main);
        }
        .selection-header { text-align: center; margin-bottom: 60px; }
        .selection-header h1 { font-size: 48px; margin-bottom: 16px; color: #4a4a68; font-weight: 800; }
        .selection-header p { opacity: 0.6; font-size: 19px; color: #4a4a68; }
        .profile-top-wrapper { position: absolute; top: 30px; right: 40px; z-index: 1000; }
        .profile-top {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 20px;
          background: white;
          border-radius: var(--radius-soft);
          border: 1px solid rgba(255,183,226,0.2);
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          cursor: pointer;
          transition: 0.3s;
        }
        .profile-top:hover { transform: scale(1.02); border-color: var(--primary); }
        .avatar-small { width: 34px; height: 34px; border-radius: 50%; border: 2px solid var(--primary); }
        .profile-top span { font-weight: 700; font-size: 14px; color: #4a4a68; }
        
        .profile-dropdown {
            position: absolute;
            top: calc(100% + 10px);
            right: 0;
            width: 220px;
            background: white;
            border-radius: var(--radius-soft);
            border: 1px solid rgba(255, 183, 226, 0.2);
            box-shadow: 0 15px 40px rgba(0,0,0,0.1);
            padding: 15px;
            z-index: 2000;
        }
        .section-label { font-size: 10px; font-weight: 900; color: #9ca3af; padding: 5px 10px 10px; letter-spacing: 0.1em; text-align: left; }
        .dropdown-link {
            padding: 10px 12px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 700;
            color: #4a4a68;
            cursor: pointer;
            transition: 0.2s;
            text-align: left;
        }
        .dropdown-link:hover { background: #fdf2f8; color: var(--primary); }
        .dropdown-link.active { color: var(--primary); background: #fdf2f8; }
        .dropdown-divider { height: 1px; background: #f3f4f6; margin: 8px 0; }
        .logout-item { color: #ff4757; }
        .logout-item:hover { background: #fff1f2 !important; color: #ff4757; }
        .server-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 30px;
          max-width: 1200px;
          width: 100%;
        }
        .server-card {
          padding: 40px 20px;
          text-align: center;
          background: white;
          border-radius: var(--radius-bubbly);
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: 1px solid rgba(255,183,226,0.1);
          box-shadow: 0 10px 25px rgba(255,183,226,0.08);
        }
        .server-card:hover { 
          transform: translateY(-12px); 
          box-shadow: 0 20px 40px rgba(255,183,226,0.15);
          border-color: var(--primary);
        }
        .not-added { opacity: 0.8; }
        .not-added:hover { border-color: var(--secondary); opacity: 1; }
        .server-icon-wrapper { position: relative; margin-bottom: 25px; width: 100px; height: 100px; margin-left: auto; margin-right: auto; }
        .server-icon { width: 100px; height: 100px; border-radius: 30px; box-shadow: 0 12px 24px rgba(255,183,226,0.2); border: 3px solid white; }
        .server-icon-placeholder { width: 100px; height: 100px; border-radius: 30px; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800; border: 3px solid white; box-shadow: 0 12px 24px rgba(255,183,226,0.2); }
        .bot-active-badge { position: absolute; bottom: -5px; right: -5px; background: var(--primary); border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .server-card h3 { margin-bottom: 10px; font-weight: 800; color: #4a4a68; }
        .server-status { font-size: 13px; color: #4a4a68; opacity: 0.5; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .not-added .server-status { color: #ff85c1; opacity: 1; }
        .server-card.last-managed {
          border-color: var(--primary);
          box-shadow: 0 15px 35px rgba(255,183,226,0.2);
          position: relative;
        }
        .last-managed-label {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--primary);
          color: white;
          font-size: 10px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 10px;
          white-space: nowrap;
          box-shadow: 0 4px 10px rgba(255,183,226,0.3);
        }
        .refresh-btn {
          margin-top: 40px;
          background: white;
          border: 1px solid rgba(255,183,226,0.3);
          color: #4a4a68;
          padding: 12px 24px;
          border-radius: var(--radius-soft);
          font-weight: 700;
          cursor: pointer;
          transition: 0.3s;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
        }
        .refresh-btn:hover {
          background: #fdf2f8;
          transform: scale(1.05);
          border-color: var(--primary);
        }
        .loader { height: 100vh; display: flex; align-items: center; justify-content: center; font-size: 26px; color: var(--primary); background: var(--background-hex); font-weight: 700; }
      `}</style>
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
        </div>
    );
}
