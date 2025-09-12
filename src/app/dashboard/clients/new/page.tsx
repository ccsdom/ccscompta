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
import { Copy } from "lucide-react";


export default function NewClientPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // This state is now used for pre-filling from search.
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
        // Important: Create user in Firebase Auth first, then create client in Firestore.
        // For this demo, we assume the user is created manually in the Firebase Console
        // and we are just adding the client profile to Firestore.

        const result = await addClient(data);

        if (result.success) {
             toast({
                duration: 20000,
                title: "Client ajouté avec succès !",
                description: `Le profil pour ${result.data.name} a été créé. Vous devez maintenant créer un utilisateur correspondant dans Firebase Authentication avec l'email ${result.data.email} pour qu'il puisse se connecter.`,
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
             // We'll just reload the page with new query params to repopulate the form
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
                key={initialData?.siret || 'new'} // Re-mount form when data changes
                onSave={handleSave} 
                isSubmitting={isSubmitting} 
                initialData={initialData}
            />
        </div>
    )
}
