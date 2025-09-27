
'use client'

import { ClientForm, formSchema } from "../client-form";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import * as z from "zod";
import { useState, useEffect } from "react";
import { CompanySearchCombobox } from "@/components/company-search-combobox";
import { type ExtractClientDataOutput } from '@/ai/flows/extract-client-data-flow';
import { useSearchParams } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { KeyRound } from "lucide-react";
import { getFunctions, httpsCallable, HttpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase-client";


export default function NewClientPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [initialData, setInitialData] = useState<Partial<z.infer<typeof formSchema>>>({});

    useEffect(() => {
        const data: Partial<z.infer<typeof formSchema>> = {
            role: 'client' // Default role
        };
        searchParams.forEach((value, key) => {
            if (key in formSchema.shape) {
                data[key as keyof typeof data] = value;
            }
        });
        setInitialData(data);
    }, [searchParams]);

    const handleSave = async (data: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        
        try {
            const functions = getFunctions(app, 'us-central1');
            const createUserWithRole: HttpsCallable<any, any> = httpsCallable(functions, 'createUserWithRole');
            
            // The password will be defaulted to 'password' on the server-side if not provided
            const result = await createUserWithRole({ ...data });

            toast({
                duration: 10000,
                title: "Utilisateur créé avec succès !",
                description: (
                    <div className="space-y-2">
                        <p>Le compte pour <strong>{data.name}</strong> a été créé.</p>
                         <Alert variant="default">
                            <KeyRound className="h-4 w-4" />
                            <AlertTitle>Mot de passe initial</AlertTitle>
                            <AlertDescription>
                                Le mot de passe initial de l'utilisateur est : <strong>password</strong>
                            </AlertDescription>
                        </Alert>
                    </div>
                ),
            });
            
            router.push('/dashboard/clients');
            router.refresh();
            
        } catch (error: any) {
            console.error("Failed to add user:", error);
            toast({
                variant: 'destructive',
                title: "Erreur lors de la création",
                description: error.message || "Une erreur inconnue est survenue."
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleCompanySelect = (company: ExtractClientDataOutput | null) => {
        const currentParams = new URLSearchParams(searchParams.toString());
        if (company) {
             Object.entries(company).forEach(([key, value]) => {
                if(value) currentParams.set(key, value);
             });
        } 
        router.replace(`/dashboard/clients/new?${currentParams.toString()}`);
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Nouvel Utilisateur</h1>
                <p className="text-muted-foreground mt-1">Créez un profil pour un client, un comptable ou un administrateur.</p>
            </div>
             <div className="mb-6 max-w-lg">
                <p className="text-sm font-medium mb-2">Recherche rapide d'entreprise (pour les clients)</p>
                <CompanySearchCombobox onCompanySelect={handleCompanySelect} />
            </div>
            <ClientForm 
                key={initialData?.siret || initialData?.cabinetId || 'new'}
                onSave={handleSave} 
                isSubmitting={isSubmitting} 
                initialData={initialData}
            />
        </div>
    )
}
