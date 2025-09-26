
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
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth as clientAuth, db } from "@/lib/firebase-client";
import { doc, setDoc } from 'firebase/firestore';


const formSchema = baseFormSchema;

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
        
        let password = 'password';
        if (data.role === 'client') {
            if (data.siret && data.siret.length === 14) {
                password = data.siret;
            } else {
                 toast({ variant: 'destructive', title: 'Erreur de validation', description: "Le SIRET est requis et doit comporter 14 chiffres pour créer un compte client." });
                 setIsSubmitting(false);
                 return;
            }
        }
        
        try {
            // Step 1: Create user in Firebase Auth (Client-side)
            const userCredential = await createUserWithEmailAndPassword(clientAuth, data.email, password);
            const user = userCredential.user;

            // Step 2: Create user profile in Firestore (Client-side)
            const profileData: Omit<Client, 'id' | 'password'> = {
                ...data,
                newDocuments: 0,
                lastActivity: new Date().toISOString(),
                status: 'onboarding' as const,
            };
            
            // Explicitly remove the field if it's undefined or not to be sent
            if (!profileData.assignedAccountantId) {
                delete (profileData as Partial<typeof profileData>).assignedAccountantId;
            }
            
            await setDoc(doc(db, 'clients', user.uid), profileData);

            // Step 3 (Server Action for Custom Claims): This sets the role in Auth token
            const claimResult = await addClient(data);
            if (!claimResult.success) {
                 console.warn(`Failed to set custom claim for ${data.email}: ${claimResult.error}`);
                 toast({
                    variant: 'destructive',
                    title: 'Attention : Rôle non assigné',
                    description: "Le compte a été créé, mais le rôle n'a pas pu être assigné automatiquement. L'accès pourrait être limité jusqu'à une intervention manuelle.",
                    duration: 10000,
                 });
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
                                Le mot de passe initial de l'utilisateur est : <strong>{password}</strong>.
                            </AlertDescription>
                        </Alert>
                    </div>
                ),
            });
            router.push('/dashboard/clients');
            
        } catch (error: any) {
            console.error("Failed to add user:", error);
            let errorMessage = "Une erreur est survenue lors de la création de l'utilisateur.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "Un compte utilisateur avec cet email existe déjà. Veuillez utiliser un autre email.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Le mot de passe est trop faible. Il doit contenir au moins 6 caractères.";
            } else if (error.message) {
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
