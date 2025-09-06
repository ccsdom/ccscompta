
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { extractClientData } from '@/ai/flows/extract-client-data-flow';

export function AiClientDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleExtractAndCreate = async () => {
        if (!description.trim()) {
            toast({
                variant: 'destructive',
                title: 'Description vide',
                description: 'Veuillez décrire le client à ajouter.'
            });
            return;
        }

        setIsLoading(true);
        try {
            const extractedData = await extractClientData({ description });

            const queryParams = new URLSearchParams();
            for (const [key, value] of Object.entries(extractedData)) {
                if (value) {
                    queryParams.append(key, String(value));
                }
            }
            
            router.push(`/dashboard/clients/new?${queryParams.toString()}`);
            setIsOpen(false);
            setDescription('');

        } catch (error) {
            console.error("Failed to extract client data:", error);
            toast({
                variant: 'destructive',
                title: 'Erreur d\'extraction',
                description: 'L\'IA n\'a pas pu extraire les informations. Essayez de reformuler.'
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button variant="outline">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Ajout Rapide par IA
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Création de Client par IA</DialogTitle>
                    <DialogDescription>
                        Décrivez le client que vous souhaitez ajouter en langage naturel. L'IA extraira les informations pour pré-remplir le formulaire de création.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                   <Textarea
                     placeholder="Ex: Ajoute le client 'Innovatech SAS', SIRET 12345678901234, représenté par Marie Dubois au 10 Rue de l'Innovation, 75015 Paris..."
                     rows={6}
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
                     disabled={isLoading}
                   />
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isLoading}>Annuler</Button>
                    <Button type="button" onClick={handleExtractAndCreate} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Extraction en cours...
                            </>
                        ) : (
                            'Extraire et Créer'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
