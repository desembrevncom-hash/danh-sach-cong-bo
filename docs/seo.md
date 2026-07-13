# SPA SEO Limitations and Recommendations

## Context
The application uses React, Vite, and Supabase to render its UI entirely client-side (SPA - Single Page Application).
For SEO metadata management, we have implemented `react-helmet-async` which dynamically updates the document's `<head>` at runtime.

## Known Limitations (MVP)
1. **Googlebot Support**: Googlebot executes JavaScript and usually indexes client-side rendered metadata (Title, Description, canonical tags) correctly. However, indexing might be delayed compared to static HTML.
2. **Social Media Crawlers**: Bots for Facebook, Twitter, Zalo, and iMessage typically **do not** execute JavaScript. When these bots scrape a link, they only see the static meta tags in `index.html`. Thus, dynamic Open Graph (OG) and Twitter Card tags configured in the Admin SEO Manager will likely be ignored by these platforms.

## Future Recommendations (Beyond MVP)
If full support for social sharing and instant SEO indexing is required, consider one of the following architectural changes:

1. **Prerendering**: Use a build-time prerendering tool (e.g., `vite-plugin-ssr`, `prerender-spa-plugin`) to generate static HTML for `/`, `/desembre`, and `/dermagarden` during the build process.
2. **Server-Side Rendering (SSR) / Static Site Generation (SSG)**: Migrate the frontend to Next.js or Remix, which support SSR/SSG out of the box, ensuring all meta tags are present in the initial HTML response.
3. **Edge Functions / Middleware HTML Rewriting**: Deploy the SPA on a platform like Vercel or Cloudflare and use Edge Middleware to intercept requests to public routes and inject the SEO meta tags dynamically before returning the HTML.
