"use client";
import React from "react";
import { ServerProvider } from "../../context/ServerContext";
import ServerSidebar from "../../components/ServerSidebar";
import ServerHeader from "../../components/ServerHeader";

export default function ServerLayout({ children }) {
    return (
        <ServerProvider>
            <div className="mee6-container">
                <ServerSidebar />
                <div className="mee6-main-wrapper">
                    <ServerHeader />
                    <main className="mee6-content animate-fade">
                        {children}
                    </main>
                </div>

                <style jsx global>{`
                    .mee6-container {
                        display: flex;
                        min-height: 100vh;
                        background: #fdf2f8; /* Darker pastel pink for depth */
                        color: #4a4a68;
                        font-family: var(--font-main);
                    }
                    .mee6-main-wrapper { flex: 1; display: flex; flex-direction: column; overflow-x: hidden; }
                    .mee6-content { padding: 50px; max-width: 1400px; margin: 0 auto; width: 100%; position: relative; }

                    /* Sidebar */
                    .mee6-sidebar {
                        width: 280px;
                        background: rgba(255, 255, 255, 0.45);
                        backdrop-filter: blur(20px);
                        -webkit-backdrop-filter: blur(20px);
                        border-right: 1px solid rgba(255, 183, 226, 0.2);
                        display: flex;
                        flex-direction: column;
                        padding: 20px 15px;
                        position: sticky;
                        top: 0;
                        height: 100vh;
                        z-index: 200;
                        box-shadow: 10px 0 30px rgba(0,0,0,0.02);
                    }
                    .guild-switcher-wrapper { position: relative; margin-bottom: 30px; z-index: 300; }
                    .guild-selector {
                        padding: 8px;
                        border-radius: 24px;
                        cursor: pointer;
                        background: white;
                        border: 1px solid rgba(255, 183, 226, 0.2);
                        transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 4px 15px rgba(255, 183, 226, 0.1);
                    }
                    .guild-selector:hover, .guild-selector.active { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(255, 183, 226, 0.25); border-color: var(--primary); }
                    
                    .guild-current { display: flex; flex-direction: column; align-items: center; gap: 15px; padding: 10px 0; }
                    .guild-icon-large { width: 100%; aspect-ratio: 1/1; border-radius: 18px; object-fit: cover; border: 4px solid #fdf2f8; }
                    .guild-init-large { width: 100%; aspect-ratio: 1/1; border-radius: 18px; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; font-weight: 800; color: white; font-size: 60px; }
                    
                    .guild-info { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 10px; }
                    .guild-info span { font-weight: 800; font-size: 15px; color: #4a4a68; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                    .chevron { opacity: 0.4; font-size: 16px; }

                    .guild-dropdown {
                        position: absolute;
                        top: calc(100% + 15px);
                        left: 0;
                        width: 100%;
                        background: white;
                        border-radius: 20px;
                        border: 1px solid rgba(255, 183, 226, 0.2);
                        box-shadow: 0 15px 40px rgba(0,0,0,0.1);
                        padding: 10px;
                        z-index: 1000;
                    }
                    .dropdown-label { font-size: 10px; font-weight: 900; color: #9ca3af; padding: 10px 15px; letter-spacing: 0.1em; }
                    .dropdown-item {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 10px 15px;
                        border-radius: 12px;
                        cursor: pointer;
                        transition: 0.2s;
                        color: #4a4a68;
                        font-weight: 700;
                        font-size: 14px;
                    }
                    .dropdown-item:hover { background: #fdf2f8; color: var(--primary); }
                    .guild-icon-mini { width: 24px; height: 24px; border-radius: 6px; }
                    .guild-init-mini { width: 24px; height: 24px; border-radius: 6px; background: #fdf2f8; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; }
                    .dropdown-divider { height: 1px; background: #fdf2f8; margin: 8px 0; }
                    .back-item { color: var(--primary); background: #fdf2f8; margin-top: 5px; }

                    .sidebar-list { flex: 1; overflow-y: auto; padding-right: 5px; }
                    .sidebar-list::-webkit-scrollbar { width: 4px; }
                    .sidebar-list::-webkit-scrollbar-thumb { background: rgba(255, 183, 226, 0.2); border-radius: 10px; }

                    .menu-item {
                        padding: 12px 18px;
                        margin-bottom: 4px;
                        border-radius: 12px;
                        font-size: 14px;
                        font-weight: 700;
                        color: #6b7280;
                        cursor: pointer;
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .menu-item:hover { background: #fdf2f8; color: var(--primary); transform: translateX(5px); }
                    .menu-item.active { background: var(--primary); color: white; box-shadow: 0 8px 20px rgba(255,183,226,0.35); }
                    .menu-category {
                        font-size: 11px;
                        font-weight: 950;
                        color: #cbd5e1;
                        margin: 25px 0 10px 18px;
                        letter-spacing: 0.05em;
                        text-transform: uppercase;
                    }

                    .sidebar-footer { padding-top: 20px; border-top: 1px solid rgba(255, 183, 226, 0.2); }
                    .invite-btn { width: 100%; padding: 14px; background: white; color: #6b7280; border: 1px solid rgba(255, 183, 226, 0.2); border-radius: 14px; font-weight: 800; cursor: pointer; transition: 0.3s; }
                    .invite-btn:hover { border-color: var(--primary); color: var(--primary); background: #fdf2f8; transform: translateY(-2px); }

                    /* Header */
                    .mee6-header {
                        height: 80px;
                        border-bottom: 1px solid rgba(255, 183, 226, 0.15);
                        background: rgba(255, 255, 255, 0.4);
                        backdrop-filter: blur(20px);
                        -webkit-backdrop-filter: blur(20px);
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 0 40px;
                        position: sticky;
                        top: 0;
                        z-index: 100;
                    }
                    .logo-text { 
                        font-size: 26px; 
                        font-weight: 900; 
                        color: #ff85c1; 
                        letter-spacing: 1.5px; 
                        text-shadow: 0 2px 10px rgba(255,133,193,0.25); 
                    }
                    .header-right { display: flex; align-items: center; gap: 20px; }
                    
                    .plan-badge-top {
                        padding: 10px 22px;
                        border-radius: 20px;
                        font-size: 11px;
                        font-weight: 900;
                        letter-spacing: 0.05em;
                    }
                    .plan-badge-top.premium {
                        background: linear-gradient(135deg, #ff85c1, #c084fc);
                        color: white;
                        box-shadow: 0 4px 15px rgba(255,133,193,0.3);
                    }
                    .plan-badge-top.pro {
                        background: white;
                        color: #8b5cf6;
                        border: 1px solid rgba(139, 92, 246, 0.2);
                    }

                    .premium-btn {
                        background: linear-gradient(135deg, #ffc107, #ff9800);
                        color: white;
                        border: none;
                        padding: 11px 24px;
                        border-radius: 20px;
                        font-weight: 900;
                        font-size: 13px;
                        cursor: pointer;
                        box-shadow: 0 4px 15px rgba(255,193,7,0.35);
                        transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .premium-btn:hover { transform: translateY(-2px) scale(1.02); filter: brightness(1.1); box-shadow: 0 8px 25px rgba(255,193,7,0.45); }
                    
                    .header-icon { font-size: 22px; color: #4a4a68; opacity: 0.5; cursor: pointer; transition: 0.3s; }
                    .header-icon:hover { opacity: 1; transform: rotate(15deg); color: var(--primary); }
                    
                    .user-profile-wrapper { position: relative; z-index: 1000; }
                    .user-profile img { width: 40px; height: 40px; border-radius: 50%; cursor: pointer; border: 3px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.08); transition: 0.3s; }
                    .user-profile img:hover { border-color: var(--primary); transform: scale(1.1); box-shadow: 0 8px 25px rgba(255,183,226,0.3); }

                    .profile-dropdown {
                        position: absolute;
                        top: calc(100% + 15px);
                        right: 0;
                        width: 230px;
                        background: white;
                        border-radius: 24px;
                        border: 1px solid rgba(255, 183, 226, 0.2);
                        box-shadow: 0 15px 50px rgba(0,0,0,0.12);
                        padding: 15px;
                        z-index: 2000;
                    }
                    .section-label { font-size: 10px; font-weight: 950; color: #cbd5e1; padding: 5px 10px 10px; letter-spacing: 0.1em; text-transform: uppercase; }
                    .dropdown-link {
                        padding: 12px 14px;
                        border-radius: 12px;
                        font-size: 14px;
                        font-weight: 800;
                        color: #4a4a68;
                        cursor: pointer;
                        transition: 0.2s;
                    }
                    .dropdown-link:hover { background: #fdf2f8; color: var(--primary); transform: translateX(5px); }
                    .dropdown-divider { height: 1px; background: #fdf2f8; margin: 10px 0; }
                    .logout-item { color: #ff4757; margin-top: 5px; font-weight: 900; }
                    .logout-item:hover { background: #fff1f2; color: #ff4757; }

                    /* Shared Styles */
                    .p-badge-s { background: rgba(255,255,255,0.2); border-radius: 6px; }

                    /* Animations */
                    @keyframes fadeIn { 
                        from { opacity: 0; transform: translateY(10px); } 
                        to { opacity: 1; transform: translateY(0); } 
                    }
                    .animate-fade { animation: fadeIn 0.6s ease-out forwards; }
                    
                    @keyframes glow { 0%, 100% { box-shadow: 0 0 15px rgba(255,133,193,0.3); } 50% { box-shadow: 0 0 25px rgba(255,133,193,0.6); } }
                    .animate-glow { animation: glow 2s infinite ease-in-out; }
                    
                    @keyframes pop { from { opacity: 0; transform: scale(0.95) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                    .animate-pop { animation: pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                    
                    .loader { 
                        height: 100vh; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        font-size: 28px; 
                        color: var(--primary); 
                        background: #fdf2f8; 
                        font-weight: 800; 
                    }
                `}</style>
            </div>
        </ServerProvider>
    );
}
