
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
import { signInWithEmailAndPassword, type User } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { ensureDemoUsers, getUserProfile } from "@/ai/flows/client-actions";


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
  const [isSeeding, setIsSeeding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    const initializeApp = async () => {
        setIsSeeding(true);
        localStorage.clear();
        window.dispatchEvent(new Event('storage'));
        try {
            await ensureDemoUsers();
        } catch (e) {
            console.error("Failed to seed demo users:", e);
        } finally {
            setIsSeeding(false);
        }
    }
    initializeApp();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    let user: User | null = null;
    
    // Clear previous session data to ensure a clean login
    localStorage.clear();
    window.dispatchEvent(new Event('storage'));

    try {
       const userCredential = await signInWithEmailAndPassword(auth, email, password);
       user = userCredential.user;
    } catch (error: any) {
        let errorMessage = "Une erreur inconnue est survenue.";
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                errorMessage = "Email ou mot de passe incorrect. Veuillez réessayer.";
                break;
            case 'auth/invalid-email':
                errorMessage = "L'adresse email n'est pas valide.";
                break;
            case 'auth/too-many-requests':
                errorMessage = "Compte temporairement bloqué en raison de trop nombreuses tentatives. Réessayez plus tard.";
                break;
        }
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: errorMessage,
      });
      setIsLoading(false);
      return;
    }

    if (!user) {
        setIsLoading(false);
        return;
    }

    try {
        const profile = await getUserProfile(user.uid);

        if (!profile || !profile.role) {
            toast({
                variant: "destructive",
                title: "Erreur de chargement du profil",
                description: "Votre profil utilisateur est introuvable ou mal configuré. Veuillez contacter le support.",
            });
            setIsLoading(false);
            return;
        }
        
        localStorage.setItem('userRole', profile.role);
        localStorage.setItem('userName', profile.name);
        localStorage.setItem('userEmail', profile.email);
        
        let targetPath: string;
        if (profile.role === 'client') {
            if (!profile.clientId) {
              toast({
                variant: "destructive",
                title: "Erreur de configuration du client",
                description: "Votre compte n'est lié à aucun dossier client. Veuillez contacter le support.",
              });
              setIsLoading(false);
              return;
            }
            localStorage.setItem('selectedClientId', profile.clientId);
            targetPath = '/dashboard/my-documents';
        } else if (profile.role === 'accountant' || profile.role === 'admin') {
            targetPath = '/dashboard/accountant';
        } else if (profile.role === 'secretary') {
            targetPath = '/dashboard/secretary';
        } else {
             toast({
                variant: "destructive",
                title: "Rôle utilisateur inconnu",
                description: `Le rôle '${profile.role}' n'est pas reconnu.`,
              });
              setIsLoading(false);
              return;
        }
        
        window.dispatchEvent(new Event('storage'));
        router.push(targetPath);

    } catch (error) {
        console.error("Failed to get user profile:", error);
        toast({
            variant: "destructive",
            title: "Erreur de chargement du profil",
            description: "La connexion a réussi mais le chargement de votre profil a échoué. Veuillez contacter le support.",
        });
        setIsLoading(false);
    }
  };
  
  const handleGoogleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      toast({
          title: "Fonctionnalité non disponible",
          description: "La connexion via Google sera bientôt disponible.",
      })
  }
  
  const isLoginDisabled = isLoading || isSeeding;

  return (
    <div className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2">
      <div className="hidden bg-gray-100 lg:block relative">
        <Image
            src="https://picsum.photos/1202/1800"
            alt="Image"
            fill
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
                disabled={isLoginDisabled}
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
                  disabled={isLoginDisabled}
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
            <Button type="submit" className="w-full" disabled={isLoginDisabled}>
              {isLoginDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              {isSeeding ? "Initialisation..." : "Se connecter"}
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoginDisabled}>
              {isLoginDisabled ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <GoogleIcon className="mr-2 h-4 w-4" />}
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
