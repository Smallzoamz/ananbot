"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

// Dynamic import with SSR disabled
const Mascot = dynamic(() => import("./Mascot"), { ssr: false });

export default function MascotWrapper() {
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        // Simple observer to check if any modal overlay is present in the DOM
        const checkModals = () => {
            const hasOverlay = !!document.querySelector('.fixed-overlay');
            setIsPaused(hasOverlay);
        };

        const observer = new MutationObserver(checkModals);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, []);

    return <Mascot isPaused={isPaused} />;
}
