"use client";
import React from "react";
import { useRouter } from "next/navigation";

const HeroBanner = ({ guildId, missions, stats, language, onClaimReward }) => {
    const router = useRouter();

    return (
        <div className="hero-banner mission-center">
            <div className="hero-bg-anime">
                <div className="mesh-blob blob-1"></div>
                <div className="mesh-blob blob-2"></div>
                <div className="mesh-blob blob-3"></div>
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
                                                {m.is_claimed ? <span>Claimed ✅</span> : <button className="claim-btn-mini" onClick={() => onClaimReward(m.key)}>Claim Reward! 🎁</button>}
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
    );
};

export default React.memo(HeroBanner);
