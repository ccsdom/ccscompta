
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check, Send, RotateCcw, Info, Loader2, ListOrdered, User, Clock, CheckCircle, ShieldAlert, MessageSquare, FileJson2, Landmark, Link2 } from 'lucide-react';
import { type Document, type AuditEvent, type Comment } from "@/lib/types";
import { type ExtractDataOutput } from '@/ai/flows/extract-data-from-documents';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { getDocuments, sendDocumentToCegid, getDocumentById } from '@/ai/flows/document-actions';

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

const AuditTrail = ({ trail }: { trail: AuditEvent[] }) => {
  if (!trail || trail.length === 0) return (
      <div className="text-center text-sm text-muted-foreground py-10">
        <ListOrdered className="h-8 w-8 mx-auto mb-2" />
        <p>Aucun événement d'historique pour ce document.</p>
      </div>
  );

  return (
    <div className="space-y-4">
        {trail.slice().reverse().map((event, index) => (
          <div key={index} className="flex items-start gap-3 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted mt-1 shrink-0">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
                <p className="font-medium text-foreground">{event.action}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="flex items-center gap-1"><User className="h-3 w-3" /> {event.user}</span>
                            </TooltipTrigger>
                            <TooltipContent><p>Utilisateur</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(event.date), "PPP 'à' HH:mm", { locale: fr })}</span>
                            </TooltipTrigger>
                            <TooltipContent><p>Date et heure</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
          </div>
        ))}
      </div>
  );
};

const CommentsSection = ({ comments, onAddComment }: { comments: Comment[], onAddComment: (text: string) => void }) => {
    const [newComment, setNewComment] = useState("");

    const handleSubmit = () => {
        if (newComment.trim()) {
            onAddComment(newComment.trim());
            setNewComment("");
        }
    }
    
    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 -mx-4 px-4">
                <div className="space-y-4 py-4">
                    {comments.length > 0 ? (
                        comments.slice().reverse().map((comment) => (
                            <div key={comment.id} className="flex items-start gap-3 text-sm">
                                <Avatar className="h-8 w-8 border shrink-0">
                                    <AvatarFallback>{comment.user.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 bg-muted rounded-md p-3">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{comment.user}</p>
                                        <p className="text-xs text-muted-foreground">{format(new Date(comment.date), "dd/MM/yy 'à' HH:mm", { locale: fr })}</p>
                                    </div>
                                    <p className="mt-1 text-foreground/90">{comment.text}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                         <div className="text-center text-sm text-muted-foreground py-10">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                            <p>Aucun commentaire pour l'instant.</p>
                            <p className="text-xs">Soyez le premier à en ajouter un !</p>
                         </div>
                    )}
                </div>
            </ScrollArea>
             <div className="flex items-start gap-3 pt-4 border-t">
                <Avatar className="h-8 w-8 border shrink-0">
                    <AvatarFallback>Moi</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <Textarea 
                        placeholder="Ajouter un commentaire... Mentionnez quelqu'un avec @"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={2}
                        className="bg-transparent border"
                    />
                    <Button size="sm" className="mt-2" onClick={handleSubmit} disabled={!newComment.trim()}>Envoyer</Button>
                </div>
            </div>
        </div>
    )
}

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

    const handleOtherInfoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, otherInformation: e.target.value }));
    }
    
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label>Noms des vendeurs</Label>
                {(formData.vendorNames || []).map((vendor, index) => <Input key={index} value={vendor ?? ''} onChange={e => handleArrayInputChange('vendorNames', index, e.target.value)} readOnly={isReadOnly} />)}
                {(formData.vendorNames || []).length === 0 && <Input value="-" readOnly disabled />}
                </div>
                <div className="space-y-2">
                <Label>Dates</Label>
                {(formData.dates || []).map((date, index) => <Input key={index} value={date ?? ''} onChange={e => handleArrayInputChange('dates', index, e.target.value)} readOnly={isReadOnly} />)}
                {(formData.dates || []).length === 0 && <Input value="-" readOnly disabled />}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Montant TVA</Label>
                    <Input type="number" value={formData.vatAmount ?? ''} onChange={(e) => handleInputChange('vatAmount', e.target.value === '' ? null : parseFloat(e.target.value))} readOnly={isReadOnly} placeholder="Montant TVA" />
                </div>
                 <div className="space-y-2">
                    <Label>Taux TVA (%)</Label>
                    <Input type="number" value={formData.vatRate ?? ''} onChange={(e) => handleInputChange('vatRate', e.target.value === '' ? null : parseFloat(e.target.value))} readOnly={isReadOnly} placeholder="Taux TVA" />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Catégorie</Label>
                <Input value={formData.category ?? ''} onChange={(e) => handleInputChange('category', e.target.value)} readOnly={isReadOnly} placeholder="Catégorie suggérée par l'IA" />
            </div>
            <div className="space-y-2">
                <Label>Montants</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(formData.amounts || []).map((amount, index) => <Input type="number" key={index} value={amount ?? ''} onChange={e => handleAmountsChange(index, e.target.value)} readOnly={isReadOnly} />)}
                {(formData.amounts || []).length === 0 && <Input value="-" readOnly disabled />}
                </div>
            </div>
            <div className="space-y-2">
                <Label>Autres informations</Label>
                <Textarea value={formData.otherInformation || ''} onChange={handleOtherInfoChange} readOnly={isReadOnly} rows={4} />
            </div>
        </div>
    )
}

