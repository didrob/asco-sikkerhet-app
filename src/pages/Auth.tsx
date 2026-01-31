import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, AlertCircle, User, Building2, Loader2, CheckCircle2 } from 'lucide-react';
import { useCreateAccessRequest } from '@/hooks/useAccessRequests';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import authBackground from '@/assets/auth-background.jpg';

const authSchema = z.object({
  email: z.string().email('Ugyldig e-postadresse'),
  password: z.string().min(6, 'Passord må være minst 6 tegn'),
});

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  // Request access state
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

  // Redirect if already logged in
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
    
    if (message.includes('invalid login credentials')) {
      return 'Feil e-post eller passord';
    }
    if (message.includes('email not confirmed')) {
      return 'Vennligst bekreft e-postadressen din før du logger inn';
    }
    if (message.includes('too many requests')) {
      return 'For mange forsøk. Vennligst vent litt før du prøver igjen';
    }
    
    return 'En feil oppstod. Vennligst prøv igjen';
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Innlogging mislyktes',
        description: getErrorMessage(error),
      });
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestEmail.trim()) {
      toast({
        variant: 'destructive',
        title: 'Feil',
        description: 'E-post er påkrevd',
      });
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
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Feil',
        description: 'Kunne ikke sende forespørsel. Prøv igjen senere.',
      });
    }
  };

  const resetRequestForm = () => {
    setRequestEmail('');
    setRequestName('');
    setRequestCompany('');
    setRequestSent(false);
    setShowRequestDialog(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* Full-screen background image */}
      <img
        src={authBackground}
        alt="Industrial operations background"
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Dark navy overlay matching ASCO brand */}
      <div 
        className="absolute inset-0" 
        style={{ backgroundColor: 'hsl(240, 17%, 13%)', opacity: 0.85 }}
      />

      {/* Content container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
        
        {/* Left side - Branding & marketing text */}
        <div className="flex-1 text-center lg:text-left">
          {/* ASCO Logo - med sirkel */}
          <div className="mb-8 flex items-center gap-3 justify-center lg:justify-start">
            {/* Teal Circle */}
            <div 
              className="w-12 h-12 rounded-full flex-shrink-0"
              style={{ backgroundColor: 'hsl(166, 100%, 44%)' }}
            />
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white">
                ASCO
              </h1>
              <p className="text-white/60 text-sm font-medium tracking-wider">
                Prosedyrehub
              </p>
            </div>
          </div>

          {/* Hero text matching ASCO style */}
          <h2 className="text-3xl lg:text-5xl font-light text-white mb-2">
            Digital
          </h2>
          <h2 className="text-3xl lg:text-5xl font-light mb-6" style={{ color: 'hsl(166, 100%, 44%)' }}>
            sikkerhetsoperasjoner
          </h2>
          
          <p className="text-white/70 text-lg max-w-md mx-auto lg:mx-0">
            Administrer prosedyrer, opplæring og sertifiseringer på én plattform. 
            Sikker, effektiv og alltid tilgjengelig.
          </p>
        </div>

        {/* Right side - Login form */}
        <div className="w-full max-w-md">
          <div 
            className="rounded-xl p-8 backdrop-blur-sm border"
            style={{ 
              backgroundColor: 'hsla(240, 17%, 10%, 0.8)',
              borderColor: 'hsla(0, 0%, 100%, 0.1)'
            }}
          >
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white">Logg inn</h3>
              <p className="text-white/60 text-sm mt-1">
                Logg inn for å fortsette til ditt dashboard
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-white/80">E-post</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="din@epost.no"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[hsl(166,100%,44%)] focus:ring-[hsl(166,100%,44%)]"
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <p className="flex items-center gap-1 text-sm text-red-400">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-white/80">Passord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[hsl(166,100%,44%)] focus:ring-[hsl(166,100%,44%)]"
                    disabled={loading}
                  />
                </div>
                {errors.password && (
                  <p className="flex items-center gap-1 text-sm text-red-400">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full font-semibold"
                style={{ 
                  backgroundColor: 'hsl(166, 100%, 44%)',
                  color: 'hsl(240, 17%, 13%)'
                }}
                disabled={loading}
              >
                {loading ? 'Logger inn...' : 'Logg inn'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-sm text-white/50 mb-3">
                Har du ikke tilgang?
              </p>
              <Button
                variant="outline"
                onClick={() => setShowRequestDialog(true)}
                className="w-full bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                Be om tilgang
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Request Access Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={(open) => {
        if (!open) resetRequestForm();
        else setShowRequestDialog(true);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {requestSent ? 'Forespørsel sendt!' : 'Be om tilgang'}
            </DialogTitle>
            <DialogDescription>
              {requestSent
                ? 'Din forespørsel er registrert og vil bli behandlet av en administrator.'
                : 'Fyll ut skjemaet for å be om tilgang til systemet'}
            </DialogDescription>
          </DialogHeader>

          {requestSent ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <p className="text-muted-foreground">
                Du vil motta en e-post med innloggingsdetaljer når forespørselen er behandlet.
              </p>
              <Button
                className="mt-6"
                onClick={resetRequestForm}
              >
                Lukk
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRequestAccess} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="request-email">E-post *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="request-email"
                    type="email"
                    placeholder="din@epost.no"
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={createAccessRequest.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="request-name">Fullt navn</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="request-name"
                    type="text"
                    placeholder="Ola Nordmann"
                    value={requestName}
                    onChange={(e) => setRequestName(e.target.value)}
                    className="pl-10"
                    disabled={createAccessRequest.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="request-company">Firma/avdeling</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="request-company"
                    type="text"
                    placeholder="Firma AS"
                    value={requestCompany}
                    onChange={(e) => setRequestCompany(e.target.value)}
                    className="pl-10"
                    disabled={createAccessRequest.isPending}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetRequestForm}
                  className="flex-1"
                  disabled={createAccessRequest.isPending}
                >
                  Avbryt
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createAccessRequest.isPending}
                >
                  {createAccessRequest.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sender...
                    </>
                  ) : (
                    'Send forespørsel'
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
