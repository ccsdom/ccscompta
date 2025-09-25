
'use client'

import { ClientForm, formSchema } from "../client-form";
import { addClient } from '@/ai/flows/client-actions';
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type * as z from "zod";
import { useState, useEffect } from "react";
import { CompanySearchCombobox } from "@/components/company-search-combobox";
import { type ExtractClientDataOutput } from '@/ai/flows/extract-client-data-flow';
import { useSearchParams } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { KeyRound } from "lucide-react";


export default function NewClientPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [initialData, setInitialData] = useState<Partial<z.infer<typeof formSchema>>>({});

    useEffect(() => {
        const data: Partial<z.infer<typeof formSchema>> = {};
        searchParams.forEach((value, key) => {
            if (key in formSchema.shape) {
                data[key as keyof typeof data] = value;
            }
        });
        setInitialData(data);
    }, [searchParams]);

    const handleSave = async (data: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        const result = await addClient(data);

        if (result.success) {
             toast({
                duration: 20000,
                title: "Client et compte créés avec succès !",
                description: (
                    <div className="space-y-4">
                        <p>Le profil pour <strong>{result.data.name}</strong> a été créé.</p>
                         <Alert variant="default" className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800">
                            <KeyRound className="h-4 w-4" />
                            <AlertTitle>Informations de connexion</AlertTitle>
                            <AlertDescription>
                              <p>Un compte a été créé avec l'email : <strong>{result.data.email}</strong></p>
                              <p>Le mot de passe initial est le SIRET : <strong>{result.data.password}</strong></p>
                            </AlertDescription>
                        </Alert>
                    </div>
                ),
            });
            router.push('/dashboard/clients');
        } else {
            console.error("Failed to add client:", result.error);
            toast({
                variant: 'destructive',
                title: "Erreur lors de l'ajout du client",
                description: result.error
            });
        }
        setIsSubmitting(false);
    }
    
    const handleCompanySelect = (company: ExtractClientDataOutput | null) => {
        if (company) {
             const queryParams = new URLSearchParams();
             Object.entries(company).forEach(([key, value]) => {
                if(value) queryParams.set(key, value);
             });
             router.replace(`/dashboard/clients/new?${queryParams.toString()}`);
        } else {
            router.replace('/dashboard/clients/new');
        }
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Nouveau Client</h1>
                <p className="text-muted-foreground mt-1">Recherchez une entreprise pour pré-remplir les informations ou saisissez-les manuellement.</p>
            </div>
             <div className="mb-6 max-w-lg">
                <CompanySearchCombobox onCompanySelect={handleCompanySelect} />
            </div>
            <ClientForm 
                key={initialData?.siret || 'new'}
                onSave={handleSave} 
                isSubmitting={isSubmitting} 
                initialData={initialData}
            />
        </div>
    )
}
