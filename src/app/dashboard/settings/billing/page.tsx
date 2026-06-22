'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBranding } from '@/components/branding-provider';
import { Building, ShieldCheck, CreditCard, LinkIcon, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CabinetSettingsPage() {
    const { cabinet, role } = useBranding();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (searchParams.get('connect_success') === 'true') {
            toast({ title: "Compte lié !", description: "Votre cabinet peut désormais recevoir des paiements." });
        }
        if (searchParams.get('error')) {
            toast({ variant: "destructive", title: "Erreur Stripe", description: "L'onboarding a échoué ou a été annulé." });
        }
    }, [searchParams, toast]);

    const handleConnectStripe = async () => {
        if (!cabinet?.id) return;
        setIsLoading(true);
        try {
            const response = await fetch('/api/stripe/connect/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cabinetId: cabinet.id })
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || "Erreur de connexion");
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erreur", description: error.message });
            setIsLoading(false);
        }
    };

    if (role !== 'accountant' && role !== 'admin') {
        return <div className="p-8">Accès non autorisé.</div>;
    }

    const isConnected = cabinet?.stripeConnectStatus === 'active';
    const isPending = cabinet?.stripeConnectStatus === 'pending';

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black font-space tracking-tight flex items-center gap-3">
                    <Building className="h-8 w-8 text-primary" />
                    Paramètres du Cabinet
                </h1>
                <p className="text-muted-foreground mt-2">Gérez vos encaissements et votre compte Stripe.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                {/* Stripe Connect Card */}
                <Card className="glass-panel border-white/10 premium-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            Encaissements Clients
                        </CardTitle>
                        <CardDescription>Recevez les paiements de vos clients directement sur votre compte bancaire en reliant Stripe.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isConnected ? (
                            <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-500">
                                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                <AlertTitle>Compte Connecté</AlertTitle>
                                <AlertDescription>Votre compte Stripe est opérationnel. Vos clients vous paient directement.</AlertDescription>
                            </Alert>
                        ) : isPending ? (
                            <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-500">
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                <AlertTitle>En attente</AlertTitle>
                                <AlertDescription>Finalisez votre inscription Stripe pour recevoir les paiements.</AlertDescription>
                            </Alert>
                        ) : (
                            <p className="text-sm text-muted-foreground">Aucun compte bancaire n'est relié. L'encaissement SaaS est suspendu pour ce cabinet.</p>
                        )}
                    </CardContent>
                    <CardFooter>
                        {!isConnected && (
                            <Button onClick={handleConnectStripe} disabled={isLoading} className="w-full gap-2">
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
                                {isPending ? "Reprendre l'inscription Stripe" : "Connecter mon compte Stripe"}
                            </Button>
                        )}
                        {isConnected && (
                            <Button variant="outline" className="w-full" disabled>
                                Stripe Opérationnel
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
