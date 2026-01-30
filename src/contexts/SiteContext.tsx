import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSites } from '@/hooks/useSites';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import type { Tables } from '@/integrations/supabase/types';

type Site = Tables<'sites'>;

interface SiteContextType {
  currentSite: Site | null;
  sites: Site[];
  setCurrentSite: (site: Site) => void;
  isLoading: boolean;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export function SiteProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: sites, isLoading: sitesLoading } = useSites();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [currentSite, setCurrentSiteState] = useState<Site | null>(null);

  // Set initial current site based on profile or first available site
  useEffect(() => {
    if (!sites || sites.length === 0) {
      setCurrentSiteState(null);
      return;
    }

    // If profile has a current_site_id and it's in the user's sites, use it
    if (profile?.current_site_id) {
      const savedSite = sites.find(s => s.id === profile.current_site_id);
      if (savedSite) {
        setCurrentSiteState(savedSite);
        return;
      }
    }

    // Otherwise, use the first site
    setCurrentSiteState(sites[0]);
  }, [sites, profile?.current_site_id]);

  const setCurrentSite = async (site: Site) => {
    setCurrentSiteState(site);
    
    // Save to profile
    if (user) {
      updateProfile.mutate({ current_site_id: site.id });
    }
  };

  const isLoading = sitesLoading || profileLoading;

  return (
    <SiteContext.Provider value={{ 
      currentSite, 
      sites: sites || [], 
      setCurrentSite, 
      isLoading 
    }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSiteContext() {
  const context = useContext(SiteContext);
  if (context === undefined) {
    throw new Error('useSiteContext must be used within a SiteProvider');
  }
  return context;
}

