'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, WifiOff, RefreshCw, CreditCard, ArrowDownLeft,
  ArrowUpRight, CheckCircle, Clock, AlertCircle, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { BankingService } from '@/lib/banking/banking.service';
import type { BankAccount, BankTransaction, SyncResult } from '@/lib/banking/types';

// ─── Singleton du service (Mock) ──────────────────────────────────────────────
const bankingService = new BankingService();

type SimStep = 'idle' | 'connecting' | 'connected' | 'loading_accounts' | 'ready' | 'error';

export default function BankingSimPage() {
  const [step, setStep] = useState<SimStep>('idle');
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isLoadingTx, setIsLoadingTx] = useState(false);

  // ─── Étape 1 : Connexion ─────────────────────────────────────────────────────
  const handleConnect = useCallback(async () => {
    setStep('connecting');
    try {
      const { connectionId: connId } = await bankingService.initConnection('user_mock_001');
      setConnectionId(connId);
      setStep('loading_accounts');

      const accs = await bankingService.getAccounts(connId);
      setAccounts(accs);
      setStep('ready');
    } catch {
      setStep('error');
    }
  }, []);

  // ─── Étape 2 : Transactions ──────────────────────────────────────────────────
  const handleSelectAccount = useCallback(async (account: BankAccount) => {
    setSelectedAccount(account);
    setIsLoadingTx(true);
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const txs = await bankingService.getTransactions(account.id, from);
    setTransactions(txs);
    setIsLoadingTx(false);
  }, []);

  // ─── Étape 3 : Synchronisation ───────────────────────────────────────────────
  const handleSync = useCallback(async () => {
    if (!connectionId) return;
    const result = await bankingService.syncConnection(connectionId);
    setSyncResult(result);
  }, [connectionId]);

  const handleReset = () => {
    setStep('idle');
    setConnectionId(null);
    setAccounts([]);
    setSelectedAccount(null);
    setTransactions([]);
    setSyncResult(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-20 max-w-6xl mx-auto">

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 font-space font-black uppercase tracking-widest text-[10px]">
          Open Banking — Simulation
        </Badge>
        <h1 className="text-4xl md:text-5xl font-black font-space tracking-tight gradient-text">
          Connecteur Bancaire
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl font-medium">
          Architecture DSP2 testée avec un Mock Provider. Aucune donnée réelle.
          Prêt pour Powens ou Bridge en production.
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground glass-panel px-4 py-2 rounded-xl w-fit">
          <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          Provider actif : <span className="font-bold text-amber-400 uppercase ml-1">{bankingService.activeProvider}</span>
        </div>
      </div>

      {/* ─── Étape 1 : Connexion ─────────────────────────────────────────────── */}
      {step === 'idle' && (
        <Card className="glass-panel border-none premium-shadow max-w-xl mx-auto text-center">
          <CardContent className="p-12 space-y-6">
            <div className="h-20 w-20 rounded-3xl bg-blue-500/10 flex items-center justify-center mx-auto">
              <Building2 className="h-10 w-10 text-blue-400" />
            </div>
            <div>
              <h2 className="font-black font-space text-2xl mb-2">Simuler une Connexion Bancaire</h2>
              <p className="text-muted-foreground text-sm">
                Lance le flux DSP2 simulé via le MockBankingProvider.<br />
                Aucune donnée réelle n'est transmise.
              </p>
            </div>
            <Button size="lg" onClick={handleConnect} className="font-space font-black uppercase tracking-widest w-full rounded-2xl">
              <Wifi className="mr-2 h-5 w-5" />
              Connecter une banque
            </Button>
          </CardContent>
        </Card>
      )}

      {(step === 'connecting' || step === 'loading_accounts') && (
        <div className="space-y-4 max-w-xl mx-auto">
          <Skeleton className="h-24 w-full rounded-2xl bg-white/5" />
          <Skeleton className="h-24 w-full rounded-2xl bg-white/5" />
          <p className="text-center text-sm text-muted-foreground animate-pulse">
            {step === 'connecting' ? 'Initialisation de la connexion...' : 'Récupération des comptes...'}
          </p>
        </div>
      )}

      {step === 'error' && (
        <Card className="glass-panel border-none premium-shadow max-w-xl mx-auto text-center">
          <CardContent className="p-12 space-y-4">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
            <p className="font-bold text-red-400">Erreur de connexion simulée.</p>
            <Button variant="outline" onClick={handleReset}>Réessayer</Button>
          </CardContent>
        </Card>
      )}

      <AnimatePresence>
        {step === 'ready' && (
          <motion.div key="banking-ready" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

            {/* Statut connexion */}
            <div className="flex items-center justify-between glass-panel p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold font-space text-sm">Connexion active</span>
                <span className="text-xs text-muted-foreground font-mono">{connectionId}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleSync} className="rounded-xl font-space font-bold uppercase text-[10px]">
                  <RefreshCw className="h-3 w-3 mr-1" />Synchroniser
                </Button>
                <Button size="sm" variant="ghost" onClick={handleReset} className="rounded-xl font-space font-bold uppercase text-[10px]">
                  <WifiOff className="h-3 w-3 mr-1" />Déconnecter
                </Button>
              </div>
            </div>

            {syncResult && (
              <Card className="glass-panel border-none premium-shadow bg-emerald-500/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                  <p className="text-sm">
                    Synchronisation réussie : <strong>{syncResult.transactionsAdded} transactions</strong> ajoutées,{' '}
                    <strong>{syncResult.accountsUpdated} comptes</strong> mis à jour.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Comptes */}
            <div>
              <p className="text-[10px] font-space font-black uppercase tracking-widest text-muted-foreground mb-4">Comptes récupérés</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts.map((acc) => (
                  <Card
                    key={acc.id}
                    onClick={() => handleSelectAccount(acc)}
                    className={cn(
                      'glass-panel border-none premium-shadow cursor-pointer transition-all duration-200 hover:bg-white/10',
                      selectedAccount?.id === acc.id && 'ring-2 ring-primary'
                    )}
                  >
                    <CardContent className="p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-primary" />
                          <span className="font-bold font-space">{acc.name}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] uppercase tracking-wider">{acc.type}</Badge>
                      </div>
                      <p className="text-2xl font-black font-space text-emerald-400">
                        {acc.balance.toLocaleString('fr-FR', { style: 'currency', currency: acc.currency })}
                      </p>
                      {acc.iban && (
                        <p className="text-xs text-muted-foreground font-mono truncate">{acc.iban}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Transactions */}
            {selectedAccount && (
              <div>
                <p className="text-[10px] font-space font-black uppercase tracking-widest text-muted-foreground mb-4">
                  Transactions — {selectedAccount.name} (30 derniers jours)
                </p>
                <Card className="glass-panel border-none premium-shadow">
                  <CardContent className="p-0">
                    {isLoadingTx ? (
                      <div className="p-6 space-y-3">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl bg-white/5" />)}
                      </div>
                    ) : (
                      <table className="w-full text-sm text-left">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-6 py-3 font-space font-black text-[10px] uppercase tracking-widest text-muted-foreground">Date</th>
                            <th className="px-6 py-3 font-space font-black text-[10px] uppercase tracking-widest text-muted-foreground">Libellé</th>
                            <th className="px-6 py-3 font-space font-black text-[10px] uppercase tracking-widest text-muted-foreground">Catégorie</th>
                            <th className="px-6 py-3 font-space font-black text-[10px] uppercase tracking-widest text-muted-foreground text-right">Montant</th>
                            <th className="px-6 py-3 font-space font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">Lettré</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {transactions.map(tx => (
                            <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 text-muted-foreground text-xs">
                                {tx.date.toLocaleDateString('fr-FR')}
                              </td>
                              <td className="px-6 py-4 font-medium max-w-xs truncate">{tx.description}</td>
                              <td className="px-6 py-4">
                                {tx.category && (
                                  <Badge variant="outline" className="text-[9px] uppercase tracking-wider">{tx.category}</Badge>
                                )}
                              </td>
                              <td className={cn(
                                'px-6 py-4 font-black font-space text-right',
                                tx.direction === 'credit' ? 'text-emerald-400' : 'text-red-400'
                              )}>
                                <span className="flex items-center justify-end gap-1">
                                  {tx.direction === 'credit'
                                    ? <ArrowDownLeft className="h-3 w-3" />
                                    : <ArrowUpRight className="h-3 w-3" />
                                  }
                                  {Math.abs(tx.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {tx.isMatched
                                  ? <CheckCircle className="h-4 w-4 text-emerald-400 mx-auto" />
                                  : <Clock className="h-4 w-4 text-muted-foreground mx-auto" />
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
