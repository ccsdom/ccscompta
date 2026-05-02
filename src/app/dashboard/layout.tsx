'use client';

import { Sidebar, MobileNav } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Breadcrumb } from "./breadcrumb";
import { usePathname } from 'next/navigation';
import { SupportChatbot } from "@/components/support-chatbot";
import { CommandCenter } from "@/components/command-center";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, FileText, ScanLine, BarChart, Menu, UserCheck, UserCog, User, Briefcase, CreditCard } from 'lucide-react';
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFirebase } from "@/firebase";
import { BrandingProvider, useBranding } from "@/components/branding-provider";
import { SyncRoleBanner } from "@/components/sync-role-banner";

const clientBottomNav = [
  { href: '/dashboard/my-documents', icon: FileText, label: 'Documents' },
  { href: '/dashboard/scan', icon: ScanLine, label: 'Scanner' },
  { href: '/dashboard/my-bank', icon: CreditCard, label: 'Banque' },
  { href: '/dashboard/my-analytics', icon: BarChart, label: 'Analyse' },
];

const adminBottomNav = [
  { href: '/dashboard/admin', icon: LayoutDashboard, label: 'Admin' },
  { href: '/dashboard/cabinets', icon: Building, label: 'Cabinets' },
  { href: '/dashboard/settings', icon: Settings, label: 'Paramètres' },
];

const staffBottomNav = [
  { href: '/dashboard/accountant', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/clients', icon: Users, label: 'Clients' },
  { href: '/dashboard/documents', icon: FileText, label: 'Documents' },
];

const roleConfig = {
    admin: { label: 'Espace Administrateur', icon: UserCog, bottomNav: adminBottomNav },
    accountant: { label: 'Espace Comptable', icon: UserCheck, bottomNav: staffBottomNav },
    secretary: { label: 'Espace Secrétariat', icon: UserCheck, bottomNav: staffBottomNav },
    client: { label: 'Espace Client', icon: User, bottomNav: clientBottomNav }
};

function BottomNavBar() {
  const pathname = usePathname();
  const { role } = useBranding();
  const navItems = (role && roleConfig[role as keyof typeof roleConfig]) ? roleConfig[role as keyof typeof roleConfig].bottomNav : [];

  if (!role) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <nav className={`grid grid-cols-${navItems.length || 1} h-16 items-center justify-items-center`}>
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

function RoleDisplay() {
  const { role } = useBranding();
  if (!role || !roleConfig[role as keyof typeof roleConfig]) return null;
  const config = roleConfig[role as keyof typeof roleConfig];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary animate-in fade-in zoom-in duration-500">
      <Icon className="h-4 w-4" />
      <span className="text-xs font-semibold tracking-wide uppercase">{config.label}</span>
    </div>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role } = useBranding();
  
  const hideBreadcrumbPaths = [
    '/dashboard/my-documents', 
    '/dashboard/accountant', 
    '/dashboard/admin', 
    '/dashboard/secretary', 
    '/dashboard/clients',
    '/dashboard/settings'
  ];
  const showBreadcrumb = !hideBreadcrumbPaths.some(path => pathname === path);

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#020617] overflow-hidden selection:bg-primary/20">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none opacity-50" />
      <Sidebar currentRole={role as any} />
      
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 bg-background/40 backdrop-blur-3xl m-0 md:m-2 md:ml-0 md:rounded-r-2xl border-y border-r border-transparent md:border-border/30 md:shadow-2xl">
        <SyncRoleBanner />
        <Header>
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="glass-panel">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Ouvrir le menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 border-r-border/40 glass-panel">
                        <MobileNav currentRole={role as any} />
                    </SheetContent>
                </Sheet>
            </div>
        </Header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
            <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                {showBreadcrumb && <Breadcrumb />}
                <RoleDisplay />
            </div>
            {children}
            </div>
        </main>
        <SupportChatbot />
        <BottomNavBar />
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BrandingProvider>
        <DashboardShell>
            <CommandCenter />
            {children}
        </DashboardShell>
    </BrandingProvider>
  );
}
