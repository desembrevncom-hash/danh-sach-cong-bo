import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { SeoPage } from '../types';
import { fetchSeoPageByRoute } from '../services/seoService';
import { getDefaultSeoByRoute } from '../defaults';

type SeoHeadProps = {
  routePath?: string;
  // If provided, overrides database fetch
  title?: string;
  description?: string;
  robots?: string;
};

export const SeoHead: React.FC<SeoHeadProps> = ({ routePath, title, description, robots }) => {
  const [seo, setSeo] = useState<Partial<SeoPage>>(() => {
    // Initial sync state if routePath provided
    if (routePath) {
      return getDefaultSeoByRoute(routePath);
    }
    return {};
  });

  useEffect(() => {
    let mounted = true;
    
    if (routePath) {
      fetchSeoPageByRoute(routePath).then(data => {
        if (mounted) {
          setSeo(data);
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, [routePath]);

  const finalTitle = title || seo.title;
  const finalDescription = description || seo.description;
  const finalRobots = robots || seo.robots || 'index,follow';
  
  const ogTitle = seo.ogTitle || finalTitle;
  const ogDescription = seo.ogDescription || finalDescription;

  return (
    <Helmet>
      {finalTitle && <title>{finalTitle}</title>}
      {finalDescription && <meta name="description" content={finalDescription} />}
      <meta name="robots" content={finalRobots} />
      
      {seo.canonicalUrl && <link rel="canonical" href={seo.canonicalUrl} />}
      
      {ogTitle && <meta property="og:title" content={ogTitle} />}
      {ogDescription && <meta property="og:description" content={ogDescription} />}
      <meta property="og:type" content="website" />
      {seo.canonicalUrl && <meta property="og:url" content={seo.canonicalUrl} />}
      {seo.ogImageUrl && <meta property="og:image" content={seo.ogImageUrl} />}
      
      <meta name="twitter:card" content="summary_large_image" />
      {ogTitle && <meta name="twitter:title" content={ogTitle} />}
      {ogDescription && <meta name="twitter:description" content={ogDescription} />}
      {seo.ogImageUrl && <meta name="twitter:image" content={seo.ogImageUrl} />}
      {seo.canonicalUrl && <meta name="twitter:url" content={seo.canonicalUrl} />}

      {seo.schemaJson && (
        <script type="application/ld+json">
          {JSON.stringify(seo.schemaJson)}
        </script>
      )}
    </Helmet>
  );
};
