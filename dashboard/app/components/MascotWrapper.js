"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

// Dynamic import with SSR disabled
const Mascot = dynamic(() => import("./Mascot"), { ssr: false });

export default function MascotWrapper() {
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        let timeoutId;
        const checkModals = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const hasOverlay = !!document.querySelector('.fixed-overlay');
                setIsPaused(hasOverlay);
            }, 100); // 100ms debounce 🌸
        };

        const observer = new MutationObserver(checkModals);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            clearTimeout(timeoutId);
        };
    }, []);

    return <Mascot isPaused={isPaused} />;
}
