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

export const TwitchIcon = ({ size = 24, color = "#9146ff" }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0h1.714v5.143h-1.714zM5.143 1L1 5.143v14.571h4.714V23l3.429-3.286h3.857l6.429-6.429V1zm12.857 12l-3 3h-4.286l-2.571 2.571V16H4.429V2.714h13.571z" />
    </svg>
);

export const YouTubeIcon = ({ size = 24, color = "#ff0000" }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
);
