'use client';

import { useEffect, useState } from 'react';
import { Smartphone, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function PwaInstaller() {
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Service Worker Registration
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.error('[PWA] Service Worker failed:', err);
        });
      });
    }

    // Handle install prompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner only if not already installed and on mobile/desktop
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      if (!isStandalone) {
          setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect iOS "Add to Home Screen"
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    
    if (isIOS && !isStandalone) {
      const lastPrompt = localStorage.getItem('pwa_prompt_ios');
      const now = Date.now();
      // Show every 7 days
      if (!lastPrompt || now - parseInt(lastPrompt) > 7 * 24 * 60 * 60 * 1000) {
        setShowInstallBanner(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // iOS Guide
      alert("Sur iOS : Appuyez sur 'Partager' [icon] puis sur 'Sur l'écran d'accueil'");
      localStorage.setItem('pwa_prompt_ios', Date.now().toString());
      setShowInstallBanner(false);
    }
  };

  return (
    <AnimatePresence>
      {showInstallBanner && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 z-50 md:left-auto md:right-8 md:bottom-8 md:w-96"
        >
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4">
            <div className="bg-gradient-to-br from-amber-400 to-orange-600 p-2.5 rounded-xl shrink-0">
               <Smartphone className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white leading-tight">Installer l'application CCS</h3>
              <p className="text-xs text-white/60">Capturez vos factures plus rapidement, même hors ligne.</p>
            </div>

            <div className="flex flex-col gap-2">
              <Button 
                size="sm" 
                onClick={handleInstallClick}
                className="bg-white text-black hover:bg-white/90 text-[10px] h-8 px-3 font-bold uppercase tracking-wider"
              >
                Installer
              </Button>
              <button 
                onClick={() => setShowInstallBanner(false)}
                className="text-white/40 hover:text-white transition-colors self-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
