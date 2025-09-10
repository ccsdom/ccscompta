
'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This effect runs only on the client side
    if (pathname === '/dashboard') {
      const role = localStorage.getItem('userRole');
      
      let targetPath = '/login';
      if (role === 'admin') {
        targetPath = '/dashboard/admin';
      } else if (role === 'accountant') {
        targetPath = '/dashboard/accountant';
      } else if (role === 'client') {
        targetPath = '/dashboard/my-documents';
      } else if (role === 'secretary') {
        targetPath = '/dashboard/secretary';
      }
      
      router.replace(targetPath);
      // The loading state will be set to false once the navigation completes
      // or if the initial path is not the one we are redirecting from.
      setLoading(false);
    } else {
        setLoading(false);
    }
  }, [router, pathname]);

  // Display a loader to avoid flashing content or showing a blank page during redirection.
  if (loading) {
      return (
        <div className="space-y-6">
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
      )
  }

  // This will be rendered if the path is not '/dashboard' and loading is complete,
  // though the layout structure means this component is primarily for redirection.
  return null;
}
