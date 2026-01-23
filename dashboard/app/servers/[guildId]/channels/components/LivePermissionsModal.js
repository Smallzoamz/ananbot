"use client";
import React, { useState, useEffect } from "react";
import Portal from "../../../../components/Portal";

const LivePermissionsModal = ({ show, channelId, channelName, targetRole, onClose, onSave, onBack }) => {
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

    const permissionGroups = [
        {
            title: "General Permissions",
            perms: [
                { id: "ADMINISTRATOR", name: "ผู้ดูแลระบบ (Administrator)", value: 8n },
                { id: "VIEW_CHANNEL", name: "ดูช่องข้อมูล (View Channel)", value: 1024n },
                { id: "MANAGE_CHANNELS", name: "จัดการช่อง (Manage Channels)", value: 16n },
                { id: "MANAGE_ROLES", name: "จัดการสิทธิ์ (Manage Permissions)", value: 268435456n },
                { id: "MANAGE_WEBHOOKS", name: "จัดการเว็บฮุค (Manage Webhooks)", value: 536870912n },
                { id: "CREATE_INSTANT_INVITE", name: "สร้างคำเชิญ (Create Invite)", value: 1n },
            ]
        },
        {
            title: "Text Channel Permissions",
            perms: [
                { id: "SEND_MESSAGES", name: "ส่งข้อความ (Send Messages)", value: 2048n },
                { id: "SEND_MESSAGES_IN_THREADS", name: "ส่งข้อความในเธรด (Send Messages in Threads)", value: 274877906944n },
                { id: "CREATE_PUBLIC_THREADS", name: "สร้างเธรดสาธารณะ (Create Public Threads)", value: 34359738368n },
                { id: "CREATE_PRIVATE_THREADS", name: "สร้างเธรดส่วนตัว (Create Private Threads)", value: 68719476736n },
                { id: "EMBED_LINKS", name: "ฝังลิงก์ (Embed Links)", value: 16384n },
                { id: "ATTACH_FILES", name: "แนบไฟล์ (Attach Files)", value: 32768n },
                { id: "ADD_REACTIONS", name: "เพิ่มรีแอคชัน (Add Reactions)", value: 64n },
                { id: "USE_EXTERNAL_EMOJIS", name: "ใช้อีโมจิภายนอก (Use External Emojis)", value: 262144n },
                { id: "USE_EXTERNAL_STICKERS", name: "ใช้สติกเกอร์ภายนอก (Use External Stickers)", value: 137438953472n },
                { id: "MENTION_EVERYONE", name: "กล่าวถึงทุกคน (Mention Everyone)", value: 131072n },
                { id: "MANAGE_MESSAGES", name: "จัดการข้อความ (Manage Messages)", value: 8192n },
                { id: "MANAGE_THREADS", name: "จัดการเธรด (Manage Threads)", value: 17179869184n },
                { id: "READ_MESSAGE_HISTORY", name: "ดูประวัติข้อความ (Read History)", value: 65536n },
                { id: "SEND_TTS_MESSAGES", name: "ส่งข้อความ TTS (Send TTS Messages)", value: 4096n },
                { id: "USE_APPLICATION_COMMANDS", name: "ใช้คำสั่งแอปพลิเคชัน (Use App Commands)", value: 2147483648n },
            ]
        },
        {
            title: "Voice Channel Permissions",
            perms: [
                { id: "CONNECT", name: "เชื่อมต่อห้องเสียง (Connect)", value: 1048576n },
                { id: "SPEAK", name: "พูดในห้องเสียง (Speak)", value: 2097152n },
                { id: "STREAM", name: "วิดีโอ/แชร์หน้าจอ (Video/Stream)", value: 512n },
                { id: "USE_VAD", name: "ใช้การตรวจจับเสียง (Use Voice Activity)", value: 33554432n },
                { id: "PRIORITY_SPEAKER", name: "ลำโพงลำดับความสำคัญ (Priority Speaker)", value: 256n },
                { id: "MUTE_MEMBERS", name: "ปิดไมค์สมาชิก (Mute Members)", value: 4194304n },
                { id: "DEAFEN_MEMBERS", name: "ปิดหูสมาชิก (Deafen Members)", value: 8388608n },
                { id: "MOVE_MEMBERS", name: "ย้ายสมาชิก (Move Members)", value: 16777216n },
            ]
        }
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
                <div className="modal-card perms-modal-card glass animate-pop">

                    <div className="perms-modal-header">
                        {onBack && (
                            <button className="back-btn perms-back" onClick={onBack}>←</button>
                        )}
                        <div className="perms-icon">🔐</div>
                        <div className="m-title">
                            <h3>Edit Permissions</h3>
                            <p>Managing <span className="role-highlight">{targetRole.name}</span> in <span className="channel-highlight">{channelName}</span></p>
                        </div>
                        <button className="modal-close perms-close" onClick={onClose}>×</button>
                    </div>

                    <div className="perms-scroll-area">
                        <div className="perms-list">
                            {permissionGroups.map((group, gIdx) => (
                                <div key={gIdx} className="perm-group">
                                    <h4 className="perm-group-title">
                                        {group.title}
                                    </h4>
                                    {group.perms.map(p => {
                                        const isAllowed = (allow & p.value) === p.value;
                                        const isDenied = (deny & p.value) === p.value;
                                        const isNeutral = !isAllowed && !isDenied;

                                        return (
                                            <div key={p.id} className="perm-row">
                                                <div className="perm-info">
                                                    <div className="perm-name">{p.name}</div>
                                                    <div className="perm-id">{p.id}</div>
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
                            ))}
                        </div>
                    </div>

                    <div className="perms-modal-actions">
                        <button className="sub-modal-btn cancel" onClick={onClose}>ยกเลิก 🌸</button>
                        <button
                            className="sub-modal-btn primary"
                            onClick={() => onSave(targetRole.id, allow.toString(), deny.toString())}
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
