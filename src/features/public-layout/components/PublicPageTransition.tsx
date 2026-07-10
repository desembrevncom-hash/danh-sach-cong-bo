import { ReactNode } from "react";
import { useLocation } from "react-router-dom";

export function PublicPageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div
      key={location.pathname}
      className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both"
    >
      {children}
    </div>
  );
}
