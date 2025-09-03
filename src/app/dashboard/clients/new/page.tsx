
'use client'

import { ClientForm } from "../client-form";
import { addClient } from '@/lib/client-data';
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { Client } from "../page";
import type * as z from "zod";
import { type formSchema } from '../client-form';

export default function NewClientPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleSave = async (data: z.infer<typeof formSchema>) => {
        try {
            const newClient = await addClient(data as Omit<Client, 'id' | 'newDocuments' | 'lastActivity'>);
            toast({
                title: "Client ajouté",
                description: `Le nouveau client "${newClient.name}" a été créé avec succès.`
            });
            router.push('/dashboard/clients');
        } catch (error) {
            console.error("Failed to add client:", error);
            toast({
                variant: 'destructive',
                title: "Erreur",
                description: "Impossible d'ajouter le nouveau client."
            });
        }
    }


    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Nouveau Client</h1>
                <p className="text-muted-foreground mt-1">Remplissez les informations ci-dessous pour créer un nouveau dossier client.</p>
            </div>
            <ClientForm onSave={handleSave} />
        </div>
    )
}
