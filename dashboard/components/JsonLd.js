"use client";

import { usePathname } from 'next/navigation';

export default function JsonLd() {
    const pathname = usePathname();
    const isHome = pathname === '/';

    // Only render heavy schema on homepage or specific pages if needed
    if (!isHome) return null;

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": "https://ananbot.xyz/#organization",
                "name": "An An Bot",
                "url": "https://ananbot.xyz",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://ananbot.xyz/images/logo.png"
                },
                "sameAs": [
                    "https://discord.gg/ananbot",
                    "https://github.com/ananbot"
                ]
            },
            {
                "@type": "WebSite",
                "@id": "https://ananbot.xyz/#website",
                "url": "https://ananbot.xyz",
                "name": "An An Bot Dashboard",
                "description": "Premium Discord Server Management Dashboard",
                "publisher": {
                    "@id": "https://ananbot.xyz/#organization"
                },
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": {
                        "@type": "EntryPoint",
                        "urlTemplate": "https://ananbot.xyz/search?q={search_term_string}"
                    },
                    "query-input": "required name=search_term_string"
                }
            },
            {
                "@type": "SoftwareApplication",
                "@id": "https://ananbot.xyz/#software",
                "name": "An An Bot",
                "applicationCategory": "UtilitiesApplication",
                "operatingSystem": "Discord, Web",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD",
                    "availability": "https://schema.org/InStock"
                },
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.9",
                    "ratingCount": "1250",
                    "bestRating": "5",
                    "worstRating": "1"
                },
                "author": {
                    "@id": "https://ananbot.xyz/#organization"
                }
            }
        ]
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(jsonLd)
            }}
        />
    );
}
