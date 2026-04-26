
'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { ShieldAlert, Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function SyncRoleBanner() {
    const { user, auth } = useFirebase();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showBanner, setShowBanner] = useState(false);

    const ADMIN_EMAIL = 'app.ccs94@gmail.com';

    useEffect(() => {
        if (user && user.email === ADMIN_EMAIL) {
            console.log("👤 UID Frontend:", user.uid);
            user.getIdTokenResult(true).then((idTokenResult) => {
                console.log("🔍 [SyncBanner] Claims détectés:", idTokenResult.claims);
                if (idTokenResult.claims.role === 'admin') {
                    console.log("✅ Droits Admin confirmés. On cache le bandeau.");
                    setShowBanner(false);
                } else {
                    console.log("⚠️ Droits Admin manquants dans le token.");
                    setShowBanner(true);
                }
            });
        }
    }, [user]);

    const handleSync = async () => {
        if (!auth) return;
        setIsLoading(true);
        try {
            const { functions } = await import('@/firebase');
            const syncAdminRole = httpsCallable(functions, 'syncAdminRole');
            await syncAdminRole();
            
            // Force refresh token
            await user?.getIdToken(true);
            
            setIsSuccess(true);
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error("Erreur de synchronisation:", error);
            alert("Erreur lors de la synchronisation. Vérifiez les logs.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!showBanner) return null;

    return (
        <AnimatePresence>
            {!isSuccess ? (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-primary/10 border-b border-primary/20 backdrop-blur-md relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse" />
                    <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                                <ShieldAlert className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-black uppercase tracking-tight font-space italic">
                                    Privilèges SaaS non détectés
                                </p>
                                <p className="text-xs text-muted-foreground font-medium">
                                    Votre compte est identifié comme Propriétaire. Activez vos droits de contrôle global.
                                </p>
                            </div>
                        </div>
                        <Button 
                            onClick={handleSync} 
                            disabled={isLoading}
                            className="bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest px-6 h-10 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Zap className="h-4 w-4 mr-2 fill-current" />
                            )}
                            Activer le Mode Super Admin
                        </Button>
                    </div>
                </motion.div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-emerald-500 text-white py-4 text-center font-bold text-sm flex items-center justify-center gap-2"
                >
                   <CheckCircle2 className="h-5 w-5" /> 
                   Droits Admin synchronisés ! Redémarrage de la console...
                </motion.div>
            )}
        </AnimatePresence>
    );
}
