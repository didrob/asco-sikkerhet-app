import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIsAdmin } from '@/hooks/useUserRoles';
import { useSiteContext } from '@/contexts/SiteContext';
import { Shield, Settings, Bell, Palette, Database, Download, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(val => 
      typeof val === 'string' && val.includes(',') ? `"${val}"` : val
    ).join(',')
  );
  const csv = [headers, ...rows].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminSettings() {
  const { data: isAdmin, isLoading } = useIsAdmin();
  const { currentSite } = useSiteContext();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  // Access check
  if (!isLoading && !isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">Ingen tilgang</h2>
          <p className="text-muted-foreground">
            Du må være administrator for å endre innstillinger.
          </p>
        </div>
      </AppLayout>
    );
  }

  const handleExportProcedures = async () => {
    try {
      const { data, error } = await supabase
        .from('procedures')
        .select('id, title, description, status, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data?.length) {
        exportToCSV(
          data.map(p => ({
            id: p.id,
            tittel: p.title,
            beskrivelse: p.description || '',
            status: p.status,
            opprettet: format(new Date(p.created_at), 'dd.MM.yyyy HH:mm'),
            oppdatert: format(new Date(p.updated_at), 'dd.MM.yyyy HH:mm'),
          })),
          `prosedyrer-${format(new Date(), 'yyyy-MM-dd')}.csv`
        );
        toast({
          title: 'Eksport fullført',
          description: 'Prosedyrer er eksportert til CSV.',
        });
      } else {
        toast({
          title: 'Ingen data',
          description: 'Det er ingen prosedyrer å eksportere.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Feil',
        description: 'Kunne ikke eksportere prosedyrer.',
        variant: 'destructive',
      });
    }
  };

  const handleExportCompletions = async () => {
    try {
      const { data, error } = await supabase
        .from('procedure_completions')
        .select(`
          id,
          completed_at,
          procedure_id,
          user_id,
          procedures(title)
        `)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      if (data?.length) {
        exportToCSV(
          data.map(c => ({
            id: c.id,
            prosedyre: (c.procedures as { title: string } | null)?.title || c.procedure_id,
            bruker_id: c.user_id,
            fullfort: format(new Date(c.completed_at), 'dd.MM.yyyy HH:mm'),
          })),
          `fullforinger-${format(new Date(), 'yyyy-MM-dd')}.csv`
        );
        toast({
          title: 'Eksport fullført',
          description: 'Fullføringer er eksportert til CSV.',
        });
      } else {
        toast({
          title: 'Ingen data',
          description: 'Det er ingen fullføringer å eksportere.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Feil',
        description: 'Kunne ikke eksportere fullføringer.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Settings className="h-6 w-6" />
            Innstillinger
          </h1>
          <p className="text-muted-foreground">
            Administrer systeminnstillinger
          </p>
        </div>

        {/* Settings Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Appearance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Utseende</CardTitle>
                  <CardDescription>
                    Velg tema for applikasjonen
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="flex-1"
                >
                  <Sun className="mr-2 h-4 w-4" />
                  Lys
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="flex-1"
                >
                  <Moon className="mr-2 h-4 w-4" />
                  Mørk
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
                  className="flex-1"
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Varsler</CardTitle>
                  <CardDescription>
                    Konfigurer e-postvarsler og påminnelser
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                E-postvarsler for prosedyre-frister og påminnelser kommer i en fremtidig oppdatering.
              </p>
            </CardContent>
          </Card>

          {/* Data Export */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Data</CardTitle>
                  <CardDescription>
                    Eksporter data og rapporter
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleExportProcedures}
              >
                <Download className="mr-2 h-4 w-4" />
                Eksporter alle prosedyrer (CSV)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleExportCompletions}
              >
                <Download className="mr-2 h-4 w-4" />
                Eksporter alle fullføringer (CSV)
              </Button>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Sikkerhet</CardTitle>
                  <CardDescription>
                    Administrer sikkerhetsinnstillinger
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Passord og brukerkontoer administreres via brukerens profilside eller av systemadministrator i brukeroversikten.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
