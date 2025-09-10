
'use client'

import { ClientForm, formSchema } from "../client-form";
import { addClient } from '@/ai/flows/client-actions';
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type * as z from "zod";
import { useState } from "react";
import type { CompanySearchResult } from "@/ai/flows/search-company-flow";
import { CompanySearchCombobox } from "@/components/company-search-combobox";


export default function NewClientPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<CompanySearchResult | null>(null);

    const handleSave = async (data: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        const result = await addClient(data);

        if (result.success) {
            toast({
                title: "Client ajouté",
                description: `Le nouveau client "${result.data.name}" a été créé avec succès.`
            });
            // Store the new client in local storage so the list page can pick it up
            try {
                localStorage.setItem('newlyAddedClient', JSON.stringify(result.data));
            } catch (e) {
                console.error("Could not save new client to localstorage", e);
            }
            router.push('/dashboard/clients');
            router.refresh();
        } else {
            console.error("Failed to add client:", result.error);
            toast({
                variant: 'destructive',
                title: "Erreur lors de l'ajout du client",
                description: result.error
            });
            setIsSubmitting(false);
        }
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Nouveau Client</h1>
                <p className="text-muted-foreground mt-1">Recherchez une entreprise pour pré-remplir les informations ou saisissez-les manuellement.</p>
            </div>
             <div className="mb-6 max-w-lg">
                <CompanySearchCombobox onCompanySelect={setSelectedCompany} />
            </div>
            <ClientForm 
                key={selectedCompany?.siret} // Re-mount form when a company is selected
                onSave={handleSave} 
                isSubmitting={isSubmitting} 
                initialData={selectedCompany ? {
                    name: selectedCompany.name,
                    siret: selectedCompany.siret,
                    address: selectedCompany.address,
                    legalRepresentative: selectedCompany.legalRepresentative,
                } : {}}
            />
        </div>
    )
}
