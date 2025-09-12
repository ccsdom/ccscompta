
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
import { getClients } from "@/ai/flows/client-actions";
import { auth } from '@/lib/firebase-client';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

const DEMO_USERS = {
  "secretaire@ccs.com": {
    role: "secretary",
    name: "Secrétaire Admin",
  },
   "comptable@ccs.com": {
    role: "accountant",
    name: "Alain Comptable",
  },
  "admin@ccs.com": {
    role: "admin",
    name: "Super Admin",
  },
};


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
    // Clear any previous session state when loading the login page
    localStorage.clear();
    signOut(auth).catch(() => {}); // Sign out any lingering session from Firebase
    window.dispatchEvent(new Event('storage'));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        let userRole: string | null = null;
        let userName: string | null = null;
        let userClientId: string | null = null;
        
        // Check if the user is a predefined admin/secretary/accountant
        const demoUserEmailKey = email.toLowerCase() as keyof typeof DEMO_USERS;
        const demoUser = DEMO_USERS[demoUserEmailKey];

        if (demoUser) {
            userRole = demoUser.role;
            userName = demoUser.name;
        } else {
            // If not a predefined user, check if they are a client in Firestore
            const allClients = await getClients();
            const clientUser = allClients.find(c => c.email.toLowerCase() === email.toLowerCase());
            
            if (clientUser) {
                userRole = "client";
                userName = clientUser.legalRepresentative;
                userClientId = clientUser.id;
            } else {
                // If the user exists in Firebase Auth but not in our predefined list or clients DB,
                // we can't assign a role.
                throw new Error("Profil utilisateur introuvable dans l'application.");
            }
        }
        
        if (userRole && userName) {
            localStorage.setItem('userRole', userRole);
            localStorage.setItem('userName', userName);
            localStorage.setItem('userEmail', email);

            let targetPath: string;
            if (userRole === 'client') {
                if (!userClientId) throw new Error("Compte client non associé à un dossier.");
                localStorage.setItem('selectedClientId', userClientId);
                targetPath = '/dashboard/my-documents';
            } else if (userRole === 'accountant') {
                targetPath = '/dashboard/accountant';
            } else if (userRole === 'admin') {
                targetPath = '/dashboard/admin';
            } else if (userRole === 'secretary') {
                targetPath = '/dashboard/secretary';
            } else {
                throw new Error(`Rôle utilisateur inconnu: ${userRole}`);
            }
            
            window.dispatchEvent(new Event('storage'));
            router.push(targetPath);
        } else {
            throw new Error("Profil utilisateur introuvable dans l'application.");
        }
    } catch (error: any) {
        console.error("Firebase Auth Error:", error);
        let title = "Erreur de connexion";
        let description = "Une erreur inattendue est survenue. Veuillez réessayer.";

        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
             description = "L'adresse email ou le mot de passe est incorrect. Veuillez réessayer.";
        } else if (error.message.includes('Profil utilisateur introuvable')) {
            description = "Votre compte existe mais n'a pas de profil correspondant dans l'application. Veuillez contacter le support.";
        }

        toast({ variant: "destructive", title, description });
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
              Entrez vos identifiants pour accéder à votre espace.
            </p>
          </div>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nom@exemple.com"
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
             Contactez votre comptable si vous n'avez pas encore de compte.
          </p>
        </div>
      </div>
    </div>
  )
}

    