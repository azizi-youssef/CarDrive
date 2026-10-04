import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/search', '/cars/', '/agencies/', '/about'],
        disallow: ['/admin', '/agency', '/api/'],
      },
    ],
    sitemap: 'https://cardrive.ma/sitemap.xml',
  };
}
