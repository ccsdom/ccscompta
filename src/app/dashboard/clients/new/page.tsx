
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
import { auth, db } from '@/lib/firebase-client';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';


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
        const password = 'password';
        
        try {
            // Step 1: Create user in Firebase Auth (client-side)
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, password);
            const user = userCredential.user;

            // Step 2: Create profile in Firestore (client-side)
            const { ...profileData } = data;
             const clientDocRef = doc(db, 'clients', user.uid);
             const newUser: Omit<Client, 'id'| 'uid'> = {
                ...profileData,
                newDocuments: 0,
                lastActivity: new Date().toISOString(),
                status: 'onboarding',
            };

            const cleanUser = Object.fromEntries(
                Object.entries(newUser).filter(([_, v]) => v !== undefined && v !== null && v !== '')
            );

            await setDoc(clientDocRef, cleanUser);

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
                                Le mot de passe initial de l'utilisateur est : <strong>{password}</strong>
                            </AlertDescription>
                        </Alert>
                        <p className="text-xs text-muted-foreground">Note: Pour assigner un rôle (Comptable, Admin), vous devez déployer les Cloud Functions et utiliser l'option dans les paramètres.</p>
                    </div>
                ),
            });
            
            router.push('/dashboard/clients');
            router.refresh();
            
        } catch (error: any) {
            console.error("Failed to add user:", error);
            let errorMessage = "Une erreur est survenue lors de la création de l'utilisateur.";
             if (error.code === 'auth/email-already-exists') {
                errorMessage = 'Un compte avec cette adresse email existe déjà.';
            } else if (error.code === 'auth/invalid-password') {
                errorMessage = `Le mot de passe fourni n'est pas valide. Il doit comporter au moins 6 caractères.`;
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
