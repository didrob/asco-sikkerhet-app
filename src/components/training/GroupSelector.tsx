import { useState } from 'react';
import { Users, Check, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTrainingGroups, TrainingGroup } from '@/hooks/useTrainingGroups';

interface GroupSelectorProps {
  selectedGroupIds: string[];
  onSelectionChange: (groupIds: string[]) => void;
  showMemberCount?: boolean;
}

export function GroupSelector({ 
  selectedGroupIds, 
  onSelectionChange,
  showMemberCount = true
}: GroupSelectorProps) {
  const { data: groups, isLoading } = useTrainingGroups();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGroups = groups?.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleGroup = (groupId: string) => {
    if (selectedGroupIds.includes(groupId)) {
      onSelectionChange(selectedGroupIds.filter(id => id !== groupId));
    } else {
      onSelectionChange([...selectedGroupIds, groupId]);
    }
  };

  const selectAll = () => {
    if (filteredGroups) {
      onSelectionChange(filteredGroups.map(g => g.id));
    }
  };

  const deselectAll = () => {
    onSelectionChange([]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Velg grupper
            </CardTitle>
            <CardDescription>
              {selectedGroupIds.length} av {groups?.length || 0} valgt
            </CardDescription>
          </div>
          <div className="flex gap-2 text-sm">
            <button 
              onClick={selectAll}
              className="text-primary hover:underline"
            >
              Velg alle
            </button>
            <span className="text-muted-foreground">|</span>
            <button 
              onClick={deselectAll}
              className="text-primary hover:underline"
            >
              Fjern alle
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Søk i grupper..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Group List */}
        <ScrollArea className="h-[250px]">
          <div className="space-y-2 pr-4">
            {filteredGroups && filteredGroups.length > 0 ? (
              filteredGroups.map((group) => {
                const isSelected = selectedGroupIds.includes(group.id);
                return (
                  <div
                    key={group.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleGroup(group.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleGroup(group.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{group.name}</p>
                      {group.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {group.description}
                        </p>
                      )}
                    </div>
                    {showMemberCount && (
                      <Badge variant="secondary">
                        {group.member_count} {group.member_count === 1 ? 'medlem' : 'medlemmer'}
                      </Badge>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                {searchTerm 
                  ? 'Ingen grupper funnet' 
                  : 'Ingen grupper opprettet ennå'}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
