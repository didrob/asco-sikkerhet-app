import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ContentBlockEditor } from '@/components/training/ContentBlockEditor';
import {
  useTrainingCourse,
  useCreateTrainingCourse,
  useUpdateTrainingCourse,
} from '@/hooks/useTraining';
import { useProcedures } from '@/hooks/useProcedures';
import { useSiteContext } from '@/contexts/SiteContext';
import { Constants } from '@/integrations/supabase/types';
import type { QuizBlock } from '@/types/quiz';

const trainingTypes = [
  { value: 'theoretical', label: 'Teoretisk' },
  { value: 'practical', label: 'Praktisk' },
  { value: 'video', label: 'Video' },
  { value: 'mixed', label: 'Kombinert' },
];

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  operator: 'Operatør',
  supervisor: 'Veileder',
  viewer: 'Leser',
  external_client: 'Ekstern klient',
  auditor: 'Revisor',
};

export default function CourseEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSite } = useSiteContext();
  const isEditing = !!id;

  const { data: existingCourse, isLoading } = useTrainingCourse(id);
  const { data: procedures } = useProcedures(currentSite?.id || null);
  const createCourse = useCreateTrainingCourse();
  const updateCourse = useUpdateTrainingCourse();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [trainingType, setTrainingType] = useState<string>('theoretical');
  const [procedureIds, setProcedureIds] = useState<string[]>([]);
  const [contentBlocks, setContentBlocks] = useState<QuizBlock[]>([]);
  const [passThreshold, setPassThreshold] = useState(70);
  const [requiredForRoles, setRequiredForRoles] = useState<string[]>([]);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  // Load existing course data
  useEffect(() => {
    if (existingCourse) {
      setTitle(existingCourse.title);
      setDescription(existingCourse.description || '');
      setTrainingType(existingCourse.training_type);
      setProcedureIds(existingCourse.procedure_ids || []);
      setContentBlocks((existingCourse.content_blocks as QuizBlock[]) || []);
      setPassThreshold(existingCourse.pass_threshold || 70);
      setRequiredForRoles(existingCourse.required_for_roles || []);
      setStatus(existingCourse.status as 'draft' | 'published');
    }
  }, [existingCourse]);

  const handleSave = (saveStatus?: 'draft' | 'published') => {
    const courseData = {
      title,
      description,
      training_type: trainingType as any,
      procedure_ids: procedureIds,
      content_blocks: contentBlocks as any,
      pass_threshold: passThreshold,
      required_for_roles: requiredForRoles,
      status: saveStatus || status,
    };

    if (isEditing) {
      updateCourse.mutate(
        { id, ...courseData },
        { onSuccess: () => navigate('/training/manage') }
      );
    } else {
      createCourse.mutate(courseData, {
        onSuccess: () => navigate('/training/manage'),
      });
    }
  };

  const toggleProcedure = (procId: string) => {
    setProcedureIds(prev =>
      prev.includes(procId) ? prev.filter(id => id !== procId) : [...prev, procId]
    );
  };

  const toggleRole = (role: string) => {
    setRequiredForRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const isSaving = createCourse.isPending || updateCourse.isPending;

  if (isEditing && isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/training/manage">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditing ? 'Rediger kurs' : 'Nytt kurs'}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave('draft')} disabled={!title.trim() || isSaving}>
              Lagre utkast
            </Button>
            <Button onClick={() => handleSave('published')} disabled={!title.trim() || isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? 'Lagre og publiser' : 'Opprett og publiser'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList>
            <TabsTrigger value="info">Grunninfo</TabsTrigger>
            <TabsTrigger value="content">Innhold ({contentBlocks.length})</TabsTrigger>
            <TabsTrigger value="settings">Innstillinger</TabsTrigger>
          </TabsList>

          {/* Tab 1: Grunninfo */}
          <TabsContent value="info">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label>Kurstitel *</Label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="F.eks. Sikkerhetskurs for kranførere"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Beskrivelse</Label>
                  <Textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Kort beskrivelse av kurset..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kurstype</Label>
                  <Select value={trainingType} onValueChange={setTrainingType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {trainingTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Procedure linking */}
                <div className="space-y-2">
                  <Label>Koble til prosedyrer (valgfritt)</Label>
                  <p className="text-xs text-muted-foreground">
                    Velg prosedyrer som deltakerne bør lese i forbindelse med kurset.
                  </p>
                  <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                    {procedures?.filter(p => p.status === 'published').map(proc => (
                      <label key={proc.id} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50">
                        <Checkbox
                          checked={procedureIds.includes(proc.id)}
                          onCheckedChange={() => toggleProcedure(proc.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{proc.title}</p>
                          {proc.category && (
                            <Badge variant="outline" className="text-xs mt-0.5">{proc.category}</Badge>
                          )}
                        </div>
                      </label>
                    )) || (
                      <p className="p-4 text-sm text-muted-foreground text-center">Ingen prosedyrer tilgjengelig</p>
                    )}
                  </div>
                  {procedureIds.length > 0 && (
                    <p className="text-xs text-muted-foreground">{procedureIds.length} prosedyre(r) valgt</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Innhold */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Quiz-innhold</CardTitle>
              </CardHeader>
              <CardContent>
                <ContentBlockEditor blocks={contentBlocks} onChange={setContentBlocks} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Innstillinger */}
          <TabsContent value="settings">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <Label>Bestått-grense: {passThreshold}%</Label>
                  <Slider
                    value={[passThreshold]}
                    onValueChange={([val]) => setPassThreshold(val)}
                    min={10} max={100} step={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Deltakere må oppnå minst {passThreshold}% for å bestå kurset.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Obligatorisk for roller</Label>
                  <p className="text-xs text-muted-foreground">
                    Velg roller som dette kurset er obligatorisk for.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {Constants.public.Enums.app_role.map(role => (
                      <label key={role} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={requiredForRoles.includes(role)}
                          onCheckedChange={() => toggleRole(role)}
                        />
                        <span className="text-sm">{roleLabels[role] || role}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
