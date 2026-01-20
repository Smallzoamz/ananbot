"use client";
import React from "react";
import { useRouter } from "next/navigation";

const HeroBanner = ({ guildId, missions, stats, language, onClaimReward }) => {
    const router = useRouter();

    return (
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

            <style jsx>{`
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
                    margin: 20px 0 80px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border: 2px solid rgba(255, 255, 255, 0.8);
                    box-shadow: 0 30px 60px rgba(255, 183, 226, 0.2), inset 0 0 80px rgba(255, 255, 255, 0.5);
                    position: relative;
                    overflow: visible;
                }
                .hero-text h1 { font-size: 38px; margin-bottom: 30px; font-weight: 900; max-width: 450px; line-height: 1.2; color: #4a4a68; }
                .hero-text h1 span { color: #ff85c1; }
                .hero-buttons { display: flex; gap: 20px; }
                .hero-btn { padding: 14px 30px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.4s; font-size: 15px; border: none; }
                .hero-btn.primary { background: var(--primary); color: white; box-shadow: 0 10px 20px rgba(255,183,226,0.4); }
                .hero-btn.secondary { background: white; color: #4a4a68; border: 1px solid rgba(214, 207, 255, 0.4); }
                .hero-btn:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(255,183,226,0.5); }
                
                .hero-bg-anime { position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; border-radius: 40px; }
                .hero-bg-icon { position: absolute; width: 70px; height: 70px; background-size: contain; background-repeat: no-repeat; opacity: 0.12; filter: blur(1px) grayscale(0.2); transition: opacity 0.5s; }
                
                .mission-card-wrapper { position: absolute; right: -100px; top: -50px; perspective: 1000px; transition: 0.5s; z-index: 100; }
                .mission-card-wrapper:hover { transform: scale(1.08) translateY(-10px); }
                .mission-leaderboard { position: absolute; top: -25px; right: 0; background: var(--primary); padding: 8px 18px; border-radius: 12px; font-size: 11px; font-weight: 900; color: white; transform: rotate(5deg); box-shadow: 0 10px 25px rgba(255,133,193,0.3); z-index: 20; }
                .mission-card { background: rgba(255, 255, 255, 0.2); width: 340px; padding: 24px; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.4); box-shadow: 0 25px 60px -12px rgba(255, 183, 226, 0.35); backdrop-filter: blur(30px); transform: rotate(-3deg); transition: 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; overflow: hidden; }
                .mission-card-wrapper:hover .mission-card { transform: rotate(0deg); }
                
                .mc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
                .mc-title { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 14px; color: #4a4a68; }
                .mc-done { font-size: 10px; font-weight: 900; background: #fdf2f8; color: var(--primary); padding: 5px 12px; border-radius: 20px; }
                
                .mission-list { display: flex; flex-direction: column; gap: 14px; }
                .mission-item { background: rgba(255, 255, 255, 0.1); padding: 16px 20px; border-radius: 18px; display: flex; align-items: center; gap: 12px; transition: 0.3s; border: 1px solid rgba(255,255,255,0.1); }
                .mission-item:hover { background: white; transform: scale(1.03) translateX(8px); border-color: var(--primary); }
                .mi-info { flex: 1; }
                .mi-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
                .mi-head span:first-child { font-size: 13px; font-weight: 800; color: #4a4a68; }
                .mi-xp { font-size: 10px; font-weight: 900; color: var(--primary); }
                .mi-progress-bar { height: 8px; background: rgba(0,0,0,0.05); border-radius: 10px; overflow: hidden; }
                .mi-progress-fill { height: 100%; background: linear-gradient(90deg, #ff85c1, #c084fc); border-radius: 10px; }
                .claim-btn-mini { background: var(--primary); color: white; border: none; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; cursor: pointer; }
                
                .hero-stats { position: absolute; right: 360px; bottom: 80px; display: flex; gap: 20px; z-index: 50; }
                .mini-stat { text-align: center; background: white; padding: 10px 15px; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.03); border: 1px solid #fdf2f8; }
                .ms-val { font-size: 42px; font-weight: 900; color: #ffb7e2; }
                .ms-lab { font-size: 13px; color: #4a4a68; font-weight: 700; opacity: 0.6; text-transform: uppercase; margin-top: 8px; }
                
                @keyframes bounce-x { 0%, 100% { left: 0%; } 50% { left: calc(100% - 70px); } }
                @keyframes bounce-y { 0%, 100% { top: 0%; } 50% { top: calc(100% - 70px); } }
                .lvl-1 { animation: bounce-x 20s linear infinite, bounce-y 12s linear infinite; }
                .lvl-2 { animation: bounce-x 25s linear infinite 2s, bounce-y 15s linear infinite 1s; }
                .lvl-3 { animation: bounce-x 30s linear infinite 4s, bounce-y 18s linear infinite 2s; }
                .lvl-4 { animation: bounce-x 22s linear infinite 6s, bounce-y 14s linear infinite 3s; }
                .lvl-5 { animation: bounce-x 28s linear infinite 1s, bounce-y 16s linear infinite 4s; }
                .lvl-6 { animation: bounce-x 35s linear infinite 3s, bounce-y 20s linear infinite 5s; }
                .lvl-7 { animation: bounce-x 24s linear infinite 5s, bounce-y 13s linear infinite 6s; }
                .lvl-8 { animation: bounce-x 32s linear infinite 7s, bounce-y 19s linear infinite 7s; }
                .lvl-9 { animation: bounce-x 21s linear infinite 8s, bounce-y 11s linear infinite 8s; }
                .lvl-10 { animation: bounce-x 26s linear infinite 9s, bounce-y 17s linear infinite 9s; }
                
                @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(2deg); } }
                .animate-float { animation: float 6s ease-in-out infinite; }
            `}</style>
        </div>
    );
};

export default HeroBanner;
