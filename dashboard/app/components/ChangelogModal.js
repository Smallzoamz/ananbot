"use client";
import React from 'react';
import Portal from './Portal';

export default function ChangelogModal({ show, onClose }) {
    if (!show) return null;

    const changelogs = [
        {
            version: "v4.2.0",
            date: "2026-01-22",
            title: "Glass Scrapbook Rank Cards! 🌸",
            features: [
                "New 'Glass Scrapbook' Rank Card Editor",
                "Added Sticker System (Sakura, Stars, Paws)",
                "Fixed Sidebar Navigation Links",
                "Improved Dashboard Auto-refresh issues"
            ]
        },
        {
            version: "v4.1.5",
            date: "2026-01-20",
            title: "Performance Polish ⚡",
            features: [
                "Faster Guild Loading",
                "Fixed Discord Rate Limit Handling",
                "Added 'Coming Soon' Modals"
            ]
        }
    ];

    return (
        <Portal>
            <div className="fixed-overlay z-modal blur-in" onClick={onClose}>
                <div className="modal-card glass animate-pop" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
                    <button className="modal-close" onClick={onClose}>×</button>

                    <div className="modal-header">
                        <h2>📜 Changelogs</h2>
                        <p>What's new in An An Bot?</p>
                    </div>

                    <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        {changelogs.map((log, i) => (
                            <div key={i} className="changelog-item" style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: i < changelogs.length - 1 ? '1px solid #eee' : 'none' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h3 style={{ color: '#ec4899', fontSize: '1.2rem', margin: 0 }}>{log.version}</h3>
                                    <span style={{ fontSize: '0.8rem', color: '#999', background: '#f3f4f6', padding: '4px 8px', borderRadius: '6px' }}>{log.date}</span>
                                </div>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#4a4a68' }}>{log.title}</h4>
                                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                    {log.features.map((feat, j) => (
                                        <li key={j} style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>{feat}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="modal-footer">
                        <button className="primary-long" style={{ background: '#ec4899' }} onClick={onClose}>
                            Awesome! 💖
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
}
