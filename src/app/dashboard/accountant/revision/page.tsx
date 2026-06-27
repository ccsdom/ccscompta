'use client';

import { useState, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, Eye, ArrowRight, ShieldCheck, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useMemoFirebase } from '@/firebase';
import { db, functions } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import type { Client, Document, Asset } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useBranding } from '@/components/branding-provider';

// ─── Step 1: Client Selection (Reused concept) ────────────────────────────────

function StepClient({ onSelect }: { onSelect: (client: Client) => void }) {
  const { role: userRole, profile, isLoading: isBrandingLoading } = useBranding();
  const isStaff = useMemo(() => userRole && ['accountant', 'admin'].includes(userRole), [userRole]);

  const clientsQuery = useMemoFirebase(() => {
    if (!isStaff || !userRole) return null;
    if (userRole === 'admin') return query(collection(db, 'clients'), where('role', '==', 'client'));
    if (profile?.cabinetId) return query(collection(db, 'clients'), where('role', '==', 'client'), where('cabinetId', '==', profile.cabinetId));
    return null;
  }, [isStaff, userRole, profile?.cabinetId]);

  const { data: clients, isLoading: isCollectionLoading } = useCollection<Client>(clientsQuery);
  const activeClients = useMemo(() => clients || [], [clients]);
  const isLoading = isBrandingLoading || isCollectionLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-3xl bg-white/5" />)}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-black font-space">Dossier de Révision</h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto font-medium">
          Sélectionnez le client pour accéder à son cadrage TVA et ses immobilisations.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {activeClients.map((client, idx) => (
            <motion.div key={client.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card onClick={() => onSelect(client)} className="glass-panel border-none premium-shadow hover:bg-white/10 cursor-pointer transition-all duration-300 group overflow-hidden">
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
    </div>
  );
}

// ─── Step 2: Revision Dashboard ───────────────────────────────────────────────

function RevisionDashboard({ client, onBack }: { client: Client; onBack: () => void }) {
  const [isCreatingAsset, setIsCreatingAsset] = useState<Document | null>(null);
  const [assetName, setAssetName] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [usefulLife, setUsefulLife] = useState('36'); // 3 ans par defaut
  const [isSubmitting, setIsSubmitting] = useState(false);

  // V2 asset disposal states
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
  const [isDisposingAsset, setIsDisposingAsset] = useState<Asset | null>(null);
  const [disposalDate, setDisposalDate] = useState('');
  const [disposalType, setDisposalType] = useState<'scrapped' | 'sold'>('scrapped');
  const [salePrice, setSalePrice] = useState('');
  const [vatRate, setVatRate] = useState('20');
  const [isDisposingSubmitting, setIsDisposingSubmitting] = useState(false);

  // Queries
  const docsQuery = useMemoFirebase(() => query(collection(db, 'documents'), where('clientId', '==', client.id), limit(500)), [client.id]);
  const assetsQuery = useMemoFirebase(() => query(collection(db, 'assets'), where('clientId', '==', client.id)), [client.id]);

  const { data: documents } = useCollection<Document>(docsQuery);
  const { data: assets } = useCollection<Asset>(assetsQuery);

  // Computed TVA
  const tvaStats = useMemo(() => {
    if (!documents) return { collected: 0, deductible: 0, net: 0 };
    let collected = 0;
    let deductible = 0;

    documents.forEach(doc => {
      const isSale = doc.type === 'sales_invoice';
      const isPurchase = doc.type === 'invoice' || doc.type === 'receipt';
      const vat = doc.extractedData?.vatAmount || 0;
      
      if (isSale) collected += vat;
      if (isPurchase) deductible += vat;
    });

    return { collected, deductible, net: collected - deductible };
  }, [documents]);

  // Computed Immobilisations Potentielles
  const CAP_THRESHOLD = 500; // Paramètre théorique
  const potentialAssets = useMemo(() => {
    if (!documents || !assets) return [];
    // Only show invoices that are not already linked to an asset
    const existingAssetDocIds = assets.map(a => a.documentId);
    return documents.filter(doc => {
      if (doc.type !== 'invoice') return false;
      if (existingAssetDocIds.includes(doc.id)) return false;
      const amounts = doc.extractedData?.amounts || [];
      const ht = amounts[0] || 0; // Simplification
      return ht >= CAP_THRESHOLD;
    });
  }, [documents, assets]);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCreatingAsset || !assetName || !serviceDate) return;
    setIsSubmitting(true);
    try {
      const generateAssetSchedule = httpsCallable(functions, 'generateAssetSchedule');
      await generateAssetSchedule({
        documentId: isCreatingAsset.id,
        clientId: client.id,
        acquisitionDate: isCreatingAsset.extractedData?.dates?.[0] || new Date().toISOString(),
        serviceStartDate: new Date(serviceDate).toISOString(),
        acquisitionValue: isCreatingAsset.extractedData?.amounts?.[0] || 0,
        usefulLifeMonths: parseInt(usefulLife),
        assetName: assetName
      });
      setIsCreatingAsset(null);
      setAssetName('');
      setServiceDate('');
    } catch (error) {
      console.error("Error creating asset", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisposeAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDisposingAsset || !disposalDate || !disposalType) return;
    setIsDisposingSubmitting(true);
    try {
      const disposeAssetFn = httpsCallable(functions, 'disposeAsset');
      await disposeAssetFn({
        assetId: isDisposingAsset.id,
        disposalDate: new Date(disposalDate).toISOString().split('T')[0],
        disposalType,
        salePrice: disposalType === 'sold' ? parseFloat(salePrice) || 0 : 0,
        vatRate: disposalType === 'sold' ? parseFloat(vatRate) || 0 : 0
      });
      setIsDisposingAsset(null);
      setDisposalDate('');
      setDisposalType('scrapped');
      setSalePrice('');
      setVatRate('20');
    } catch (error) {
      console.error("Error disposing asset", error);
    } finally {
      setIsDisposingSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between glass-panel p-4 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-black font-space">
            {client.name.charAt(0)}
          </div>
          <div>
            <p className="font-black font-space">{client.name}</p>
            <p className="text-xs text-muted-foreground">Révision Continue</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>Changer de dossier</Button>
      </div>

      <Tabs defaultValue="tva" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md h-14 bg-white/5 rounded-2xl p-1 mb-8 border border-white/10">
          <TabsTrigger value="tva" className="rounded-xl font-space font-bold uppercase text-xs tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Cadrage TVA
          </TabsTrigger>
          <TabsTrigger value="assets" className="rounded-xl font-space font-bold uppercase text-xs tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Immobilisations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tva" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-panel border-none premium-shadow bg-blue-500/5">
              <CardContent className="p-6 text-center space-y-2">
                <p className="text-[10px] font-space font-black uppercase tracking-widest text-muted-foreground">TVA Collectée (Ventes)</p>
                <p className="text-3xl font-black font-space text-blue-500">{tvaStats.collected.toFixed(2)} €</p>
              </CardContent>
            </Card>
            <Card className="glass-panel border-none premium-shadow bg-amber-500/5">
              <CardContent className="p-6 text-center space-y-2">
                <p className="text-[10px] font-space font-black uppercase tracking-widest text-muted-foreground">TVA Déductible (Achats)</p>
                <p className="text-3xl font-black font-space text-amber-500">{tvaStats.deductible.toFixed(2)} €</p>
              </CardContent>
            </Card>
            <Card className="glass-panel border-none premium-shadow bg-primary/5">
              <CardContent className="p-6 text-center space-y-2">
                <p className="text-[10px] font-space font-black uppercase tracking-widest text-muted-foreground">Solde TVA</p>
                <p className="text-3xl font-black font-space text-primary">{tvaStats.net.toFixed(2)} €</p>
                <p className="text-xs text-muted-foreground">{tvaStats.net >= 0 ? "TVA à décaisser" : "Crédit de TVA"}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <Card className="glass-panel border-none premium-shadow">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="font-space font-black">Factures &gt; {CAP_THRESHOLD}€ (Immobilisations Potentielles)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 font-space font-black text-[10px] uppercase tracking-widest text-muted-foreground">Document</th>
                    <th className="px-6 py-4 font-space font-black text-[10px] uppercase tracking-widest text-muted-foreground">Montant HT</th>
                    <th className="px-6 py-4 font-space font-black text-[10px] uppercase tracking-widest text-muted-foreground text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {potentialAssets.map(doc => (
                    <tr key={doc.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold">{doc.name}</td>
                      <td className="px-6 py-4 text-emerald-500 font-bold">{doc.extractedData?.amounts?.[0] || 0} €</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="outline" size="sm" onClick={() => setIsCreatingAsset(doc)} className="rounded-lg font-space font-bold uppercase text-[10px]">Créer Fiche</Button>
                      </td>
                    </tr>
                  ))}
                  {potentialAssets.length === 0 && (
                     <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">Aucune immobilisation potentielle détectée.</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="glass-panel border-none premium-shadow mt-8">
            <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-space font-black">Registre des Immobilisations</CardTitle>
                <CardDescription>Visualisez le plan détaillé et enregistrez les sorties d'actifs.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 font-space font-black text-[10px] uppercase tracking-widest text-muted-foreground w-10"></th>
                    <th className="px-6 py-4 font-space font-black text-[10px] uppercase tracking-widest text-muted-foreground">Nom</th>
                    <th className="px-6 py-4 font-space font-black text-[10px] uppercase tracking-widest text-muted-foreground">Base Amortissable</th>
                    <th className="px-6 py-4 font-space font-black text-[10px] uppercase tracking-widest text-muted-foreground">Durée</th>
                    <th className="px-6 py-4 font-space font-black text-[10px] uppercase tracking-widest text-muted-foreground">VNC Actuelle</th>
                    <th className="px-6 py-4 font-space font-black text-[10px] uppercase tracking-widest text-muted-foreground">Statut</th>
                    <th className="px-6 py-4 font-space font-black text-[10px] uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(assets || []).map(asset => {
                    const lastSchedule = asset.schedule[asset.schedule.length - 1];
                    const isExpanded = expandedAssetId === asset.id;
                    
                    let statusLabel = 'Actif';
                    let statusBadgeColor = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                    if (asset.status === 'scrapped') {
                      statusLabel = 'Mis au rebut';
                      statusBadgeColor = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
                    } else if (asset.status === 'sold') {
                      statusLabel = 'Cédé';
                      statusBadgeColor = 'bg-blue-500/10 text-blue-500 border-blue-500/20';
                    }

                    return (
                      <Fragment key={asset.id}>
                        <tr 
                          className={cn(
                            "hover:bg-white/5 transition-colors cursor-pointer",
                            isExpanded && "bg-white/[0.02]"
                          )}
                          onClick={() => setExpandedAssetId(isExpanded ? null : asset.id)}
                        >
                          <td className="px-6 py-4 text-center">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold block">{asset.name}</span>
                            <span className="text-[10px] text-muted-foreground">Début : {new Date(asset.serviceStartDate).toLocaleDateString('fr-FR')}</span>
                          </td>
                          <td className="px-6 py-4 text-emerald-500 font-bold">{asset.depreciationBase} €</td>
                          <td className="px-6 py-4">{asset.usefulLifeMonths} mois ({asset.amortizationMethod === 'linear' ? 'Linéaire' : 'Dégressif'})</td>
                          <td className="px-6 py-4 text-blue-500 font-bold">{lastSchedule?.closingValue || 0} €</td>
                          <td className="px-6 py-4">
                            <Badge className={cn("px-2 py-0.5 text-[9px] font-space font-black uppercase tracking-widest border", statusBadgeColor)}>
                              {statusLabel}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="rounded-lg p-2 hover:bg-white/10" 
                                onClick={() => setExpandedAssetId(isExpanded ? null : asset.id)}
                                title="Détails"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {asset.status === 'active' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-lg font-space font-bold uppercase text-[9px] border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 animate-pulse"
                                  onClick={() => setIsDisposingAsset(asset)}
                                >
                                  Sortie
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-white/[0.01]">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                  <h4 className="font-space font-black text-[10px] uppercase tracking-widest text-muted-foreground">Plan d'amortissement détaillé</h4>
                                  <span className="text-xs text-muted-foreground">Méthode : {asset.amortizationMethod === 'linear' ? 'Linéaire' : 'Dégressif'} | Acquisition : {new Date(asset.acquisitionDate).toLocaleDateString('fr-FR')}</span>
                                </div>
                                <div className="grid grid-cols-4 gap-4 text-[9px] font-space font-black uppercase tracking-widest text-muted-foreground bg-white/5 p-3 rounded-xl">
                                  <div>Exercice</div>
                                  <div>Valeur Ouverture</div>
                                  <div>Dotation Annuelle</div>
                                  <div>VNC Clôture</div>
                                </div>
                                <div className="divide-y divide-white/5">
                                  {asset.schedule.map((line) => (
                                    <div key={line.year} className="grid grid-cols-4 gap-4 p-3 text-sm font-medium">
                                      <div className="font-bold text-primary">{line.year}</div>
                                      <div>{line.openingValue.toFixed(2)} €</div>
                                      <div className="text-emerald-500 font-bold">+{line.depreciationAmount.toFixed(2)} €</div>
                                      <div className="text-blue-500 font-bold">{line.closingValue.toFixed(2)} €</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  {(!assets || assets.length === 0) && (
                     <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">Aucune immobilisation enregistrée.</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {isCreatingAsset && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <Card className="w-full max-w-lg glass-panel border-white/10 premium-shadow">
                <CardHeader>
                  <CardTitle className="font-space font-black text-2xl">Nouvelle Immobilisation</CardTitle>
                  <CardDescription>Génération du plan d'amortissement linéaire pour la facture sélectionnée.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateAsset} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nom de l'actif</label>
                      <input 
                        type="text" 
                        required 
                        value={assetName} 
                        onChange={e => setAssetName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Ex: Ordinateur MacBook Pro"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Date de mise en service</label>
                      <input 
                        type="date" 
                        required 
                        value={serviceDate} 
                        onChange={e => setServiceDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Durée d'amortissement</label>
                      <select 
                        value={usefulLife} 
                        onChange={e => setUsefulLife(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="12">1 an (12 mois)</option>
                        <option value="36">3 ans (36 mois)</option>
                        <option value="60">5 ans (60 mois)</option>
                        <option value="120">10 ans (120 mois)</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                      <Button type="button" variant="ghost" onClick={() => setIsCreatingAsset(null)}>Annuler</Button>
                      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Génération...' : 'Générer le plan'}</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {isDisposingAsset && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <Card className="w-full max-w-lg glass-panel border-white/10 premium-shadow">
                <CardHeader>
                  <CardTitle className="font-space font-black text-2xl text-rose-400">Sortie d'Immobilisation</CardTitle>
                  <CardDescription>
                    Déclarez la cession (vente) ou la mise au rebut de l'actif <strong className="text-white">{isDisposingAsset.name}</strong>. Une écriture d'OD sera générée automatiquement.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDisposeAsset} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Type de sortie</label>
                      <select 
                        value={disposalType} 
                        onChange={e => setDisposalType(e.target.value as 'scrapped' | 'sold')}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="scrapped">Mise au rebut (perte / valeur nulle)</option>
                        <option value="sold">Cession / Vente</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Date de sortie / cession</label>
                      <input 
                        type="date" 
                        required 
                        value={disposalDate} 
                        onChange={e => setDisposalDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary"
                        min={isDisposingAsset.serviceStartDate ? new Date(isDisposingAsset.serviceStartDate).toISOString().split('T')[0] : undefined}
                      />
                    </div>

                    {disposalType === 'sold' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Prix de cession HT (€)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            required 
                            value={salePrice} 
                            onChange={e => setSalePrice(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Ex: 500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Taux de TVA (%)</label>
                          <select 
                            value={vatRate} 
                            onChange={e => setVatRate(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="20">20 % (Normal)</option>
                            <option value="10">10 % (Intermédiaire)</option>
                            <option value="5.5">5.5 % (Réduit)</option>
                            <option value="0">0 % (Exonéré)</option>
                          </select>
                        </div>
                      </motion.div>
                    )}

                    <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                      <Button type="button" variant="ghost" onClick={() => setIsDisposingAsset(null)}>Annuler</Button>
                      <Button 
                        type="submit" 
                        disabled={isDisposingSubmitting}
                        className="bg-rose-600 text-white hover:bg-rose-500"
                      >
                        {isDisposingSubmitting ? 'Sortie en cours...' : 'Confirmer la sortie'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RevisionPage() {
  const router = useRouter();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { role: userRole, isLoading: isBrandingLoading } = useBranding();
  const isStaff = userRole === 'accountant';
  const isAdmin = userRole === 'admin';

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
            Vous n'avez pas les habilitations nécessaires pour accéder au pilotage de la révision continue.
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-space font-black uppercase tracking-widest text-[10px]">
            Audit & Contrôle
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black font-space tracking-tight gradient-text">
            Révision Continue
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl font-medium">
            Gérer le cadrage TVA et le registre des immobilisations en temps réel.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedClient ? (
          <motion.div key="client-select" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <StepClient onSelect={setSelectedClient} />
          </motion.div>
        ) : (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <RevisionDashboard client={selectedClient} onBack={() => setSelectedClient(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
