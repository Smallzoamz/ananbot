"use client";
import React, { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Image from 'next/image';

export default function VerifyPage({ params }) {
    const { guildId } = React.use(params);
    const { data: session, status } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState('idle'); // idle, loading, success, error
    const [serverName, setServerName] = useState("Kingdom");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        // Fetch server details for name
        fetch(`/api/proxy/guild/${guildId}/stats`)
            .then(res => res.json())
            .then(data => {
                if (data.name) setServerName(data.name);
            })
            .catch(err => console.error(err));
    }, [guildId]);

    const handleVerify = async () => {
        if (!session) {
            signIn("discord");
            return;
        }

        setIsLoading(true);
        setVerificationStatus('loading');

        try {
            const res = await fetch(`/api/proxy/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'verify_execute',
                    user_id: session.user.id || session.user.uid,
                    guild_id: guildId
                })
            });
            const data = await res.json();

            if (data.success) {
                setVerificationStatus('success');
            } else {
                setVerificationStatus('error');
                setErrorMessage(data.error || "The castle gates remain sealed. Please contact the kingdom's admin.");
            }
        } catch (e) {
            setVerificationStatus('error');
            setErrorMessage("A magical barrier blocks the connection. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="verify-page">
            {/* Magical Background */}
            <div className="verify-bg"></div>

            {/* Floating Hearts & Stars */}
            <div className="verify-sparkles">
                <div className="sparkle">💖</div>
                <div className="sparkle">✨</div>
                <div className="sparkle">💕</div>
                <div className="sparkle">🌸</div>
                <div className="sparkle">💗</div>
                <div className="sparkle">⭐</div>
                <div className="sparkle">💝</div>
                <div className="sparkle">🌷</div>
                <div className="sparkle">💖</div>
                <div className="sparkle">✨</div>
            </div>

            {/* Castle Gate Frame */}
            <div className="gate-frame">
                {/* Premium Arch Header with SVG Decorations */}
                <div className="gate-arch">
                    {/* SVG Corner Ornaments */}
                    <svg className="gate-ornament left" viewBox="0 0 60 60" fill="none">
                        <path d="M5 55 Q5 5 55 5" stroke="url(#pinkGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
                        <circle cx="55" cy="5" r="4" fill="#ff85c1" />
                        <circle cx="5" cy="55" r="4" fill="#ff85c1" />
                        <defs>
                            <linearGradient id="pinkGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ffb7e2" />
                                <stop offset="100%" stopColor="#ff85c1" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <svg className="gate-ornament right" viewBox="0 0 60 60" fill="none">
                        <path d="M55 55 Q55 5 5 5" stroke="url(#pinkGrad2)" strokeWidth="3" fill="none" strokeLinecap="round" />
                        <circle cx="5" cy="5" r="4" fill="#ff85c1" />
                        <circle cx="55" cy="55" r="4" fill="#ff85c1" />
                        <defs>
                            <linearGradient id="pinkGrad2" x1="100%" y1="100%" x2="0%" y2="0%">
                                <stop offset="0%" stopColor="#ffb7e2" />
                                <stop offset="100%" stopColor="#ff85c1" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* SVG Crown Icon */}
                    <svg className="gate-crown" viewBox="0 0 80 60" fill="none">
                        <path d="M40 5 L50 25 L65 15 L60 40 L20 40 L15 15 L30 25 Z"
                            fill="url(#crownGrad)" stroke="#ffb7e2" strokeWidth="2" />
                        <circle cx="25" cy="38" r="4" fill="#fff" />
                        <circle cx="40" cy="38" r="4" fill="#fff" />
                        <circle cx="55" cy="38" r="4" fill="#fff" />
                        <path d="M18 45 L62 45 L60 52 L20 52 Z" fill="url(#crownGrad)" />
                        <defs>
                            <linearGradient id="crownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#ffd700" />
                                <stop offset="100%" stopColor="#ffb347" />
                            </linearGradient>
                        </defs>
                    </svg>

                    <h1 className="gate-title">SAKURA GATE</h1>

                    {/* SVG Sakura Divider */}
                    <div className="gate-divider">
                        <svg viewBox="0 0 200 20" fill="none" className="divider-svg">
                            <line x1="0" y1="10" x2="70" y2="10" stroke="#ffb7e2" strokeWidth="2" strokeLinecap="round" />
                            <g transform="translate(85, 2)">
                                <path d="M15 8 Q12 0 15 0 Q18 0 15 8" fill="#ff85c1" />
                                <path d="M15 8 Q8 5 10 2 Q12 5 15 8" fill="#ffb7e2" />
                                <path d="M15 8 Q22 5 20 2 Q18 5 15 8" fill="#ffb7e2" />
                                <path d="M15 8 Q10 12 8 10 Q12 10 15 8" fill="#ffd6ed" />
                                <path d="M15 8 Q20 12 22 10 Q18 10 15 8" fill="#ffd6ed" />
                                <circle cx="15" cy="8" r="2" fill="#fff" />
                            </g>
                            <line x1="130" y1="10" x2="200" y2="10" stroke="#ffb7e2" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>

                    <p className="gate-subtitle">Welcome Portal • {serverName}</p>
                </div>

                {/* Gate Body */}
                <div className="gate-body">
                    {/* Character Portrait */}
                    <div className="gate-portrait">
                        <Image
                            src="/images/gatekeeper-sakura.jpg"
                            alt="Sakura Guardian"
                            width={150}
                            height={150}
                            style={{ objectFit: 'cover' }}
                        />
                        <div className="gate-shield">🌸</div>
                    </div>

                    {/* Content by Status */}
                    {verificationStatus === 'idle' && (
                        <>
                            <p className="gate-message">
                                <strong>"สวัสดีค่ะ! ยินดีต้อนรับสู่เซิร์ฟเวอร์~"</strong><br />
                                กรุณายืนยันตัวตนเพื่อเข้าถึงดินแดนมหัศจรรย์ของเรานะคะ 💕
                            </p>
                            <button
                                className="gate-btn"
                                onClick={handleVerify}
                                disabled={isLoading || status === 'loading'}
                            >
                                {status === 'loading' ? '✨ กำลังตรวจสอบ...' : (session ? '🌸 ยืนยันตัวตน' : '🔑 เชื่อมต่อบัญชี Discord')}
                            </button>

                            {session && (
                                <div className="gate-identity">
                                    <img src={session.user.image} alt="User" />
                                    <span>ยินดีต้อนรับคุณ {session.user.name} ค่ะ</span>
                                </div>
                            )}
                        </>
                    )}

                    {verificationStatus === 'loading' && (
                        <div className="gate-status">
                            <div className="gate-scanner"></div>
                            <p className="gate-scanning-text">✨ กำลังเปิดประตูให้คุณ...</p>
                        </div>
                    )}

                    {verificationStatus === 'success' && (
                        <div className="gate-status success">
                            <div className="gate-status-icon">🎉</div>
                            <h3>ยินดีต้อนรับค่ะ!</h3>
                            <p>ประตูได้เปิดให้คุณแล้ว~ เข้ามาสนุกด้วยกันนะคะ 💖</p>
                            <p className="sub-text">(สามารถปิดหน้านี้ได้เลยค่ะ)</p>
                        </div>
                    )}

                    {verificationStatus === 'error' && (
                        <div className="gate-status error">
                            <div className="gate-status-icon">😢</div>
                            <h3>ไม่สามารถเข้าได้ค่ะ</h3>
                            <p>{errorMessage}</p>
                            <button
                                className="gate-btn retry"
                                onClick={() => setVerificationStatus('idle')}
                            >
                                🔄 ลองใหม่อีกครั้ง
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

