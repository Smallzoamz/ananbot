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
                    
                    /* Common Global Styles for Server Pages */
                    .glass { background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 183, 226, 0.2); border-radius: 24px; box-shadow: 0 10px 30px rgba(74, 74, 104, 0.05); }
                    
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    .animate-fade { animation: fadeIn 0.6s ease-out forwards; }
                    
                    .loader { height: 100vh; display: flex; align-items: center; justify-content: center; font-size: 24px; color: var(--primary); font-weight: 800; }
                `}</style>
            </div>
        </ServerProvider>
    );
}
