"use client";
import React, { useState, useEffect } from "react";
import Portal from "../../../../components/Portal";

const LivePermissionsModal = ({ show, channelId, channelName, targetRole, onClose, onSave }) => {
    // Current state for this role's overwrites on this channel
    const [allow, setAllow] = useState(BigInt(targetRole?.allow || 0));
    const [deny, setDeny] = useState(BigInt(targetRole?.deny || 0));

    useEffect(() => {
        if (show && targetRole) {
            setAllow(BigInt(targetRole.allow || 0));
            setDeny(BigInt(targetRole.deny || 0));
        }
    }, [show, targetRole]);

    if (!show || !targetRole) return null;

    const channelPermissions = [
        { id: "VIEW_CHANNEL", name: "ดูช่องข้อมูล (View Channel)", value: 1024n },
        { id: "SEND_MESSAGES", name: "ส่งข้อความ (Send Messages)", value: 2048n },
        { id: "EMBED_LINKS", name: "ฝังลิงก์ (Embed Links)", value: 16384n },
        { id: "ATTACH_FILES", name: "แนบไฟล์ (Attach Files)", value: 32768n },
        { id: "READ_MESSAGE_HISTORY", name: "ดูประวัติข้อความ (Read History)", value: 65536n },
        { id: "CONNECT", name: "เชื่อมต่อห้องเสียง (Connect)", value: 1048576n },
        { id: "SPEAK", name: "พูดในห้องเสียง (Speak)", value: 2097152n },
        { id: "MANAGE_CHANNELS", name: "จัดการช่อง (Manage Channels)", value: 16n },
        { id: "MANAGE_MESSAGES", name: "จัดการข้อความ (Manage Messages)", value: 8192n },
    ];

    const togglePermission = (permValue, state) => {
        // state: 'allow', 'deny', or 'neutral'
        let newAllow = allow;
        let newDeny = deny;

        // Clear existing for this perm
        newAllow &= ~permValue;
        newDeny &= ~permValue;

        if (state === 'allow') {
            newAllow |= permValue;
        } else if (state === 'deny') {
            newDeny |= permValue;
        }

        setAllow(newAllow);
        setDeny(newDeny);
    };

    return (
        <Portal>
            <div className="fixed-overlay z-perms blur-in">
                <div className="modal-card perms-modal glass animate-pop" style={{ maxWidth: '600px', padding: '30px', border: 'none' }}>
                    <button className="modal-close" onClick={onClose}>×</button>

                    <div className="setup-header" style={{ marginBottom: '20px' }}>
                        <div className="so-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', fontSize: '24px' }}>🔐</div>
                        <div className="m-title">
                            <h3 style={{ fontSize: '22px', fontWeight: '900' }}>Edit Permissions</h3>
                            <p style={{ fontSize: '14px', opacity: 0.7 }}>Managing <span style={{ color: '#ec4899', fontWeight: '900' }}>{targetRole.name}</span> in <span style={{ fontWeight: '700' }}>{channelName}</span></p>
                        </div>
                    </div>

                    <div className="modal-body perms-scroll-area" style={{ maxHeight: '400px', overflowY: 'auto', padding: '10px 5px', background: 'rgba(0,0,0,0.02)', borderRadius: '20px' }}>
                        <div className="perms-list" style={{ padding: '10px' }}>
                            {channelPermissions.map(p => {
                                const isAllowed = (allow & p.value) === p.value;
                                const isDenied = (deny & p.value) === p.value;
                                const isNeutral = !isAllowed && !isDenied;

                                return (
                                    <div key={p.id} className="perm-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 10px', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                                        <div className="p-info">
                                            <div style={{ fontWeight: '700', fontSize: '14px', color: '#4a4a68' }}>{p.name}</div>
                                            <div style={{ fontSize: '10px', opacity: 0.4, fontWeight: '800' }}>{p.id}</div>
                                        </div>
                                        <div className="perm-btn-group">
                                            <button
                                                className={`perm-toggle-btn deny ${isDenied ? 'active' : ''}`}
                                                onClick={() => togglePermission(p.value, 'deny')}
                                            >×</button>
                                            <button
                                                className={`perm-toggle-btn neutral ${isNeutral ? 'active' : ''}`}
                                                onClick={() => togglePermission(p.value, 'neutral')}
                                            >/</button>
                                            <button
                                                className={`perm-toggle-btn allow ${isAllowed ? 'active' : ''}`}
                                                onClick={() => togglePermission(p.value, 'allow')}
                                            >✓</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="modal-actions" style={{ marginTop: '25px' }}>
                        <button className="modal-btn ghost" onClick={onClose} style={{ background: 'rgba(0,0,0,0.03)', color: '#64748b' }}>ยกเลิก 🌸</button>
                        <button
                            className="modal-btn primary"
                            onClick={() => onSave(targetRole.id, allow.toString(), deny.toString())}
                            style={{
                                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                                color: 'white',
                                fontWeight: '900',
                                boxShadow: '0 8px 20px rgba(139, 92, 246, 0.25)'
                            }}
                        >
                            บันทึกการตั้งค่าค่ะ ✨
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default LivePermissionsModal;
