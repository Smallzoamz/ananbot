export default function sitemap() {
    return [
        {
            url: 'https://ananbot.xyz',
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: 'https://ananbot.xyz/servers',
            lastModified: new Date(),
            changeFrequency: 'always',
            priority: 0.8,
        },
    ]
}
