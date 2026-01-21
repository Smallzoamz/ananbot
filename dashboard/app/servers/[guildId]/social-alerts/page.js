"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "../../../context/LanguageContext";
import Portal from "../../../components/Portal";
import ResultModal from "../../../components/ResultModal";

export default function SocialAlertsPage({ params }) {
    const { guildId } = React.use(params);
    const { data: session } = useSession();
    const { language } = useLanguage();

    const [enabled, setEnabled] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalState, setModalState] = useState({ show: false, type: 'success', message: '' });

    // Form State
    const [newAlert, setNewAlert] = useState({
        platform: 'twitch',
        channel_id: '',
        target_discord_ch: '',
        custom_message: '{streamer} is now LIVE! 🌸'
    });

    const t = {
        th: {
            title: "ระบบแจ้งเตือนสตรีม (Live Alerts)",
            desc: "แจ้งเตือนอัตโนมัติเมื่อ Streamer เริ่มสตรีมบนช่องทางต่างๆ",
            status: "สถานะระบบ",
            enabled: "เปิดใช้งาน",
            disabled: "ปิดใช้งาน",
            add_new: "เพิ่มการแจ้งเตือนใหม่",
            no_alerts: "ยังไม่มีการแจ้งเตือนที่ตั้งไว้",
            platform: "แพลตฟอร์ม",
            channel: "ชื่อช่อง / ID",
            discord_ch: "ช่องในดิสคอร์ด",
            save: "บันทึกการตั้งค่า",
            delete: "ลบ",
            test: "ทดสอบ",
            twitch: "Twitch",
            youtube: "YouTube",
            tiktok: "TikTok",
            facebook: "Facebook",
            instagram: "Instagram",
            msg_placeholder: "{streamer} กำลังสตรีมอยู่ค๊าาา! 🌸"
        },
        en: {
            title: "Live Stream Alerts",
            desc: "Automatically notify your server when streamers go live.",
            status: "System Status",
            enabled: "Enabled",
            disabled: "Disabled",
            add_new: "Add New Alert",
            no_alerts: "No alerts configured yet",
            platform: "Platform",
            channel: "Channel Name / ID",
            discord_ch: "Discord Channel",
            save: "Save Settings",
            delete: "Delete",
            test: "Test",
            twitch: "Twitch",
            youtube: "YouTube",
            tiktok: "TikTok",
            facebook: "Facebook",
            instagram: "Instagram",
            msg_placeholder: "{streamer} is live now! 🌸"
        }
    }[language] || { th: {}, en: {} };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`/api/proxy/guild/${guildId}/settings`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.social_config) {
                        setEnabled(data.social_config.enabled || false);
                        setAlerts(data.social_config.alerts || []);
                    }
                }
            } catch (e) { console.error("Failed to fetch social settings", e); }
        };
        fetchSettings();
    }, [guildId]);

    const handleSave = async (updatedAlerts = alerts, updatedEnabled = enabled) => {
        try {
            const res = await fetch(`/api/proxy/guild/${guildId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_social_settings',
                    user_id: session?.user?.id || session?.user?.uid,
                    settings: {
                        enabled: updatedEnabled,
                        alerts: updatedAlerts
                    }
                })
            });
            const data = await res.json();
            if (data.success) {
                setModalState({ show: true, type: 'success', message: 'Settings saved! ✨' });
            } else {
                setModalState({ show: true, type: 'error', message: data.error || 'Failed to save.' });
            }
        } catch (e) {
            setModalState({ show: true, type: 'error', message: 'Network error.' });
        }
    };

    const addAlert = () => {
        const updated = [...alerts, newAlert];
        setAlerts(updated);
        setShowAddModal(false);
        handleSave(updated);
    };

    const removeAlert = (index) => {
        const updated = alerts.filter((_, i) => i !== index);
        setAlerts(updated);
        handleSave(updated);
    };

    return (
        <div className="social-alerts-container blur-in" style={{ padding: '20px' }}>
            <div className="section-header" style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '2rem', color: '#ff85c1', marginBottom: '10px' }}>🌸 {t.title}</h1>
                <p style={{ color: '#666' }}>{t.desc}</p>
            </div>

            <div className="config-card glass" style={{ padding: '25px', borderRadius: '20px', background: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                            width: '12px', height: '12px', borderRadius: '50%',
                            background: enabled ? '#4ade80' : '#ff4d4f',
                            boxShadow: enabled ? '0 0 10px #4ade80' : 'none'
                        }} />
                        <span style={{ fontWeight: '600', color: '#333' }}>{t.status}: {enabled ? t.enabled : t.disabled}</span>
                    </div>
                    <button
                        onClick={() => { setEnabled(!enabled); handleSave(alerts, !enabled); }}
                        className={`toggle-btn ${enabled ? 'active' : ''}`}
                        style={{
                            padding: '8px 20px', borderRadius: '30px', border: 'none',
                            background: enabled ? '#ff85c1' : '#f0f0f0',
                            color: enabled ? 'white' : '#999',
                            cursor: 'pointer', fontWeight: 'bold', transition: '0.3s'
                        }}
                    >
                        {enabled ? 'ON' : 'OFF'}
                    </button>
                </div>

                <div className="alerts-list">
                    {alerts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#ccc', border: '2px dashed #eee', borderRadius: '15px' }}>
                            {t.no_alerts}
                        </div>
                    ) : (
                        alerts.map((alert, idx) => (
                            <div key={idx} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '15px', background: '#f9f9fb', borderRadius: '12px', marginBottom: '10px',
                                borderLeft: `5px solid ${alert.platform === 'twitch' ? '#9146ff' : '#ff0000'}`
                            }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '1.2rem' }}>{alert.platform === 'twitch' ? '🟣' : '🔴'}</span>
                                        <strong style={{ color: '#333' }}>{alert.channel_id}</strong>
                                        <span style={{ fontSize: '0.8rem', color: '#999', background: '#eee', padding: '2px 8px', borderRadius: '10px' }}>
                                            {alert.platform.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
                                        ➡️ Channel ID: {alert.target_discord_ch}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button style={{ background: 'none', border: '1px solid #eee', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>{t.test}</button>
                                    <button onClick={() => removeAlert(idx)} style={{ background: '#fff1f0', color: '#ff4d4f', border: 'none', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>{t.delete}</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    style={{
                        width: '100%', marginTop: '20px', padding: '15px', borderRadius: '15px',
                        border: '2px dashed #ff85c1', background: 'transparent', color: '#ff85c1',
                        fontWeight: 'bold', cursor: 'pointer', transition: '0.3s'
                    }}
                >
                    + {t.add_new}
                </button>
            </div>

            {showAddModal && (
                <Portal>
                    <div className="modal-overlay blur-in" style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zindex: 3000
                    }}>
                        <div className="modal-card glass" style={{
                            width: '500px', padding: '40px', borderRadius: '30px', background: 'white',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.1)', position: 'relative'
                        }}>
                            <h2 style={{ color: '#ff85c1', marginBottom: '25px' }}>✨ {t.add_new}</h2>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{t.platform}</label>
                                <select
                                    value={newAlert.platform}
                                    onChange={(e) => setNewAlert({ ...newAlert, platform: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #eee', background: '#f9f9fb' }}
                                >
                                    <option value="twitch">Twitch</option>
                                    <option value="youtube">YouTube</option>
                                    <option value="tiktok" disabled>TikTok (Coming Soon)</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{t.channel}</label>
                                <input
                                    type="text"
                                    placeholder={newAlert.platform === 'twitch' ? 'Username' : 'Channel ID'}
                                    value={newAlert.channel_id}
                                    onChange={(e) => setNewAlert({ ...newAlert, channel_id: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #eee', background: '#f9f9fb' }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{t.discord_ch} ID</label>
                                <input
                                    type="text"
                                    placeholder="Channel ID"
                                    value={newAlert.target_discord_ch}
                                    onChange={(e) => setNewAlert({ ...newAlert, target_discord_ch: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #eee', background: '#f9f9fb' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                                <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '15px', borderRadius: '15px', border: 'none', background: '#f0f0f0', color: '#999', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                                <button onClick={addAlert} style={{ flex: 1, padding: '15px', borderRadius: '15px', border: 'none', background: '#ff85c1', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 20px rgba(255, 133, 193, 0.3)' }}>Add Alert</button>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}

            <ResultModal
                show={modalState.show}
                type={modalState.type}
                message={modalState.message}
                onClose={() => setModalState({ ...modalState, show: false })}
            />
        </div>
    );
}
