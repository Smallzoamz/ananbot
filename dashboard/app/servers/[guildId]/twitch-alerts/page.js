"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "../../../context/LanguageContext";
import Portal from "../../../components/Portal";
import ResultModal from "../../../components/ResultModal";
import { TwitchIcon } from "../../../components/Icons";

export default function TwitchAlertsPage({ params }) {
    const { guildId } = React.use(params);
    const { data: session } = useSession();
    const { language } = useLanguage();

    const [enabled, setEnabled] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [channels, setChannels] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalState, setModalState] = useState({ show: false, type: 'success', message: '' });

    const [newAlert, setNewAlert] = useState({
        platform: 'twitch',
        channel_id: '',
        target_discord_ch: '',
        custom_message: '{streamer} is now LIVE on Twitch! 🟣'
    });

    const isThai = language === 'th';
    const t = {
        title: isThai ? "การแจ้งเตือน Twitch" : "Twitch Alerts",
        desc: isThai ? "แจ้งเตือนอัตโนมัติเมื่อหัวสังกัด Twitch เริ่มสตรีม" : "Automatically notify your server when Twitch streamers go live.",
        status: isThai ? "สถานะระบบ" : "System Status",
        add: isThai ? "เพิ่มช่อง Twitch ใหม่" : "Add New Twitch Channel",
        channel: isThai ? "ชื่อผู้ใช้ Twitch" : "Twitch Username",
        no_alerts: isThai ? "ยังไม่ได้ตั้งค่าการแจ้งเตือน Twitch" : "No Twitch alerts configured yet."
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`/api/proxy/guild/${guildId}/settings`);
                if (res.ok) {
                    const data = await res.json();

                    // Pro check (Redirect free users)
                    if (data.plan_type === 'free') {
                        router.push(`/servers/${guildId}`);
                        return;
                    }

                    if (data.social_config?.twitch) {
                        setEnabled(data.social_config.twitch.enabled || false);
                        setAlerts(data.social_config.twitch.alerts || []);
                    }
                }
            } catch (e) { console.error("Failed to fetch settings", e); }
        };
        const fetchChannels = async () => {
            try {
                const res = await fetch(`/api/proxy/guild/${guildId}/action`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'get_channels',
                        user_id: session?.user?.id || session?.user?.uid
                    })
                });
                const data = await res.json();
                if (data.channels) setChannels(data.channels);
            } catch (e) { console.error("Failed to fetch channels", e); }
        };
        fetchSettings();
        fetchChannels();
    }, [guildId]);

    const handleSave = async (updatedAlerts = alerts, updatedEnabled = enabled) => {
        try {
            // Merge with existing social_config to not overwrite youtube
            const resSettings = await fetch(`/api/proxy/guild/${guildId}/settings`);
            const currentData = await resSettings.json();
            const social_config = currentData.social_config || {};

            social_config.twitch = { enabled: updatedEnabled, alerts: updatedAlerts };

            const res = await fetch(`/api/proxy/guild/${guildId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_social_settings',
                    user_id: session?.user?.id || session?.user?.uid,
                    settings: social_config
                })
            });
            const data = await res.json();
            if (data.success) {
                setModalState({ show: true, type: 'success', message: isThai ? 'บันทึกเรียบร้อย! ✨' : 'Settings saved! ✨' });
            }
        } catch (e) { console.error(e); }
    };

    const addAlert = () => {
        const updated = [...alerts, newAlert];
        setAlerts(updated);
        setShowAddModal(false);
        handleSave(updated);
        setNewAlert({ ...newAlert, channel_id: '', target_discord_ch: '' });
    };

    const handleTest = async (alert) => {
        try {
            const res = await fetch(`/api/proxy/guild/${guildId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'test_social_alert',
                    user_id: session?.user?.id || session?.user?.uid,
                    channel_id: alert.target_discord_ch,
                    platform: 'Twitch',
                    streamer: alert.channel_id
                })
            });
            const data = await res.json();
            if (data.success) {
                setModalState({ show: true, type: 'success', message: isThai ? 'ส่งข้อความทดสอบเรียบร้อย! 🟣' : 'Test alert sent! 🟣' });
            } else {
                setModalState({ show: true, type: 'error', message: data.error || 'Failed to send test' });
            }
        } catch (e) {
            setModalState({ show: true, type: 'error', message: 'Connection Error' });
        }
    };

    return (
        <div className="social-alerts-container blur-in" style={{ padding: '20px' }}>
            <div className="section-header" style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '2rem', color: '#9146ff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TwitchIcon size={40} /> {t.title}
                </h1>
                <p style={{ color: '#666' }}>{t.desc}</p>
            </div>

            <div className="config-card glass" style={{ padding: '25px', borderRadius: '20px', background: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <TwitchIcon size={24} color={enabled ? '#9146ff' : '#ccc'} />
                        <span style={{ fontWeight: '600' }}>{t.status}: {enabled ? 'ON' : 'OFF'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => {
                            if (channels.length > 0) {
                                handleTest({ target_discord_ch: channels[0].id, channel_id: 'An An Live' });
                            } else {
                                setModalState({ show: true, type: 'error', message: 'No channels found to test' });
                            }
                        }} style={{ padding: '8px 15px', borderRadius: '30px', border: '1px solid #9146ff', background: 'transparent', color: '#9146ff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            🚀 {isThai ? 'ส่ง Mockup Test' : 'Send Mockup Test'}
                        </button>
                        <button onClick={() => { setEnabled(!enabled); handleSave(alerts, !enabled); }} className={`toggle-btn ${enabled ? 'active' : ''}`}
                            style={{ padding: '8px 20px', borderRadius: '30px', border: 'none', background: enabled ? '#9146ff' : '#f0f0f0', color: enabled ? 'white' : '#999', cursor: 'pointer' }}>
                            {enabled ? 'ENABLED' : 'DISABLED'}
                        </button>
                    </div>
                </div>

                <div className="alerts-list">
                    {alerts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#ccc', border: '2px dashed #eee', borderRadius: '15px' }}>{t.no_alerts}</div>
                    ) : (
                        alerts.map((alert, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: '#f9f9fb', borderRadius: '12px', marginBottom: '10px', borderLeft: '5px solid #9146ff' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <TwitchIcon size={24} />
                                    <div>
                                        <strong style={{ color: '#333' }}>{alert.channel_id}</strong>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>Post to: {alert.target_discord_ch}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => handleTest(alert)} style={{ background: '#f5f0ff', color: '#9146ff', border: '1px solid #9146ff', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>Test</button>
                                    <button onClick={() => { const u = alerts.filter((_, i) => i !== idx); setAlerts(u); handleSave(u); }} style={{ background: '#fff1f0', color: '#ff4d4f', border: 'none', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <button onClick={() => setShowAddModal(true)} style={{ width: '100%', marginTop: '20px', padding: '15px', borderRadius: '15px', border: '2px dashed #9146ff', color: '#9146ff', background: 'transparent', fontWeight: 'bold', cursor: 'pointer' }}>
                    + {t.add}
                </button>
            </div>

            {showAddModal && (
                <Portal>
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                        <div className="modal-card" style={{ width: '450px', padding: '40px', background: 'white', borderRadius: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', border: '1.5px solid #fcefff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px', justifyContent: 'center' }}>
                                <TwitchIcon size={32} />
                                <h2 style={{ color: '#9146ff' }}>{isThai ? "เพิ่มสตรีมเมอร์" : "Add Streamer"}</h2>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', textAlign: 'center', color: '#666' }}>{t.channel}</label>
                                <input type="text" placeholder="Twitch Username" value={newAlert.channel_id} onChange={(e) => setNewAlert({ ...newAlert, channel_id: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #eee', textAlign: 'center' }} />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', textAlign: 'center', color: '#666' }}>Discord Channel</label>
                                <select
                                    value={newAlert.target_discord_ch}
                                    onChange={(e) => setNewAlert({ ...newAlert, target_discord_ch: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #000', textAlign: 'center', fontWeight: 'bold', background: 'white' }}
                                >
                                    <option value="">-- {isThai ? 'เลือกห้อง' : 'Select Channel'} --</option>
                                    {channels.map(ch => (
                                        <option key={ch.id} value={ch.id}># {ch.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#f0f0f0', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                                <button onClick={() => {
                                    if (!newAlert.target_discord_ch) {
                                        setModalState({ show: true, type: 'error', message: isThai ? 'กรุณาเลือกห้องก่อนค่ะ' : 'Please select a channel first' });
                                        return;
                                    }
                                    handleTest({ target_discord_ch: newAlert.target_discord_ch, channel_id: newAlert.channel_id || 'Twitch Streamer' });
                                }} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #9146ff', background: 'transparent', color: '#9146ff', fontWeight: 'bold', cursor: 'pointer' }}>Test</button>
                                <button onClick={addAlert} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#9146ff', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(145, 70, 255, 0.3)' }}>Add</button>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}

            <ResultModal show={modalState.show} type={modalState.type} message={modalState.message} onClose={() => setModalState({ ...modalState, show: false })} />
        </div>
    );
}
