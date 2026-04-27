'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import {
  Landmark, Upload, CheckCircle, AlertTriangle, Clock, ChevronRight,
  Loader2, FileSpreadsheet, Users, Zap, RotateCcw, ShieldCheck,
  TrendingUp, AlertCircle, Info, DownloadCloud, X, Search, Sparkles,
  ArrowRight, FileText, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { runBankReconciliation, saveBankReconciliation } from '@/ai/flows/reconcile-actions';
import type { Client } from '@/lib/types';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  matchingDocumentId?: string;
  confidenceScore?: number;
  isAnomaly?: boolean;
  anomalyReason?: string;
}

type Step = 'client' | 'import' | 'results';

// ─── Step Indicator ───────────────────────────────────────────────────────────

const steps: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'client', label: 'Client', icon: Users },
  { id: 'import', label: 'Import', icon: FileSpreadsheet },
  { id: 'results', label: 'Analyse', icon: Landmark },
];

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);
  return (
    <div className="flex items-center justify-center gap-4 mb-12">
      {steps.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        const Icon = step.icon;
        
        return (
          <div key={step.id} className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <motion.div
                initial={false}
                animate={{ 
                  backgroundColor: isActive ? 'hsl(var(--primary))' : isDone ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  borderColor: isActive ? 'transparent' : isDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  scale: isActive ? 1.1 : 1
                }}
                className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-xl",
                  isActive ? "shadow-primary/30" : "shadow-none"
                )}
              >
                {isDone ? (
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                ) : (
                  <Icon className={cn("h-6 w-6", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                )}
              </motion.div>
              <span className={cn(
                "text-[10px] font-space uppercase tracking-widest font-bold",
                isActive ? "text-foreground" : "text-muted-foreground/60"
              )}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="h-[2px] w-12 bg-border relative -mt-5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: isDone ? '100%' : '0%' }}
                  className="absolute inset-0 bg-emerald-500 transition-all duration-1000"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Client Selection ─────────────────────────────────────────────────

import { useBranding } from '@/components/branding-provider';

function StepClient({ onSelect }: { onSelect: (client: Client) => void }) {
  const { role: userRole, profile, isLoading: isBrandingLoading } = useBranding();

  const isStaff = useMemo(() => userRole && ['accountant', 'admin'].includes(userRole), [userRole]);

  const clientsQuery = useMemoFirebase(() => {
    if (!isStaff || !userRole) return null;
    
    // Admin sees everything
    if (userRole === 'admin') {
        return query(collection(db, 'clients'), where('role', '==', 'client'));
    }
    
    // Accountant MUST have a cabinetId
    if (profile?.cabinetId) {
        return query(collection(db, 'clients'), where('role', '==', 'client'), where('cabinetId', '==', profile.cabinetId));
    }
    
    return null;
  }, [isStaff, userRole, profile?.cabinetId]);

  const { data: clients, isLoading: isCollectionLoading } = useCollection<Client>(clientsQuery);
  const activeClients = useMemo(() => clients || [], [clients]);

  const isLoading = isBrandingLoading || isCollectionLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-32 w-full rounded-3xl bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-black font-space">Choisissez un dossier</h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto font-medium">
          Sélectionnez le client pour lequel vous souhaitez lancer le rapprochement intelligent.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {activeClients.map((client, idx) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card 
                onClick={() => onSelect(client)}
                className="glass-panel border-none premium-shadow hover:bg-white/10 cursor-pointer transition-all duration-300 group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                <CardContent className="p-6 flex items-center gap-4 relative">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-xl font-space shadow-inner">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black font-space text-lg truncate group-hover:text-primary transition-colors">{client.name}</p>
                    <p className="text-xs text-muted-foreground font-medium truncate">{client.email}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {activeClients.length === 0 && (
        <div className="glass-panel p-20 text-center rounded-3xl">
          <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-black font-space">Aucun client actif</h3>
          <p className="text-muted-foreground mt-2">Veuillez d'abord enregistrer des dossiers clients dans vos paramètres.</p>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: CSV Import ───────────────────────────────────────────────────────

function StepImport({
  client,
  onTransactionsParsed,
  onBack,
}: {
  client: Client;
  onTransactionsParsed: (transactions: ParsedTransaction[]) => void;
  onBack: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<ParsedTransaction[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const detectColumns = (headers: string[]): { date: number; desc: number; amount: number } | null => {
    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const h = headers.map(normalize);
    const dateIdx = h.findIndex(s => ['date', 'jour', 'operation', 'valeur'].some(k => s.includes(k)));
    const descIdx = h.findIndex(s => ['libelle', 'description', 'label', 'detail', 'intitule', 'motif'].some(k => s.includes(k)));
    const amountIdx = h.findIndex(s => ['montant', 'amount', 'debit', 'credit', 'valeur', 'somme'].some(k => s.includes(k)));
    if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) return null;
    return { date: dateIdx, desc: descIdx, amount: amountIdx };
  };

  const parseFile = useCallback((file: File) => {
    setParseError(null);
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const cols = detectColumns(headers);
        const rows = results.data as Record<string, string>[];
        
        let transactions: ParsedTransaction[] = [];
        if (cols) {
          transactions = rows.slice(0, 200).map(row => ({
            date: String(row[headers[cols.date]] || ''),
            description: String(row[headers[cols.desc]] || ''),
            amount: parseFloat(String(row[headers[cols.amount]] || '0').replace(',', '.').replace(/\s/g, '')) || 0,
          })).filter(t => t.date && t.description);
        } else {
          // Fallback positional
          const colKeys = headers.length > 0 ? headers : Object.keys(rows[0] || {});
          transactions = rows.slice(0, 200).map(row => ({
            date: String(row[colKeys[0]] || ''),
            description: String(row[colKeys[1]] || row[colKeys[2]] || ''),
            amount: parseFloat(String(row[colKeys[colKeys.length - 1]] || '0').replace(',', '.').replace(/\s/g, '')) || 0,
          })).filter(t => t.date && t.description);
        }

        if (transactions.length === 0) {
          setParseError("Impossible d'extraire des transactions valides.");
          return;
        }
        setPreview(transactions);
        toast({ title: "Importation préparée", description: `${transactions.length} lignes prêtes à être analysées.` });
      },
      error: (error) => setParseError(`Erreur : ${error.message}`)
    });
  }, [toast]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Client Context Badge */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-4 flex items-center justify-between border-blue-500/10"
      >
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-600 font-black font-space">
            {client.name.charAt(0)}
          </div>
          <div>
            <p className="font-black font-space">{client.name}</p>
            <p className="text-xs text-muted-foreground font-medium">{client.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} className="rounded-xl hover:bg-white/10 gap-2 font-space uppercase text-[10px] tracking-widest font-bold">
          <RotateCcw className="h-3 w-3" /> Changer de client
        </Button>
      </motion.div>

      {!preview ? (
        <motion.div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if(f) parseFile(f); }}
          className={cn(
            'glass-panel border-2 border-dashed rounded-[2rem] p-20 text-center cursor-pointer transition-all duration-500',
            isDragging ? 'border-primary bg-primary/5 scale-[1.02] shadow-2xl shadow-primary/20' : 'border-white/10 hover:border-primary/50'
          )}
        >
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if(f) parseFile(f); }} />
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full animate-pulse" />
            <div className="relative bg-primary/10 p-6 rounded-3xl border border-primary/20">
              <Upload className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h3 className="text-2xl font-black font-space mb-2">Importer le relevé bancaire</h3>
          <p className="text-muted-foreground font-medium text-lg max-w-sm mx-auto">
            Glissez-déposez le fichier CSV fourni par votre banque pour lancer l'analyse intelligente.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Badge variant="outline" className="bg-white/5 border-white/10 px-3 py-1 text-[10px] font-space font-bold uppercase tracking-widest">CSV Supporté</Badge>
            <Badge variant="outline" className="bg-white/5 border-white/10 px-3 py-1 text-[10px] font-space font-bold uppercase tracking-widest">Format Bancaire</Badge>
            <Badge variant="outline" className="bg-white/5 border-white/10 px-3 py-1 text-[10px] font-space font-bold uppercase tracking-widest">Max 200 lignes</Badge>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-black font-space flex items-center gap-2">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
                Aperçu du relevé
              </h3>
              <p className="text-sm font-medium text-muted-foreground italic">{fileName}</p>
            </div>
            <Button variant="ghost" className="rounded-xl border border-white/10 gap-2" onClick={() => { setPreview(null); setFileName(null); }}>
              <RotateCcw className="h-4 w-4" /> Réinitialiser
            </Button>
          </div>

          <Card className="glass-panel border-none overflow-hidden premium-shadow">
            <ScrollArea className="h-72">
              <Table>
                <TableHeader className="bg-white/5 font-space sticky top-0 z-10">
                  <TableRow className="border-white/10">
                    <TableHead className="w-24 uppercase text-[10px] tracking-widest font-black">Date</TableHead>
                    <TableHead className="uppercase text-[10px] tracking-widest font-black">Libellé</TableHead>
                    <TableHead className="w-32 uppercase text-[10px] tracking-widest font-black text-right pr-6">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((t, i) => (
                    <TableRow key={i} className="border-white/5 hover:bg-white/5">
                      <td className="p-4 font-mono text-xs tabular-nums opacity-70">{t.date}</td>
                      <td className="p-4 font-semibold text-sm max-w-md truncate">{t.description}</td>
                      <td className={cn(
                        "p-4 text-right font-black font-space tabular-nums pr-6",
                        t.amount < 0 ? "text-red-500" : "text-emerald-500"
                      )}>
                        {t.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                      </td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>

          <Button 
            className="w-full h-16 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-primary-foreground font-black font-space text-lg shadow-2xl shadow-primary/30 group" 
            onClick={() => onTransactionsParsed(preview)}
          >
            <Zap className="mr-3 h-6 w-6 group-hover:scale-125 transition-transform" />
            Lancer le lettrage IA sur {preview.length} transactions
          </Button>
        </motion.div>
      )}

      {parseError && (
        <Alert variant="destructive" className="rounded-2xl border-none bg-red-500/10 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-space font-black">Erreur de structure</AlertTitle>
          <AlertDescription className="font-medium">{parseError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ─── Step 3: Results ──────────────────────────────────────────────────────────

function StepResults({
  transactions,
  client,
  onReset,
}: {
  transactions: ParsedTransaction[];
  client: Client;
  onReset: () => void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

  const matched = transactions.filter(t => t.matchingDocumentId);
  const anomalies = transactions.filter(t => t.isAnomaly);
  const pending = transactions.filter(t => !t.matchingDocumentId && !t.isAnomaly);
  const matchRate = ((matched.length / transactions.length) * 100).toFixed(0);

  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Description', 'Montant', 'Statut', 'Document ID', 'Score IA'],
      ...transactions.map(t => [
        t.date, t.description, t.amount.toFixed(2),
        t.matchingDocumentId ? 'Lettré' : t.isAnomaly ? 'Anomalie' : 'En attente',
        t.matchingDocumentId || '', t.confidenceScore ? `${t.confidenceScore}%` : '',
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lettrage_${client.name}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveResults = async () => {
    setIsSaving(true);
    try {
      const res = await saveBankReconciliation({
        clientId: client.id,
        clientName: client.name,
        summary: {
          totalTransactions: transactions.length,
          matchedTransactions: matched.length,
          totalAmount: transactions.reduce((acc, t) => acc + t.amount, 0),
          matchedAmount: matched.reduce((acc, t) => acc + t.amount, 0),
          anomalyCount: anomalies.length
        },
        matches: matched.map(m => ({ date: m.date, description: m.description, amount: m.amount, documentId: m.matchingDocumentId, score: m.confidenceScore })),
        anomalies: anomalies.map(a => ({ date: a.date, description: a.description, amount: a.amount, reason: a.anomalyReason }))
      });
      if (!res.success) throw new Error(res.error);
      setIsSaved(true);
      toast({ title: 'Rapport archivé', description: 'Le rapprochement est désormais disponible dans le dossier permanent.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Stats Dash */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Taux Matching', value: `${matchRate}%`, icon: BarChart3, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Lettrées', value: matched.length, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Anomalies', value: anomalies.length, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'A Justifier', value: pending.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }, idx) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="glass-panel border-none premium-shadow overflow-hidden group">
              <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500", bg)} />
              <CardContent className="p-6 relative text-center space-y-2">
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center mx-auto', bg)}>
                  <Icon className={cn('h-5 w-5', color)} />
                </div>
                <div className={cn('text-3xl font-black font-space', color)}>{value}</div>
                <div className="text-[10px] font-space font-black uppercase tracking-widest text-muted-foreground">{label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Results Table */}
      <Card className="glass-panel border-none premium-shadow overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-white/5 px-8 flex-row items-center justify-between">
          <div>
            <CardTitle className="font-space text-2xl font-black">Historique du rapprochement</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">Analyse comparative IA vs Relevé Bancaire</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="rounded-xl border-white/10 gap-2 font-space font-bold uppercase text-[10px] tracking-widest">
            <DownloadCloud className="h-4 w-4" /> Exporter Rapport
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[450px]">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-white/5 sticky top-0 z-20">
                <tr className="border-b border-white/10">
                  <th className="px-8 py-4 text-left font-space uppercase text-[10px] font-black tracking-widest text-muted-foreground">Date</th>
                  <th className="px-8 py-4 text-left font-space uppercase text-[10px] font-black tracking-widest text-muted-foreground">Virement / Transaction</th>
                  <th className="px-4 py-4 text-right font-space uppercase text-[10px] font-black tracking-widest text-muted-foreground">Montant</th>
                  <th className="px-8 py-4 text-center font-space uppercase text-[10px] font-black tracking-widest text-muted-foreground">Statut Lettrage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((t, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={cn(
                      'group transition-all duration-300',
                      t.isAnomaly ? 'bg-red-500/[0.03] hover:bg-red-500/[0.08]' :
                      t.matchingDocumentId ? 'bg-emerald-500/[0.03] hover:bg-emerald-500/[0.08]' : 'hover:bg-white/5'
                    )}
                  >
                    <td className="px-8 py-4 font-mono text-xs tabular-nums opacity-60">{t.date}</td>
                    <td className="px-8 py-4">
                      <div className="font-bold text-sm truncate font-space max-w-sm" title={t.description}>{t.description}</div>
                    </td>
                    <td className={cn(
                      'px-4 py-4 text-right font-black font-space text-sm tabular-nums',
                      t.amount < 0 ? 'text-red-500' : 'text-emerald-500'
                    )}>
                      {t.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </td>
                    <td className="px-8 py-4 text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <AnimatePresence>
                              {t.matchingDocumentId ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 font-space font-black uppercase text-[10px] tracking-widest rounded-lg">
                                  <Sparkles className="h-3 w-3 mr-1.5 inline-block" />
                                  Match IA {t.confidenceScore}%
                                </Badge>
                              ) : t.isAnomaly ? (
                                <Badge variant="destructive" className="px-3 py-1 font-space font-black uppercase text-[10px] tracking-widest rounded-lg">
                                  <AlertTriangle className="h-3 w-3 mr-1.5 inline-block" />
                                  Anomalie
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-amber-500/20 text-amber-600 px-3 py-1 font-space font-black uppercase text-[10px] tracking-widest rounded-lg">
                                  <Clock className="h-3 w-3 mr-1.5 inline-block" />
                                  En attente
                                </Badge>
                              )}
                            </AnimatePresence>
                          </TooltipTrigger>
                          <TooltipContent className="glass-panel border-white/10 p-4 max-w-xs shadow-2xl">
                            {t.matchingDocumentId && <p className="font-space font-black mb-1">🔍 Facture trouvée</p>}
                            {t.matchingDocumentId && <p className="text-xs opacity-70">Réf : {t.matchingDocumentId}</p>}
                            {t.isAnomaly && <p className="text-xs text-red-500 font-bold">{t.anomalyReason}</p>}
                            {!t.matchingDocumentId && !t.isAnomaly && <p className="text-xs italic opacity-60">Aucune pièce comptable ne semble correspondre à ce montant / libellé.</p>}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-6 pb-12">
        <Button 
          size="lg"
          onClick={handleSaveResults} 
          disabled={isSaving || isSaved}
          className={cn(
            "h-14 px-8 rounded-2xl font-black font-space text-lg transition-all duration-500",
            isSaved ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30" : "bg-primary shadow-primary/30"
          )}
        >
          {isSaving ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : isSaved ? <ShieldCheck className="h-6 w-6 mr-3" /> : <ShieldCheck className="h-6 w-6 mr-3" />}
          {isSaved ? "Rapport archivé avec succès" : "Enregistrer et archiver"}
        </Button>
        <Button variant="ghost" size="lg" onClick={onReset} className="h-14 font-space font-black uppercase tracking-widest text-sm hover:bg-white/5">
          <RotateCcw className="h-4 w-4 mr-2" /> Nouveau Rapprochement
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReconciliationPage() {
  const [step, setStep] = useState<Step>('client');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[] | null>(null);
  const [reconciledTransactions, setReconciledTransactions] = useState<ParsedTransaction[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleTransactionsParsed = async (transactions: ParsedTransaction[]) => {
    if (!selectedClient) return;
    setParsedTransactions(transactions);
    setIsProcessing(true);
    setStep('results');

    try {
      const result = await runBankReconciliation(
        transactions.map(t => ({ date: t.date, description: t.description, amount: t.amount })),
        selectedClient.id
      );
      if (!result.success) throw new Error(result.error);
      const enriched = [...transactions];
      if ('matches' in result && result.matches) {
        result.matches.forEach((m: any) => { if (enriched[m.transactionIndex]) { enriched[m.transactionIndex].matchingDocumentId = m.documentId; enriched[m.transactionIndex].confidenceScore = m.confidenceScore; } });
      }
      if ('anomalies' in result && result.anomalies) {
        result.anomalies.forEach((a: any) => { if (enriched[a.transactionIndex]) { enriched[a.transactionIndex].isAnomaly = true; enriched[a.transactionIndex].anomalyReason = a.reason; } });
      }
      setReconciledTransactions(enriched);
      toast({ title: 'Analyse terminée', description: `${enriched.filter(t => t.matchingDocumentId).length} lettrages automatiques effectués.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Échec IA', description: err.message });
      setStep('import');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 pb-20 max-w-7xl mx-auto"
    >
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-space font-black uppercase tracking-widest text-[10px]">
            Intelligence Bancaire
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black font-space tracking-tight gradient-text">
            Rapprochement
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl font-medium">
            Laissez notre moteur d'IA croiser vos relevés bancaires avec vos justificatifs pour un lettrage chirurgical.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-6 p-6 glass-panel rounded-[2rem]">
          <div className="text-right">
            <p className="text-[10px] font-space font-black uppercase tracking-widest text-muted-foreground opacity-60">Précision IA</p>
            <p className="text-2xl font-black font-space">99.8%</p>
          </div>
          <div className="h-10 w-[1px] bg-white/10" />
          <div className="text-right">
            <p className="text-[10px] font-space font-black uppercase tracking-widest text-muted-foreground opacity-60">Temps moyen</p>
            <p className="text-2xl font-black font-space">1.2s</p>
          </div>
        </div>
      </div>

      <StepIndicator currentStep={step} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.02, y: -10 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {step === 'client' && <StepClient onSelect={(c) => { setSelectedClient(c); setStep('import'); }} />}

          {step === 'import' && selectedClient && (
            <StepImport client={selectedClient} onTransactionsParsed={handleTransactionsParsed} onBack={() => setStep('client')} />
          )}

          {step === 'results' && selectedClient && (
            isProcessing ? (
              <div className="flex flex-col items-center justify-center py-40 gap-8">
                <div className="relative">
                  <div className="absolute inset-0 blur-3xl bg-primary/30 rounded-full animate-pulse scale-150" />
                  <div className="relative h-24 w-24 rounded-[2rem] border-4 border-white/5 border-t-primary animate-spin flex items-center justify-center">
                    <Landmark className="h-8 w-8 text-primary -rotate-[360deg] transition-all duration-300" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black font-space">IA en pleine réflexion...</h3>
                  <p className="text-muted-foreground font-medium text-lg">
                    Recherche de correspondances pour {parsedTransactions?.length} transactions.
                  </p>
                </div>
              </div>
            ) : reconciledTransactions ? (
              <StepResults transactions={reconciledTransactions} client={selectedClient} onReset={() => setStep('client')} />
            ) : null
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
