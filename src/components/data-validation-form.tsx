'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Check, Send, RotateCcw, FileUp, Info } from 'lucide-react';
import { type Document } from "@/app/dashboard/page";
import { type ExtractDataOutput } from '@/ai/flows/extract-data-from-documents';
import { useToast } from '@/hooks/use-toast';

interface DataValidationFormProps {
  document: Document | null;
  onUpdate: (updatedData: ExtractDataOutput) => void;
  onSendToCegid: (doc: Document) => void;
  isLoading: boolean;
}

const initialFormState: ExtractDataOutput = {
  dates: [],
  amounts: [],
  vendorNames: [],
  otherInformation: '',
};

export function DataValidationForm({ document, onUpdate, onSendToCegid, isLoading }: DataValidationFormProps) {
  const [formData, setFormData] = useState<ExtractDataOutput>(initialFormState);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (document?.extractedData) {
      setFormData(document.extractedData);
    } else {
      setFormData(initialFormState);
    }
    setIsSent(document?.status === 'approved' && isSent); // Persist sent state only if approved
  }, [document]);

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
    onUpdate(formData);
  }

  const isReadOnly = document?.status === 'approved' || isLoading;

  if (isLoading) {
    return (
      <Card className="flex-1">
        <CardHeader>
          <Skeleton className="h-7 w-3/5" />
          <Skeleton className="h-5 w-4/5 mt-1" />
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="space-y-2"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-20 w-full" /></div>
        </CardContent>
      </Card>
    );
  }

  if (!document) {
    return (
      <Card className="flex-1">
        <CardContent className="h-full flex flex-col items-center justify-center text-center p-8">
          <FileUp className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Aucun document sélectionné</h3>
          <p className="text-sm text-muted-foreground mt-1">Sélectionnez un document dans la liste ou téléversez-en un nouveau.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex-1">
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-xl">Validation des Données</CardTitle>
              <CardDescription className="truncate max-w-[250px] md:max-w-sm" title={document.name}>
                Examen de : {document.name}
              </CardDescription>
            </div>
            {document.type && <Badge variant={document.confidence && document.confidence > 0.8 ? "default" : "secondary"}>{document.type} ({(document.confidence ?? 0) * 100}%)</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 flex-1">
          {document.status === 'error' && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-center gap-4 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Erreur de traitement</h3>
                <p className="text-sm">Impossible d'extraire les données. Essayez de retraiter ou utilisez un autre fichier.</p>
              </div>
            </div>
          )}
           {document.status === 'pending' && (
            <div className="rounded-lg border border-primary/50 bg-primary/10 p-4 flex items-center gap-4 text-primary-foreground">
              <Info className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-semibold text-primary">Document en attente</h3>
                <p className="text-sm text-primary/80">Cliquez sur "Traiter" pour lancer l'extraction des données par l'IA.</p>
              </div>
            </div>
          )}
          {document.extractedData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Noms des vendeurs</Label>
                  {formData.vendorNames.map((vendor, index) => <Input key={index} value={vendor} onChange={e => handleArrayInputChange('vendorNames', index, e.target.value)} readOnly={isReadOnly} />)}
                </div>
                <div className="space-y-2">
                  <Label>Dates</Label>
                  {formData.dates.map((date, index) => <Input key={index} value={date} onChange={e => handleArrayInputChange('dates', index, e.target.value)} readOnly={isReadOnly} />)}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Montants</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {formData.amounts.map((amount, index) => <Input type="number" key={index} value={amount} onChange={e => handleAmountsChange(index, e.target.value)} readOnly={isReadOnly} />)}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Autres informations</Label>
                <Textarea value={formData.otherInformation} onChange={handleOtherInfoChange} readOnly={isReadOnly} rows={4} />
              </div>
            </div>
          ) : (
             document.status !== 'error' && document.status !== 'pending' && <p className="text-sm text-muted-foreground text-center py-10">Traitez ce document pour extraire ses données.</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
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
    </Card>
  );
}
