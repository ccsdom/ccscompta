
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardRedirect() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This effect runs only on the client side
    const role = localStorage.getItem('userRole');
    
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
        // If no role, or unknown role, redirect to login
        targetPath = '/login';
        break;
    }
    
    router.replace(targetPath);
    // No need to setLoading(false) as the component will unmount on redirect.

  }, [router]);

  // Display a full-page loader to avoid flashing content or showing a blank page during redirection.
  return (
    <div className="w-full h-full p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 gap-6">
             <Skeleton className="h-96" />
        </div>
    </div>
  );
}
