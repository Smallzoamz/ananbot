"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";

const ConsoleModal = ({ show, onClose, guildId }) => {
    const { data: session } = useSession();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState("monitor"); // monitor, tools
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        setMounted(true);
        if (show) {
            fetchStats();
        }
    }, [show]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Use Proxy to avoid Mixed Content (HTTPS -> HTTP) on Vercel
            const res = await fetch(`/api/proxy/action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "get_system_stats",
                    user_id: session?.user?.id || session?.user?.uid
                })
            });
            const data = await res.json();
            if (data.error) {
                console.error(data.error);
            } else {
                setStats(data);
                // Fake logs for demo if empty
                if (logs.length === 0) {
                    setLogs([
                        { time: new Date().toLocaleTimeString(), msg: "System Console attached..." },
                        { time: new Date().toLocaleTimeString(), msg: "Fetching generic telemetry..." },
                        { time: new Date().toLocaleTimeString(), msg: "Connection stable (Latency: " + data.ping + ")" }
                    ]);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleBroadcast = async () => {
        try {
            const res = await fetch(`/api/proxy/action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "send_terminal_broadcast",
                    user_id: session?.user?.id || session?.user?.uid,
                    guild_id: guildId
                })
            });
            const data = await res.json();
            if (data.success) {
                setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg: "✅ Broadcast sent to terminal channel." }, ...prev]);
            } else {
                setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg: "❌ Broadcast failed: " + data.error }, ...prev]);
            }
        } catch (e) {
            setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg: "❌ Network Error" }, ...prev]);
        }
    };

    if (!mounted || !show) return null;

    return createPortal(
        <div className="fixed-overlay" onClick={onClose}>
            <div className="modal-card console-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="mh-left">
                        <div className="console-icon">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                <line x1="8" y1="21" x2="16" y2="21" />
                                <line x1="12" y1="17" x2="12" y2="21" />
                            </svg>
                        </div>
                        <h2>System Console</h2>
                        <span className="console-badge">ADMIN ONLY</span>
                    </div>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                {/* Tabs */}
                <div className="console-tabs">
                    <button
                        className={`ct-btn ${activeTab === "monitor" ? "active" : ""}`}
                        onClick={() => setActiveTab("monitor")}
                    >
                        📊 Monitor
                    </button>
                    <button
                        className={`ct-btn ${activeTab === "tools" ? "active" : ""}`}
                        onClick={() => setActiveTab("tools")}
                    >
                        🛠️ Tools
                    </button>
                </div>

                {/* Content */}
                <div className="modal-content-scroll">
                    {activeTab === "monitor" && (
                        <div className="console-monitor">
                            {/* Stats Grid */}
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="sc-label">UPTIME</div>
                                    <div className="sc-value">{stats?.uptime || "--"}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="sc-label">PID / RAM</div>
                                    <div className="sc-value text-purple">{stats?.ram || "--"}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="sc-label">LATENCY</div>
                                    <div className="sc-value text-green">{stats?.ping || "--"}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="sc-label">VERSION</div>
                                    <div className="sc-value text-blue">{stats?.version || "v4.1"}</div>
                                </div>
                            </div>

                            {/* Pseudo Terminal Log */}
                            <div className="terminal-log">
                                <div className="tl-header">
                                    <span>LIVE LOGS</span>
                                    <button onClick={fetchStats} className="refresh-xs">Refresh</button>
                                </div>
                                <div className="tl-body">
                                    {logs.map((log, i) => (
                                        <div key={i} className="log-line">
                                            <span className="ll-time">[{log.time}]</span>
                                            <span className="ll-msg">{log.msg}</span>
                                        </div>
                                    ))}
                                    {loading && <div className="log-line blink">_</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "tools" && (
                        <div className="console-tools">
                            <div className="tool-row">
                                <div className="tr-info">
                                    <h3>📢 Terminal Broadcast</h3>
                                    <p>Send a test message to #anan-terminal to verify connectivity.</p>
                                </div>
                                <button className="console-action-btn" onClick={handleBroadcast}>
                                    Send Ping
                                </button>
                            </div>

                            <div className="tool-row">
                                <div className="tr-info">
                                    <h3>🧹 Clear Cache</h3>
                                    <p>Force clear local dashboard cache (Safe to use).</p>
                                </div>
                                <button className="console-action-btn danger" onClick={() => window.location.reload()}>
                                    Reload App
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .console-modal {
                    width: 100%;
                    max-width: 600px;
                    background: #fff;
                    border: 1px solid #eee;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.1);
                    border-radius: 12px;
                    overflow: hidden;
                }
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 24px;
                    color: #999;
                    cursor: pointer;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s;
                    line-height: 1;
                }
                .close-btn:hover {
                    color: #333;
                    background: #f5f5f5;
                }
                .console-badge {
                    font-size: 10px;
                    background: #000;
                    color: #fff;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-weight: bold;
                    margin-left: 10px;
                    letter-spacing: 0.5px;
                }
                .console-tabs {
                    padding: 0 24px;
                    border-bottom: 1px solid #f0f0f0;
                    display: flex;
                    gap: 20px;
                    margin-top: 10px;
                }
                .ct-btn {
                    padding: 10px 0;
                    background: none;
                    border: none;
                    font-family: 'Quicksand', sans-serif;
                    font-weight: 600;
                    font-size: 14px;
                    color: #999;
                    cursor: pointer;
                    position: relative;
                }
                .ct-btn.active {
                    color: #333;
                }
                .ct-btn.active::after {
                    content: '';
                    position: absolute;
                    bottom: -1px;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: #333;
                }
                
                /* Monitor Tab */
                .console-monitor {
                    padding: 24px;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .stat-card {
                    background: #f8f9fa;
                    padding: 16px;
                    border-radius: 12px;
                    border: 1px solid #eee;
                }
                .sc-label {
                    font-size: 11px;
                    font-weight: 700;
                    color: #bbb;
                    letter-spacing: 1px;
                    margin-bottom: 4px;
                }
                .sc-value {
                    font-size: 20px;
                    font-weight: 800;
                    color: #333;
                    font-family: 'Inter', sans-serif; /* Monospace-ish look via font choice if avail, or just keeping it clean */
                }
                .text-purple { color: #8e44ad; }
                .text-green { color: #27ae60; }
                .text-blue { color: #2980b9; }

                /* Terminal Log */
                .terminal-log {
                    background: #1e1e1e;
                    border-radius: 8px;
                    padding: 16px;
                    color: #00ff00;
                    font-family: 'Consolas', 'Monaco', monospace;
                    font-size: 12px;
                    height: 180px;
                    overflow-y: auto;
                }
                .tl-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    border-bottom: 1px solid #333;
                    padding-bottom: 5px;
                    color: #fff;
                    font-weight: bold;
                    font-size: 10px;
                    letter-spacing: 1px;
                }
                .refresh-xs {
                    background: #333;
                    border: none;
                    color: #fff;
                    padding: 2px 6px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 9px;
                }
                .refresh-xs:hover { background: #555; }
                .log-line {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 4px;
                    opacity: 0.9;
                }
                .ll-time { color: #666; }
                .blink { animation: blink 1s infinite; }
                @keyframes blink { 50% { opacity: 0; } }

                /* Tools Tab */
                .console-tools {
                    padding: 24px;
                }
                .tool-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    border: 1px solid #eee;
                    border-radius: 12px;
                    margin-bottom: 16px;
                    transition: all 0.2s;
                }
                .tool-row:hover {
                    border-color: #ddd;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                }
                .tr-info h3 {
                    margin: 0 0 4px 0;
                    font-size: 15px;
                    font-weight: 700;
                    color: #333;
                }
                .tr-info p {
                    margin: 0;
                    font-size: 13px;
                    color: #777;
                }
                .console-action-btn {
                    background: #000;
                    color: #fff;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 13px;
                    cursor: pointer;
                    transition: transform 0.1s;
                }
                .console-action-btn:active { transform: scale(0.95); }
                .console-action-btn.danger {
                    background: #e74c3c;
                }
            `}</style>
        </div>,
        document.body
    );
};

export default ConsoleModal;
