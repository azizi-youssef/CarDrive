import { MetadataRoute } from 'next';
import { store } from '@/lib/services/store';
import { ALL_SEO_SLUGS } from '@/lib/seo/landingPages';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://cardrive.ma';

  const vehicles = store.getVehicles();
  const agencies = store.getAgencies();

  const vehicleUrls = vehicles.map((v) => ({
    url: `${baseUrl}/cars/${v.slug}`,
    lastModified: new Date(v.created_at),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const agencyUrls = agencies.map((a) => ({
    url: `${baseUrl}/agencies/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const seoLandingUrls = ALL_SEO_SLUGS.map((slug) => ({
    url: `${baseUrl}/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/agencies`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...seoLandingUrls,
    ...vehicleUrls,
    ...agencyUrls,
  ];
}