const BankStatementView = ({ formData, setFormData, isReadOnly, allDocs }: { formData: ExtractDataOutput, setFormData: React.Dispatch<React.SetStateAction<ExtractDataOutput>>, isReadOnly: boolean, allDocs: Document[] }) => {

    const handleTransactionChange = (index: number, field: string, value: string | number) => {
        const updatedTransactions = [...(formData.transactions || [])];
        (updatedTransactions[index] as any)[field] = value;
        setFormData(prev => ({ ...prev, transactions: updatedTransactions }));
    }

    const getMatchedDocName = (docId: string): string | undefined => {
        return allDocs.find(d => d.id === docId)?.name;
    }

    return (
        <div className="space-y-2">
            <Label>Transactions Extraites</Label>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="h-10 px-2">Date</TableHead>
                        <TableHead className="h-10 px-2">Description</TableHead>
                        <TableHead className="h-10 px-2">Fournisseur</TableHead>
                        <TableHead className="h-10 px-2">Catégorie</TableHead>
                        <TableHead className="h-10 px-2 text-right">Montant</TableHead>
                        <TableHead className="h-10 w-10 p-1"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {(formData.transactions || []).map((tx, index) => (
                        <TableRow key={index}>
                            <TableCell className="p-1"><Input value={tx.date} onChange={(e) => handleTransactionChange(index, 'date', e.target.value)} readOnly={isReadOnly} className="h-8"/></TableCell>
                            <TableCell className="p-1"><Input value={tx.description} onChange={(e) => handleTransactionChange(index, 'description', e.target.value)} readOnly={isReadOnly} className="h-8"/></TableCell>
                            <TableCell className="p-1"><Input value={tx.vendor || ''} onChange={(e) => handleTransactionChange(index, 'vendor', e.target.value)} readOnly={isReadOnly} className="h-8"/></TableCell>
                            <TableCell className="p-1"><Input value={tx.category || ''} onChange={(e) => handleTransactionChange(index, 'category', e.target.value)} readOnly={isReadOnly} className="h-8"/></TableCell>
                            <TableCell className="p-1"><Input type="number" value={tx.amount} onChange={(e) => handleTransactionChange(index, 'amount', parseFloat(e.target.value))} readOnly={isReadOnly} className="h-8 text-right"/></TableCell>
                            <TableCell className="p-1 text-center">
                                {tx.matchingDocumentId && (
                                     <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Link2 className="h-4 w-4 text-primary" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Rapproché avec :</p>
                                                <p className="font-medium">{getMatchedDocName(tx.matchingDocumentId)}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}


export function DataValidationForm({ document, onUpdate, isLoading, onAddComment, onUpdateDocumentInList }: DataValidationFormProps) {
  const [formData, setFormData] = useState<ExtractDataOutput>(initialFormState);
  const [isSending, setIsSending] = useState(false);
  const [allDocs, setAllDocs] = useState<Document[]>([]);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState('Comptable');

  useEffect(() => {
    setCurrentUser(localStorage.getItem('userName') || 'Comptable');
    if(document?.clientId) {
      const fetchDocs = async () => {
        const clientDocs = await getDocuments(document.clientId);
        setAllDocs(clientDocs);
      }
      fetchDocs();
    }
  }, [document]);

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
        toast({
            title: "Modifications annulées",
            description: "Vos modifications ont été annulées.",
        });
    }
  }

  const handleLocalSend = async () => {
    if (!document) return;
    setIsSending(true);
    const result = await sendDocumentToCegid(document.id, currentUser);
    if(result.success) {
      toast({ title: "Données envoyées", description: `${document.name} a été envoyé à CEGID avec succès.` });
      // Fetch the updated document to get the new audit trail
      const updatedDoc = await getDocumentById(document.id);
      if (updatedDoc) {
        onUpdateDocumentInList(updatedDoc);
      }
    } else {
      toast({ variant: 'destructive', title: "Erreur d'envoi", description: result.error });
    }
    setIsSending(false);
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(document) onUpdate(document.id, formData);
  }

  const isReadOnly = document?.status === 'approved' || isLoading || document?.status === 'processing';
  const isBankStatement = document?.type === 'bank statement';

  if (!document) {
    return null;
  }
  
  const hasAnomalies = formData.anomalies && formData.anomalies.length > 0;
  const hasExtractedData = (document.extractedData && !isLoading) && ((formData.amounts && formData.amounts.length > 0) || (formData.transactions && formData.transactions.length > 0));

  const DataView = () => {
    return (
        <ScrollArea className="flex-1">
             <div className="p-6">
                {hasAnomalies && (
                    <Alert variant="destructive" className="mb-4">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>Anomalies Détectées !</AlertTitle>
                        <AlertDescription>
                        <ul className="list-disc pl-4 mt-1">
                            {formData.anomalies!.map((anomaly, index) => (
                            <li key={index}>{anomaly}</li>
                            ))}
                        </ul>
                        <p className="mt-2">Veuillez vérifier attentivement les données extraites avant d'approuver.</p>
                        </AlertDescription>
                    </Alert>
                )}
                
                {hasExtractedData ? (
                    isBankStatement ? <BankStatementView formData={formData} setFormData={setFormData} isReadOnly={isReadOnly} allDocs={allDocs} /> : <ExtractedData formData={formData} setFormData={setFormData} isReadOnly={isReadOnly} />
                ) : (
                    <div className="text-center text-sm text-muted-foreground py-10">
                        {document.status === 'pending' && <Info className="h-8 w-8 mx-auto mb-2" />}
                        {document.status === 'error' && <AlertCircle className="h-8 w-8 mx-auto mb-2" />}
                        
                        <h3 className="font-semibold text-foreground mb-1">
                            {document.status === 'pending' && "Document en attente"}
                            {document.status === 'error' && "Erreur de traitement"}
                        </h3>
                        <p>
                            {document.status === 'pending' && "Cliquez sur 'Traiter' pour lancer l'extraction des données."}
                            {document.status === 'error' && "Impossible d'extraire les données de ce document."}
                        </p>
                    </div>
                )}
            </div>
         </ScrollArea>
    )
  }

  return (
    <div className="h-full flex flex-col">
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <div className="flex-1 p-0 flex flex-col gap-4 overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-4 text-sm font-medium">Analyse par l'IA en cours...</p>
                    </div>
                )}

                <div className="flex-1 flex flex-col overflow-y-auto">
                    <Tabs defaultValue="data" className="flex-1 flex flex-col h-full">
                        <TabsList className="grid w-full grid-cols-3 mx-6 mt-6">
                            <TabsTrigger value="data" className="gap-1">
                                {isBankStatement ? <Landmark className="h-4 w-4"/> : <FileJson2 className="h-4 w-4" />}
                                {isBankStatement ? 'Transactions' : 'Données'}
                            </TabsTrigger>
                            <TabsTrigger value="comments" className="gap-1">
                                <MessageSquare className="h-4 w-4" />
                                Commentaires {(document.comments || []).length > 0 && <span className="text-xs bg-primary text-primary-foreground h-4 w-4 flex items-center justify-center rounded-full">{(document.comments || []).length}</span>}
                            </TabsTrigger>
                            <TabsTrigger value="history" className="gap-1"><ListOrdered className="h-4 w-4" />Historique</TabsTrigger>
                        </TabsList>
                        <TabsContent value="data" className="flex-1 mt-4">
                            <DataView />
                        </TabsContent>
                        <TabsContent value="comments" className="flex-1 mt-0 p-6">
                             <CommentsSection comments={document.comments || []} onAddComment={onAddComment} />
                        </TabsContent>
                        <TabsContent value="history" className="flex-1 mt-4 p-6">
                            <ScrollArea className="h-full pr-4">
                               <AuditTrail trail={document.auditTrail} />
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t bg-background">
              {document.status === 'reviewing' && (
                <>
                  <Button variant="ghost" type="button" onClick={handleDiscard}><RotateCcw className="h-4 w-4 mr-2" />Annuler</Button>
                  <Button type="submit"><Check className="h-4 w-4 mr-2" />Approuver</Button>
                </>
              )}
              {document.status === 'approved' && (
                <Button type="button" onClick={handleLocalSend} disabled={isSending}>
                  {isSending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Envoi en cours</> : <><Send className="h-4 w-4 mr-2" />Envoyer à Cegid</>}
                </Button>
              )}
            </div>
        </form>
    </div>
  );
}
