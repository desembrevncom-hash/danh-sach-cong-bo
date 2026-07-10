import { useState } from "react";
import { NavLink } from "react-router-dom";

type BrandLogoNavItemProps = {
  to: string;
  label: string;
  imageSrc: string;
  imageMaxWidth: string;
  align: "left" | "center" | "right";
};

function BrandLogoNavItem({ to, label, imageSrc, imageMaxWidth, align }: BrandLogoNavItemProps) {
  const [imgError, setImgError] = useState(false);

  let justifyClass = "justify-center";
  if (align === "left") justifyClass = "justify-start md:justify-start";
  if (align === "right") justifyClass = "justify-end md:justify-end";
  
  // on mobile (420px), maybe we want everything somewhat centered or tightly packed, but flex-col or flex-row.
  // Actually, grid-cols-3 handles the positioning. We just need to align inside the cell.
  
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center ${justifyClass} h-full w-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-sm px-1 md:px-4 py-2 ${
          isActive ? "opacity-100 drop-shadow-sm" : "opacity-60 hover:opacity-100"
        }`
      }
      aria-label={label}
    >
      {!imgError ? (
        <img
          src={imageSrc}
          alt={label}
          className={`object-contain max-h-8 md:max-h-12 w-full ${imageMaxWidth}`}
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-[10px] sm:text-xs md:text-sm font-bold tracking-widest uppercase text-foreground text-center line-clamp-2 md:line-clamp-1">
          {label.replace("Xem danh mục ", "").replace("Về trang chủ ", "")}
        </span>
      )}
    </NavLink>
  );
}

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-[#f8f5ef]/90 dark:bg-background/90 backdrop-blur-md">
      <div className="mx-auto grid h-16 sm:h-20 max-w-7xl grid-cols-3 items-center px-3 sm:px-6 gap-1 sm:gap-4">
        <BrandLogoNavItem
          to="/desembre"
          label="Xem danh mục Desembre"
          imageSrc="/images/logo-desembre.png"
          imageMaxWidth="max-w-[80px] sm:max-w-[96px] md:max-w-[120px]"
          align="left"
        />
        
        <BrandLogoNavItem
          to="/"
          label="Về trang chủ HYUNJIN"
          imageSrc="/images/logo-hyunjin.png"
          imageMaxWidth="max-w-[70px] sm:max-w-[90px] md:max-w-[110px]"
          align="center"
        />
        
        <BrandLogoNavItem
          to="/dermagarden"
          label="Xem danh mục Dermagarden"
          imageSrc="/images/logo-dermagarden.png"
          imageMaxWidth="max-w-[88px] sm:max-w-[104px] md:max-w-[130px]"
          align="right"
        />
      </div>
    </header>
  );
}
