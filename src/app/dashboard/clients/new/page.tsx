

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
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';


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
        
        const password = data.siret && data.siret.length === 14 
            ? data.siret 
            : data.password || `password${Math.floor(Math.random() * 1000)}`;
        
        try {
            // Step 1: Create user in Firebase Auth (Client-side)
            const userCredential = await createUserWithEmailAndPassword(clientAuth, data.email, password);
            const user = userCredential.user;

            // Step 2: Create profile in Firestore (Client-side)
            const { uid, ...profileData } = {
                ...data,
                id: user.uid,
                newDocuments: 0,
                lastActivity: new Date().toISOString(),
                status: 'onboarding' as const,
            };
            
             // Ensure optional fields are handled correctly
            const cleanProfileData = Object.fromEntries(
                Object.entries(profileData).filter(([_, v]) => v !== undefined && v !== null && v !== '')
            );

            await setDoc(doc(db, "clients", user.uid), cleanProfileData);

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
                        <p className="text-xs pt-2">Vous pouvez maintenant vous connecter avec ce compte et vous assigner le rôle "Admin" depuis la page des paramètres.</p>
                    </div>
                ),
            });
            router.push('/login');
            
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
