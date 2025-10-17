'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Cookie } from 'lucide-react';
import Link from 'next/link';

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // This effect runs only on the client side
    const consent = localStorage.getItem('cookie_consent');
    if (consent === null) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <Card className="max-w-xl mx-auto shadow-2xl">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Cookie className="h-8 w-8 text-primary shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Gestion des cookies</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Nous utilisons des cookies pour améliorer votre expérience sur notre site. En continuant, vous acceptez notre{' '}
                <Link href="/politique-de-confidentialite" className="underline hover:text-primary">
                  politique de confidentialité
                </Link>.
              </p>
            </div>
            <div className="flex gap-2 self-stretch md:self-center">
              <Button variant="outline" onClick={handleDecline}>
                Refuser
              </Button>
              <Button onClick={handleAccept}>Accepter</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
