'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Check, Send, RotateCcw, Info, Loader2, ListOrdered, User, Clock, 
  CheckCircle, ShieldAlert, MessageSquare, FileJson2, Landmark, 
  AlertCircle, Sparkles, ChevronRight, History, Zap
} from 'lucide-react';
import { type Document, type AuditEvent, type Comment } from "@/lib/types";
import { type ExtractDataOutput } from '@/ai/flows/extract-data-from-documents';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableHeader, TableRow, TableHead } from '@/components/ui/table';

import { runBankReconciliation } from '@/ai/flows/reconcile-actions';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { cn } from '@/lib/utils';

interface DataValidationFormProps {
  document: Document | null;
  onUpdate: (docId: string, updatedData: ExtractDataOutput) => void;
  isLoading: boolean;
  onAddComment: (commentText: string) => void;
  onUpdateDocumentInList: (updatedDoc: Document) => void;
}

const initialFormState: ExtractDataOutput = {
  dates: [],
  amounts: [],
  vendorNames: [],
  category: '',
  otherInformation: '',
  anomalies: [],
  transactions: [],
};

// ─── Sub-component: Audit Trail ──────────────────────────────────────────────

const AuditTrail = ({ trail }: { trail: AuditEvent[] }) => {
  if (!trail || trail.length === 0) return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-40">
        <History className="h-12 w-12" />
        <div className="space-y-1">
          <p className="font-space font-black uppercase text-xs tracking-widest">Historique Vide</p>
          <p className="text-xs">Aucun événement enregistré.</p>
        </div>
      </div>
  );

  return (
    <div className="space-y-6">
        {trail.slice().reverse().map((event, index) => (
          <motion.div 
            key={index} 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative pl-8 pb-6 border-l border-white/10 last:pb-0"
          >
            <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            </div>
            <div className="space-y-1">
                <p className="font-bold text-sm">{event.action}</p>
                <div className="flex items-center gap-4 text-[10px] font-space font-bold uppercase tracking-widest opacity-60">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {event.user}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(event.date), "PPP", { locale: fr })}</span>
                </div>
            </div>
          </motion.div>
        ))}
      </div>
  );
};

// ─── Sub-component: Comments ──────────────────────────────────────────────────

