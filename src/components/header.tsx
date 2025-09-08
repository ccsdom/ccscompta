
'use client';
import { useState, useEffect } from 'react';
import Link from "next/link"
import {
  Bell,
  Search,
  LogOut,
  User,
  CreditCard,
  Settings,
  CheckCircle,
  FileWarning,
  Wand2,
  Loader2,
  PlusCircle,
  LogIn,
  LogOut as LogOutIcon,
  AlertTriangle,
} from "lucide-react"
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

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
import { QuickUpload } from "./quick-upload";
import type { Notification } from '@/lib/types';
import { intelligentSearch } from '@/ai/flows/intelligent-search-flow';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [userName, setUserName] = useState("Utilisateur");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("client");
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUserName, setImpersonatedUserName] = useState('');

  const { toast } = useToast();
  const router = useRouter();
  
  useEffect(() => {
    // This effect runs only on the client side
    setMounted(true);
    
    const loadStateFromLocalStorage = () => {
        try {
          const storedNotifications = localStorage.getItem('notifications');
          if (storedNotifications) {
            const parsed = JSON.parse(storedNotifications) as Notification[];
            setNotifications(parsed);
            setHasUnread(parsed.some(n => !n.isRead));
          }

          const storedQuery = localStorage.getItem('searchQuery');
          const storedCriteria = localStorage.getItem('searchCriteria');
          if (storedCriteria) {
            setSearchQuery(JSON.parse(storedCriteria).originalQuery);
          } else if (storedQuery) {
            setSearchQuery(storedQuery);
          }
          
          setUserName(localStorage.getItem('userName') || "Utilisateur");
          setUserEmail(localStorage.getItem('userEmail') || "");
          setUserRole(localStorage.getItem('userRole') || "client");
          
          const originalRole = localStorage.getItem('originalUserRole');
          if (originalRole) {
              setIsImpersonating(true);
              setImpersonatedUserName(localStorage.getItem('userName') || '');
          } else {
              setIsImpersonating(false);
              setImpersonatedUserName('');
          }

        } catch (e) {
          console.error("Failed to load state from localStorage", e);
        }
    };
    
    loadStateFromLocalStorage();

    const handleStorageChange = () => {
        loadStateFromLocalStorage();
    }
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleMarkAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    setNotifications(updatedNotifications);
    setHasUnread(false);
  }
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query) {
        localStorage.removeItem('searchQuery');
        localStorage.removeItem('searchCriteria');
        window.dispatchEvent(new Event('storage'));
    }
  }

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
        localStorage.setItem('searchQuery', searchQuery);
        localStorage.removeItem('searchCriteria');
        window.dispatchEvent(new Event('storage'));
    }
  }
  
  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const handleStopImpersonating = () => {
      const originalRole = localStorage.getItem('originalUserRole');
      const originalName = localStorage.getItem('originalUserName');
      const originalEmail = localStorage.getItem('originalUserEmail');

      localStorage.setItem('userRole', originalRole || 'admin');
      localStorage.setItem('userName', originalName || 'Super Admin');
      localStorage.setItem('userEmail', originalEmail || '');

      localStorage.removeItem('originalUserRole');
      localStorage.removeItem('originalUserName');
      localStorage.removeItem('originalUserEmail');
      localStorage.removeItem('selectedClientId');

      toast({
          title: "Vue Client terminée",
          description: "Vous êtes retourné à votre compte.",
      });
      
      window.dispatchEvent(new Event('storage'));
      router.push('/dashboard/clients');
  }

  const handleAiSearch = async () => {
    if (!searchQuery.trim()) {
        toast({ title: 'Veuillez entrer un terme de recherche.', variant: 'destructive' });
        return;
    }
    setIsAiSearching(true);
    try {
        const criteria = await intelligentSearch({
            query: searchQuery,
            currentDate: new Date().toISOString()
        });
        localStorage.setItem('searchCriteria', JSON.stringify(criteria));
        localStorage.removeItem('searchQuery');
        window.dispatchEvent(new Event('storage'));
        toast({
          title: 'Recherche intelligente terminée',
          description: 'Les résultats ont été filtrés selon vos critères.',
        });
    } catch (error) {
        console.error("AI Search failed", error);
        toast({ title: 'La recherche intelligente a échoué.', description: 'Veuillez réessayer.', variant: 'destructive' });
    } finally {
        setIsAiSearching(false);
    }
  }

  const getIconForStatus = (message: string) => {
    if (message.includes('approuvé') || message.includes('envoyé')) {
      return <CheckCircle className="h-8 w-8 text-green-500" />;
    }
    if (message.includes('examen')) {
      return <FileWarning className="h-8 w-8 text-yellow-500" />;
    }
    return <FileWarning className="h-8 w-8 text-red-500" />;
  }

  const ImpersonationBanner = () => (
     <div className="absolute top-0 left-0 right-0 z-50 bg-yellow-400 text-yellow-900 px-4 py-2 flex items-center justify-center text-sm font-medium shadow-lg">
        <AlertTriangle className="h-4 w-4 mr-2"/>
        Vous naviguez en tant que <span className="font-bold mx-1">{impersonatedUserName}</span>.
        <Button variant="link" size="sm" className="text-yellow-900 hover:text-black font-bold h-auto p-0 ml-2" onClick={handleStopImpersonating}>
            Revenir à mon compte
        </Button>
     </div>
  );

  if (!mounted) {
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 max-w-full items-center justify-between px-4 md:px-6 gap-4">
                <Skeleton className="h-10 md:w-2/3 lg:w-1/2" />
                <div className="flex items-center space-x-1 md:space-x-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>
            </div>
        </header>
    )
  }

  return (
    <header className={cn("sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", isImpersonating ? 'pt-[40px]': '')}>
      {isImpersonating && <ImpersonationBanner />}
      <div className="container flex h-16 max-w-full items-center justify-between px-4 md:px-6 gap-4">
        
        <div className="flex-1">
           <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher ou utiliser la recherche intelligente..."
                  className="w-full appearance-none bg-background pl-8 pr-16 shadow-none md:w-2/3 lg:w-1/2 focus-visible:ring-0"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                <Button 
                    type="button" 
                    size="icon" 
                    variant="ghost" 
                    className="absolute right-1.5 top-[5px]"
                    onClick={handleAiSearch}
                    disabled={isAiSearching}
                >
                    {isAiSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    <span className="sr-only">Recherche Intelligente</span>
                </Button>
              </div>
            </form>
        </div>
        
        <div className="flex items-center space-x-1 md:space-x-2">
            {userRole === 'client' && <QuickUpload />}

             <DropdownMenu onOpenChange={(open) => { if (!open) handleMarkAsRead() }}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {hasUnread && <Badge className="absolute top-1 right-1 h-2 w-2 p-0 justify-center" />}
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[380px]">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                 <DropdownMenuSeparator />
                 {notifications.length > 0 ? (
                    notifications.slice(0, 4).map(notif => (
                        <DropdownMenuItem key={notif.id} className="flex gap-3 items-start p-3 cursor-pointer">
                            {getIconForStatus(notif.message)}
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-tight">
                                    <span className="font-bold">{notif.documentName}</span> {notif.message}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(notif.date), { addSuffix: true, locale: fr })}
                                </p>
                            </div>
                        </DropdownMenuItem>
                    ))
                 ) : (
                    <p className="p-4 text-sm text-center text-muted-foreground">Aucune nouvelle notification</p>
                 )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="justify-center text-sm text-primary hover:!text-primary py-2 cursor-pointer">
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
                            <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                     </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{userName}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                            {userEmail}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                         <Link href={userRole === 'accountant' ? "/dashboard/settings" : "/dashboard/my-settings"}>
                            <User className="mr-2 h-4 w-4" /> Profil
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                         <Link href="/dashboard/billing">
                            <CreditCard className="mr-2 h-4 w-4" /> Facturation
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={userRole === 'accountant' ? "/dashboard/settings" : "/dashboard/my-settings"}>
                            <Settings className="mr-2 h-4 w-4" /> Paramètres
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                         <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
