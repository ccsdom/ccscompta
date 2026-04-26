'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getCabinetById } from '@/ai/flows/cabinet-actions';
import type { Cabinet, Client } from '@/lib/types';
import { PlusCircle, Users, Briefcase, Building, ChevronLeft, Mail, ShieldCheck, UserPlus, Search, ArrowRight, Activity } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const getStatusBadge = (status: string) => {
    switch(status) {
        case 'active': 
            return <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 py-1 font-space font-black uppercase text-[9px] tracking-widest">Actif</Badge>
        case 'inactive': 
            return <Badge variant="outline" className="border-white/10 text-muted-foreground px-3 py-1 font-space font-black uppercase text-[9px] tracking-widest">Inactif</Badge>
        case 'onboarding': 
            return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-none px-3 py-1 font-space font-black uppercase text-[9px] tracking-widest">Intégration</Badge>
        default: 
            return <Badge variant="outline" className="border-white/10 px-3 py-1 font-space font-black uppercase text-[9px] tracking-widest">{status}</Badge>
    }
}

const UserTable = ({ users }: { users: Client[] }) => {
    const router = useRouter();
    return (
        <div className="glass-panel border-none overflow-hidden premium-shadow-sm rounded-2xl">
            <Table>
                <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                        <TableHead className="font-space font-black uppercase text-[10px] tracking-widest pl-6">Profil</TableHead>
                        <TableHead className="font-space font-black uppercase text-[10px] tracking-widest">Contact</TableHead>
                        <TableHead className="font-space font-black uppercase text-[10px] tracking-widest">Statut</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.length > 0 ? users.map((user, idx) => (
                        <motion.tr 
                            key={user.id || `user-${idx}`} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group cursor-pointer border-white/5 hover:bg-white/5 transition-colors" 
                            onClick={() => router.push(`/dashboard/clients/${user.id}/edit`)}
                        >
                            <TableCell className="pl-6 py-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border-none bg-primary/10">
                                        <AvatarFallback className="text-[10px] font-black font-space">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm tracking-tight">{user.name}</span>
                                        <span className="text-[10px] font-space font-black uppercase tracking-widest opacity-40">ID {user.id.slice(0, 8)}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                                    <Mail className="h-3.5 w-3.5 opacity-40" />
                                    <span className="text-xs font-medium">{user.email}</span>
                                </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(user.status)}</TableCell>
                            <TableCell className="text-right pr-6">
                                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-40 transition-all group-hover:translate-x-1" />
                            </TableCell>
                        </motion.tr>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-32 text-center">
                                <div className="flex flex-col items-center justify-center space-y-2 opacity-30">
                                    <Search className="h-8 w-8" />
                                    <p className="font-space font-black uppercase text-[10px] tracking-widest">Aucun résultat</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

export default function ManageCabinetPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const [cabinet, setCabinet] = useState<Cabinet | null>(null);
    const [loadingCabinet, setLoadingCabinet] = useState(true);

    const usersQuery = useMemoFirebase(() => {
        if (!params.id) return null;
        return query(collection(db, 'clients'), where('cabinetId', '==', params.id));
    }, [params.id]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<Client>(usersQuery);

    useEffect(() => {
        if (params.id) {
            const fetchCabinet = async () => {
                setLoadingCabinet(true);
                const cabinetData = await getCabinetById(params.id);
                setCabinet(cabinetData);
                setLoadingCabinet(false);
            };
            fetchCabinet();
        }
    }, [params.id]);

    const { clients, team } = useMemo(() => ({
        clients: users?.filter(u => u.role === 'client') || [],
        team: users?.filter(u => u.role !== 'client') || [],
    }), [users]);

    if (loadingCabinet || isLoadingUsers) {
        return (
            <div className="space-y-12 max-w-7xl mx-auto p-4 md:p-6 pb-20">
                <div className="space-y-4">
                    <Skeleton className="h-4 w-32 bg-white/5" />
                    <Skeleton className="h-12 w-2/3 bg-white/5" />
                </div>
                <div className="grid grid-cols-1 gap-6">
                    <Skeleton className="h-[500px] w-full bg-white/5 rounded-[2.5rem]" />
                </div>
            </div>
        )
    }

    if (!cabinet) {
        return notFound();
    }
    
    return (
        <div className="space-y-10 p-4 md:p-8 max-w-7xl mx-auto pb-24">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    <Button 
                        variant="ghost" 
                        onClick={() => router.push('/dashboard/cabinets')}
                        className="group h-10 px-0 hover:bg-transparent text-muted-foreground hover:text-foreground font-space font-black uppercase text-[10px] tracking-widest transition-all"
                    >
                        <ChevronLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Retour à la liste
                    </Button>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Building className="h-5 w-5 text-primary" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black font-space tracking-tight truncate max-w-2xl">{cabinet.name}</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge className="bg-white/5 text-muted-foreground border-white/10 px-3 py-1 font-space font-black uppercase text-[10px] tracking-widest">
                                Cabinet ID: {cabinet.id.slice(0, 12)}...
                            </Badge>
                            <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                                <ShieldCheck className="h-3.5 w-3.5" /> Sécurisé par CCS Compta
                            </div>
                        </div>
                    </div>
                </motion.div>
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Button 
                        onClick={() => router.push(`/dashboard/clients/new?cabinetId=${cabinet.id}`)}
                        className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 font-space font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/20 gap-3 group"
                    >
                        <UserPlus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        Nouvel Utilisateur
                    </Button>
                </motion.div>
            </div>

            {/* Main Content Area */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="glass-panel border-none premium-shadow-lg overflow-hidden rounded-[2.5rem]">
                    <CardHeader className="p-8 pb-4">
                        <div className="flex justify-between items-center mb-6">
                            <div className="space-y-1">
                                <CardTitle className="text-2xl font-black font-space tracking-tight flex items-center gap-3">
                                    <Activity className="h-5 w-5 text-primary" />
                                    Gestion des Comptes
                                </CardTitle>
                                <CardDescription className="text-sm font-medium">Visualisez et modérez les accès associés à cette structure.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-8 pt-4">
                        <Tabs defaultValue="clients" className="w-full">
                            <TabsList className="bg-white/5 border-none p-1.5 h-14 rounded-2xl w-full max-w-md grid grid-cols-2 mb-8">
                                <TabsTrigger value="clients" className="rounded-xl font-space font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                                    <Users className="h-3.5 w-3.5" />
                                    Portefeuille Clients ({clients.length})
                                </TabsTrigger>
                                <TabsTrigger value="team" className="rounded-xl font-space font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                                    <Briefcase className="h-3.5 w-3.5" />
                                    Équipe Interne ({team.length})
                                </TabsTrigger>
                            </TabsList>
                            
                            <AnimatePresence mode="wait">
                                <TabsContent key="clients-content" value="clients" className="mt-0 ring-offset-0 focus-visible:ring-0">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <UserTable users={clients} />
                                    </motion.div>
                                </TabsContent>
                                <TabsContent key="team-content" value="team" className="mt-0 ring-offset-0 focus-visible:ring-0">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <UserTable users={team} />
                                    </motion.div>
                                </TabsContent>
                            </AnimatePresence>
                        </Tabs>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
