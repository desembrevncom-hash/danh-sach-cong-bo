import { useState } from "react";
import { NavLink } from "react-router-dom";

type BrandLogoNavItemProps = {
  to: string;
  label: string;
  imageSrc: string;
};

function BrandLogoNavItem({ to, label, imageSrc }: BrandLogoNavItemProps) {
  const [imgError, setImgError] = useState(false);
  
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
      aria-label={label}
    >
      {({ isActive }) => (
        <>
          {!imgError ? (
            <img
              src={imageSrc}
              alt={label}
              className="h-auto w-auto object-contain max-h-[24px] max-w-[88px] sm:max-h-[34px] sm:max-w-[132px] transition-transform duration-300 ease-out"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-[10px] sm:text-xs tracking-[0.16em] sm:tracking-[0.28em] font-semibold uppercase text-foreground text-center whitespace-nowrap overflow-visible">
              {label.replace("Xem danh mục ", "").replace("Về trang chủ ", "")}
            </span>
          )}
          
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
  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-[#f8f5ef]/85 dark:bg-background/90 backdrop-blur-md shadow-sm">
      <div className="mx-auto grid h-[60px] sm:h-[72px] max-w-5xl grid-cols-3 items-center px-2 sm:px-6">
        <BrandLogoNavItem
          to="/desembre"
          label="Xem danh mục Desembre"
          imageSrc="/images/logo-desembre.png"
        />
        
        <BrandLogoNavItem
          to="/"
          label="Về trang chủ HYUNJIN"
          imageSrc="/images/logo-hyunjin.png"
        />
        
        <BrandLogoNavItem
          to="/dermagarden"
          label="Xem danh mục Dermagarden"
          imageSrc="/images/logo-dermagarden.png"
        />
      </div>
    </header>
  );
}
