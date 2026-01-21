"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../context/LanguageContext";
import Portal from "../../../components/Portal";
import ResultModal from "../../../components/ResultModal";
import { CrownIcon } from "../../../components/Icons";

export default function ReactionRolesPage({ params }) {
    const { guildId } = React.use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const { language } = useLanguage();

    const [config, setConfig] = useState({
        title: "✨ เลือกรับยศที่ต้องการ (Reaction Roles)",
        description: "กดปุ่มด้านล่างเพื่อรับยศหรือถอดยศได้ตามต้องการเลยค่ะ! 🌸",
        channel_id: "",
        mappings: []
    });
    const [channels, setChannels] = useState([]);
    const [roles, setRoles] = useState([]);
    const [emojis, setEmojis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalState, setModalState] = useState({ show: false, type: 'success', message: '' });

    const isThai = language === 'th';

    useEffect(() => {
        const fetchData = async () => {
            if (!session?.user) return;
            setLoading(true);
            try {
                // 1. Fetch current settings
                const resSettings = await fetch(`/api/proxy/guild/${guildId}/settings`);
                if (resSettings.ok) {
                    const settingsData = await resSettings.json();

                    // Pro check
                    if (settingsData.plan_type === 'free') {
                        router.push(`/servers/${guildId}`);
                        return;
                    }

                    if (settingsData.reaction_roles_config) {
                        setConfig(settingsData.reaction_roles_config);
                    }
                }

                // 2. Fetch Channels
                const resCh = await fetch(`/api/proxy/guild/${guildId}/action`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'get_channels', user_id: session.user.id || session.user.uid })
                });
                const dataCh = await resCh.json();
                if (dataCh.channels) setChannels(dataCh.channels);

                // 3. Fetch Roles
                const resRoles = await fetch(`/api/proxy/guild/${guildId}/action`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'get_roles', user_id: session.user.id || session.user.uid })
                });
                const dataRoles = await resRoles.json();
                if (dataRoles.roles) setRoles(dataRoles.roles);

                // 4. Fetch Emojis
                const resEmojis = await fetch(`/api/proxy/guild/${guildId}/action`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'get_server_emojis', user_id: session.user.id || session.user.uid })
                });
                const dataEmojis = await resEmojis.json();
                if (dataEmojis.emojis) setEmojis(dataEmojis.emojis);

            } catch (e) {
                console.error("Failed to fetch reaction roles data", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [guildId, session]);

    const handleSaveConfig = async (currentConfig = config) => {
        try {
            const res = await fetch(`/api/proxy/guild/${guildId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_reaction_role_config',
                    user_id: session?.user?.id || session?.user?.uid,
                    config: currentConfig
                })
            });
            return res.ok;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const handleDeploy = async () => {
        if (!config.channel_id) {
            setModalState({ show: true, type: 'error', message: isThai ? "กรุณาเลือกห้องที่จะส่งก่อนนะคะ! 🌸" : "Please select target channel first! 🌸" });
            return;
        }
        if (config.mappings.length === 0) {
            setModalState({ show: true, type: 'error', message: isThai ? "รบกวนเพิ่มยศอย่างน้อย 1 ยศนะคะ! ✨" : "Please add at least one role mapping! ✨" });
            return;
        }

        try {
            // Auto save before deploy
            await handleSaveConfig();

            const res = await fetch(`/api/proxy/guild/${guildId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'post_reaction_role',
                    user_id: session?.user?.id || session?.user?.uid,
                    config: config
                })
            });
            const data = await res.json();
            if (data.success) {
                setModalState({ show: true, type: 'success', message: isThai ? "ส่งระบบ Reaction Roles เข้าห้องเรียบร้อยแล้วค่ะ! 💖" : "Reaction Roles message deployed successfully! 💖" });
            } else {
                setModalState({ show: true, type: 'error', message: data.error || "Failed to deploy" });
            }
        } catch (e) {
            console.error(e);
            setModalState({ show: true, type: 'error', message: "Connection Error" });
        }
    };

    const addMapping = () => {
        const newMappings = [...config.mappings, { role_id: '', emoji: '', label: '', desc: '' }];
        setConfig({ ...config, mappings: newMappings });
    };

    const removeMapping = (index) => {
        const newMappings = config.mappings.filter((_, i) => i !== index);
        setConfig({ ...config, mappings: newMappings });
    };

    const updateMapping = (index, field, value) => {
        const newMappings = [...config.mappings];
        newMappings[index][field] = value;
        setConfig({ ...config, mappings: newMappings });
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>{isThai ? "กำลังโหลดข้อมูล..." : "Loading data..."}</div>;

    return (
        <div className="reaction-roles-container blur-in" style={{ padding: '20px' }}>
            <div className="section-header" style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '2rem', color: '#ffb6c1', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    🏷️ {isThai ? "ระบบ Reaction Roles" : "Reaction Roles System"}
                </h1>
                <p style={{ color: '#666' }}>{isThai ? "สร้างเมนูปุ่มกดรับยศแบบมืออาชีพ สวยงามและรวดเร็วค๊าาา" : "Create professional role assignment buttons with a beautiful embed."}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Embed Configuration */}
                <div className="config-card glass" style={{ padding: '25px', borderRadius: '25px', background: 'white', border: '1.5px solid #fcefff' }}>
                    <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>🖥️ {isThai ? "การตั้งค่า Embed" : "Embed Preview Settings"}</h2>

                    <div style={{ marginBottom: '15px' }}>
                        <label className="label-text">{isThai ? "หัวข้อ (Title)" : "Embed Title"}</label>
                        <input className="input-field" type="text" value={config.title} onChange={(e) => setConfig({ ...config, title: e.target.value })} placeholder="Embed Title" />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label className="label-text">{isThai ? "คำอธิบาย (Description)" : "Embed Description"}</label>
                        <textarea className="input-field" rows={4} value={config.description} onChange={(e) => setConfig({ ...config, description: e.target.value })} placeholder="Click buttons below..." />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label className="label-text">{isThai ? "ห้องที่ต้องการส่ง (Target Channel)" : "Target Discord Channel"}</label>
                        <select className="select-field" value={config.channel_id} onChange={(e) => setConfig({ ...config, channel_id: e.target.value })}>
                            <option value="">-- {isThai ? "เลือกห้องทางดิสคอร์ส" : "Select Discord Channel"} --</option>
                            {channels.map(ch => (
                                <option key={ch.id} value={ch.id}># {ch.name}</option>
                            ))}
                        </select>
                    </div>

                    <button onClick={handleDeploy} style={{ width: '100%', marginTop: '20px', padding: '15px', borderRadius: '15px', background: 'linear-gradient(135deg, #ffb6c1, #ffc0cb)', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 5px 15px rgba(255, 182, 193, 0.4)', fontSize: '1.1rem' }}>
                        🚀 {isThai ? "ส่งเข้าดิสคอร์สเลย!" : "Deploy to Discord!"}
                    </button>
                    <button onClick={() => { handleSaveConfig(); setModalState({ show: true, type: 'success', message: 'Saved!' }) }} style={{ width: '100%', marginTop: '10px', padding: '10px', borderRadius: '10px', background: 'transparent', color: '#ffb6c1', fontWeight: '600', border: '1px solid #ffb6c1', cursor: 'pointer' }}>
                        {isThai ? "บันทึกการตั้งค่า" : "Save Settings"}
                    </button>
                </div>

                {/* Role Mappings */}
                <div className="mappings-card glass" style={{ padding: '25px', borderRadius: '25px', background: 'white', border: '1.5px solid #fcefff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '1.3rem', color: '#333' }}>🛡️ {isThai ? "การจัดการปุ่มและยศ" : "Role Button Mappings"}</h2>
                        <button onClick={addMapping} style={{ padding: '8px 15px', borderRadius: '10px', background: '#e1f5fe', color: '#03a9f4', border: 'none', cursor: 'pointer', fontWeight: '600' }}>+ {isThai ? "เพิ่ม" : "Add"}</button>
                    </div>

                    <div className="mapping-list" style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }}>
                        {config.mappings.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#ccc', padding: '50px' }}>{isThai ? "ยังไม่ได้กำหนดปุ่มรับยศเลยค่ะ" : "No mappings added yet."}</div>
                        ) : (
                            config.mappings.map((mapping, idx) => (
                                <div key={idx} className="mapping-item shadow-sm" style={{ marginBottom: '15px', padding: '15px', border: '1px solid #eee', borderRadius: '15px', background: '#fafafa', position: 'relative' }}>
                                    <button onClick={() => removeMapping(idx)} style={{ position: 'absolute', top: '10px', right: '10px', color: '#ff4d4f', border: 'none', background: 'transparent', cursor: 'pointer' }}>✖</button>

                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.8rem', color: '#888' }}>{isThai ? "รูปที่ต้องการ (Emoji)" : "Emoji"}</label>
                                            <select className="input-mini" value={mapping.emoji} onChange={(e) => updateMapping(idx, 'emoji', e.target.value)}>
                                                <option value="">{isThai ? "ไม่มี" : "None"}</option>
                                                {emojis.map(e => (
                                                    <option key={e.id} value={e.name}>{e.name} (Custom)</option>
                                                ))}
                                                <option value="✨">✨ (Sparkle)</option>
                                                <option value="🌸">🌸 (Cherry Blossom)</option>
                                                <option value="🛡️">🛡️ (Shield)</option>
                                                <option value="🏷️">🏷️ (Tag)</option>
                                                <option value="🔘">🔘 (Button)</option>
                                            </select>
                                        </div>
                                        <div style={{ flex: 2 }}>
                                            <label style={{ fontSize: '0.8rem', color: '#888' }}>{isThai ? "ชื่อบนปุ่ม (Button Label)" : "Button Label"}</label>
                                            <input className="input-mini" value={mapping.label} onChange={(e) => updateMapping(idx, 'label', e.target.value)} placeholder="e.g. Member Role" />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <div style={{ flex: 2 }}>
                                            <label style={{ fontSize: '0.8rem', color: '#888' }}>{isThai ? "ยศที่คนกดจะได้รับ (Role)" : "Discord Role"}</label>
                                            <select className="input-mini" value={mapping.role_id} onChange={(e) => updateMapping(idx, 'role_id', e.target.value)}>
                                                <option value="">-- {isThai ? "เลือกยศ" : "Select Role"} --</option>
                                                {roles.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ flex: 2 }}>
                                            <label style={{ fontSize: '0.8rem', color: '#888' }}>{isThai ? "คำอธิบายเพิ่ม (Optional)" : "Description"}</label>
                                            <input className="input-mini" value={mapping.desc} onChange={(e) => updateMapping(idx, 'desc', e.target.value)} placeholder="รับยศสำหรับ..." />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .label-text { display: block; margin-bottom: 5px; font-weight: 600; color: #555; font-size: 0.9rem; }
                .input-field { width: 100%; padding: 12px; border-radius: 12px; border: 1.5px solid #eee; background: #fff; transition: all 0.3s; }
                .input-field:focus { border-color: #ffb6c1; outline: none; box-shadow: 0 0 0 3px rgba(255, 182, 193, 0.1); }
                .select-field { width: 100%; padding: 12px; border-radius: 12px; border: 1.5px solid #eee; background: #fff; cursor: pointer; }
                .input-mini { width: 100%; padding: 8px; border-radius: 8px; border: 1.2px solid #ddd; background: #fff; font-size: 0.85rem; }
                .mapping-item { transition: transform 0.2s ease-in-out; }
                .mapping-item:hover { transform: translateY(-3px); border-color: #ffb6c1; }
            `}</style>

            <ResultModal show={modalState.show} type={modalState.type} message={modalState.message} onClose={() => setModalState({ ...modalState, show: false })} />
        </div>
    );
}
