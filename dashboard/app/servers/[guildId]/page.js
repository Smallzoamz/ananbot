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
    const [setupStep, setSetupStep] = useState('select'); // select, options, custom_role, custom_zone
    const [selectedTemplate, setSelectedTemplate] = useState('shop');
    const [isDeploying, setIsDeploying] = useState(false);

    // Confirm State
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmAction, setConfirmAction] = useState({ name: '', template: '' });

    // Customization State
    const [customRoles, setCustomRoles] = useState([]);
    const [customZones, setCustomZones] = useState([]);
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
        shop: { name: "Shop / Marketplace", icon: "🛒", desc: "Best for sellers and traders", roles: ["CEO", "Manager", "Seller", "Customer"], zones: ["Announcement", "Market", "Payment", "Support"] },
        community: { name: "Community / Chat", icon: "💬", desc: "For hanging out and chatting", roles: ["Admin", "Moderator", "Active Member", "Guest"], zones: ["Global", "Lounge", "Media", "Games"] },
        fanclub: { name: "Fanclub / Idol", icon: "🌟", desc: "Exclusive zone for followers", roles: ["Staff", "Artist", "Super Fan", "Follower"], zones: ["News", "VIP Only", "Gallery", "Fan-Talk"] },
        custom: { name: "Custom Mix", icon: "🎨", desc: "Create your own unique style", roles: ["Owner", "Staff", "Member"], zones: ["General", "Staff Zone"] }
    };

    const availablePermissions = [
        { id: "ADMINISTRATOR", name: "Administrator", value: "8" },
        { id: "MANAGE_GUILD", name: "Manage Server", value: "32" },
        { id: "MANAGE_CHANNELS", name: "Manage Channels", value: "16" },
        { id: "MANAGE_ROLES", name: "Manage Roles", value: "268435456" },
        { id: "KICK_MEMBERS", name: "Kick Members", value: "2" },
        { id: "BAN_MEMBERS", name: "Ban Members", value: "4" },
        { id: "MANAGE_NICKNAMES", name: "Manage Nicknames", value: "134217728" },
        { id: "MANAGE_MESSAGES", name: "Manage Messages", value: "8192" },
        { id: "MENTION_EVERYONE", name: "Mention Everyone", value: "131072" },
        { id: "MOVE_MEMBERS", name: "Move Members", value: "16777216" }
    ];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/guild/${guildId}/stats`);
                if (res.ok) setStats(await res.json());
            } catch (e) { console.error("Failed to fetch stats", e); }
        };

        const fetchMissions = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/guild/${guildId}/missions`);
                if (res.ok) setMissions(await res.json());
            } catch (e) { console.error("Failed to fetch missions", e); }
        };

        const fetchUserPlan = async () => {
            if (!user) return;
            try {
                const res = await fetch(`http://localhost:5000/api/user/${user.uid}/plan`);
                if (res.ok) setUserPlan(await res.json());
            } catch (e) { console.error("Failed to fetch plan", e); }
        };

        fetchStats();
        fetchMissions();
        fetchUserPlan();
    }, [guildId, user]);

    // Actions
    const handleAction = async (action, template = null) => {
        if (action === 'clear') {
            setConfirmAction({ name: 'clear', template: null });
            setShowConfirm(true);
            return;
        }
        if (action === 'setup') {
            const defaultRoles = templates.shop.roles.map(r => ({ name: r, color: '#ff85c1' }));
            const defaultZones = templates.shop.zones.map(z => ({ name: z, desc: `Default ${z} zone`, enabled: true }));
            setCustomRoles(defaultRoles);
            setCustomZones(defaultZones);
            setSelectedTemplate('shop');
            setSetupStep('select');
            setShowSetup(true);
            return;
        }

        const res = await fetch(`http://localhost:5000/api/guild/${guildId}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, template, user_id: user?.uid })
        });
        const data = await res.json();
        setModalState({ show: true, type: data.success ? 'success' : 'error', message: data.message });
        setShowConfirm(false);
    };

    const handleDeploy = async () => {
        setIsDeploying(true);
        const res = await fetch(`http://localhost:5000/api/guild/${guildId}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'setup',
                template: selectedTemplate,
                user_id: user?.uid,
                roles: customRoles,
                zones: customZones
            })
        });
        const data = await res.json();
        setIsDeploying(false);
        setShowSetup(false);
        setModalState({ show: true, type: data.success ? 'success' : 'error', message: data.message });
    };

    const handleClaimReward = async (missionKey) => {
        const res = await fetch(`http://localhost:5000/api/guild/${guildId}/claim-reward`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mission_key: missionKey, user_id: user?.uid })
        });
        const data = await res.json();
        setModalState({ show: true, type: data.success ? 'success' : 'error', message: data.message });
        if (data.success) {
            setMissions(prev => prev.map(m => m.key === missionKey ? { ...m, is_claimed: true } : m));
        }
    };

    const fetchStructure = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/guild/${guildId}/structure`);
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
        const res = await fetch(`http://localhost:5000/api/guild/${guildId}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_selective', target_ids: selectedIds, user_id: user?.uid })
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
                actionName={confirmAction.name}
                template={confirmAction.template}
                onConfirm={handleAction}
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

            <style jsx>{`
                .dashboard-container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
            `}</style>
        </div>
    );
}
