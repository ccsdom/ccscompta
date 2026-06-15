import type { MetadataRoute } from 'next';

const baseUrl = 'https://ccscompta.fr';

const publicRoutes = [
  '',
  '/fonctionnalites',
  '/tarifs',
  '/securite',
  '/a-propos',
  '/blog',
  '/assistance',
  '/mentions-legales',
  '/politique-de-confidentialite',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route === '/fonctionnalites' ? 0.9 : 0.7,
  }));
}
