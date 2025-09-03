
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, LogOut, FileText, Users, BarChart, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useState, useEffect } from 'react';
import { ClientSwitcher } from './client-switcher';

const accountantNavItems = [
  { href: '/dashboard/accountant', icon: LayoutDashboard, label: 'Tableau de bord global' },
  { href: '/dashboard/clients', icon: Users, label: 'Gestion des clients' },
  { href: '/dashboard/documents', icon: FileText, label: 'Documents du client' },
  { href: '/dashboard/analytics', icon: BarChart, label: 'Analyse Détaillée' },
  { href: '/dashboard/settings', icon: Settings, label: 'Paramètres' },
];

const clientNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/dashboard/my-documents', icon: FileText, label: 'Mes documents' },
  { href: '/dashboard/my-analytics', icon: BarChart, label: 'Mon Analyse' },
  { href: '/dashboard/settings', icon: Settings, label: 'Paramètres' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [navItems, setNavItems] = useState(clientNavItems);
  const [currentRole, setCurrentRole] = useState('client');

  useEffect(() => {
    // Simulate role-based navigation by reading from local storage
    const role = localStorage.getItem('userRole');
    if (role === 'accountant') {
      setNavItems(accountantNavItems);
      setCurrentRole('accountant');
    } else {
      setNavItems(clientNavItems);
      setCurrentRole('client');
    }
  }, [pathname]); // Rerun on path change to ensure correct state

  const isNavItemActive = (itemHref: string) => {
    // Exact match for root dashboards
    if (itemHref === '/dashboard' || itemHref === '/dashboard/accountant') {
        return pathname === itemHref;
    }
    // Starts with for parent routes, but not for the root dashboard
    return pathname.startsWith(itemHref) && itemHref !== '/dashboard' && itemHref !== '/dashboard/accountant';
  }
  
  const getDashboardHomeLink = () => {
    return currentRole === 'accountant' ? '/dashboard/accountant' : '/dashboard';
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-background flex flex-col hidden md:flex">
      <div className="flex items-center justify-center h-16 border-b">
        <Link href={getDashboardHomeLink()} className="flex items-center space-x-2">
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">CCS Compta</span>
        </Link>
      </div>

      {currentRole === 'accountant' && (
        <div className="p-4 border-b">
            <ClientSwitcher />
        </div>
      )}

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
      <div className="mt-auto p-4 border-t">
        <Link href="/login">
            <Button variant="ghost" className="w-full justify-start">
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
            </Button>
        </Link>
      </div>
    </aside>
  );
}
