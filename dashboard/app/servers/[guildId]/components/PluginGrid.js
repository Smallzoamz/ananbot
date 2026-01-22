"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CrownIcon, ProBadge, TwitchIcon, YouTubeIcon } from "../../../components/Icons";
import ConsoleModal from "./ConsoleModal";

const PluginGrid = ({ guildId, activeTab, onTabChange, onAction, onFetchStructure, onShowSelectiveModal, userPlan, onShowProWall }) => {
    const router = useRouter();
    const { data: session } = useSession();
    const isPapa = session?.user?.id === "956866340474478642" || session?.user?.uid === "956866340474478642";
    const [showConsoleModal, setShowConsoleModal] = React.useState(false);

    const tabs = ["All Plugins", "Essentials", "Stream Alert", "Server Management", "Moderator", "Utilities"];

    const checkPro = (featureName, callback) => {
        if (userPlan?.plan_type === 'free') {
            onShowProWall(featureName);
        } else {
            callback();
        }
    };

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
            badge: <ProBadge />,
            badgeClass: "",
            category: "Essentials",
            desc: "Greet new members and say goodbye with style. Fully customizable messages and images.",
            action: () => checkPro("Welcome & Goodbye", () => router.push(`/servers/${guildId}/welcome`)),
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
            id: "twitch-alerts",
            name: "Twitch Alerts",
            icon: <TwitchIcon size={32} />,
            badge: <ProBadge />,
            badgeClass: "",
            category: "Stream Alert",
            desc: "Instant notifications when your favorite Twitch streamers go live.",
            action: () => checkPro("Twitch Alerts", () => router.push(`/servers/${guildId}/twitch-alerts`)),
            btnText: "Configure"
        },
        {
            id: "youtube-alerts",
            name: "YouTube Alerts",
            icon: <YouTubeIcon size={32} />,
            badge: <ProBadge />,
            badgeClass: "",
            category: "Stream Alert",
            desc: "Notify your server immediately when a YouTube channel starts streaming.",
            action: () => checkPro("YouTube Alerts", () => router.push(`/servers/${guildId}/youtube-alerts`)),
            btnText: "Configure"
        },
        {
            id: "structure",
            name: "Structure Manager",
            icon: "🏗️",
            badge: <ProBadge />,
            badgeClass: "",
            category: "Server Management",
            desc: "Selectively delete categories or specific channels from your server.",
            action: () => checkPro("Structure Manager", () => { onFetchStructure(); onShowSelectiveModal(true); }),
            btnText: "+ Configure"
        },
        {
            id: "terminal",
            name: "System Console",
            icon: "🖥️",
            badge: <ProBadge />,
            badgeClass: "",
            category: "Utilities",
            desc: "Real-time health monitor and command center for Papa.",
            action: () => checkPro("System Console", () => setShowConsoleModal(true)),
            btnText: "Open Console",
            isActive: true
        },
        {
            id: "moderator",
            name: "Moderator",
            icon: "🛡️",
            badge: <ProBadge />,
            badgeClass: "",
            category: "Moderator",
            desc: "Advanced auto-mod, audit logs, and security tools to keep your server safe.",
            action: () => checkPro("Moderator", () => router.push(`/servers/${guildId}/moderator`)),
            btnText: "Configure"
        },
        {
            id: "temproom",
            name: "Temporary Rooms",
            icon: "🔊",
            badge: <ProBadge />,
            badgeClass: "",
            category: "Utilities",
            desc: "Auto-create voice channels for users. Empty rooms delete automatically.",
            action: () => checkPro("Temporary Rooms", () => onAction("setup_temproom")),
            btnText: "+ Enable"
        },
        {
            id: "personalizer",
            name: "Bot Personalizer",
            icon: "🎭",
            badge: <ProBadge />,
            badgeClass: "",
            category: "Essentials",
            desc: "Customize your bot's name, profile, and status for this server.",
            action: () => checkPro("Bot Personalizer", () => router.push(`/servers/${guildId}/personalizer`)),
            btnText: "Configure",
            isActive: true
        },
        {
            id: "ticket",
            name: "Ticket System",
            icon: "🎫",
            badge: <ProBadge />,
            badgeClass: "",
            category: "Utilities",
            desc: "Advanced ticket system with custom menus, auto-close, and transcripts.",
            action: () => checkPro("Ticket System", () => router.push(`/servers/${guildId}/ticket`)),
            btnText: "Configure"
        },
        {
            id: "reaction-roles",
            name: "Reaction Roles",
            icon: "🏷️",
            badge: <ProBadge />,
            badgeClass: "",
            category: "Utilities",
            desc: "Create interactive buttons for users to self-assign server roles.",
            action: () => checkPro("Reaction Roles", () => router.push(`/servers/${guildId}/reaction-roles`)),
            btnText: "Configure"
        }
    ];

    // Papa Exclusive Plugins 🤫👑
    if (isPapa) {
        plugins.push({
            id: "channel-management",
            name: "Channel Management",
            icon: "⚙️",
            badge: "PAPA ONLY",
            badgeClass: "p-badge animate-glow",
            category: "Server Management",
            desc: "Live manage channels, categories, and roles. Exclusive to the Store Owner only.",
            action: () => router.push(`/servers/${guildId}/channels`),
            btnText: "Manage Live",
            isActive: true
        });
    }

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


            {
                showConsoleModal && (
                    <ConsoleModal
                        show={showConsoleModal}
                        onClose={() => setShowConsoleModal(false)}
                        guildId={guildId}
                    />
                )
            }
        </div >
    );
};

export default React.memo(PluginGrid);
