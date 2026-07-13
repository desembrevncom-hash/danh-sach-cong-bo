export type SeoPage = {
  id: string;
  routePath: string;
  pageKey: 'home' | 'desembre' | 'dermagarden' | string;
  title: string;
  description: string;
  canonicalUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageUrl?: string | null;
  robots: string;
  schemaJson?: Record<string, unknown> | null;
  isActive: boolean;
  updatedAt?: string;
};
