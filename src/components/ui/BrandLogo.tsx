import { useState, useEffect } from "react";
import { SupportedBrandKey, BRAND_TEXT_LABELS } from "@/features/design-manager/utils/brandLogoResolver";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  brand: SupportedBrandKey;
  src?: string | null;
  className?: string;
  imgClassName?: string;
  textClassName?: string;
}

export function BrandLogo({ brand, src, className, imgClassName, textClassName }: BrandLogoProps) {
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [src]);

  const shouldShowImage = Boolean(src) && !hasImageError;

  return (
    <div className={cn("flex items-center justify-center overflow-hidden", className)}>
      {shouldShowImage ? (
        <img
          src={src as string}
          alt={`${BRAND_TEXT_LABELS[brand]} logo`}
          className={cn("max-h-full max-w-full object-contain", imgClassName)}
          onError={() => setHasImageError(true)}
        />
      ) : (
        <span className={cn("font-semibold uppercase text-center whitespace-nowrap", textClassName)}>
          {BRAND_TEXT_LABELS[brand]}
        </span>
      )}
    </div>
  );
}
