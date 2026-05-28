
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const initialization = useMemo(() => {
    try {
      // Initialize Firebase on the client side, once per component mount.
      return { services: initializeFirebase(), error: null as Error | null };
    } catch (error) {
      const initializationError = error instanceof Error ? error : new Error('Failed to initialize Firebase.');
      console.error('[Firebase] Client initialization failed', initializationError);
      return { services: null, error: initializationError };
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  if (!initialization.services) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-lg rounded-xl border border-destructive/20 bg-card p-6 text-left shadow-2xl">
          <h1 className="text-lg font-semibold text-foreground">Configuration indisponible</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            L&apos;application n&apos;a pas pu initialiser Firebase. Vérifiez la configuration publique NEXT_PUBLIC_FIREBASE_* et redéployez.
          </p>
          {initialization.error && (
            <pre className="mt-4 max-h-36 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
              {initialization.error.message}
            </pre>
          )}
          <button
            type="button"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Recharger
          </button>
        </div>
      </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={initialization.services.firebaseApp}
      auth={initialization.services.auth}
      firestore={initialization.services.firestore}
      storage={initialization.services.storage}
    >
      {children}
    </FirebaseProvider>
  );
}
