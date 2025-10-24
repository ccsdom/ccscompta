
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Settings, FileText, Users, BarChart, CreditCard, LifeBuoy, ScanLine, CalendarDays, Moon, Sun, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useEffect } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { useTheme } from 'next-themes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

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

const adminNavItems: NavItem[] = [
  { href: '/dashboard/admin', icon: LayoutDashboard, label: 'Tableau de bord Admin' },
  { href: '/dashboard/cabinets', icon: Building, label: 'Gestion des Cabinets' },
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

    return (
        <>
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted',
                        isNavItemActive(pathname, item.href) ? 'bg-muted text-primary' : ''
                    )}
                >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                </Link>
            ))}
        </>
    );
}

export function MobileNav({ currentRole }: { currentRole: Role }) {
    const { theme, setTheme } = useTheme();
    
    return (
        <div className="flex h-full flex-col">
            <SheetHeader className="p-4 border-b">
                <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
                <SheetDescription className="sr-only">
                    Navigation principale et options du compte pour l'application CCS Compta.
                </SheetDescription>
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Logo className="h-6 w-6" />
                    <span>CCS Compta</span>
                </Link>
            </SheetHeader>
            <ScrollArea className="flex-1">
                <nav className="grid items-start px-4 py-4 text-sm font-medium space-y-2">
                    <NavItems currentRole={currentRole} />
                </nav>
            </ScrollArea>
            <div className="mt-auto p-4 border-t flex items-center justify-center">
               <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                   {theme === 'light' ? <Moon className="h-[1.2rem] w-[1.2rem]" /> : <Sun className="h-[1.2rem] w-[1.2rem]" />}
                   <span className="sr-only">Changer de thème</span>
               </Button>
           </div>
        </div>
    );
}


export function Sidebar({ currentRole }: { currentRole: Role }) {
  const { theme, setTheme } = useTheme();

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
      <aside className="hidden w-64 flex-shrink-0 border-r bg-background md:flex md:flex-col">
          <div className="flex items-center justify-center h-16 border-b">
            <Link
                href={getDashboardHomeLink()}
                className="flex items-center space-x-2">
                <Logo className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">CCS Compta</span>
            </Link>
          </div>
          <ScrollArea className="flex-1">
            <nav className="px-4 py-4 space-y-2">
                <NavItems currentRole={currentRole} />
            </nav>
          </ScrollArea>
          <div className="mt-auto p-2 border-t">
            <TooltipProvider>
                <div className="flex items-center justify-center">
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                                {theme === 'light' ? <Moon className="h-[1.2rem] w-[1.2rem]" /> : <Sun className="h-[1.2rem] w-[1.2rem]" />}
                                <span className="sr-only">Changer de thème</span>
                            </Button>
                        </TooltipTrigger>
                         <TooltipContent side="right">
                            <p>Changer de thème</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>
          </div>
      </aside>
  );
}
