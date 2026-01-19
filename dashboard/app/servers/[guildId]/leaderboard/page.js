"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLanguage } from "../../../context/LanguageContext";

export default function LeaderboardPage() {
    const { guildId } = useParams();
    const { data: session } = useSession();
    const { t, language } = useLanguage();
    const [missions, setMissions] = useState([]);
    const [userStats, setUserStats] = useState({ xp_balance: 0, total_missions_completed: 0 });
    const [userPlan, setUserPlan] = useState({ plan_type: "free" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    const fetchMissionsData = async () => {
        if (!session?.user?.id) return;
        try {
            const res = await fetch("http://127.0.0.1:5000/api/action", {
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
            if (data.stats) setUserStats(data.stats);
            if (data.plan) setUserPlan(data.plan);
            if (data.error) setError(data.error);
        } catch (err) {
            console.error("Failed to fetch missions:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMissionsData();
    }, [session]);

    const handleClaimReward = async (missionKey) => {
        if (!session?.user?.id) return;
        try {
            const res = await fetch("http://127.0.0.1:5000/api/action", {
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
                fetchMissionsData();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            console.error("Claim Error:", err);
        }
    };

    if (loading) return <div className="lb-loader">🌸 Loading Hub...</div>;

    const rank = userStats.xp_balance > 5000 ? "Grandmaster" : userStats.xp_balance > 2000 ? "Master" : userStats.xp_balance > 1000 ? "Pro" : "Novice";

    return (
        <div className="lb-wrapper animate-fade">
            <header className="lb-header">
                <button className="back-btn" onClick={() => router.push(`/servers/${guildId}`)}>← Dashboard</button>
                <h1>An An <span>Mission Hub</span> 🏆</h1>
            </header>

            <div className="lb-grid">
                {/* Left Side: Profile & Stats */}
                <aside className="lb-profile glass animate-pop">
                    <div className={`profile-hero ${userPlan.plan_type}`}>
                        <div className="profile-img-container">
                            <img src={session?.user?.image} alt="Avatar" className="profile-img" />

                            {/* SVG Gradients for Crown */}
                            <svg width="0" height="0" style={{ position: 'absolute' }}>
                                <defs>
                                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
                                        <stop offset="30%" style={{ stopColor: '#fffacb', stopOpacity: 1 }} />
                                        <stop offset="60%" style={{ stopColor: '#ffcc00', stopOpacity: 1 }} />
                                        <stop offset="100%" style={{ stopColor: '#ff8c00', stopOpacity: 1 }} />
                                    </linearGradient>
                                    <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" style={{ stopColor: '#cbd5e1', stopOpacity: 1 }} />
                                        <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                                        <stop offset="100%" style={{ stopColor: '#94a3b8', stopOpacity: 1 }} />
                                    </linearGradient>
                                    <radialGradient id="gemGradient" cx="50%" cy="50%" r="50%">
                                        <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                                        <stop offset="100%" style={{ stopColor: '#60a5fa', stopOpacity: 1 }} />
                                    </radialGradient>
                                    <radialGradient id="rubyGradient" cx="50%" cy="50%" r="50%">
                                        <stop offset="0%" style={{ stopColor: '#ff9999', stopOpacity: 1 }} />
                                        <stop offset="100%" style={{ stopColor: '#ef4444', stopOpacity: 1 }} />
                                    </radialGradient>
                                </defs>
                            </svg>

                            {(userPlan.plan_type === 'premium' || userPlan.plan_type === 'pro') && (
                                <div className="crown-wrapper">
                                    <svg className="crown-svg" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
                                        {/* Background Glow */}
                                        <path d="M10 70 L5 20 L30 45 L50 5 L70 45 L95 20 L90 70 Z" fill="rgba(255,255,255,0.2)" filter="blur(4px)" />

                                        {/* Main Crown Body */}
                                        <path
                                            className={userPlan.plan_type === 'premium' ? 'crown-gold-path' : 'crown-silver-path'}
                                            d="M10 70 L5 20 L30 45 L50 5 L70 45 L95 20 L90 70 H10 Z"
                                            stroke="rgba(0,0,0,0.1)" strokeWidth="1"
                                        />

                                        {/* Bottom Band */}
                                        <path d="M10 65 L90 65 V73 H10 Z" fill="rgba(0,0,0,0.05)" />

                                        {/* Gems */}
                                        <circle cx="50" cy="5" r="4" fill="url(#gemGradient)" /> {/* Top Center Gem */}
                                        <circle cx="5" cy="20" r="3" fill="url(#gemGradient)" /> {/* Left Tip Gem */}
                                        <circle cx="95" cy="20" r="3" fill="url(#gemGradient)" /> {/* Right Tip Gem */}

                                        {/* Center Large Ruby */}
                                        <rect x="45" y="45" width="10" height="10" transform="rotate(45 50 50)" fill="url(#rubyGradient)" rx="1" />

                                        {/* Decorative Dots */}
                                        <circle cx="20" cy="68" r="1.5" fill="white" />
                                        <circle cx="50" cy="68" r="1.5" fill="white" />
                                        <circle cx="80" cy="68" r="1.5" fill="white" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div
                            className="level-icon"
                            style={{ backgroundImage: `url('/assets/levels/LV${userStats.level || 1}.png')` }}
                            title={`Level ${userStats.level || 1}`}
                        ></div>
                    </div>
                    <div className="profile-info">
                        <h2>{session?.user?.name}</h2>
                        <p className="user-id">ID: {session?.user?.id}</p>
                    </div>
                    <div className="stats-cards">
                        <div className="stat-card">
                            <span className="stat-label">XP BALANCE</span>
                            <span className="stat-value">{userStats.xp_balance}</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">COMPLETED</span>
                            <span className="stat-value">{userStats.total_missions_completed}</span>
                        </div>
                    </div>
                    <div className="xp-bar-wrapper">
                        <div className="xp-bar-info">
                            <span>Level Progress</span>
                            <span>{userStats.level >= 10 ? 'MAX' : `${Math.floor((userStats.current_level_xp / userStats.xp_needed_for_next) * 100)}%`}</span>
                        </div>
                        <div className="xp-bar-bg">
                            <div className="xp-bar-fill" style={{
                                width: userStats.level >= 10 ? '100%' : `${(userStats.current_level_xp / userStats.xp_needed_for_next) * 100}%`,
                                background: userStats.level >= 10 ? 'linear-gradient(90deg, #ffd700, #ff8c00)' : 'var(--primary)'
                            }}></div>
                        </div>
                        {userStats.level < 10 && (
                            <p className="xp-needed-text">
                                <strong>{userStats.xp_needed_for_next - userStats.current_level_xp} XP</strong> to Level {userStats.level + 1}
                            </p>
                        )}
                    </div>
                </aside>

                {/* Right Side: Missions List */}
                <main className="lb-content">
                    <section className="missions-section glass">
                        <div className="section-header">
                            <h3>🎯 Active Challenges</h3>
                            <p>Complete these tasks to earn rewards 🌸</p>
                        </div>
                        <div className="detailed-mission-list">
                            {error && <div className="lb-error">❌ Error: {error}</div>}
                            {!error && missions.length === 0 && <div className="lb-empty">No missions available yet 🌸</div>}
                            {!error && missions.length > 0 && missions.map(m => (
                                <div key={m.key} className={`d-mission-item ${m.current_count >= m.target_count ? 'completed' : ''}`}>
                                    <div className="dm-icon">
                                        {m.key === 'invite_bot' ? '🤖' : m.key === 'invite_friends' ? '🤝' : m.key === 'clear_guild' ? '🧹' : '🪄'}
                                    </div>
                                    <div className="dm-info">
                                        <h4>{language === 'en' ? m.description_en : m.description_th}</h4>
                                        <div className="dm-progress-meta">
                                            <span>Progress: <strong>{m.current_count}/{m.target_count}</strong></span>
                                            <span className="dm-xp">+{m.reward_xp} XP</span>
                                        </div>
                                        <div className="dm-progress-bar">
                                            <div className="dm-progress-fill" style={{ width: `${Math.min(100, (m.current_count / m.target_count) * 100)}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="dm-action">
                                        {m.is_claimed ? (
                                            <span className="claimed-label">Success ✅</span>
                                        ) : m.current_count >= m.target_count ? (
                                            <button className="claim-btn-large" onClick={() => handleClaimReward(m.key)}>Claim Reward! 🎁</button>
                                        ) : (
                                            <span className="ongoing-label">Ongoing...</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Bottom: Rewards Shop */}
                    <section className="rewards-shop glass">
                        <div className="section-header">
                            <h3>🎁 Rewards Shop</h3>
                            <p>Exchange your XP for exclusive perks! (Coming Soon)</p>
                        </div>
                        <div className="rewards-grid">
                            <div className="reward-card locked">
                                <div className="reward-icon">💎</div>
                                <div className="reward-info">
                                    <h4>1 Day Premium</h4>
                                    <span>Costs 1000 XP</span>
                                </div>
                            </div>
                            <div className="reward-card locked">
                                <div className="reward-icon">👑</div>
                                <div className="reward-info">
                                    <h4>7 Days Premium</h4>
                                    <span>Costs 5000 XP</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </div>

            <style jsx>{`
                .lb-wrapper { padding: 40px; max-width: 1200px; margin: 0 auto; min-height: 100vh; font-family: 'Quicksand', sans-serif; }
                .lb-header { display: flex; align-items: center; gap: 30px; margin-bottom: 40px; }
                .back-btn { padding: 10px 20px; border-radius: 12px; border: 1px solid var(--primary-glow); background: white; color: var(--primary); font-weight: 800; cursor: pointer; transition: 0.3s; }
                .back-btn:hover { background: var(--primary); color: white; transform: translateX(-5px); }
                .lb-header h1 { font-size: 32px; color: #4a4a68; }
                .lb-header h1 span { color: var(--primary); }

                .lb-grid { display: grid; grid-template-columns: 350px 1fr; gap: 30px; }
                
                .lb-profile { padding: 40px; display: flex; flex-direction: column; align-items: center; text-align: center; height: fit-content; }
                .profile-hero { position: relative; margin-bottom: 5px; }
                
                .level-icon { 
                    position: absolute;
                    bottom: -5px;
                    right: -2px;
                    width: 68px; 
                    height: 68px; 
                    background-size: contain;
                    background-position: center;
                    background-repeat: no-repeat;
                    z-index: 20;
                    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    animation: level-wiggle 3s ease-in-out infinite;
                }
                .level-icon:hover { transform: scale(1.15) rotate(5deg); animation-play-state: paused; }

                .profile-img-container { position: relative; padding: 6px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
                
                /* Plan Specific Styles */
                .profile-hero.premium .profile-img-container::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    background: conic-gradient(from 0deg, #ffd700, #ff8c00, #fff3a3, #ffd700);
                    animation: spin 3s linear infinite, twinkling 2s ease-in-out infinite; /* Twinkle only the frame */
                    z-index: 0;
                }
                .profile-hero.premium .profile-img-container {
                    box-shadow: 0 0 15px rgba(255, 215, 0, 0.2); /* Reduced intensity */
                }

                .profile-hero.pro .profile-img-container::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    background: conic-gradient(from 0deg, #e2e8f0, #94a3b8, #cbd5e1, #e2e8f0);
                    animation: spin 5s linear infinite;
                    z-index: 0;
                }
                .profile-hero.pro .profile-img-container {
                    box-shadow: 0 0 15px rgba(148, 163, 184, 0.2);
                }

                .profile-img { width: 140px; height: 140px; border-radius: 50%; border: 4px solid white; position: relative; z-index: 2; background: white; }
                
                .crown-wrapper {
                    position: absolute;
                    top: 2px;
                    right: 8px; /* Perfectly aligned to stick to the border */
                    z-index: 10;
                    transform: rotate(38deg); /* Tilted to match the curve of the border */
                    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
                    animation: float-crown 3s ease-in-out infinite, twinkling 2s ease-in-out infinite; /* Crown twinkles too */
                }

                .crown-svg { width: 45px; height: 45px; }
                .crown-gold-path { fill: url(#goldGradient); }
                .crown-silver-path { fill: url(#silverGradient); }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes twinkling {
                    0%, 100% { filter: brightness(1) contrast(1.1); }
                    50% { filter: brightness(1.2) contrast(1.2); }
                }
                @keyframes float-crown {
                    0%, 100% { transform: rotate(38deg) translateY(0); }
                    50% { transform: rotate(38deg) translateY(-5px); }
                }

                @keyframes level-wiggle {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    25% { transform: translateY(-3px) rotate(-3deg); }
                    75% { transform: translateY(-2px) rotate(3deg); }
                }
                
                .profile-info h2 { font-size: 24px; color: #4a4a68; margin-bottom: 5px; }
                .user-id { font-size: 12px; color: #9ca3af; font-weight: 700; }
                
                .stats-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; width: 100%; margin: 30px 0; }
                .stat-card { background: white; padding: 20px; border-radius: 20px; border: 1px solid #f3f4f6; display: flex; flex-direction: column; gap: 5px; }
                .stat-label { font-size: 10px; font-weight: 900; color: #9ca3af; letter-spacing: 1px; }
                .stat-value { font-size: 18px; font-weight: 900; color: var(--primary); }

                .xp-bar-wrapper { width: 100%; margin-top: 25px; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 25px; }
                .xp-bar-info { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; font-weight: 700; color: #64748b; }
                .xp-bar-bg { width: 100%; height: 10px; background: #f1f5f9; border-radius: 5px; overflow: hidden; margin-bottom: 8px; }
                .xp-bar-fill { height: 100%; background: var(--primary); border-radius: 5px; transition: 1s cubic-bezier(0.17, 0.67, 0.83, 0.67); }
                .xp-needed-text { font-size: 11px; color: #94a3b8; margin: 0; }
                .xp-needed-text strong { color: var(--primary); }

                .lb-content { display: flex; flex-direction: column; gap: 30px; }
                .missions-section, .rewards-shop { padding: 40px; }
                .section-header { margin-bottom: 30px; }
                .section-header h3 { font-size: 22px; color: #4a4a68; margin-bottom: 5px; }
                .section-header p { font-size: 14px; color: #9ca3af; font-weight: 600; }

                .detailed-mission-list { display: flex; flex-direction: column; gap: 20px; max-height: 520px; overflow-y: auto; padding-right: 15px; }
                .detailed-mission-list::-webkit-scrollbar { width: 8px; }
                .detailed-mission-list::-webkit-scrollbar-track { background: rgba(0,0,0,0.02); border-radius: 10px; }
                .detailed-mission-list::-webkit-scrollbar-thumb { background: rgba(255,133,193,0.3); border-radius: 10px; }
                .detailed-mission-list::-webkit-scrollbar-thumb:hover { background: var(--primary); }
                .d-mission-item { display: flex; align-items: center; gap: 20px; padding: 25px; background: white; border-radius: 24px; border: 2px solid #f8fafc; transition: 0.3s; }
                .d-mission-item:hover { transform: scale(1.02); border-color: var(--primary-glow); box-shadow: 0 10px 30px rgba(255,183,226,0.1); }
                .d-mission-item.completed { background: #f0fdf4; border-color: #bbf7d0; }
                
                .dm-icon { font-size: 32px; background: #fdf2f8; min-width: 65px; height: 65px; display: flex; align-items: center; justify-content: center; border-radius: 20px; }
                .dm-info { flex: 1; }
                .dm-info h4 { font-size: 16px; color: #4a4a68; margin-bottom: 10px; }
                .dm-progress-meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; font-weight: 700; }
                .dm-xp { color: var(--primary); font-weight: 900; }
                .dm-progress-bar { height: 10px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
                .dm-progress-fill { height: 100%; background: var(--primary); border-radius: 10px; transition: 1s ease-out; }

                .claim-btn-large { padding: 12px 24px; background: var(--primary); color: white; border: none; border-radius: 14px; font-weight: 800; cursor: pointer; transition: 0.3s; box-shadow: 0 8px 20px rgba(255,183,226,0.4); }
                .claim-btn-large:hover { transform: translateY(-3px); filter: brightness(1.05); }
                .claimed-label { color: #059669; font-weight: 900; font-size: 14px; }
                .ongoing-label { color: #9ca3af; font-weight: 700; font-size: 13px; }

                .rewards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .reward-card { display: flex; align-items: center; gap: 15px; padding: 20px; background: white; border-radius: 20px; border: 1px solid #f3f4f6; }
                .reward-card.locked { opacity: 0.6; cursor: not-allowed; border-style: dashed; }
                .reward-icon { font-size: 24px; }
                .reward-info h4 { font-size: 15px; color: #4a4a68; margin-bottom: 2px; }
                .reward-info span { font-size: 12px; color: var(--primary); font-weight: 800; }

                .lb-loader { height: 100vh; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; color: var(--primary); }
                .lb-error { padding: 40px; text-align: center; color: #ef4444; font-weight: 800; background: #fee2e2; border-radius: 20px; }
                .lb-empty { padding: 40px; text-align: center; color: #9ca3af; font-weight: 700; background: #f9fafb; border-radius: 20px; border: 2px dashed #e5e7eb; }
            `}</style>
        </div>
    );
}
