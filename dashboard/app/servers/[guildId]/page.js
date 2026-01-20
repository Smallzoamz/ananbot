"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "../../context/LanguageContext";

// Shared Components
import Portal from "../../components/Portal";
import ResultModal from "../../components/ResultModal";

// Modular Page Components
import HeroBanner from "./components/HeroBanner";
import PluginGrid from "./components/PluginGrid";
import SetupModal from "./components/SetupModal";
import ConfirmModal from "./components/ConfirmModal";
import PricingModal from "./components/PricingModal";
import SelectiveModal from "./components/SelectiveModal";
import PermissionsModal from "./components/PermissionsModal";

export default function Dashboard({ params }) {
    const { guildId } = React.use(params);
    const { data: session } = useSession();
    const user = session?.user;
    const { language } = useLanguage();

    const [activeTab, setActiveTab] = useState("All Plugins");
    const [modalState, setModalState] = useState({ show: false, type: 'success', message: '' });

    // Setup & Action State
    const [showSetup, setShowSetup] = useState(false);
    const [setupStep, setSetupStep] = useState(1); // 1: Template, 2: Flavor, 3: Details
    const [selectedTemplate, setSelectedTemplate] = useState('Shop');
    const [setupFlavor, setSetupFlavor] = useState(""); // "Friend", "Game", "Full", "Standard"
    const [extraDataInput, setExtraDataInput] = useState("");
    const [isDeploying, setIsDeploying] = useState(false);

    // Confirm State
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    // Customization State (For Custom Template)
    const [customRoles, setCustomRoles] = useState([
        { name: "SUPER ADMIN", permissions: "admin", color: "#FFD700", permissions_bitmask: "8" }
    ]);
    const [customZones, setCustomZones] = useState([
        {
            name: "GENERAL",
            allowedRoles: ["SUPER ADMIN"],
            channels: [
                { name: "chat", type: "text", allowedRoles: ["SUPER ADMIN"] },
                { name: "voice", type: "voice", allowedRoles: ["SUPER ADMIN"] }
            ]
        }
    ]);
    const [showPermissions, setShowPermissions] = useState(false);
    const [activeRoleIndex, setActiveRoleIndex] = useState(null);

    // Pricing State
    const [showPricing, setShowPricing] = useState(false);
    const [userPlan, setUserPlan] = useState(null);

    // Selective Deletion State
    const [showSelective, setShowSelective] = useState(false);
    const [serverStructure, setServerStructure] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);

    // Server Stats & Missions
    const [stats, setStats] = useState({ total_members: 0, online_members: 0 });
    const [missions, setMissions] = useState([]);

    const templates = {
        Shop: { name: "Shop (ร้านค้า)", icon: "🛒", desc: "Optimized for selling nitro & services." },
        Community: { name: "Community (คอมมู/หาเพื่อน)", icon: "💬", desc: "For hanging out and chatting." },
        Fanclub: { name: "Fanclub (แฟนคลับ)", icon: "🌟", desc: "Exclusive zone for followers." },
        Custom: { name: "100% Custom Template", icon: "🎨", desc: "Create your own unique style." }
    };

    const availablePermissions = [
        { id: "ADMINISTRATOR", name: "Administrator", value: "8" },
        { id: "MANAGE_GUILD", name: "Manage Server", value: "32" },
        { id: "MANAGE_CHANNELS", name: "Manage Channels", value: "16" },
        { id: "MANAGE_ROLES", name: "Manage Roles", value: "268435456" },
        { id: "KICK_MEMBERS", name: "Kick Members", value: "2" },
        { id: "BAN_MEMBERS", name: "Ban Members", value: "4" },
        { id: "CREATE_INSTANT_INVITE", name: "Create Invite", value: "1" },
        { id: "CHANGE_NICKNAME", name: "Change Nickname", value: "67108864" },
        { id: "MANAGE_NICKNAMES", name: "Manage Nicknames", value: "134217728" },
        { id: "MANAGE_EMOJIS_AND_STICKERS", name: "Manage Emojis", value: "1073741824" },
        { id: "MANAGE_WEBHOOKS", name: "Manage Webhooks", value: "536870912" },
        { id: "VIEW_AUDIT_LOG", name: "View Audit Log", value: "128" },
        { id: "VIEW_CHANNEL", name: "View Channels", value: "1024" },
        { id: "SEND_MESSAGES", name: "Send Messages", value: "2048" },
        { id: "SEND_TTS_MESSAGES", name: "Send TTS", value: "4096" },
        { id: "MANAGE_MESSAGES", name: "Manage Messages", value: "8192" },
        { id: "EMBED_LINKS", name: "Embed Links", value: "16384" },
        { id: "ATTACH_FILES", name: "Attach Files", value: "32768" },
        { id: "READ_MESSAGE_HISTORY", name: "Read History", value: "65536" },
        { id: "MENTION_EVERYONE", name: "Mention Everyone", value: "131072" },
        { id: "USE_EXTERNAL_EMOJIS", name: "External Emojis", value: "262144" },
        { id: "ADD_REACTIONS", name: "Add Reactions", value: "64" },
        { id: "CONNECT", name: "Connect Voice", value: "1048576" },
        { id: "SPEAK", name: "Speak", value: "2097152" },
        { id: "MUTE_MEMBERS", name: "Mute Members", value: "4194304" },
        { id: "DEAFEN_MEMBERS", name: "Deafen Members", value: "8388608" },
        { id: "MOVE_MEMBERS", name: "Move Members", value: "16777216" },
        { id: "USE_VAD", name: "Use VAD", value: "33554432" },
        { id: "PRIORITY_SPEAKER", name: "Priority Speaker", value: "256" }
    ];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`/api/proxy/guild/${guildId}/stats`);
                if (res.ok) setStats(await res.json());
            } catch (e) { console.error("Failed to fetch stats", e); }
        };

        const fetchMissions = async () => {
            if (!user) return;
            try {
                const res = await fetch(`/api/proxy/action`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'get_missions',
                        user_id: user.id || user.uid,
                        guild_id: guildId
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.missions) setMissions(data.missions);
                    if (data.plan) setUserPlan(data.plan);
                    if (data.stats && !stats.total_members) {
                        setStats(prev => ({ ...prev, ...data.stats }));
                    }
                }
            } catch (e) { console.error("Failed to fetch missions/plan", e); }
        };

        fetchStats();
        fetchMissions();
    }, [guildId, user]);

    // Actions
    const handleAction = async (action, template = selectedTemplate) => {
        if (action === 'clear' && !showConfirm) {
            setPendingAction({ action, template });
            setShowConfirm(true);
            return;
        }
        if (action === 'setup' && !showSetup) {
            setSetupStep(1);
            setSetupFlavor("");
            setExtraDataInput("");
            setShowSetup(true);
            return;
        }

        const res = await fetch(`/api/proxy/guild/${guildId}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, template, user_id: user?.id || user?.uid })
        });
        const data = await res.json();
        setModalState({ show: true, type: data.success ? 'success' : 'error', message: data.message });
        setShowConfirm(false);
    };

    const handleDeploy = async () => {
        setIsDeploying(true);

        // Prepare extra_data based on template (Original Logic)
        let finalExtra = {};
        if (selectedTemplate === "Shop") {
            finalExtra = { options: setupFlavor === "Full" ? ["Nitro", "Stream Status", "เม็ด Boost"] : ["Nitro", "Stream Status"] };
        } else if (selectedTemplate === "Community") {
            if (setupFlavor === "Game") {
                finalExtra = { games: extraDataInput.split(",").map(s => s.trim()) };
            }
            // Friend has no extra_data or uses platforms if it was mixed
            if (setupFlavor === "Friend") finalExtra = {};
        } else if (selectedTemplate === "Fanclub") {
            finalExtra = { platforms: extraDataInput.split(",").map(s => s.trim()) };
        } else if (selectedTemplate === "Custom") {
            finalExtra = {
                custom_roles: customRoles.map(r => ({
                    name: r.name,
                    color: r.color,
                    permissions: r.permissions,
                    permissions_bitmask: r.permissions_bitmask
                })),
                custom_zones: customZones
            };
        }

        try {
            const res = await fetch(`/api/proxy/guild/${guildId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'setup',
                    template: selectedTemplate,
                    user_id: user?.id || user?.uid,
                    extra_data: finalExtra
                })
            });
            const data = await res.json();
            setModalState({ show: true, type: data.success ? 'success' : 'error', message: data.message || "Deployment started! 🚀" });
        } catch (err) {
            setModalState({ show: true, type: 'error', message: "Failed to deploy template." });
        } finally {
            setIsDeploying(false);
            setShowSetup(false);
        }
    };

    const handleClaimReward = async (missionKey) => {
        const res = await fetch(`/api/proxy/guild/${guildId}/claim-reward`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user?.id || user?.uid, mission_key: missionKey })
        });
        const data = await res.json();
        setModalState({ show: true, type: data.success ? 'success' : 'error', message: data.message });
        if (data.success) {
            setMissions(prev => prev.map(m => m.key === missionKey ? { ...m, is_claimed: true } : m));
        }
    };

    const fetchStructure = async () => {
        try {
            const res = await fetch(`/api/proxy/guild/${guildId}/structure`);
            if (res.ok) setServerStructure(await res.json());
        } catch (e) { console.error("Failed to fetch structure", e); }
    };

    const toggleSelection = (id, type = "channel", children = []) => {
        setSelectedIds(prev => {
            if (type === "category") {
                const childIds = children.map(c => c.id);
                const allSelected = childIds.every(cid => prev.includes(cid)) && prev.includes(id);
                if (allSelected) return prev.filter(pid => pid !== id && !childIds.includes(pid));
                else return [...new Set([...prev, id, ...childIds])];
            } else {
                return prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id];
            }
        });
    };

    const handleDeleteSelective = async () => {
        setIsDeleting(true);
        const res = await fetch(`/api/proxy/guild/${guildId}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_selective', ids: selectedIds, user_id: user?.id || user?.uid })
        });
        const data = await res.json();
        setIsDeleting(false);
        if (data.success) {
            setShowSelective(false);
            setSelectedIds([]);
            fetchStructure();
        }
        setModalState({ show: true, type: data.success ? 'success' : 'error', message: data.message });
    };

    return (
        <div className="dashboard-container blur-in">
            <HeroBanner
                guildId={guildId}
                missions={missions}
                stats={stats}
                language={language}
                onClaimReward={handleClaimReward}
            />

            <PluginGrid
                guildId={guildId}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onAction={handleAction}
                onFetchStructure={fetchStructure}
                onShowSelectiveModal={setShowSelective}
            />

            <PricingModal
                show={showPricing}
                userPlan={userPlan}
                onClose={() => setShowPricing(false)}
            />

            <SetupModal
                show={showSetup}
                setupStep={setupStep}
                setSetupStep={setSetupStep}
                templates={templates}
                selectedTemplate={selectedTemplate}
                setSelectedTemplate={setSelectedTemplate}
                setupFlavor={setupFlavor}
                setSetupFlavor={setSetupFlavor}
                extraDataInput={extraDataInput}
                setExtraDataInput={setExtraDataInput}
                customRoles={customRoles}
                setCustomRoles={setCustomRoles}
                customZones={customZones}
                setCustomZones={setCustomZones}
                isDeploying={isDeploying}
                onDeploy={handleDeploy}
                onClose={() => setShowSetup(false)}
                onShowPermissions={(idx) => { setActiveRoleIndex(idx); setShowPermissions(true); }}
            />

            <ConfirmModal
                show={showConfirm}
                actionName={pendingAction?.action}
                template={pendingAction?.template}
                onConfirm={() => handleAction(pendingAction?.action, pendingAction?.template)}
                onClose={() => setShowConfirm(false)}
            />

            <SelectiveModal
                show={showSelective}
                serverStructure={serverStructure}
                selectedIds={selectedIds}
                isDeleting={isDeleting}
                onToggle={toggleSelection}
                onDelete={handleDeleteSelective}
                onClose={() => setShowSelective(false)}
            />

            <PermissionsModal
                show={showPermissions}
                activeRoleIndex={activeRoleIndex}
                customRoles={customRoles}
                availablePermissions={availablePermissions}
                onUpdateRoles={setCustomRoles}
                onClose={() => setShowPermissions(false)}
            />

            <ResultModal
                show={modalState.show}
                type={modalState.type}
                message={modalState.message}
                onClose={() => setModalState({ ...modalState, show: false })}
            />

        </div>
    );
}
