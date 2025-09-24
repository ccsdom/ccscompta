
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Settings, LogOut, FileText, Users, BarChart, CreditCard, LifeBuoy, ScanLine, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useState, useEffect } from 'react';
import { ClientSwitcher } from './client-switcher';
import { Skeleton } from './ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from './ui/scroll-area';

type NavItem = {
    href: string;
    icon: React.ElementType;
    label: string;
};

const accountantNavItems: NavItem[] = [
  { href: '/dashboard/accountant', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/dashboard/clients', icon: Users, label: 'Gestion des clients' },
  { href: '/dashboard/documents', icon: FileText, label: 'Documents du client' },
  { href: '/dashboard/agenda', icon: CalendarDays, label: 'Agenda' },
  { href: '/dashboard/analytics', icon: BarChart, label: 'Analyse Détaillée' },
  { href: '/dashboard/billing', icon: CreditCard, label: 'Facturation' },
];

const secretaryNavItems: NavItem[] = [
    { href: '/dashboard/secretary', icon: LayoutDashboard, label: 'Tableau de bord' },
    { href: '/dashboard/clients', icon: Users, label: 'Gestion des clients' },
    { href: '/dashboard/documents', icon: FileText, label: 'Documents du client' },
    { href: '/dashboard/agenda', icon: CalendarDays, label: 'Agenda' },
];

const clientNavItems: NavItem[] = [
  { href: '/dashboard/my-documents', icon: FileText, label: 'Mes Documents' },
  { href: '/dashboard/scan', icon: ScanLine, label: 'Scanner un document' },
  { href: '/dashboard/my-analytics', icon: BarChart, label: 'Mon Analyse' },
  { href: '/dashboard/my-invoices', icon: CreditCard, label: 'Mes Factures' },
];

const commonBottomNavItems: NavItem[] = [
    { href: '/dashboard/support', icon: LifeBuoy, label: 'Aide & Support' },
]

const accountantBottomNavItems: NavItem[] = [
    { href: '/dashboard/settings', icon: Settings, label: 'Paramètres' },
]
const clientBottomNavItems: NavItem[] = [
    { href: '/dashboard/my-settings', icon: Settings, label: 'Paramètres' },
]


const roleConfig = {
    admin: { items: accountantNavItems, bottomItems: [...commonBottomNavItems, ...accountantBottomNavItems], label: 'Espace Administrateur' },
    accountant: { items: accountantNavItems, bottomItems: [...commonBottomNavItems, ...accountantBottomNavItems], label: 'Espace Comptable' },
    secretary: { items: secretaryNavItems, bottomItems: [...commonBottomNavItems, ...accountantBottomNavItems], label: 'Espace Secrétariat' },
    client: { items: clientNavItems, bottomItems: [...commonBottomNavItems, ...clientBottomNavItems], label: 'Espace Client' }
}

const isNavItemActive = (pathname: string, itemHref: string, currentRole: string) => {
    if (['/dashboard/accountant', '/dashboard/admin', '/dashboard/my-documents', '/dashboard/secretary'].includes(itemHref)) {
        if ((currentRole === 'admin' || currentRole === 'accountant') && (itemHref === '/dashboard/accountant' || itemHref === '/dashboard/admin') && (pathname.startsWith('/dashboard/accountant') || pathname === '/dashboard/admin')) return true;
        return pathname === itemHref;
    }
    return pathname.startsWith(itemHref);
}

export function NavItems({ currentRole }: { currentRole: 'client' | 'accountant' | 'admin' | 'secretary' }) {
    const pathname = usePathname();
    const { items } = roleConfig[currentRole] || roleConfig.client;

    return (
        <>
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted',
                        isNavItemActive(pathname, item.href, currentRole) ? 'bg-muted text-primary' : ''
                    )}
                >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                </Link>
            ))}
        </>
    );
}

export function BottomNavItems({ currentRole }: { currentRole: 'client' | 'accountant' | 'admin' | 'secretary' }) {
    const pathname = usePathname();
    const { bottomItems } = roleConfig[currentRole] || roleConfig.client;
     return (
        <>
            {bottomItems.map((item) => (
                 <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted',
                    isNavItemActive(pathname, item.href, currentRole) ? 'bg-muted text-primary' : ''
                    )}>
                        <item.icon className="h-4 w-4" />
                        {item.label}
                </Link>
            ))}
        </>
    );
}

