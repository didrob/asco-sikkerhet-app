import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSiteContext } from '@/contexts/SiteContext';

interface SearchResult {
  id: string;
  type: 'procedure' | 'course' | 'page';
  title: string;
  description?: string;
  category?: string;
  url: string;
  icon: string;
}

const STATIC_PAGES: SearchResult[] = [
  { id: 'dashboard', type: 'page', title: 'Dashboard', description: 'Hovedoversikt', url: '/', icon: 'LayoutDashboard' },
  { id: 'procedures', type: 'page', title: 'Prosedyrer', description: 'Bla i prosedyrer', url: '/procedures', icon: 'FileText' },
  { id: 'training', type: 'page', title: 'Opplæring', description: 'Mine kurs', url: '/training', icon: 'GraduationCap' },
  { id: 'certificates', type: 'page', title: 'Sertifikater', description: 'Mine sertifikater', url: '/certificates', icon: 'Award' },
  { id: 'profile', type: 'page', title: 'Min profil', description: 'Kontoinnstillinger', url: '/profile', icon: 'User' },
];

export function useGlobalSearch(query: string) {
  const { currentSite } = useSiteContext();
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch procedures
  const { data: procedures = [] } = useQuery({
    queryKey: ['search-procedures', currentSite?.id],
    queryFn: async () => {
      if (!currentSite?.id) return [];
      const { data, error } = await supabase
        .from('procedures')
        .select('id, title, description, category, document_number')
        .eq('site_id', currentSite.id)
        .eq('status', 'published')
        .order('title');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentSite?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Fetch training courses
  const { data: courses = [] } = useQuery({
    queryKey: ['search-courses', currentSite?.id],
    queryFn: async () => {
      if (!currentSite?.id) return [];
      const { data, error } = await supabase
        .from('training_courses')
        .select('id, title, description, training_type')
        .eq('site_id', currentSite.id)
        .eq('status', 'published')
        .order('title');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentSite?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Filter and combine results
  const results = useMemo(() => {
    const normalizedQuery = debouncedQuery.toLowerCase().trim();
    
    if (!normalizedQuery) {
      return {
        pages: STATIC_PAGES.slice(0, 3),
        procedures: [],
        courses: [],
      };
    }

    const filteredProcedures: SearchResult[] = procedures
      .filter(p => 
        p.title.toLowerCase().includes(normalizedQuery) ||
        p.description?.toLowerCase().includes(normalizedQuery) ||
        p.category?.toLowerCase().includes(normalizedQuery) ||
        p.document_number?.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        type: 'procedure' as const,
        title: p.title,
        description: p.description || undefined,
        category: p.category || undefined,
        url: `/procedures/${p.id}`,
        icon: 'FileText',
      }));

    const filteredCourses: SearchResult[] = courses
      .filter(c =>
        c.title.toLowerCase().includes(normalizedQuery) ||
        c.description?.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 5)
      .map(c => ({
        id: c.id,
        type: 'course' as const,
        title: c.title,
        description: c.description || undefined,
        category: c.training_type || undefined,
        url: `/training/${c.id}/play`,
        icon: 'GraduationCap',
      }));

    const filteredPages = STATIC_PAGES.filter(p =>
      p.title.toLowerCase().includes(normalizedQuery) ||
      p.description?.toLowerCase().includes(normalizedQuery)
    );

    return {
      pages: filteredPages,
      procedures: filteredProcedures,
      courses: filteredCourses,
    };
  }, [debouncedQuery, procedures, courses]);

  const hasResults = results.pages.length > 0 || results.procedures.length > 0 || results.courses.length > 0;

  return {
    results,
    hasResults,
    isSearching: query !== debouncedQuery,
  };
}
