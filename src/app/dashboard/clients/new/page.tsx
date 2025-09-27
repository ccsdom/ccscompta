
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
import { addClientProfile } from '@/ai/flows/client-actions';
import { auth } from '@/lib/firebase-client';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, type IdTokenResult } from 'firebase/auth';


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
            // Determine password
            let password = 'password'; // Default password for non-clients
            if (data.role === 'client' && data.siret) {
                password = data.siret;
            }

            // Step 1: Create user in Firebase Auth (client-side)
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, password);
            const user = userCredential.user;
            
            // Step 2: Call server action to create Firestore profile and set custom claim
            const profileResult = await addClientProfile({ ...data, uid: user.uid });

            if (!profileResult.success) {
                throw new Error(`Le profil a échoué: ${profileResult.error}`);
            }

            // Step 3: Sign in with the new user to get the custom claim and redirect properly
            const loginCredential = await signInWithEmailAndPassword(auth, data.email, password);
            const idTokenResult: IdTokenResult = await loginCredential.user.getIdTokenResult(true);
            const userRole = idTokenResult.claims.role || 'client';
            
            localStorage.setItem('userRole', userRole);
            localStorage.setItem('userName', loginCredential.user.displayName || data.name);
            localStorage.setItem('userEmail', loginCredential.user.email!);
            
            if (userRole === 'client') {
                localStorage.setItem('selectedClientId', loginCredential.user.uid);
            } else {
                localStorage.removeItem('selectedClientId');
            }

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
                    </div>
                ),
            });
            
             let targetPath: string;
            switch (userRole) {
                case 'admin': targetPath = '/dashboard/admin'; break;
                case 'accountant': targetPath = '/dashboard/accountant'; break;
                case 'secretary': targetPath = '/dashboard/secretary'; break;
                case 'client': targetPath = '/dashboard/my-documents'; break;
                default: targetPath = '/dashboard';
            }
            
            window.dispatchEvent(new Event('storage'));
            router.push(targetPath);
            
        } catch (error: any) {
            console.error("Failed to add user:", error);
            let errorMessage = "Une erreur est survenue lors de la création de l'utilisateur.";
            if (error.code === 'auth/email-already-in-use') {
                 errorMessage = 'Un compte avec cet email existe déjà.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'L\'adresse email est invalide.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Le mot de passe doit contenir au moins 6 caractères.';
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