export function MobileNav({ currentRole }: { currentRole: 'client' | 'accountant' | 'admin' | 'secretary' }) {
    const router = useRouter();
    const { label: roleLabel } = roleConfig[currentRole] || roleConfig.client;

    const handleLogout = () => {
        localStorage.clear();
        router.push('/login');
    };

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center h-16 border-b px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Logo className="h-6 w-6" />
                    <span>CCS Compta</span>
                </Link>
            </div>
            <div className="p-4 border-b space-y-4">
                <div className="text-center">
                    <span className={cn("text-sm font-semibold uppercase text-primary")}>
                        {roleLabel}
                    </span>
                </div>
                {(currentRole === 'accountant' || currentRole === 'secretary' || currentRole === 'admin') && (
                    <ClientSwitcher />
                )}
            </div>
            <ScrollArea className="flex-1">
                <nav className="grid items-start px-4 py-4 text-sm font-medium space-y-2">
                    <NavItems currentRole={currentRole} />
                </nav>
            </ScrollArea>
            <div className="mt-auto p-4 border-t space-y-2">
                <BottomNavItems currentRole={currentRole} />
                <Separator className="my-2" />
                <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                </Button>
            </div>
        </div>
    );
}


export function Sidebar() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentRole, setCurrentRole] = useState<'client' | 'accountant' | 'admin' | 'secretary'>('client');

   useEffect(() => {
    setMounted(true);
    
    const applyRole = () => {
        const role = localStorage.getItem('userRole') as 'client' | 'accountant' | 'admin' | 'secretary' | null;
        
        document.body.classList.remove('accountant-theme', 'admin-theme');

        if (role) {
            setCurrentRole(role);
            if (role === 'admin') {
                document.body.classList.add('admin-theme');
            } else if (role === 'accountant' || role === 'secretary') {
                document.body.classList.add('accountant-theme');
            }
        } else {
            setCurrentRole('client');
        }
    }

    applyRole();
    window.addEventListener('storage', applyRole);

    return () => {
        window.removeEventListener('storage', applyRole);
    }
  }, []);
  
  const getDashboardHomeLink = () => {
    if (currentRole === 'client') return '/dashboard/my-documents';
    if (currentRole === 'accountant') return '/dashboard/accountant';
    if (currentRole === 'secretary') return '/dashboard/secretary';
    if (currentRole === 'admin') return '/dashboard/accountant'; // Admin redirects to accountant view
    return '/dashboard';
  }

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const { label: roleLabel } = roleConfig[currentRole] || roleConfig.client;

  if (!mounted) {
      return (
        <aside className="hidden w-64 flex-shrink-0 border-r bg-background md:flex md:flex-col">
            <div className="flex items-center justify-center h-16 border-b">
                <Link href="/dashboard" className="flex items-center space-x-2">
                    <Logo className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg">CCS Compta</span>
                </Link>
            </div>
            <div className="p-4 border-b h-[116px]">
                <Skeleton className="h-6 w-3/4 mx-auto mb-4"/>
                <Skeleton className="h-10 w-full" />
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </nav>
            <div className="mt-auto p-4 border-t">
                <Skeleton className="h-10 w-full" />
            </div>
        </aside>
      )
  }

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r bg-background md:flex md:flex-col">
      <div className="flex items-center justify-center h-16 border-b">
        <Link href={getDashboardHomeLink()} className="flex items-center space-x-2">
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">CCS Compta</span>
        </Link>
      </div>

      <div className="p-4 border-b space-y-4">
        <div className="text-center">
            <span className={cn("text-sm font-semibold uppercase", "text-primary")}>
                {roleLabel}
            </span>
        </div>
        {(currentRole === 'accountant' || currentRole === 'secretary' || currentRole === 'admin') && (
            <ClientSwitcher />
        )}
      </div>


      <nav className="flex-1 px-4 py-4 space-y-2">
        <NavItems currentRole={currentRole} />
      </nav>
      <div className="mt-auto p-4 border-t space-y-2">
        <BottomNavItems currentRole={currentRole} />
        <Separator className="my-2"/>
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
        </Button>
      </div>
    </aside>
  );
}
