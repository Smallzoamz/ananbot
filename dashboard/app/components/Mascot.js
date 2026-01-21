"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';

// Page descriptions for the bubble chat
const pageDescriptions = {
    en: {
        '/': "Welcome! I'm An An, your cheerful all-in-one assistant! Let's make your server sparkle together! 🌸✨",
        '/selection': "Please choose a server to sprinkle some An An magic! I'll help you organize everything beautifully! 🏰✨",
        '/servers/[guildId]/youtube-alerts': "Stay connected with your audience! Setup your YouTube live alerts right here, Papa! 🔴🎥✨",
        '/servers/[guildId]/reaction-roles': "Let your members choose their own roles with style! Reaction Roles management is right here! 🏷️🌸🪄",
        '/servers/[guildId]/ticket': "Ready to help your community? Configure your professional support ticket system here! 🎫✨💖",
        '/servers': "Welcome to the Dashboard! This is where the magic happens! Manage all your server settings with ease! 👑🌈🪄",
        '/leaderboard': "Missions & Glory! Check out the leaderboard and complete fun missions to earn exclusive rewards! 🏆✨🍱",
        '/welcome': "Make a great first impression! Customize how you greet and bid farewell to your precious members! 👑👋🌸",
        '/ticket': "Organize your community support like a pro with An An's bubbly Ticket System! 🎫✨🎀",
        '/social-alerts': "Social Live Alerts! I'll make sure your community never misses a single stream! 🌸🎥🔔",
        '/twitch-alerts': "Twitch Alerts center! Let's notify everyone when their favorite streamers go live! 🟣🎥✨",
        '/youtube-alerts': "YouTube Alerts center! Instant notifications for all your latest uploads and streams! 🔴🎥🔔",
        '/servers/[guildId]/moderator': "Keep your server safe, clean, and happy with my advanced moderation tools, Papa! 🛡️✨🌸",
        '/servers/[guildId]/personalizer': "Express your server's unique soul! Personalize my identity and status exactly how you like! 🌸💎🎨",
        '/servers/[guildId]/premium': "Welcome to the Premium Hub! Let's elevate your server to the next level of brilliance together! 👑💎✨",
        'default': "I'm always here by your side, Papa! Let's build the best server in the world together! 💖✨🌸"
    },
    th: {
        '/': "ยินดีต้อนรับค่ะ! อันอันพร้อมเป็นผู้ช่วยสุดร่าเริงให้ Papa แล้ว! มาทำให้เซิร์ฟเวอร์เปล่งประกายกันนะคะ! 🌸✨",
        '/selection': "เลือกเซิร์ฟเวอร์ที่ต้องการได้เลยค่ะ! อันอันจะช่วยเนรมิตความสวยงามให้เอง! 🏰✨",
        '/servers/[guildId]/youtube-alerts': "เชื่อมต่อกับผู้ติดตามของคุณ! ตั้งค่าแจ้งเตือน YouTube ได้ที่นี่เลยนะคะ Papa! 🔴🎥✨",
        '/servers/[guildId]/reaction-roles': "ให้สมาชิกเลือกยศที่ชอบด้วยสไตล์สุดชิค! จัดการระบบรับยศอัตโนมัติได้ที่นี่เลยค่ะ! 🏷️🌸🪄",
        '/servers/[guildId]/ticket': "พร้อมช่วยเหลือทุกคนหรือยังคะ? ตั้งค่าระบบ Ticket สำหรับซัพพอร์ตระดับมืออาชีพได้เลยค่ะ! 🎫✨💖",
        '/servers': "ยินดีต้อนรับสู่หน้าแดชบอร์ดค่ะ! ศูนย์บัญชาการลับสำหรับจัดการทุกอย่างให้เป๊ะปัง! 👑🌈🪄",
        '/leaderboard': "ภารกิจและเกียรติยศ! มาเช็คกระดานผู้นำและทำภารกิจสุดสนุกเพื่อรับรางวัลกันนะคะ! 🏆✨🍱",
        '/welcome': "สร้างความประทับใจแรกพบ! ปรับแต่งคำต้อนรับและคำอำลาสมาชิกที่น่ารักได้ตามใจเลยค่ะ! 👑👋🌸",
        '/ticket': "จัดระเบียบการช่วยเหลือชุมชนให้ดูดีด้วยระบบ Ticket สุดน่ารักของอันอันนะคะ! 🎫✨🎀",
        '/social-alerts': "ระบบแจ้งเตือนสตรีมสด! อันอันจะคอยสะกิดทุกคนไม่ให้พลาดทุกการไลฟ์เลยค่ะ! 🌸🎥🔔",
        '/twitch-alerts': "ศูนย์ตั้งค่า Twitch! แจ้งเตือนทุกครั้งที่สตรีมเมอร์คนโปรดเริ่มไลฟ์สดนะคะ! 🟣🎥✨",
        '/youtube-alerts': "ศูนย์ตั้งค่า YouTube! แจ้งเตือนทันทีเมื่อมีคลิปใหม่หรือเริ่มสตรีมสดค่ะ! 🔴🎥🔔",
        '/servers/[guildId]/moderator': "ดูแลเซิร์ฟเวอร์ให้ปลอดภัยและน่าอยู่ด้วยเครื่องมือ Moderator ขั้นสูงของอันอันนะคะ Papa! 🛡️✨🌸",
        '/servers/[guildId]/personalizer': "บ่งบอกตัวตนของเซิร์ฟเวอร์! ปรับแต่งชื่อและสถานะของอันอันได้ตามใจชอบเลยค่ะ! 🌸💎🎨",
        '/servers/[guildId]/premium': "ยินดีต้อนรับสู่ Premium Hub ค่ะ! มายกระดับเซิร์ฟเวอร์ให้พรีเมียมขั้นสุดไปด้วยกันนะคะ! 👑💎✨",
        'default': "อันอันอยู่เคียงข้าง Papa เสมอนะคะ! มาสร้างเซิร์ฟเวอร์ที่ดีที่สุดในโลกไปด้วยกันค่ะ! 💖✨🌸"
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
        if (pathname?.includes('/welcome')) return descriptions['/welcome'];
        if (pathname?.includes('/ticket')) return descriptions['/ticket'];
        if (pathname?.includes('/social-alerts')) return descriptions['/social-alerts'];
        if (pathname?.includes('/twitch-alerts')) return descriptions['/twitch-alerts'];
        if (pathname?.includes('/youtube-alerts')) return descriptions['/youtube-alerts'];
        if (pathname?.includes('/moderator')) return descriptions['/servers/[guildId]/moderator'] || descriptions['default'];
        if (pathname?.includes('/personalizer')) return descriptions['/servers/[guildId]/personalizer'] || descriptions['default'];
        if (pathname?.includes('/premium')) return descriptions['/servers/[guildId]/premium'] || descriptions['default'];
        if (pathname?.includes('/servers/')) return descriptions['/servers'] || descriptions['default']; // General Dashboard (Fallback for /servers/xyz)
        return descriptions['default'] || "I'm here to help! 💖";
    };

    // Typewriter effect with loop
    useEffect(() => {
        const fullMessage = getMessage();
        let charIndex = 0;
        let isDeleting = false;
        let pauseTimeout;

        const typeLoop = () => {
            if (!fullMessage) {
                setShowBubble(false);
                return;
            }
            if (!isDeleting) {
                if (charIndex === 0) {
                    setShowBubble(true);
                    setDisplayText('');
                }

                if (fullMessage && charIndex <= fullMessage.length) {
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
