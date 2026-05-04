'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
    ShieldCheck, 
    Search, 
    Calendar, 
    User, 
    Filter, 
    Download, 
    Clock, 
    AlertTriangle, 
    Info,
    ShieldAlert,
    FileText,
    History as HistoryIcon
} from "lucide-react";
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase';
import type { SystemAuditLog } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useBranding } from '@/components/branding-provider';
import { useRouter } from 'next/navigation';
import { parseDate } from '@/lib/utils';

export default function AuditPage() {
    const { role } = useBranding();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string | null>(null);

    // SECURITY: Only admin can see this page
    if (role !== 'admin') {
         return (
             <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center p-6 text-center">
                <Card className="max-w-md glass-panel border-none premium-shadow p-12 rounded-[2.5rem]">
                    <div className="h-20 w-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="h-10 w-10 text-red-500" />
                    </div>
                    <h2 className="text-3xl font-black font-space tracking-tight mb-4">Accès Refusé</h2>
                    <p className="text-muted-foreground mb-8 text-lg font-medium">Vous n'avez pas les privilèges nécessaires pour consulter le journal d'audit du système.</p>
                    <Button onClick={() => router.push('/dashboard')} className="h-12 px-8 rounded-xl bg-primary font-space font-black uppercase text-xs tracking-widest">
                        Retour au Tableau de Bord
                    </Button>
                </Card>
            </div>
        )
    }

    const auditQuery = useMemoFirebase(() => query(
        collection(db, 'audit'),
        orderBy('date', 'desc'), // Consistent with other dashboards
        limit(100)
    ), []);

    const { data: logs, isLoading } = useCollection<SystemAuditLog>(auditQuery);

    const filteredLogs = logs?.filter(log => {
        const searchMatch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           log.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
        const categoryMatch = !filterCategory || log.category === filterCategory;
        return searchMatch && categoryMatch;
    });

    const getCategoryBadge = (category: string) => {
        switch (category) {
            case 'impersonation': return <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20 uppercase text-[10px] tracking-widest font-black"><ShieldAlert className="h-3 w-3 mr-1" /> Impersonation</Badge>;
            case 'auth': return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 uppercase text-[10px] tracking-widest font-black"><User className="h-3 w-3 mr-1" /> Authentification</Badge>;
            case 'document': return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase text-[10px] tracking-widest font-black"><FileText className="h-3 w-3 mr-1" /> Document</Badge>;
            default: return <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20 uppercase text-[10px] tracking-widest font-black">{category}</Badge>;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
            case 'error': return <ShieldAlert className="h-4 w-4 text-red-500" />;
            case 'security': return <ShieldCheck className="h-4 w-4 text-primary" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                            <HistoryIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black font-space tracking-tight">Journal d'Audit</h1>
                            <p className="text-muted-foreground font-medium">Surveillance en temps réel des actions système et de l'accès aux données.</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl border-border/40 font-bold">
                        <Download className="h-4 w-4 mr-2" /> Exporter (CSV)
                    </Button>
                </div>
            </div>

            {/* Filters section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Rechercher par action, utilisateur ou email..." 
                        className="pl-12 h-14 rounded-2xl border-none premium-shadow bg-background/50 focus-visible:ring-primary"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <select 
                        className="w-full h-14 pl-12 pr-4 rounded-2xl border-none premium-shadow bg-background/50 appearance-none focus:ring-2 focus:ring-primary font-medium text-sm"
                        onChange={(e) => setFilterCategory(e.target.value || null)}
                    >
                        <option value="">Toutes les catégories</option>
                        <option value="impersonation">Impersonation</option>
                        <option value="auth">Authentification</option>
                        <option value="document">Documents</option>
                        <option value="system">Système</option>
                    </select>
                </div>
                <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="date" className="pl-12 h-14 rounded-2xl border-none premium-shadow bg-background/50" />
                </div>
            </div>

            {/* Logs Table */}
            <Card className="border-none premium-shadow overflow-hidden rounded-[2.5rem] glass-panel">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50 border-b-0">
                            <TableRow className="hover:bg-transparent border-b-0">
                                <TableHead className="w-[100px] font-black uppercase text-[10px] tracking-widest pl-8 py-6">Type</TableHead>
                                <TableHead className="w-[200px] font-black uppercase text-[10px] tracking-widest">Date & Heure</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest">Action</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest">Utilisateur</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest pr-8">Catégorie</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="border-b-border/10">
                                        <TableCell colSpan={5} className="py-8 text-center animate-pulse text-muted-foreground font-medium">Chargement des événements...</TableCell>
                                    </TableRow>
                                ))
                            ) : filteredLogs?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Search className="h-12 w-12 text-muted-foreground opacity-20" />
                                            <p className="text-muted-foreground font-medium">Aucun événement ne correspond à vos critères.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredLogs?.map((log) => (
                                <TableRow key={log.id} className="border-b border-border/10 hover:bg-primary/5 transition-colors group">
                                    <TableCell className="pl-8 py-5">
                                        {getTypeIcon(log.type)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground">
                                                {format(parseDate(log.date) || new Date(), 'dd MMMM yyyy', { locale: fr })}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {format(parseDate(log.date) || new Date(), 'HH:mm:ss')}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                                            {log.action}
                                        </p>
                                        {log.metadata && (
                                            <p className="text-[10px] text-muted-foreground mt-1 truncate max-w-md italic">
                                                ID Cible: {log.metadata.targetId || log.metadata.documentId || 'N/A'}
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm">{log.userName}</span>
                                            <span className="text-[10px] text-muted-foreground">{log.userEmail}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="pr-8">
                                        {getCategoryBadge(log.category)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
