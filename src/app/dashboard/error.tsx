'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard route crashed', {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-lg border bg-background p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">Une erreur a interrompu l'espace</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          La page n'a pas pu etre chargee correctement. Vos donnees ne sont pas modifiees.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reessayer
          </Button>
          <Button asChild type="button" variant="outline" className="gap-2">
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              Retour au tableau de bord
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
