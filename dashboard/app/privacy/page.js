"use client";
import React from "react";
import { useRouter } from "next/navigation";
import styles from "../page.module.css";
import { useLanguage } from "../context/LanguageContext";

export default function PrivacyPage() {
    const router = useRouter();
    const { language, t } = useLanguage();

    const content = {
        en: {
            title: "Privacy Policy",
            lastUpdated: "Last Updated: January 22, 2026",
            sections: [
                {
                    h: "1. Data We Collect",
                    p: "We only collect necessary data to provide our services, including Discord IDs, server metadata, channel settings, and user interaction data (like XP, levels, and command usage)."
                },
                {
                    h: "2. How We Use Your Data",
                    p: "Your data is used solely for the operation of An An Bot features, such as ranking systems, server setups, and security logs. We do not sell or share your personal information with third parties."
                },
                {
                    h: "3. Data Storage",
                    p: "All data is securely stored in our encrypted database (Supabase). We follow industry standards to protect your information from unauthorized access."
                },
                {
                    h: "4. Your Rights",
                    p: "You can request data deletion at any time by removing An An Bot from your server or contacting our support team. Deleting the bot will eventually purge your server-specific settings from our cache."
                }
            ]
        },
        th: {
            title: "นโยบายความเป็นส่วนตัว (Privacy Policy)",
            lastUpdated: "อัปเดตล่าสุด: 22 มกราคม 2569",
            sections: [
                {
                    h: "1. ข้อมูลที่เราจัดเก็บ",
                    p: "เราจัดเก็บเฉพาะข้อมูลที่จำเป็นต่อการให้บริการ เช่น Discord ID, ข้อมูลเมตาของเซิร์ฟเวอร์, การตั้งค่าห้อง และข้อมูลกิจกรรมของผู้ใช้ (เช่น ค่า XP, เลเวล และประวัติการใช้คำสั่ง)"
                },
                {
                    h: "2. การนำข้อมูลไปใช้",
                    p: "ข้อมูลของคุณจะถูกใช้เพื่อฟีเจอร์ของบอท An An เท่านั้น เช่น ระบบจัดอันดับ, การตั้งค่าเซิร์ฟเวอร์ และบันทึกความปลอดภัย เราไม่มีนโยบายการขายหรือแชร์ข้อมูลส่วนบุคคลของคุณให้กับบุคคลที่สาม"
                },
                {
                    h: "3. การเก็บรักษาข้อมูล",
                    p: "ข้อมูลทั้งหมดถูกเก็บรักษาไว้ในฐานข้อมูลที่มีการเข้ารหัส (Supabase) และเราปฏิบัติตามมาตรฐานความปลอดภัยสากลเพื่อป้องกันการเข้าถึงข้อมูลโดยไม่ได้รับอนุญาต"
                },
                {
                    h: "4. สิทธิ์ของคุณ",
                    p: "คุณสามารถร้องขอให้ลบข้อมูลได้ทุกเมื่อ โดยการนำบอท An An ออกจากเซิร์ฟเวอร์หรือติดต่อทีมซัพพอร์ต การลบบอทจะส่งผลให้การตั้งค่าเฉพาะของเซิร์ฟเวอร์ถูกลบออกจากระบบแคชของเราในที่สุด"
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
                    We value your trust! 💖🌸✨
                </div>
            </main>
        </div>
    );
}
