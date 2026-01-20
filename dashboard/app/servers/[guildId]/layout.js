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
                    .mee6-container { display: flex; min-height: 100vh; background: #fff9fe; color: #4a4a68; }
                    .mee6-main-wrapper { flex: 1; display: flex; flex-direction: column; overflow-x: hidden; }
                    .mee6-content { padding: 40px; max-width: 1300px; margin: 0 auto; width: 100%; position: relative; }
                    
                    /* Sidebar Restoration */
                    .mee6-sidebar { width: 280px; background: white; border-right: 1px solid rgba(214, 207, 255, 0.3); padding: 30px 15px; position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; z-index: 50; }
                    .guild-switcher-wrapper { position: relative; margin-bottom: 20px; }
                    .guild-selector { display: flex; align-items: center; justify-content: space-between; padding: 12px 15px; border-radius: 16px; cursor: pointer; transition: 0.3s; border: 2px solid transparent; }
                    .guild-selector:hover { border-color: var(--primary); background: white; box-shadow: 0 10px 25px rgba(255,183,226,0.15); }
                    .guild-current { display: flex; align-items: center; gap: 12px; font-weight: 800; color: #4a4a68; width: 100%; }
                    .guild-current img { width: 32px !important; height: 32px !important; border-radius: 10px; object-fit: cover; }
                    .guild-init { width: 32px; height: 32px; border-radius: 10px; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; }
                    .guild-current span { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 15px; }
                    .sidebar-list { flex: 1; overflow-y: auto; margin-top: 10px; padding-right: 5px; }
                    .sidebar-list::-webkit-scrollbar { width: 4px; }
                    .sidebar-list::-webkit-scrollbar-thumb { background: var(--primary); border-radius: 10px; }
                    .menu-item { padding: 12px 18px; margin-bottom: 5px; border-radius: 14px; font-weight: 700; color: #6b7280; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 12px; }
                    .menu-item:hover { background: #fdf2f8; color: var(--primary); }
                    .menu-item.active { background: var(--primary); color: white; box-shadow: 0 8px 20px rgba(255,183,226,0.4); }
                    .menu-category { font-size: 11px; font-weight: 900; color: #cbd5e1; margin: 25px 0 10px 18px; text-transform: uppercase; letter-spacing: 0.1em; }
                    .m-icon { font-size: 18px; width: 24px; text-align: center; }
                    .invite-btn { width: 100%; padding: 12px; border-radius: 14px; border: 2px solid #f1f5f9; background: white; color: #6b7280; font-weight: 800; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; }
                    .invite-btn:hover { border-color: var(--primary); color: var(--primary); background: #fdf2f8; }

                    /* Header Restoration */
                    .mee6-header { height: 80px; background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(214, 207, 255, 0.2); display: flex; align-items: center; justify-content: space-between; padding: 0 40px; position: sticky; top: 0; z-index: 100; }
                    .logo-text { font-size: 24px; font-weight: 950; color: var(--primary); letter-spacing: -0.05em; }
                    .header-right { display: flex; align-items: center; gap: 20px; }
                    .premium-btn { background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 15px rgba(255,183,226,0.3); }
                    .user-profile img { width: 36px !important; height: 36px !important; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                    
                    /* Global Utilities */
                    .glass { background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 183, 226, 0.2); border-radius: 24px; box-shadow: 0 10px 30px rgba(74, 74, 104, 0.05); }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    .animate-fade { animation: fadeIn 0.6s ease-out forwards; }
                    .loader { height: 100vh; display: flex; align-items: center; justify-content: center; font-size: 24px; color: var(--primary); font-weight: 800; }
                `}</style>
            </div>
        </ServerProvider>
    );
}
