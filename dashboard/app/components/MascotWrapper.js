"use client";

import dynamic from "next/dynamic";

// Dynamic import with SSR disabled - must be in a Client Component
const Mascot = dynamic(() => import("./Mascot"), { ssr: false });

export default function MascotWrapper() {
    return <Mascot />;
}
