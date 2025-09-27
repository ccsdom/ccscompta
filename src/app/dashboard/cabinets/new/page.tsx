
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { addCabinet } from '@/ai/flows/cabinet-actions';

const formSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: "Adresse email invalide." }).optional().or(z.literal('')),
});

export default function NewCabinetPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            address: "",
            phone: "",
            email: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        const result = await addCabinet(values);
        if (result.success) {
            toast({
                title: "Cabinet créé",
                description: `Le cabinet "${values.name}" a été ajouté avec succès.`,
            });
            router.push('/dashboard/cabinets');
            router.refresh();
        } else {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: result.error,
            });
        }
        setIsSubmitting(false);
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Nouveau Cabinet</h1>
                <p className="text-muted-foreground mt-1">Créez un nouveau cabinet comptable sur la plateforme.</p>
            </div>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations du Cabinet</CardTitle>
                            <CardDescription>Renseignez les détails du nouveau cabinet comptable.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Nom du cabinet</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Fidu-Conseil" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Adresse</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="123 Rue de la Comptabilité, 75001 Paris" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Email de contact</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="contact@fidu-conseil.com" {...field} />
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
                        </CardContent>
                        <CardFooter className="border-t p-6 flex justify-end gap-2">
                            <Button variant="ghost" type="button" onClick={() => router.push('/dashboard/cabinets')}>Annuler</Button>
                            <Button type="submit" disabled={isSubmitting}>Enregistrer</Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    );
}
