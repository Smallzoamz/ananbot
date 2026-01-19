export default function sitemap() {
    return [
        {
            url: 'https://anan-bot.vercel.app',
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: 'https://anan-bot.vercel.app/servers',
            lastModified: new Date(),
            changeFrequency: 'always',
            priority: 0.8,
        },
    ]
}
