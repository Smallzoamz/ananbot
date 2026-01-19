export default function robots() {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/dashboard/', '/servers/'],
        },
        sitemap: 'https://anan-bot.vercel.app/sitemap.xml',
    }
}
