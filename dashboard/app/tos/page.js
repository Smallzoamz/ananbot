"use client";
import React from "react";
import { useRouter } from "next/navigation";
import styles from "../page.module.css";
import { useLanguage } from "../context/LanguageContext";

export default function TosPage() {
    const router = useRouter();
    const { language, t } = useLanguage();

    const content = {
        en: {
            title: "Terms of Service",
            lastUpdated: "Last Updated: January 22, 2026",
            sections: [
                {
                    h: "1. Acceptance of Terms",
                    p: "By adding An An Bot to your Discord server or using our dashboard, you agree to be bound by these terms and Discord's Developer Terms of Service."
                },
                {
                    h: "2. Bot Usage",
                    p: "You may not use An An Bot for any illegal purposes, to harass others, or to violate Discord's Terms of Service. Any abuse may result in your server being blacklisted from our services."
                },
                {
                    h: "3. Virtual Goods & Premium",
                    p: "Premium subscriptions and virtual items (like XP/Levels) are linked to your Discord account. These items have no real-world value and are non-refundable unless required by law."
                },
                {
                    h: "4. Disclaimer",
                    p: "An An Bot is provided 'as is' without warranties of any kind. While we provide safety features like Rollback, we are not responsible for any data loss or server damage caused by misuse."
                }
            ]
        },
        th: {
            title: "ข้อกำหนดการใช้งาน (Terms of Service)",
            lastUpdated: "อัปเดตล่าสุด: 22 มกราคม 2569",
            sections: [
                {
                    h: "1. การยอมรับข้อตกลง",
                    p: "การเชิญบอท An An เข้าสู่เซิร์ฟเวอร์หรือการใช้งานแดชบอร์ด ถือว่าคุณยอมรับข้อกำหนดเหล่านี้และข้อกำหนดสำหรับนักพัฒนาของ Discord"
                },
                {
                    h: "2. การใช้งานบอท",
                    p: "ไม่อนุญาตให้ใช้บอท An An ในทางที่ผิดกฎหมาย, ก่อกวนผู้อื่น หรือละเมิกกฎของ Discord หากพบการละเมิด เราอาจระงับการให้บริการบอทในเซิร์ฟเวอร์ของคุณทันที"
                },
                {
                    h: "3. สินค้าเสมือนและพรีเมียม",
                    p: "การสมัครสมาชิกพรีเมียมและค่าสถานะต่างๆ (เช่น XP/Level) ผูกกับบัญชี Discord ของคุณ สิ่งเหล่านี้ไม่มีมูลค่าจริงในโลกภายนอกและไม่สามารถคืนเงินได้ เว้นแต่จะมีกฎหมายบังคับ"
                },
                {
                    h: "4. ข้อจำกัดความรับผิดชอบ",
                    p: "บอท An An ให้บริการตามสภาพจริง โดยไม่มีการรับประกันใดๆ แม้เราจะมีระบบคุ้มครองอย่าง Rollback แต่เราจะไม่รับผิดชอบต่อความเสียหายหรือข้อมูลสูญหายที่เกิดจากการใช้งานผิดประเภท"
                }
            ]
        }
    };

    const d = content[language] || content.en;

    return (
        <div className={styles.landingContainer} style={{ background: '#fdf2f8' }}>
            <nav className={styles.navbar}>
                <div className={styles.navLeft}>
                    <div className={styles.navLogo} onClick={() => router.push('/')}>🌸 An An</div>
                </div>
                <div className={styles.navRight}>
                    <button className={styles.dashboardBtn} onClick={() => router.push('/')}>
                        {language === 'th' ? "กลับหน้าหลัก" : "Back Home"}
                    </button>
                </div>
            </nav>

            <main style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '800px', margin: '0 auto', px: '20px' }}>
                <h1 style={{ fontSize: '42px', fontWeight: '900', color: 'var(--primary)', marginBottom: '10px' }}>{d.title}</h1>
                <p style={{ opacity: 0.6, marginBottom: '40px', fontWeight: '600' }}>{d.lastUpdated}</p>

                <div className="glass" style={{ padding: '40px', borderRadius: '24px', border: '1px solid rgba(255, 183, 226, 0.3)' }}>
                    {d.sections.map((s, i) => (
                        <div key={i} style={{ marginBottom: '30px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px', color: '#4a4a68' }}>{s.h}</h3>
                            <p style={{ lineHeight: '1.7', opacity: 0.8, fontWeight: '600' }}>{s.p}</p>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '40px', textAlign: 'center', opacity: 0.5, fontWeight: '700' }}>
                    Questions? Contact Papa in our Support Server! 🌸✨
                </div>
            </main>
        </div>
    );
}
