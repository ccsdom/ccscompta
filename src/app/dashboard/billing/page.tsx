'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBranding } from '@/components/branding-provider';
import { CreditCard, CheckCircle2, Zap, Shield, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';

export default function BillingPage() {
    const { profile } = useBranding();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (searchParams.get('success')) {
            toast({ title: "Paiement réussi !", description: "Votre abonnement est maintenant actif." });
        }
        if (searchParams.get('canceled')) {
            toast({ variant: "destructive", title: "Paiement annulé", description: "Vous n'avez pas été facturé." });
        }
    }, [searchParams, toast]);

    const handleSubscribe = async () => {
        if (!profile?.id) return;
        setIsLoading(true);
        try {
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId: profile.id })
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Erreur lors de la création de la session');
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erreur", description: error.message });
            setIsLoading(false);
        }
    };

    const isPro = profile?.pricingPlan === 'pro';

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div>
                <h1 className="text-4xl font-black font-space tracking-tight flex items-center gap-3">
                    <CreditCard className="h-8 w-8 text-primary" />
                    Mon Abonnement
                </h1>
                <p className="text-muted-foreground mt-2 font-medium">Gérez votre formule et accédez à l'ensemble des fonctionnalités Premium.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                {/* Plan Basique */}
                <Card className={`glass-panel border-white/10 premium-shadow overflow-hidden relative ${!isPro ? 'ring-2 ring-primary' : 'opacity-70'}`}>
                    {!isPro && (
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                            Actuel
                        </div>
                    )}
                    <CardHeader>
                        <CardTitle className="text-2xl">Plan Essentiel</CardTitle>
                        <CardDescription>Pour démarrer la comptabilité</CardDescription>
                        <div className="mt-4 flex items-baseline text-4xl font-black">
                            Gratuit
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500"/> Scan de factures basique</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500"/> OCR Standard</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500"/> Support par email</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        {!isPro ? (
                            <Button variant="outline" className="w-full" disabled>Plan Actif</Button>
                        ) : (
                            <Button variant="outline" className="w-full" disabled>Géré par Stripe</Button>
                        )}
                    </CardFooter>
                </Card>

                {/* Plan Pro */}
                <Card className={`glass-panel border-none premium-shadow overflow-hidden relative bg-gradient-to-br from-primary/10 to-transparent ${isPro ? 'ring-2 ring-primary' : ''}`}>
                    {isPro && (
                        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                            Actif
                        </div>
                    )}
                    <div className="absolute top-4 right-4 text-primary animate-pulse">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-2xl text-primary flex items-center gap-2">
                            Plan Premium
                        </CardTitle>
                        <CardDescription>Automatisation complète et IA prédictive</CardDescription>
                        <div className="mt-4 flex items-baseline text-4xl font-black">
                            49€ <span className="text-lg text-muted-foreground font-medium ml-1">/ mois</span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ul className="space-y-2 text-sm font-medium">
                            <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary"/> IA de Pré-saisie avancée (Gemini)</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary"/> Bilan pour les nuls & Cashflow prédictif</li>
                            <li className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary"/> Coffre-fort GED illimité</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary"/> Support prioritaire</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        {isPro ? (
                            <Button className="w-full" variant="outline" disabled>Vous êtes Premium</Button>
                        ) : (
                            <Button 
                                className="w-full font-bold shadow-xl transition-all hover:scale-[1.02]" 
                                onClick={handleSubscribe} 
                                disabled={isLoading}
                            >
                                {isLoading ? "Redirection Stripe..." : "Passer Premium"}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
