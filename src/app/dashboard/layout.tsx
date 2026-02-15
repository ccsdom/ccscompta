
'use client';

import { Sidebar, MobileNav } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Breadcrumb } from "./breadcrumb";
import { usePathname } from 'next/navigation';
import { SupportChatbot } from "@/components/support-chatbot";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, FileText, ScanLine, BarChart, Menu, UserCheck, UserCog, User, Briefcase } from 'lucide-react';
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFirebase } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";

const clientBottomNav = [
  { href: '/dashboard/my-documents', icon: FileText, label: 'Documents' },
  { href: '/dashboard/scan', icon: ScanLine, label: 'Scanner' },
  { href: '/dashboard/my-analytics', icon: BarChart, label: 'Analyse' },
];

const staffBottomNav = [
  { href: '/dashboard/accountant', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/clients', icon: Users, label: 'Clients' },
  { href: '/dashboard/documents', icon: FileText, label: 'Documents' },
];

const roleConfig = {
    admin: { label: 'Espace Administrateur', icon: UserCog, bottomNav: staffBottomNav },
    accountant: { label: 'Espace Comptable', icon: UserCheck, bottomNav: staffBottomNav },
    secretary: { label: 'Espace Secrétariat', icon: UserCheck, bottomNav: staffBottomNav },
    client: { label: 'Espace Client', icon: User, bottomNav: clientBottomNav }
};


function BottomNavBar({ currentRole }: { currentRole: keyof typeof roleConfig }) {
  const pathname = usePathname();
  const navItems = roleConfig[currentRole]?.bottomNav || [];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <nav className={`grid grid-cols-${navItems.length} h-16 items-center justify-items-center`}>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground transition-all hover:bg-muted',
                isActive && 'text-primary'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [currentRole, setCurrentRole] = useState<keyof typeof roleConfig | null>(null);
  const { isUserLoading } = useFirebase();

  // This effect runs on the client to safely access localStorage
  useEffect(() => {
    const role = localStorage.getItem('userRole') as keyof typeof roleConfig | null;
    if (role && roleConfig[role]) {
      setCurrentRole(role);
    } else {
      setCurrentRole('client'); // Default or handle unauthenticated
    }

    const handleStorageChange = () => {
        const newRole = localStorage.getItem('userRole') as keyof typeof roleConfig | null;
        if(newRole && roleConfig[newRole]) setCurrentRole(newRole);
    }

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Conditionally render breadcrumbs
  const hideBreadcrumbPaths = [
    '/dashboard/my-documents', 
    '/dashboard/accountant', 
    '/dashboard/admin', 
    '/dashboard/secretary', 
    '/dashboard/documents'
  ];
  const showBreadcrumb = !hideBreadcrumbPaths.includes(pathname);
  
  const RoleDisplay = () => {
      if (!currentRole) return null;
      const { label, icon: Icon } = roleConfig[currentRole];
      const hideOnPaths = ['/dashboard/settings', '/dashboard/support', '/dashboard/documents'];
      if(hideOnPaths.includes(pathname)) return null;

      return (
          <div className="flex justify-end mb-4">
              <Badge variant="outline" className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{label}</span>
              </Badge>
          </div>
      )
  }

  // Render a full-page loading skeleton until Firebase has confirmed the auth state.
  // This is the CRITICAL fix to prevent race conditions.
  if (isUserLoading) {
    return (
      <div className="flex h-screen bg-background">
        <aside className="hidden w-64 flex-shrink-0 border-r bg-background md:flex md:flex-col">
          <div className="flex items-center justify-center h-16 border-b">
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="flex-1 px-4 py-4 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </aside>
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 max-w-full items-center justify-between px-4 md:px-6 gap-4">
                <div className="md:hidden">
                  <Skeleton className="h-10 w-10" />
                </div>
                <Skeleton className="h-10 md:w-2/3 lg:w-1/2" />
                <div className="flex items-center space-x-1 md:space-x-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6 pb-24 md:pb-6">
             <Skeleton className="h-96 w-full" />
          </main>
        </div>
      </div>
    );
  }

  // Once loading is complete, render the actual layout, but still guard against a missing role.
  if (!currentRole) return null; 

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentRole={currentRole} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header>
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Ouvrir le menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0">
                        <MobileNav currentRole={currentRole} />
                    </SheetContent>
                </Sheet>
            </div>
        </Header>
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6 pb-24 md:pb-6">
          {showBreadcrumb && <Breadcrumb />}
          <RoleDisplay />
          {children}
        </main>
        <SupportChatbot />
        <BottomNavBar currentRole={currentRole} />
      </div>
    </div>
  );
}
