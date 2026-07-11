import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EditUnlockProvider } from "@/features/edit-unlock/hooks/useEditUnlock";
import { SiteSettingsProvider } from "@/features/seo/components/SiteSettingsProvider";

const queryClient = new QueryClient();

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SiteSettingsProvider>
          <EditUnlockProvider>{children}</EditUnlockProvider>
        </SiteSettingsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
