'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { addCabinet } from '@/ai/flows/cabinet-actions';
import { Building2, ArrowLeft, Send, Sparkles, MapPin, Mail, Phone, ShieldCheck } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-24">
            {/* Header/Breadcrumb */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
            >
                <Button 
                    variant="ghost" 
                    onClick={() => router.push('/dashboard/cabinets')}
                    className="group h-10 px-0 hover:bg-transparent text-muted-foreground hover:text-foreground font-space font-black uppercase text-[10px] tracking-widest transition-all"
                >
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Retour aux cabinets
                </Button>
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black font-space tracking-tight">Configuration Cabinet</h1>
                    </div>
                    <p className="text-muted-foreground text-lg font-medium">Déployez une nouvelle structure comptable sur votre infrastructure SaaS.</p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Card className="glass-panel border-none premium-shadow overflow-hidden rounded-[2.5rem]">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                            
                            <CardHeader className="p-8 pb-4 relative">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-2xl font-black font-space tracking-tighter">Profil du Partenaire</CardTitle>
                                        <CardDescription className="text-sm font-medium">Renseignez les détails d'identification de la structure.</CardDescription>
                                    </div>
                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-2 rounded-xl font-space font-black uppercase text-[10px] tracking-widest">
                                        <ShieldCheck className="h-3.5 w-3.5 mr-2" /> Vérification SaaS
                                    </Badge>
                                </div>
                            </CardHeader>
                            
                            <CardContent className="p-8 pt-4 space-y-8 relative">
                                {/* Nom du Cabinet */}
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                                                <FormLabel className="text-[10px] font-space font-black uppercase tracking-widest opacity-60">Dénomination Sociale</FormLabel>
                                            </div>
                                            <FormControl>
                                                <Input 
                                                    placeholder="Ex: Fidu-Conseil Expertise" 
                                                    {...field} 
                                                    className="h-14 rounded-2xl bg-white/5 border-none px-6 text-lg font-bold premium-shadow-sm focus-visible:ring-primary/50 transition-all"
                                                />
                                            </FormControl>
                                            <FormMessage className="font-space font-bold text-[10px] uppercase pl-2" />
                                        </FormItem>
                                    )}
                                />

                                {/* Adresse */}
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <MapPin className="h-4 w-4 text-primary/60" />
                                                <FormLabel className="text-[10px] font-space font-black uppercase tracking-widest opacity-60">Adresse du Siège</FormLabel>
                                            </div>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder="123 Rue de la Comptabilité, 75001 Paris" 
                                                    {...field} 
                                                    className="min-h-[120px] rounded-2xl bg-white/5 border-none p-6 text-base font-medium premium-shadow-sm focus-visible:ring-primary/50 transition-all resize-none"
                                                />
                                            </FormControl>
                                            <FormMessage className="font-space font-bold text-[10px] uppercase pl-2" />
                                        </FormItem>
                                    )}
                                />

                                {/* Contact Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Mail className="h-4 w-4 text-primary/60" />
                                                    <FormLabel className="text-[10px] font-space font-black uppercase tracking-widest opacity-60">Email Officiel</FormLabel>
                                                </div>
                                                <FormControl>
                                                    <Input 
                                                        type="email" 
                                                        placeholder="contact@cabinet.com" 
                                                        {...field} 
                                                        className="h-14 rounded-2xl bg-white/5 border-none px-6 font-semibold premium-shadow-sm focus-visible:ring-primary/50 transition-all"
                                                    />
                                                </FormControl>
                                                <FormMessage className="font-space font-bold text-[10px] uppercase pl-2" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Phone className="h-4 w-4 text-primary/60" />
                                                    <FormLabel className="text-[10px] font-space font-black uppercase tracking-widest opacity-60">Ligne Directe</FormLabel>
                                                </div>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="01 23 45 67 89" 
                                                        {...field} 
                                                        className="h-14 rounded-2xl bg-white/5 border-none px-6 font-semibold premium-shadow-sm focus-visible:ring-primary/50 transition-all"
                                                    />
                                                </FormControl>
                                                <FormMessage className="font-space font-bold text-[10px] uppercase pl-2" />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>

                            <CardFooter className="p-8 bg-white/5 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <div className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center">
                                        <Building2 className="h-5 w-5 opacity-40" />
                                    </div>
                                    <p className="text-xs font-medium max-w-[200px]">En enregistrant, vous activez l'instance cloud dédiée à ce cabinet.</p>
                                </div>
                                <div className="flex gap-4 w-full md:w-auto">
                                    <Button 
                                        variant="ghost" 
                                        type="button" 
                                        onClick={() => router.push('/dashboard/cabinets')}
                                        className="flex-1 md:flex-none h-14 px-8 rounded-2xl font-space font-black uppercase text-[10px] tracking-widest hover:bg-white/5"
                                    >
                                        Annuler
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="flex-1 md:flex-none h-14 px-12 rounded-2xl bg-primary hover:bg-primary/90 font-space font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/20 gap-3"
                                    >
                                        {isSubmitting ? (
                                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                                                <Sparkles className="h-5 w-5" />
                                            </motion.div>
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                        {isSubmitting ? "Déploiement..." : "Créer le Cabinet"}
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </form>
                </Form>
            </motion.div>
        </div>
    );
}
