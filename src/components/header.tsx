'use client';

import Link from "next/link"
import {
  Bell,
  Search,
  PlusCircle,
  LogOut,
  User,
  CreditCard,
  Settings
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from "@/hooks/use-toast"

export function Header() {
  const { toast } = useToast();

  const handleQuickUpload = () => {
    toast({
        title: "Fonctionnalité à venir",
        description: "Le téléversement rapide sera bientôt disponible.",
    });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-full items-center justify-between px-4 md:px-6 gap-4">
        
        <div className="flex-1">
           <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher des documents..."
                  className="w-full appearance-none bg-transparent pl-8 shadow-none md:w-2/3 lg:w-1/3 focus-visible:ring-0 focus-visible:ring-offset-0 border-0 border-b rounded-none focus-visible:border-primary"
                />
              </div>
            </form>
        </div>
        
        <div className="flex items-center space-x-1 md:space-x-2">
            <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={handleQuickUpload}>
                <PlusCircle className="h-5 w-5" />
                <span className="sr-only">Ajout Rapide</span>
            </Button>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                   <Badge className="absolute top-1 right-1 h-2 w-2 p-0 justify-center" />
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[350px]">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                 <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex gap-3 items-start p-3">
                        <Avatar className="h-8 w-8 mt-1">
                            <AvatarImage src="https://picsum.photos/100?a=1" data-ai-hint="company logo" alt="Logo" />
                            <AvatarFallback>A</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-tight">Traitement terminé</p>
                            <p className="text-xs text-muted-foreground">
                                Votre facture "facture-apple.pdf" a été traitée avec succès.
                            </p>
                        </div>
                    </DropdownMenuItem>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem className="flex gap-3 items-start p-3">
                         <Avatar className="h-8 w-8 mt-1">
                            <AvatarImage src="https://picsum.photos/100?b=2" data-ai-hint="company logo" alt="Logo" />
                            <AvatarFallback>G</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-tight">Examen requis</p>
                            <p className="text-xs text-muted-foreground">
                                Le document "reçu-hotel.pdf" nécessite votre validation.
                            </p>
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="justify-center text-sm text-primary hover:!text-primary py-2">
                        Voir toutes les notifications
                    </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ThemeToggle />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="icon" className="relative rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src="https://picsum.photos/100" data-ai-hint="person face" alt="Utilisateur" />
                            <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                     </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">Utilisateur Démo</p>
                            <p className="text-xs leading-none text-muted-foreground">
                            demo@ccs-compta.com
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                         <Link href="/dashboard/settings">
                            <User /> Profil
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <CreditCard /> Facturation
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/dashboard/settings">
                            <Settings /> Paramètres
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                         <Link href="/login">
                            <LogOut /> Déconnexion
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
