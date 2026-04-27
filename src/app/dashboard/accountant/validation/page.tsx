'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/firebase';
import { useBranding } from '@/components/branding-provider';
import type { Document } from '@/lib/types';
import { Loader2, Check, X, ShieldAlert, FileClock, ArrowRight, ArrowLeft, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ValidationExpertPage() {
  const [queue, setQueue] = useState<Document[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { profile: userProfile, cabinet } = useBranding();
  const cabinetId = userProfile?.cabinetId;
  const isAdmin = userProfile?.role === 'admin';

  // 1. Fetch the queue of documents pending review
  useEffect(() => {
    if (!userProfile) return;

    const baseQuery = collection(db, 'documents');
    const q = isAdmin 
      ? query(baseQuery, where('status', '==', 'reviewing'))
      : query(baseQuery, where('status', '==', 'reviewing'), where('cabinetId', '==', cabinetId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document));
      // Sort by uploadDate locally for consistent ordering
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
  }, [userProfile, cabinetId, isAdmin]);

  // 2. Compute current document
  const currentDocument = queue[currentIndex];

  // 3. Load PDF URL when current document changes
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

  // 4. Actions (Approve / Skip)
  const handleApprove = useCallback(async () => {
    if (!currentDocument) return;
    if (isActionLoading) return;
    
    setIsActionLoading(true);
    try {
      const docRef = doc(db, 'documents', currentDocument.id);
      
      // Calculate billable lines for the cabinet to bill their clients
      // Standard: Charge (1) + Vendor (1) + VAT if any (1)
      const hasVat = (currentDocument.extractedData?.vatAmount ?? 0) > 0;
      const billableLines = hasVat ? 3 : 2;
      
      // Extract month for billing period from document date or current date
      const docDate = currentDocument.extractedData?.dates?.[0] || new Date().toISOString();
      const billingPeriod = docDate.substring(0, 7); // YYYY-MM
      
      // Update the document to approved with billing metadata
      await updateDoc(docRef, {
        status: 'approved',
        billableLines,
        billingPeriod,
        approvalDate: new Date().toISOString(),
      });
      
      toast({ title: "Validé !", description: `Facture ${currentDocument.name} imputée (${billableLines} lignes).` });
      
      // The snapshot will trigger and remove the doc from queue, but we can also manually advance
      // However since snapshot updates, queue length will decrease. We can just stay at currentIndex
      // unless it's out of bounds.
    } catch (error) {
      console.error("Error approving doc:", error);
      toast({ variant: 'destructive', title: "Erreur", description: "Impossible d'approuver le document." });
    } finally {
      setIsActionLoading(false);
    }
  }, [currentDocument, isActionLoading]);

  const handleSkip = useCallback(() => {
    if (isActionLoading || queue.length === 0) return;
    
    // Just move to the next document in the local queue
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Loop back to start if we reached the end
      setCurrentIndex(0);
    }
  }, [currentIndex, queue.length, isActionLoading]);

  // 5. Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        handleApprove();
      } else if (e.key === 'ArrowLeft' || e.key === ' ') {
        e.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleApprove, handleSkip]);

  // Handle empty queue
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-muted-foreground animate-pulse">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
        <h2 className="text-xl font-semibold">Chargement de la file d'attente...</h2>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-muted/20">
        <div className="max-w-md text-center p-8 bg-card rounded-2xl shadow-sm border">
          <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Inbox Zero !</h2>
          <p className="text-muted-foreground">Toutes les factures ont été validées et imputées. Beau travail.</p>
        </div>
      </div>
    );
  }

  const extractedData = currentDocument?.extractedData;
  const entry = extractedData?.accountingEntry;
  const score = entry?.confidenceScore || 0;
  
  const getScoreColor = (s: number) => {
    if (s >= 90) return 'text-green-500 bg-green-500/10 border-green-500/20';
    if (s >= 70) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Top Header */}
      <div className="shrink-0 flex items-center justify-between p-4 border-b bg-card">
        <div>
          <h1 className="text-xl font-bold font-heading flex items-center gap-2">
            Validation Rapide
            <Badge variant="secondary" className="font-mono text-sm">
              {currentIndex + 1} / {queue.length}
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 text-balance">
            Facture : {currentDocument?.name}
          </p>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground/80 bg-muted/50 px-3 py-2 rounded-lg border hidden md:flex">
          <Keyboard className="h-4 w-4" />
          <div className="flex items-center gap-1"><kbd className="bg-background px-1.5 py-0.5 rounded border text-xs font-mono shadow-sm">← / ESPACE</kbd> Ignorer</div>
          <div className="flex items-center gap-1 ml-2"><kbd className="bg-background px-1.5 py-0.5 rounded border text-xs font-mono shadow-sm">ENTRÉE / →</kbd> Valider</div>
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: PDF Viewer (60%) */}
        <div className="w-[60%] border-r bg-muted/20 relative flex flex-col">
          {currentPdfUrl ? (
            <iframe 
              src={`${currentPdfUrl}#toolbar=0&navpanes=0`} 
              className="flex-1 w-full border-none"
              title="Visionneuse PDF"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </div>

        {/* Right Side: IA Prediction (40%) */}
        <div className="w-[40%] flex flex-col bg-card">
          <ScrollArea className="flex-1 p-6">
            
            {/* Confidence Score */}
            <div className="mb-8 flex flex-col items-center">
              <div className={cn("inline-flex flex-col items-center justify-center p-4 rounded-xl border mb-2 w-full", getScoreColor(score))}>
                <span className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Confiance IA</span>
                <span className="text-4xl font-black font-mono tracking-tighter">{score}%</span>
              </div>
              {score < 70 && (
                <div className="flex items-center gap-2 text-red-500 text-sm mt-2 font-medium bg-red-500/10 px-3 py-1.5 rounded-md w-full justify-center">
                  <ShieldAlert className="h-4 w-4" /> Attention: Confiance faibe, vérifiez la matrice.
                </div>
              )}
            </div>

            {/* PCG Prediction */}
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2">
                Écriture Comptable
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-muted/10">
                  <CardHeader className="p-4 pb-2">
                    <CardDescription className="uppercase font-semibold tracking-wider text-xs">Débit (Charge)</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-3xl font-mono font-bold text-foreground">
                      {entry?.debitAccount || <span className="text-muted-foreground/30">N/A</span>}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground mt-1 truncate" title={extractedData?.category || ''}>
                      {extractedData?.category || 'Non catégorisé'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-muted/10">
                  <CardHeader className="p-4 pb-2">
                    <CardDescription className="uppercase font-semibold tracking-wider text-xs">Crédit (Fournisseur)</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-3xl font-mono font-bold text-foreground">
                      {entry?.creditAccount || <span className="text-muted-foreground/30">N/A</span>}
                    </p>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1 truncate" title={extractedData?.vendorNames?.[0] || 'Inconnu'}>
                      {extractedData?.vendorNames?.[0] || 'Inconnu'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-muted/10 border-dashed">
                  <CardHeader className="p-4 pb-2">
                    <CardDescription className="uppercase font-semibold tracking-wider text-xs">TVA Déductible</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex justify-between items-end">
                    <div>
                        <p className="text-2xl font-mono font-semibold text-muted-foreground">
                          {entry?.vatAccount || '445660'}
                        </p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm text-muted-foreground mb-1">Montant TVA</p>
                       <p className="text-xl font-bold">{extractedData?.vatAmount ? `${extractedData.vatAmount} €` : '0,00 €'}</p>
                    </div>
                  </CardContent>
              </Card>
              
               {/* Summary Amounts */}
               <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-foreground/70 font-medium">Montant HT (estimé)</span>
                      <span className="font-mono text-sm">
                          {extractedData?.amounts?.[0] && typeof extractedData.vatAmount === 'number' 
                              ? `${(extractedData.amounts[0] - extractedData.vatAmount).toFixed(2)} €` 
                              : '-'}
                      </span>
                  </div>
                  <div className="flex justify-between items-center text-primary font-bold text-lg pt-2 border-t border-primary/10">
                      <span>Total TTC</span>
                      <span className="font-mono">
                          {extractedData?.amounts?.[0] ? `${extractedData.amounts[0]} €` : '-'}
                      </span>
                  </div>
              </div>
            </div>

          </ScrollArea>

          {/* Action Footer */}
          <div className="shrink-0 p-4 border-t bg-muted/10 flex gap-4">
            <Button 
                variant="outline" 
                size="lg" 
                className="flex-1 h-16 text-lg hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                onClick={handleSkip}
                disabled={isActionLoading}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Ignorer
            </Button>
            <Button 
                size="lg" 
                className="flex-[2] h-16 text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                onClick={handleApprove}
                disabled={isActionLoading}
            >
              Valider (Passer au suivant)
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
