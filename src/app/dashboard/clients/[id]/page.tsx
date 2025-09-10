
'use client';

import { ClientForm, formSchema } from "../client-form";
import { notFound, useParams, useRouter } from 'next/navigation';
import { getClientById, updateClient } from "@/ai/flows/client-actions";
import type { Client } from "@/lib/client-data";
import { useEffect, useState } from "react";
import type * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";


export default function EditClientPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { toast } = useToast();
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (params.id) {
            const fetchClient = async () => {
                setLoading(true);
                // In our new client-side model, we get the client from localStorage
                try {
                    const localClientsRaw = localStorage.getItem('clients');
                    if (localClientsRaw) {
                        const localClients = JSON.parse(localClientsRaw) as Client[];
                        const foundClient = localClients.find(c => c.id === params.id);
                        setClient(foundClient || null);
                    }
                } catch (e) {
                    console.error("Failed to load client from localStorage", e);
                    setClient(null);
                }
                setLoading(false);
            };
            fetchClient();
        }
    }, [params.id]);

    const handleSave = async (data: z.infer<typeof formSchema>) => {
        if (!params.id) return;
        setIsSubmitting(true);
        
        // Client-side update
        try {
            const localClientsRaw = localStorage.getItem('clients');
            let clients = localClientsRaw ? JSON.parse(localClientsRaw) as Client[] : [];
            clients = clients.map(c => 
                c.id === params.id ? { ...c, ...data } : c
            );
            localStorage.setItem('clients', JSON.stringify(clients));
            window.dispatchEvent(new Event('storage')); // Notify other components

            toast({
                title: "Modifications enregistrées",
                description: `Les informations de ${data.name} ont été mises à jour.`
            });
            router.push('/dashboard/clients');

        } catch (error) {
             console.error("Failed to update client:", error);
            toast({
                variant: 'destructive',
                title: "Erreur",
                description: "Impossible de mettre à jour le client."
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
