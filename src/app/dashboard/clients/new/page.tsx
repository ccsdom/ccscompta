
'use client'

import { ClientForm, formSchema } from "../client-form";
import { addClient } from '@/ai/flows/client-actions';
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type * as z from "zod";
import { useState, useEffect } from "react";
import { CompanySearchCombobox } from "@/components/company-search-combobox";
import { extractClientData, type ExtractClientDataOutput } from "@/ai/flows/extract-client-data-flow";


export default function NewClientPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [initialData, setInitialData] = useState<Partial<z.infer<typeof formSchema>>>({});
    const searchParams = useSearchParams();

    useEffect(() => {
        const queryData: Partial<z.infer<typeof formSchema>> = {};
        for (const [key, value] of searchParams.entries()) {
            if (value) {
                (queryData as any)[key] = value;
            }
        }
        if (Object.keys(queryData).length > 0) {
            setInitialData(queryData);
        }
    }, [searchParams]);

    const handleSave = async (data: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        const result = await addClient(data);

        if (result.success) {
            // Store the newly created client in localStorage to be picked up by the clients list page.
            try {
                const existingClients = JSON.parse(localStorage.getItem('clients') || '[]');
                localStorage.setItem('clients', JSON.stringify([...existingClients, result.data]));
                window.dispatchEvent(new Event('storage')); // Notify other tabs/windows
            } catch (e) {
                console.error("Could not write to localStorage", e);
            }

            toast({
                title: "Client ajouté",
                description: `Le nouveau client "${result.data.name}" a été créé avec succès.`
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
    
    const handleCompanySelect = async (company: ExtractClientDataOutput | null) => {
        if (company) {
             setInitialData({
                name: company.name ?? '',
                siret: company.siret ?? '',
                address: company.address ?? '',
                legalRepresentative: company.legalRepresentative ?? '',
            });
        } else {
            setInitialData({});
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
