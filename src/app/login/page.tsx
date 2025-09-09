
'use client';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo";
import { useRouter } from 'next/navigation';
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { getUserProfile } from "@/ai/flows/client-actions";

const DEMO_USERS = [
    { email: 'app.ccs94@gmail.com', name: 'Comptable CCS', role: 'accountant', password: 'demodemo' },
    { email: 'secretaire@ccs.com', name: 'Secrétaire CCS', role: 'secretary', password: 'demodemo' },
    { email: 'vsw.contact@gmail.com', name: 'Victor Hugo', role: 'client', clientId: 'vsw-sas', password: 'demodemo', legalRepresentative: 'Victor Hugo' },
    { email: 'aventure.action@example.com', name: 'ACTION AVENTURE', role: 'client', clientId: 'client-01', password: 'demodemo', legalRepresentative: 'JEAN-MICHEL AVENTURIER' },
    { email: 'contact.autoecole@example.com', name: 'AUTO ECOLE DE LA MAIRIE', role: 'client', clientId: 'client-02', password: 'demodemo', legalRepresentative: 'MARIE CONDUITE' },

];


function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" {...props}>
      <title>Google</title>
      <path
        d="M17.64,9.2045a1,1,0,0,0-.0454-.2386,9,9,0,0,0-17.15,0,1,1,0,0,0,.0454.2386,8.7455,8.7455,0,0,0,17.15,0Z"
        fill="#4285f4"
      />
      <path
        d="M9,18a9,9,0,0,0,8.64-5.7955H.36A9,9,0,0,0,9,18Z"
        fill="#34a853"
      />
      <path
        d="M.36,9.2045A9,9,0,0,0,0,9a1,1,0,0,0,.0091.1182,8.8712,8.8712,0,0,0,.0545.4909H9V0A9,9,0,0,0,.36,9.2045Z"
        fill="#fbbc05"
      />
      <path
        d="M17.64,9.2045A9,9,0,0,0,18,9a1,1,0,0,0-.0091-.1182,8.8712,8.8712,0,0,0-.0545-.4909H9V18A9,9,0,0,0,17.64,9.2045Z"
        fill="#ea4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    localStorage.clear();
    window.dispatchEvent(new Event('storage'));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    localStorage.clear();

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = DEMO_USERS.find(u => u.email === email);

    if (!user || user.password !== password) {
        toast({
            variant: "destructive",
            title: "Erreur de connexion",
            description: "Email ou mot de passe incorrect.",
        });
        setIsLoading(false);
        return;
    }

    // If credentials are correct, set localStorage and redirect
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('userEmail', user.email);

    let targetPath: string;
    if (user.role === 'client') {
        if (!user.clientId) {
            toast({ variant: "destructive", title: "Erreur de configuration client", description: "Votre compte n'est associé à aucun dossier client." });
            setIsLoading(false); return;
        }
        localStorage.setItem('selectedClientId', user.clientId);
        localStorage.setItem('userName', user.legalRepresentative);
        targetPath = '/dashboard/my-documents';
    } else if (user.role === 'accountant' || user.role === 'admin') {
        targetPath = '/dashboard/accountant';
    } else if (user.role === 'secretary') {
        targetPath = '/dashboard/secretary';
    } else {
        toast({ variant: "destructive", title: "Rôle utilisateur inconnu", description: `Le rôle '${user.role}' n'est pas reconnu.` });
        setIsLoading(false); return;
    }
    
    window.dispatchEvent(new Event('storage'));
    router.push(targetPath);
  };
  
  const handleGoogleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      toast({
          title: "Fonctionnalité non disponible",
          description: "La connexion via Google sera bientôt disponible.",
      })
  }

  return (
    <div className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2">
      <div className="hidden bg-gray-100 lg:block relative">
        <Image
            src="https://picsum.photos/1202/1800"
            alt="Image"
            fill
            sizes="50vw"
            className="object-cover"
            data-ai-hint="professional accounting"
        />
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0" />
         <div className="relative h-full flex flex-col justify-between p-12 text-white">
            <Link href="/" className="flex items-center gap-2 font-semibold text-white">
                <Logo className="h-8 w-8" />
                <span className="text-xl">CCS Compta</span>
            </Link>
            <div className="text-left">
                <h1 className="text-4xl font-bold leading-tight">Gérez votre comptabilité en toute simplicité</h1>
                <p className="text-balance text-white/80 mt-4 text-lg">
                    Votre plateforme tout-en-un pour une collaboration comptable fluide et efficace.
                </p>
            </div>
             <p className="text-xs text-white/60">&copy; 2025 CCS, Consulting Conseil Services. Tous droits réservés.</p>
         </div>
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
             <div className="flex justify-center mb-4 lg:hidden">
                <Logo className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Connectez-vous</h1>
            <p className="text-balance text-muted-foreground">
              Utilisez les identifiants de votre compte CCS Compta.
            </p>
          </div>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Mot de passe</Label>
                <Link
                  href="#"
                  className="ml-auto inline-block text-sm underline"
                >
                  Mot de passe oublié?
                </Link>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <GoogleIcon className="mr-2 h-4 w-4" />}
              Se connecter avec Google
            </Button>
          </form>
           <p className="text-xs text-muted-foreground text-center">
              La connexion via Google ne fonctionne que si votre comptable vous a enregistré avec une adresse Gmail.
          </p>
        </div>
      </div>
    </div>
  )
}
