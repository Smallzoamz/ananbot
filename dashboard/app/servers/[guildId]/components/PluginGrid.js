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

        </div>
    );
};

export default PluginGrid;
