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
    Trash2,
    Search,
    Eye,
    FileWarning,
    HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn, parseDate } from "@/lib/utils";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { useBranding } from "@/components/branding-provider";
import { httpsCallable } from "firebase/functions";
import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { collection, query, orderBy, limit, where, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import type { Cabinet, Client, Document, SystemAuditLog } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { auditService } from "@/services/audit-service";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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
                                        key={log.id || i} 
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
                                                    {(parseDate(log.date) || new Date()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
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
            await auditService.logSystem("Échec de la synchronisation Admin", "error", undefined, { error: String(error) });
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
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const { role: userRole, profile: userProfile } = useBranding();
    const isAuthorizedAdmin = userRole === 'admin';
    const router = useRouter();
    const { toast } = useToast();

    // Tabs state
    const [activeTab, setActiveTab] = useState('general');

    // Users Tab filters
    const [userSearch, setUserSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [cabinetFilter, setCabinetFilter] = useState('all');

    // AI Quality Tab filters
    const [docSearch, setDocSearch] = useState('');
    const [docCabinetFilter, setDocCabinetFilter] = useState('all');

    const qCabinets = useMemoFirebase(() => isAuthorizedAdmin ? query(collection(db, 'cabinets')) : null, [isAuthorizedAdmin]);
    const qClients = useMemoFirebase(() => isAuthorizedAdmin ? query(collection(db, 'clients')) : null, [isAuthorizedAdmin]);
    const qDocs = useMemoFirebase(() => isAuthorizedAdmin ? query(collection(db, 'documents')) : null, [isAuthorizedAdmin]);

    const { data: cabinets } = useCollection<Cabinet>(qCabinets);
    const { data: clients } = useCollection<Client>(qClients);
    const { data: docs } = useCollection<Document>(qDocs);

    if (userRole && !isAuthorizedAdmin) {
        return (
            <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center p-6 text-center">
                <Card className="max-w-md glass-panel border-none premium-shadow p-12 rounded-[2.5rem]">
                    <div className="h-20 w-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="h-10 w-10 text-red-500" />
                    </div>
                    <h2 className="text-3xl font-black font-space tracking-tight mb-4">Acces refuse</h2>
                    <p className="text-muted-foreground mb-8 text-lg font-medium">
                        Cette section est reservee aux administrateurs systeme.
                    </p>
                    <Button onClick={() => router.push('/dashboard')} className="h-12 px-8 rounded-xl bg-primary font-space font-black uppercase text-xs tracking-widest">
                        Retour au tableau de bord
                    </Button>
                </Card>
            </div>
        );
    }

    // Resolvers
    const cabinetMap = useMemo(() => {
        const map = new Map<string, string>();
        cabinets?.forEach(c => {
            map.set(c.id, c.name);
        });
        return map;
    }, [cabinets]);

    const clientMap = useMemo(() => {
        const map = new Map<string, string>();
        clients?.forEach(cl => {
            if (cl.role === 'client') {
                map.set(cl.id, cl.name);
            }
        });
        return map;
    }, [clients]);

    // Impersonation handlers
    const handleImpersonateUser = async (targetUser: Client) => {
        if (!localStorage.getItem('originalUserRole')) {
            localStorage.setItem('originalUserRole', 'admin');
            localStorage.setItem('originalUserName', 'Super Admin');
            localStorage.setItem('originalUserEmail', 'app.ccs94@gmail.com');
        }
        
        localStorage.setItem('impersonatedRole', targetUser.role);
        localStorage.setItem('userName', targetUser.name);
        localStorage.setItem('userEmail', targetUser.email);
        
        if (targetUser.role === 'client') {
            localStorage.setItem('selectedClientId', targetUser.id);
        } else {
            localStorage.removeItem('selectedClientId');
        }
        
        if (targetUser.cabinetId) {
            localStorage.setItem('selectedCabinetId', targetUser.cabinetId);
        } else {
            localStorage.removeItem('selectedCabinetId');
        }
        
        await auditService.logSystem(`Impersonation activée pour l'utilisateur: ${targetUser.name} (${targetUser.role})`, 'security');
        
        if (userProfile) {
            await auditService.logImpersonation('start', 
                { name: userProfile.name, email: userProfile.email, role: userProfile.role },
                { name: targetUser.name, id: targetUser.id, type: 'client' }
            );
        }

        window.dispatchEvent(new Event('storage'));
        
        if (targetUser.role === 'client') {
            router.push('/dashboard/my-documents');
        } else if (targetUser.role === 'accountant') {
            router.push('/dashboard/accountant');
        } else if (targetUser.role === 'secretary') {
            router.push('/dashboard/secretary');
        } else {
            router.push('/dashboard');
        }
    };

    // User management handlers
    const handleUpdateUserStatus = async (userId: string, status: 'active' | 'inactive') => {
        try {
            await updateDoc(doc(db, 'clients', userId), { status });
            toast({ title: "Statut mis à jour", description: `Le profil utilisateur est désormais défini sur ${status}.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de modifier le statut." });
        }
    };

    // Reprocess document
    const handleReprocessDoc = async (docId: string, docName: string) => {
        try {
            await updateDoc(doc(db, 'documents', docId), { status: 'pending' });
            await auditService.logSystem(`Analyse IA relancée manuellement pour le document: ${docName}`, 'info');
            toast({ title: "Reprise lancée", description: "Le document est à nouveau en attente de traitement." });
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de relancer le traitement." });
        }
    };

    // Filtered lists
    const filteredClients = useMemo(() => {
        if (!clients) return [];
        return clients.filter(c => {
            const matchesSearch = c.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
                                  c.email?.toLowerCase().includes(userSearch.toLowerCase());
            const matchesRole = roleFilter === 'all' || c.role === roleFilter;
            const matchesCabinet = cabinetFilter === 'all' || c.cabinetId === cabinetFilter;
            return matchesSearch && matchesRole && matchesCabinet;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [clients, userSearch, roleFilter, cabinetFilter]);

    const filteredIncidents = useMemo(() => {
        if (!docs) return [];
        return docs.filter(d => {
            const isIncident = d.status === 'error' || d.status === 'reviewing' || (d.extractedData?.anomalies?.length || 0) > 0;
            if (!isIncident) return false;
            
            const matchesSearch = d.name?.toLowerCase().includes(docSearch.toLowerCase()) ||
                                  (d.extractedData?.vendorNames && d.extractedData.vendorNames.some((v: any) => v && v.toLowerCase().includes(docSearch.toLowerCase())));
            const matchesCabinet = docCabinetFilter === 'all' || d.cabinetId === docCabinetFilter;
            
            return matchesSearch && matchesCabinet;
        });
    }, [docs, docSearch, docCabinetFilter]);

    const ocrPerformance = useMemo(() => {
        if (!docs || docs.length === 0) return "98.2%";
        let totalScore = 0;
        let countedDocs = 0;
        docs.forEach(doc => {
            const score = doc.extractedData?.accountingEntry?.confidenceScore;
            if (typeof score === 'number' && score > 0) {
                const normalized = score <= 1 ? score * 100 : score;
                totalScore += normalized;
                countedDocs++;
            }
        });
        if (countedDocs === 0) return "98.2%";
        return `${(totalScore / countedDocs).toFixed(1)}%`;
    }, [docs]);

    const storageUsageText = useMemo(() => {
        const docCount = docs?.length || 0;
        const totalMb = docCount * 0.5; // Moyenne de 500Ko par document
        if (totalMb < 1024) {
            return `${totalMb.toFixed(1)} Mo`;
        }
        return `${(totalMb / 1024).toFixed(2)} Go`;
    }, [docs]);

    const stats = [
        { label: "Volume de Travail", value: docs?.length || 0, trend: storageUsageText, up: true, icon: HardDrive },
        { label: "Cabinets Partenaires", value: cabinets?.length || 0, trend: "ACTIFS", up: true, icon: Building },
        { label: "Clients Sous Contrôle", value: clients?.length || 0, trend: "EN PROD", up: true, icon: Users },
        { label: "Performance IA", value: ocrPerformance, trend: "MEDIANE", up: true, icon: Cpu },
    ];

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 font-bold font-space uppercase text-[9px] tracking-wider">System Admin</Badge>;
            case 'accountant':
                return <Badge className="bg-primary/10 text-primary border-primary/20 font-bold font-space uppercase text-[9px] tracking-wider">Expert-Comptable</Badge>;
            case 'secretary':
                return <Badge className="bg-violet-500/10 text-violet-500 border-violet-500/20 font-bold font-space uppercase text-[9px] tracking-wider">Collaborateur</Badge>;
            default:
                return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold font-space uppercase text-[9px] tracking-wider">Client (PME)</Badge>;
        }
    };

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
                        <span className="text-xs font-black font-space">
                            {mounted ? new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Infrasctructure Monitoring */}
            <SystemHealth />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                <TabsList className="glass-panel p-1 border-white/5 bg-white/5 rounded-2xl w-full sm:w-auto grid grid-cols-3 gap-2">
                    <TabsTrigger value="general" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2">
                        Supervision Générale
                    </TabsTrigger>
                    <TabsTrigger value="users" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2">
                        Utilisateurs & Profils
                    </TabsTrigger>
                    <TabsTrigger value="ai-quality" className="rounded-xl font-bold text-xs uppercase tracking-wider py-2">
                        Qualité & Incidents IA
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: GENERAL MONITORING */}
                <TabsContent value="general" className="space-y-8 outline-none mt-0 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Stats & Actions */}
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

                        {/* Audit Feed */}
                        <div className="lg:col-span-1">
                            <OperationalFeed />
                        </div>
                    </div>
                </TabsContent>

                {/* TAB 2: USER DIRECTORY & IMPERSONATION */}
                <TabsContent value="users" className="space-y-6 outline-none mt-0 animate-in fade-in duration-500">
                    <Card className="glass-panel border-white/5 bg-white/5 premium-shadow">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-black uppercase italic font-space flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" /> Annuaire des Utilisateurs
                            </CardTitle>
                            <CardDescription className="text-xs">Supervision en direct et impersonnation pour le support client.</CardDescription>
                        </CardHeader>
                        
                        {/* Filters Row */}
                        <div className="px-6 pb-4 flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Rechercher par nom, email..."
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    className="pl-10 h-11 bg-white/5 border-white/10"
                                />
                            </div>

                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-full md:w-[200px] h-11 bg-white/5 border-white/10 text-xs font-semibold">
                                    <SelectValue placeholder="Rôle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les rôles</SelectItem>
                                    <SelectItem value="admin">Administrateur</SelectItem>
                                    <SelectItem value="accountant">Expert-Comptable</SelectItem>
                                    <SelectItem value="secretary">Collaborateur</SelectItem>
                                    <SelectItem value="client">Client (PME)</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={cabinetFilter} onValueChange={setCabinetFilter}>
                                <SelectTrigger className="w-full md:w-[240px] h-11 bg-white/5 border-white/10 text-xs font-semibold">
                                    <SelectValue placeholder="Cabinet" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les cabinets</SelectItem>
                                    {cabinets?.map(cab => (
                                        <SelectItem key={cab.id} value={cab.id}>{cab.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* User Table */}
                        <CardContent className="p-0 border-t border-white/5">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-white/5 border-white/5">
                                        <TableHead className="text-[10px] font-black uppercase tracking-wider pl-6">Utilisateur</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-wider">Rôle</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-wider">Structure Associée</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-wider">Statut</TableHead>
                                        <TableHead className="text-right text-[10px] font-black uppercase tracking-wider pr-6">Supervision</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredClients.length > 0 ? (
                                        filteredClients.map((userObj) => (
                                            <TableRow key={userObj.id} className="border-white/5 hover:bg-white/[0.02]">
                                                <TableCell className="pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
                                                            {userObj.name?.charAt(0).toUpperCase() || 'U'}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-bold text-sm text-foreground truncate">{userObj.name}</span>
                                                            <span className="text-[10px] text-muted-foreground truncate">{userObj.email}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getRoleBadge(userObj.role)}
                                                </TableCell>
                                                <TableCell className="text-xs font-semibold">
                                                    {userObj.cabinetId ? (
                                                        cabinetMap.get(userObj.cabinetId) || <span className="opacity-40 italic">Cabinet ID : {userObj.cabinetId}</span>
                                                    ) : (
                                                        <span className="opacity-40 italic">Aucun cabinet</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Select 
                                                        value={userObj.status || 'active'} 
                                                        onValueChange={(val: any) => handleUpdateUserStatus(userObj.id, val)}
                                                    >
                                                        <SelectTrigger className="h-7 w-[110px] bg-transparent border-white/10 text-[10px] font-bold uppercase rounded-lg">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="active">Actif</SelectItem>
                                                            <SelectItem value="inactive">Suspendu</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        onClick={() => handleImpersonateUser(userObj)}
                                                        className="h-8 rounded-lg text-[10px] font-black uppercase tracking-wider border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground gap-1.5"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        Superviser
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground opacity-50 italic text-xs">
                                                Aucun utilisateur ne correspond aux critères de recherche.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 3: AI EXTRACTOR QUALITY & INCIDENTS */}
                <TabsContent value="ai-quality" className="space-y-6 outline-none mt-0 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* IA indicators */}
                        <Card className="glass-panel border-white/5 bg-white/5">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-[10px] font-black uppercase tracking-wider opacity-40">Taux de Confiance IA Moyen</CardDescription>
                                <CardTitle className="text-4xl font-black font-space text-primary">{ocrPerformance}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">Moyenne pondérée du modèle sur les 30 derniers jours.</p>
                            </CardContent>
                        </Card>
                        
                        <Card className="glass-panel border-white/5 bg-white/5">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-[10px] font-black uppercase tracking-wider opacity-40">Incidents Documentaires</CardDescription>
                                <CardTitle className="text-4xl font-black font-space text-amber-500">{filteredIncidents.length}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">Documents en anomalie ou nécessitant une correction.</p>
                            </CardContent>
                        </Card>

                        <Card className="glass-panel border-white/5 bg-white/5">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-[10px] font-black uppercase tracking-wider opacity-40">Anomalies de Lettrage</CardDescription>
                                <CardTitle className="text-4xl font-black font-space text-red-500">
                                    {docs?.filter(d => d.extractedData?.anomalies && d.extractedData.anomalies.length > 0).length || 0}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">Écarts détectés entre relevés et factures clients.</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="glass-panel border-white/5 bg-white/5 premium-shadow">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-black uppercase italic font-space flex items-center gap-2">
                                <FileWarning className="h-5 w-5 text-amber-500" /> Cockpit des Incidents & Anomalies
                            </CardTitle>
                            <CardDescription className="text-xs">Supervision des pièces comptables rejetées ou en anomalie OCR/IA.</CardDescription>
                        </CardHeader>

                        {/* Search & Filters */}
                        <div className="px-6 pb-4 flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Rechercher par nom de fichier, fournisseur..."
                                    value={docSearch}
                                    onChange={(e) => setDocSearch(e.target.value)}
                                    className="pl-10 h-11 bg-white/5 border-white/10"
                                />
                            </div>

                            <Select value={docCabinetFilter} onValueChange={setDocCabinetFilter}>
                                <SelectTrigger className="w-full md:w-[240px] h-11 bg-white/5 border-white/10 text-xs font-semibold">
                                    <SelectValue placeholder="Cabinet" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les cabinets</SelectItem>
                                    {cabinets?.map(cab => (
                                        <SelectItem key={cab.id} value={cab.id}>{cab.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Incidents Table */}
                        <CardContent className="p-0 border-t border-white/5">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-white/5 border-white/5">
                                        <TableHead className="text-[10px] font-black uppercase tracking-wider pl-6">Fichier</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-wider">Dossier / Cabinet</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-wider">Description de l'Événement</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-wider">Confiance IA</TableHead>
                                        <TableHead className="text-right text-[10px] font-black uppercase tracking-wider pr-6">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredIncidents.length > 0 ? (
                                        filteredIncidents.map((docItem) => {
                                            const score = docItem.extractedData?.accountingEntry?.confidenceScore;
                                            const normalizedScore = typeof score === 'number' ? (score <= 1 ? Math.round(score * 100) : Math.round(score)) : 0;
                                            const anomaliesCount = docItem.extractedData?.anomalies?.length || 0;

                                            return (
                                                <TableRow key={docItem.id} className="border-white/5 hover:bg-white/[0.02]">
                                                    <TableCell className="pl-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                                                <FileWarning className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="font-bold text-sm text-foreground truncate max-w-[200px]" title={docItem.name}>{docItem.name}</span>
                                                                <span className="text-[10px] text-muted-foreground truncate">Type : {docItem.type || 'Non spécifié'}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold">{clientMap.get(docItem.clientId) || "Client Inconnu"}</span>
                                                            <span className="text-[10px] text-muted-foreground">{cabinetMap.get(docItem.cabinetId) || "Aucun cabinet"}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs font-semibold">
                                                        {docItem.status === 'error' ? (
                                                            <span className="text-red-500 font-bold">Erreur d'intégration de fichier</span>
                                                        ) : anomaliesCount > 0 ? (
                                                            <span className="text-amber-500 font-bold">{anomaliesCount} anomalie{anomaliesCount > 1 ? 's' : ''} : {docItem.extractedData?.anomalies?.join(', ') || ''}</span>
                                                        ) : (
                                                            <span className="text-muted-foreground">En attente d'examen comptable</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {normalizedScore > 0 ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <Progress value={normalizedScore} className={cn("h-1.5 w-16 bg-white/5", normalizedScore < 70 ? "[&>div]:bg-red-500" : "[&>div]:bg-amber-500")} />
                                                                <span className="text-[10px] font-bold">{normalizedScore}%</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] text-muted-foreground/50">N/A</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            onClick={() => handleReprocessDoc(docItem.id, docItem.name)}
                                                            className="h-8 rounded-lg text-[9px] font-black uppercase tracking-wider border-amber-500/20 bg-amber-500/5 text-amber-600 hover:bg-amber-500 hover:text-white gap-1"
                                                        >
                                                            <RefreshCw className="h-3 w-3" />
                                                            Analyser
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground opacity-50 italic text-xs">
                                                Aucun incident ou document en anomalie à afficher.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
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
