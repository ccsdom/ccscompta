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
  Menu,
  LifeBuoy,
  Users,
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
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { QuickUpload } from "./quick-upload";
import type { Notification } from '@/lib/types';
import { intelligentSearch } from '@/services/intelligent-search-service';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { useRouter } from 'next/navigation';
import { cn, parseDate } from '@/lib/utils';
import { useBranding } from './branding-provider';
import { useAuth, db, errorEmitter, FirestorePermissionError, isFirebasePermissionDenied } from '@/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { auditService } from '@/services/audit-service';


export function Header({children}: {children?: React.ReactNode}) {
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  
  const { profile, cabinet, isLoading: isBrandingLoading } = useBranding();
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Impersonation state (still from localStorage for now to avoid breaking existing flows)
  const [impersonationState, setImpersonationState] = useState<{
      isImpersonating: boolean;
      originalName: string;
      targetName: string;
  }>({ isImpersonating: false, originalName: '', targetName: '' });
  
  useEffect(() => {
    setMounted(true);
    
    // 1. Real-time Notifications from Firestore
    if (profile?.id) {
        const q = query(
            collection(db, 'notifications'),
            where('clientId', '==', profile.id),
            orderBy('date', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            })) as Notification[];
            setNotifications(notifs);
            setHasUnread(notifs.some(n => !n.isRead));
        }, (error) => {
            console.warn('Could not load notifications', error);
            setNotifications([]);
            setHasUnread(false);

            if (isFirebasePermissionDenied(error)) {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    operation: 'list',
                    path: 'notifications',
                }));
            }
        });

        const loadImpersonation = () => {
            const originalRole = localStorage.getItem('originalUserRole');
            if (originalRole) {
                setImpersonationState({
                    isImpersonating: true,
                    originalName: localStorage.getItem('originalUserName') || '',
                    targetName: profile?.name || 'Client',
                });
            } else {
                setImpersonationState({ isImpersonating: false, originalName: '', targetName: '' });
            }
        };

        loadImpersonation();
        window.addEventListener('storage', loadImpersonation);
        
        return () => {
            unsubscribe();
            window.removeEventListener('storage', loadImpersonation);
        }
    }
  }, [profile]);

  const handleMarkAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;

    for (const notif of unread) {
        await updateDoc(doc(db, 'notifications', notif.id), { isRead: true });
    }
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
  
  const handleLogout = async () => {
    await auth.signOut();
    localStorage.clear();
    router.push('/connexion');
  };

  const handleStopImpersonating = () => {
      const originalRole = localStorage.getItem('originalUserRole');
      const originalName = localStorage.getItem('originalUserName');
      const originalEmail = localStorage.getItem('originalUserEmail');

      localStorage.setItem('userName', originalName || 'Super Admin');
      localStorage.setItem('userEmail', originalEmail || '');

      localStorage.removeItem('originalUserRole');
      localStorage.removeItem('originalUserName');
      localStorage.removeItem('originalUserEmail');
      localStorage.removeItem('impersonatedRole');
      localStorage.removeItem('selectedClientId');
      localStorage.removeItem('selectedCabinetId');

      toast({
          title: "Session d'impersonation terminée",
          description: `Vous avez repris votre session en tant que ${originalName || 'Administrateur'}.`,
      });
      
      // Log the end of impersonation
      if (originalName && originalEmail && profile) {
          auditService.logImpersonation('stop', 
              { name: originalName, email: originalEmail, role: originalRole || 'admin' },
              { name: profile.name, id: profile.id, type: 'cabinet' }
          );
      }
      
      window.dispatchEvent(new Event('storage'));

      // Redirection dynamique vers le bon tableau de bord
      if (originalRole === 'admin') {
          router.push('/dashboard/admin');
      } else if (originalRole === 'accountant') {
          router.push('/dashboard/accountant');
      } else {
          router.push('/dashboard');
      }
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
    if (!message) return <FileWarning className="h-8 w-8 text-red-500" />;
    const msg = message.toLowerCase();
    if (msg.includes('approuvé') || msg.includes('envoyé')) {
      return <CheckCircle className="h-8 w-8 text-green-500" />;
    }
    if (msg.includes('examen')) {
      return <FileWarning className="h-8 w-8 text-yellow-500" />;
    }
    return <FileWarning className="h-8 w-8 text-red-500" />;
  }

  const ImpersonationBanner = () => (
     <div className="fixed top-16 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-amber-950 px-4 py-2 flex items-center justify-center text-sm font-bold shadow-lg border-b border-amber-400/50 animate-in slide-in-from-top duration-300">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <AlertTriangle className="h-4 w-4 text-amber-950 animate-bounce" />
          <span>Mode Consultation • Vous naviguez en tant que <span className="underline font-black">{impersonationState.targetName}</span>.</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-amber-950 hover:bg-amber-950/15 hover:text-black font-black uppercase text-[10px] tracking-widest px-2.5 py-1 h-auto rounded-lg border border-amber-950/20 bg-amber-950/5 ml-2 transition-all duration-300"
            onClick={handleStopImpersonating}
          >
            Quitter l'espace
          </Button>
        </div>
     </div>
  );


  if (!mounted || isBrandingLoading) {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
            <div className="container flex h-20 max-w-full items-center justify-between px-4 md:px-6 gap-4">
                <Skeleton className="h-10 md:w-2/3 lg:w-1/2 opacity-50" />
                <div className="flex items-center space-x-2 md:space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full opacity-50" />
                    <Skeleton className="h-10 w-10 rounded-full opacity-50" />
                </div>
            </div>
        </header>
    )
  }

  return (
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
          {impersonationState.isImpersonating && <ImpersonationBanner />}
          <div className={cn("container flex h-20 max-w-full items-center justify-between px-4 md:px-6 gap-4", impersonationState.isImpersonating && "pt-10")}>
            {children}
            
            <div className="flex-1">
               <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Rechercher..."
                      className="w-full appearance-none bg-background pl-8 pr-16 shadow-none md:max-w-sm lg:max-w-md focus-visible:ring-0"
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
                {profile?.role === 'client' && <QuickUpload />}

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
                                            {formatDistanceToNow(parseDate(notif.date) || new Date(), { addSuffix: true, locale: fr })}
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

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="relative rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.email || 'default'}`} alt="Utilisateur" />
                                <AvatarFallback>{(profile?.name?.charAt(0) || 'U').toUpperCase()}</AvatarFallback>
                            </Avatar>
                         </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className="font-normal">
                                 <div className="flex flex-col space-y-1">
                                    {impersonationState.isImpersonating && (
                                      <div className="text-xs text-muted-foreground">Connecté en tant que:</div>
                                    )}
                                    <p className="text-sm font-medium leading-none">{impersonationState.isImpersonating ? impersonationState.originalName : profile?.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                    {profile?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        {impersonationState.isImpersonating && (
                           <>
                            <DropdownMenuItem onClick={handleStopImpersonating} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                              <LogOutIcon className="mr-2 h-4 w-4" />
                              Quitter le mode client
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                           </>
                        )}
                        <DropdownMenuItem asChild>
                             <Link href={"/dashboard/settings"}>
                                  <User className="mr-2 h-4 w-4" /> Profil
                             </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                             <Link
                                 href={(profile?.role === 'accountant' || profile?.role === 'admin') ? "/dashboard/billing" : "/dashboard/my-invoices"}>
                                <CreditCard className="mr-2 h-4 w-4" /> Facturation
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={"/dashboard/settings"}>
                                <Settings className="mr-2 h-4 w-4" /> Paramètres
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/support">
                                <LifeBuoy className="mr-2 h-4 w-4" /> Aide & Support
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
