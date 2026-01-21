"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import ProWallModal from "../components/ProWallModal";
import TicketHistoryModal from "../components/TicketHistoryModal";
import ResultModal from "../components/ResultModal";
import { useLanguage } from "../../../context/LanguageContext";

export default function TicketPage({ params }) {
    const { guildId } = React.use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const { t } = useLanguage();

    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState({ enabled: true, support_role_id: "", topics: [] });
    const [roles, setRoles] = useState([]);
    const [history, setHistory] = useState([]);
    const [showProWall, setShowProWall] = useState(false);

    // Modals State
    const [historyModal, setHistoryModal] = useState({ isOpen: false, ticket: null });
    const [resultModal, setResultModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

    useEffect(() => {
        if (!session) return;
        async function fetchData() {
            try {
                const resSettings = await fetch(`/api/proxy/guild/${guildId}/settings`);
                const dataSettings = await resSettings.json();

                if (dataSettings.ticket_config) {
                    setSettings({ ...settings, ...dataSettings.ticket_config });
                }

                // Fetch Roles
                const resRoles = await fetch(`/api/proxy/guild/${guildId}/roles`);
                const dataRoles = await resRoles.json();
                if (Array.isArray(dataRoles)) {
                    setRoles(dataRoles);
                }

                // Fetch History
                try {
                    const resHist = await fetch(`/api/proxy/guild/${guildId}/tickets/history`);
                    const dataHist = await resHist.json();
                    if (Array.isArray(dataHist)) setHistory(dataHist);
                } catch (e) { console.error("History error", e); }

                // Check Pro (Mock or basic check)
                if (session.user.id !== "956866340474478642") {
                    // Add logic if needed
                }
                setIsLoading(false);
            } catch (e) {
                console.error(e);
                setIsLoading(false);
            }
        }
        fetchData();
    }, [guildId, session]);

    const showResult = (type, title, message) => {
        setResultModal({ isOpen: true, type, title, message });
    };

    const handleSave = async () => {
        try {
            await fetch(`/api/proxy/guild/${guildId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'save_ticket_settings', settings, user_id: session.user.id })
            });
            showResult('success', 'Settings Saved!', 'Your ticket system configuration has been saved successfully.');
        } catch (e) {
            showResult('error', 'Save Failed', 'Could not save settings. Please try again.');
        }
    };

    const handleSendPanel = async () => {
        try {
            const res = await fetch(`/api/proxy/guild/${guildId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'send_ticket_panel', settings, user_id: session.user.id })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                showResult('success', 'Panel Sent!', 'The Ticket Panel has been sent to the appropriate channel.');
            } else {
                showResult('error', 'Send Failed', data.error || data.message || 'Unknown error');
            }
        } catch (e) {
            showResult('error', 'Send Failed', 'Network or server error occurred.');
        }
    };

    const updateTopic = (index, field, value) => {
        const newTopics = [...settings.topics];
        newTopics[index] = { ...newTopics[index], [field]: value };
        setSettings({ ...settings, topics: newTopics });
    };

    const addTopic = () => {
        if (settings.topics.length >= 3) return;
        setSettings({ ...settings, topics: [...settings.topics, { name: "New Topic", code: "NEW", desc: "Description", first_msg: "Hello!" }] });
    };

    const removeTopic = (index) => {
        const newTopics = settings.topics.filter((_, i) => i !== index);
        setSettings({ ...settings, topics: newTopics });
    };

    const openHistory = (ticket) => {
        setHistoryModal({ isOpen: true, ticket });
    };

    if (isLoading) return <div className="loader">🌸 Loading Ticket System...</div>;

    return (
        <div className="animate-fade">
            {/* Header Section */}
            <div className="welcome-header-actions" style={{ marginBottom: '30px' }}>
                <div className="title-group" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h2 style={{ fontSize: '28px', color: '#4a4a68' }}>🎫 {t.ticket.title}</h2>
                    <span className="crown-badge-bubble">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <path d="M5 16L19 16V18H5V16ZM19 8L15.5 11L12 5L8.5 11L5 8V14H19V8Z" />
                        </svg>
                    </span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>

                {/* Configuration Card */}
                <div className="settings-card glass animate-pop">
                    <div className="sc-header">
                        <div className="sc-icon">⚙️</div>
                        <h3>{t.ticket.config}</h3>
                        <div className="sc-toggle">
                            <input
                                type="checkbox"
                                id="ticket_enabled"
                                checked={settings.enabled}
                                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                            />
                            <label htmlFor="ticket_enabled"></label>
                        </div>
                    </div>

                    <div className="sc-body">
                        <p className="sc-desc">{t.ticket.desc}</p>

                        <div className="input-group">
                            <label>{t.ticket.roleLabel}</label>
                            <select
                                className="glass-input"
                                value={settings.support_role_id}
                                onChange={(e) => setSettings({ ...settings, support_role_id: e.target.value })}
                            >
                                <option value="">Select a Role...</option>
                                {roles.map(role => (
                                    <option key={role.id} value={role.id} style={{ color: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : 'inherit' }}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                            <span className="input-hint">{t.ticket.roleHint}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button
                                onClick={handleSave}
                                className="save-btn"
                                style={{ width: '100%', padding: '12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
                            >
                                💾 {t.ticket.save}
                            </button>
                            <button
                                onClick={handleSendPanel}
                                className="save-btn"
                                style={{ width: '100%', padding: '12px', background: '#c084fc', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
                            >
                                📨 {t.ticket.send}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Topics Card */}
                <div className="settings-card glass animate-pop" style={{ animationDelay: '0.1s' }}>
                    <div className="sc-header">
                        <div className="sc-icon">📂</div>
                        <h3>{t.ticket.topics} ({settings.topics.length}/3)</h3>
                        <button
                            onClick={addTopic}
                            disabled={settings.topics.length >= 3}
                            style={{
                                marginLeft: 'auto',
                                background: 'rgba(74, 74, 104, 0.1)',
                                border: 'none',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: '#4a4a68'
                            }}
                        >
                            {t.ticket.add}
                        </button>
                    </div>

                    <div className="sc-body" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                        {settings.topics.map((topic, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.5)', padding: '15px', borderRadius: '16px', marginBottom: '15px', border: '1px solid rgba(255, 183, 226, 0.3)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '900', color: 'var(--primary)', textTransform: 'uppercase' }}>TOPIC #{i + 1}</span>
                                    <span
                                        onClick={() => removeTopic(i)}
                                        style={{ color: '#ff4757', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
                                    >
                                        REMOVE
                                    </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '10px', marginBottom: '10px' }}>
                                    <input
                                        className="glass-input"
                                        style={{ fontSize: '13px', padding: '8px' }}
                                        placeholder="Button Name"
                                        value={topic.name}
                                        onChange={(e) => updateTopic(i, 'name', e.target.value)}
                                    />
                                    <input
                                        className="glass-input"
                                        style={{ fontSize: '13px', padding: '8px', fontFamily: 'monospace', textAlign: 'center' }}
                                        placeholder="CODE"
                                        maxLength={4}
                                        value={topic.code}
                                        onChange={(e) => updateTopic(i, 'code', e.target.value.toUpperCase())}
                                    />
                                </div>
                                <input
                                    className="glass-input"
                                    style={{ width: '100%', marginBottom: '10px', fontSize: '13px', padding: '8px' }}
                                    placeholder="Embed Description"
                                    value={topic.desc}
                                    onChange={(e) => updateTopic(i, 'desc', e.target.value)}
                                />
                                <textarea
                                    className="glass-input"
                                    style={{ width: '100%', height: '60px', fontSize: '13px', padding: '8px', resize: 'none' }}
                                    placeholder="First Message from Bot..."
                                    value={topic.first_msg}
                                    onChange={(e) => updateTopic(i, 'first_msg', e.target.value)}
                                />
                            </div>
                        ))}
                        {settings.topics.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px', padding: '20px' }}>
                                No topics added yet. Click "+ Add Topic" to start.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* History Card */}
            <div className="settings-card glass animate-pop" style={{ marginTop: '30px', animationDelay: '0.2s', opacity: 1 }}>
                <div className="sc-header">
                    <div className="sc-icon">📜</div>
                    <h3>{t.ticket.history}</h3>
                    <span style={{ marginLeft: '10px', fontSize: '12px', background: '#e0e7ff', color: '#4338ca', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>{history.length} Tickets</span>
                </div>
                <div className="sc-body" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>

                    {history.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px', padding: '20px' }}>
                            {t.ticket.noHistory}
                        </div>
                    )}

                    {history.map((ticket, i) => (
                        <div
                            key={i}
                            onClick={() => openHistory(ticket)}
                            style={{ padding: '15px', background: 'rgba(255,255,255,0.4)', borderRadius: '12px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s' }}
                            className="hover:bg-white/60"
                        >
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 'bold', color: '#4a4a68' }}>{ticket.ticket_id}</span>
                                <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>TOPIC: {ticket.topic}</span>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ color: '#6b7280', marginBottom: '4px' }}>{t.ticket.closed} {ticket.ago.replace('ago', t.ticket.ago)}</span>
                                <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    📄 {t.ticket.viewLog}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <ProWallModal
                show={showProWall}
                featureName="Ticket System"
                onClose={() => router.push(`/servers/${guildId}`)}
                onProceed={() => window.open('/pricing', '_blank')}
            />

            <TicketHistoryModal
                isOpen={historyModal.isOpen}
                onClose={() => setHistoryModal({ ...historyModal, isOpen: false })}
                ticket={historyModal.ticket}
            />

            <ResultModal
                isOpen={resultModal.isOpen}
                onClose={() => setResultModal({ ...resultModal, isOpen: false })}
                type={resultModal.type}
                title={resultModal.title}
                message={resultModal.message}
            />
        </div>
    );
}
