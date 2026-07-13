import { SeoPage } from './types';

export const DEFAULT_SEO_CONFIG: Record<string, Omit<SeoPage, 'id' | 'isActive'>> = {
  '/': {
    routePath: '/',
    pageKey: 'home',
    title: 'Hệ thống tra cứu công bố sản phẩm | HJCNT',
    description: 'Tra cứu danh sách công bố sản phẩm Desembre và Dermagarden đang lưu hành tại Việt Nam.',
    canonicalUrl: 'https://cong-bo.hjcnt.com.vn/',
    robots: 'index,follow',
    schemaJson: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Hệ thống tra cứu công bố sản phẩm HJCNT",
      "url": "https://cong-bo.hjcnt.com.vn/"
    }
  },
  '/desembre': {
    routePath: '/desembre',
    pageKey: 'desembre',
    title: 'Danh sách công bố sản phẩm Desembre 2026',
    description: 'Tra cứu danh sách công bố sản phẩm Desembre, thông tin nhóm sản phẩm, hình ảnh và link công bố.',
    canonicalUrl: 'https://cong-bo.hjcnt.com.vn/desembre',
    robots: 'index,follow'
  },
  '/dermagarden': {
    routePath: '/dermagarden',
    pageKey: 'dermagarden',
    title: 'Danh sách công bố sản phẩm Dermagarden 2026',
    description: 'Tra cứu danh sách công bố sản phẩm Dermagarden, thông tin nhóm sản phẩm, hình ảnh và link công bố.',
    canonicalUrl: 'https://cong-bo.hjcnt.com.vn/dermagarden',
    robots: 'index,follow'
  }
};

export const FALLBACK_SEO: Omit<SeoPage, 'id' | 'isActive'> = {
  routePath: '',
  pageKey: 'default',
  title: 'Hệ thống tra cứu công bố sản phẩm',
  description: 'Tra cứu danh sách công bố sản phẩm',
  robots: 'index,follow'
};

export function getDefaultSeoByRoute(route: string): Omit<SeoPage, 'id' | 'isActive'> {
  return DEFAULT_SEO_CONFIG[route] || { ...FALLBACK_SEO, routePath: route };
}
