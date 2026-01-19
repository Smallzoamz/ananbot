"use client";
import React, { useEffect, useState, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { useLanguage } from "./context/LanguageContext";

const SetupMockup = () => (
  <div className={styles.discordMockup}>
    <div className={styles.discordSidebar}>
      <div className={styles.sidebarHeader}>An An Community</div>
      <div className={styles.sidebarScroll}>
        <div className={styles.category}>🛒 Zone：SHOP</div>
        <div className={styles.channel}>｜・💬：shop-lobby</div>
        <div className={styles.channel}>｜・💸：buy-package</div>
        <div className={styles.channel}>｜・📦：order-status</div>
        <div className={styles.channelActive}>｜・📜：rules</div>
        <div className={styles.category} style={{ marginTop: '15px' }}>🎮 Zone：GAME</div>
        <div className={styles.channel}>｜・🛋️：LOBBY ⎯ นั่งเล่น</div>
        <div className={styles.channelVoice}>｜・🔊：VALORANT | 01</div>
      </div>
    </div>
    <div className={styles.discordMain}>
      <div className={styles.mainHeader}># rules</div>
      <div className={styles.mainContent}>
        <div className={styles.msgRow}>
          <div className={styles.msgAvatar}>🌸</div>
          <div className={styles.msgContent}>
            <div className={styles.msgAuthor}>An An <span className={styles.botTag}>BOT</span></div>
            <div className={styles.msgText}>ยินดีต้อนรับเข้าสู่อาณาจักรของ An An นะคะ! 🌸✨ กรุณาอ่านกฏและเตรียมตัวพบกับความสนุกได้เลยค่ะ!</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StatsMockup = () => (
  <div className={styles.discordMockup}>
    <div className={styles.discordSidebar}>
      <div className={styles.sidebarHeader}>Management Panel</div>
      <div className={styles.sidebarScroll}>
        <div className={styles.category}>📊 SERVER STATS</div>
        <div className={styles.statsChannel}>｜・📊：MEMBERS ⎯ 1,248</div>
        <div className={styles.statsChannel}>｜・👣：LATEST ⎯ Papa_AnAn</div>
        <div className={styles.category} style={{ marginTop: '15px' }}>💬 ADMIN SETTINGS</div>
        <div className={styles.terminalChannel}>｜・💬：anan-terminal</div>
      </div>
    </div>
    <div className={styles.terminalMain}>
      <div className={styles.terminalHeader}>An An Terminal</div>
      <div className={styles.terminalContent}>
        <div className={styles.terminalLine}><span className={styles.termPrefix}>[System]</span> Monitoring active...</div>
        <div className={styles.terminalLine}><span className={styles.termPrefix}>[AnAn]</span> Papa, 10 new members joined today! ✨</div>
        <div className={styles.terminalLine}><span className={styles.termCmd}>!testw</span></div>
        <div className={styles.terminalLine}><span className={styles.termSuccess}>[Success]</span> Welcome message testing initiated.</div>
      </div>
    </div>
  </div>
);

const SecurityMockup = () => (
  <div className={styles.discordMockup} style={{ background: '#2f3136' }}>
    <div className={styles.securityPreview}>
      <div className={styles.verifyCard}>
        <h3>Verify Your Account</h3>
        <p>Click the button below to get access to the server!</p>
        <button className={styles.discordVerifyBtn}>✅ ยืนยันตัวตน (Verify)</button>
      </div>
      <div className={styles.rollbackLog}>
        <div className={styles.logHeader}>Rollback History</div>
        <div className={styles.logItem}>
          <span className={styles.logTime}>18:25</span>
          <span className={styles.logMsg}>Restored Category: SHOP</span>
        </div>
        <div className={styles.logItem}>
          <span className={styles.logTime}>18:25</span>
          <span className={styles.logMsg}>Restored 5 channels & 3 roles</span>
        </div>
        <div className={styles.logStatus}>✅ ROLLBACK SUCCESSFUL</div>
      </div>
    </div>
  </div>
);

const ShowcaseSection = ({ tag, title, desc, mockup, bubbles, reverse }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const sectionRef = useRef(null);
  const { language } = useLanguage();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={`${styles.showcaseSection} ${isVisible ? styles.showcaseVisible : ""} ${reverse ? styles.reverse : ""}`}>
      <div className={styles.showcaseContainer}>
        <div className={`${styles.showcaseImageWrapper} ${styles.revealElement} ${styles.imageReveal}`}>
          {bubbles.map((b, i) => (
            <div key={i} className={`${styles.floatingBubble} ${styles[`b${i + 1}`]}`}>{b}</div>
          ))}
          <div className={styles.mockupFrame}>
            {mockup}
          </div>
        </div>
        <div className={`${styles.showcaseContent} ${styles.revealElement} ${styles.textReveal}`}>
          <span className={styles.showcaseTag}>{tag}</span>
          <h2 className={styles.showcaseTitle}>{title}</h2>
          <p className={styles.showcaseDesc}>{desc}</p>
          <div className={styles.heroActions} style={{ justifyContent: 'flex-start' }}>
            <button className={styles.heroMainBtn} style={{ padding: '14px 30px', fontSize: '16px' }}>Add to Discord</button>
            <button className={styles.heroAltBtn} style={{ padding: '14px 30px', fontSize: '16px' }}>Learn More</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default function Home() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { language, toggleLanguage, t } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setIsLangOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showcases = [
    {
      tag: t.showcases[0].tag,
      title: t.showcases[0].title,
      desc: t.showcases[0].desc,
      mockup: <SetupMockup />,
      bubbles: ["🛍️", "🎮", "👑"],
      reverse: false
    },
    {
      tag: t.showcases[1].tag,
      title: t.showcases[1].title,
      desc: t.showcases[1].desc,
      mockup: <StatsMockup />,
      bubbles: ["📉", "👣", "💬"],
      reverse: true
    },
    {
      tag: t.showcases[2].tag,
      title: t.showcases[2].title,
      desc: t.showcases[2].desc,
      mockup: <SecurityMockup />,
      bubbles: ["🧹", "🪄", "✅"],
      reverse: false
    }
  ];

  const features = [
    { title: "Aesthetic Layouts", desc: "Our signature '｜・Emoji' formatting makes your server look professional and clean.", icon: "✨" },
    { title: "Verification System", desc: "Interactive buttons for secure member verification and role assignment.", icon: "✅" },
    { title: "Game Role Selection", desc: "Let members pick their games and unlock private channels automatically.", icon: "🎮" },
    { title: "Auto-Welcome", desc: "Greet every new member with a bubbly, personalized message and helpful links.", icon: "👋" },
    { title: "Security Rollback", desc: "Accidentally deleted a channel? Restore your whole structure within 30 minutes.", icon: "📦" },
    { title: "Premium Dashboard", desc: "Manage everything from server setup to role logic via our sleek web interface.", icon: "🚀" }
  ];

  const handleInvite = () => {
    const url = `https://discord.com/oauth2/authorize?client_id=1462487393692291123&permissions=6765110361586815&integration_type=0&scope=bot+applications.commands`;
    const w = 500;
    const h = 800;
    const left = (window.innerWidth / 2) - (w / 2) + window.screenX;
    const top = (window.innerHeight / 2) - (h / 2) + window.screenY;
    window.open(url, 'Invite An An', `width=${w},height=${h},top=${top},left=${left},scrollbars=yes,status=no,location=no,toolbar=no`);
  };

  const scrollToFeatures = () => {
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
  };

  if (authStatus === "loading") {
    return <div className={styles.loadingScreen}>🌸 Preparing An An's Heart...</div>;
  }

  return (
    <div className={styles.landingContainer}>
      <nav className={styles.navbar}>
        <div className={styles.navLeft}>
          <div className={styles.navLogo} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>🌸 An An</div>
          <div className={styles.navLinks}>
            <span className={styles.navLink} onClick={scrollToFeatures}>{t.nav.features}</span>
            <span className={styles.navLink}>{t.nav.premium}</span>
            <span className={styles.navLink}>{t.nav.support}</span>
          </div>
        </div>
        <div className={styles.navRight}>
          <div className={styles.langWrapper} ref={langRef}>
            <div className={styles.langTrigger} onClick={() => setIsLangOpen(!isLangOpen)}>
              <img src={language === 'en' ? 'https://flagcdn.com/w40/gb.png' : 'https://flagcdn.com/w40/th.png'} alt="" style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} />
              {language.toUpperCase()} <span style={{ marginLeft: '5px' }}>⌵</span>
            </div>
            {isLangOpen && (
              <div className={styles.langDropdown + " glass animate-pop"}>
                <div
                  className={styles.langItem + (language === 'en' ? ' ' + styles.activeLang : '')}
                  onClick={() => { toggleLanguage('en'); setIsLangOpen(false); }}
                >
                  <img src="https://flagcdn.com/w40/gb.png" alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} /> English
                </div>
                <div
                  className={styles.langItem + (language === 'th' ? ' ' + styles.activeLang : '')}
                  onClick={() => { toggleLanguage('th'); setIsLangOpen(false); }}
                >
                  <img src="https://flagcdn.com/w40/th.png" alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} /> ไทย
                </div>
              </div>
            )}
          </div>
          {authStatus === "authenticated" ? (
            <button className={styles.dashboardBtn} onClick={() => router.push('/servers')}>
              {t.nav.dashboard}
            </button>
          ) : (
            <button className={styles.navLoginBtn} onClick={() => signIn("discord")}>
              {t.nav.login}
            </button>
          )}
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <div className={styles.illustrationWrapper}>
              <div className={styles.portalEmoji}>🌸✨</div>
            </div>
            <h1 className={styles.heroTitle}>{t.hero.title}</h1>
            <p className={styles.heroText}>{t.hero.desc}</p>
            <div className={styles.heroActions}>
              <button className={styles.heroMainBtn} onClick={handleInvite}>{t.hero.cta}</button>
              <button className={styles.heroAltBtn} onClick={scrollToFeatures}>{t.hero.altCta}</button>
            </div>
          </div>
        </section>

        {/* Detailed Showcases */}
        <div className={styles.showcaseWrapper}>
          {showcases.map((sc, i) => (
            <ShowcaseSection key={i} {...sc} />
          ))}
        </div>

        {/* Features Section */}
        <section id="features" className={styles.featuresSection}>
          <h2 className={styles.sectionTitle}>{t.features.title}</h2>
          <div className={styles.featureGrid}>
            {t.features.items.map((f, i) => (
              <div key={i} className={styles.featureCard}>
                <span className={styles.featureIcon}>{features[i].icon}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>An An Bot v4.1</div>
          <p>© 2026 Developed with Heart for Papa & Discord Community 🌸✨</p>
        </div>
      </footer>
    </div>
  );
}
