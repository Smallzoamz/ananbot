"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function MissionHub() {
    const { data: session } = useSession();
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('daily'); // daily, weekly, lifetime
    const [claiming, setClaiming] = useState(null);

    useEffect(() => {
        if (session?.user?.id) {
            fetchMissions();
        }
    }, [session]);

    const fetchMissions = async () => {
        try {
            const res = await fetch(`/api/proxy/user/${session.user.id}/missions`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setMissions(data);
            }
        } catch (error) {
            console.error("Failed to fetch missions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async (mission) => {
        setClaiming(mission.key);
        try {
            // Using global claim endpoint (we can use 'global' as guild_id since logic ignores it)
            const res = await fetch(`/api/proxy/guild/global/claim-reward`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: session.user.id,
                    mission_key: mission.key
                })
            });
            const result = await res.json();
            if (result.success) {
                // Refresh missions to update UI
                fetchMissions();
                // Optionally trigger a confetti or toast here
            } else {
                alert(result.error || "Claim failed");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setClaiming(null);
        }
    };

    const visibleMissions = missions.filter(m => m.mission_type === activeTab);

    if (loading) return <div className="text-center p-4">🌸 Loading Missions...</div>;

    return (
        <div className="mission-hub glass p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
                    🎯 Mission Center
                </h2>
                <div className="flex gap-2 bg-white/50 p-1 rounded-xl">
                    {['daily', 'weekly', 'lifetime'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab
                                    ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md'
                                    : 'text-gray-500 hover:bg-white/80'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleMissions.map(m => (
                    <MissionCard
                        key={m.key}
                        mission={m}
                        onClaim={() => handleClaim(m)}
                        isClaiming={claiming === m.key}
                    />
                ))}
            </div>

            {visibleMissions.length === 0 && (
                <div className="text-center py-10 opacity-50">
                    No active {activeTab} missions right now. 💤
                </div>
            )}
        </div>
    );
}

function MissionCard({ mission, onClaim, isClaiming }) {
    const percent = Math.min(100, Math.round((mission.current_count / mission.target_count) * 100));
    const isCompleted = mission.current_count >= mission.target_count;
    const canClaim = isCompleted && !mission.is_claimed;

    return (
        <div className="bg-white/60 p-4 rounded-xl border border-white/50 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-bold text-gray-800">{mission.title}</h3>
                    <p className="text-xs text-gray-500">{mission.description}</p>
                </div>
                <div className="text-xs font-bold px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full flex items-center gap-1">
                    ✨ {mission.reward_xp} XP
                </div>
            </div>

            <div className="mt-4">
                <div className="flex justify-between text-xs mb-1 font-semibold text-gray-500">
                    <span>Progress</span>
                    <span>{mission.current_count} / {mission.target_count}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${isCompleted ? 'bg-green-400' : 'bg-pink-400'}`}
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>

            {canClaim && (
                <button
                    onClick={onClaim}
                    disabled={isClaiming}
                    className="absolute right-4 bottom-4 px-4 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg shadow-lg hover:scale-105 transition-all animate-pulse"
                >
                    {isClaiming ? '...' : 'CLAIM'}
                </button>
            )}

            {mission.is_claimed && (
                <div className="absolute right-4 bottom-4 text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-lg">
                    ✅ CLAIMED
                </div>
            )}
        </div>
    );
}
