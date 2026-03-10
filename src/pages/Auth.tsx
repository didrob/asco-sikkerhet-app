import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, AlertCircle, User, Building2, Loader2, CheckCircle2, FileText, GraduationCap, ShieldCheck } from 'lucide-react';
import { useCreateAccessRequest } from '@/hooks/useAccessRequests';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const authSchema = z.object({
  email: z.string().email('Ugyldig e-postadresse'),
  password: z.string().min(6, 'Passord må være minst 6 tegn'),
});

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestEmail, setRequestEmail] = useState('');
  const [requestName, setRequestName] = useState('');
  const [requestCompany, setRequestCompany] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const createAccessRequest = useCreateAccessRequest();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const validateForm = () => {
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field as keyof typeof fieldErrors] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const getErrorMessage = (error: Error): string => {
    const message = error.message.toLowerCase();
    if (message.includes('invalid login credentials')) return 'Feil e-post eller passord';
    if (message.includes('email not confirmed')) return 'Vennligst bekreft e-postadressen din før du logger inn';
    if (message.includes('too many requests')) return 'For mange forsøk. Vennligst vent litt før du prøver igjen';
    return 'En feil oppstod. Vennligst prøv igjen';
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Innlogging mislyktes', description: getErrorMessage(error) });
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestEmail.trim()) {
      toast({ variant: 'destructive', title: 'Feil', description: 'E-post er påkrevd' });
      return;
    }
    try {
      await createAccessRequest.mutateAsync({
        email: requestEmail.trim(),
        full_name: requestName.trim() || undefined,
        company: requestCompany.trim() || undefined,
        request_type: 'new_user',
      });
      setRequestSent(true);
    } catch {
      toast({ variant: 'destructive', title: 'Feil', description: 'Kunne ikke sende forespørsel. Prøv igjen senere.' });
    }
  };

  const resetRequestForm = () => {
    setRequestEmail('');
    setRequestName('');
    setRequestCompany('');
    setRequestSent(false);
    setShowRequestDialog(false);
  };

  const inputClasses = "bg-black/20 border border-white/10 rounded-xl text-white pl-10 px-4 py-3 placeholder:text-white/30 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all";

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#0B0F19' }}>
      {/* Glowing orbs */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-50 pointer-events-none" style={{ background: 'rgba(147, 51, 234, 0.3)', filter: 'blur(120px)' }} />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-50 pointer-events-none" style={{ background: 'rgba(29, 78, 216, 0.2)', filter: 'blur(120px)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-50 pointer-events-none" style={{ background: 'rgba(6, 182, 212, 0.1)', filter: 'blur(120px)' }} />
      <div className="absolute top-1/2 right-[20%] -translate-y-1/2 w-[300px] h-[300px] rounded-full opacity-50 pointer-events-none" style={{ background: 'hsla(166, 100%, 44%, 0.1)', filter: 'blur(100px)' }} />

      {/* Dot grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto w-full px-6 gap-12 lg:gap-20 items-center grid lg:grid-cols-2 min-h-screen">
        
        <div className="flex flex-col justify-center px-8 lg:px-16 py-12 text-white">
          <div className="mb-8 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: 'hsl(166, 100%, 44%)', boxShadow: '0 0 30px rgba(0,224,156,0.4)' }} />
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">ASCO</h1>
              <p className="text-white/50 text-sm font-medium tracking-wider">Prosedyrehub</p>
            </div>
          </div>

          <h2 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6">
            Sikkerhet og{' '}
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Kompetanse
            </span>{' '}
            i Fokus
          </h2>

          <p className="text-lg text-slate-300 mb-10 max-w-md">
            Din komplette enterprise-plattform for sikkerhetsprosedyrer, opplæring og compliance.
          </p>

          <div className="space-y-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 max-w-md flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(0,224,156,0.15)' }}>
                <FileText className="h-5 w-5" style={{ color: 'hsl(166, 100%, 44%)' }} />
              </div>
              <div>
                <p className="font-semibold text-sm">Digitale Prosedyrer</p>
                <p className="text-xs text-slate-400">Sporing og signering i sanntid</p>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 max-w-md flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(0,224,156,0.15)' }}>
                <GraduationCap className="h-5 w-5" style={{ color: 'hsl(166, 100%, 44%)' }} />
              </div>
              <div>
                <p className="font-semibold text-sm">Kurs og Sertifisering</p>
                <p className="text-xs text-slate-400">Automatisert opplæringsløp</p>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 max-w-md flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(0,224,156,0.15)' }}>
                <ShieldCheck className="h-5 w-5" style={{ color: 'hsl(166, 100%, 44%)' }} />
              </div>
              <div>
                <p className="font-semibold text-sm">Revisjon og Kontroll</p>
                <p className="text-xs text-slate-400">Fullt samsvar og historikk</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white">Logg inn</h3>
              <p className="text-white/40 text-sm mt-1">Logg inn for å fortsette til ditt dashboard</p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-slate-300 text-sm font-medium">E-post</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                  <Input id="login-email" type="email" placeholder="din@epost.no" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} disabled={loading} />
                </div>
                {errors.email && <p className="flex items-center gap-1 text-sm text-red-400"><AlertCircle className="h-3 w-3" />{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-slate-300 text-sm font-medium">Passord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                  <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClasses} disabled={loading} />
                </div>
                {errors.password && <p className="flex items-center gap-1 text-sm text-red-400"><AlertCircle className="h-3 w-3" />{errors.password}</p>}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl py-3 mt-4 hover:opacity-90 hover:scale-[1.02] transition-all duration-200 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                disabled={loading}
              >
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Logger inn...</> : 'Logg inn'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
              <p className="text-sm text-white/30 mb-3">Har du ikke tilgang?</p>
              <Button
                variant="outline"
                onClick={() => setShowRequestDialog(true)}
                className="w-full bg-white/[0.03] border-white/[0.1] text-purple-400 hover:bg-white/[0.08] hover:text-purple-300 hover:border-white/[0.15] transition-all duration-300"
              >
                Be om tilgang
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Request Access Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={(open) => { if (!open) resetRequestForm(); else setShowRequestDialog(true); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{requestSent ? 'Forespørsel sendt!' : 'Be om tilgang'}</DialogTitle>
            <DialogDescription>
              {requestSent ? 'Din forespørsel er registrert og vil bli behandlet av en administrator.' : 'Fyll ut skjemaet for å be om tilgang til systemet'}
            </DialogDescription>
          </DialogHeader>
          {requestSent ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <p className="text-muted-foreground">Du vil motta en e-post med innloggingsdetaljer når forespørselen er behandlet.</p>
              <Button className="mt-6" onClick={resetRequestForm}>Lukk</Button>
            </div>
          ) : (
            <form onSubmit={handleRequestAccess} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="request-email">E-post *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="request-email" type="email" placeholder="din@epost.no" value={requestEmail} onChange={(e) => setRequestEmail(e.target.value)} className="pl-10" required disabled={createAccessRequest.isPending} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="request-name">Fullt navn</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="request-name" type="text" placeholder="Ola Nordmann" value={requestName} onChange={(e) => setRequestName(e.target.value)} className="pl-10" disabled={createAccessRequest.isPending} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="request-company">Firma/avdeling</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="request-company" type="text" placeholder="Firma AS" value={requestCompany} onChange={(e) => setRequestCompany(e.target.value)} className="pl-10" disabled={createAccessRequest.isPending} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={resetRequestForm} className="flex-1" disabled={createAccessRequest.isPending}>Avbryt</Button>
                <Button type="submit" className="flex-1" disabled={createAccessRequest.isPending}>
                  {createAccessRequest.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sender...</> : 'Send forespørsel'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
