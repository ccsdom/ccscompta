'use client';
 
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, FileUp, FileClock, Building, PlusCircle, Files, Search, ArrowRight, Activity, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Document, Client, AuditEvent, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase';
import { cn } from '@/lib/utils';

export default function SecretaryDashboard() {
    const [isMounted, setIsMounted] = useState(false);
    const { user } = useUser();
    
    // Fetch user profile for cabinet isolation
    const userProfileQuery = useMemo(() => user ? doc(db, 'users', user.uid) : null, [user]);
    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileQuery);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const userRole = userProfile?.role || null;
    const isStaff = isMounted && userRole && ['secretary', 'admin'].includes(userRole);
    const isAdmin = userRole === 'admin';
    const cabinetId = userProfile?.cabinetId;

    // Secured Queries
    const clientsQuery = useMemoFirebase(() => {
        if (!isStaff || !userProfile) return null;
        if (isAdmin) return query(collection(db, 'clients'), where('role', '==', 'client'));
        return query(
            collection(db, 'clients'), 
            where('role', '==', 'client'),
            where('cabinetId', '==', cabinetId)
        );
    }, [isStaff, isAdmin, cabinetId, userProfile]);
    
    const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);

    const documentsQuery = useMemoFirebase(() => {
        if (!isStaff || !userProfile) return null;
        if (isAdmin) return query(collection(db, 'documents'));
        return query(
            collection(db, 'documents'), 
            where('cabinetId', '==', cabinetId)
        );
    }, [isStaff, isAdmin, cabinetId, userProfile]);
    
    const { data: documents, isLoading: isLoadingDocuments } = useCollection<Document>(documentsQuery);

    const loading = !isMounted || isLoadingProfile || (isStaff && (isLoadingClients || isLoadingDocuments));

    const dashboardData = useMemo(() => {
        if (loading || !documents || !clients) return null;

        const today = new Date();
        const twentyFourHoursAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);

        const docsUploadedToday = documents.filter(d => {
            const uploadEvent = (d.auditTrail || []).find(e => e.action.includes('téléversé'));
            return uploadEvent && new Date(uploadEvent.date) >= twentyFourHoursAgo;
        }).length;
        
        const docsPendingReview = documents.filter(d => ['pending', 'reviewing', 'error'].includes(d.status)).length;
        
        const recentActivities = documents
            .flatMap(doc => {
                const client = clients.find(c => c.id === doc.clientId);
                return (doc.auditTrail || []).map(event => ({
                    ...event,
                    clientName: client?.name || 'Inconnu',
                    documentName: doc.name,
                }));
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);

        return {
            totalClients: clients.filter(c => c.status === 'active' && c.role === 'client').length,
            docsUploadedToday,
            docsPendingReview,
            recentActivities
        };
    }, [documents, clients, loading]);

    if (!isMounted || loading) {
        return (
             <div className="space-y-8 p-6 lg:p-10">
                <div className="space-y-2">
                    <Skeleton className="h-12 w-1/3 bg-primary/5" />
                    <Skeleton className="h-6 w-1/2 opacity-50" />
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-3xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Skeleton className="h-[500px] rounded-3xl" />
                    <Skeleton className="h-[500px] rounded-3xl" />
                </div>
            </div>
        )
    }

    if (!isStaff) {
         return (
            <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center p-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <Card className="glass-panel text-center p-8 border-destructive/20 shadow-2xl">
                         <CardHeader>
                            <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                                <Users className="h-10 w-10 text-destructive" />
                            </div>
                            <CardTitle className="text-3xl font-black tracking-tighter">Accès Restreint</CardTitle>
                            <CardDescription className="text-lg font-medium leading-relaxed mt-2">
                                Ce tableau de bord est exclusivement réservé au personnel administratif et au secrétariat.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <Button variant="outline" className="w-full h-12 rounded-2xl font-bold transition-all hover:scale-105" asChild>
                                <Link href="/dashboard">Retour au menu</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        )
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-10 p-6 lg:p-10 max-w-[1500px] mx-auto"
        >
            {/* Header Section */}
            <div className="space-y-2">
                <motion.h1 
                    className="text-5xl font-black tracking-tighter font-display gradient-text"
                    variants={itemVariants}
                >
                    Espace Secrétariat
                </motion.h1>
                <motion.p 
                    className="text-muted-foreground text-xl font-medium tracking-tight"
                    variants={itemVariants}
                >
                    Gestion administrative du cabinet • <span className="text-foreground/80 font-bold">{userProfile?.cabinetName || 'CCS Compta'}</span>
                </motion.p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[
                    { label: "Portefeuille Clients", value: dashboardData?.totalClients, sub: "Dossiers actifs", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", link: "/dashboard/clients" },
                    { label: "Flux Entrant", value: `+${dashboardData?.docsUploadedToday}`, sub: "Nouveaux documents (24h)", icon: FileUp, color: "text-primary", bg: "bg-primary/10", link: "/dashboard/documents?filter=today" },
                    { label: "En attente comptable", value: dashboardData?.docsPendingReview, sub: "Documents à traiter", icon: FileClock, color: "text-amber-500", bg: "bg-amber-500/10", link: "/dashboard/documents?filter=pending_review" }
                ].map((stat, i) => (
                    <Link key={i} href={stat.link}>
                        <motion.div variants={itemVariants}>
                            <Card className="glass-panel-hover group overflow-hidden border-border/40 hover:border-primary/50 transition-all duration-500">
                                <CardContent className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={cn("p-4 rounded-2xl transition-all duration-300 group-hover:scale-110 shadow-lg", stat.bg)}>
                                            <stat.icon className={cn("h-7 w-7", stat.color)} />
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground/0 group-hover:text-muted-foreground/100 transition-all duration-300 translate-x-2 group-hover:translate-x-0" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-black text-muted-foreground tracking-[0.2em] uppercase mb-1">{stat.label}</p>
                                        <h2 className="text-5xl font-black tracking-tighter">
                                            {stat.value}
                                        </h2>
                                        <p className="text-sm font-semibold text-muted-foreground pt-2 flex items-center gap-2">
                                            <Activity className="h-3 w-3" />
                                            {stat.sub}
                                        </p>
                                    </div>
                                </CardContent>
                                <div className="h-1 w-full bg-muted mt-auto">
                                    <motion.div 
                                        className={cn("h-full", stat.color.replace('text', 'bg'))}
                                        initial={{ width: 0 }}
                                        animate={{ width: '100%' }}
                                        transition={{ delay: 0.8 + (i * 0.2), duration: 1.5, ease: "circOut" }}
                                    />
                                </div>
                            </Card>
                        </motion.div>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activities Feed */}
                <motion.div variants={itemVariants}>
                    <Card className="glass-panel border-border/40 overflow-hidden min-h-[500px] flex flex-col">
                        <CardHeader className="p-8 border-b border-border/10 bg-muted/20">
                            <div className="flex items-center gap-3">
                                <Activity className="h-6 w-6 text-primary" />
                                <div>
                                    <CardTitle className="text-2xl font-black tracking-tight">Flux d'activités</CardTitle>
                                    <CardDescription className="font-bold">Derniers événements sur les dossiers</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1">
                            <div className="divide-y divide-border/5">
                                {dashboardData?.recentActivities.length && dashboardData.recentActivities.length > 0 ? (
                                    dashboardData.recentActivities.map((activity, index) => (
                                        <motion.div 
                                            key={index} 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + (index * 0.05) }}
                                            className="flex items-start gap-4 p-5 hover:bg-muted/30 transition-all cursor-default group"
                                        >
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background border shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform">
                                                <Building className="h-6 w-6 text-primary/70" />
                                            </div>
                                            <div className="space-y-1 overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-sm text-foreground truncate">{activity.clientName}</p>
                                                    <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(activity.date).toLocaleDateString('fr-FR')}</p>
                                                </div>
                                                <p className="text-sm font-medium text-muted-foreground line-clamp-1 group-hover:text-foreground transition-colors">{activity.action}</p>
                                                <p className="text-[10px] font-bold text-primary/60 truncate italic">{activity.documentName}</p>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-24 text-center px-10">
                                        <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                                            <Search className="h-8 w-8 text-muted-foreground/30" />
                                        </div>
                                        <h3 className="text-lg font-bold">Aucune activité récente</h3>
                                        <p className="text-muted-foreground font-medium">Les flux de vos clients apparaîtront ici dès qu'ils utiliseront l'application mobile.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        {dashboardData?.recentActivities.length && dashboardData.recentActivities.length > 0 && (
                            <div className="p-4 border-t border-border/10 bg-muted/5">
                                <Button variant="ghost" className="w-full font-bold text-xs" asChild>
                                    <Link href="/dashboard/documents">Voir tout le flux</Link>
                                </Button>
                            </div>
                        )}
                    </Card>
                </motion.div>

                {/* Command Center Actions */}
                <motion.div variants={itemVariants}>
                    <Card className="glass-panel border-border/40 shadow-2xl overflow-hidden h-full flex flex-col">
                         <CardHeader className="p-8 border-b border-border/10 bg-gradient-to-br from-primary/5 to-transparent">
                            <div className="flex items-center gap-3">
                                <Zap className="h-6 w-6 text-primary animate-pulse" />
                                <div>
                                    <CardTitle className="text-2xl font-black tracking-tight">Accès Rapides</CardTitle>
                                    <CardDescription className="font-bold">Actions prioritaires du secrétariat</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-4 flex-1">
                            <Link href="/dashboard/clients/new" className="block">
                                <div className="group p-5 rounded-3xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer shadow-sm hover:translate-y-[-2px]">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
                                            <PlusCircle className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl tracking-tight">Enrôler un Client</h3>
                                            <p className="text-sm font-semibold text-muted-foreground">Créer un nouveau compte client</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                <Link href="/dashboard/clients" className="h-full">
                                    <div className="h-full p-6 rounded-3xl border border-border/40 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-center flex flex-col items-center justify-center gap-3 group">
                                        <Users className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform" />
                                        <div className="space-y-0.5">
                                            <p className="font-black text-sm tracking-tight">Répertoire</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Tous les clients</p>
                                        </div>
                                    </div>
                                </Link>
                                <Link href="/dashboard/documents" className="h-full">
                                    <div className="h-full p-6 rounded-3xl border border-border/40 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-center flex flex-col items-center justify-center gap-3 group">
                                        <Files className="h-8 w-8 text-emerald-500 group-hover:scale-110 transition-transform" />
                                        <div className="space-y-0.5">
                                            <p className="font-black text-sm tracking-tight">Gestion</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Documents</p>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                            
                            <div className="mt-8 p-6 rounded-3xl bg-muted/20 border border-border/20">
                                <h4 className="text-sm font-black tracking-widest uppercase text-muted-foreground mb-4 opacity-50">Support & Aide</h4>
                                <p className="text-sm font-bold text-foreground/80 leading-relaxed">
                                    Besoin d'aide pour l'enrôlement ? Consultez le guide interactif dans les paramètres du cabinet.
                                </p>
                                <Button variant="link" className="p-0 h-auto mt-2 text-primary font-black text-xs uppercase" asChild>
                                    <Link href="/dashboard/settings">Documentation →</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}