
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check, Send, RotateCcw, Info, Loader2, ListOrdered, User, Clock, CheckCircle, ShieldAlert, MessageSquare, FileJson2 } from 'lucide-react';
import { type Document, type AuditEvent, type Comment } from "@/app/dashboard/documents/page";
import { type ExtractDataOutput } from '@/ai/flows/extract-data-from-documents';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


interface DataValidationFormProps {
  document: Document | null;
  onUpdate: (updatedData: ExtractDataOutput) => void;
  onSendToCegid: (doc: Document) => void;
  isLoading: boolean;
  onAddComment: (commentText: string) => void;
  isSheet?: boolean;
  isClientView?: boolean;
}

const initialFormState: ExtractDataOutput = {
  dates: [],
  amounts: [],
  vendorNames: [],
  category: '',
  otherInformation: '',
  anomalies: [],
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
    
    const handleInputChange = (field: keyof ExtractDataOutput, value: string) => {
        setFormData(prev => ({...prev, [field]: value}));
    }

    const handleArrayInputChange = (field: 'dates' | 'vendorNames', index: number, value: string) => {
        setFormData(prev => {
        const newArray = [...prev[field]];
        newArray[index] = value;
        return { ...prev, [field]: newArray };
        });
    };

    const handleAmountsChange = (index: number, value: string) => {
        const newAmounts = [...formData.amounts];
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
                {formData.vendorNames.map((vendor, index) => <Input key={index} value={vendor} onChange={e => handleArrayInputChange('vendorNames', index, e.target.value)} readOnly={isReadOnly} />)}
                {formData.vendorNames.length === 0 && <Input value="-" readOnly disabled />}
                </div>
                <div className="space-y-2">
                <Label>Dates</Label>
                {formData.dates.map((date, index) => <Input key={index} value={date} onChange={e => handleArrayInputChange('dates', index, e.target.value)} readOnly={isReadOnly} />)}
                {formData.dates.length === 0 && <Input value="-" readOnly disabled />}
                </div>
            </div>
            <div className="space-y-2">
                <Label>Catégorie</Label>
                <Input value={formData.category || ''} onChange={(e) => handleInputChange('category', e.target.value)} readOnly={isReadOnly} placeholder="Catégorie suggérée par l'IA" />
            </div>
            <div className="space-y-2">
                <Label>Montants</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {formData.amounts.map((amount, index) => <Input type="number" key={index} value={amount} onChange={e => handleAmountsChange(index, e.target.value)} readOnly={isReadOnly} />)}
                {formData.amounts.length === 0 && <Input value="-" readOnly disabled />}
                </div>
            </div>
            <div className="space-y-2">
                <Label>Autres informations</Label>
                <Textarea value={formData.otherInformation} onChange={handleOtherInfoChange} readOnly={isReadOnly} rows={4} />
            </div>
        </div>
    )
}


