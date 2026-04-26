
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
import { KeyRound, UserPlus, ChevronLeft, Search, Sparkles } from "lucide-react";
import { useAuth, errorEmitter, FirestorePermissionError } from "@/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function NewClientPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const clientAuth = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [initialData, setInitialData] = useState<Partial<z.infer<typeof formSchema>>>({});

    useEffect(() => {
        const data: Partial<z.infer<typeof formSchema>> = {
            role: 'client' // Default role
        };
        const cabinetId = searchParams.get('cabinetId');
        if (cabinetId) {
            data.cabinetId = cabinetId;
        }
        searchParams.forEach((value, key) => {
            if (key in formSchema.shape) {
                (data as any)[key] = value;
            }
        });
        setInitialData(data);
    }, [searchParams]);

    const handleSave = async (data: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        
        try {
            if (!clientAuth) {
                throw new Error("Le service d'authentification n'est pas prêt.");
            }
            
            const functions = getFunctions(getApp());
            const createUserFunc = httpsCallable(functions, 'createUserWithRole');
            const result = await createUserFunc(data)
                .catch((error) => {
                    if (error.code === 'permission-denied' || error.message.includes('permission-denied')) {
                        const permissionError = new FirestorePermissionError({
                            path: 'clients/{newUserId}',
                            operation: 'create',
                            requestResourceData: data,
                        });
                        errorEmitter.emit('permission-error', permissionError);
                    }
                    throw error;
                });

            const resultData = result.data as { success: boolean; message: string; };

             if (!resultData.success) {
                throw new Error(resultData.message || 'Une erreur inconnue est survenue.');
            }

            toast({
                duration: 10000,
                title: "Utilisateur créé avec succès !",
                description: (
                    <div className="space-y-2">
                        <p>Le compte pour <strong>{data.name}</strong> a été créé.</p>
                         <Alert variant="default" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-500">
                            <KeyRound className="h-4 w-4" />
                            <AlertTitle className="font-space font-black uppercase text-[10px] tracking-widest">Mot de passe envoyé</AlertTitle>
                            <AlertDescription className="text-xs">
                                L'utilisateur recevra ses accès sous peu. Mot de passe initial : <strong>password</strong>
                            </AlertDescription>
                        </Alert>
                    </div>
                ),
            });
            
            router.push('/dashboard/clients');
            router.refresh();
            
        } catch (error: any) {
            console.error("Failed to add user:", error);
            const errorMessage = error.details?.message || error.message || "Une erreur inconnue est survenue.";
            toast({
                variant: 'destructive',
                title: "Erreur lors de la création",
                description: errorMessage
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleCompanySelect = (company: ExtractClientDataOutput | null) => {
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
        if (company) {
             Object.entries(company).forEach(([key, value]) => {
                if(value) currentParams.set(key, value);
             });
        } 
        router.replace(`/dashboard/clients/new?${currentParams.toString()}`);
    }

    return (
        <div className="space-y-10 p-4 md:p-8 max-w-5xl mx-auto pb-24">
            {/* Header section */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
            >
                <Button 
                    variant="ghost" 
                    onClick={() => router.back()}
                    className="group h-10 px-0 hover:bg-transparent text-muted-foreground hover:text-foreground font-space font-black uppercase text-[10px] tracking-widest transition-all"
                >
                    <ChevronLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Retour
                </Button>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <UserPlus className="h-5 w-5 text-primary" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black font-space tracking-tight">Nouvel Utilisateur</h1>
                    </div>
                    <p className="text-muted-foreground font-medium max-w-2xl">Configurez un nouvel accès pour un membre de votre équipe ou pour un client externe.</p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 gap-10"
            >
                {/* Search Assist */}
                <div className="glass-panel p-8 rounded-[2rem] border-none premium-shadow-sm space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Search className="h-4 w-4 text-primary" />
                        <h2 className="font-space font-black uppercase text-[10px] tracking-widest opacity-60">Assistant Creation Rapide</h2>
                    </div>
                    <p className="text-sm font-medium">Recherchez une entreprise pour pré-remplir les données (Siren/Siret, adresse...).</p>
                    <div className="max-w-md">
                        <CompanySearchCombobox onCompanySelect={handleCompanySelect} />
                    </div>
                </div>

                {/* Main Form */}
                <ClientForm 
                    key={initialData?.siret || initialData?.cabinetId || 'new'}
                    onSave={handleSave} 
                    isSubmitting={isSubmitting} 
                    initialData={initialData}
                />
            </motion.div>
        </div>
    )
}
