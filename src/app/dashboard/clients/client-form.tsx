'use client'

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Client } from './page';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useRouter } from "next/navigation";


const formSchema = z.object({
  name: z.string().min(2, { message: "Le nom de l'entreprise doit contenir au moins 2 caractères." }),
  siret: z.string().length(14, { message: "Le SIRET doit contenir 14 chiffres." }).regex(/^\d+$/, { message: "Le SIRET ne doit contenir que des chiffres."}),
  email: z.string().email({ message: "Adresse email invalide." }),
  phone: z.string().min(10, { message: "Le numéro de téléphone doit contenir au moins 10 chiffres." }),
  legalRepresentative: z.string().min(2, { message: "Le nom du représentant doit contenir au moins 2 caractères." }),
  address: z.string().min(10, { message: "L'adresse doit contenir au moins 10 caractères." }),
  fiscalYearEndDate: z.string().regex(/^(3[01]|[12][0-9]|0[1-9])\/(1[0-2]|0[1-9])$/, { message: "Format de date invalide. Utilisez JJ/MM." }),
  status: z.enum(['active', 'inactive', 'onboarding']),
});


interface ClientFormProps {
    client?: Client;
    onSave: (data: z.infer<typeof formSchema>) => void;
}

export function ClientForm({ client, onSave }: ClientFormProps) {
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: client?.name || "",
            siret: client?.siret || "",
            email: client?.email || "",
            phone: client?.phone || "",
            legalRepresentative: client?.legalRepresentative || "",
            address: client?.address || "",
            fiscalYearEndDate: client?.fiscalYearEndDate || "",
            status: client?.status || 'onboarding',
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        onSave(values);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Raison Sociale</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Entreprise Alpha" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                             <FormField
                                control={form.control}
                                name="siret"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>SIRET</FormLabel>
                                    <FormControl>
                                        <Input placeholder="14 chiffres" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Adresse Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="contact@entreprise.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                             <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Téléphone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="01 23 45 67 89" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </div>
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Adresse du siège social</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="123 Rue de la Paix, 75001 Paris" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="legalRepresentative"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Nom du représentant légal</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Jean Dupont" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            <FormField
                                control={form.control}
                                name="fiscalYearEndDate"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Date de clôture de l'exercice</FormLabel>
                                    <FormControl>
                                        <Input placeholder="JJ/MM" {...field} />
                                    </FormControl>
                                     <FormDescription>
                                        Exemple: 31/12 pour une clôture au 31 décembre.
                                    </FormDescription>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </div>
                        <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Statut du dossier</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un statut" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="onboarding">Intégration</SelectItem>
                                            <SelectItem value="active">Actif</SelectItem>
                                            <SelectItem value="inactive">Inactif</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                    </CardContent>
                    <CardFooter className="border-t p-6 flex justify-end gap-2">
                        <Button variant="ghost" type="button" onClick={() => router.push('/dashboard/clients')}>Annuler</Button>
                        <Button type="submit">Enregistrer</Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    );
}
