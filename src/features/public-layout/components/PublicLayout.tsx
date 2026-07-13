import { ReactNode } from "react";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { PublicPageTransition } from "./PublicPageTransition";
import { useScrollToTop } from "@/hooks/useScrollToTop";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  useScrollToTop();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      <PublicHeader />
      <main className="flex-1 flex flex-col w-full relative">
        <PublicPageTransition>{children}</PublicPageTransition>
      </main>
      <PublicFooter />
    </div>
  );
}
