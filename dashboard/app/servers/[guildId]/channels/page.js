"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Portal from "../../../components/Portal";
import ResultModal from "../../../components/ResultModal";
import CreateModal from "./components/CreateModal";
import DeleteModal from "./components/DeleteModal";
import LivePermissionsModal from "./components/LivePermissionsModal";
import AddRoleModal from "./components/AddRoleModal";

export default function ChannelManagement({ params }) {
    const { guildId } = React.use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const user = session?.user;

    // Security Guard 🛡️
    const papaId = "956866340474478642";
    const isPapa = user?.id === papaId || user?.uid === papaId;

    const [structure, setStructure] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeZoneIndex, setActiveZoneIndex] = useState(0);
    const [selectedChannelId, setSelectedChannelId] = useState(null);
    const [modalState, setModalState] = useState({ show: false, type: 'success', message: '' });
    const [isProcessing, setIsProcessing] = useState(false);

    // Modal State
    const [showCreate, setShowCreate] = useState(false);
    const [createType, setCreateType] = useState('text');
    const [parentCatId, setParentCatId] = useState(null);

    const [showDelete, setShowDelete] = useState(false);
    const [pendingDelete, setPendingDelete] = useState({ id: null, name: "" });

    const [showLivePerms, setShowLivePerms] = useState(false);
    const [permsTarget, setPermsTarget] = useState({ channelId: null, channelName: "", role: null });

    const [showAddRole, setShowAddRole] = useState(false);
    const [targetChannelForAddRole, setTargetChannelForAddRole] = useState(null);

    // Zone Permission Modal State
    const [showZonePermModal, setShowZonePermModal] = useState(false);
    const [zonePermModalIdx, setZonePermModalIdx] = useState(null);

    useEffect(() => {
        if (!isPapa && !loading && user) {
            router.push(`/servers/${guildId}`);
            return;
        }
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [guildId, user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [structRes, roleRes] = await Promise.all([
                fetch(`/api/proxy/guild/${guildId}/structure`),
                fetch(`/api/proxy/guild/${guildId}/roles`)
            ]);
            if (structRes.ok) setStructure(await structRes.json());
            if (roleRes.ok) setRoles(await roleRes.json());
        } catch (e) {
            console.error("Failed to fetch data", e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (type, name) => {
        setShowCreate(false);
        setIsProcessing(true);
        try {
            const res = await fetch(`/api/proxy/guild/${guildId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_channel_live',
                    user_id: user?.id || user?.uid,
                    type,
                    name,
                    category_id: parentCatId
                })
            });
            const data = await res.json();
            if (data.success) {
                setModalState({ show: true, type: 'success', message: `Successfully created ${type}: ${name} 🪄` });
                fetchData();
            } else {
                setModalState({ show: true, type: 'error', message: data.error || "Failed to create channel." });
            }
        } catch (e) {
            setModalState({ show: true, type: 'error', message: "Network error occurred." });
        } finally {
            setIsProcessing(false);
            setParentCatId(null);
        }
    };

    const handleDelete = async () => {
        const channelId = pendingDelete.id;
        setShowDelete(false);
        setIsProcessing(true);
        try {
            const res = await fetch(`/api/proxy/guild/${guildId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete_channel_live',
                    user_id: user?.id || user?.uid,
                    channel_id: channelId
                })
            });
            const data = await res.json();
            if (data.success) {
                setModalState({ show: true, type: 'success', message: `Deleted! 🗑️` });
                fetchData();
            } else {
                setModalState({ show: true, type: 'error', message: data.error || "Failed to delete channel." });
            }
        } catch (e) {
            setModalState({ show: true, type: 'error', message: "Network error occurred." });
        } finally {
            setIsProcessing(false);
            setPendingDelete({ id: null, name: "" });
        }
    };

    const handleUpdatePermissions = async (roleId, allow, deny) => {
        setShowLivePerms(false);
        setIsProcessing(true);
        try {
            const res = await fetch(`/api/proxy/guild/${guildId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_channel_permissions_live',
                    user_id: user?.id || user?.uid,
                    channel_id: permsTarget.channelId,
                    role_id: roleId,
                    allow,
                    deny
                })
            });
            const data = await res.json();
            if (data.success) {
                setModalState({ show: true, type: 'success', message: "Permissions updated! 🔐" });
                fetchData();
            } else {
                setModalState({ show: true, type: 'error', message: data.error || "Failed to update permissions." });
            }
        } catch (e) {
            setModalState({ show: true, type: 'error', message: "Network error occurred." });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddRoleSelect = (role) => {
        setShowAddRole(false);
        if (role && targetChannelForAddRole) {
            setPermsTarget({
                channelId: targetChannelForAddRole.id,
                channelName: targetChannelForAddRole.name,
                role: { id: role.id, name: role.name, allow: "0", deny: "0" }
            });
            setShowLivePerms(true);
        }
    };

    if (!isPapa) return <div className="p-20 text-center">🚫 Access Denied: Papa Only!</div>;

    const activeZone = structure[activeZoneIndex];

    const PermissionView = ({ channel }) => {
        if (!channel) return null;
        return (
            <div className="perm-view-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <p style={{ margin: 0, fontSize: '10px', fontWeight: '900', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Role Permissions</p>
                    <button
                        className="mini-add-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            setTargetChannelForAddRole(channel);
                            setShowAddRole(true);
                        }}
                    >+ Add Role</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(channel.overwrites || []).map(ow => (
                        <div
                            key={ow.id}
                            className="role-badge-pill"
                            onClick={(e) => {
                                e.stopPropagation();
                                setPermsTarget({ channelId: channel.id, channelName: channel.name, role: ow });
                                setShowLivePerms(true);
                            }}
                        >
                            <span style={{ fontSize: '10px', opacity: 0.6 }}>🔐</span>
                            {ow.name}
                        </div>
                    ))}
                    {(!channel.overwrites || channel.overwrites.length === 0) && (
                        <p style={{ fontSize: '10px', opacity: 0.3, fontStyle: 'italic' }}>No role overwrites set.</p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="dashboard-container blur-in channel-mgmt-layout">
            <div className="setup-header channel-mgmt-header">
                <button className="back-btn" onClick={() => router.push(`/servers/${guildId}`)}>←</button>
                <div className="m-title">
                    <h3 style={{ fontSize: '24px', fontWeight: '950', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>Channel Management 🏗️</h3>
                    <p style={{ fontSize: '13px', opacity: 0.7, fontWeight: '600' }}>Live manage server structure. Exclusive to Papa only.</p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <button
                        className="modal-btn"
                        onClick={() => {
                            setCreateType('category');
                            setParentCatId(null);
                            setShowCreate(true);
                        }}
                        disabled={isProcessing}
                        style={{
                            background: 'rgba(236, 72, 153, 0.1)',
                            color: '#ec4899',
                            border: '1px solid rgba(236, 72, 153, 0.2)',
                            fontWeight: '900',
                            padding: '10px 20px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            width: 'auto'
                        }}
                    >
                        + NEW CATEGORY
                    </button>
                </div>
            </div>

            <div className="channel-mgmt-grid">
                {/* Left Panel: Category List */}
                <div className="channel-mgmt-panel category-list">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexShrink: 0 }}>
                        <p style={{ fontSize: '10px', fontWeight: '950', color: 'var(--primary)', letterSpacing: '1.2px', textTransform: 'uppercase' }}>Categories</p>
                        <span style={{ fontSize: '9px', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '50px', fontWeight: '800' }}>{structure.length} Total</span>
                    </div>

                    <div className="channel-scroll-area">
                        {structure.map((zone, idx) => (
                            <div
                                key={zone.id}
                                className={`zone-item-select ${activeZoneIndex === idx ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveZoneIndex(activeZoneIndex === idx ? null : idx);
                                    setSelectedChannelId(null);
                                }}
                            >
                                <div className="zone-item-header">
                                    <div className="zone-item-info">
                                        <h4 className="zone-item-name">{zone.name}</h4>
                                        <p>{zone.channels?.length || 0} Channels</p>
                                    </div>
                                    <div className="zone-item-actions">
                                        <button
                                            className="zone-settings-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setZonePermModalIdx(idx);
                                                setShowZonePermModal(true);
                                            }}
                                            title="Role Permissions"
                                        >⚙️</button>
                                        <button
                                            className="mini-del-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPendingDelete({ id: zone.id, name: zone.name });
                                                setShowDelete(true);
                                            }}
                                        >×</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Channels in Category */}
                <div className="channel-mgmt-panel channel-list">
                    {activeZone ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid rgba(0,0,0,0.03)', flexShrink: 0 }}>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '950', color: '#4a4a68', letterSpacing: '-0.3px' }}>
                                        Channels in <span style={{ color: '#ec4899', background: 'rgba(236, 72, 153, 0.05)', padding: '3px 10px', borderRadius: '10px' }}>{activeZone.name}</span>
                                    </h4>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        className="mini-add-btn"
                                        onClick={() => {
                                            setCreateType('text');
                                            setParentCatId(activeZone.id);
                                            setShowCreate(true);
                                        }}
                                        disabled={isProcessing}
                                        style={{ padding: '8px 16px', fontSize: '11px', borderRadius: '10px' }}
                                    >+ TEXT ROOM</button>
                                    <button
                                        className="mini-add-btn"
                                        style={{
                                            padding: '8px 16px',
                                            fontSize: '11px',
                                            borderRadius: '10px',
                                            background: 'rgba(139, 92, 246, 0.08)',
                                            color: '#8b5cf6',
                                            borderColor: 'rgba(139, 92, 246, 0.15)'
                                        }}
                                        onClick={() => {
                                            setCreateType('voice');
                                            setParentCatId(activeZone.id);
                                            setShowCreate(true);
                                        }}
                                        disabled={isProcessing}
                                    >+ VOICE ROOM</button>
                                </div>
                            </div>

                            <div className="channel-scroll-area">
                                {activeZone.channels?.map((ch) => (
                                    <div
                                        key={ch.id}
                                        className={`ch-item-premium ${selectedChannelId === ch.id ? 'active' : ''}`}
                                        onClick={() => setSelectedChannelId(selectedChannelId === ch.id ? null : ch.id)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '12px',
                                                    background: ch.type.includes('voice') ? 'linear-gradient(135deg, #a78bfa, #8b5cf6)' : 'linear-gradient(135deg, #f472b6, #ec4899)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '18px',
                                                    color: 'white',
                                                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                                                }}>
                                                    {ch.type.includes('voice') ? '🔊' : '💬'}
                                                </div>
                                                <div>
                                                    <span style={{ fontWeight: '900', fontSize: '15px', color: '#4a4a68', display: 'block' }}>{ch.name}</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ fontSize: '9px', background: 'rgba(0,0,0,0.05)', padding: '1px 6px', borderRadius: '4px', fontWeight: '800', opacity: 0.6, textTransform: 'uppercase' }}>{ch.type}</span>
                                                        <span style={{ fontSize: '9px', opacity: 0.3, fontWeight: '700' }}>ID: {ch.id}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                className="delete-btn"
                                                style={{
                                                    background: 'rgba(239, 68, 68, 0.08)',
                                                    color: '#ef4444',
                                                    padding: '6px 14px',
                                                    borderRadius: '10px',
                                                    fontSize: '11px',
                                                    fontWeight: '800',
                                                    border: '1px solid rgba(239, 68, 68, 0.15)',
                                                    transition: '0.2s',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPendingDelete({ id: ch.id, name: ch.name });
                                                    setShowDelete(true);
                                                }}
                                            >DELETE</button>
                                        </div>
                                    </div>
                                ))}

                                {(!activeZone.channels || activeZone.channels.length === 0) && (
                                    <div className="empty-state" style={{ padding: '80px 0', textAlign: 'center', opacity: 0.3 }}>
                                        <div style={{ fontSize: '50px', marginBottom: '20px' }}>🌸</div>
                                        <p style={{ fontWeight: '800', fontSize: '16px' }}>No channels in this category yet.</p>
                                        <p style={{ fontSize: '13px' }}>Start building your kingdom, Papa!</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                            <div style={{ fontSize: '80px', marginBottom: '30px' }}>🏗️</div>
                            <p style={{ fontSize: '20px', fontWeight: '950' }}>Select a Category to manage channels</p>
                            <p style={{ fontSize: '14px', fontWeight: '700', marginTop: '10px' }}>Everything is under your command!</p>
                        </div>
                    )}
                </div>
            </div>

            <CreateModal
                show={showCreate}
                type={createType}
                onClose={() => setShowCreate(false)}
                onConfirm={handleCreate}
            />

            <DeleteModal
                show={showDelete}
                channelId={pendingDelete.id}
                channelName={pendingDelete.name}
                onClose={() => setShowDelete(false)}
                onConfirm={handleDelete}
            />

            <LivePermissionsModal
                show={showLivePerms}
                channelId={permsTarget.channelId}
                channelName={permsTarget.channelName}
                targetRole={permsTarget.role}
                onClose={() => setShowLivePerms(false)}
                onSave={handleUpdatePermissions}
                onBack={() => {
                    setShowLivePerms(false);
                    setShowZonePermModal(true);
                }}
            />

            <AddRoleModal
                show={showAddRole}
                roles={roles}
                onClose={() => setShowAddRole(false)}
                onSelect={handleAddRoleSelect}
            />

            <ResultModal
                show={modalState.show}
                type={modalState.type}
                message={modalState.message}
                onClose={() => setModalState({ ...modalState, show: false })}
            />

            {/* Zone Permission Modal */}
            {showZonePermModal && zonePermModalIdx !== null && structure[zonePermModalIdx] && (
                <Portal>
                    <div className="sub-modal-overlay" onClick={() => setShowZonePermModal(false)}>
                        <div className="sub-modal perm-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="sub-modal-header">
                                <h4>🔐 Category Permissions</h4>
                                <p>Manage permissions for "{structure[zonePermModalIdx]?.name}"</p>
                            </div>
                            <div className="perm-role-list">
                                {(structure[zonePermModalIdx]?.overwrites || []).length > 0 ? (
                                    structure[zonePermModalIdx].overwrites.map((ow, owIdx) => (
                                        <div
                                            key={owIdx}
                                            className="perm-role-item selected"
                                            onClick={() => {
                                                setPermsTarget({
                                                    channelId: structure[zonePermModalIdx].id,
                                                    channelName: structure[zonePermModalIdx].name,
                                                    role: ow
                                                });
                                                setShowZonePermModal(false);
                                                setShowLivePerms(true);
                                            }}
                                        >
                                            <span className="perm-role-color" style={{ background: '#8b5cf6' }}></span>
                                            <span className="perm-role-name">{ow.name}</span>
                                            <span className="perm-role-check">→</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state" style={{ padding: '30px', textAlign: 'center', opacity: 0.5 }}>
                                        <p style={{ margin: 0, fontWeight: 700 }}>No role overwrites set.</p>
                                        <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>Add a role to customize permissions.</p>
                                    </div>
                                )}
                            </div>
                            <div className="sub-modal-actions">
                                <button
                                    className="sub-modal-btn cancel"
                                    onClick={() => setShowZonePermModal(false)}
                                >Close</button>
                                <button
                                    className="sub-modal-btn primary"
                                    onClick={() => {
                                        setTargetChannelForAddRole(structure[zonePermModalIdx]);
                                        setShowZonePermModal(false);
                                        setShowAddRole(true);
                                    }}
                                >+ Add Role</button>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}

            {isProcessing && (
                <Portal>
                    <div className="fixed-overlay z-9999 blur-in" style={{ zIndex: 9999, background: 'rgba(0,0,0,0.6)' }}>
                        <div className="animate-spin" style={{ fontSize: '60px', filter: 'drop-shadow(0 0 20px #ec4899)' }}>🪄</div>
                        <p style={{ marginTop: '20px', fontWeight: '950', color: 'white', fontSize: '18px', letterSpacing: '1px' }}>AN AN IS WORKING ITS MAGIC...</p>
                    </div>
                </Portal>
            )}
        </div>
    );
}
