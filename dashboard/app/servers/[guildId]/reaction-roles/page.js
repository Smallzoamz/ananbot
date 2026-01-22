"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../context/LanguageContext";
import ResultModal from "../../../components/ResultModal";

export default function ReactionRolesPage({ params }) {
    const { guildId } = React.use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const { language } = useLanguage();

    const [config, setConfig] = useState({
        title: "✨ เลือกรับยศที่ต้องการ",
        description: "กดปุ่มด้านล่างเพื่อรับยศหรือถอดยศได้ตามต้องการเลยค่ะ! 🌸",
        channel_id: "",
        mappings: []
    });
    const [channels, setChannels] = useState([]);
    const [roles, setRoles] = useState([]);
    const [emojis, setEmojis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalState, setModalState] = useState({ show: false, type: 'success', message: '' });
    const [showEmojiPicker, setShowEmojiPicker] = useState(null);

    const isThai = language === 'th';

    // Default Emoji List
    const defaultEmojis = [
        '❤️', '💖', '💕', '💗', '💓', '💝', '🩷', '🩵',
        '✨', '⭐', '🌟', '💫', '🔥', '⚡', '🎇', '🌠',
        '🌸', '🌷', '🌹', '🌺', '🌻', '🌼', '🍀', '🌿',
        '🐱', '🐶', '🐰', '🦊', '🐻', '🐼', '🦁', '🐸',
        '🎮', '🎯', '🎲', '🎨', '🎭', '🎤', '🎵', '🎶',
        '🛡️', '⚔️', '🏷️', '🔷', '🔶', '💠', '🔰', '🔘',
        '👑', '💎', '🏆', '🥇', '🥈', '🥉', '🎖️', '📌',
        '👍', '👏', '🙌', '🤝', '✌️', '🤞', '👋', '✋',
        '😊', '😎', '🥳', '🤩', '😍', '🥰', '🤗', '🙂'
    ];

    useEffect(() => {
        const fetchData = async () => {
            if (!session?.user) return;
            setLoading(true);
            try {
                const resSettings = await fetch(`/api/proxy/guild/${guildId}/settings`);
                if (resSettings.ok) {
                    const settingsData = await resSettings.json();
                    if (settingsData.plan_type === 'free') {
                        router.push(`/servers/${guildId}`);
                        return;
                    }
                    if (settingsData.reaction_roles_config) {
                        setConfig(settingsData.reaction_roles_config);
                    }
                }

                const [resCh, resRoles, resEmojis] = await Promise.all([
                    fetch(`/api/proxy/guild/${guildId}/action`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'get_channels', user_id: session.user.id })
                    }),
                    fetch(`/api/proxy/guild/${guildId}/action`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'get_roles', user_id: session.user.id })
                    }),
                    fetch(`/api/proxy/guild/${guildId}/action`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'get_server_emojis', user_id: session.user.id })
                    })
                ]);

                const [dataCh, dataRoles, dataEmojis] = await Promise.all([resCh.json(), resRoles.json(), resEmojis.json()]);
                if (dataCh.channels) setChannels(dataCh.channels);
                if (dataRoles.roles) setRoles(dataRoles.roles);
                if (dataEmojis.emojis) setEmojis(dataEmojis.emojis);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [guildId, session]);

    const handleSaveConfig = async () => {
        try {
            await fetch(`/api/proxy/guild/${guildId}/action`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'save_reaction_role_config', user_id: session?.user?.id, config })
            });
            setModalState({ show: true, type: 'success', message: isThai ? '✅ บันทึกแล้ว!' : '✅ Saved!' });
        } catch (e) {
            setModalState({ show: true, type: 'error', message: 'Error' });
        }
    };

    const handleDeploy = async () => {
        if (!config.channel_id) {
            setModalState({ show: true, type: 'error', message: isThai ? "กรุณาเลือกห้องก่อนนะคะ!" : "Select a channel first!" });
            return;
        }
        if (config.mappings.length === 0) {
            setModalState({ show: true, type: 'error', message: isThai ? "เพิ่มยศอย่างน้อย 1 ยศนะคะ!" : "Add at least 1 role!" });
            return;
        }
        await handleSaveConfig();
        const res = await fetch(`/api/proxy/guild/${guildId}/action`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'post_reaction_role', user_id: session?.user?.id, config })
        });
        const data = await res.json();
        setModalState({ show: true, type: data.success ? 'success' : 'error', message: data.success ? (isThai ? '🚀 ส่งเข้า Discord แล้ว!' : '🚀 Deployed!') : (data.error || 'Error') });
    };

    const addMapping = () => setConfig({ ...config, mappings: [...config.mappings, { role_id: '', emoji: '', label: '', desc: '' }] });
    const removeMapping = (i) => setConfig({ ...config, mappings: config.mappings.filter((_, idx) => idx !== i) });
    const updateMapping = (i, field, val) => {
        const m = [...config.mappings];
        m[i][field] = val;
        setConfig({ ...config, mappings: m });
    };

    if (loading) return <div className="rr-loading">🔄 {isThai ? "กำลังโหลด..." : "Loading..."}</div>;

    return (
        <div className="rr-page">
            {/* Header */}
            <div className="rr-header">
                <div className="rr-header-content">
                    <h1>🏷️ Reaction Roles</h1>
                    <p>{isThai ? "สร้างปุ่มกดรับยศสวยๆ ให้สมาชิกเลือกรับยศเอง" : "Create beautiful role selection buttons"}</p>
                </div>
                <div className="rr-header-actions">
                    <button className="rr-btn rr-btn-save" onClick={handleSaveConfig}>💾 {isThai ? "บันทึก" : "Save"}</button>
                    <button className="rr-btn rr-btn-deploy" onClick={handleDeploy}>🚀 {isThai ? "ส่งเข้า Discord" : "Deploy"}</button>
                </div>
            </div>

            {/* Main Content */}
            <div className="rr-content">
                {/* Left: Embed Settings + Preview */}
                <div className="rr-panel rr-settings-panel">
                    <h3>📝 {isThai ? "ตั้งค่า Embed" : "Embed Settings"}</h3>

                    <div className="rr-form-row">
                        <label>{isThai ? "หัวข้อ" : "Title"}</label>
                        <input value={config.title} onChange={e => setConfig({ ...config, title: e.target.value })} placeholder="Embed title..." />
                    </div>

                    <div className="rr-form-row">
                        <label>{isThai ? "คำอธิบาย" : "Description"}</label>
                        <textarea rows={3} value={config.description} onChange={e => setConfig({ ...config, description: e.target.value })} placeholder="Description..." />
                    </div>

                    <div className="rr-form-row">
                        <label>{isThai ? "ส่งไปห้อง" : "Target Channel"}</label>
                        <select value={config.channel_id} onChange={e => setConfig({ ...config, channel_id: e.target.value })}>
                            <option value="">-- {isThai ? "เลือกห้อง" : "Select Channel"} --</option>
                            {channels.map(ch => <option key={ch.id} value={ch.id}># {ch.name}</option>)}
                        </select>
                    </div>

                    {/* Live Preview */}
                    <div className="rr-preview">
                        <div className="rr-preview-label">👁️ {isThai ? "ตัวอย่าง" : "Preview"}</div>
                        <div className="rr-preview-embed">
                            <div className="rr-preview-title">{config.title || "Title"}</div>
                            <div className="rr-preview-desc">{config.description || "Description..."}</div>
                            <div className="rr-preview-buttons">
                                {config.mappings.slice(0, 5).map((m, i) => (
                                    <span key={i} className="rr-preview-btn">{m.emoji} {m.label || "Button"}</span>
                                ))}
                                {config.mappings.length > 5 && <span className="rr-preview-btn">+{config.mappings.length - 5}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Role Mappings */}
                <div className="rr-panel rr-mappings-panel">
                    <div className="rr-mappings-header">
                        <h3>🛡️ {isThai ? "ปุ่มรับยศ" : "Role Buttons"} ({config.mappings.length})</h3>
                        <button className="rr-btn-add" onClick={addMapping}>+ {isThai ? "เพิ่ม" : "Add"}</button>
                    </div>

                    <div className="rr-mappings-list">
                        {config.mappings.length === 0 ? (
                            <div className="rr-empty">
                                <span>🎯</span>
                                <p>{isThai ? "ยังไม่มีปุ่มรับยศ" : "No role buttons yet"}</p>
                                <button onClick={addMapping}>+ {isThai ? "เพิ่มปุ่มแรก" : "Add first button"}</button>
                            </div>
                        ) : (
                            config.mappings.map((mapping, idx) => (
                                <div key={idx} className="rr-mapping-card">
                                    <div className="rr-mapping-emoji" onClick={() => setShowEmojiPicker(showEmojiPicker === idx ? null : idx)}>
                                        {mapping.emoji || '➕'}
                                        {showEmojiPicker === idx && (
                                            <div className="rr-emoji-picker" onClick={e => e.stopPropagation()}>
                                                {emojis.length > 0 && (
                                                    <div className="rr-emoji-section">
                                                        <span className="rr-emoji-title">🎨 Server</span>
                                                        <div className="rr-emoji-grid">
                                                            {emojis.map(e => (
                                                                <button key={e.id} onClick={() => { updateMapping(idx, 'emoji', `<:${e.name}:${e.id}>`); setShowEmojiPicker(null); }}>
                                                                    <img src={e.url} alt={e.name} />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="rr-emoji-section">
                                                    <span className="rr-emoji-title">✨ Default</span>
                                                    <div className="rr-emoji-grid">
                                                        {defaultEmojis.map((emoji, i) => (
                                                            <button key={i} onClick={() => { updateMapping(idx, 'emoji', emoji); setShowEmojiPicker(null); }}>{emoji}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button className="rr-emoji-clear" onClick={() => { updateMapping(idx, 'emoji', ''); setShowEmojiPicker(null); }}>❌ Clear</button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="rr-mapping-fields">
                                        <input placeholder={isThai ? "ชื่อปุ่ม" : "Button Label"} value={mapping.label} onChange={e => updateMapping(idx, 'label', e.target.value)} />
                                        <select value={mapping.role_id} onChange={e => updateMapping(idx, 'role_id', e.target.value)}>
                                            <option value="">-- {isThai ? "เลือกยศ" : "Select Role"} --</option>
                                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </div>

                                    <button className="rr-mapping-delete" onClick={() => removeMapping(idx)}>🗑️</button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .rr-page { padding: 20px; max-width: 1200px; margin: 0 auto; }
                .rr-loading { text-align: center; padding: 60px; color: #999; font-size: 1.2rem; }
                
                /* Header */
                .rr-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding: 20px 25px; background: linear-gradient(135deg, #fff5f7, #fef0f5); border-radius: 20px; border: 1.5px solid #ffe4ec; }
                .rr-header h1 { margin: 0; font-size: 1.6rem; color: #ff85a3; }
                .rr-header p { margin: 5px 0 0; font-size: 0.9rem; color: #999; }
                .rr-header-actions { display: flex; gap: 10px; }
                .rr-btn { padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.2s; }
                .rr-btn-save { background: #fff; border: 1.5px solid #ffb6c1; color: #ff85a3; }
                .rr-btn-save:hover { background: #fff5f7; }
                .rr-btn-deploy { background: linear-gradient(135deg, #ff85a3, #ffb6c1); color: #fff; box-shadow: 0 4px 15px rgba(255, 133, 163, 0.35); }
                .rr-btn-deploy:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255, 133, 163, 0.45); }
                
                /* Content Grid */
                .rr-content { display: grid; grid-template-columns: 340px 1fr; gap: 20px; }
                @media (max-width: 900px) { .rr-content { grid-template-columns: 1fr; } }
                
                /* Panels */
                .rr-panel { background: #fff; border-radius: 20px; border: 1.5px solid #ffe4ec; padding: 20px; }
                .rr-panel h3 { margin: 0 0 18px; font-size: 1.1rem; color: #333; }
                
                /* Form */
                .rr-form-row { margin-bottom: 15px; }
                .rr-form-row label { display: block; font-size: 0.8rem; font-weight: 600; color: #888; margin-bottom: 6px; }
                .rr-form-row input, .rr-form-row textarea, .rr-form-row select { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1.5px solid #eee; font-size: 0.9rem; transition: all 0.2s; }
                .rr-form-row input:focus, .rr-form-row textarea:focus, .rr-form-row select:focus { border-color: #ffb6c1; outline: none; box-shadow: 0 0 0 3px rgba(255, 182, 193, 0.15); }
                
                /* Preview */
                .rr-preview { margin-top: 20px; padding: 15px; background: #2f3136; border-radius: 12px; }
                .rr-preview-label { font-size: 0.7rem; color: #72767d; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
                .rr-preview-embed { background: #36393f; border-left: 4px solid #ffb6c1; border-radius: 6px; padding: 12px; }
                .rr-preview-title { color: #fff; font-weight: 600; font-size: 0.95rem; margin-bottom: 6px; }
                .rr-preview-desc { color: #dcddde; font-size: 0.85rem; line-height: 1.4; margin-bottom: 10px; }
                .rr-preview-buttons { display: flex; flex-wrap: wrap; gap: 6px; }
                .rr-preview-btn { background: #5865F2; color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 0.75rem; }
                
                /* Mappings */
                .rr-mappings-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
                .rr-btn-add { padding: 8px 16px; background: #e8f5e9; color: #4caf50; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; }
                .rr-btn-add:hover { background: #c8e6c9; }
                .rr-mappings-list { display: flex; flex-direction: column; gap: 10px; max-height: 500px; overflow-y: auto; }
                
                /* Empty State */
                .rr-empty { text-align: center; padding: 40px 20px; color: #ccc; }
                .rr-empty span { font-size: 3rem; display: block; margin-bottom: 10px; }
                .rr-empty p { margin: 0 0 15px; }
                .rr-empty button { padding: 10px 20px; background: #ffb6c1; color: #fff; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; }
                
                /* Mapping Card */
                .rr-mapping-card { display: flex; align-items: center; gap: 12px; padding: 12px; background: #fafafa; border: 1.5px solid #f0f0f0; border-radius: 14px; transition: all 0.2s; }
                .rr-mapping-card:hover { border-color: #ffccd5; background: #fff; }
                .rr-mapping-emoji { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #fff5f7, #fff); border: 2px solid #ffccd5; border-radius: 12px; font-size: 1.5rem; cursor: pointer; position: relative; transition: all 0.2s; }
                .rr-mapping-emoji:hover { transform: scale(1.05); border-color: #ff85a3; }
                .rr-mapping-fields { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                .rr-mapping-fields input, .rr-mapping-fields select { padding: 8px 10px; border-radius: 8px; border: 1.5px solid #eee; font-size: 0.85rem; }
                .rr-mapping-fields input:focus, .rr-mapping-fields select:focus { border-color: #ffb6c1; outline: none; }
                .rr-mapping-delete { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: #fff5f5; border: none; border-radius: 10px; cursor: pointer; font-size: 1rem; transition: all 0.2s; }
                .rr-mapping-delete:hover { background: #ffe4e4; transform: scale(1.1); }
                
                /* Emoji Picker */
                .rr-emoji-picker { position: absolute; top: 55px; left: 0; z-index: 100; width: 280px; max-height: 320px; overflow-y: auto; background: #fff; border-radius: 14px; border: 1.5px solid #ffccd5; box-shadow: 0 10px 40px rgba(255, 133, 163, 0.25); padding: 12px; }
                .rr-emoji-section { margin-bottom: 12px; }
                .rr-emoji-title { display: block; font-size: 0.7rem; color: #ff85a3; font-weight: 700; margin-bottom: 8px; }
                .rr-emoji-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; }
                .rr-emoji-grid button { width: 28px; height: 28px; border: none; background: transparent; border-radius: 6px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
                .rr-emoji-grid button:hover { background: #ffe4f0; transform: scale(1.15); }
                .rr-emoji-grid button img { width: 20px; height: 20px; }
                .rr-emoji-clear { width: 100%; margin-top: 8px; padding: 6px; background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; font-size: 0.75rem; color: #999; cursor: pointer; }
                .rr-emoji-clear:hover { background: #ffe4e4; color: #ff6b6b; }
            `}</style>

            <ResultModal show={modalState.show} type={modalState.type} message={modalState.message} onClose={() => setModalState({ ...modalState, show: false })} />
        </div>
    );
}
