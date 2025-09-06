
'use client';

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Breadcrumb } from "@/components/breadcrumb";
import { usePathname } from 'next/navigation';
import { SupportChatbot } from "@/components/support-chatbot";

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
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
          {showBreadcrumb && <Breadcrumb />}
          {children}
        </main>
        <SupportChatbot />
      </div>
    </div>
  );
}
