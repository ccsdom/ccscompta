
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard/accountant');
  }
  
  const handleGoogleLogin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
     // In a real app, this would trigger the Firebase Google Auth flow
    router.push('/dashboard');
  }

  return (
    <div className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2">
      <div className="hidden bg-gray-100 lg:block relative">
        <Image
            src="https://picsum.photos/1201/1800"
            alt="Image"
            fill
            className="object-cover"
            data-ai-hint="professional accounting"
        />
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0" />
         <div className="relative h-full flex flex-col justify-between p-12 text-white">
            <Link href="/" className="flex items-center gap-2 font-semibold text-white">
                <Logo className="h-6 w-6" />
                <span>CCS Compta</span>
            </Link>
            <div className="text-left">
                <h1 className="text-4xl font-bold leading-tight">Gérez votre comptabilité en toute simplicité</h1>
                <p className="text-balance text-white/80 mt-4 text-lg">
                    Votre plateforme tout-en-un pour une collaboration comptable fluide et efficace.
                </p>
            </div>
             <p className="text-xs text-white/60">&copy; 2024 CCS Compta. Tous droits réservés.</p>
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
              Utilisez l'adresse email enregistrée par votre comptable.
            </p>
          </div>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                defaultValue="demo@ccs-compta.com"
                required
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
              <Input id="password" type="password" defaultValue="demodemo" required />
            </div>
            <Button type="submit" className="w-full">
              Se connecter
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
              <GoogleIcon className="mr-2 h-4 w-4" />
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