export function DataValidationForm({ document, onUpdate, onSendToCegid, isLoading, onAddComment, isSheet = false, isClientView = false }: DataValidationFormProps) {
  const [formData, setFormData] = useState<ExtractDataOutput>(initialFormState);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (document?.extractedData) {
      setFormData(document.extractedData);
    } else {
      setFormData(initialFormState);
    }
     // Reset sent state when document changes
    setIsSent(false);
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(document) onUpdate(formData);
  }

  const isReadOnly = document?.status === 'approved' || isLoading || document?.status === 'processing' || isClientView;

  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (isClientView) {
      return <div className="h-full flex flex-col">{children}</div>;
    }
    return (
        <Card className={`flex-1 rounded-none border-0 lg:rounded-lg lg:border h-full flex flex-col ${isSheet ? '' : 'mt-[-24px]'}`}>
            {children}
        </Card>
    );
  };

  if (!document) {
    return null;
  }
  
  if (isClientView) {
      return (
          <div className="h-full flex flex-col">
              <div className="flex-1 p-6">
                  {isSheet && (
                      <div className="aspect-[3/4] max-h-[400px] w-full bg-muted rounded-md overflow-hidden mx-auto mb-4">
                          <iframe src={document.dataUrl} className="w-full h-full" title="Aperçu du document" />
                      </div>
                  )}
                  <h3 className="font-semibold text-lg mb-4">Données validées</h3>
                   {document.status === 'approved' && document.extractedData ? (
                     <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span>Fournisseur:</span><span className="font-medium">{document.extractedData.vendorNames.join(', ')}</span></div>
                        <div className="flex justify-between"><span>Date:</span><span className="font-medium">{document.extractedData.dates[0]}</span></div>
                        <div className="flex justify-between"><span>Montant:</span><span className="font-medium">{document.extractedData.amounts[0].toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</span></div>
                        <div className="flex justify-between"><span>Catégorie:</span><span className="font-medium">{document.extractedData.category}</span></div>
                     </div>
                   ) : (
                     <div className="text-center text-sm text-muted-foreground py-8">
                        <p>Les données du document n'ont pas encore été validées par votre comptable.</p>
                     </div>
                   )}
              </div>
          </div>
      )
  }

  const hasAnomalies = formData.anomalies && formData.anomalies.length > 0;
  const hasExtractedData = document.extractedData && !isLoading;

  return (
    <CardWrapper>
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        <CardHeader className="p-4 lg:p-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-xl">Détails du Document</CardTitle>
              <CardDescription className="truncate max-w-[250px] md:max-w-sm" title={document.name}>
                {document.name}
              </CardDescription>
            </div>
            {document.type && <Badge variant={document.confidence && document.confidence > 0.8 ? "default" : "secondary"}>{document.type} ({(document.confidence ?? 0) * 100}%)</Badge>}
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 lg:p-6 lg:pt-0 flex flex-col gap-4">
            {isSheet && (
                <div className="aspect-[3/4] max-h-[400px] w-full bg-muted rounded-md overflow-hidden mx-auto p-4 lg:p-0">
                    {document.dataUrl ? (
                        <iframe src={document.dataUrl} className="w-full h-full" title="Aperçu du document" />
                    ): (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                            Aperçu non disponible
                        </div>
                    )}
                </div>
            )}
            
            {isLoading && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4 text-sm font-medium">Analyse par l'IA en cours...</p>
                </div>
            )}

            <div className="flex-1 px-4 lg:px-0 flex flex-col">
                <Tabs defaultValue="data" className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="data" className="gap-1"><FileJson2 className="h-4 w-4" />Données</TabsTrigger>
                        <TabsTrigger value="comments" className="gap-1">
                            <MessageSquare className="h-4 w-4" />
                            Commentaires {document.comments.length > 0 && <span className="text-xs bg-primary text-primary-foreground h-4 w-4 flex items-center justify-center rounded-full">{document.comments.length}</span>}
                        </TabsTrigger>
                        <TabsTrigger value="history" className="gap-1"><ListOrdered className="h-4 w-4" />Historique</TabsTrigger>
                    </TabsList>
                    <TabsContent value="data" className="flex-1 mt-4">
                        <ScrollArea className="h-[calc(100vh-450px)] lg:h-auto">
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
                                <ExtractedData formData={formData} setFormData={setFormData} isReadOnly={isReadOnly} />
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
                         </ScrollArea>
                    </TabsContent>
                    <TabsContent value="comments" className="flex-1 mt-0">
                         <CommentsSection comments={document.comments} onAddComment={onAddComment} />
                    </TabsContent>
                    <TabsContent value="history" className="flex-1 mt-4">
                        <ScrollArea className="h-[calc(100vh-450px)] lg:h-auto pr-4">
                           <AuditTrail trail={document.auditTrail} />
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </div>
          
        </CardContent>
        <CardFooter className="flex justify-end gap-2 p-4 lg:p-6 border-t">
          {document.status === 'reviewing' && (
            <>
              <Button variant="ghost" type="button" onClick={handleDiscard}><RotateCcw className="h-4 w-4 mr-2" />Annuler</Button>
              <Button type="submit"><Check className="h-4 w-4 mr-2" />Approuver</Button>
            </>
          )}
          {document.status === 'approved' && (
            <Button type="button" onClick={() => { onSendToCegid(document); setIsSent(true); }} disabled={isSent}>
              {isSent ? <><Check className="h-4 w-4 mr-2" />Envoyé</> : <><Send className="h-4 w-4 mr-2" />Envoyer à Cegid</>}
            </Button>
          )}
        </CardFooter>
      </form>
    </CardWrapper>
  );
}
