import { NavLink } from "react-router-dom";

export function BrandSwitcherNav() {
  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            isActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`
        }
      >
        Trang chủ
      </NavLink>
      <NavLink
        to="/desembre"
        className={({ isActive }) =>
          `px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            isActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`
        }
      >
        Desembre
      </NavLink>
      <NavLink
        to="/dermagarden"
        className={({ isActive }) =>
          `px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            isActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`
        }
      >
        Dermagarden
      </NavLink>
    </nav>
  );
}
