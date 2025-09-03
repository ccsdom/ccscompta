
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Zap, Star } from 'lucide-react';
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
        isCurrent: true,
        isPopular: true,
    },
    {
        name: "Performance",
        price: "Sur devis",
        description: "Pour les grandes entreprises et les besoins personnalisés.",
        features: ["Documents illimités", "Automatisation avancée", "API & Intégrations", "Support dédié"],
        isCurrent: false,
    }
];


export default function BillingPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

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
             }
        };
        loadState();
        window.addEventListener('storage', loadState);
        return () => window.removeEventListener('storage', loadState);
    }, []);

    const currentMonthDocs = documents.filter(doc => {
        if (doc.clientId !== selectedClientId) return false;
        const uploadDate = new Date(doc.uploadDate.split('/').reverse().join('-'));
        const today = new Date();
        return uploadDate.getMonth() === today.getMonth() && uploadDate.getFullYear() === today.getFullYear();
    }).length;
    
    const docLimit = 200; // Based on "Croissance" plan
    const usagePercentage = Math.min((currentMonthDocs / docLimit) * 100, 100);

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">Facturation et Forfait</h1>
                <p className="text-muted-foreground mt-1">Gérez votre abonnement et suivez votre consommation.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Consommation actuelle</CardTitle>
                    <CardDescription>Votre utilisation pour le mois en cours.</CardDescription>
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

            <div className="space-y-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold tracking-tight">Choisissez le forfait qui vous convient</h2>
                    <p className="text-muted-foreground mt-1">Passez à un forfait supérieur à tout moment.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {plans.map(plan => (
                       <Card key={plan.name} className={`flex flex-col ${plan.isCurrent ? 'border-primary ring-2 ring-primary' : ''} ${plan.isPopular ? 'relative' : ''}`}>
                            {plan.isPopular && <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center"><div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1"><Star className="h-3 w-3"/> Populaire</div></div>}
                            <CardHeader className="pt-8">
                                <CardTitle>{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-6">
                                <div className="text-4xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">/mois</span></div>
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
                                <Button className="w-full" disabled={plan.isCurrent}>
                                    {plan.isCurrent ? 'Votre forfait actuel' : 'Choisir ce forfait'}
                                </Button>
                            </CardFooter>
                       </Card>
                   ))}
                </div>
            </div>
        </div>
    );
}

