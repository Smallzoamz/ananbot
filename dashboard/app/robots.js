export default function robots() {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/dashboard/', '/servers/'],
        },
        sitemap: 'https://ananbot.xyz/sitemap.xml',
    }
}
