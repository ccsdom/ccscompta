
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wand2, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { extractClientData } from '@/ai/flows/extract-client-data-flow';
import { Label } from './ui/label';

interface AiClientDialogProps {
    isMenuItem?: boolean;
}

export function AiClientDialog({ isMenuItem }: AiClientDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleExtractAndCreate = async () => {
        if (!searchTerm.trim()) {
            toast({
                variant: 'destructive',
                title: 'Champ vide',
                description: 'Veuillez entrer un nom d\'entreprise ou un SIRET.'
            });
            return;
        }

        setIsLoading(true);
        try {
            // The flow is smart enough to handle either a name or a SIRET
            const extractedData = await extractClientData({ searchTerm: searchTerm });

            if (!extractedData.name && !extractedData.siret) {
                 toast({
                    variant: 'destructive',
                    title: 'Aucune information trouvée',
                    description: 'L\'IA n\'a pas pu trouver de données pour ce terme. Veuillez vérifier et réessayer.'
                });
                setIsLoading(false);
                return;
            }

            const queryParams = new URLSearchParams();
            for (const [key, value] of Object.entries(extractedData)) {
                if (value) {
                    queryParams.append(key, String(value));
                }
            }
            
            router.push(`/dashboard/clients/new?${queryParams.toString()}`);
            setIsOpen(false);
            setSearchTerm('');

        } catch (error) {
            console.error("Failed to extract client data:", error);
            toast({
                variant: 'destructive',
                title: 'Erreur de recherche',
                description: 'L\'IA n\'a pas pu trouver les informations. Vérifiez le nom ou le SIRET et réessayez.'
            });
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleExtractAndCreate();
        }
    }

    const TriggerComponent = isMenuItem ? 'div' : Button;
    const triggerProps = isMenuItem ? {
        className: "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        children: <><Wand2 className="mr-2 h-4 w-4" />Ajout Rapide par IA</>
    } : {
        variant: "outline",
        children: <><Wand2 className="mr-2 h-4 w-4" />Ajout Rapide par IA</>
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <TriggerComponent {...triggerProps} />
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Création de Client par IA</DialogTitle>
                    <DialogDescription>
                        Entrez le nom de l'entreprise ou son numéro de SIRET. L'IA recherchera les informations officielles pour pré-remplir le formulaire.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                   <div className="space-y-2">
                     <Label htmlFor="search-term">Nom ou SIRET de l'entreprise</Label>
                     <Input
                       id="search-term"
                       placeholder="Ex: Innovatech SAS ou 12345678901234"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       onKeyDown={handleKeyDown}
                       disabled={isLoading}
                     />
                   </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isLoading}>Annuler</Button>
                    <Button type="button" onClick={handleExtractAndCreate} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Recherche en cours...
                            </>
                        ) : (
                            'Rechercher et Créer'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

    

    