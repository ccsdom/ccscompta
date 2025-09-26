
'use client'

import { ClientForm, formSchema as baseFormSchema } from "../client-form";
import { addClient } from '@/ai/flows/client-actions';
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import * as z from "zod";
import { useState, useEffect } from "react";
import { CompanySearchCombobox } from "@/components/company-search-combobox";
import { type ExtractClientDataOutput } from '@/ai/flows/extract-client-data-flow';
import { useSearchParams } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { KeyRound } from "lucide-react";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';


const formSchema = baseFormSchema;

export default function NewClientPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [initialData, setInitialData] = useState<Partial<z.infer<typeof formSchema>>>({});
    const [tempPassword, setTempPassword] = useState<string | null>(null);

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
        const isStaff = ['admin', 'accountant', 'secretary'].includes(data.role);
        const password = data.siret || (isStaff ? 'password' : 'password');
        setTempPassword(password);

        try {
            // 1. Create user in Firebase Auth (client-side)
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, password);
            const uid = userCredential.user.uid;

            // 2. Add profile to Firestore via server action
            const result = await addClient({ ...data, uid });

            if (result.success) {
                toast({
                    duration: 20000,
                    title: "Utilisateur créé avec succès !",
                    description: (
                        <div className="space-y-4">
                            <p>Le profil et le compte de connexion pour <strong>{result.data.name}</strong> ont été créés.</p>
                            <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
                                <KeyRound className="h-4 w-4" />
                                <AlertTitle>Informations de connexion</AlertTitle>
                                <AlertDescription>
                                <p>Le mot de passe initial de l'utilisateur est : <strong>{tempPassword || '******'}</strong>. Il sera invité à le changer lors de sa première connexion.</p>
                                </AlertDescription>
                            </Alert>
                        </div>
                    ),
                });
                router.push('/dashboard/clients');
            } else {
                // This case is less likely now but kept for robustness
                throw new Error(result.error);
            }
        } catch (error: any) {
            console.error("Failed to add user:", error);
            let errorMessage = error.message;
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "Un compte utilisateur avec cet email existe déjà.";
            }
            toast({
                variant: 'destructive',
                title: "Erreur lors de l'ajout de l'utilisateur",
                description: errorMessage
            });
        } finally {
            setIsSubmitting(false);
        }
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
                <h1 className="text-3xl font-bold tracking-tight">Nouvel Utilisateur</h1>
                <p className="text-muted-foreground mt-1">Créez un profil pour un client, un comptable ou un administrateur.</p>
            </div>
             <div className="mb-6 max-w-lg">
                <p className="text-sm font-medium mb-2">Recherche rapide d'entreprise (pour les clients)</p>
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

    
