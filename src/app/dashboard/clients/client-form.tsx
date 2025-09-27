
'use client'

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAccountants, getCabinets, type Accountant, type Cabinet } from '@/ai/flows/client-actions';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";


export const formSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  siret: z.string().length(14, { message: "Le SIRET doit contenir 14 chiffres." }).regex(/^\d+$/, { message: "Le SIRET ne doit contenir que des chiffres."}).optional().or(z.literal('')),
  email: z.string().email({ message: "Adresse email invalide." }),
  phone: z.string().optional(),
  legalRepresentative: z.string().optional(),
  address: z.string().optional(),
  fiscalYearEndDate: z.string().regex(/^(3[01]|[12][0-9]|0[1-9])\/(1[0-2]|0[1-9])$/, { message: "Format de date invalide. Utilisez JJ/MM." }).optional(),
  role: z.enum(['client', 'admin', 'accountant', 'secretary']),
  assignedAccountantId: z.string().optional(),
  cabinetId: z.string().optional(),
});


interface ClientFormProps {
    initialData?: Partial<z.infer<typeof formSchema>>;
    onSave: (data: z.infer<typeof formSchema>) => void;
    isSubmitting?: boolean;
}

export function ClientForm({ initialData, onSave, isSubmitting }: ClientFormProps) {
    const router = useRouter();
    const [accountants, setAccountants] = useState<Accountant[]>([]);
    const [cabinets, setCabinets] = useState<Cabinet[]>([]);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const [fetchedAccountants, fetchedCabinets] = await Promise.all([
                getAccountants(),
                getCabinets()
            ]);
            setAccountants(fetchedAccountants);
            setCabinets(fetchedCabinets);
        };
        fetchData();
        setUserRole(localStorage.getItem('userRole'));
    }, []);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            siret: initialData?.siret || "",
            email: initialData?.email || "",
            phone: initialData?.phone || "",
            legalRepresentative: initialData?.legalRepresentative || "",
            address: initialData?.address || "",
            fiscalYearEndDate: initialData?.fiscalYearEndDate || "31/12",
            role: initialData?.role || 'client',
            assignedAccountantId: initialData?.assignedAccountantId || "unassigned",
            cabinetId: initialData?.cabinetId || (cabinets.length > 0 ? cabinets[0].id : ""),
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const dataToSave = { ...values };
        if (dataToSave.assignedAccountantId === "unassigned") {
           delete (dataToSave as Partial<typeof dataToSave>).assignedAccountantId;
        }
        onSave(dataToSave);
    }
    
    const selectedRole = form.watch('role');

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardContent className="p-6 space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Rôle de l'utilisateur</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un rôle" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="client">Client</SelectItem>
                                            <SelectItem value="accountant">Comptable</SelectItem>
                                            <SelectItem value="secretary">Secrétaire</SelectItem>
                                            <SelectItem value="admin">Administrateur</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>{selectedRole === 'client' ? 'Raison Sociale' : 'Nom complet'}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={selectedRole === 'client' ? 'Ex: Entreprise Alpha' : 'Ex: Jean Dupont'} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </div>
                        
                         <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Adresse Email (pour la connexion)</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="contact@entreprise.com" {...field} />
                                </FormControl>
                                 <FormDescription>
                                    Cette adresse sera utilisée pour la connexion de l'utilisateur.
                                </FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                            />

                        {selectedRole === 'client' ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="siret"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>SIRET</FormLabel>
                                            <FormControl>
                                                <Input placeholder="14 chiffres" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Ce champ est obligatoire pour les clients.
                                            </FormDescription>
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
                            </>
                        ) : (
                             <p className="text-sm text-muted-foreground">Le mot de passe initial pour les employés est "password". Ils seront invités à le changer.</p>
                        )}


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                    control={form.control}
                                    name="assignedAccountantId"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Comptable Attribué</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner un comptable" />
                                            </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="unassigned">Non attribué</SelectItem>
                                                {accountants.map((acc) => (
                                                    <SelectItem key={acc.id} value={acc.id}>
                                                        {acc.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                             {userRole === 'admin' && (
                                 <FormField
                                        control={form.control}
                                        name="cabinetId"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Cabinet</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner un cabinet" />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {cabinets.map((cab) => (
                                                        <SelectItem key={cab.id} value={cab.id}>
                                                            {cab.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                Assigner cet utilisateur à un cabinet.
                                            </FormDescription>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                             )}
                        </div>
                    </CardContent>
                    <CardFooter className="border-t p-6 flex justify-end gap-2">
                        <Button variant="ghost" type="button" onClick={() => router.push('/dashboard/clients')}>Annuler</Button>
                        <Button type="submit" disabled={isSubmitting}>Enregistrer</Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    );
}
