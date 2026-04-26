
'use client';

import { useCollection, useMemoFirebase } from "@/firebase";
import { db } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building, Users, FileText, HardDrive, Zap, TrendingUp, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Cabinet } from "@/lib/types";

export default function SubscriptionsTrackingPage() {
    const qCabinets = useMemoFirebase(() => query(collection(db, 'cabinets'), orderBy('name')), []);
    const { data: cabinets, isLoading } = useCollection<Cabinet>(qCabinets);

    // Global Stats Aggregator
    const globalUsage = useMemoFirebase(() => {
        if (!cabinets) return { docs: 0, clients: 0, storage: 0, totalDocs: 0, totalClients: 0 };
        return cabinets.reduce((acc, cab) => ({
            docs: acc.docs + (cab.quotas?.usedDocumentsMonth || 0),
            clients: acc.clients + (cab.quotas?.usedClients || 0),
            storage: acc.storage + (cab.quotas?.storageLimitGb || 0), // Simulating storage used for now
            totalDocs: acc.totalDocs + (cab.quotas?.maxDocumentsPerMonth || 100),
            totalClients: acc.totalClients + (cab.quotas?.maxClients || 10),
        }), { docs: 0, clients: 0, storage: 0, totalDocs: 0, totalClients: 0 });
    }, [cabinets]);

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-black tracking-tighter uppercase font-space italic mb-2">
                    Console des Abonnements
                </h1>
                <p className="text-muted-foreground text-sm">Gestion des ressources SaaS et monitoring des quotas partenaires.</p>
            </div>

            {/* Global Aggregates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Documents IA / Mois", value: globalUsage.docs, total: globalUsage.totalDocs, icon: FileText, color: "text-primary" },
                    { label: "Clients Actifs", value: globalUsage.clients, total: globalUsage.totalClients, icon: Users, color: "text-emerald-500" },
                    { label: "Capacité Cloud", value: 245, total: 500, icon: HardDrive, color: "text-blue-500" },
                ].map((stat, i) => (
                    <Card key={i} className="glass-panel border-white/5 bg-white/5 premium-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn("p-2 rounded-lg bg-white/5", stat.color)}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <Badge variant="outline" className="font-black text-[10px] uppercase">
                                    {Math.round((Number(stat.value) / Number(stat.total)) * 100)}%
                                </Badge>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">{stat.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black font-space">
                                        {stat.value}{stat.label === "Capacité Cloud" ? " GB" : ""}
                                    </span>
                                    <span className="text-xs font-bold opacity-30">/ {stat.total}{stat.label === "Capacité Cloud" ? " GB" : ""}</span>
                                </div>
                                <Progress value={(Number(stat.value) / Number(stat.total)) * 100} className="h-1 bg-white/5" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Detailed Cabinets List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xs font-black uppercase tracking-widest opacity-40">Détails par Cabinet</h2>
                    <span className="text-[10px] font-bold opacity-30">{cabinets?.length || 0} Cabinets monitorés</span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {cabinets?.map((cabinet, i) => {
                        const iaUsage = ((cabinet.quotas?.usedDocumentsMonth || 0) / (cabinet.quotas?.maxDocumentsPerMonth || 100)) * 100;
                        const clientUsage = ((cabinet.quotas?.usedClients || 0) / (cabinet.quotas?.maxClients || 10)) * 100;
                        const isCritical = iaUsage > 90 || clientUsage > 90;

                        return (
                            <motion.div
                                key={cabinet.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className={cn(
                                    "glass-panel border-white/5 bg-white/10 hover:border-white/10 transition-all",
                                    isCritical && "border-primary/20 bg-primary/5"
                                )}>
                                    <CardContent className="p-4 sm:p-6">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                            {/* Info */}
                                            <div className="flex items-center gap-4 min-w-[250px]">
                                                <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center p-1 overflow-hidden shrink-0">
                                                    {cabinet.logoUrl ? (
                                                        <img src={cabinet.logoUrl} className="h-full w-full object-contain" />
                                                    ) : (
                                                        <Building className="h-6 w-6 opacity-20" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-black font-space leading-none uppercase">{cabinet.name}</h3>
                                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter h-5">
                                                            {cabinet.plan || 'Starter'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground mt-1 truncate max-w-[200px]">{cabinet.email}</p>
                                                </div>
                                            </div>

                                            {/* Quotas Grid */}
                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[10px] font-black uppercase px-0.5">
                                                        <span className="opacity-40">Documents IA</span>
                                                        <span className={cn(iaUsage > 90 ? "text-primary" : "opacity-60")}>
                                                            {cabinet.quotas?.usedDocumentsMonth || 0} / {cabinet.quotas?.maxDocumentsPerMonth || 100}
                                                        </span>
                                                    </div>
                                                    <Progress value={iaUsage} className="h-1.5 bg-white/5" />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[10px] font-black uppercase px-0.5">
                                                        <span className="opacity-40">Clients</span>
                                                        <span className={cn(clientUsage > 90 ? "text-primary" : "opacity-60")}>
                                                            {cabinet.quotas?.usedClients || 0} / {cabinet.quotas?.maxClients || 10}
                                                        </span>
                                                    </div>
                                                    <Progress value={clientUsage} className="h-1.5 bg-white/5" />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[10px] font-black uppercase px-0.5">
                                                        <span className="opacity-40">Stockage</span>
                                                        <span className="opacity-60">
                                                            0 / {cabinet.quotas?.storageLimitGb || 10} GB
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 w-1 rounded-full" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="flex items-center gap-3 shrink-0 lg:ml-6">
                                                {isCritical && (
                                                    <div className="flex items-center gap-1 text-primary animate-pulse">
                                                        <AlertCircle className="h-4 w-4" />
                                                        <span className="text-[9px] font-black uppercase">Quota Critique</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tight">Actif</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