const CommentsSection = ({ comments, onAddComment }: { comments: Comment[], onAddComment: (text: string) => void }) => {
    const [newComment, setNewComment] = useState("");

    const handleSubmit = () => {
        if (newComment.trim()) {
            onAddComment(newComment.trim());
            setNewComment("");
        }
    }
    
    return (
        <div className="flex flex-col h-full space-y-4">
            <ScrollArea className="flex-1">
                <div className="space-y-4 pr-4">
                    {comments.length > 0 ? (
                        comments.map((comment, idx) => (
                            <motion.div 
                                key={comment.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-start gap-3"
                            >
                                <Avatar className="h-8 w-8 border-none bg-primary/10 shrink-0">
                                    <AvatarFallback className="text-[10px] font-black">{comment.user.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 glass-panel p-3 premium-shadow-sm border-none">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-black font-space text-[10px] uppercase tracking-widest text-primary">{comment.user}</p>
                                        <p className="text-[9px] opacity-40 font-mono">{format(new Date(comment.date), "HH:mm")}</p>
                                    </div>
                                    <p className="text-sm leading-relaxed">{comment.text}</p>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                         <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-40 h-[300px]">
                            <MessageSquare className="h-12 w-12" />
                            <p className="font-space font-black uppercase text-xs tracking-widest">Aucun commentaire</p>
                         </div>
                    )}
                </div>
            </ScrollArea>
             <div className="pt-4 border-t border-white/10 space-y-3">
                <Textarea 
                    placeholder="Écrivez votre message..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="bg-white/5 border-none focus-visible:ring-primary h-20 rounded-2xl resize-none text-sm p-4"
                />
                <Button 
                    className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-space font-black uppercase tracking-widest text-xs" 
                    onClick={handleSubmit} 
                    disabled={!newComment.trim()}
                >
                    <Send className="h-4 w-4 mr-2" /> Envoyer
                </Button>
            </div>
        </div>
    )
}

// ─── Sub-component: Extracted Data (Standard) ───────────────────────────────

const ExtractedData = ({ formData, setFormData, isReadOnly }: { formData: ExtractDataOutput, setFormData: React.Dispatch<React.SetStateAction<ExtractDataOutput>>, isReadOnly: boolean }) => {
    
    const handleInputChange = (field: keyof ExtractDataOutput, value: string | number | null) => {
        setFormData(prev => ({...prev, [field]: value}));
    }

    const handleArrayInputChange = (field: 'dates' | 'vendorNames', index: number, value: string) => {
        setFormData(prev => {
        const newArray = [...(prev[field] || [])];
        newArray[index] = value;
        return { ...prev, [field]: newArray };
        });
    };

    const handleAmountsChange = (index: number, value: string) => {
        const newAmounts = [...(formData.amounts || [])];
        newAmounts[index] = parseFloat(value) || 0;
        setFormData(prev => ({ ...prev, amounts: newAmounts }));
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-space font-black uppercase tracking-widest opacity-60">Marchand(s)</Label>
                    <div className="space-y-1">
                        {(formData.vendorNames || []).map((vendor, index) => (
                            <Input key={index} value={vendor ?? ''} onChange={e => handleArrayInputChange('vendorNames', index, e.target.value)} readOnly={isReadOnly} className="bg-white/5 border-none h-11 premium-shadow-sm font-semibold" />
                        ))}
                        {(formData.vendorNames || []).length === 0 && <Input value="-" readOnly disabled className="bg-white/5 border-none opacity-50" />}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-space font-black uppercase tracking-widest opacity-60">Date(s) Détectée(s)</Label>
                    <div className="space-y-1">
                        {(formData.dates || []).map((date, index) => (
                            <Input key={index} value={date ?? ''} onChange={e => handleArrayInputChange('dates', index, e.target.value)} readOnly={isReadOnly} className="bg-white/5 border-none h-11 premium-shadow-sm font-mono" />
                        ))}
                        {(formData.dates || []).length === 0 && <Input value="-" readOnly disabled className="bg-white/5 border-none opacity-50" />}
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-space font-black uppercase tracking-widest opacity-60">Montant TVA</Label>
                    <Input type="number" value={formData.vatAmount ?? ''} onChange={(e) => handleInputChange('vatAmount', e.target.value === '' ? null : parseFloat(e.target.value))} readOnly={isReadOnly} className="bg-white/5 border-none h-11 premium-shadow-sm font-semibold tabular-nums" />
                </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-space font-black uppercase tracking-widest opacity-60">Taux TVA (%)</Label>
                    <Input type="number" value={formData.vatRate ?? ''} onChange={(e) => handleInputChange('vatRate', e.target.value === '' ? null : parseFloat(e.target.value))} readOnly={isReadOnly} className="bg-white/5 border-none h-11 premium-shadow-sm font-semibold tabular-nums" />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-space font-black uppercase tracking-widest opacity-60">Classification</Label>
                <div className="relative">
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-pulse" />
                    <Input value={formData.category ?? ''} onChange={(e) => handleInputChange('category', e.target.value)} readOnly={isReadOnly} className="bg-white/5 border-none h-11 pl-10 premium-shadow-sm font-bold text-primary" />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-space font-black uppercase tracking-widest opacity-60">Montant(s) HT / TTC</Label>
                <div className="grid grid-cols-2 gap-2">
                    {(formData.amounts || []).map((amount, index) => (
                        <div key={index} className="relative">
                            <Input type="number" value={amount ?? ''} onChange={e => handleAmountsChange(index, e.target.value)} readOnly={isReadOnly} className="bg-white/5 border-none h-11 premium-shadow-sm font-black text-lg text-emerald-500 pr-8" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500/50 font-black text-xs">€</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-space font-black uppercase tracking-widest opacity-60">Notes d'extraction</Label>
                <Textarea value={formData.otherInformation || ''} onChange={(e) => handleInputChange('otherInformation', e.target.value)} readOnly={isReadOnly} rows={3} className="bg-white/5 border-none rounded-xl premium-shadow-sm resize-none" />
            </div>
        </div>
    )
}

// ─── Sub-component: Bank Statement Data ─────────────────────────────────────

const BankStatementData = ({ formData, setFormData, isReadOnly, documentId, clientId }: { formData: ExtractDataOutput, setFormData: React.Dispatch<React.SetStateAction<ExtractDataOutput>>, isReadOnly: boolean, documentId: string, clientId: string }) => {
    const { toast } = useToast();
    const [isReconciling, setIsReconciling] = useState(false);

    const handleReconcile = async () => {
        if (!formData.transactions || formData.transactions.length === 0) return;
        setIsReconciling(true);
        toast({ title: 'Lettrage en cours...', description: "L'IA recherche les factures correspondantes..." });
        
        try {
            const res = await runBankReconciliation(formData.transactions as any, clientId);
            if (res.success && 'matches' in res && res.matches) {
                const newTransactions = [...formData.transactions];
                let matchedCount = 0;
                
                res.matches.forEach((match: any) => {
                    if (newTransactions[match.transactionIndex]) {
                        newTransactions[match.transactionIndex].matchingDocumentId = match.documentId;
                        if (match.confidenceScore) {
                            (newTransactions[match.transactionIndex] as any).confidenceScore = match.confidenceScore;
                        }
                        matchedCount++;
                    }
                });

                const newAnomalies = formData.anomalies ? [...formData.anomalies] : [];
                if ('anomalies' in res && res.anomalies) {
                     res.anomalies.forEach((anomaly: any) => {
                         newAnomalies.push(`Ligne ${anomaly.transactionIndex + 1} : ${anomaly.reason}`);
                         if (newTransactions[anomaly.transactionIndex]) {
                             (newTransactions[anomaly.transactionIndex] as any).isAnomaly = true;
                         }
                     });
                }
                
                setFormData(prev => ({ ...prev, transactions: newTransactions, anomalies: newAnomalies }));
                await updateDoc(doc(db, 'documents', documentId), {
                    extractedData: { ...formData, transactions: newTransactions, anomalies: newAnomalies }
                });

                toast({ title: 'Rapprochement terminé', description: `${matchedCount} transactions lettrées.` });
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Erreur', description: 'Échec du lettrage intelligent.' });
        } finally {
            setIsReconciling(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center glass-panel p-4 mb-2 border-none">
                <div>
                   <h4 className="font-black font-space text-[10px] uppercase tracking-widest text-primary">Opérations Bancaires</h4>
                   <p className="text-xs opacity-60">{(formData.transactions || []).length} lignes extraites.</p>
                </div>
                {!isReadOnly && (
                    <Button type="button" onClick={handleReconcile} disabled={isReconciling} size="sm" className="bg-primary hover:bg-primary/90 rounded-lg h-9 font-space font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                        {isReconciling ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Zap className="h-3 w-3 mr-2" />}
                        Lettrer IA
                    </Button>
                )}
            </div>
            
            <div className="glass-panel overflow-hidden border-none premium-shadow-sm">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="border-white/10">
                            <TableHead className="font-space font-black uppercase text-[9px] tracking-widest pl-4">Date</TableHead>
                            <TableHead className="font-space font-black uppercase text-[9px] tracking-widest">Detail</TableHead>
                            <TableHead className="font-space font-black uppercase text-[9px] tracking-widest text-right">Montant</TableHead>
                            <TableHead className="font-space font-black uppercase text-[9px] tracking-widest text-center">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(formData.transactions || []).map((t: any, i) => (
                            <TableRow key={i} className={cn("border-white/5 transition-colors", t.isAnomaly ? "bg-red-500/5" : "hover:bg-white/5")}>
                                <td className="px-4 py-2 font-mono text-[10px] opacity-60">{t.date}</td>
                                <td className="px-4 py-2">
                                    <div className="font-bold text-xs">{t.vendor || t.description}</div>
                                </td>
                                <td className={cn("px-4 py-2 text-right font-black font-space text-xs tabular-nums", (t.amount ?? 0) < 0 ? 'text-red-500' : 'text-emerald-500')}>
                                    {t.amount?.toFixed(2)} €
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                {t.matchingDocumentId ? (
                                                    <div className="inline-flex items-center justify-center p-1 rounded-lg bg-emerald-500/10 text-emerald-500">
                                                        <CheckCircle className="h-3.5 w-3.5" />
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center justify-center p-1 rounded-lg bg-white/5 text-muted-foreground opacity-50">
                                                        <Clock className="h-3.5 w-3.5" />
                                                    </div>
                                                )}
                                            </TooltipTrigger>
                                            {t.matchingDocumentId && (
                                                <TooltipContent className="glass-panel border-white/10 shadow-2xl">
                                                    <p className="text-xs font-space font-black">MATCH {t.confidenceScore}%</p>
                                                    <p className="text-[10px]">Doc: {t.matchingDocumentId.slice(0,8)}</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                </td>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

// ─── Main Component: DataValidationForm ───────────────────────────────────────

export function DataValidationForm({ document, onUpdate, isLoading, onAddComment }: DataValidationFormProps) {
  const [formData, setFormData] = useState<ExtractDataOutput>(initialFormState);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (document?.extractedData) {
      setFormData(document.extractedData);
    } else {
      setFormData(initialFormState);
    }
    setIsSending(false);
  }, [document]);

  const handleDiscard = () => {
    if (document?.extractedData) {
        setFormData(document.extractedData);
        toast({ title: "Modifications annulées" });
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(document) onUpdate(document.id, formData);
  }

  if (!document) return null;
  
  const isReadOnly = ['approved', 'processing'].includes(document.status) || isLoading;
  const isBankStatement = document.type === 'bank statement';
  const hasAnomalies = formData.anomalies && formData.anomalies.length > 0;
  const hasExtractedData = (document.extractedData && !isLoading) && ((formData.amounts && formData.amounts.length > 0) || (formData.transactions && formData.transactions.length > 0));

  return (
    <div className="h-full flex flex-col overflow-hidden">
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <div className="flex-1 flex flex-col overflow-hidden relative p-4 space-y-4">
                {isLoading && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="absolute inset-0 bg-background/60 backdrop-blur-md flex flex-col items-center justify-center z-50 rounded-3xl"
                    >
                        <div className="h-16 w-16 rounded-[1.5rem] border-4 border-white/5 border-t-primary animate-spin" />
                        <p className="mt-4 font-space font-black uppercase text-xs tracking-widest text-primary">Analyse IA en cours...</p>
                    </motion.div>
                )}

                <Tabs defaultValue="data" className="flex-1 flex flex-col h-full overflow-hidden">
                    <TabsList className="bg-white/5 border-none p-1.5 h-12 rounded-2xl grid grid-cols-3 premium-shadow-sm">
                        <TabsTrigger value="data" className="rounded-xl font-space font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            {isBankStatement ? <Landmark className="h-3.5 w-3.5 mr-2"/> : <FileJson2 className="h-3.5 w-3.5 mr-2" />}
                            Data
                        </TabsTrigger>
                        <TabsTrigger value="comments" className="relative rounded-xl font-space font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <MessageSquare className="h-3.5 w-3.5 mr-2" />
                            Notes
                            {(document.comments || []).length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] h-4 w-4 flex items-center justify-center rounded-full animate-bounce">{(document.comments || []).length}</span>}
                        </TabsTrigger>
                        <TabsTrigger value="history" className="rounded-xl font-space font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <History className="h-3.5 w-3.5 mr-2" />
                            Logs
                        </TabsTrigger>
                    </TabsList>

                    <AnimatePresence mode="wait">
                        <TabsContent key="data" value="data" className="flex-1 mt-4 glass-panel border-none premium-shadow overflow-hidden p-0 m-0 outline-none">
                            <ScrollArea className="h-full">
                                <div className="p-6">
                                    {hasAnomalies && (
                                        <Alert variant="destructive" className="mb-6 rounded-2xl border-none bg-red-500/10 text-red-600">
                                            <ShieldAlert className="h-5 w-5" />
                                            <AlertTitle className="font-space font-black uppercase text-xs tracking-widest mb-2">Attention : Anomalie IA</AlertTitle>
                                            <AlertDescription className="text-sm">
                                                <ul className="list-disc pl-4 space-y-1">
                                                    {formData.anomalies!.map((anomaly, index) => <li key={index} className="font-medium">{anomaly}</li>)}
                                                </ul>
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                    
                                    {hasExtractedData ? (
                                        isBankStatement ? (
                                            <BankStatementData formData={formData} setFormData={setFormData} isReadOnly={isReadOnly} documentId={document.id} clientId={document.clientId!} />
                                        ) : (
                                            <ExtractedData formData={formData} setFormData={setFormData} isReadOnly={isReadOnly} />
                                        )
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-40 py-20">
                                            {document.status === 'pending' ? <Clock className="h-16 w-16 animate-pulse" /> : <AlertCircle className="h-16 w-16" />}
                                            <div className="space-y-1">
                                                <p className="font-space font-black uppercase text-xs tracking-widest">
                                                    {document.status === 'pending' ? "Traitement en attente" : "Erreur d'extraction"}
                                                </p>
                                                <p className="text-xs max-w-xs">
                                                    {document.status === 'pending' ? "L'IA n'a pas encore analysé ce fichier." : "Impossible d'extraire des données exploitables."}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent key="comments" value="comments" className="flex-1 mt-4 glass-panel border-none premium-shadow p-6 m-0 outline-none">
                            <CommentsSection comments={document.comments || []} onAddComment={onAddComment} />
                        </TabsContent>

                        <TabsContent key="history" value="history" className="flex-1 mt-4 glass-panel border-none premium-shadow m-0 outline-none">
                            <ScrollArea className="h-full p-6">
                               <AuditTrail trail={document.auditTrail} />
                            </ScrollArea>
                        </TabsContent>
                    </AnimatePresence>
                </Tabs>
            </div>

            <div className="flex justify-end items-center gap-3 p-6 bg-white/5 border-t border-white/5">
              {document.status === 'reviewing' && (
                <>
                  <Button variant="ghost" type="button" onClick={handleDiscard} className="h-12 px-6 rounded-xl font-space font-black uppercase text-[10px] tracking-widest opacity-60 hover:opacity-100 hover:bg-white/5">
                    <RotateCcw className="h-4 w-4 mr-2" /> Rejeter
                  </Button>
                  <Button type="submit" className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 font-space font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
                    <Check className="h-4 w-4 mr-2" /> Approuver l'extraction
                  </Button>
                </>
              )}
              {document.status === 'approved' && (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-2 rounded-xl font-space font-black uppercase text-[10px]">
                      <CheckCircle className="h-4 w-4 mr-2" /> Document Validé
                  </Badge>
              )}
            </div>
        </form>
    </div>
  );
}
