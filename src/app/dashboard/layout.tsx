
'use client';

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Breadcrumb } from "@/components/breadcrumb";
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Hide breadcrumbs on root dashboard pages
  const showBreadcrumb = !['/dashboard', '/dashboard/accountant', '/dashboard/admin'].includes(pathname);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
          {showBreadcrumb && <Breadcrumb />}
          {children}
        </main>
      </div>
    </div>
  );
}
