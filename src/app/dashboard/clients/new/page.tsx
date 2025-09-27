

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
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth as clientAuth } from "@/lib/firebase-client";
import { addClient } from '@/ai/flows/client-actions';


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
        
        let password;
        if (data.role === 'client') {
            password = data.siret || `password${Math.floor(Math.random() * 1000)}`;
        } else {
            password = 'password';
        }
        
        try {
            // Step 1: Create user in Firebase Auth (Client-side)
            const userCredential = await createUserWithEmailAndPassword(clientAuth, data.email, password);
            const user = userCredential.user;

            // Step 2: Call server action to create profile and set claims
            const profileResult = await addClient({
                ...data,
                uid: user.uid,
            });

            if (!profileResult.success) {
                // This is a compensating action: if profile creation fails, we should ideally delete the auth user.
                // For now, we'll just throw the specific error.
                throw new Error(`Le compte a été créé, mais la création du profil a échoué: ${profileResult.error}`);
            }

            toast({
                duration: 10000,
                title: "Utilisateur créé avec succès !",
                description: (
                    <div className="space-y-2">
                        <p>Le profil et le compte de connexion pour <strong>{data.name}</strong> ont été créés.</p>
                         <Alert variant="default">
                            <KeyRound className="h-4 w-4" />
                            <AlertTitle>Mot de passe initial</AlertTitle>
                            <AlertDescription>
                                Le mot de passe initial de l'utilisateur est : <strong>{password}</strong>
                            </AlertDescription>
                        </Alert>
                    </div>
                ),
            });
            // Redirect back to the list of cabinets or clients
            if (data.cabinetId) {
                router.push(`/dashboard/cabinets/${data.cabinetId}`);
            } else {
                router.push('/dashboard/clients');
            }
            
        } catch (error: any) {
            console.error("Failed to add user:", error);
            let errorMessage = "Une erreur est survenue lors de la création de l'utilisateur.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "Un compte utilisateur avec cet email existe déjà. Veuillez supprimer l'ancien compte depuis la console Firebase ou utiliser un autre email.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Le mot de passe est trop faible. Il doit contenir au moins 6 caractères.";
            } else {
                errorMessage = error.message;
            }
            toast({
                variant: 'destructive',
                title: "Erreur lors de l'ajout",
                description: errorMessage
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
        // We only add, we don't remove if company is null
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
