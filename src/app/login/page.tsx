
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
import { Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { getClientById, addClient } from '@/ai/flows/client-actions';
import { auth } from '@/lib/firebase-client';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    const clearState = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            // Ignore errors if user was already signed out
        } finally {
            localStorage.clear();
            window.dispatchEvent(new Event('storage'));
        }
    };
    clearState();
  }, []);

  const performLogin = async () => {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Force refresh the token to get the latest custom claims.
      const idTokenResult = await firebaseUser.getIdTokenResult(true);
      const userRole = (idTokenResult.claims.role || 'client') as 'client' | 'accountant' | 'admin' | 'secretary';
      
      const userProfile = await getClientById(firebaseUser.uid);

      if (!userProfile) {
          throw new Error(`Votre compte est valide mais aucun profil ne lui est associé. Veuillez contacter le cabinet.`);
      }
      
      const displayName = userProfile?.name || firebaseUser.displayName || email.split('@')[0];

      // --- Store user info in localStorage ---
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('userName', displayName);
      localStorage.setItem('userEmail', email);
      
      if (userRole === 'client' && userProfile) {
          localStorage.setItem('selectedClientId', userProfile.id);
      } else {
          localStorage.removeItem('selectedClientId');
      }
      
      // --- Redirect based on role ---
      let targetPath: string;
      switch (userRole) {
          case 'admin': targetPath = '/dashboard/admin'; break;
          case 'accountant': targetPath = '/dashboard/accountant'; break;
          case 'secretary': targetPath = '/dashboard/secretary'; break;
          case 'client': targetPath = '/dashboard/my-documents'; break;
          default: targetPath = '/dashboard';
      }
      
      window.dispatchEvent(new Event('storage'));
      router.push(targetPath);
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        await performLogin();
    } catch (error: any) {
        // If login fails because user not found AND password is 'password', try creating an admin account
        if (error.code === 'auth/invalid-credential' && password === 'password') {
            try {
                console.log(`Attempting to create admin user for: ${email}`);
                const result = await addClient({
                    email: email,
                    name: email.split('@')[0],
                    role: 'admin',
                });

                if (result.success) {
                    toast({
                        title: "Compte Administrateur créé",
                        description: "Votre compte a été créé. Tentative de connexion automatique...",
                    });
                    // Now try to log in again with the newly created account
                    await performLogin();
                } else {
                    throw new Error(result.error); // Throw the error from addClient
                }

            } catch (creationError: any) {
                console.error("Admin Creation Error:", creationError);
                toast({ variant: "destructive", title: "Erreur de création de compte", description: creationError.message });
            }
        } else {
            console.error("Login Error:", error);
            let description = "L'adresse email ou le mot de passe est incorrect.";
            if (error.code === 'auth/too-many-requests') {
                description = "Compte temporairement bloqué. Réessayez plus tard.";
            }
            toast({ variant: "destructive", title: "Erreur de connexion", description });
        }
    } finally {
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
            src="https://picsum.photos/seed/login/1200/1800"
            alt="Image de fond représentant un espace de travail de comptabilité"
            fill
            sizes="50vw"
            className="object-cover"
            priority
            data-ai-hint="professional accounting"
        />
         <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-primary/20" />
         <div className="relative h-full flex flex-col justify-between p-12 text-white">
            <Link href="/" className="flex items-center gap-2 font-semibold text-white z-10">
                <Logo className="h-8 w-8" />
                <span className="text-xl">CCS Compta</span>
            </Link>
            <div className="text-left z-10">
                <h1 className="text-5xl font-bold leading-tight tracking-tight">La comptabilité, réinventée.</h1>
                <p className="text-balance text-white/80 mt-4 text-lg max-w-md">
                    Votre plateforme tout-en-un pour une collaboration comptable fluide et efficace.
                </p>
            </div>
             <p className="text-xs text-white/60 z-10">&copy; {new Date().getFullYear()} CCS Compta. Tous droits réservés.</p>
         </div>
      </div>
      <div className="flex items-center justify-center py-12 px-4">
        <div className="mx-auto grid w-full max-w-[400px] gap-8">
          <div className="grid gap-2 text-center">
             <div className="flex justify-center mb-4 lg:hidden">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Logo className="h-8 w-8 text-primary" />
                    <span className="text-xl">CCS Compta</span>
                </Link>
            </div>
            <h1 className="text-3xl font-bold">Bienvenue</h1>
            <p className="text-balance text-muted-foreground">
              Connectez-vous à votre espace pour commencer.
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    id="email"
                    type="email"
                    placeholder="nom@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-10"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Mot de passe</Label>
                <Link
                  href="#"
                  className="ml-auto inline-block text-sm text-primary hover:underline"
                >
                  Mot de passe oublié?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  disabled={isLoading}
                  className="pl-10 pr-10"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
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
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Ou continuer avec
                    </span>
                </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" className="mr-2 h-4 w-4"><title>Google</title><path d="M17.64,9.2045a1,1,0,0,0-.0454-.2386,9,9,0,0,0-17.15,0,1,1,0,0,0,.0454.2386,8.7455,8.7455,0,0,0,17.15,0Z" fill="#4285f4"/><path d="M9,18a9,9,0,0,0,8.64-5.7955H.36A9,9,0,0,0,9,18Z" fill="#34a853"/><path d="M.36,9.2045A9,9,0,0,0,0,9a1,1,0,0,0,.0091.1182,8.8712,8.8712,0,0,0,.0545.4909H9V0A9,9,0,0,0,.36,9.2045Z" fill="#fbbc05"/><path d="M17.64,9.2045A9,9,0,0,0,18,9a1,1,0,0,0-.0091-.1182,8.8712,8.8712,0,0,0-.0545-.4909H9V18A9,9,0,0,0,17.64,9.2045Z" fill="#ea4335"/></svg>}
              Google
            </Button>
          </form>
           <Alert className="mt-4">
              <AlertTitle className="font-semibold">Comptes de démo</AlertTitle>
              <AlertDescription className="text-xs space-y-1">
                <p><strong>Admin:</strong> `admin@ccs.com` (mdp: `password`)</p>
                <p><strong>Comptable:</strong> `comptable@ccs.com` (mdp: `password`)</p>
                 <p><strong>Secrétaire:</strong> `secretary@ccs.com` (mdp: `password`)</p>
                <p><strong>Client:</strong> `aventure.action@example.com` (mdp: `84042838300010`)</p>
              </AlertDescription>
            </Alert>
            <p className="mt-8 text-center text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} CCS Compta. Tous droits réservés.
            </p>
        </div>
      </div>
    </div>
  )
}
