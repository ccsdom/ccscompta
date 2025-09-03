
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Settings, LogOut, FileText, Users, BarChart, CreditCard, FileUp, AreaChart, Building2, LifeBuoy, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useState, useEffect } from 'react';
import { ClientSwitcher } from './client-switcher';
import { Separator } from './ui/separator';

const adminNavItems = [
  { href: '/dashboard/admin', icon: ShieldCheck, label: 'Tableau de bord Admin' },
  { href: '/dashboard/cabinets', icon: Building2, label: 'Gestion des Cabinets' },
  { href: '/dashboard/reporting', icon: AreaChart, label: 'Rapports Globaux' },
];

const accountantNavItems = [
  { href: '/dashboard/accountant', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/dashboard/clients', icon: Users, label: 'Gestion des clients' },
  { href: '/dashboard/documents', icon: FileText, label: 'Documents du client' },
  { href: '/dashboard/analytics', icon: BarChart, label: 'Analyse Détaillée' },
  { href: '/dashboard/reporting', icon: AreaChart, label: 'Rapports' },
];

const clientNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord'},
  { href: '/dashboard/my-documents', icon: FileUp, label: 'Mes documents' },
  { href: '/dashboard/my-analytics', icon: BarChart, label: 'Mon Analyse' },
  { href: '/dashboard/my-invoices', icon: CreditCard, label: 'Mes Factures' },
];

const commonBottomNavItems = [
    { href: '/dashboard/support', icon: LifeBuoy, label: 'Aide & Support' },
]

const accountantBottomNavItems = [
    { href: '/dashboard/settings', icon: Settings, label: 'Paramètres' },
]
const clientBottomNavItems = [
    { href: '/dashboard/my-settings', icon: Settings, label: 'Paramètres' },
]

const roleConfig = {
    admin: { items: adminNavItems, bottomItems: [...commonBottomNavItems, ...accountantBottomNavItems], label: 'Espace Super-Admin' },
    accountant: { items: accountantNavItems, bottomItems: [...commonBottomNavItems, ...accountantBottomNavItems], label: 'Espace Comptable' },
    client: { items: clientNavItems, bottomItems: [...commonBottomNavItems, ...clientBottomNavItems], label: 'Espace Client' }
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentRole, setCurrentRole] = useState<'client' | 'accountant' | 'admin'>('client');

   useEffect(() => {
    setMounted(true);
    const role = localStorage.getItem('userRole') as 'client' | 'accountant' | 'admin' | null;
    
    document.body.classList.remove('accountant-theme', 'admin-theme');

    if (role === 'admin') {
      setCurrentRole('admin');
      document.body.classList.add('admin-theme');
    } else if (role === 'accountant') {
      setCurrentRole('accountant');
      document.body.classList.add('accountant-theme');
    } else {
      setCurrentRole('client');
    }
  }, [pathname]);

  const isNavItemActive = (itemHref: string) => {
    if (itemHref === '/dashboard' || itemHref === '/dashboard/accountant' || itemHref === '/dashboard/admin') {
        return pathname === itemHref;
    }
    return pathname.startsWith(itemHref);
  }
  
  const getDashboardHomeLink = () => {
    if (currentRole === 'client') return '/dashboard';
    if (currentRole === 'accountant') return '/dashboard/accountant';
    return '/dashboard/admin';
  }

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const { items: navItems, bottomItems, label: roleLabel } = roleConfig[currentRole] || roleConfig.client;

  if (!mounted) {
      return (
        <aside className="w-64 flex-shrink-0 border-r bg-background flex flex-col hidden md:flex">
            <div className="flex items-center justify-center h-16 border-b">
                <Link href="/dashboard" className="flex items-center space-x-2">
                    <Logo className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg">CCS Compta</span>
                </Link>
            </div>
            <div className="p-4 border-b h-[92px] animate-pulse bg-muted/50" />
            <nav className="flex-1 px-4 py-4 space-y-2">
                <div className="h-10 bg-muted/50 rounded-lg animate-pulse" />
                <div className="h-10 bg-muted/50 rounded-lg animate-pulse" />
                <div className="h-10 bg-muted/50 rounded-lg animate-pulse" />
                <div className="h-10 bg-muted/50 rounded-lg animate-pulse" />
            </nav>
            <div className="mt-auto p-4 border-t">
                <Button variant="ghost" className="w-full justify-start">
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                </Button>
            </div>
        </aside>
      )
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-background flex flex-col hidden md:flex">
      <div className="flex items-center justify-center h-16 border-b">
        <Link href={getDashboardHomeLink()} className="flex items-center space-x-2">
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">CCS Compta</span>
        </Link>
      </div>

      <div className="p-4 border-b space-y-4 mb-4">
        <div className="text-center">
            <span className={cn("text-sm font-semibold uppercase", currentRole !== 'client' ? 'text-primary' : 'text-primary')}>
                {roleLabel}
            </span>
        </div>
        {currentRole === 'accountant' && <ClientSwitcher />}
      </div>


      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted',
              isNavItemActive(item.href) ? 'bg-muted text-primary' : ''
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto p-4 border-t space-y-2">
         {bottomItems.map((item) => (
             <Link
                key={item.href}
                href={item.href}
                className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted',
                isNavItemActive(item.href) ? 'bg-muted text-primary' : ''
                )}
            >
                <item.icon className="h-4 w-4" />
                {item.label}
            </Link>
        ))}
        <Separator className="my-2"/>
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
        </Button>
      </div>
    </aside>
  );
}
