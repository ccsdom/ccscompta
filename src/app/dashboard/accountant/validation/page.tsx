'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, writeBatch } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/firebase';
import { useBranding } from '@/components/branding-provider';
import type { Document } from '@/lib/types';
import { Loader2, Check, ShieldAlert, ArrowRight, ArrowLeft, Keyboard, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function ValidationExpertPage() {
  const [queue, setQueue] = useState<Document[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { profile: userProfile } = useBranding();

  const [editedData, setEditedData] = useState({
    debitAccount: '',
    creditAccount: '',
    vatAccount: '',
    vatAmount: '',
    amountTTC: ''
  });

  // 1. Fetch the queue
  useEffect(() => {
    if (!userProfile) return;
    const cabinetId = userProfile.cabinetId;
    const isAdmin = userProfile.role === 'admin';

    if (!isAdmin && !cabinetId) {
      setIsLoading(false);
      return;
    }

    const baseQuery = collection(db, 'documents');
    const q = isAdmin 
      ? query(baseQuery, where('status', '==', 'reviewing'))
      : query(baseQuery, where('status', '==', 'reviewing'), where('cabinetId', '==', cabinetId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document));
      docs.sort((a, b) => new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime());
      
      setQueue(docs);
      setIsLoading(false);
      setCurrentIndex(prev => {
         if (docs.length === 0) return 0;
         return prev >= docs.length ? docs.length - 1 : prev;
      });
    }, (error) => {
      console.error("Error fetching queue:", error);
      toast({ variant: 'destructive', title: "Erreur de connexion", description: "Impossible de charger la file d'attente." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const currentDocument = queue[currentIndex];

  // Sync edit state when document changes
  useEffect(() => {
    if (!currentDocument) return;
    const ext = currentDocument.extractedData || {};
    const entry = ext.accountingEntry || {};
    setEditedData({
      debitAccount: entry.debitAccount || '',
      creditAccount: entry.creditAccount || '',
      vatAccount: entry.vatAccount || '445660',
      vatAmount: (ext.vatAmount || 0).toString(),
      amountTTC: (ext.amounts?.[0] || 0).toString()
    });
  }, [currentIndex, currentDocument]);

  // Load PDF URL
  useEffect(() => {
    let isMounted = true;
    if (!currentDocument?.storagePath) {
      setCurrentPdfUrl(null);
      return;
    }
    const loadPdfUrl = async () => {
      try {
        const url = await getDownloadURL(ref(storage, currentDocument.storagePath));
        if (isMounted) setCurrentPdfUrl(url);
      } catch (error) {
        console.error("Error loading PDF URL:", error);
        if (isMounted) setCurrentPdfUrl(null);
      }
    };
    loadPdfUrl();
    return () => { isMounted = false; };
  }, [currentDocument?.id, currentDocument?.storagePath]);

  // Single Validation
  const handleApprove = useCallback(async () => {
    if (!currentDocument || isActionLoading) return;
    setIsActionLoading(true);
    try {
      const batch = writeBatch(db);
      
      // Calculate billable lines
      const numVat = parseFloat(editedData.vatAmount) || 0;
      const billableLines = numVat > 0 ? 3 : 2;
      const docDate = currentDocument.extractedData?.dates?.[0] || new Date().toISOString();
      const billingPeriod = docDate.substring(0, 7);

      // 1. Update Document
      const docRef = doc(db, 'documents', currentDocument.id);
      batch.update(docRef, {
        status: 'approved',
        billableLines,
        billingPeriod,
        approvalDate: new Date().toISOString(),
        // Update extracted data with manual overrides
        'extractedData.accountingEntry.debitAccount': editedData.debitAccount,
        'extractedData.accountingEntry.creditAccount': editedData.creditAccount,
        'extractedData.accountingEntry.vatAccount': editedData.vatAccount,
        'extractedData.vatAmount': parseFloat(editedData.vatAmount) || 0,
        'extractedData.amounts': [parseFloat(editedData.amountTTC) || 0]
      });

      // 2. Generate Accounting Entry (Grand Livre)
      const entryRef = doc(collection(db, 'accounting_entries'));
      const ttc = parseFloat(editedData.amountTTC) || 0;
      const vat = parseFloat(editedData.vatAmount) || 0;
      const ht = ttc - vat;
      
      const lines = [];
      if (editedData.creditAccount) {
         lines.push({ account: editedData.creditAccount, credit: ttc, debit: 0 });
      }
      if (editedData.debitAccount && ht > 0) {
         lines.push({ account: editedData.debitAccount, debit: ht, credit: 0 });
      }
      if (editedData.vatAccount && vat > 0) {
         lines.push({ account: editedData.vatAccount, debit: vat, credit: 0 });
      }

      batch.set(entryRef, {
        clientId: currentDocument.clientId,
        cabinetId: currentDocument.cabinetId,
        date: docDate,
        description: `Facture ${currentDocument.extractedData?.vendorNames?.[0] || 'Inconnu'} - ${currentDocument.name}`,
        journal: currentDocument.type === 'purchase_invoice' ? 'HA' : 'VT',
        lines,
        status: 'draft',
        documentId: currentDocument.id,
        createdAt: new Date().toISOString(),
        fiscalYear: new Date().getFullYear().toString()
      });

      await batch.commit();
      toast({ title: "Validé !", description: `Facture imputée et écriture générée.` });
    } catch (error) {
      console.error("Error approving:", error);
      toast({ variant: 'destructive', title: "Erreur", description: "Impossible d'approuver." });
    } finally {
      setIsActionLoading(false);
    }
  }, [currentDocument, isActionLoading, editedData]);

  // Bulk Validation
  const handleBulkApprove = async () => {
    const highlyConfident = queue.filter(d => (d.extractedData?.accountingEntry?.confidenceScore || 0) >= 90);
    if (highlyConfident.length === 0) return;

    setIsActionLoading(true);
    try {
      const batch = writeBatch(db);
      
      highlyConfident.forEach(d => {
        const ext = d.extractedData || {};
        const entry = ext.accountingEntry || {};
        const docDate = ext.dates?.[0] || new Date().toISOString();
        const billingPeriod = docDate.substring(0, 7);
        const ttc = ext.amounts?.[0] || 0;
        const vat = ext.vatAmount || 0;
        const ht = ttc - vat;
        const billableLines = vat > 0 ? 3 : 2;

        const docRef = doc(db, 'documents', d.id);
        batch.update(docRef, {
          status: 'approved',
          billableLines,
          billingPeriod,
          approvalDate: new Date().toISOString(),
        });

        const entryRef = doc(collection(db, 'accounting_entries'));
        const lines = [];
        if (entry.creditAccount) lines.push({ account: entry.creditAccount, credit: ttc, debit: 0 });
        if (entry.debitAccount && ht > 0) lines.push({ account: entry.debitAccount, debit: ht, credit: 0 });
        if (entry.vatAccount && vat > 0) lines.push({ account: entry.vatAccount, debit: vat, credit: 0 });

        batch.set(entryRef, {
          clientId: d.clientId,
          cabinetId: d.cabinetId,
          date: docDate,
          description: `Facture ${ext.vendorNames?.[0] || 'Inconnu'} - ${d.name}`,
          journal: d.type === 'purchase_invoice' ? 'HA' : 'VT',
          lines,
          status: 'draft',
          documentId: d.id,
          createdAt: new Date().toISOString(),
          fiscalYear: new Date().getFullYear().toString()
        });
      });

      await batch.commit();
      toast({ title: "Validation Magique réussie", description: `${highlyConfident.length} factures comptabilisées automatiquement.` });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: "Erreur lors du traitement par lot" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSkip = useCallback(() => {
    if (isActionLoading || queue.length === 0) return;
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  }, [currentIndex, queue.length, isActionLoading]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger arrows/space if in input (to allow normal typing)
      const inInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);
      
      // Enter anywhere validates the form
      if (e.key === 'Enter') {
        e.preventDefault();
        handleApprove();
        return;
      }

      if (!inInput) {
         if (e.key === 'ArrowRight') { e.preventDefault(); handleApprove(); }
         else if (e.key === 'ArrowLeft' || e.key === ' ') { e.preventDefault(); handleSkip(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleApprove, handleSkip]);

  if (isLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  if (queue.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-muted/20">
        <div className="max-w-md text-center p-8 bg-card rounded-2xl shadow-sm border">
          <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Inbox Zero !</h2>
          <p className="text-muted-foreground">Toutes les factures ont été validées et imputées.</p>
        </div>
      </div>
    );
  }

  const score = currentDocument?.extractedData?.accountingEntry?.confidenceScore || 0;
  const numTtC = parseFloat(editedData.amountTTC) || 0;
  const numVat = parseFloat(editedData.vatAmount) || 0;
  const numHt = numTtC - numVat;
  
  const autoApprovableCount = queue.filter(d => (d.extractedData?.accountingEntry?.confidenceScore || 0) >= 90).length;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Top Header */}
      <div className="shrink-0 flex items-center justify-between p-4 border-b bg-card">
        <div>
          <h1 className="text-xl font-bold font-heading flex items-center gap-2">
            Validation Rapide
            <Badge variant="secondary" className="font-mono text-sm">{currentIndex + 1} / {queue.length}</Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 truncate max-w-sm" title={currentDocument?.name}>
            {currentDocument?.name}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {autoApprovableCount > 0 && (
            <Button variant="secondary" onClick={handleBulkApprove} disabled={isActionLoading} className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20">
              <Wand2 className="h-4 w-4 mr-2" /> Validation Magique ({autoApprovableCount})
            </Button>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground/80 bg-muted/50 px-3 py-2 rounded-lg border hidden lg:flex">
            <Keyboard className="h-4 w-4" />
            <div className="flex items-center gap-1"><kbd className="bg-background px-1.5 py-0.5 rounded border text-xs font-mono shadow-sm">TAB</kbd> Naviguer</div>
            <div className="flex items-center gap-1 ml-2"><kbd className="bg-background px-1.5 py-0.5 rounded border text-xs font-mono shadow-sm">ENTRÉE</kbd> Valider</div>
          </div>
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: PDF Viewer */}
        <div className="w-[60%] border-r bg-muted/20 relative flex flex-col">
          {currentPdfUrl ? (
            <iframe src={`${currentPdfUrl}#toolbar=0&navpanes=0`} className="flex-1 w-full border-none" title="PDF Viewer" />
          ) : (
            <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          )}
        </div>

        {/* Right Side: IA Prediction & Inline Editing */}
        <div className="w-[40%] flex flex-col bg-card">
          <ScrollArea className="flex-1 p-6">
            
            <div className="mb-6 flex flex-col items-center">
              <div className={cn("inline-flex flex-col items-center justify-center p-3 rounded-xl border mb-2 w-full", score >= 90 ? 'text-emerald-500 bg-emerald-500/10' : score >= 70 ? 'text-orange-500 bg-orange-500/10' : 'text-red-500 bg-red-500/10')}>
                <span className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Confiance IA</span>
                <span className="text-3xl font-black font-mono tracking-tighter">{score}%</span>
              </div>
              {score < 70 && (
                <div className="flex items-center gap-2 text-red-500 text-sm mt-1 font-medium"><ShieldAlert className="h-4 w-4" /> Veuillez vérifier les comptes.</div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2">
                Saisie Comptable In-line
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-muted/10">
                  <CardHeader className="p-3 pb-1">
                    <CardDescription className="uppercase font-semibold tracking-wider text-xs">Débit (Charge)</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <Input 
                      className="text-2xl font-mono font-bold h-12 bg-background border-muted hover:border-primary focus:border-primary transition-colors"
                      value={editedData.debitAccount}
                      onChange={e => setEditedData({...editedData, debitAccount: e.target.value})}
                      placeholder="Ex: 606400"
                    />
                  </CardContent>
                </Card>

                <Card className="bg-muted/10">
                  <CardHeader className="p-3 pb-1">
                    <CardDescription className="uppercase font-semibold tracking-wider text-xs">Crédit (Fournisseur)</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <Input 
                      className="text-2xl font-mono font-bold h-12 bg-background border-muted hover:border-primary focus:border-primary transition-colors text-emerald-600 dark:text-emerald-400"
                      value={editedData.creditAccount}
                      onChange={e => setEditedData({...editedData, creditAccount: e.target.value})}
                      placeholder="Ex: 401000"
                    />
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-muted/10">
                  <CardHeader className="p-3 pb-1">
                    <CardDescription className="uppercase font-semibold tracking-wider text-xs">TVA Déductible</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 flex gap-4">
                    <div className="flex-1">
                        <Input 
                          className="text-xl font-mono h-10 bg-background border-muted"
                          value={editedData.vatAccount}
                          onChange={e => setEditedData({...editedData, vatAccount: e.target.value})}
                          placeholder="Compte TVA"
                        />
                    </div>
                    <div className="flex-1 relative">
                        <Input 
                          className="text-xl font-bold h-10 bg-background border-muted pr-8 text-right"
                          value={editedData.vatAmount}
                          onChange={e => setEditedData({...editedData, vatAmount: e.target.value})}
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-2 text-muted-foreground font-bold">€</span>
                    </div>
                  </CardContent>
              </Card>
              
               <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                  <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Montant HT calculé</span>
                      <span className="font-mono font-bold text-muted-foreground">{numHt.toFixed(2)} €</span>
                  </div>
                  <div className="flex items-center gap-4 pt-2 border-t border-primary/10">
                      <span className="text-primary font-bold">Total TTC</span>
                      <div className="relative flex-1">
                          <Input 
                            className="text-xl font-bold h-10 border-primary/30 bg-background text-primary pr-8 text-right focus:border-primary"
                            value={editedData.amountTTC}
                            onChange={e => setEditedData({...editedData, amountTTC: e.target.value})}
                          />
                          <span className="absolute right-3 top-2 text-primary font-bold">€</span>
                      </div>
                  </div>
              </div>
            </div>

          </ScrollArea>

          {/* Action Footer */}
          <div className="shrink-0 p-4 border-t bg-muted/10 flex gap-4">
            <Button 
                variant="outline" size="lg" className="flex-1 h-16 text-lg hover:bg-destructive/10 hover:text-destructive"
                onClick={handleSkip} disabled={isActionLoading}
            >
              <ArrowLeft className="mr-2 h-5 w-5" /> Ignorer
            </Button>
            <Button 
                size="lg" className="flex-[2] h-16 text-lg font-bold shadow-lg hover:scale-[1.02] transition-transform"
                onClick={handleApprove} disabled={isActionLoading}
            >
              Valider (Entrée) <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
