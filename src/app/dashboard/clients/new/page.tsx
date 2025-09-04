
'use client'

import { ClientForm } from "../client-form";
import { addClient } from '@/ai/flows/client-actions';
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type * as z from "zod";
import { type formSchema } from '../client-form';

export default function NewClientPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleSave = async (data: z.infer<typeof formSchema>) => {
        const result = await addClient(data);

        if (result.success) {
            toast({
                title: "Client ajouté",
                description: `Le nouveau client "${result.data.name}" a été créé avec succès.`
            });
            router.push('/dashboard/clients');
            router.refresh();
        } else {
            console.error("Failed to add client:", result.error);
            toast({
                variant: 'destructive',
                title: "Erreur lors de l'ajout du client",
                description: result.error
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
