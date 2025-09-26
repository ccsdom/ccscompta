
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
import { Loader2, Eye, EyeOff, Mail, Lock, AlertTriangle } from "lucide-react";
import { getClientById, addClient } from '@/ai/flows/client-actions';
import { auth } from '@/lib/firebase-client';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, type User } from 'firebase/auth';
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

  const performLogin = async (firebaseUser: User) => {
      let userProfile = await getClientById(firebaseUser.uid);
      
      if (!userProfile) {
          console.log(`User ${firebaseUser.uid} authenticated but has no profile. Creating one.`);
          
          const role = password === 'password' ? 'admin' : 'client';
          
          const profileResult = await addClient({
            uid: firebaseUser.uid,
            email: email,
            name: email.split('@')[0],
            role: role,
          });

          if (!profileResult.success) {
            throw new Error(`Votre compte est valide, mais la création de votre profil a échoué: ${profileResult.error}`);
          }
          userProfile = profileResult.data;
          toast({
            title: "Profil créé",
            description: "Votre profil a été initialisé. Connexion en cours...",
          });
      }
      
      const userRole = userProfile.role;
      const displayName = userProfile.name || firebaseUser.displayName || email.split('@')[0];

      localStorage.setItem('userRole', userRole);
      localStorage.setItem('userName', displayName);
      localStorage.setItem('userEmail', email);
      
      if (userRole === 'client' && userProfile) {
          localStorage.setItem('selectedClientId', userProfile.id);
      } else {
          localStorage.removeItem('selectedClientId');
      }
      
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
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await performLogin(userCredential.user);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            console.log("User not found, attempting to create account...");
            try {
                const newUserCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log('Account created for:', newUserCredential.user.email);
                await performLogin(newUserCredential.user);
            } catch (creationError: any) {
                 console.error("Account Creation Error:", creationError);
                 toast({ variant: "destructive", title: "Erreur de création de compte", description: creationError.message });
            }
        } else {
            console.error("Login Error:", error);
            let description = "Une erreur inconnue est survenue.";
            if (error.code === 'auth/too-many-requests') {
                description = "Compte temporairement bloqué. Réessayez plus tard.";
            } else if (error.message) {
                description = error.message;
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

           <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-semibold">Action requise pour le premier administrateur</AlertTitle>
                <AlertDescription className="text-xs space-y-2">
                    <p>Si vous n'arrivez pas à vous connecter, appliquez les règles de sécurité :</p>
                    <ol className="list-decimal list-inside pl-2">
                        <li>Allez dans <strong className="font-semibold">Paramètres &gt; Sécurité des Données</strong>.</li>
                        <li>Générez et copiez les règles Firestore.</li>
                        <li>Collez-les dans votre <strong className="font-semibold">console Firebase &gt; Firestore &gt; Règles</strong>.</li>
                    </ol>
                    <p>Ensuite, connectez-vous avec le mot de passe <strong className="font-semibold">`password`</strong> pour créer votre compte admin.</p>
                </AlertDescription>
            </Alert>
          
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
            <p className="mt-8 text-center text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} CCS Compta. Tous droits réservés.
            </p>
        </div>
      </div>
    </div>
  )
}

    