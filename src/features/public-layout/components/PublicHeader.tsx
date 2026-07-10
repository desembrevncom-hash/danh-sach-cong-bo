import { Link } from "react-router-dom";
import { BrandSwitcherNav } from "./BrandSwitcherNav";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <span className="font-semibold text-sm md:text-base tracking-tight text-foreground truncate max-w-[150px] sm:max-w-xs md:max-w-full">
            Hệ thống tra cứu công bố sản phẩm
          </span>
        </Link>
        <BrandSwitcherNav />
      </div>
    </header>
  );
}
