/**
 * Post-build script: generate per-route index.html with correct SEO meta tags.
 * Run after `vite build` to create:
 *   dist/desembre/index.html   — Desembre-specific meta
 *   dist/dermagarden/index.html — Dermagarden-specific meta
 *
 * Vercel rewrites /desembre/* → /desembre/index.html, etc.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, 'dist');

const SITE_URL = 'https://cong-bo.hjcnt.com.vn';
const OG_DEFAULT  = 'https://toytykbimcpkieocozzm.supabase.co/storage/v1/object/public/site-assets/og_image/1783756690397-4-logo.png';
const OG_DESEMBRE = 'https://toytykbimcpkieocozzm.supabase.co/storage/v1/object/public/site-assets/misc/1783850027589-7.jpg';
const OG_DERMA    = 'https://toytykbimcpkieocozzm.supabase.co/storage/v1/object/public/site-assets/misc/1783850045496-8.jpg';

const ROUTES = [
  {
    pathname: 'desembre',
    title: 'Danh sách công bố sản phẩm Desembre 2026 | HJCNT',
    description: 'Tra cứu danh sách công bố sản phẩm Desembre, thông tin nhóm sản phẩm, hình ảnh và link công bố chính thức tại Việt Nam.',
    url: `${SITE_URL}/desembre`,
    image: OG_DESEMBRE,
    keywords: 'Desembre, công bố sản phẩm Desembre, mỹ phẩm Desembre, chăm sóc da chuyên nghiệp, catalog Desembre 2026',
  },
  {
    pathname: 'dermagarden',
    title: 'Danh sách công bố sản phẩm Dermagarden 2026 | HJCNT',
    description: 'Tra cứu danh sách công bố sản phẩm Dermagarden, thông tin nhóm sản phẩm, hình ảnh và link công bố chính thức tại Việt Nam.',
    url: `${SITE_URL}/dermagarden`,
    image: OG_DERMA,
    keywords: 'Dermagarden, công bố sản phẩm Dermagarden, mỹ phẩm Dermagarden, tra cứu sản phẩm, catalog Dermagarden 2026',
  },
];

// Read the base dist/index.html produced by vite build
const baseHtmlPath = join(DIST, 'index.html');
if (!existsSync(baseHtmlPath)) {
  console.error('[seo-html] ERROR: dist/index.html not found. Run vite build first.');
  process.exit(1);
}

const baseHtml = readFileSync(baseHtmlPath, 'utf-8');

for (const route of ROUTES) {
  const { pathname, title, description, url, image, keywords } = route;

  const newHead = `  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="keywords" content="${keywords}">
  <meta name="author" content="HJCNT">
  <link rel="canonical" href="${url}" />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:site_name" content="HJCNT - Hệ thống tra cứu công bố sản phẩm">
  <meta property="og:locale" content="vi_VN">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${url}" />
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">`;

  // Replace the SEO block between the theme-color meta and the preconnect/font links
  // Strategy: replace from <title>...</title> through the last </meta> of twitter block
  let routeHtml = baseHtml;

  // Pattern matches the whole SEO block (title through twitter:image)
  const SEO_REGEX = /<title>[\s\S]*?(<meta\s+name="twitter:image"[^>]*>|<meta\s+property="twitter:image"[^>]*>)/;
  
  if (SEO_REGEX.test(routeHtml)) {
    routeHtml = routeHtml.replace(SEO_REGEX, newHead);
  } else {
    // Fallback: inject before first preconnect
    routeHtml = routeHtml.replace(
      /(<link rel="preconnect")/,
      `${newHead}\n  $1`
    );
  }

  // Create the output directory
  const outDir = join(DIST, pathname);
  mkdirSync(outDir, { recursive: true });

  const outPath = join(outDir, 'index.html');
  writeFileSync(outPath, routeHtml, 'utf-8');
  console.log(`[seo-html] ✓ Generated ${outPath}`);
}

console.log('[seo-html] Done — per-route HTML files created.');
