'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useBranding } from '@/components/branding-provider';
import type { Document } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Download, FileSpreadsheet, CheckCircle, AlertTriangle, Sparkles, Filter, RefreshCw, FileText } from 'lucide-react';
import { downloadExport, ExportFormat } from '@/services/export-service';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ExportPage() {
    const [approvedDocs, setApprovedDocs] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<ExportFormat>('cegid');
    const { profile: userProfile } = useBranding();
    const { toast } = useToast();
    
    const cabinetId = userProfile?.cabinetId;
    const isAdmin = userProfile?.role === 'admin';

    const fetchApprovedDocs = async () => {
        setIsLoading(true);
        try {
            const baseQuery = collection(db, 'documents');
            const q = isAdmin 
                ? query(baseQuery, where('status', '==', 'approved'))
                : query(baseQuery, where('status', '==', 'approved'), where('cabinetId', '==', cabinetId));
                
            const snapshot = await getDocs(q);
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document));
            setApprovedDocs(docs);
        } catch (error) {
            console.error("Error fetching approved documents:", error);
            toast({
                title: "Erreur",
                description: "Impossible de récupérer les documents approuvés.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userProfile) {
            fetchApprovedDocs();
        }
    }, [userProfile, cabinetId, isAdmin]);

    const handleExport = async () => {
        if (approvedDocs.length === 0) return;
        setIsExporting(true);

        try {
            // 1. Déclenche le téléchargement via le nouveau service universel
            downloadExport(approvedDocs, exportFormat);

            // 2. Met à jour Firestore via Batch
            const batch = writeBatch(db);
            approvedDocs.forEach(docItem => {
                const docRef = doc(db, 'documents', docItem.id);
                batch.update(docRef, { 
                    status: 'exported', 
                    isExported: true,
                    exportDate: new Date().toISOString() 
                });
            });
            await batch.commit();

            toast({
                title: "Export Réussi",
                description: `${approvedDocs.length} factures générées au format ${exportFormat.toUpperCase()}.`,
            });

            // 3. Vide le tableau
            setApprovedDocs([]);

        } catch (error) {
            console.error("Export error:", error);
            toast({
                title: "Erreur d'export",
                description: "Une erreur est survenue lors de la génération.",
                variant: "destructive"
            });
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center">
                <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full animate-pulse" />
                </div>
                <p className="text-muted-foreground mt-6 font-medium animate-pulse">Synchronisation des écritures...</p>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-7xl mx-auto pb-20"
        >
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-2 font-space">
                            Comptabilité
                        </Badge>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-2 font-space">
                            {approvedDocs.length} Prêt{approvedDocs.length > 1 ? 's' : ''} pour Export
                        </Badge>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight font-space gradient-text">
                        Export Comptable
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        Générez vos écritures pour Cegid, Sage ou Quadra avec une imputation IA haute précision.
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
                        <span className="text-xs font-bold uppercase tracking-widest opacity-40 pl-2">Format</span>
                        <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
                            <SelectTrigger className="w-[140px] bg-transparent border-none font-bold font-space focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass-panel border-white/10">
                                <SelectItem value="cegid">Cegid TRA</SelectItem>
                                <SelectItem value="sage">Sage CSV</SelectItem>
                                <SelectItem value="fec">FEC DGFIP</SelectItem>
                                <SelectItem value="quadra">Quadra (WIP)</SelectItem>
                                <SelectItem value="acd">ACD (WIP)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <AnimatePresence>
                        {approvedDocs.length > 0 && (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                            >
                                <Button 
                                    size="lg" 
                                    onClick={handleExport} 
                                    disabled={isExporting}
                                    className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 h-14 px-8 text-lg font-space rounded-2xl group"
                                >
                                    {isExporting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5 group-hover:-translate-y-1 transition-transform" />}
                                    Exporter
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Stats Cards / Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass-panel border-none premium-shadow overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                    <CardHeader className="pb-2">
                        <CardDescription className="font-space uppercase tracking-wider text-[10px] font-bold text-blue-600/70">Volume total</CardDescription>
                        <CardTitle className="text-3xl font-black font-space">{approvedDocs.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Pièces en attente d'exportation vers Cegid</p>
                    </CardContent>
                </Card>

                <Card className="glass-panel border-none premium-shadow overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                    <CardHeader className="pb-2">
                        <CardDescription className="font-space uppercase tracking-wider text-[10px] font-bold text-emerald-600/70">Valeur totale</CardDescription>
                        <CardTitle className="text-3xl font-black font-space">
                            {approvedDocs.reduce((acc, doc) => acc + (doc.extractedData?.amounts?.[0] || 0), 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Volume financier cumulé des pièces validées</p>
                    </CardContent>
                </Card>

                <Card className="glass-panel border-none premium-shadow overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                    <CardHeader className="pb-2">
                        <CardDescription className="font-space uppercase tracking-wider text-[10px] font-bold text-purple-600/70">Prochaine Étape</CardDescription>
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-xl font-black font-space">Intégration Cegid</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground italic font-medium">Format Expert Comptable (.csv)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Table */}
            <Card className="glass-panel border-none premium-shadow overflow-hidden">
                <CardHeader className="border-b border-white/10 bg-white/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="font-space text-xl">Factures prêtes à l'export</CardTitle>
                            <CardDescription className="font-medium text-muted-foreground/80 mt-1">
                                Les imputations ont été générées et validées.
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={fetchApprovedDocs} className="hover:bg-white/10">
                            <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {approvedDocs.length === 0 ? (
                        <div className="py-24 flex flex-col items-center justify-center text-center">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 blur-3xl bg-emerald-500/10 rounded-full scale-150 animate-pulse" />
                                <div className="relative bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20">
                                    <CheckCircle className="h-16 w-16 text-emerald-500" />
                                </div>
                            </div>
                            <h3 className="font-space text-2xl font-black text-foreground">File d'exportation vide</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm text-lg">
                                Félicitations ! Tous les documents validés ont été exportés avec succès.
                            </p>
                            <Button variant="outline" className="mt-8 rounded-xl border-white/10" asChild>
                                <a href="/dashboard/scan">Scanner de nouveaux documents</a>
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30 border-none hover:bg-muted/30">
                                        <TableHead className="font-space uppercase text-[10px] font-bold tracking-widest pl-8">Pièce</TableHead>
                                        <TableHead className="font-space uppercase text-[10px] font-bold tracking-widest">Tiers / Fournisseur</TableHead>
                                        <TableHead className="font-space uppercase text-[10px] font-bold tracking-widest">Montant TTC</TableHead>
                                        <TableHead className="font-space uppercase text-[10px] font-bold tracking-widest">Compte Charge</TableHead>
                                        <TableHead className="font-space uppercase text-[10px] font-bold tracking-widest">Compte Tiers</TableHead>
                                        <TableHead className="font-space uppercase text-[10px] font-bold tracking-widest pr-8 text-right">Qualité IA</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {approvedDocs.map((docItem, idx) => {
                                        const vendor = docItem.extractedData?.vendorNames?.[0] || 'Inconnu';
                                        const amount = docItem.extractedData?.amounts?.[0] || 0;
                                        const entry = docItem.extractedData?.accountingEntry;
                                        const score = entry?.confidenceScore || 0;
                                        const category = docItem.extractedData?.category || 'Achat';

                                        return (
                                            <motion.tr 
                                                key={docItem.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group hover:bg-white/5 border-white/5"
                                            >
                                                <TableCell className="pl-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-primary/10 rounded-lg group-hover:scale-110 transition-transform text-primary">
                                                            <FileText className="h-4 w-4" />
                                                        </div>
                                                        <span className="font-medium text-sm truncate max-w-[200px]" title={docItem.name}>
                                                            {docItem.name}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-black font-space text-base">{vendor}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-black font-space text-base">
                                                        {amount.toLocaleString('fr-FR')} €
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-mono text-sm text-primary font-bold bg-primary/5 px-2 py-1 rounded w-fit">
                                                            {entry?.debitAccount || '6xxx'}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter truncate max-w-[120px]">
                                                            {category}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-mono text-sm text-muted-foreground font-bold bg-white/5 px-2 py-1 rounded w-fit">
                                                            {entry?.creditAccount || '401xxx'}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter">Journal HA</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="pr-8 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="w-12 bg-white/10 h-1.5 rounded-full overflow-hidden hidden sm:block">
                                                            <div 
                                                                className={`h-full rounded-full ${
                                                                    score >= 90 ? 'bg-emerald-500' : score >= 70 ? 'bg-orange-500' : 'bg-red-500'
                                                                }`} 
                                                                style={{ width: `${score}%` }}
                                                            />
                                                        </div>
                                                        <span className={`text-xs font-black font-space ${
                                                            score >= 90 ? 'text-emerald-500' : score >= 70 ? 'text-orange-500' : 'text-red-500'
                                                        }`}>
                                                            {score}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </motion.tr>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Help / Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-panel p-6 rounded-3xl border-none premium-shadow bg-primary/5 flex gap-4">
                    <div className="p-4 bg-primary/10 rounded-2xl h-fit">
                        <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-space font-black text-lg mb-1">Moteur Multi-Format</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Exportez vers <strong>Cegid Expert</strong> (format .TRA) ou <strong>Sage 100</strong> (format .CSV). 
                            L'IA a déjà paramétré les comptes de charges et de TVA pour une intégration directe.
                        </p>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-3xl border-none premium-shadow bg-emerald-600/5 flex gap-4">
                    <div className="p-4 bg-emerald-600/10 rounded-2xl h-fit">
                        <Filter className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <h4 className="font-space font-black text-lg mb-1">Traçabilité & Piste d'Audit</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Chaque pièce exportée est marquée définitivement. L'historique conserve la date d'exportation et le format utilisé pour garantir une piste d'audit fiable.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
