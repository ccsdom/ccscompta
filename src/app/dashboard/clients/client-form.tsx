
'use client'

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Cabinet, Client } from '@/lib/types';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { db } from "@/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, User, Mail, Phone, Building, Calendar, MapPin, Briefcase, Info, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

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

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="font-space font-black uppercase text-[10px] tracking-widest opacity-60">{title}</h3>
    </div>
);

import { useBranding } from "@/components/branding-provider";

export function ClientForm({ initialData, onSave, isSubmitting }: ClientFormProps) {
    const router = useRouter();
    const { role: userRole, profile, isLoading: isBrandingLoading } = useBranding();

    const isStaff = useMemo(() => userRole && ['admin', 'accountant', 'secretary'].includes(userRole), [userRole]);

    const accountantsQuery = useMemoFirebase(() => {
        if (!isStaff) return null;
        
        // If not admin, restrict to accountants in the SAME cabinet
        if (userRole !== 'admin' && profile?.cabinetId) {
            return query(
                collection(db, 'clients'), 
                where('role', '==', 'accountant'),
                where('cabinetId', '==', profile.cabinetId)
            );
        }
        
        return query(collection(db, 'clients'), where('role', '==', 'accountant'));
    }, [isStaff, userRole, profile?.cabinetId]);
    const { data: accountants } = useCollection<Client>(accountantsQuery);

    const cabinetsQuery = useMemoFirebase(() => {
        if (userRole === 'admin') {
            return query(collection(db, 'cabinets'));
        }
        return null;
    }, [userRole]);
    const { data: cabinets } = useCollection<Cabinet>(cabinetsQuery);

    // Auto-fill cabinetId if user is staff (non-admin)
    useEffect(() => {
        if (userRole && userRole !== 'admin' && profile?.cabinetId && !initialData?.cabinetId) {
            form.setValue('cabinetId', profile.cabinetId);
        }
    }, [userRole, profile?.cabinetId, initialData?.cabinetId]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            name: "",
            siret: "",
            email: "",
            phone: "",
            legalRepresentative: "",
            address: "",
            fiscalYearEndDate: "31/12",
            role: 'client',
            assignedAccountantId: "unassigned",
            cabinetId: "",
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] border-none premium-shadow-lg space-y-12">
                    {/* Section: Authentification et Rôle */}
                    <div className="space-y-6">
                        <SectionHeader icon={Shield} title="Identité & Accès" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-space font-black uppercase text-[10px] tracking-widest text-muted-foreground">Type d'Accès</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isStaff}>
                                            <FormControl>
                                                <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20">
                                                    <SelectValue placeholder="Sélectionner un rôle" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="glass-panel border-white/10 shadow-2xl rounded-xl">
                                                <SelectItem value="client">Client (Entreprise)</SelectItem>
                                                <SelectItem value="accountant">Comptable (Cabinet)</SelectItem>
                                                <SelectItem value="secretary">Secrétaire (Cabinet)</SelectItem>
                                                {userRole === 'admin' && <SelectItem value="admin">Administrateur (CCS)</SelectItem>}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage className="text-[10px] uppercase font-bold tracking-tighter" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-space font-black uppercase text-[10px] tracking-widest text-muted-foreground">
                                            {selectedRole === 'client' ? 'Raison Sociale' : 'Nom Complet'}
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative group">
                                                <Input 
                                                    className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20 pl-4 group-focus-within:border-primary/50 transition-all font-medium"
                                                    placeholder={selectedRole === 'client' ? 'Nom de l\'entreprise' : 'Prénom NOM'} 
                                                    {...field} 
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[10px] uppercase font-bold tracking-tighter" />
                                    </FormItem>
                                )}
                            />
                        </div>
                        
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-space font-black uppercase text-[10px] tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Mail className="h-3 w-3" /> Email de Connexion
                                    </FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="email" 
                                            className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20 transition-all font-medium"
                                            placeholder="contact@exemple.com" 
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormDescription className="text-[10px] opacity-40">
                                        Cette adresse servira d'identifiant unique.
                                    </FormDescription>
                                    <FormMessage className="text-[10px] uppercase font-bold tracking-tighter" />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Section: Coordonnées */}
                    <div className="space-y-6">
                        <SectionHeader icon={Info} title="Coordonnées & Fiscalité" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="siret"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-space font-black uppercase text-[10px] tracking-widest text-muted-foreground">Numéro SIRET</FormLabel>
                                        <FormControl>
                                            <Input 
                                                className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20 transition-all font-mono text-sm"
                                                placeholder="14 chiffres" 
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[10px] uppercase font-bold tracking-tighter" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-space font-black uppercase text-[10px] tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Phone className="h-3 w-3" /> Téléphone
                                        </FormLabel>
                                        <FormControl>
                                            <Input 
                                                className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20 transition-all"
                                                placeholder="01 23 45 67 89" 
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[10px] uppercase font-bold tracking-tighter" />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {selectedRole === 'client' && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-8 pt-4 overflow-hidden"
                            >
                                <div className="space-y-6">
                                    <SectionHeader icon={Building} title="Détails de l'Entreprise" />
                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-space font-black uppercase text-[10px] tracking-widest text-muted-foreground flex items-center gap-2">
                                                    <MapPin className="h-3 w-3" /> Siège Social
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea 
                                                        className="min-h-[100px] bg-white/5 border-white/10 rounded-xl focus:ring-primary/20 transition-all font-medium resize-none"
                                                        placeholder="Adresse complète" 
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[10px] uppercase font-bold tracking-tighter" />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <FormField
                                            control={form.control}
                                            name="legalRepresentative"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-space font-black uppercase text-[10px] tracking-widest text-muted-foreground">Mandataire Social</FormLabel>
                                                    <FormControl>
                                                        <Input 
                                                            className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20 transition-all"
                                                            placeholder="Gérant / Président" 
                                                            {...field} 
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-[10px] uppercase font-bold tracking-tighter" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="fiscalYearEndDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-space font-black uppercase text-[10px] tracking-widest text-muted-foreground flex items-center gap-2">
                                                        <Calendar className="h-3 w-3" /> Clôture Fiscale
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input 
                                                            className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20 transition-all"
                                                            placeholder="31/12" 
                                                            {...field} 
                                                        />
                                                    </FormControl>
                                                    <FormDescription className="text-[10px] opacity-40 italic">Format: JJ/MM</FormDescription>
                                                    <FormMessage className="text-[10px] uppercase font-bold tracking-tighter" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Section: Attribution Cabinet */}
                    {isStaff && (
                        <div className="space-y-6">
                            <SectionHeader icon={Briefcase} title="Rattachement & Responsabilité" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {userRole === 'admin' && (
                                    <FormField
                                        control={form.control}
                                        name="cabinetId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-space font-black uppercase text-[10px] tracking-widest text-muted-foreground">Cabinet Référent</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className={cn(
                                                            "h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20",
                                                            !field.value && "text-muted-foreground opacity-50"
                                                        )}>
                                                            <SelectValue placeholder="Aucun cabinet assigné" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="glass-panel border-white/10 shadow-2xl rounded-xl">
                                                        {(cabinets || []).map((cab) => (
                                                            <SelectItem key={cab.id} value={cab.id}>
                                                                {cab.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-[10px] uppercase font-bold tracking-tighter" />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                <FormField
                                    control={form.control}
                                    name="assignedAccountantId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-space font-black uppercase text-[10px] tracking-widest text-muted-foreground">Collaborateur en Charge</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20">
                                                        <SelectValue placeholder="Non attribué" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="glass-panel border-white/10 shadow-2xl rounded-xl">
                                                    <SelectItem value="unassigned">Non attribué</SelectItem>
                                                    {(accountants || []).map((acc) => (
                                                        <SelectItem key={acc.id} value={acc.id}>
                                                            {acc.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-[10px] uppercase font-bold tracking-tighter" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col md:flex-row items-center justify-end gap-6 pt-4">
                    <Button 
                        variant="ghost" 
                        type="button" 
                        onClick={() => router.back()}
                        className="h-14 px-8 rounded-2xl font-space font-black uppercase text-xs tracking-widest hover:bg-white/5"
                    >
                        <X className="mr-2 h-4 w-4" /> Annuler
                    </Button>
                    <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="h-14 px-12 rounded-2xl bg-primary hover:bg-primary/90 font-space font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/30 gap-3 group"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                                Création...
                            </span>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                Valider le Profil
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
