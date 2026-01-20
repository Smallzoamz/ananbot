"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { CrownIcon } from "../../../components/Icons";

const PluginGrid = ({ guildId, activeTab, onTabChange, onAction, onFetchStructure, onShowSelectiveModal }) => {
    const router = useRouter();

    const tabs = ["All Plugins", "Essentials", "Server Management", "Security", "Utilities"];

    const plugins = [
        {
            id: "clear",
            name: "Clear & Reset",
            icon: "🧹",
            badge: "ESSENTIAL",
            badgeClass: "p-badge",
            category: "Essentials",
            desc: "Wipe all channels and roles instantly to prepare for clean deployment.",
            action: () => onAction("clear"),
            btnText: "+ Enable"
        },
        {
            id: "welcome",
            name: "Welcome & Goodbye",
            icon: "👋",
            badge: <CrownIcon />,
            badgeClass: "p-badge-s",
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
            action: () => onAction("setup"),
            btnText: "Deploy",
            isActive: true
        },
        {
            id: "structure",
            name: "Structure Manager",
            icon: "🏗️",
            badge: <CrownIcon />,
            badgeClass: "p-badge-s",
            category: "Server Management",
            desc: "Selectively delete categories or specific channels from your server.",
            action: () => { onFetchStructure(); onShowSelectiveModal(true); },
            btnText: "+ Configure"
        },
        {
            id: "terminal",
            name: "anan-terminal",
            icon: "💻",
            badge: <CrownIcon />,
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
            badge: <CrownIcon />,
            badgeClass: "p-badge-s",
            category: "Security",
            desc: "Protect your server with instant lockdown and audit log visibility.",
            action: () => onTabChange("Security"),
            btnText: "+ Enable"
        },
        {
            id: "temproom",
            name: "Temporary Rooms",
            icon: "🔊",
            badge: <CrownIcon />,
            badgeClass: "p-badge-s",
            category: "Utilities",
            desc: "Auto-create voice channels for users. Empty rooms delete automatically.",
            action: () => onAction("setup_temproom"),
            btnText: "+ Enable"
        },
        {
            id: "personalizer",
            name: "Bot Personalizer",
            icon: "🎭",
            badge: <CrownIcon />,
            badgeClass: "p-badge-s",
            category: "Essentials",
            desc: "Customize your bot's name, profile, and status for this server.",
            action: () => router.push(`/servers/${guildId}/personalizer`),
            btnText: "Configure",
            isActive: true
        }
    ];

    const filteredPlugins = activeTab === "All Plugins"
        ? plugins
        : plugins.filter(p => p.category === activeTab);

    return (
        <div className="plugins-section">
            <h2>Plugins</h2>
            <div className="plugin-tabs">
                {tabs.map(tab => (
                    <div
                        key={tab}
                        className={`tab-item ${activeTab === tab ? "active" : ""}`}
                        onClick={() => onTabChange(tab)}
                    >
                        {tab}
                    </div>
                ))}
            </div>

            <div className="plugins-grid">
                {filteredPlugins.map((plugin, index) => (
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
                ))}
            </div>

            <style jsx>{`
                .plugins-section h2 { font-size: 28px; margin-bottom: 30px; font-weight: 900; color: #4a4a68; }
                .plugin-tabs { display: flex; gap: 15px; border-bottom: 2px solid #f3f4f6; margin-bottom: 50px; }
                .tab-item { padding: 15px 25px; font-size: 15px; font-weight: 800; color: #9ca3af; cursor: pointer; transition: 0.3s; }
                .tab-item.active { color: #8b5cf6; position: relative; }
                .tab-item.active::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 2px; background: #8b5cf6; }
                
                .plugins-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 35px; }
                .plugin-card { background: white; border-radius: var(--radius-soft); padding: 40px 30px; display: flex; flex-direction: column; border: 1px solid rgba(255,183,226,0.1); transition: 0.4s; box-shadow: 0 10px 25px rgba(255,183,226,0.05); position: relative; }
                .plugin-card:hover { transform: translateY(-10px); border-color: var(--primary); box-shadow: 0 15px 35px rgba(255,183,226,0.15); }
                
                .pc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
                .pc-icon { font-size: 42px; }
                .p-badge { background: #fdf2f8; color: #ff85c1; font-size: 10px; font-weight: 900; padding: 5px 10px; border-radius: 8px; }
                .p-badge-s { background: #fffbeb; color: #d97706; width: 28px; height: 28px; border-radius: 8px; border: 1px solid rgba(252,211,77,0.4); display: flex; align-items: center; justify-content: center; }
                
                .pc-body h3 { font-size: 20px; margin-bottom: 12px; font-weight: 800; color: #4a4a68; }
                .pc-body p { font-size: 14px; color: #6b7280; line-height: 1.7; margin-bottom: 30px; flex: 1; }
                .pc-btn { width: 100%; padding: 12px; border-radius: 12px; background: #fdf2f8; color: #ff85c1; border: 1px solid rgba(255,183,226,0.2); font-weight: 800; cursor: pointer; transition: 0.3s; }
                .pc-btn.active { background: #f5f3ff; color: #8b5cf6; }
                .pc-btn:hover { background: #ff85c1; color: white; transform: scale(1.02); }
                
                .plugin-sitting-icon { position: absolute; bottom: -15px; right: -15px; width: 50px; height: 50px; background-size: contain; background-repeat: no-repeat; z-index: 10; transition: 0.3s; }
                .plugin-card:hover .plugin-sitting-icon { transform: scale(1.2) rotate(10deg); animation: jump-wiggle 0.5s infinite; }
                @keyframes jump-wiggle { 0%, 100% { transform: scale(1.2) translateY(0) rotate(10deg); } 50% { transform: scale(1.2) translateY(-10px) rotate(-5deg); } }
            `}</style>
        </div>
    );
};

export default PluginGrid;
