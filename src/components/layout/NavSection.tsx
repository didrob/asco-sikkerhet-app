import { ReactNode } from 'react';
import { LucideIcon, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface NavSectionProps {
  title: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function NavSection({ title, icon: Icon, defaultOpen = true, children }: NavSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="space-y-1">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-accent group">
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {title}
        </span>
        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
