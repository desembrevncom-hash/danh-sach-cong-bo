import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchSiteSettings, type SiteSettings } from '../services/siteSettingsService';

interface SiteSettingsContextType {
  settings: SiteSettings | null;
  isLoading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: null,
  isLoading: true,
  error: null,
  refreshSettings: async () => {},
});

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  
  const [localSettings, setLocalSettings] = useState<SiteSettings | null>(() => {
    try {
      const cached = localStorage.getItem('site-settings-cache-v1');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Ignore errors
    }
    return null;
  });

  const { data, isLoading: queryLoading, error: queryError } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const res = await fetchSiteSettings();
      if (!res.ok) {
        throw new Error(res.error || "Failed to fetch settings");
      }
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  useEffect(() => {
    if (data) {
      setLocalSettings(data);
      try {
        localStorage.setItem('site-settings-cache-v1', JSON.stringify(data));
      } catch {
        // Ignore errors
      }
    }
  }, [data]);

  const refreshSettings = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['site-settings'] });
  }, [queryClient]);

  // IsLoading is true only if we don't have localSettings yet AND query is loading
  const isLoading = queryLoading && !localSettings;

  return (
    <SiteSettingsContext.Provider 
      value={{ 
        settings: localSettings, 
        isLoading, 
        error: queryError ? (queryError as Error).message : null,
        refreshSettings 
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}

export const useSiteSettings = () => useContext(SiteSettingsContext);
