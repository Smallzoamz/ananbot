"use client";
import React from "react";
import { signIn } from "next-auth/react";
import styles from "../page.module.css";

export default function LoginPage() {
    return (
        <div className={styles.landingContainer} style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div className={styles.heroContent} style={{ maxWidth: '500px' }}>
                <div className={styles.illustrationWrapper}>
                    <div className={styles.portalEmoji}>🌸🗝️</div>
                </div>
                <h1 className={styles.heroTitle} style={{ fontSize: '42px' }}>Welcome Back!</h1>
                <p className={styles.heroText}>Please login with your Discord account to access the dashboard and manage your servers.</p>

                <button className={styles.heroMainBtn} onClick={() => signIn("discord")}>
                    Login with Discord 🌸
                </button>

                <p style={{ marginTop: '24px', opacity: 0.5, fontWeight: 700, fontSize: '14px', cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
                    ← Back to Homepage
                </p>
            </div>
        </div>
    );
}
