
'use client';

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Breadcrumb } from "./breadcrumb";
import { usePathname } from 'next/navigation';
import { SupportChatbot } from "@/components/support-chatbot";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, FileText, ScanLine, BarChart, Home } from 'lucide-react';

const clientBottomNav = [
  { href: '/dashboard/my-documents', icon: FileText, label: 'Documents' },
  { href: '/dashboard/scan', icon: ScanLine, label: 'Scanner' },
  { href: '/dashboard/my-analytics', icon: BarChart, label: 'Analyse' },
];

const accountantBottomNav = [
  { href: '/dashboard/accountant', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/clients', icon: Users, label: 'Clients' },
  { href: '/dashboard/documents', icon: FileText, label: 'Documents' },
];

const secretaryBottomNav = [
  { href: '/dashboard/secretary', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/clients', icon: Users, label: 'Clients' },
  { href: '/dashboard/documents', icon: FileText, label: 'Documents' },
];


function BottomNavBar() {
  const pathname = usePathname();
  const [currentRole, setCurrentRole] = useState<'client' | 'accountant' | 'admin' | 'secretary'>('client');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const role = localStorage.getItem('userRole') as 'client' | 'accountant' | 'admin' | 'secretary' | null;
    if (role) {
      setCurrentRole(role);
    }
  }, []);

  if (!mounted) {
    return null; // Avoid rendering on the server
  }

  let navItems;
  switch (currentRole) {
      case 'client':
          navItems = clientBottomNav;
          break;
      case 'accountant':
      case 'admin':
          navItems = accountantBottomNav;
          break;
      case 'secretary':
          navItems = secretaryBottomNav;
          break;
      default:
          navItems = [];
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <nav className="grid grid-cols-3 h-16 items-center justify-items-center">
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
  // Hide breadcrumbs on root dashboard pages
  const showBreadcrumb = !['/dashboard/my-documents', '/dashboard/accountant', '/dashboard/admin', '/dashboard/secretary'].includes(pathname);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6 pb-24 md:pb-6">
          {showBreadcrumb && <Breadcrumb />}
          {children}
        </main>
        <SupportChatbot />
        <BottomNavBar />
      </div>
    </div>
  );
}
