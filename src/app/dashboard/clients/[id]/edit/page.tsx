
'use client';

import { ClientForm, formSchema } from "../../client-form";
import { notFound, useParams, useRouter } from 'next/navigation';
import type { Client } from "@/lib/types";
import { useEffect, useState } from "react";
import type * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";


export default function EditClientPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { toast } = useToast();
    
    const clientRef = useMemoFirebase(() => params.id ? doc(db, 'clients', params.id) : null, [params.id]);
    const { data: client, isLoading: loading } = useDoc<Client>(clientRef);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async (data: z.infer<typeof formSchema>) => {
        if (!params.id) return;
        setIsSubmitting(true);
        
        try {
            const docRef = doc(db, 'clients', params.id);
            await updateDoc(docRef, data);
            
            toast({
                title: "Modifications enregistrées",
                description: `Les informations de ${data.name} ont été mises à jour.`
            });
            // Force a refresh of the clients list page by navigating
            router.push('/dashboard/clients');
            router.refresh(); 
        } catch (error) {
             console.error("Failed to update client:", error);
            toast({
                variant: 'destructive',
                title: "Erreur",
                description: `Impossible de mettre à jour le client.`
            });
        }
        
        setIsSubmitting(false);
    }

    if (loading) {
        return (
             <div>
                <div className="mb-6">
                    <Skeleton className="h-9 w-1/2" />
                    <Skeleton className="h-5 w-2/3 mt-2" />
                </div>
                <Card>
                    <CardContent className="p-6 space-y-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                    <CardFooter className="border-t p-6 flex justify-end gap-2">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-24" />
                    </CardFooter>
                </Card>
            </div>
        )
    }

    if (!client) {
        notFound();
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Modifier le Client</h1>
                <p className="text-muted-foreground mt-1">Mettez à jour les informations du dossier pour <span className="font-semibold text-foreground">{client.name}</span>.</p>
            </div>
            <ClientForm initialData={client} onSave={handleSave} isSubmitting={isSubmitting} />
        </div>
    )
}
