"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLanguage } from "../../../context/LanguageContext";
import ProWallModal from "../components/ProWallModal";
import PricingModal from "../components/PricingModal";
import ResultModal from "../../../components/ResultModal";
import Portal from "../../../components/Portal";

export default function LeaderboardPage() {
    const { guildId } = useParams();
    const { data: session } = useSession();
    const { t, language } = useLanguage();
    const [missions, setMissions] = useState([]);
    const [userStats, setUserStats] = useState({ xp_balance: 0, total_missions_completed: 0 });
    const [userPlan, setUserPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    const [showPricing, setShowPricing] = useState(false);
    const [proWallState, setProWallState] = useState({ show: false, featureName: '' });
    const [modalState, setModalState] = useState({ show: false, type: 'success', message: '' });

    const fetchMissionsData = async () => {
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

    // Pro Lock Check
    useEffect(() => {
        if (!loading && userPlan) {
            if (userPlan.plan_type === 'free') {
                setProWallState({ show: true, featureName: 'Mission Hub & Leaderboard' });
            } else {
                setProWallState(prev => ({ ...prev, show: false }));
            }
        }
    }, [userPlan, loading]);

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
                setModalState({ show: true, type: 'success', message: `Claimed ${data.xp_added} XP! 🌸✨` });
                fetchMissionsData();
            } else {
                setModalState({ show: true, type: 'error', message: data.error || "Failed to claim reward." });
            }
        } catch (err) {
            console.error("Claim Error:", err);
        }
    };

    const groupedMissions = React.useMemo(() => {
        return {
            daily: missions.filter(m => m.mission_type === 'daily'),
            weekly: missions.filter(m => m.mission_type === 'weekly'),
            lifetime: missions.filter(m => m.mission_type === 'lifetime')
        };
    }, [missions]);

    if (loading) return <div className="lb-loader">🌸 Loading Hub...</div>;

    const renderMissionList = (list, title, icon) => (
        <div className="mission-group animate-slide-up">
            <div className="group-header">
                <span className="group-icon">{icon}</span>
                <h4>{title}</h4>
            </div>
            {list.length === 0 ? (
                <div className="lb-empty mini">No {title.toLowerCase()} available 🌸</div>
            ) : (
                list.map(m => (
                    <div key={m.key} className={`d-mission-item ${m.current_count >= m.target_count ? 'completed' : ''}`}>
                        <div className="dm-icon">
                            {m.mission_type === 'daily' ? '🌅' : m.mission_type === 'weekly' ? '✨' : '♾️'}
                        </div>
                        <div className="dm-info">
                            <h4>{m.title || 'Mission'}</h4>
                            <p className="dm-desc">{m.description || 'No description provided'}</p>
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
                ))
            )}
        </div>
    );

    return (
        <div className="lb-wrapper animate-fade">
            <PricingModal
                show={showPricing}
                userPlan={userPlan}
                onClose={() => setShowPricing(false)}
            />

            <ProWallModal
                show={proWallState.show}
                featureName={proWallState.featureName}
                onClose={() => {
                    setProWallState({ ...proWallState, show: false });
                    if (userPlan?.plan_type === 'free') {
                        router.push(`/servers/${guildId}`);
                    }
                }}
                onProceed={() => {
                    setProWallState({ ...proWallState, show: false });
                    setShowPricing(true);
                }}
            />

            <Portal>
                <ResultModal
                    show={modalState.show}
                    type={modalState.type}
                    message={modalState.message}
                    onClose={() => setModalState({ ...modalState, show: false })}
                />
            </Portal>

            <header className="lb-header">
                <h1>An An <span>Mission Hub</span> 🏆</h1>
            </header>

            <div className="lb-grid">
                {/* Left Side: Profile & Stats */}
                <aside className="lb-profile glass animate-pop">
                    <div className={`profile-hero ${userPlan?.plan_type || 'free'}`}>
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

                            {(userPlan?.plan_type === 'premium' || userPlan?.plan_type === 'pro') && (
                                <div className="crown-wrapper">
                                    <svg className="crown-svg" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
                                        {/* Background Glow */}
                                        <path d="M10 70 L5 20 L30 45 L50 5 L70 45 L95 20 L90 70 Z" fill="rgba(255,255,255,0.2)" filter="blur(4px)" />

                                        {/* Main Crown Body */}
                                        <path
                                            className={userPlan?.plan_type === 'premium' ? 'crown-gold-path' : 'crown-silver-path'}
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

                {/* Right Side: Categorized Missions List */}
                <main className="lb-content">
                    <section className="missions-section glass">
                        <div className="section-header">
                            <h3>🎯 Active Challenges</h3>
                            <p>Complete these tasks to earn rewards 🌸</p>
                        </div>

                        {error && <div className="lb-error">❌ Error: {error}</div>}

                        <div className="categorized-missions">
                            {renderMissionList(groupedMissions.daily, "Daily Missions", "🌅")}
                            {renderMissionList(groupedMissions.weekly, "Weekly Missions", "✨")}
                            {renderMissionList(groupedMissions.lifetime, "Lifetime Missions", "♾️")}
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

        </div>
    );
}
