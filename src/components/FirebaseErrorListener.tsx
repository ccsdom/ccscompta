'use client';

import { useEffect, useRef } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It converts permission failures into recoverable UI feedback instead of
 * crashing the whole client application.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();
  const lastToastRef = useRef<{ key: string; at: number } | null>(null);

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      const key = `${error.operation}:${error.path}`;
      const now = Date.now();
      const lastToast = lastToastRef.current;

      console.warn('Firestore permission denied', error.request);

      if (lastToast?.key === key && now - lastToast.at < 8000) {
        return;
      }

      lastToastRef.current = { key, at: now };
      toast({
        variant: 'destructive',
        title: 'Acces refuse',
        description: "Votre session n'a pas les droits necessaires pour cette donnee. Reconnectez-vous ou contactez votre cabinet si le probleme persiste.",
      });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
