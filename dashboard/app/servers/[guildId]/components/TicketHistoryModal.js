"use client";
import React from "react";
import Portal from "../../../components/Portal";

const TicketHistoryModal = ({ isOpen, onClose, ticket }) => {
    if (!isOpen || !ticket) return null;

    return (
        <Portal>
            <div className="fixed-overlay z-modal blur-in">
                <div className="modal-card glass animate-pop" style={{ maxWidth: '600px', width: '90%' }}>
                    <button className="modal-close" onClick={onClose}>×</button>

                    <div className="sc-header" style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
                        <div className="sc-icon">📜</div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '18px' }}>Ticket Transcript</h3>
                            <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>{ticket.ticket_id} • {ticket.topic}</p>
                        </div>
                    </div>

                    <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {/* Meta Info */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '12px' }}>
                                <p style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.7, marginBottom: '2px' }}>CLOSED BY</p>
                                <p style={{ fontWeight: 'bold' }}>System / Staff</p>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '12px' }}>
                                <p style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.7, marginBottom: '2px' }}>TIME</p>
                                <p style={{ fontWeight: 'bold' }}>{ticket.ago}</p>
                            </div>
                        </div>

                        {/* Transcript Log */}
                        <div style={{ background: '#111214', borderRadius: '12px', padding: '15px', fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.5', border: '1px solid rgba(255,255,255,0.05)' }}>
                            {ticket.log_url ? (
                                ticket.log_url.split('\n').map((line, idx) => (
                                    <div key={idx} style={{ marginBottom: '4px', wordBreak: 'break-word', color: '#e5e7eb' }}>
                                        {line}
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                                    No transcript available for this ticket.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            className="modal-btn"
                            onClick={onClose}
                            style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                        >
                            Close Viewer
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default TicketHistoryModal;
