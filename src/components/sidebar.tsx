'use client';
// Force HMR re-render

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Settings, FileText, Users, BarChart, CreditCard, LifeBuoy, ScanLine, CalendarDays, Moon, Sun, Building, DownloadCloud, Landmark, Activity, Clock as HistoryIcon, TrendingUp, Wifi, BookOpen, MessageSquareText, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useEffect, useState } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { useTheme } from 'next-themes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useDoc, useMemoFirebase } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import type { Client } from '@/lib/types';
import { useBranding } from '@/components/branding-provider';


type NavItem = {
    href: string;
    icon: React.ElementType;
    label: string;
};

const accountantNavItems: NavItem[] = [
  { href: '/dashboard/accountant', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/dashboard/clients', icon: Users, label: 'Gestion des clients' },
  { href: '/dashboard/documents', icon: FileText, label: 'Documents du client' },
  { href: '/dashboard/analytics', icon: BarChart, label: 'Analyse Détaillée' },
  { href: '/dashboard/accountant/billing', icon: CreditCard, label: 'Facturation Production' },
  { href: '/dashboard/accountant/export', icon: DownloadCloud, label: 'Export Comptable' },
  { href: '/dashboard/accountant/reconciliation', icon: Landmark, label: 'Rapprochement Bancaire' },
  { href: '/dashboard/accountant/revision', icon: Activity, label: 'Révision Continue' },
  { href: '/dashboard/accountant/banking-sim', icon: Wifi, label: 'Simulation Bancaire' },
  { href: '/dashboard/settings/billing', icon: Settings, label: 'Paramètres Cabinet' },
];

const secretaryNavItems: NavItem[] = [
    { href: '/dashboard/secretary', icon: LayoutDashboard, label: 'Tableau de bord' },
    { href: '/dashboard/clients', icon: Users, label: 'Gestion des clients' },
    { href: '/dashboard/documents', icon: FileText, label: 'Documents du client' },
];

const clientNavItems: NavItem[] = [
  { href: '/dashboard/scanner', icon: ScanLine, label: 'Scanner Mobile' },
  { href: '/dashboard/vault', icon: Shield, label: 'Mon Coffre-fort' },
  { href: '/dashboard/my-documents', icon: FileText, label: 'Mes Achats' },
  { href: '/dashboard/sales', icon: TrendingUp, label: 'Mes Ventes (Facturation)' },
  { href: '/dashboard/my-bank', icon: Landmark, label: 'Ma Banque' },
  { href: '/dashboard/my-analytics', icon: BarChart, label: 'Mon Analyse' },
  { href: '/dashboard/my-reports', icon: BookOpen, label: 'Mon Bilan' },
  { href: '/dashboard/billing', icon: CreditCard, label: 'Mon Abonnement' },
  { href: '/dashboard/my-invoices', icon: CreditCard, label: 'Mes Factures' },
];

const adminNavItems: NavItem[] = [
  { href: '/dashboard/admin', icon: LayoutDashboard, label: 'Tableau de bord Admin' },
  { href: '/dashboard/cabinets', icon: Building, label: 'Gestion des Cabinets' },
  { href: '/dashboard/audit', icon: HistoryIcon, label: "Journal d'Audit" },
  { href: '/dashboard/admin/subscriptions', icon: Activity, label: 'Abonnements & Quotas' },
  { href: '/dashboard/settings', icon: Settings, label: 'Paramètres Globaux' },
];


const roleConfig = {
    admin: { items: adminNavItems },
    accountant: { items: accountantNavItems },
    secretary: { items: secretaryNavItems },
    client: { items: clientNavItems }
}

type Role = keyof typeof roleConfig;

const isNavItemActive = (pathname: string, itemHref: string) => {
    if (itemHref.endsWith('/accountant') || itemHref.endsWith('/admin') || itemHref.endsWith('/my-documents') || itemHref.endsWith('/secretary')) {
        return pathname === itemHref;
    }
    return pathname.startsWith(itemHref);
}

export function NavItems({ currentRole }: { currentRole: Role }) {
    const pathname = usePathname();
    const { items } = roleConfig[currentRole] || roleConfig.client;
    const [missingCount, setMissingCount] = useState(0);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const clientId = localStorage.getItem('selectedClientId');
        // On écoute s'il y a un clientId, même si c'est un comptable qui "impersonate" un client
        if (clientId && (currentRole === 'client' || currentRole === 'accountant')) {
            const unsub = onSnapshot(doc(db, 'missing_documents', clientId), (snap) => {
                if (snap.exists()) {
                    setMissingCount(snap.data()?.items?.filter((i: any) => i.status === 'missing')?.length || 0);
                } else {
                    setMissingCount(0);
                }
            });
            return () => unsub();
        }
    }, [currentRole]);

    return (
        <ul className="space-y-1.5 list-none m-0 p-0">
            {items.map((item) => {
                const isActive = isNavItemActive(pathname, item.href);
                return (
                    <li key={item.href}>
                        <Link
                            href={item.href}
                            className={cn(
                                'group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300',
                                isActive 
                                    ? 'bg-primary text-primary-foreground premium-shadow pointer-events-none' 
                                    : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                            )}
                        >
                            <item.icon className={cn(
                                "h-5 w-5 transition-transform duration-300", 
                                isActive ? "scale-110" : "group-hover:scale-110"
                            )} />
                            <span className="flex-1">{item.label}</span>
                            {item.href === '/dashboard/my-bank' && missingCount > 0 && (
                                <Badge variant="destructive" className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                                    {missingCount}
                                </Badge>
                            )}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

export function MobileNav({ currentRole }: { currentRole: Role }) {
    const { theme, setTheme } = useTheme();
    
    return (
        <div className="flex h-full flex-col">
            <SheetHeader className="p-6 border-b border-border/50">
                <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
                <SheetDescription className="sr-only">
                    Navigation principale et options du compte pour l'application CCS Compta.
                </SheetDescription>
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                        <Logo className="h-6 w-6" />
                    </div>
                    <span className="font-display font-bold text-xl tracking-tight">CCS Compta</span>
                </Link>
            </SheetHeader>
            <ScrollArea className="flex-1">
                <nav className="grid items-start px-4 py-6 text-sm font-medium">
                    <NavItems currentRole={currentRole} />
                </nav>
            </ScrollArea>
            <div className="mt-auto p-4 border-t border-border/50 flex items-center justify-center bg-muted/20">
               <Button variant="outline" size="icon" className="rounded-full bg-background/50 hover:bg-background" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                   {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                   <span className="sr-only">Changer de thème</span>
               </Button>
           </div>
        </div>
    );
}

export function Sidebar({ currentRole }: { currentRole: Role }) {
  const { theme, setTheme } = useTheme();
  const { cabinet, isLoading, isImpersonating, profile } = useBranding();
  const router = useRouter();

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

      window.dispatchEvent(new Event('storage'));

      if (originalRole === 'admin') {
          router.push('/dashboard/admin');
      } else if (originalRole === 'accountant') {
          router.push('/dashboard/accountant');
      } else {
          router.push('/dashboard');
      }
  };

  const getDashboardHomeLink = () => {
    switch (currentRole) {
        case 'admin': return '/dashboard/admin';
        case 'accountant': return '/dashboard/accountant';
        case 'secretary': return '/dashboard/secretary';
        case 'client': return '/dashboard/my-documents';
        default: return '/dashboard';
    }
  }

  useEffect(() => {
    const body = document.body;
    body.classList.remove('accountant-theme', 'admin-theme');
    if (currentRole === 'admin') {
        body.classList.add('admin-theme');
    } else if (currentRole === 'accountant' || currentRole === 'secretary') {
        body.classList.add('accountant-theme');
    }
  }, [currentRole]);
  
  return (
      <aside className="hidden w-72 flex-shrink-0 border-r border-border/40 bg-background/60 backdrop-blur-xl md:flex md:flex-col relative z-20">
          <div className="flex items-center justify-center h-20 border-b border-border/40 px-6 bg-background/40">
            <Link
                href={getDashboardHomeLink()}
                className="flex items-center gap-3 group w-full px-2">
                <div className="flex h-10 w-10 overflow-hidden items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 premium-shadow-sm">
                    {cabinet?.logoUrl ? (
                        <img src={cabinet.logoUrl} alt={cabinet.name} className="h-full w-full object-cover" />
                    ) : (
                        <Logo className="h-6 w-6" />
                    )}
                </div>
                <div className="flex flex-col">
                    <span className="font-display font-bold text-lg leading-tight tracking-tight text-foreground truncate max-w-[160px]">
                        {cabinet?.name || "CCS Compta"}
                    </span>
                    {cabinet?.slogan && (
                        <span className="text-[10px] font-medium opacity-50 truncate max-w-[160px]">
                            {cabinet.slogan}
                        </span>
                    )}
                </div>
            </Link>
          </div>
          {isImpersonating && (
            <div className="px-4 py-4 mx-4 mt-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-3 relative overflow-hidden group">
              <div className="absolute inset-0 bg-amber-500/5 animate-pulse" />
              <div className="flex items-center gap-2 relative">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <span className="text-[10px] font-space font-black uppercase tracking-widest text-amber-500">Impersonation</span>
              </div>
              <p className="text-xs font-semibold leading-tight text-foreground relative">
                Espace client de :<br/>
                <span className="font-black text-amber-500 font-space text-sm">{profile?.name}</span>
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleStopImpersonating}
                className="w-full h-9 rounded-xl border-amber-500/20 text-amber-500 hover:bg-amber-500/20 hover:text-amber-500 font-space font-black uppercase text-[10px] tracking-widest relative transition-all duration-300"
              >
                Quitter l'espace
              </Button>
            </div>
          )}
          <ScrollArea className="flex-1">
            <nav className="px-4 py-6">
                <NavItems currentRole={currentRole} />
            </nav>
          </ScrollArea>
          <div className="mt-auto p-4 border-t border-border/40 bg-background/40">
            <TooltipProvider>
                <div className="flex items-center justify-center">
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="rounded-full bg-background hover:bg-muted w-10 h-10 transition-colors" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                                <span className="sr-only">Changer de thème</span>
                            </Button>
                        </TooltipTrigger>
                         <TooltipContent side="right" className="font-medium">
                            <p>Changer de thème</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>
          </div>
      </aside>
  );
}
