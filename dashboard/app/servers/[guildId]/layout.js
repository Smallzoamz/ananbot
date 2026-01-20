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

                    /* Transitions */
                    @keyframes fadeIn { 
                        from { opacity: 0; transform: translateY(10px); } 
                        to { opacity: 1; transform: translateY(0); } 
                    }
                    .animate-fade { animation: fadeIn 0.6s ease-out forwards; }
                    
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
