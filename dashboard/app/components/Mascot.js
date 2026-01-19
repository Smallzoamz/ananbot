"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';

// Page descriptions for the bubble chat
const pageDescriptions = {
    en: {
        '/': "Welcome! I'm An An, your cute Discord bot assistant! 🌸",
        '/selection': "Choose a server to manage! I'll help you make it beautiful! ✨",
        '/servers': "This is the Dashboard! You can setup and manage your server here! 👑",
        '/leaderboard': "Leaderboard & Missions! Complete tasks to earn XP and rewards! 🏆",
        'default': "I'm here to help you manage your Discord server! Ask me anything! 💖"
    },
    th: {
        '/': "ยินดีต้อนรับค่ะ! อันอันเป็นบอท Discord ผู้ช่วยสุดน่ารักของคุณนะคะ! 🌸",
        '/selection': "เลือกเซิร์ฟเวอร์ที่ต้องการจัดการได้เลยค่ะ! อันอันจะช่วยทำให้สวยงาม! ✨",
        '/servers': "นี่คือแดชบอร์ดค่ะ! Papa สามารถตั้งค่าและจัดการเซิร์ฟเวอร์ได้ที่นี่! 👑",
        '/leaderboard': "Leaderboard และภารกิจค่ะ! ทำภารกิจเพื่อรับ XP และรางวัลสุดพิเศษ! 🏆",
        'default': "อันอันพร้อมช่วย Papa จัดการเซิร์ฟเวอร์ Discord นะคะ! ถามได้เลย! 💖"
    }
};

export default function Mascot() {
    const [frame, setFrame] = useState(1);
    const [displayText, setDisplayText] = useState('');
    const [showBubble, setShowBubble] = useState(false);
    const pathname = usePathname();
    const { language } = useLanguage();

    // GIF-like frame toggle
    useEffect(() => {
        const interval = setInterval(() => {
            setFrame(prev => (prev === 1 ? 2 : 1));
        }, 800);
        return () => clearInterval(interval);
    }, []);

    // Get the appropriate message based on path and language
    const getMessage = () => {
        const lang = language || 'en';
        const descriptions = pageDescriptions[lang] || pageDescriptions.en;

        if (pathname === '/') return descriptions['/'];
        if (pathname === '/servers') return descriptions['/selection']; // Specific Selection Page
        if (pathname?.includes('/leaderboard')) return descriptions['/leaderboard']; // Specific Leaderboard Page
        if (pathname?.includes('/servers/')) return descriptions['/servers']; // General Dashboard (Fallback for /servers/xyz)
        return descriptions['default'];
    };

    // Typewriter effect with loop
    useEffect(() => {
        const fullMessage = getMessage();
        let charIndex = 0;
        let isDeleting = false;
        let pauseTimeout;

        const typeLoop = () => {
            if (!isDeleting) {
                if (charIndex === 0) {
                    setShowBubble(true);
                    setDisplayText('');
                }

                if (charIndex <= fullMessage.length) {
                    setDisplayText(fullMessage.substring(0, charIndex));
                    charIndex++;
                    pauseTimeout = setTimeout(typeLoop, 50);
                } else {
                    pauseTimeout = setTimeout(() => {
                        isDeleting = true;
                        typeLoop();
                    }, 2500);
                }
            } else {
                if (charIndex > 0) {
                    charIndex--;
                    setDisplayText(fullMessage.substring(0, charIndex));
                    pauseTimeout = setTimeout(typeLoop, 30);
                } else {
                    setShowBubble(false);
                    pauseTimeout = setTimeout(() => {
                        isDeleting = false;
                        typeLoop();
                    }, 1500);
                }
            }
        };

        const startTimeout = setTimeout(typeLoop, 1000);

        return () => {
            clearTimeout(startTimeout);
            clearTimeout(pauseTimeout);
        };
    }, [pathname, language]);

    return (
        <div className="anan-mascot-container">
            {/* Bubble positioned ABOVE the mascot */}
            <div className={`anan-bubble ${showBubble ? 'show' : ''}`}>
                <div className="bubble-content">
                    {displayText}
                    <span className="bubble-cursor"></span>
                </div>
                {/* Speech tail pointing down to mascot */}
                <div className="bubble-tail"></div>
            </div>

            {/* Mascot image */}
            <img
                src={frame === 1 ? "/assets/mascot/ANAN1.png" : "/assets/mascot/ANAN2.png"}
                alt="An An Mascot"
                className="anan-mascot-img"
            />

            <style jsx global>{`
                .anan-mascot-container {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 10000;
                    pointer-events: none;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                }
                
                .anan-mascot-img {
                    width: 120px;
                    height: auto;
                    filter: drop-shadow(0 10px 25px rgba(0, 0, 0, 0.2));
                    animation: mascot-float 4s ease-in-out infinite;
                }
                
                .anan-bubble {
                    position: relative;
                    max-width: 260px;
                    margin-bottom: 8px;
                    margin-right: 10px;
                    opacity: 0;
                    transform: translateY(20px) scale(0.8);
                    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    pointer-events: none;
                }
                
                .anan-bubble.show {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                
                .bubble-content {
                    padding: 14px 18px;
                    background: linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,237,247,0.98) 100%);
                    border-radius: 20px;
                    box-shadow: 0 8px 30px rgba(255, 183, 226, 0.35), 0 2px 10px rgba(0,0,0,0.08);
                    border: 1.5px solid rgba(255, 183, 226, 0.5);
                    font-size: 13px;
                    line-height: 1.6;
                    color: #4a4a68;
                    font-weight: 500;
                }
                
                .bubble-tail {
                    position: absolute;
                    bottom: -12px;
                    right: 30px;
                    width: 0;
                    height: 0;
                    border-left: 12px solid transparent;
                    border-right: 12px solid transparent;
                    border-top: 14px solid rgba(255,237,247,0.98);
                    filter: drop-shadow(0 2px 3px rgba(255, 183, 226, 0.2));
                }
                
                .bubble-cursor {
                    display: inline-block;
                    width: 2px;
                    height: 14px;
                    background: #ffb7e2;
                    margin-left: 2px;
                    animation: blink-cursor 0.7s step-end infinite;
                    vertical-align: middle;
                }
                
                @keyframes mascot-float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-12px); }
                }
                
                @keyframes blink-cursor {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                
                @media (max-width: 768px) {
                    .anan-mascot-img {
                        width: 80px;
                    }
                    .anan-bubble {
                        max-width: 180px;
                    }
                    .bubble-content {
                        font-size: 11px;
                        padding: 10px 14px;
                    }
                }
            `}</style>
        </div>
    );
}
