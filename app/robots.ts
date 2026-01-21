import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/seed/'],
        },
        sitemap: 'https://vibeconnect.vercel.app/sitemap.xml',
    }
}
