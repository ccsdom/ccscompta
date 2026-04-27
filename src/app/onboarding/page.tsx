'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { Loader2, ShieldCheck, Lock, CheckCircle2, Building, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, functions } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { motion, AnimatePresence } from 'framer-motion';

function OnboardingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cabinet, setCabinet] = useState<any>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState(1); // 1: Welcome/Verify, 2: Set Password, 3: Success

    const cabinetId = searchParams.get('cabinetId');

    useEffect(() => {
        const verifyInvitation = async () => {
            if (!cabinetId) {
                toast({ variant: "destructive", title: "Lien invalide", description: "Aucun identifiant de cabinet fourni." });
                setIsLoading(false);
                return;
            }

            try {
                const docRef = doc(db, 'cabinets', cabinetId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.invitationStatus === 'accepted') {
                        toast({ title: "Déjà configuré", description: "Votre compte est déjà actif. Redirection vers la connexion..." });
                        setTimeout(() => router.push('/connexion'), 2000);
                        return;
                    }
                    setCabinet(data);
                } else {
                    toast({ variant: "destructive", title: "Cabinet introuvable", description: "Ce lien semble expiré ou invalide." });
                }
            } catch (error) {
                console.error("Verification error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        verifyInvitation();
    }, [cabinetId, router, toast]);

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast({ variant: "destructive", title: "Erreur", description: "Les mots de passe ne correspondent pas." });
            return;
        }

        if (password.length < 8) {
            toast({ variant: "destructive", title: "Mot de passe trop court", description: "Minimum 8 caractères requis." });
            return;
        }

        setIsSubmitting(true);
        try {
            const setupInvitedCabinet = httpsCallable(functions, 'setupInvitedCabinet');
            
            await setupInvitedCabinet({
                cabinetId,
                password,
                email: cabinet.email,
                name: cabinet.name
            });

            setStep(3);
            toast({ title: "Compte créé !", description: "Bienvenue sur CCS Compta." });
        } catch (error: any) {
            console.error("Setup error:", error);
            toast({ 
                variant: "destructive", 
                title: "Échec de la configuration", 
                description: error.message || "Une erreur interne est survenue." 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground font-medium animate-pulse">Vérification de votre invitation...</p>
                </div>
            </div>
        );
    }

    if (!cabinet) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="max-w-md w-full glass-panel border-destructive/20 ring-1 ring-destructive/10">
                    <CardHeader className="text-center">
                        <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck className="h-8 w-8 text-destructive" />
                        </div>
                        <CardTitle className="text-2xl font-black">Invitation Non Valide</CardTitle>
                        <CardDescription>
                            Ce lien n'est plus actif ou l'identifiant est incorrect. 
                            Veuillez contacter l'administrateur.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Button variant="outline" onClick={() => router.push('/')}>
                            Retour à l'accueil
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-background">
            {/* Elite Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10 z-0" />
            <div className="absolute -top-[400px] -right-[400px] w-[800px] h-[800px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-[400px] -left-[400px] w-[800px] h-[800px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-xl">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="glass-panel border-primary/20 premium-shadow">
                                <CardHeader className="text-center pb-2">
                                    <div className="flex justify-center mb-6">
                                        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary ring-1 ring-primary/20">
                                            <Logo className="h-10 w-10" />
                                        </div>
                                    </div>
                                    <h1 className="text-3xl font-black tracking-tight mb-2">Bienvenue, <span className="gradient-text italic">{cabinet.name}</span></h1>
                                    <p className="text-muted-foreground text-lg italic">Félicitations pour votre adhésion à l'écosystème CCS Compta.</p>
                                </CardHeader>
                                <CardContent className="space-y-8 p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                            <Building className="h-5 w-5 text-primary" />
                                            <p className="text-sm font-bold opacity-80">Structure</p>
                                            <p className="text-sm text-muted-foreground">{cabinet.name}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                            <Lock className="h-5 w-5 text-primary" />
                                            <p className="text-sm font-bold opacity-80">Rôle</p>
                                            <p className="text-sm text-muted-foreground font-mono uppercase text-[10px]">Administrateur Cabinet</p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                                        <h3 className="font-space font-black text-xs uppercase tracking-widest text-primary mb-3">Vos accès Élite incluent :</h3>
                                        <ul className="space-y-3">
                                            {['Traitement IA Illimité', 'Tableaux de bord Expert', 'Gestion Multi-Clients', 'Accès API Temps Réel'].map((item, i) => (
                                                <li key={i} className="flex items-center gap-3 text-sm">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                    <span className="font-medium opacity-90">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <Button className="w-full h-14 text-lg font-bold gap-3 premium-shadow transition-all hover:scale-[1.02]" onClick={() => setStep(2)}>
                                        Activer mon compte <ArrowRight className="h-5 w-5" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <Card className="glass-panel border-primary/20 premium-shadow">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-black">Sécurisation de l'accès</CardTitle>
                                    <CardDescription>Définissez votre mot de passe pour accéder à votre espace cabinet.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <form onSubmit={handleCreateAccount} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black opacity-60 tracking-widest">Identifiant (Email)</Label>
                                            <Input value={cabinet.email} disabled className="bg-white/5 border-white/10 opacity-70" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black opacity-60 tracking-widest">Mot de passe</Label>
                                            <Input 
                                                type="password" 
                                                value={password} 
                                                onChange={(e) => setPassword(e.target.value)} 
                                                placeholder="••••••••"
                                                className="h-12 bg-white/5 border-white/10"
                                                required 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black opacity-60 tracking-widest">Confirmer le mot de passe</Label>
                                            <Input 
                                                type="password" 
                                                value={confirmPassword} 
                                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                                placeholder="••••••••"
                                                className="h-12 bg-white/5 border-white/10"
                                                required 
                                            />
                                        </div>
                                        <Button className="w-full h-14 text-lg font-bold transition-all" disabled={isSubmitting}>
                                            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : "Configurer mon accès"}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <Card className="glass-panel border-primary/20 premium-shadow p-12">
                                <div className="h-24 w-24 bg-emerald-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner ring-1 ring-emerald-500/30">
                                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                                </div>
                                <h1 className="text-4xl font-black mb-4">Initialisation Réussie</h1>
                                <p className="text-muted-foreground text-lg max-w-sm mx-auto mb-8">
                                    Votre compte administrateur pour <span className="text-primary font-bold">{cabinet.name}</span> est prêt.
                                </p>
                                <Button className="h-14 px-12 text-lg font-bold gap-2" onClick={() => router.push('/connexion')}>
                                    Accéder au Dashboard <ArrowRight className="h-5 w-5" />
                                </Button>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <OnboardingContent />
        </Suspense>
    );
}
