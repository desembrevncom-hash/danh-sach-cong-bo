import { NavLink } from "react-router-dom";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { resolveBrandLogoUrl, SupportedBrandKey } from "@/features/design-manager/utils/brandLogoResolver";
import { useSiteSettings } from "@/features/seo/components/SiteSettingsProvider";

type BrandLogoNavItemProps = {
  to: string;
  brand: SupportedBrandKey;
  imageSrc: string | null;
  isLoading: boolean;
};

function BrandLogoNavItem({ to, brand, imageSrc, isLoading }: BrandLogoNavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex flex-col items-center justify-center h-full w-full min-w-0 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-sm px-1 overflow-visible ${
          isActive 
            ? "opacity-100 scale-[1.06] sm:scale-[1.12]" 
            : "opacity-60 scale-100 hover:opacity-100 hover:scale-[1.05] hover:-translate-y-0.5"
        }`
      }
      aria-label={`Về trang ${brand}`}
    >
      {({ isActive }) => (
        <>
          <BrandLogo 
            brand={brand} 
            src={imageSrc} 
            isLoading={isLoading}
            className="h-[24px] sm:h-[34px] flex items-center justify-center overflow-visible"
            imgClassName="max-h-[24px] max-w-[88px] sm:max-h-[34px] sm:max-w-[132px] transition-transform duration-300 ease-out"
            textClassName="text-[10px] sm:text-xs tracking-[0.16em] sm:tracking-[0.28em] text-foreground"
          />
          
          {/* Active indicator underline */}
          {isActive && (
            <div className="absolute bottom-1 sm:bottom-2 h-[2px] w-6 sm:w-8 rounded-full bg-[#b89b5e] shadow-sm animate-in fade-in zoom-in-50 duration-300" />
          )}
        </>
      )}
    </NavLink>
  );
}

export function PublicHeader() {
  const { settings, isLoading } = useSiteSettings();

  const desembreLogo = resolveBrandLogoUrl(settings, "desembre");
  const hyunjinLogo = resolveBrandLogoUrl(settings, "hyunjin");
  const dermagardenLogo = resolveBrandLogoUrl(settings, "dermagarden");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-[#f8f5ef]/85 dark:bg-background/90 backdrop-blur-md shadow-sm">
      <div className="mx-auto grid h-[60px] sm:h-[72px] max-w-5xl grid-cols-3 items-center px-2 sm:px-6">
        <BrandLogoNavItem
          to="/desembre"
          brand="desembre"
          imageSrc={desembreLogo}
          isLoading={isLoading}
        />
        
        <BrandLogoNavItem
          to="/"
          brand="hyunjin"
          imageSrc={hyunjinLogo}
          isLoading={isLoading}
        />
        
        <BrandLogoNavItem
          to="/dermagarden"
          brand="dermagarden"
          imageSrc={dermagardenLogo}
          isLoading={isLoading}
        />
      </div>
    </header>
  );
}
