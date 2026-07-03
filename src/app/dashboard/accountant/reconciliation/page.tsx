'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import {
  Landmark, Upload, CheckCircle, AlertTriangle, Clock, ChevronRight,
  Loader2, FileSpreadsheet, Users, Zap, RotateCcw, ShieldCheck,
  TrendingUp, AlertCircle, Info, DownloadCloud, X, Search, Sparkles,
  ArrowRight, FileText, BarChart3, Link2, RefreshCw, CheckCircle2, Mail
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
import { collection, query, where, doc, writeBatch, limit } from 'firebase/firestore';
import { db, useCollection, useMemoFirebase } from '@/firebase';
import { runBankReconciliation, saveBankReconciliation } from '@/services/bank-reconciliation-service';
import { getBankAuthLink, syncBankTransactions, finalizeBankConnection } from '@/services/bank-connection-service';
import type { Client, Document } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  matchingDocumentId?: string;
  suggestedDocumentId?: string;
  confidenceScore?: number;
  isAnomaly?: boolean;
  anomalyReason?: string;
}

type Step = 'client' | 'import' | 'results';
type ImportMode = 'csv' | 'bank';

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
  const [mode, setMode] = useState<ImportMode>(client.hasBankConnected ? 'bank' : 'csv');
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<ParsedTransaction[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isHunting, setIsHunting] = useState(false);
  const [isReminding, setIsReminding] = useState(false);
  const [pendingRequisition, setPendingRequisition] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedReqId = localStorage.getItem('pendingRequisitionId');
    const savedClientId = localStorage.getItem('pendingClientId');
    if (savedReqId && savedClientId === client.id) {
      setPendingRequisition(savedReqId);
    }
  }, [client.id]);

  const handleFinalizeConnection = async () => {
    if (!pendingRequisition) return;
    setIsSyncing(true);
    try {
      const res = await finalizeBankConnection(client.id, client.cabinetId, pendingRequisition);
      if (res.success) {
        toast({ title: "Banque Connectée", description: "La connexion bancaire a été finalisée avec succès." });
        localStorage.removeItem('pendingRequisitionId');
        localStorage.removeItem('pendingClientId');
        localStorage.removeItem('pendingCabinetId');
        setPendingRequisition(null);
        window.location.reload();
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erreur Finalisation', description: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRunGhostHunter = async () => {
    setIsHunting(true);
    try {
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('@/firebase');
      const runGhostHunter = httpsCallable(functions, 'runGhostHunter');
      const result = await runGhostHunter({ clientId: client.id }) as any;
      toast({
        title: "Ghost Hunter terminé",
        description: `${result.data?.count || 0} justificatifs manquants détectés.`
      });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erreur Ghost Hunter', description: err.message });
    } finally {
      setIsHunting(false);
    }
  };

  const handleSendReminders = async () => {
    setIsReminding(true);
    try {
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('@/firebase');
      const sendReminders = httpsCallable(functions, 'sendGhostHunterReminders');
      const result = await sendReminders({ clientId: client.id }) as any;
      if (result.data?.sent) {
        toast({
          title: "📧 Relance envoyée !",
          description: `Un email personnalisé a été envoyé à ${result.data.email} pour ${result.data.count} justificatif${result.data.count > 1 ? 's' : ''} manquant${result.data.count > 1 ? 's' : ''}.`,
        });
      } else {
        toast({
          title: "Aucune relance nécessaire",
          description: "Tous les justificatifs ont déjà été relancés ou sont résolus.",
        });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erreur de relance', description: err.message });
    } finally {
      setIsReminding(false);
    }
  };

  const handleBankSync = async () => {
    setIsSyncing(true);
    try {
        const res = await syncBankTransactions(client.id);
        if (res.success && res.transactions) {
            setPreview(res.transactions as any);
            setFileName(`Synchronisation Bancaire - ${new Date().toLocaleDateString()}`);
            toast({ title: "Synchronisation réussie", description: `${res.transactions.length} transactions récupérées.` });
        } else {
            throw new Error(res.error);
        }
    } catch (err: any) {
        toast({ variant: 'destructive', title: 'Erreur Synchro', description: err.message });
    } finally {
        setIsSyncing(false);
    }
  };

  const handleConnectBank = async () => {
    try {
        const res = await getBankAuthLink(client.id, client.cabinetId || '');
        if (res.success && res.url) {
            if (res.requisitionId) {
              localStorage.setItem('pendingRequisitionId', res.requisitionId);
              localStorage.setItem('pendingClientId', client.id);
              localStorage.setItem('pendingCabinetId', client.cabinetId || '');
              setPendingRequisition(res.requisitionId);
            }
            window.open(res.url, '_blank');
            toast({ 
                title: "Redirection Bancaire", 
                description: "Veuillez valider l'accès sur l'interface de la banque. Une fois terminé, cliquez sur 'Finaliser la liaison'." 
            });
        }
    } catch (err: any) {
        toast({ variant: 'destructive', title: 'Erreur Connexion', description: err.message });
    }
  };

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
        <div className="flex items-center gap-4">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <Button 
                    variant={mode === 'csv' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setMode('csv')}
                    className="rounded-lg h-8 px-4 text-[10px] font-bold uppercase tracking-widest"
                >
                    <FileSpreadsheet className="h-3 w-3 mr-2" /> CSV
                </Button>
                <Button 
                    variant={mode === 'bank' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setMode('bank')}
                    className="rounded-lg h-8 px-4 text-[10px] font-bold uppercase tracking-widest"
                >
                    <Landmark className="h-3 w-3 mr-2" /> Banque
                </Button>
            </div>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRunGhostHunter} 
                disabled={isHunting}
                className="rounded-xl border-orange-500/20 text-orange-500 hover:bg-orange-500/10 gap-2 font-space uppercase text-[10px] tracking-widest font-bold"
            >
                <Search className={cn("h-3 w-3", isHunting && "animate-spin")} /> 
                {isHunting ? 'Analyse...' : 'Ghost-Hunter'}
            </Button>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSendReminders} 
                disabled={isReminding}
                className="rounded-xl border-violet-500/20 text-violet-500 hover:bg-violet-500/10 gap-2 font-space uppercase text-[10px] tracking-widest font-bold"
            >
                <Mail className={cn("h-3 w-3", isReminding && "animate-bounce")} /> 
                {isReminding ? 'Envoi...' : 'Relancer'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onBack} className="rounded-xl hover:bg-white/10 gap-2 font-space uppercase text-[10px] tracking-widest font-bold">
                <RotateCcw className="h-3 w-3" /> Changer
            </Button>
        </div>
      </motion.div>

      {!preview ? (
        mode === 'csv' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
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
            </motion.div>
        ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel rounded-[2rem] p-12 text-center border-none premium-shadow bg-gradient-to-br from-blue-500/5 to-transparent"
            >
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 blur-3xl bg-blue-500/20 rounded-full animate-pulse" />
                <div className="relative bg-blue-500/10 p-8 rounded-[2rem] border border-blue-500/20">
                  <Landmark className="h-16 w-16 text-blue-500" />
                </div>
              </div>
              <h3 className="text-3xl font-black font-space mb-3">Synchronisation Directe</h3>
              
              {!client.hasBankConnected ? (
                  <div className="space-y-6">
                      <p className="text-muted-foreground font-medium text-lg max-w-md mx-auto">
                        Automatisez la récupération des flux bancaires en connectant le compte de votre client via notre partenaire sécurisé GoCardless / Nordigen.
                      </p>
                      <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button 
                          onClick={handleConnectBank}
                          className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black font-space text-lg shadow-xl shadow-blue-500/20"
                        >
                          <Link2 className="mr-3 h-5 w-5" /> Connecter un compte bancaire
                        </Button>
                        {pendingRequisition && (
                          <Button 
                            onClick={handleFinalizeConnection}
                            disabled={isSyncing}
                            className="h-14 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black font-space text-lg shadow-xl shadow-emerald-500/20"
                          >
                            <CheckCircle2 className="mr-3 h-5 w-5" /> Finaliser la liaison
                          </Button>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter opacity-50">Accès 90 jours • Securité Bancaire • RGPD Compliant</p>
                  </div>
              ) : (
                  <div className="space-y-8">
                      <div className="flex items-center justify-center gap-2">
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-4 py-1.5 rounded-full font-space font-black uppercase text-[10px] tracking-widest">
                            <CheckCircle2 className="h-3 w-3 mr-2" /> Banque de Démonstration Connectée
                        </Badge>
                      </div>
                      <p className="text-muted-foreground font-medium text-lg max-w-sm mx-auto">
                        Le compte est prêt. Lancez la synchronisation pour récupérer les dernières transactions en temps réel.
                      </p>
                      <Button 
                        onClick={handleBankSync}
                        disabled={isSyncing}
                        className="h-16 w-full max-w-md rounded-[1.5rem] bg-primary hover:bg-primary/90 text-primary-foreground font-black font-space text-lg shadow-2xl shadow-primary/30 group"
                      >
                        {isSyncing ? (
                            <RefreshCw className="h-6 w-6 animate-spin mr-3" />
                        ) : (
                            <Zap className="mr-3 h-6 w-6 group-hover:scale-125 transition-transform" />
                        )}
                        Synchroniser & Analyser
                      </Button>
                  </div>
              )}
            </motion.div>
        )
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
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for dual pane interactions
  const [selectedTxIdx, setSelectedTxIdx] = useState<number | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [draggedDocId, setDraggedDocId] = useState<string | null>(null);
  const [dragOverTxIdx, setDragOverTxIdx] = useState<number | null>(null);
  const [localTransactions, setLocalTransactions] = useState<ParsedTransaction[]>(transactions);
  const [pendingLink, setPendingLink] = useState<{
    txIndex: number;
    docId: string;
    txAmount: number;
    docAmount: number;
  } | null>(null);

  // Fetch approved documents for this client
  const documentsQuery = useMemoFirebase(() => {
    if (!client.id) return null;
    return query(collection(db, 'documents'), where('clientId', '==', client.id), where('status', '==', 'approved'), limit(200));
  }, [client.id]);

  const { data: documents } = useCollection<Document>(documentsQuery);

  const matched = localTransactions.filter(t => t.matchingDocumentId);
  const anomalies = localTransactions.filter(t => t.isAnomaly);
  const pending = localTransactions.filter(t => !t.matchingDocumentId && !t.isAnomaly);
  const matchRate = localTransactions.length ? ((matched.length / localTransactions.length) * 100).toFixed(0) : '0';

  const availableDocuments = useMemo(() => {
    if (!documents) return [];
    // Filter out documents that are already matched in localTransactions
    const matchedDocIds = new Set(matched.map(m => m.matchingDocumentId));
    return documents.filter(doc => !matchedDocIds.has(doc.id) && doc.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [documents, matched, searchQuery]);

  const executeLink = useCallback((txIndex: number, docId: string, isAiSuggestion = false) => {
    const newTxs = [...localTransactions];
    newTxs[txIndex].matchingDocumentId = docId;
    if (!isAiSuggestion) {
      newTxs[txIndex].confidenceScore = 100; // Manual match
      newTxs[txIndex].isAnomaly = false;
    }
    setLocalTransactions(newTxs);
    setSelectedTxIdx(null);
    setSelectedDocId(null);
    setDragOverTxIdx(null);
    setDraggedDocId(null);
    toast({ title: 'Rapprochement effectué', description: 'Transaction et facture liées avec succès.' });
  }, [localTransactions, toast]);

  const handleLink = (txIndex: number, docId: string, isAiSuggestion = false) => {
    if (isAiSuggestion) {
      executeLink(txIndex, docId, true);
      return;
    }

    const doc = documents?.find(d => d.id === docId);
    if (doc) {
      const amountHT = doc.extractedData?.amounts?.[0] || 0;
      const vatAmount = doc.extractedData?.vatAmount || 0;
      const docAmount = amountHT + vatAmount;
      const txAmount = Math.abs(localTransactions[txIndex].amount);

      if (Math.abs(docAmount - txAmount) > 0.01) {
        setPendingLink({ txIndex, docId, txAmount, docAmount });
        return;
      }
    }
    executeLink(txIndex, docId, false);
  };

  const handleValidateAll = () => {
    let count = 0;
    const newTxs = localTransactions.map((tx) => {
      if (!tx.matchingDocumentId && !tx.isAnomaly && tx.suggestedDocumentId && tx.confidenceScore && tx.confidenceScore >= 90) {
        count++;
        return { ...tx, matchingDocumentId: tx.suggestedDocumentId };
      }
      return tx;
    });
    if (count > 0) {
      setLocalTransactions(newTxs);
      toast({ title: 'Validation en masse', description: `${count} lettrages hautement probables validés d'un coup.` });
    } else {
      toast({ description: "Aucune suggestion avec un score >= 90% n'a été trouvée." });
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Description', 'Montant', 'Statut', 'Document ID', 'Score IA'],
      ...localTransactions.map(t => [
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
          totalTransactions: localTransactions.length,
          matchedTransactions: matched.length,
          totalAmount: localTransactions.reduce((acc, t) => acc + t.amount, 0),
          matchedAmount: matched.reduce((acc, t) => acc + t.amount, 0),
          anomalyCount: anomalies.length
        },
        matches: matched.map(m => ({ date: m.date, description: m.description, amount: m.amount, documentId: m.matchingDocumentId, score: m.confidenceScore })),
        anomalies: anomalies.map(a => ({ date: a.date, description: a.description, amount: a.amount, reason: a.anomalyReason }))
      });
      if (!res.success) throw new Error(res.error);
      
      // Also write BQ draft entries to `accounting_entries` for all matched transactions
      const batch = writeBatch(db);
      matched.forEach(match => {
         const entryRef = doc(collection(db, 'accounting_entries'));
         batch.set(entryRef, {
             clientId: client.id,
             date: match.date,
             description: `Règlement ${match.description}`,
             journal: 'BQ',
             lines: [
                 { account: match.amount < 0 ? '401000' : '512000', debit: Math.abs(match.amount), credit: 0 },
                 { account: match.amount < 0 ? '512000' : '411000', debit: 0, credit: Math.abs(match.amount) }
             ],
             status: 'draft',
             documentId: match.matchingDocumentId,
             createdAt: new Date().toISOString()
         });
      });
      await batch.commit();

      setIsSaved(true);
      toast({ title: 'Rapport archivé et écritures générées', description: 'Le rapprochement BQ est terminé avec succès.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
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

      <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
        <h3 className="font-space font-black text-xl flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-primary" /> Mode Rapprochement Avancé
        </h3>
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="rounded-xl border-white/10 gap-2 font-space font-bold uppercase text-[10px] tracking-widest">
            <DownloadCloud className="h-4 w-4" /> Exporter Rapport
        </Button>
      </div>

      {/* Dual Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
        {/* Left Pane: Transactions */}
        <Card className="glass-panel border-none premium-shadow overflow-hidden flex flex-col relative">
          <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between z-10">
            <h4 className="font-space font-black uppercase tracking-widest text-sm flex items-center gap-2">
              <Landmark className="h-4 w-4 text-blue-400" /> Transactions Bancaires
            </h4>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="font-space text-xs bg-white/10">{pending.length} en attente</Badge>
              {localTransactions.some(tx => !tx.matchingDocumentId && !tx.isAnomaly && tx.suggestedDocumentId && tx.confidenceScore && tx.confidenceScore >= 90) && (
                <Button onClick={handleValidateAll} size="sm" className="bg-emerald-500 hover:bg-emerald-600 h-7 rounded-lg text-[10px] uppercase font-black tracking-widest text-white shadow-lg shadow-emerald-500/20">
                  <Sparkles className="h-3 w-3 mr-1" /> Tout Valider
                </Button>
              )}
            </div>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              <AnimatePresence>
                {localTransactions.map((t, idx) => {
                  if (t.matchingDocumentId) return null; // Hide matched
                  
                  const isSelected = selectedTxIdx === idx;
                  const hasSuggestion = t.confidenceScore && t.confidenceScore >= 50 && !t.isAnomaly;

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, x: -50 }}
                      key={idx}
                      onClick={() => setSelectedTxIdx(isSelected ? null : idx)}
                      onDragOver={(e) => { e.preventDefault(); setDragOverTxIdx(idx); }}
                      onDragLeave={() => setDragOverTxIdx(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverTxIdx(null);
                        const docId = e.dataTransfer.getData("text/plain");
                        if (docId) handleLink(idx, docId);
                      }}
                      className={cn(
                        "p-4 rounded-2xl border cursor-pointer transition-all duration-300 relative overflow-hidden",
                        isSelected 
                          ? "bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/20" 
                          : dragOverTxIdx === idx 
                            ? "bg-emerald-500/20 border-emerald-500 border-2 border-dashed shadow-2xl shadow-emerald-500/30 scale-105 z-10"
                            : t.isAnomaly 
                              ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40" 
                              : "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="space-y-1">
                          <span className="text-xs font-mono opacity-70 bg-black/20 px-2 py-1 rounded-md">{t.date}</span>
                          <p className="font-bold text-sm leading-tight max-w-[200px] break-words">{t.description}</p>
                        </div>
                        <div className={cn(
                          "font-black font-space text-base",
                          t.amount < 0 ? "text-red-400" : "text-emerald-400"
                        )}>
                          {t.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                        </div>
                      </div>
                      
                      {t.isAnomaly && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 p-2 rounded-lg">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span className="font-medium">{t.anomalyReason}</span>
                        </div>
                      )}

                      {hasSuggestion && (
                        <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-emerald-400" />
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Suggestion IA ({t.confidenceScore}%)</span>
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full h-8 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs"
                            onClick={(e) => { e.stopPropagation(); handleLink(idx, t.suggestedDocumentId || documents?.find(d => t.description.toLowerCase().includes(d.name.toLowerCase()))?.id || "doc-simulé", true); }}
                          >
                            Valider la suggestion
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {pending.length === 0 && (
                <div className="text-center p-8 opacity-50">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-emerald-500" />
                  <p className="font-space font-bold">Toutes les transactions sont lettrées !</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Right Pane: Invoices */}
        <Card className="glass-panel border-none premium-shadow overflow-hidden flex flex-col relative">
          <div className="p-4 border-b border-white/10 bg-white/5 flex flex-col gap-3 z-10">
            <div className="flex items-center justify-between">
              <h4 className="font-space font-black uppercase tracking-widest text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-400" /> Factures approuvées
              </h4>
              <Badge variant="secondary" className="font-space text-xs bg-white/10">{availableDocuments.length} pièces</Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher une facture..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-black/20 border-white/10 rounded-xl focus-visible:ring-emerald-500/50"
              />
            </div>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              <AnimatePresence>
                {!documents ? (
                  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl bg-white/5" />)
                ) : availableDocuments.map((doc) => {
                  const isSelected = selectedDocId === doc.id;
                  
                  const amountHT = doc.extractedData?.amounts?.[0] || 0;
                  const vatAmount = doc.extractedData?.vatAmount || 0;
                  const totalTTC = amountHT + vatAmount;

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, x: 50 }}
                      key={doc.id}
                      className={cn(
                        "rounded-2xl border transition-all duration-300",
                        draggedDocId === doc.id ? "opacity-50 scale-95 border-emerald-500/50 border-dashed" : "",
                        isSelected && draggedDocId !== doc.id
                          ? "bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/20" 
                          : "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10"
                      )}
                    >
                      <div
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", doc.id);
                          setDraggedDocId(doc.id);
                        }}
                        onDragEnd={() => setDraggedDocId(null)}
                        onClick={() => setSelectedDocId(isSelected ? null : doc.id)}
                        className="p-4 cursor-grab active:cursor-grabbing w-full h-full"
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="font-bold text-sm max-w-[200px] truncate">{doc.name}</p>
                            <div className="flex items-center gap-2 text-xs opacity-70">
                              <span className="bg-black/20 px-2 py-0.5 rounded uppercase tracking-wider">{doc.type === 'purchase_invoice' ? 'Achat' : 'Vente'}</span>
                              <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-black font-space text-sm">
                              {totalTTC > 0 ? `${totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : 'N/A'}
                            </div>
                            {doc.extractedData?.vendorNames?.[0] && (
                              <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                                {doc.extractedData.vendorNames[0]}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {isSelected && selectedTxIdx !== null && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 pt-3 border-t border-emerald-500/20"
                          >
                            <Button 
                              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                              onClick={(e) => { e.stopPropagation(); handleLink(selectedTxIdx, doc.id); }}
                            >
                              <Link2 className="h-4 w-4 mr-2" /> Lier à la transaction
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {documents && availableDocuments.length === 0 && (
                <div className="text-center p-8 opacity-50">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-space font-medium text-sm">Aucune facture ne correspond à cette recherche.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-6">
        <Button 
          size="lg"
          onClick={handleSaveResults} 
          disabled={isSaving || isSaved || matched.length === 0}
          className={cn(
            "h-14 px-8 rounded-[1.5rem] font-black font-space text-lg transition-all duration-500",
            isSaved ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30" : "bg-primary shadow-primary/30"
          )}
        >
          {isSaving ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : isSaved ? <CheckCircle2 className="h-6 w-6 mr-3" /> : <ShieldCheck className="h-6 w-6 mr-3" />}
          {isSaved ? "Rapprochement validé et comptabilisé" : "Comptabiliser le lettrage"}
        </Button>
        <Button variant="ghost" size="lg" onClick={onReset} className="h-14 font-space font-black uppercase tracking-widest text-sm hover:bg-white/5">
          <RotateCcw className="h-4 w-4 mr-2" /> Nouveau Rapprochement
        </Button>
      </div>

      <AlertDialog open={pendingLink !== null} onOpenChange={(open) => { if (!open) setPendingLink(null); }}>
        <AlertDialogContent className="glass-panel border-white/10 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-space font-black flex items-center gap-2 text-amber-500">
              <AlertTriangle className="h-5 w-5" /> Montants non concordants
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium mt-2">
              Le montant de la facture sélectionnée et le montant de la transaction ne correspondent pas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Montant facture :</span>
              <span className="font-bold text-foreground">{pendingLink?.docAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Montant transaction :</span>
              <span className="font-bold text-foreground">{pendingLink?.txAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
            </div>
            <div className="border-t border-white/5 pt-2 flex justify-between items-center text-xs text-red-400 font-bold">
              <span>Écart :</span>
              <span>{Math.abs((pendingLink?.docAmount || 0) - (pendingLink?.txAmount || 0)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
            </div>
          </div>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="border-white/10 hover:bg-white/5">Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (pendingLink) {
                  executeLink(pendingLink.txIndex, pendingLink.docId, false);
                  setPendingLink(null);
                }
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-space font-bold"
            >
              Forcer le lettrage
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReconciliationPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('client');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[] | null>(null);
  const [reconciledTransactions, setReconciledTransactions] = useState<ParsedTransaction[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const { role: userRole, isLoading: isBrandingLoading } = useBranding();
  const isStaff = userRole === 'accountant';
  const isAdmin = userRole === 'admin';

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
        result.matches.forEach((m: any) => { if (enriched[m.transactionIndex]) { enriched[m.transactionIndex].suggestedDocumentId = m.documentId; enriched[m.transactionIndex].confidenceScore = m.confidenceScore; } });
      }
      if ('anomalies' in result && result.anomalies) {
        result.anomalies.forEach((a: any) => { if (enriched[a.transactionIndex]) { enriched[a.transactionIndex].isAnomaly = true; enriched[a.transactionIndex].anomalyReason = a.reason; } });
      }
      setReconciledTransactions(enriched);
      toast({ title: 'Analyse terminée', description: `${result.matches?.length || 0} lettrages automatiques suggérés.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Échec IA', description: err.message });
      setStep('import');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isBrandingLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isStaff && !isAdmin) {
    return (
      <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center p-6 text-center">
        <Card className="max-w-md glass-panel border-none premium-shadow p-12 rounded-[2.5rem]">
          <div className="h-20 w-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-3xl font-black font-space tracking-tight mb-4 text-foreground">Zone Interdite</h2>
          <p className="text-muted-foreground mb-8 text-lg font-medium">
            Vous n'avez pas les habilitations nécessaires pour accéder au pilotage du rapprochement bancaire.
          </p>
          <Button 
            onClick={() => router.push('/dashboard')} 
            className="h-12 px-8 rounded-xl bg-primary font-space font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 text-primary-foreground"
          >
            Retour au Dashboard
          </Button>
        </Card>
      </div>
    );
  }

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
