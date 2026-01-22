"use client";
import React, { useState } from 'react';

// MOCK DATA - No API calls needed!
const MOCK_MISSIONS = {
    daily: [
        { key: 'daily_chat', name: '💬 Send 10 Messages', description: 'Chat with the community!', xp_reward: 50, progress: 7, goal: 10, claimed: false },
        { key: 'daily_voice', name: '🎤 Join Voice 5 mins', description: 'Hang out in voice chat', xp_reward: 100, progress: 5, goal: 5, claimed: true },
        { key: 'daily_react', name: '❤️ React to 5 Messages', description: 'Show some love!', xp_reward: 30, progress: 2, goal: 5, claimed: false },
    ],
    weekly: [
        { key: 'weekly_chat', name: '💬 Send 100 Messages', description: 'Be an active member!', xp_reward: 500, progress: 45, goal: 100, claimed: false },
        { key: 'weekly_voice', name: '🎤 Voice for 1 Hour', description: 'Quality time with friends', xp_reward: 800, progress: 60, goal: 60, claimed: true },
        { key: 'weekly_invite', name: '📨 Invite 3 Friends', description: 'Grow the community!', xp_reward: 1000, progress: 1, goal: 3, claimed: false },
    ],
    lifetime: [
        { key: 'lifetime_messages', name: '🏆 Send 1,000 Messages', description: 'Legendary chatter!', xp_reward: 2000, progress: 456, goal: 1000, claimed: false },
        { key: 'lifetime_level', name: '⭐ Reach Level 10', description: 'Master of XP', xp_reward: 2500, progress: 7, goal: 10, claimed: false },
        { key: 'lifetime_streak', name: '🔥 7-Day Streak', description: 'Active every day!', xp_reward: 300, progress: 4, goal: 7, claimed: false },
    ]
};

export default function MissionHub() {
    const [activeTab, setActiveTab] = useState('daily');
    const missions = MOCK_MISSIONS[activeTab] || [];

    const completedCount = missions.filter(m => m.progress >= m.goal).length;

    return (
        <div className="mission-hub glass p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
                    🎯 Active Missions
                </h2>
                <span className="text-sm text-pink-500 font-bold">{completedCount}/{missions.length} Done</span>
            </div>

            {/* Tab Buttons */}
            <div className="flex gap-2 bg-white/50 p-1 rounded-xl mb-6">
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

            {/* Mission Cards */}
            <div className="space-y-4">
                {missions.map(mission => {
                    const isComplete = mission.progress >= mission.goal;
                    const progressPercent = Math.min((mission.progress / mission.goal) * 100, 100);

                    return (
                        <div
                            key={mission.key}
                            className={`relative p-4 rounded-xl border-2 transition-all ${isComplete
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                                : 'bg-white/60 border-pink-100 hover:border-pink-300'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-gray-700">{mission.name}</h3>
                                    <p className="text-sm text-gray-500">{mission.description}</p>
                                </div>
                                <span className={`text-sm font-bold ${isComplete ? 'text-green-500' : 'text-pink-500'}`}>
                                    +{mission.xp_reward} XP
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${isComplete
                                        ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                        : 'bg-gradient-to-r from-pink-400 to-rose-400'
                                        }`}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">
                                    {mission.progress}/{mission.goal}
                                </span>
                                {isComplete && !mission.claimed && (
                                    <button className="px-3 py-1 bg-gradient-to-r from-pink-400 to-rose-400 text-white text-xs font-bold rounded-lg hover:scale-105 transition-transform">
                                        Claim ✨
                                    </button>
                                )}
                                {mission.claimed && (
                                    <span className="text-xs text-green-500 font-bold">✓ Claimed</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Leaderboard Button */}
            <div className="mt-6 text-center">
                <button className="px-6 py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                    🏆 Leaderboard
                </button>
            </div>
        </div>
    );
}
