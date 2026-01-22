"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "../../../context/LanguageContext";

export default function VerificationSettings({ params }) {
    const { guildId } = React.use(params);
    const { data: session } = useSession();
    const user = session?.user;
    const { language } = useLanguage();

    const [isLoading, setIsLoading] = useState(true);
    const [config, setConfig] = useState({ enabled: false, role_id: null, channel_id: null });
    const [roles, setRoles] = useState([]);
    const [channels, setChannels] = useState([]);
    const [statusMsg, setStatusMsg] = useState("");

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                // Fetch Settings
                const resSettings = await fetch(`/api/proxy/guild/${guildId}/settings`);
                const dataSettings = await resSettings.json();
                if (dataSettings.verification) setConfig(dataSettings.verification);

                // Fetch Roles
                const resRoles = await fetch(`/api/proxy/guild/${guildId}/action`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: "get_roles", user_id: user.id })
                });
                const dataRoles = await resRoles.json();
                if (dataRoles.roles) setRoles(dataRoles.roles);

                // Fetch Channels (for future feature: selecting channel)
                // We keep it simple for now as per plan (channel is auto-set or manual ID if needed)
                setIsLoading(false);
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();
    }, [guildId, user]);

    const handleSave = async () => {
        setStatusMsg("Saving...");
        try {
            const res = await fetch(`/api/proxy/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_verification_config',
                    user_id: user.id || user.uid,
                    guild_id: guildId,
                    config: config
                })
            });
            const data = await res.json();
            if (data.success) setStatusMsg("✅ Settings Saved!");
            else setStatusMsg("❌ Error saving settings.");
        } catch (e) {
            setStatusMsg("❌ Network Error");
        }
    };

    if (isLoading) return <div className="p-8 text-white">Loading Security Protocols...</div>;

    const verifyLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${guildId}`;

    return (
        <div className="p-8 max-w-4xl mx-auto font-outfit text-white">
            <h1 className="text-3xl font-bold mb-2">🛡️ Gatekeeper Verification</h1>
            <p className="text-gray-400 mb-8">Configure your server's anti-raid verification system.</p>

            <div className="glass p-8 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold">System Status</h2>
                        <p className="text-gray-400 text-sm">Enable or disable the verification requirement.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={config.enabled}
                            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                        />
                        <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                </div>

                <div className="mb-8">
                    <label className="block text-sm font-bold mb-2 text-gray-300">VERIFIED ROLE (THE CITIZEN)</label>
                    <p className="text-xs text-gray-500 mb-2">Users will receive this role after successful verification on the website.</p>
                    <select
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={config.role_id || ""}
                        onChange={(e) => setConfig({ ...config, role_id: e.target.value })}
                    >
                        <option value="">-- Select a Role --</option>
                        {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>

                <div className="mb-8 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                    <h3 className="text-sm font-bold text-blue-400 mb-2">🔗 YOUR VERIFICATION LINK</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            readOnly
                            value={verifyLink}
                            className="bg-transparent text-gray-300 w-full text-sm font-mono outline-none"
                        />
                        <button
                            onClick={() => navigator.clipboard.writeText(verifyLink)}
                            className="text-xs bg-slate-800 px-3 py-1 rounded hover:bg-slate-700 transition"
                        >
                            Copy
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4 mt-8 pt-8 border-t border-white/10">
                    <span className="text-sm font-bold animate-pulse" style={{ color: statusMsg.includes('Error') ? '#ef4444' : '#10b981' }}>{statusMsg}</span>
                    <button
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg font-bold hover:shadow-lg hover:shadow-blue-500/20 transition-all active:scale-95"
                        onClick={handleSave}
                    >
                        Save Configuration 💾
                    </button>
                </div>
            </div>
        </div>
    );
}
