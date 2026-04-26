
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
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import type { IdTokenResult } from 'firebase/auth';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    // Start with a clean slate on login page load
    const clearState = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            // Ignore errors if user was already signed out
        } finally {
            localStorage.clear();
            document.cookie = 'userRole=; path=/; max-age=0; SameSite=Lax';
            window.dispatchEvent(new Event('storage'));
        }
    };
    clearState();
  }, [auth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        const user = userCredential.user;

        // Force refresh of the token to get custom claims RIGHT after login
        const idTokenResult: IdTokenResult = await user.getIdTokenResult(true);
        const userRoleValue = idTokenResult.claims.role;
        const userRole = typeof userRoleValue === 'string' ? userRoleValue : 'client';
        const displayName = user.displayName || user.email!.split('@')[0];

        localStorage.setItem('userRole', userRole);
        localStorage.setItem('userName', displayName);
        localStorage.setItem('userEmail', user.email!);
        document.cookie = `userRole=${userRole}; path=/; max-age=86400; SameSite=Lax; Secure`;
        
        if (userRole === 'client') {
            localStorage.setItem('selectedClientId', user.uid);
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

    } catch (error: any) {
        console.group("Auth Diagnostic");
        console.error("Login Error Code:", error.code);
        console.error("Login Error Message:", error.message);
        if (error.customData) console.error("Custom Data:", error.customData);
        console.groupEnd();

        let description = "Une erreur inconnue est survenue. Veuillez vérifier votre connexion.";
        if (error.code === 'auth/too-many-requests') {
            description = "Compte temporairement bloqué en raison de trop nombreuses tentatives. Réessayez plus tard.";
        } else if (error.code === 'auth/invalid-credential') {
             description = "L'adresse email ou le mot de passe que vous avez entré est incorrect. Si vous avez oublié votre mot de passe, contactez l'administrateur.";
        }
        toast({ variant: "destructive", title: "Erreur de connexion", description });
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10 z-0" />
      <div className="absolute -top-[400px] -right-[400px] w-[800px] h-[800px] rounded-full bg-primary/10 blur-[120px] z-0 pointer-events-none fade-in" />
      <div className="absolute -bottom-[400px] -left-[400px] w-[800px] h-[800px] rounded-full bg-primary/5 blur-[120px] z-0 pointer-events-none fade-in" />

      <div className="relative z-10 w-full max-w-md px-4 mt-[-5vh]">
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 font-semibold group mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 premium-shadow">
               <Logo className="h-8 w-8" />
            </div>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display mb-3 text-center text-foreground">
            Bienvenue sur <span className="gradient-text">CCS Compta</span>
          </h1>
          <p className="text-muted-foreground text-center text-lg">
            Connectez-vous à votre espace.
          </p>
        </div>

        {/* Login Card */}
        <Card className="glass-panel border-border/50 premium-shadow overflow-hidden">
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/80 font-medium">Adresse email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nom@cabinet.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-11 h-12 bg-background/50 transition-colors text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground/80 font-medium">Mot de passe</Label>
                  <Link
                    href="#"
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    disabled={isLoading}
                    className="pl-11 pr-11 h-12 bg-background/50 transition-colors text-base"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-lg shadow-lg font-medium transition-all hover:-translate-y-0.5" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin"/>}
                {isLoading ? "Connexion en cours..." : "Se connecter"}
              </Button>
            </form>

            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-4 text-muted-foreground font-medium flex items-center gap-2">
                  <span className="opacity-70">Ou continuer avec</span>
                </span>
              </div>
            </div>

            <Button 
                variant="outline" 
                className="w-full mt-6 h-12 text-base font-medium bg-background/50 hover:bg-background transition-colors" 
                onClick={handleGoogleLogin} 
                disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-3 h-5 w-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path fill="none" d="M1 1h22v22H1z"/></svg>
              )}
              Google
            </Button>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-sm text-muted-foreground/60">
          &copy; {new Date().getFullYear()} CCS Compta. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
