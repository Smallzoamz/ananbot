"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
    en: {
        nav: {
            features: "Features",
            premium: "Premium",
            support: "Support",
            login: "Login with Discord",
            dashboard: "Go to Dashboard"
        },
        hero: {
            title: "The Most Bubbly All-in-one Bot for Discord",
            desc: "An An is a cute and powerful Discord bot, easy-to-use, that millions of server owners trust to manage and grow their communities.",
            cta: "Add to Discord",
            altCta: "See Features"
        },
        showcases: [
            {
                tag: "Instant Setup",
                title: "One-Click Aesthetic Server Setup",
                desc: "Deploy beautiful, organized server structures in seconds. Choose between Shop, Community, or Fanclub templates—each featuring our signature '｜・Emoji' aesthetic styling."
            },
            {
                tag: "Management",
                title: "Live Stats & Admin Control",
                desc: "Track your growth with live member counters and stay in command with the An An Terminal—a private, secure management channel dedicated to Papa and server owners."
            },
            {
                tag: "Security",
                title: "One-Click Recovery & Protection",
                desc: "Keep your server safe with automated verification buttons and our powerful 30-minute Rollback safety net. Accidents happen, but An An always has your back."
            }
        ],
        features: {
            title: "Powerful Features for Your Server",
            items: [
                { title: "Aesthetic Layouts", desc: "Our signature '｜・Emoji' formatting makes your server look professional and clean." },
                { title: "Verification System", desc: "Interactive buttons for secure member verification and role assignment." },
                { title: "Game Role Selection", desc: "Let members pick their games and unlock private channels automatically." },
                { title: "Auto-Welcome", desc: "Greet every new member with a bubbly, personalized message and helpful links." },
                { title: "Security Rollback", desc: "Accidentally deleted a channel? Restore your whole structure within 30 minutes." },
                { title: "Premium Dashboard", desc: "Manage everything from server setup to role logic via our sleek web interface." }
            ]
        },
        selection: {
            title: "Select a Server",
            desc: "Choose a guild to manage with An An.",
            refresh: "Refresh Servers",
            manage: "Manage Server",
            invite: "Invite An An",
            lastManaged: "Last Managed",
            loading: "Loading Servers for Papa...",
            logout: "Logout"
        },
        dashboard: {
            custom: "Custom",
            customDesc: "Design your own roles and channels from scratch",
            stats: "Live Stats",
            members: "MEMBERS",
            online: "Online",
            setup: "One-Click Setup",
            setupDesc: "Configure your server aesthetic in seconds",
            modal: {
                title: "Server Setup Wizard",
                step1: "Select Template",
                step2: "Select Style",
                step3: "Final Details",
                stepCustomRoles: "Custom Roles",
                stepCustomZones: "Custom Structure",
                confirm: "Are you sure? This will clear all existing channels and roles!"
            },
            rankCard: "Personal rank card",
            pro: "Pro",
            aiCharacters: "AI Characters",
            myServers: "My servers",
            transferPremium: "Transfer premium",
            supportCat: "SUPPORT",
            language: "Language",
            changelogs: "Changelogs",
            supportServer: "Support server"
        },
        sidebar: {
            yourServers: "YOUR SERVERS",
            selection: "Go to Selection",
            dashboard: "Dashboard",
            leaderboard: "Leaderboard",
            personalizer: "Bot Personalizer",
            catEssentials: "ESSENTIALS",
            welcome: "Welcome & Goodbye",
            reaction: "Reaction Roles",
            moderator: "Moderator",
            catManagement: "SERVER MANAGEMENT",
            automation: "Automations",
            commands: "Custom Commands",
            catStream: "STREAM ALERT",
            twitchAlerts: "Twitch Alerts",
            youtubeAlerts: "YouTube Alerts",
            reset: "Clear & Reset",
            switch: "Switch Server"
        },
        personalizer: {
            title: "Bot Personalizer",
            desc: "Customize your bot's identity and status to match your server's vibe. 🌸✨",
            nickname: "Bot Nickname",
            nicknameDesc: "Sets the bot's name in this server.",
            bio: "Bot Bio",
            bioPlaceholder: "Tell the world about An An!",
            activity: "Activity Status",
            activityType: "Activity Type",
            statusText: "Status Text",
            statusPlaceholder: "e.g. /help or with Papa 🌸",
            avatarUrl: "Avatar URL",
            bannerUrl: "Banner URL",
            preview: "Discord Preview",
            memberList: "Member list preview",
            profilePreview: "Profile preview",
            saveSuccess: "Personalizer settings saved! ✨🌸",
            globalWarning: "Note: Activity Status is global across all servers."
        },
        loginPage: {
            title: "Welcome Back!",
            subtitle: "Please login with your Discord account to access the dashboard and manage your servers.",
            btn: "Login with Discord 🌸",
            back: "← Back to Homepage"
        },
        ticket: {
            title: "Ticket System",
            config: "Configuration",
            desc: "Enable the advanced ticket system for your server.",
            roleLabel: "Support Role (Staff)",
            roleHint: "The role that will manage tickets.",
            save: "Save Settings",
            send: "Send Panel",
            topics: "Menu Topics",
            add: "+ Add Topic",
            history: "Recent History (48h)",
            noHistory: "No closed tickets yet.",
            viewLog: "View Log",
            closed: "Closed",
            ago: "ago"
        }
    },
    th: {
        nav: {
            features: "ฟีเจอร์",
            premium: "พรีเมียม",
            support: "ช่วยเหลือ",
            login: "เข้าสู่ระบบด้วย Discord",
            dashboard: "ไปยังแดชบอร์ด"
        },
        hero: {
            title: "บอท All-in-one ที่น่ารักที่สุดสำหรับ Discord",
            desc: "An An คือบอท Discord ที่ทั้งน่ารักและทรงพลัง ใช้งานง่าย ที่เจ้าของเซิร์ฟเวอร์นับล้านไว้วางใจในการจัดการและดูแลชุมชน",
            cta: "เพิ่มไปยัง Discord",
            altCta: "ดูฟีเจอร์"
        },
        showcases: [
            {
                tag: "ตั้งค่าด่วน",
                title: "สร้างเซิร์ฟเวอร์สวยๆ ได้ในคลิกเดียว",
                desc: "จัดระเบียบเซิร์ฟเวอร์ให้สวยงามได้ในไม่กี่วินาที เลือกได้ทั้งเทมเพลต ร้านค้า, คอมมูนิตี้ หรือแฟนคลับ—ทุกแบบมาพร้อมดีไซน์ '｜・อีโมจิ' ที่เป็นเอกลักษณ์ของ An An"
            },
            {
                tag: "การจัดการ",
                title: "สถิติสด & คอนโทรลพาเนล",
                desc: "ติดตามการเติบโตด้วยระบบนับสมาชิกแบบเรียลไทม์ และควบคุมทุกอย่างผ่าน An An Terminal—ห้องจัดการส่วนตัวที่ปลอดภัยสำหรับเจ้าของร้านและแอดมินเท่านั้น"
            },
            {
                tag: "ความปลอดภัย",
                title: "กู้คืนและป้องกันในคลิกเดียว",
                desc: "รักษาความปลอดภัยให้เซิร์ฟเวอร์ด้วยปุ่มยืนยันตัวตนอัตโนมัติ และระบบ Rollback 30 นาทีที่ช่วยกู้คืนสิ่งที่เผลอลบไป เพราะ An An พร้อมดูแลคุณเสมอ"
            }
        ],
        features: {
            title: "ฟีเจอร์สุดล้ำสำหรับเซิร์ฟเวอร์ของคุณ",
            items: [
                { title: "เลย์เอาต์สุดพรีเมียม", desc: "ฟอร์แมต '｜・อีโมจิ' ที่เป็นระบบ ทำให้เซิร์ฟเวอร์ของคุณดูเป็นมืออาชีพและสะอาดตา" },
                { title: "ระบบยืนยันตัวตน", desc: "ปุ่มกดโต้ตอบสำหรับการยืนยันตัวตนและรับยศที่ปลอดภัยและรวดเร็ว" },
                { title: "เลือกยศเกมอัตโนมัติ", desc: "ให้สมาชิกเลือกเกมที่เล่นเพื่อเปิดห้องลับเฉพาะเกมนั้นๆ ได้เองทันที" },
                { title: "ต้อนรับอัตโนมัติ", desc: "ทักทายสมาชิกใหม่ด้วยข้อความที่สดใส พร้อมแนบลิ้งก์ที่จำเป็นให้ครบถ้วน" },
                { title: "ย้อนคืนความปลอดภัย", desc: "เผลอลบห้องเหรอ? ไม่ต้องห่วง! ย้อนคืนโครงสร้างทั้งหมดได้ภายใน 30 นาที" },
                { title: "แดชบอร์ดสุดหรู", desc: "จัดการทุกอย่างตั้งแต่การตั้งค่าไปจนถึงระบบยศ ผ่านหน้าเว็บที่สวยงามและใช้งานง่าย" }
            ]
        },
        selection: {
            title: "เลือกเซิร์ฟเวอร์",
            desc: "เลือกกิลด์ที่คุณต้องการจัดการด้วย An An",
            refresh: "รีเฟรชรายชื่อเซิร์ฟเวอร์",
            manage: "จัดการเซิร์ฟเวอร์",
            invite: "เชิญ An An",
            lastManaged: "จัดการล่าสุด",
            loading: "กำลังโหลดข้อมูลเซิร์ฟเวอร์ให้ Papa นะคะ...",
            logout: "ออกจากระบบ"
        },
        dashboard: {
            custom: "กำหนดเอง (Custom)",
            customDesc: "ออกแบบยศและห้องต่างๆ ได้เองตามใจชอบ",
            stats: "สถิติสด",
            members: "สมาชิกทั้งหมด",
            online: "ออนไลน์",
            setup: "ตั้งค่าในคลิกเดียว",
            setupDesc: "ปรับแต่งความสวยงามของเซิร์ฟเวอร์ในไม่กี่วินาที",
            modal: {
                title: "ตัวช่วยตั้งค่าเซิร์ฟเวอร์",
                step1: "เลือกเทมเพลต",
                step2: "เลือกสไตล์",
                step3: "รายละเอียดสุดท้าย",
                stepCustomRoles: "กำหนดยศ (Roles)",
                stepCustomZones: "กำหนดโครงสร้างห้อง",
                confirm: "คุณแน่ใจหรือไม่? การดำเนินการนี้จะล้างห้องและยศเดิมทั้งหมด!"
            },
            rankCard: "บัตรจัดอันดับส่วนตัว",
            pro: "โปร",
            aiCharacters: "ตัวละคร AI",
            myServers: "เซิร์ฟเวอร์ของฉัน",
            transferPremium: "โอนย้ายพรีเมียม",
            supportCat: "ช่วยเหลือ",
            language: "เปลี่ยนภาษา",
            changelogs: "บันทึกการเปลี่ยนแปลง",
            supportServer: "เซิร์ฟเวอร์สนับสนุน"
        },
        sidebar: {
            yourServers: "เซิร์ฟเวอร์ของคุณ",
            selection: "กลับไปหน้าเลือก",
            dashboard: "แดชบอร์ด",
            leaderboard: "กระดานผู้นำ",
            personalizer: "ปรับแต่งบอท",
            catEssentials: "พื้นฐาน",
            welcome: "ต้อนรับ & อำลา",
            reaction: "Reaction Roles",
            moderator: "ผู้ดูแล (Moderator)",
            catManagement: "การจัดการเซิร์ฟเวอร์",
            automation: "ระบบอัตโนมัติ",
            commands: "คำสั่งกำหนดเอง",
            catStream: "แจ้งเตือนสตรีม (STREAM)",
            twitchAlerts: "Twitch Alerts",
            youtubeAlerts: "YouTube Alerts",
            reset: "ล้างและรีเซ็ต",
            switch: "เปลี่ยนเซิร์ฟเวอร์"
        },
        personalizer: {
            title: "ปรับแต่งบอท",
            desc: "ปรับแต่งตัวตนและสถานะของบอทให้เข้ากับบรรยากาศเซิร์ฟเวอร์ของคุณ 🌸✨",
            nickname: "ชื่อเล่นบอท",
            nicknameDesc: "ตั้งชื่อบอทสำหรับเซิร์ฟเวอร์นี้โดยเฉพาะ",
            bio: "Bio บอท",
            bioPlaceholder: "บอกให้ทุกคนรู้ว่า An An คือใคร!",
            activity: "สถานะกิจกรรม",
            activityType: "ประเภทกิจกรรม",
            statusText: "ข้อความสถานะ",
            statusPlaceholder: "เช่น /help หรือ อยู่กับ Papa 🌸",
            avatarUrl: "URL รูปโปรไฟล์",
            bannerUrl: "URL รูปแบนเนอร์",
            preview: "ตัวอย่างใน Discord",
            memberList: "ตัวอย่างในรายชื่อสมาชิก",
            profilePreview: "ตัวอย่างหน้าโปรไฟล์",
            saveSuccess: "บันทึกการปรับแต่งบอทเรียบร้อยแล้วค่ะ! ✨🌸",
            globalWarning: "หมายเหตุ: สถานะกิจกรรมจะมีผลเหมือนกันในทุกเซิร์ฟเวอร์ค่ะ"
        },
        loginPage: {
            title: "ยินดีต้อนรับกลับมาค่ะ!",
            subtitle: "กรุณาล็อกอินด้วย Discord เพื่อเข้าสู่แดชบอร์ดและเริ่มจัดการเซิร์ฟเวอร์ของคุณนะคะ",
            btn: "เข้าสู่ระบบด้วย Discord 🌸",
            back: "← กลับไปหน้าหลัก"
        },
        ticket: {
            title: "ระบบ Ticket",
            config: "การตั้งค่า",
            desc: "เปิดใช้งานระบบ Ticket ขั้นสูงสำหรับเซิร์ฟเวอร์ของคุณ",
            roleLabel: "ยศซัพพอร์ต (Staff)",
            roleHint: "ยศที่จะคอยดูแลและจัดการ Ticket เหล่านี้ค่ะ",
            save: "บันทึกการตั้งค่า",
            send: "ส่งหน้าต่าง Ticket",
            topics: "หัวข้อเมนู",
            add: "+ เพิ่มหัวข้อ",
            history: "ประวัติย้อนหลัง (48 ชม.)",
            noHistory: "ยังไม่มี Ticket ที่ปิดไปเร็วๆ นี้นะคะ",
            viewLog: "ดูบันทึก",
            closed: "ปิดเมื่อ",
            ago: "ที่ผ่านมา"
        }
    }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        const saved = localStorage.getItem('anan_language');
        if (saved) setLanguage(saved);
    }, []);

    const toggleLanguage = (lang) => {
        setLanguage(lang);
        localStorage.setItem('anan_language', lang);
    };

    const t = translations[language];

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
