import React, { useEffect, useState, useRef } from "react";
import { useSiteSettings } from "@/features/seo/components/SiteSettingsProvider";
import type { GalleryImage } from "@/features/seo/services/siteSettingsService";
import { cn } from "@/lib/utils";

const MOSAIC_CLASSES = [
  "col-span-12 md:col-span-7 md:row-span-2 min-h-[300px] md:min-h-[400px]", // Slot 1: Large
  "col-span-12 md:col-span-5 md:row-span-1 min-h-[200px]",                 // Slot 2: Small top right
  "col-span-12 md:col-span-5 md:row-span-1 min-h-[200px]",                 // Slot 3: Small bottom right
  "col-span-12 md:col-span-4 md:row-span-1 min-h-[200px]",                 // Slot 4: Small bottom left
  "col-span-12 md:col-span-8 md:row-span-2 min-h-[300px] md:min-h-[400px]",// Slot 5: Large bottom middle
  "col-span-12 md:col-span-4 md:row-span-1 min-h-[200px]",                 // Slot 6: Small bottom right
];

export function HomeProductGallery() {
  const { settings } = useSiteSettings();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  const [visibleSlots, setVisibleSlots] = useState<GalleryImage[]>([]);
  const [fadeState, setFadeState] = useState<Record<number, boolean>>({}); // true = fading out
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);
  
  const activeImages = settings?.homeProductGalleryImages?.filter(img => img.isActive) || [];

  // Observe reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Initial load
  useEffect(() => {
    if (activeImages.length > 0 && visibleSlots.length === 0) {
      setVisibleSlots(activeImages.slice(0, 6));
      setTimeout(() => setHasAnimatedIn(true), 100);
    }
  }, [activeImages, visibleSlots.length]);

  // Auto-cycle logic
  const activeImagesRef = useRef(activeImages);
  activeImagesRef.current = activeImages;

  useEffect(() => {
    if (activeImagesRef.current.length <= 6 || prefersReducedMotion) return;

    const interval = setInterval(() => {
      setVisibleSlots(prev => {
        const next = [...prev];
        const allImages = activeImagesRef.current;
        
        // Pick 1 slot to replace (to keep it subtle)
        const slotIndex = Math.floor(Math.random() * Math.min(prev.length, 6));
        
        // Find images not currently shown
        const availableImages = allImages.filter(img => !next.some(n => n.id === img.id));
        
        if (availableImages.length > 0) {
          const nextImgIndex = Math.floor(Math.random() * availableImages.length);
          const nextImg = availableImages[nextImgIndex];
          
          setFadeState(f => ({ ...f, [slotIndex]: true }));
          
          setTimeout(() => {
            setVisibleSlots(curr => {
              const updated = [...curr];
              updated[slotIndex] = nextImg;
              return updated;
            });
            setFadeState(f => ({ ...f, [slotIndex]: false }));
          }, 400); // Wait for fade out to complete
        }
        
        return next;
      });
    }, 5000); // 5 seconds interval

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  if (!activeImages.length) {
    return null; // Don't render if no images
  }

  return (
    <section className="py-16 md:py-24 bg-background overflow-hidden relative">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-10 md:mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            BỘ SƯU TẬP HÌNH ẢNH
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 elegant-title">
            Sản phẩm nổi bật
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Khám phá hình ảnh sản phẩm Desembre và Dermagarden đang được cập nhật trên hệ thống.
          </p>
        </div>

        {/* Desktop Mosaic Layout */}
        <div className="hidden md:grid grid-cols-12 auto-rows-min gap-4 md:gap-6 max-w-[1280px] mx-auto">
          {visibleSlots.map((img, idx) => (
            <div 
              key={`${idx}-${img.id}`}
              className={cn(
                "relative overflow-hidden rounded-xl bg-card border border-border/50 shadow-sm transition-all duration-700",
                MOSAIC_CLASSES[idx % MOSAIC_CLASSES.length],
                fadeState[idx] ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100",
                !hasAnimatedIn && !prefersReducedMotion ? "opacity-0 translate-y-8" : "",
                !prefersReducedMotion && "hover:shadow-md hover:-translate-y-1 hover:border-border group"
              )}
              style={{
                transitionDelay: hasAnimatedIn ? '0ms' : `${idx * 100}ms`
              }}
            >
              <img
                src={img.url}
                alt={img.alt || "Product gallery"}
                loading="lazy"
                decoding="async"
                className={cn(
                  "absolute inset-0 w-full h-full object-cover transition-transform duration-700",
                  !prefersReducedMotion && "group-hover:scale-105"
                )}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmMTRiIiAvPjwvc3ZnPg==';
                }}
              />
              
              {/* Optional caption overlay on hover */}
              {img.caption && (
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-sm font-medium drop-shadow-sm">{img.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile Horizontal Scroll Snap Layout */}
        <div className="md:hidden">
          <div className="flex overflow-x-auto snap-x snap-mandatory pb-6 -mx-6 px-6 space-x-4 hide-scrollbar">
            {activeImages.map((img, idx) => (
              <div 
                key={img.id}
                className={cn(
                  "flex-none w-[75vw] max-w-[300px] aspect-[4/5] relative overflow-hidden rounded-xl bg-card border border-border/50 shadow-sm snap-center",
                  !hasAnimatedIn && !prefersReducedMotion ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0 transition-all duration-700"
                )}
                style={{
                  transitionDelay: hasAnimatedIn ? '0ms' : `${idx * 100}ms`
                }}
              >
                <img
                  src={img.url}
                  alt={img.alt || "Product gallery"}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {img.caption && (
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white text-sm font-medium drop-shadow-sm">{img.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-2 text-center flex items-center justify-center gap-2 text-muted-foreground/60">
            <span className="text-xs font-medium tracking-wide">Vuốt để xem thêm</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
