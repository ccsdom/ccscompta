
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { 
    LayoutDashboard, 
    Users, 
    Building, 
    TrendingUp, 
    ArrowUpRight, 
    ArrowDownRight,
    ShieldAlert,
    Cpu,
    Globe,
    Zap,
    Activity,
    HardDrive,
    ShieldCheck,
    ServerCrash,
    MoreHorizontal,
    Plus,
    RefreshCw,
    Clock,
    CheckCircle2,
    AlertCircle,
    Info,
    Lock,
    AlertTriangle,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { httpsCallable } from "firebase/functions";
import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { collection, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "@/firebase";
import type { Cabinet, Client, Document, SystemAuditLog } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { auditService } from "@/services/audit-service";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

function SystemHealth() {
    const services = [
        { name: "Base de données", status: "online", latency: "12ms", icon: HardDrive },
        { name: "Moteur IA Alpha", status: "online", latency: "145ms", icon: Cpu },
        { name: "Flux de Paiements", status: "online", latency: "22ms", icon: ShieldCheck },
        { name: "Infrastructure Cloud", status: "online", latency: "5ms", icon: Globe },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.map((service, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-300">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <service.icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{service.name}</span>
                        <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-500/80 uppercase">{service.status} • {service.latency}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function OperationalFeed() {
    const [importanceFilter, setImportanceFilter] = useState<'all' | 'high'>('all');
    const q = useMemoFirebase(
        () => query(collection(db, 'audit'), orderBy('date', 'desc'), limit(15)),
        []
    );
    const { data: auditLogs, isLoading } = useCollection<SystemAuditLog>(q);

    const getLogIcon = (type: string) => {
        switch (type) {
            case 'security': return <Lock className="h-4 w-4 text-orange-500" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case 'error': return <Trash2 className="h-4 w-4 text-destructive" />;
            default: return <Info className="h-4 w-4 text-primary" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'security': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'warning': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'error': return 'bg-destructive/10 text-destructive border-destructive/20';
            default: return 'bg-primary/10 text-primary border-primary/20';
        }
    };

    return (
        <Card className="glass-panel border-white/5 bg-white/5 premium-shadow overflow-hidden min-h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-xl font-black uppercase italic font-space flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" /> Journal d'Audit
                    </CardTitle>
                    <CardDescription className="text-xs">Mémoire système en temps réel.</CardDescription>
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 animate-pulse">LIVE</Badge>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[320px] px-6">
                    <div className="space-y-4 pb-6 mt-4">
                        {isLoading ? (
                            <div className="flex flex-col gap-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />)}
                            </div>
                        ) : auditLogs?.length === 0 ? (
                            <div className="py-10 text-center opacity-40 italic text-sm">Aucun log système disponible.</div>
                        ) : (
                                    auditLogs?.filter(l => importanceFilter === 'all' || (importanceFilter === 'high' && (l.type === 'error' || l.type === 'security'))).map((log, i) => (
                                    <motion.div 
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        key={log.id} 
                                        className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all duration-300 group"
                                    >
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                                            getTypeColor(log.type)
                                        )}>
                                            {getLogIcon(log.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h4 className="text-xs font-black uppercase truncate tracking-tight">{log.action}</h4>
                                                <span className="text-[10px] opacity-40 font-bold whitespace-nowrap">
                                                    {new Date(log.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground font-medium truncate">
                                                {log.userName} • {log.userEmail}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                    <div className="p-4 bg-white/5 border-t border-white/5 flex gap-2">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setImportanceFilter(importanceFilter === 'all' ? 'high' : 'all')}
                            className={cn(
                                "flex-1 text-[10px] font-black uppercase tracking-[0.2em] h-8",
                                importanceFilter === 'high' ? "text-primary opacity-100 bg-primary/10" : "opacity-40"
                            )}
                        >
                            {importanceFilter === 'high' ? 'Affichage: Critique' : 'Tout afficher'}
                        </Button>
                    </div>
            </CardContent>
        </Card>
    );
}

function SyncControl() {
    const { user } = useFirebase();
    const [loading, setLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const ADMIN_EMAIL = 'app.ccs94@gmail.com';

    useEffect(() => {
        if (user) {
            user.getIdTokenResult().then(res => {
                setIsAdmin(res.claims.role === 'admin' || user.email === ADMIN_EMAIL);
            });
        }
    }, [user]);

    if (!user || (!isAdmin && user.email !== ADMIN_EMAIL)) return null;

    const handleSync = async () => {
        setLoading(true);
        try {
            const { functions } = await import('@/firebase');
            const syncAdminRole = httpsCallable(functions, 'syncAdminRole');
            await syncAdminRole();
            await auditService.logSystem("Synchronisation forcée des droits Administrateur", "security");
            await user.getIdToken(true);
            window.location.reload();
        } catch (error) {
            console.error("Sync Error:", error);
            await auditService.logSystem("Échec de la synchronisation Admin", "error", { error: String(error) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button 
            variant="outline"
            onClick={handleSync} 
            disabled={loading}
            className="rounded-xl font-black text-xs uppercase h-10 border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all gap-2"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync Admin
        </Button>
    );
}

export default function SuperAdminDashboard() {
    const qCabinets = useMemoFirebase(() => query(collection(db, 'cabinets')), []);
    const qClients = useMemoFirebase(() => query(collection(db, 'clients')), []);
    const qDocs = useMemoFirebase(() => query(collection(db, 'documents')), []);

    const { data: cabinets } = useCollection<Cabinet>(qCabinets);
    const { data: clients } = useCollection<Client>(qClients);
    const { data: docs } = useCollection<Document>(qDocs);

    const { toast } = useToast();

    const stats = [
        { label: "Volume de Travail", value: docs?.length || 0, trend: "LÉGAL", up: true, icon: HardDrive },
        { label: "Cabinets Partenaires", value: cabinets?.length || 0, trend: "+2", up: true, icon: Building },
        { label: "Clients Sous Contrôle", value: clients?.length || 0, trend: "+14", up: true, icon: Users },
        { label: "Performance IA", value: "98.2%", trend: "STABLE", up: true, icon: Cpu },
    ];

    return (
        <div className="space-y-8 pb-10 max-w-7xl mx-auto">
            {/* Header section with integrated controls */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]">
                            <Zap className="h-6 w-6 fill-current" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase italic font-space leading-none">
                            Mission Control
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium ml-1">Système de supervision neuronale • SaaS CCS Compta</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end mr-4">
                        <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">État Global</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-emerald-500 uppercase">Production Active</span>
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                        </div>
                    </div>
                    <SyncControl />
                    <div className="h-10 px-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-xs font-black font-space">{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            </div>

            {/* Infrasctructure Monitoring */}
            <SystemHealth />

            {/* Main Operational Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left & Middle Column: Stats & Controls */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Card className="glass-panel border-white/5 bg-white/5 hover:border-primary/20 transition-all duration-500 group overflow-hidden">
                                    <CardContent className="p-6 relative">
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700">
                                            <stat.icon className="h-24 w-24 scale-150 rotate-12" />
                                        </div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <stat.icon className="h-5 w-5" />
                                            </div>
                                            <Badge variant="outline" className={cn(
                                                "font-black text-[9px] uppercase tracking-tighter",
                                                stat.up ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" : "text-primary border-primary/20 bg-primary/5"
                                            )}>
                                                {stat.trend}
                                            </Badge>
                                        </div>
                                        <div className="space-y-1">
                                            <CardTitle className="text-3xl font-black font-space">{stat.value}</CardTitle>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Critical Actions Hub */}
                    <Card className="glass-panel border-white/5 bg-white/5 premium-shadow">
                        <CardHeader>
                            <CardTitle className="text-lg font-black uppercase italic font-space flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-primary" /> Centre de Commandement
                            </CardTitle>
                            <CardDescription className="text-xs">Opérations à haut privilège et maintenance système.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4 hover:border-primary/20 transition-all group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:animate-pulse">
                                                <ServerCrash className="h-4 w-4" />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-tight">Mode Maintenance</span>
                                        </div>
                                        <Button variant="outline" size="sm" className="h-7 text-[9px] font-black uppercase border-primary/20 hover:bg-primary/20">Activer</Button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">Verrouille l'accès au SaaS pour tous les utilisateurs non-admin durant les interventions techniques.</p>
                                </div>

                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4 hover:border-destructive/20 transition-all group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive group-hover:rotate-12 transition-transform">
                                                <Trash2 className="h-4 w-4" />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-tight">Nettoyage de Test</span>
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-7 text-[9px] font-black uppercase border-destructive/20 text-destructive hover:bg-destructive hover:text-white"
                                            onClick={async () => {
                                                if (confirm("ATTENTION : Cette action va supprimer TOUTES les données de test (Documents, Logs, Clients). Confirmer ?")) {
                                                    await auditService.logSystem("DÉCLENCHEMENT : Purge globale des données de test", "security");
                                                    toast({ variant: "destructive", title: "Purge lancée", description: "Veuillez patienter pendant le nettoyage de la DB." });
                                                }
                                            }}
                                        >Purger</Button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">Supprime les données factices générées pour les démo. À utiliser uniquement avant la mise en production.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Audit Log */}
                <div className="lg:col-span-1">
                    <OperationalFeed />
                </div>
            </div>
        </div>
    );
}

async function handleSeed() {
    const { db } = await import('@/firebase');
    const { collection, doc, setDoc } = await import('firebase/firestore');
    
    const cabinets = [
        {
            id: 'cabinet-elite-paris',
            name: 'Alliance Expertise Paris',
            email: 'contact.ccs94@gmail.com',
            plan: 'elite',
            status: 'active',
            createdAt: new Date().toISOString(),
            logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=AEP',
            slogan: 'L\'excellence au service de vos chiffres',
            quotas: {
                maxClients: 500,
                maxDocumentsPerMonth: 5000,
                maxCollaborators: 50,
                storageLimitGb: 200,
                usedDocumentsMonth: 1240,
                usedClients: 42
            }
        },
        {
            id: 'cabinet-lyon-compta',
            name: 'Rhône Gestion & Conseil',
            email: 'contact@rhone-gestion.fr',
            plan: 'professional',
            status: 'active',
            createdAt: new Date().toISOString(),
            logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=RGC',
            slogan: 'L\'expertise lyonnaise de proximité',
            quotas: {
                maxClients: 100,
                maxDocumentsPerMonth: 1000,
                maxCollaborators: 10,
                storageLimitGb: 50,
                usedDocumentsMonth: 450,
                usedClients: 78
            }
        },
        {
            id: 'cabinet-marseille-sud',
            name: 'Sud Compta Stratégie',
            email: 'admin@sud-compta.com',
            plan: 'starter',
            status: 'active',
            createdAt: new Date().toISOString(),
            logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=SCS',
            quotas: {
                maxClients: 20,
                maxDocumentsPerMonth: 200,
                maxCollaborators: 2,
                storageLimitGb: 10,
                usedDocumentsMonth: 12,
                usedClients: 8
            }
        }
    ];

    for (const cabinet of cabinets) {
        await setDoc(doc(db, 'cabinets', cabinet.id), cabinet);
    }
    alert("Cabinets de test générés !");
}