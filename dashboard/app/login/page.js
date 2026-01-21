"use client";
import React from "react";
import { signIn } from "next-auth/react";
import styles from "../page.module.css";

import { useLanguage } from "../context/LanguageContext";

export default function LoginPage() {
    const { t } = useLanguage();
    return (
        <div className={styles.landingContainer} style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div className={styles.heroContent} style={{ maxWidth: '500px' }}>
                <div className={styles.illustrationWrapper}>
                    <div className={styles.portalEmoji}>🌸🗝️</div>
                </div>
                <h1 className={styles.heroTitle} style={{ fontSize: '42px' }}>{t.loginPage.title}</h1>
                <p className={styles.heroText}>{t.loginPage.subtitle}</p>

                <button className={styles.heroMainBtn} onClick={() => signIn("discord")}>
                    {t.loginPage.btn}
                </button>

                <p style={{ marginTop: '24px', opacity: 0.5, fontWeight: 700, fontSize: '14px', cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
                    {t.loginPage.back}
                </p>
            </div>
        </div>
    );
}
