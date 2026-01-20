"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

const ServerContext = createContext();

export const ServerProvider = ({ children }) => {
    const { guildId } = useParams();
    const { data: session } = useSession();
    const [guildData, setGuildData] = useState(null);
    const [manageableGuilds, setManageableGuilds] = useState([]);
    const [stats, setStats] = useState({ total_members: 0, online_members: 0, status: "loading" });
    const [userPlan, setUserPlan] = useState({ plan_type: "free" });
    const [loading, setLoading] = useState(true);

    const refreshData = async () => {
        if (!guildId) return;
        try {
            // 1. Fetch Guilds Info
            const guildsRes = await fetch("/api/proxy/guilds");
            const guildsData = await guildsRes.json();
            const current = guildsData.find(g => g.id === guildId);
            setGuildData(current);
            setManageableGuilds(guildsData);

            // 2. Fetch Stats
            const statsRes = await fetch(`/api/proxy/guild/${guildId}/stats`);
            const statsData = await statsRes.json();
            setStats(statsData);

            // 3. Fetch Plan
            if (session?.user?.id) {
                const planRes = await fetch("/api/proxy/action", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "get_missions",
                        user_id: session.user.id,
                        guild_id: guildId
                    })
                });
                const planData = await planRes.json();
                if (planData.plan) setUserPlan(planData.plan);
            }
        } catch (err) {
            console.error("ServerContext Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, [guildId, session?.user?.id]);

    return (
        <ServerContext.Provider value={{
            guildId,
            guildData,
            manageableGuilds,
            stats,
            userPlan,
            loading,
            refreshData
        }}>
            {children}
        </ServerContext.Provider>
    );
};

export const useServer = () => useContext(ServerContext);
