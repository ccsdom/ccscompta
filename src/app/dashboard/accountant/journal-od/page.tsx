'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, CheckCircle, XCircle, Clock, FileDown,
  Filter, ChevronRight, AlertTriangle, Loader2, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCollection, useMemoFirebase } from '@/firebase';
import { db, functions } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useBranding } from '@/components/branding-provider';
import type { AccountingEntry } from '@/lib/accounting/types';

// ─── Config des statuts ───────────────────────────────────────────────────────

const STATUS_CONFIG = {
  draft: {
    label: 'Brouillon',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: Clock,
  },
  validated: {
    label: 'Validé',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: CheckCircle,
  },
  exported: {
    label: 'Exporté',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: FileDown,
  },
  cancelled: {
    label: 'Annulé',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: XCircle,
  },
};

type StatusFilter = 'all' | 'draft' | 'validated' | 'exported' | 'cancelled';

export default function JournalODPage() {
  const { profile } = useBranding();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [validating, setValidating] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const cabinetId = profile?.cabinetId;

  const odQuery = useMemoFirebase(() => {
    if (!cabinetId) return null;
    return query(
      collection(db, 'accounting_entries'),
      where('cabinetId', '==', cabinetId),
      orderBy('createdAt', 'desc')
    );
  }, [cabinetId]);

  // Fallback : si pas de cabinetId on essaie sans filtre cabinet (multi-client)
  const odQueryFallback = useMemoFirebase(() => {
    if (cabinetId) return null;
    if (!profile?.id) return null;
    return query(
      collection(db, 'accounting_entries'),
      where('clientId', '==', profile.id),
      orderBy('createdAt', 'desc')
    );
  }, [cabinetId, profile]);

  const { data: entries, isLoading } = useCollection<AccountingEntry>(odQuery ?? odQueryFallback);

  // ─── Filtrage local ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!entries) return [];
    if (statusFilter === 'all') return entries;
    return entries.filter(e => e.status === statusFilter);
  }, [entries, statusFilter]);

  // ─── Compteurs ────────────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    all: entries?.length ?? 0,
    draft: entries?.filter(e => e.status === 'draft').length ?? 0,
    validated: entries?.filter(e => e.status === 'validated').length ?? 0,
    exported: entries?.filter(e => e.status === 'exported').length ?? 0,
    cancelled: entries?.filter(e => e.status === 'cancelled').length ?? 0,
  }), [entries]);

  // ─── Validation d'une écriture ────────────────────────────────────────────
  const handleValidate = async (entryId: string) => {
    setValidating(entryId);
    try {
      const fn = httpsCallable(functions, 'validateAccountingEntry');
      await fn({ entryId });
      showToast('Écriture validée avec succès.', 'success');
    } catch {
      showToast('Erreur lors de la validation.', 'error');
    } finally {
      setValidating(null);
    }
  };

  // ─── Export FEC ────────────────────────────────────────────
  const handleExportFEC = async () => {
    if (!profile?.id) {
      showToast('Client introuvable.', 'error');
      return;
    }
    
    const confirmed = window.confirm(
      "⚠️ ATTENTION : L'export FEC est une opération IRRÉVERSIBLE.\n\nToutes les écritures validées seront scellées et leur modification sera définitivement bloquée pour garantir la Piste d'Audit Fiable (PAF).\n\nVoulez-vous générer le fichier et sceller les écritures ?"
    );
    
    if (!confirmed) return;

    setIsExporting(true);
    try {
      const fn = httpsCallable(functions, 'generateFECExport');
      const result = await fn({ clientId: profile.id, year: 2024 });
      const data = result.data as any;
      if (data.url) {
        showToast(`${data.entriesCount} écritures scellées et exportées !`, 'success');
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Erreur lors de la génération du FEC.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const FILTERS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Toutes' },
    { key: 'draft', label: 'Brouillons' },
    { key: 'validated', label: 'Validées' },
    { key: 'exported', label: 'Exportées' },
    { key: 'cancelled', label: 'Annulées' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-20 max-w-6xl mx-auto">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={cn(
              'fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl font-bold text-sm shadow-2xl',
              toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            )}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="space-y-3">
        <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 px-3 py-1 font-space font-black uppercase tracking-widest text-[10px]">
          Comptabilité
        </Badge>
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <h1 className="text-4xl md:text-5xl font-black font-space tracking-tight gradient-text">
            Journal des Écritures OD
          </h1>
          <Button
            onClick={handleExportFEC}
            disabled={isExporting}
            className="rounded-xl font-space font-bold uppercase tracking-widest text-xs bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-500/20"
          >
            {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Clôturer & Exporter (FEC)
          </Button>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl font-medium">
          Écritures d'Opérations Diverses générées automatiquement. Validation humaine obligatoire avant export.
        </p>
      </div>

      {/* KPI Brouillons en attente */}
      {counts.draft > 0 && (
        <Card className="glass-panel border-amber-500/20 premium-shadow bg-amber-500/5">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="font-black font-space text-amber-400">{counts.draft} écriture{counts.draft > 1 ? 's' : ''} en attente de validation</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ces écritures sont en brouillon. Elles ne sont pas encore comptabilisées définitivement.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-space font-black uppercase tracking-widest transition-all',
              statusFilter === f.key
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                : 'glass-panel text-muted-foreground hover:text-foreground'
            )}
          >
            {f.label}
            <span className="ml-2 opacity-60">({counts[f.key]})</span>
          </button>
        ))}
      </div>

      {/* Liste des écritures */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl bg-white/5" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="glass-panel border-none premium-shadow">
          <CardContent className="p-16 text-center space-y-4">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground font-bold">Aucune écriture comptable trouvée.</p>
            <p className="text-xs text-muted-foreground">Générez des OD depuis le module de Révision Continue.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => {
            const s = STATUS_CONFIG[entry.status];
            const StatusIcon = s.icon;
            const isExpanded = expandedEntry === entry.id;
            const totalDebit = entry.lines.reduce((sum, l) => sum + (l.debit || 0), 0);

            return (
              <motion.div key={entry.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className={cn('glass-panel border-none premium-shadow overflow-hidden transition-all', isExpanded && 'ring-1 ring-primary/30')}>
                  {/* ─── Ligne principale ─────────────────────────────────── */}
                  <button
                    onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                    className="w-full text-left"
                  >
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className={cn('h-10 w-10 rounded-2xl flex items-center justify-center shrink-0', s.bg)}>
                        <StatusIcon className={cn('h-5 w-5', s.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{entry.label}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground font-mono">{entry.journalCode}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{entry.entryDate}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">Exercice {entry.fiscalYear}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-black font-space text-lg">{totalDebit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
                        <Badge className={cn('text-[9px] uppercase tracking-wider border mt-1', s.bg, s.color, s.border)}>
                          {s.label}
                        </Badge>
                      </div>

                      <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform shrink-0', isExpanded && 'rotate-90')} />
                    </CardContent>
                  </button>

                  {/* ─── Détail lignes ────────────────────────────────────── */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="border-t border-white/5 px-5 pb-5 pt-4 space-y-4">
                          {/* Tableau des lignes */}
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-[10px] font-space font-black uppercase tracking-widest text-muted-foreground">
                                <th className="py-2 text-left">Compte</th>
                                <th className="py-2 text-left">Libellé</th>
                                <th className="py-2 text-right">Débit</th>
                                <th className="py-2 text-right">Crédit</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {entry.lines.map((line, i) => (
                                <tr key={i} className="hover:bg-white/3">
                                  <td className="py-3 font-mono font-bold text-primary">{line.accountNumber}</td>
                                  <td className="py-3 text-muted-foreground">{line.accountLabel}</td>
                                  <td className="py-3 text-right font-bold">
                                    {line.debit > 0 ? `${line.debit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : '—'}
                                  </td>
                                  <td className="py-3 text-right font-bold text-blue-400">
                                    {line.credit > 0 ? `${line.credit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Infos traçabilité */}
                          <div className="flex items-center gap-6 text-xs text-muted-foreground pt-2 border-t border-white/5">
                            <span>Source : <strong className="text-foreground">{entry.sourceType}</strong></span>
                            <span>Créé le : <strong className="text-foreground">{new Date(entry.createdAt).toLocaleDateString('fr-FR')}</strong></span>
                            {entry.validatedAt && (
                              <span>Validé le : <strong className="text-foreground">{new Date(entry.validatedAt).toLocaleDateString('fr-FR')}</strong></span>
                            )}
                          </div>

                          {/* Actions */}
                          {entry.status === 'draft' && (
                            <div className="flex justify-end gap-3 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl font-space font-bold uppercase text-[10px] border-red-500/20 text-red-400 hover:bg-red-500/10"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Annuler
                              </Button>
                              <Button
                                size="sm"
                                disabled={validating === entry.id}
                                onClick={() => handleValidate(entry.id)}
                                className="rounded-xl font-space font-bold uppercase text-[10px] bg-emerald-600 hover:bg-emerald-700"
                              >
                                {validating === entry.id ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                )}
                                Valider l'écriture
                              </Button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
