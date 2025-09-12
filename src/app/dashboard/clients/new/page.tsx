
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


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
             const tempPassword = result.data.password;
             toast({
                duration: 60000, // 1 minute
                title: "Client ajouté avec succès !",
                description: (
                    <div className="space-y-4">
                        <p>Le profil et le compte de connexion pour <strong>{result.data.name}</strong> ont été créés.</p>
                        <p className="font-semibold">Veuillez communiquer les identifiants suivants au client :</p>
                        <div className="space-y-2">
                             <div>
                                <Label htmlFor="email-toast">Email</Label>
                                <Input id="email-toast" readOnly value={result.data.email} />
                            </div>
                             <div>
                                <Label htmlFor="password-toast">Mot de Passe Temporaire</Label>
                                 <div className="flex gap-2">
                                    <Input id="password-toast" readOnly value={tempPassword} />
                                    <Button size="icon" variant="outline" onClick={() => {
                                        navigator.clipboard.writeText(tempPassword || '');
                                        toast({title: "Mot de passe copié !"});
                                    }}>
                                        <Copy className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>
                        </div>
                         <Alert variant="destructive">
                            <AlertTitle>Important</AlertTitle>
                            <AlertDescription>
                              Le client devra utiliser ce mot de passe temporaire pour sa première connexion. Il est fortement recommandé de changer ce mot de passe depuis les paramètres de son compte.
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
