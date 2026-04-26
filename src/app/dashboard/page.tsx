'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useBranding } from '@/components/branding-provider';
import { Loader2 } from 'lucide-react';

export default function DashboardRedirect() {
  const router = useRouter();
  const { role, isLoading } = useBranding();

  useEffect(() => {
    if (isLoading) return;

    let targetPath: string;
    switch (role) {
      case 'admin':
        targetPath = '/dashboard/admin';
        break;
      case 'accountant':
        targetPath = '/dashboard/accountant';
        break;
      case 'secretary':
        targetPath = '/dashboard/secretary';
        break;
      case 'client':
        targetPath = '/dashboard/my-documents';
        break;
      default:
        targetPath = '/connexion';
        break;
    }
    
    router.replace(targetPath);
  }, [role, isLoading, router]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Redirection vers votre espace...</p>
        </div>
    </div>
  );
}
