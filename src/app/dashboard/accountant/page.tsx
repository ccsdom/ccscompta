'use client';
 
import { useState, useEffect, useMemo } from 'react';
import { useBranding } from '@/components/branding-provider';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, FileUp, FileCheck, FileClock, Building, History as HistoryIcon, FileSpreadsheet, TrendingUp, ArrowUpRight, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Document, Client, AuditEvent, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useMemoFirebase } from '@/firebase';
import { db } from '@/firebase';
import { collection, query, orderBy, limit, where, doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function AccountantDashboard() {
    const [isMounted, setIsMounted] = useState(false);
    const { profile: userProfile, cabinet, isLoading: isLoadingProfile } = useBranding();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const userRole = userProfile?.role || null;
    const isStaff = isMounted && userRole && (['accountant', 'admin', 'secretary'].includes(userRole));
    const isAdmin = userRole === 'admin';
    const cabinetId = userProfile?.cabinetId;

    // Secured Queries
    const clientsQuery = useMemoFirebase(() => {
        if (!isStaff || !userProfile) return null;
        if (isAdmin) return query(collection(db, 'clients'), where('role', '==', 'client'));
        if (!cabinetId) return null;
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
        if (!cabinetId) return null;
        return query(
            collection(db, 'documents'), 
            where('cabinetId', '==', cabinetId)
        );
    }, [isStaff, isAdmin, cabinetId, userProfile]);
    
    const { data: documents, isLoading: isLoadingDocuments } = useCollection<Document>(documentsQuery);

    const reconciliationsQuery = useMemoFirebase(() => {
        if (!isStaff || !userProfile) return null;
        if (isAdmin) return query(collection(db, 'reconciliations'), orderBy('createdAt', 'desc'), limit(5));
        if (!cabinetId) return null;
        return query(
            collection(db, 'reconciliations'), 
            where('cabinetId', '==', cabinetId),
            orderBy('createdAt', 'desc'), 
            limit(5)
        );
    }, [isStaff, isAdmin, cabinetId, userProfile]);
    
    const { data: recentReconciliations, isLoading: isLoadingReconciliations } = useCollection<any>(reconciliationsQuery);

    const loading = !isMounted || isLoadingProfile || (isStaff && (isLoadingClients || isLoadingDocuments || isLoadingReconciliations));

    const dashboardData = useMemo(() => {
        if (loading || !documents || !clients) return null;

        const today = new Date();
        const twentyFourHoursAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);

        const docsUploadedToday = documents.filter((d: Document) => {
            const uploadEvent = (d.auditTrail || []).find((e: AuditEvent) => e.action.includes('téléversé'));
            return uploadEvent && new Date(uploadEvent.date) >= twentyFourHoursAgo;
        }).length;
        
        const docsPendingReview = documents.filter(d => ['pending', 'reviewing', 'error'].includes(d.status)).length;
        
        const docsApprovedToday = documents.filter((doc: Document) => {
            const approvalEvent = (doc.auditTrail || []).find((e: AuditEvent) => e.action.includes('approuvé'));
            return approvalEvent && new Date(approvalEvent.date) >= twentyFourHoursAgo;
        }).length;
        
        const activityByClient = clients.map(client => {
            const clientDocsToday = documents.filter(d => 
                d.clientId === client.id && 
                d.uploadDate && new Date(d.uploadDate) >= twentyFourHoursAgo
            ).length;
            return { name: client.name, docs: clientDocsToday };
        }).filter(c => c.docs > 0).sort((a,b) => b.docs - a.docs).slice(0, 5);

        return {
            totalClients: clients.filter(c => c.status === 'active' && c.role === 'client').length,
            docsUploadedToday,
            docsPendingReview,
            docsApprovedToday,
            activityByClient,
        };
    }, [documents, clients, loading]);
    
    if (!isMounted || loading) {
        return (
             <div className="space-y-8 p-6 lg:p-10">
                <div className="space-y-2">
                    <Skeleton className="h-12 w-1/3 bg-primary/5" />
                    <Skeleton className="h-6 w-1/2 opacity-50" />
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-3xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Skeleton className="lg:col-span-2 h-[450px] rounded-3xl" />
                    <Skeleton className="h-[450px] rounded-3xl" />
                </div>
            </div>
        )
    }

    if (!isStaff) {
         return (
             <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center p-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <Card className="glass-panel text-center p-8 border-destructive/20">
                         <CardHeader>
                            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                                <Users className="h-8 w-8 text-destructive" />
                            </div>
                            <CardTitle className="text-2xl font-bold tracking-tight">Accès restreint</CardTitle>
                            <CardDescription className="text-lg">
                                Vous n'avez pas les permissions nécessaires pour accéder à ce tableau de bord opérationnel.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/dashboard">Retour au menu principal</Link>
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
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8 p-6 lg:p-10 max-w-[1600px] mx-auto"
        >
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-1">
                  <motion.h1 
                    className="text-5xl font-black tracking-tighter font-display gradient-text"
                    variants={itemVariants}
                  >
                    Command Center
                  </motion.h1>
                  <motion.p 
                    className="text-muted-foreground text-xl font-medium"
                    variants={itemVariants}
                  >
                    {isAdmin ? "Monitoring Global" : `Cabinet ${cabinet?.name || 'Opérationnel'}`} • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </motion.p>
                </div>
                
                <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
                    <Link href="/dashboard/accountant/export">
                        <Button variant="outline" className="glass-panel border-emerald-500/30 hover:bg-emerald-50/10 text-emerald-600 dark:text-emerald-400 gap-2 h-12 px-6 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95">
                            <FileSpreadsheet className="h-5 w-5" />
                            Export Cegid
                        </Button>
                    </Link>
                    <Link href="/dashboard/accountant/validation">
                        <Button className="h-12 px-8 rounded-2xl font-black shadow-xl shadow-primary/30 gap-2 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90">
                            <ArrowUpRight className="h-5 w-5" />
                            Validation IA "Swipe"
                        </Button>
                    </Link>
                </motion.div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Dossiers Actifs", value: dashboardData?.totalClients, sub: "Clients sous gestion", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", link: "/dashboard/clients" },
                    { label: "Flux Entrant", value: `+${dashboardData?.docsUploadedToday}`, sub: "Dernières 24 heures", icon: FileUp, color: "text-primary", bg: "bg-primary/10", link: "/dashboard/documents?filter=today" },
                    { label: "Backlog Traitement", value: dashboardData?.docsPendingReview, sub: "En attente validation", icon: FileClock, color: "text-amber-500", bg: "bg-amber-500/10", link: "/dashboard/documents?filter=pending_review" },
                    { label: "Performance IA", value: dashboardData?.docsApprovedToday, sub: "Validations du jour", icon: FileCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", link: "/dashboard/documents?filter=approved_today" }
                ].map((stat, i) => (
                    <Link key={i} href={stat.link}>
                        <motion.div variants={itemVariants}>
                            <Card className="glass-panel-hover overflow-hidden group border-border/40 hover:border-primary/50 transition-all duration-300">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={cn("p-3 rounded-2xl transition-colors duration-300", stat.bg)}>
                                            <stat.icon className={cn("h-6 w-6", stat.color)} />
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2">
                                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-muted-foreground tracking-wide uppercase px-0.5">{stat.label}</p>
                                        <div className="flex items-baseline gap-2">
                                            <h2 className="text-4xl font-black tracking-tight tracking-tighter">
                                                {stat.value}
                                            </h2>
                                        </div>
                                        <p className="text-xs font-semibold text-muted-foreground pt-1">{stat.sub}</p>
                                    </div>
                                </CardContent>
                                <div className="h-1.5 w-full bg-muted mt-auto overflow-hidden">
                                     <motion.div 
                                        className={cn("h-full", stat.color.replace('text', 'bg'))}
                                        initial={{ x: '-100%' }}
                                        animate={{ x: '0%' }}
                                        transition={{ delay: 0.5 + (i * 0.1), duration: 1 }}
                                     />
                                </div>
                            </Card>
                        </motion.div>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Activity Chart */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <Card className="glass-panel border-border/40 h-full overflow-hidden">
                        <CardHeader className="p-8 border-b border-border/10 bg-muted/20">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-2xl font-black tracking-tight">Activité Clients (24h)</CardTitle>
                                    <CardDescription className="text-base font-medium">Répartition des flux par dossier prioritaire</CardDescription>
                                </div>
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            {dashboardData?.activityByClient.length && dashboardData.activityByClient.length > 0 ? (
                                <div className="h-[350px] w-full pt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dashboardData.activityByClient} layout="vertical" margin={{ left: 40, right: 40 }}>
                                            <XAxis type="number" hide />
                                            <YAxis 
                                                dataKey="name" 
                                                type="category" 
                                                tickLine={false} 
                                                axisLine={false} 
                                                width={150}
                                                tick={{ fill: 'currentColor', fontSize: 13, fontWeight: 700 }}
                                            />
                                            <Tooltip 
                                                cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="glass-panel p-4 border-primary/20 shadow-2xl">
                                                                <p className="font-bold text-sm text-primary">{payload[0].payload.name}</p>
                                                                <p className="text-xl font-black">{payload[0].value} <span className="text-xs font-bold text-muted-foreground uppercase">documents</span></p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar dataKey="docs" radius={[0, 8, 8, 0]} barSize={32}>
                                                {dashboardData.activityByClient.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.6)'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                 <div className="h-[350px] w-full flex flex-col items-center justify-center text-center p-10 bg-muted/10 rounded-3xl border-2 border-dashed border-border/20">
                                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
                                        <FileUp className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground">Calme plat sur vos dossiers</h3>
                                    <p className="text-muted-foreground text-lg max-w-sm mx-auto mt-2">Aucun mouvement détecté sur les dernières 24 heures via l'application mobile.</p>
                                 </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Recent Reconciliation Archive */}
                <motion.div variants={itemVariants}>
                    <Card className="glass-panel border-border/40 h-full">
                        <CardHeader className="p-8 border-b border-border/10">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                    <HistoryIcon className="h-5 w-5 text-amber-500" />
                                </div>
                                <CardTitle className="text-xl font-bold tracking-tight">Derniers exports</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="space-y-6">
                                {recentReconciliations && recentReconciliations.length > 0 ? recentReconciliations.map((report: any, index: number) => (
                                    <motion.div 
                                        key={index} 
                                        className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-muted/30 transition-all cursor-pointer border border-transparent hover:border-border/40"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.8 + (index * 0.1) }}
                                    >
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background border shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                                            <HistoryIcon className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-sm text-foreground truncate">{report.clientName}</p>
                                            <p className="text-xs font-semibold text-muted-foreground/80 line-clamp-1 mt-0.5">{report.summary || 'Rapport de rapprochement généré'}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                <p className="text-[10px] font-bold text-muted-foreground tracking-tighter uppercase">{new Date(report.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-muted/5 rounded-3xl border border-dashed">
                                        <HistoryIcon className="h-10 w-10 text-muted-foreground/40" />
                                        <p className="text-sm font-bold text-muted-foreground px-10">Aucun export archivé dans le système.</p>
                                    </div>
                                )}
                            </div>
                            
                            <Button variant="outline" className="w-full mt-8 h-12 rounded-2xl font-bold border-primary/20 hover:bg-primary/5 transition-all active:scale-95" asChild>
                                <Link href="/dashboard/accountant/reconciliation/history">
                                    Voir tout l'historique
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}