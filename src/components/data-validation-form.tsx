'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check, Send, RotateCcw, Info, Loader2, ListOrdered, User, Clock, CheckCircle, ShieldAlert } from 'lucide-react';
import { type Document, type AuditEvent } from "@/app/dashboard/documents/page";
import { type ExtractDataOutput } from '@/ai/flows/extract-data-from-documents';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface DataValidationFormProps {
  document: Document | null;
  onUpdate: (updatedData: ExtractDataOutput) => void;
  onSendToCegid: (doc: Document) => void;
  isLoading: boolean;
  isSheet?: boolean;
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
  if (!trail || trail.length === 0) return null;

  return (
    <div>
      <Label className="flex items-center gap-2 mb-2">
        <ListOrdered className="h-4 w-4" />
        Historique du document
      </Label>
      <div className="space-y-3">
        {trail.slice().reverse().map((event, index) => (
          <div key={index} className="flex items-start gap-3 text-sm">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted mt-1">
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
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(event.date), "PPP à HH:mm", { locale: fr })}</span>
                            </TooltipTrigger>
                            <TooltipContent><p>Date et heure</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


export function DataValidationForm({ document, onUpdate, onSendToCegid, isLoading, isSheet = false }: DataValidationFormProps) {
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

  const isReadOnly = document?.status === 'approved' || isLoading || document?.status === 'processing';

  const CardWrapper = ({ children }: { children: React.ReactNode }) => (
    <Card className={`flex-1 rounded-none border-0 lg:rounded-lg lg:border h-full flex flex-col ${isSheet ? '' : 'mt-[-24px]'}`}>
        {children}
    </Card>
  );

  if (!document) {
    // This case is now handled on the parent page
    return null;
  }

  const hasAnomalies = formData.anomalies && formData.anomalies.length > 0;

  return (
    <CardWrapper>
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        <CardHeader className="p-4 lg:p-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-xl">Validation des Données</CardTitle>
              <CardDescription className="truncate max-w-[250px] md:max-w-sm" title={document.name}>
                Examen de : {document.name}
              </CardDescription>
            </div>
            {document.type && <Badge variant={document.confidence && document.confidence > 0.8 ? "default" : "secondary"}>{document.type} ({(document.confidence ?? 0).toFixed(0)}%)</Badge>}
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

          <ScrollArea className="flex-1 px-4 lg:px-0">
            <div className="space-y-6">
                {isLoading && (
                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-4 text-sm font-medium">Analyse par l'IA en cours...</p>
                    </div>
                )}
                {document.status === 'error' && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-center gap-4 text-destructive">
                    <AlertCircle className="h-6 w-6" />
                    <div>
                        <h3 className="font-semibold">Erreur de traitement</h3>
                        <p className="text-sm">Impossible d'extraire les données. Essayez de retraiter ou utilisez un autre fichier.</p>
                    </div>
                    </div>
                )}
                {document.status === 'pending' && !isLoading && (
                    <div className="rounded-lg border border-primary/50 bg-primary/10 p-4 flex items-center gap-4 text-primary-foreground">
                    <Info className="h-6 w-6 text-primary" />
                    <div>
                        <h3 className="font-semibold text-primary">Document en attente</h3>
                        <p className="text-sm text-primary/80">Cliquez sur "Traiter" pour lancer l'extraction des données par l'IA.</p>
                    </div>
                    </div>
                )}

                {hasAnomalies && (
                  <Alert variant="destructive">
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


                {(document.extractedData && !isLoading) ? (
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
                ) : (
                    !isLoading && document.status !== 'error' && document.status !== 'pending' && <p className="text-sm text-muted-foreground text-center py-10">Traitez ce document pour extraire ses données.</p>
                )}
                 <AuditTrail trail={document.auditTrail} />
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 p-4 lg:p-6 border-t">
          {document.status === 'reviewing' && (
            <>
              <Button variant="ghost" type="button" onClick={handleDiscard}><RotateCcw />Annuler</Button>
              <Button type="submit"><Check />Approuver</Button>
            </>
          )}
          {document.status === 'approved' && (
            <Button type="button" onClick={() => { onSendToCegid(document); setIsSent(true); }} disabled={isSent}>
              {isSent ? <><Check />Envoyé</> : <><Send />Envoyer à Cegid</>}
            </Button>
          )}
        </CardFooter>
      </form>
    </CardWrapper>
  );
}
