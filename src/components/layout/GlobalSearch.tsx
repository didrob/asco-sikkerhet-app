import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { Search, FileText, GraduationCap, LayoutDashboard, User, Award, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  GraduationCap,
  LayoutDashboard,
  User,
  Award,
};

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { results, hasResults, isSearching } = useGlobalSearch(query);

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const handleSelect = (url: string) => {
    navigate(url);
    onOpenChange(false);
  };

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-lg max-w-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Søk etter prosedyrer, kurs, sider..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 hover:bg-accent rounded"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            {isSearching && (
              <Command.Loading className="py-6 text-center text-sm text-muted-foreground">
                Søker...
              </Command.Loading>
            )}

            {!isSearching && !hasResults && query && (
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                Ingen resultater funnet for "{query}"
              </Command.Empty>
            )}

            {results.pages.length > 0 && (
              <Command.Group heading="Sider">
                {results.pages.map((page) => (
                  <Command.Item
                    key={page.id}
                    value={page.title}
                    onSelect={() => handleSelect(page.url)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer hover:bg-accent"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      {getIcon(page.icon)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{page.title}</span>
                      {page.description && (
                        <span className="text-xs text-muted-foreground">{page.description}</span>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results.procedures.length > 0 && (
              <Command.Group heading="Prosedyrer">
                {results.procedures.map((procedure) => (
                  <Command.Item
                    key={procedure.id}
                    value={procedure.title}
                    onSelect={() => handleSelect(procedure.url)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer hover:bg-accent"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium truncate">{procedure.title}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {procedure.category && (
                          <span className="bg-secondary px-1.5 py-0.5 rounded">{procedure.category}</span>
                        )}
                        {procedure.description && (
                          <span className="truncate">{procedure.description}</span>
                        )}
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results.courses.length > 0 && (
              <Command.Group heading="Kurs">
                {results.courses.map((course) => (
                  <Command.Item
                    key={course.id}
                    value={course.title}
                    onSelect={() => handleSelect(course.url)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer hover:bg-accent"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-500/10 text-green-600 dark:text-green-400">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium truncate">{course.title}</span>
                      {course.description && (
                        <span className="text-xs text-muted-foreground truncate">{course.description}</span>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Keyboard hint */}
            <div className="border-t mt-2 pt-2 px-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Naviger med piltaster</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↵</kbd>
                  <span>for å åpne</span>
                </div>
              </div>
            </div>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
