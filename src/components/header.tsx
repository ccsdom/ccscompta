'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from "next/link"
import {
  Bell,
  Search,
  LogOut,
  User,
  CreditCard,
  Settings,
  CheckCircle,
  FileWarning
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
import type { Notification } from '@/app/dashboard/documents/page';

export function Header() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState("Utilisateur Démo");
  const [userEmail, setUserEmail] = useState("demo@ccs-compta.com");

  const loadNotifications = useCallback(() => {
    try {
      const storedNotifications = localStorage.getItem('notifications');
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications) as Notification[];
        setNotifications(parsed);
        setHasUnread(parsed.some(n => !n.isRead));
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  }, []);

  const loadUserData = useCallback(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) setUserName(storedName);

    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) setUserEmail(storedEmail);
  }, []);

  const loadSearchQuery = useCallback(() => {
    const storedQuery = localStorage.getItem('searchQuery');
    if (storedQuery) {
        setSearchQuery(storedQuery);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    loadSearchQuery();
    loadUserData();
    
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'notifications') {
            loadNotifications();
        }
        if (e.key === 'searchQuery') {
            loadSearchQuery();
        }
        if (e.key === 'userName' || e.key === 'userEmail') {
            loadUserData();
        }
    }
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadNotifications, loadSearchQuery, loadUserData]);

  const handleMarkAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    setNotifications(updatedNotifications);
    setHasUnread(false);
  }
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    localStorage.setItem('searchQuery', query);
    window.dispatchEvent(new StorageEvent('storage', { key: 'searchQuery', newValue: query }));
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

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-full items-center justify-between px-4 md:px-6 gap-4">
        
        <div className="flex-1">
           <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher par nom, fournisseur..."
                  className="w-full appearance-none bg-transparent pl-8 shadow-none md:w-2/3 lg:w-1/3 focus-visible:ring-0 focus-visible:ring-offset-0 border-0 border-b rounded-none focus-visible:border-primary"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </form>
        </div>
        
        <div className="flex items-center space-x-1 md:space-x-2">
            <QuickUpload />

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
