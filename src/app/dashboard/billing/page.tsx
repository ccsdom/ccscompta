
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Zap, Star, FileText } from 'lucide-react';
import type { Document } from '../documents/page';

const plans = [
    {
        name: "Essentiel",
        price: "29€",
        description: "Idéal pour les indépendants et les petites entreprises.",
        features: ["Jusqu'à 50 documents/mois", "Extraction IA standard", "Support par email"],
        isCurrent: false,
    },
    {
        name: "Croissance",
        price: "79€",
        description: "Pour les entreprises en développement avec des besoins croissants.",
        features: ["Jusqu'à 200 documents/mois", "Extraction et validation IA", "Analyses détaillées", "Support prioritaire"],
        isCurrent: true, // Default plan for subscription model
    },
    {
        name: "Performance",
        price: "Sur devis",
        description: "Pour les grandes entreprises et les besoins personnalisés.",
        features: ["Documents illimités", "Automatisation avancée", "API & Intégrations", "Support dédié"],
        isCurrent: false, // Set to true for custom plan clients
        isPopular: true,
    }
];


export default function BillingPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [billingModel, setBillingModel] = useState<'subscription' | 'custom'>('subscription');

     useEffect(() => {
        const loadState = () => {
            const storedDocs = localStorage.getItem('documents');
            if (storedDocs) {
                const parsedDocs = JSON.parse(storedDocs);
                setDocuments(parsedDocs);
            }
             const storedClientId = localStorage.getItem('selectedClientId');
             if (storedClientId) {
                setSelectedClientId(storedClientId);
                // Demo logic: Client 'alpha' has a custom plan included in their annual fee
                if (storedClientId === 'alpha') {
                    setBillingModel('custom');
                } else {
                    setBillingModel('subscription');
                }
             }
        };
        loadState();
        window.addEventListener('storage', loadState);
        return () => window.removeEventListener('storage', loadState);
    }, []);

    const currentMonthDocs = useMemo(() => {
        return documents.filter(doc => {
            if (doc.clientId !== selectedClientId) return false;
            // A more robust date parsing would be needed in a real app
            const [day, month, year] = doc.uploadDate.split('/').map(Number);
            if (!day || !month || !year) return false;
            const uploadDate = new Date(year, month - 1, day);
            const today = new Date();
            return uploadDate.getMonth() === today.getMonth() && uploadDate.getFullYear() === today.getFullYear();
        }).length;
    }, [documents, selectedClientId]);

    
    const docLimit = 200; // Based on "Croissance" plan for subscription model
    const usagePercentage = Math.min((currentMonthDocs / docLimit) * 100, 100);
    
    const isCurrentPlan = (planName: string) => {
        if (billingModel === 'custom') {
            return planName === 'Performance';
        }
        return planName === 'Croissance';
    }


    const CurrentPlanCard = () => {
        if (billingModel === 'custom') {
            return (
                <Card>
                    <CardHeader>
                        <CardTitle>Forfait Annuel sur Mesure</CardTitle>
                        <CardDescription>Votre plan actuel est inclus dans vos honoraires de tenue comptable, vous donnant accès à toutes les fonctionnalités.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 text-sm p-4 rounded-lg bg-muted border">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
                                <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="font-bold text-2xl text-foreground">{currentMonthDocs.toLocaleString()}</p>
                                <p className="text-muted-foreground">documents traités ce mois-ci (inclus dans votre forfait).</p>
                            </div>
                        </div>
                         <p className="text-xs text-muted-foreground text-center pt-2">L'utilisation de la plateforme, incluant le traitement des documents et l'analyse, est comprise dans votre bilan annuel. Vous bénéficiez de toutes les fonctionnalités sans limite de volume.</p>
                    </CardContent>
                </Card>
            )
        }
        
        // Default view for subscription-based clients
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Consommation actuelle</CardTitle>
                    <CardDescription>Votre utilisation pour le mois en cours, basée sur votre forfait.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <p className="font-medium">Forfait actuel : <span className="text-primary">Croissance</span></p>
                        <p className="text-muted-foreground">Votre cycle se renouvelle le 1er du mois prochain.</p>
                    </div>
                    <div>
                         <div className="flex justify-between items-end mb-1">
                             <h3 className="font-semibold">{currentMonthDocs.toLocaleString()} / {docLimit.toLocaleString()} documents</h3>
                             <p className="text-sm font-bold text-primary">{usagePercentage.toFixed(0)}%</p>
                         </div>
                        <Progress value={usagePercentage} className="h-3" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">Facturation et Forfait</h1>
                <p className="text-muted-foreground mt-1">Gérez votre abonnement et suivez votre consommation.</p>
            </div>
            
            <CurrentPlanCard />

            <div className="space-y-4">
                <div className="text-center pt-8">
                    <h2 className="text-2xl font-bold tracking-tight">Découvrez nos autres forfaits</h2>
                    <p className="text-muted-foreground mt-1">Passez à un forfait supérieur à tout moment pour débloquer plus de fonctionnalités.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {plans.map(plan => (
                       <Card key={plan.name} className={`flex flex-col ${isCurrentPlan(plan.name) ? 'border-primary ring-2 ring-primary' : ''} ${plan.isPopular && !isCurrentPlan(plan.name) ? 'relative' : ''}`}>
                            {plan.isPopular && !isCurrentPlan(plan.name) && <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center"><div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1"><Star className="h-3 w-3"/> Populaire</div></div>}
                            <CardHeader className="pt-8">
                                <CardTitle>{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-6">
                                <div className="text-4xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">{plan.name !== 'Performance' && '/mois'}</span></div>
                                <ul className="space-y-3">
                                    {plan.features.map(feature => (
                                        <li key={feature} className="flex items-start gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" disabled={isCurrentPlan(plan.name)}>
                                    {isCurrentPlan(plan.name) ? 'Votre forfait actuel' : 'Choisir ce forfait'}
                                </Button>
                            </CardFooter>
                       </Card>
                   ))}
                </div>
            </div>
        </div>
    );
}
