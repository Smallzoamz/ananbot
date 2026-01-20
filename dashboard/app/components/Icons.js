import React from "react";

export const CrownIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" style={{ minWidth: '12px', minHeight: '12px' }}>
        <path fill="currentColor" d="M5,16 L19,16 L19,18 L5,18 L5,16 Z M19,8 L15.5,11 L12,5 L8.5,11 L5,8 L5,14 L19,14 L19,8 Z" />
    </svg>
);

export const ArrowIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', opacity: 0.3 }}>
        <path d="M9 18l6-6-6-6" />
    </svg>
);

export const ProBadge = () => (
    <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '24px',
        height: '24px',
        background: '#FFF8E1',
        borderRadius: '6px',
        color: '#FF9800',
        marginLeft: '8px',
        boxShadow: '0 2px 4px rgba(255, 152, 0, 0.15)',
        verticalAlign: 'middle'
    }}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M5 16L19 16V18H5V16ZM19 8L15.5 11L12 5L8.5 11L5 8V14H19V8Z" />
        </svg>
    </div>
);
