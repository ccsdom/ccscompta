

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, Eye, Trash2, FileClock, Loader2, FileText } from "lucide-react";
import type { Document } from "@/lib/types";
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, isValid } from "date-fns";
import { fr } from 'date-fns/locale';
import { Skeleton } from "./ui/skeleton";
import { cn, parseDate, formatDate } from "@/lib/utils";

interface DocumentHistoryProps {
  documents: Document[];
  onProcess: (docId: string) => void;
  onDelete: (docId: string) => void;
  activeDocumentId?: string | null;
  setActiveDocument: (doc: Document) => void;
  selectedDocumentIds: string[];
  setSelectedDocumentIds: React.Dispatch<React.SetStateAction<string[]>>;
  isLoading: boolean;
}

const getStatusBadge = (status: Document['status']) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline">En attente</Badge>;
    case 'processing':
        return (
            <Badge variant="secondary" className="flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                En traitement...
            </Badge>
        );
    case 'reviewing':
      return <Badge>Prêt pour examen</Badge>;
    case 'approved':
      return <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100/80">Approuvé</Badge>;
    case 'error':
      return <Badge variant="destructive">Erreur</Badge>;
    case 'duplicate':
      return <Badge variant="secondary">Doublon</Badge>;
    default:
      return <Badge variant="outline">Inconnu</Badge>;
  }
};

const formatAmount = (amount?: number | null) => {
    if (typeof amount !== 'number') return null;
    return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
};

const getDocumentFacts = (doc: Document) => {
    const vendor = doc.extractedData?.vendorNames?.filter(Boolean).join(', ');
    const amount = formatAmount(doc.extractedData?.amounts?.[0]);
    const documentDate = doc.extractedData?.dates?.[0] ? formatDate(doc.extractedData.dates[0]) : null;

    return [
        doc.type ? { label: 'Type', value: doc.type } : null,
        vendor ? { label: 'Fournisseur', value: vendor } : null,
        amount ? { label: 'Montant', value: amount } : null,
        documentDate ? { label: 'Date piece', value: documentDate } : null,
    ].filter(Boolean) as { label: string; value: string }[];
};

const groupDocumentsByMonth = (documents: Document[]) => {
    return documents.reduce((acc, doc) => {
        const date = parseDate(doc.uploadDate);
        if (date && isValid(date)) {
            const monthKey = format(date, 'LLLL yyyy', { locale: fr });
            if (!acc[monthKey]) {
                acc[monthKey] = [];
            }
            acc[monthKey].push(doc);
        }
        return acc;
    }, {} as Record<string, Document[]>);
}

export function DocumentHistory({ documents, onProcess, onDelete, activeDocumentId, setActiveDocument, selectedDocumentIds, setSelectedDocumentIds, isLoading }: DocumentHistoryProps) {

    const monthlyGroups = groupDocumentsByMonth(documents || []);
    const sortedMonths = Object.keys(monthlyGroups).sort((a,b) => {
        const dateB = parseDate(monthlyGroups[b][0].uploadDate);
        const dateA = parseDate(monthlyGroups[a][0].uploadDate);
        return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        )
    }

    if (!documents || documents.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 border rounded-lg border-dashed">
                <FileClock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Aucun document ici</h3>
                <p className="text-sm text-muted-foreground mt-1">Pas de documents de ce type ou correspondant à vos filtres.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Desktop Table View */}
            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b-border/40 hover:bg-transparent">
                            <TableHead className="font-semibold text-foreground/80 h-12">Document</TableHead>
                            <TableHead className="font-semibold text-foreground/80 h-12">Date de téléversement</TableHead>
                            <TableHead className="font-semibold text-foreground/80 h-12">Statut</TableHead>
                            <TableHead className="text-right font-semibold text-foreground/80 h-12">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {documents.map((doc) => (
                        <TableRow 
                            key={doc.id} 
                            data-state={selectedDocumentIds.includes(doc.id) ? "selected" : ""}
                            className={cn(
                                "cursor-pointer transition-colors duration-300 hover:bg-primary/5 data-[state=selected]:bg-primary/10 border-b-border/20 group",
                                activeDocumentId === doc.id && "bg-primary/10"
                            )}
                            onClick={() => setActiveDocument(doc)}
                        >
                            <TableCell className="font-medium py-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 group-hover:bg-primary/20 transition-colors duration-300">
                                        <FileText className="h-5 w-5 text-primary"/>
                                    </div>
                                    <span className="truncate max-w-xs font-semibold" title={doc.name}>{doc.name}</span>
                                </div>
                            </TableCell>
                            <TableCell className="py-4 text-muted-foreground">{formatDate(doc.uploadDate)}</TableCell>
                            <TableCell className="py-4">{getStatusBadge(doc.status)}</TableCell>
                            <TableCell className="text-right space-x-2 py-4">
                                <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); setActiveDocument(doc); }}><Eye className="h-4 w-4"/></Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground" disabled={doc.status === 'approved'} onClick={(e) => e.stopPropagation()}><Trash2 className="h-4 w-4"/></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="glass-panel">
                                        <AlertDialogHeader><AlertDialogTitle className="font-display">Supprimer ce document ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible. Le document "{doc.name}" sera supprimé définitivement.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel className="border-border/50">Annuler</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(doc.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 premium-shadow-sm">Supprimer</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            
            {/* Mobile Card List View */}
            <div className="space-y-5 md:hidden">
                {sortedMonths.map(month => (
                    <section key={month} className="animate-in slide-in-from-bottom-4 fade-in duration-500">
                        <h4 className="px-1 pb-2 text-xs font-semibold uppercase text-muted-foreground">{month}</h4>
                        <div className="space-y-3">
                            {monthlyGroups[month].map(doc => {
                                const facts = getDocumentFacts(doc);
                                const isActive = activeDocumentId === doc.id;

                                return (
                                    <Card
                                        key={doc.id}
                                        onClick={() => setActiveDocument(doc)}
                                        className={cn(
                                            "cursor-pointer overflow-hidden rounded-lg border-border/60 bg-background/70 transition-colors active:bg-primary/5",
                                            isActive && "border-primary/60 bg-primary/5"
                                        )}
                                    >
                                        <CardHeader className="p-3 pb-2">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 shrink-0 rounded-md border border-primary/20 bg-primary/10 p-2">
                                                    <FileText className="h-4 w-4 text-primary"/>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <CardTitle className="truncate text-sm font-semibold" title={doc.name}>{doc.name}</CardTitle>
                                                    <CardDescription className="mt-1 text-xs">{formatDate(doc.uploadDate)}</CardDescription>
                                                </div>
                                                <div className="shrink-0">{getStatusBadge(doc.status)}</div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="px-3 pb-3 pt-1">
                                            {facts.length > 0 ? (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {facts.map((fact) => (
                                                        <div key={fact.label} className="min-w-0 rounded-md bg-muted/40 p-2">
                                                            <div className="text-[11px] font-medium text-muted-foreground">{fact.label}</div>
                                                            <div className="truncate text-xs font-semibold text-foreground" title={fact.value}>{fact.value}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                                                    Analyse comptable en attente.
                                                </div>
                                            )}
                                        </CardContent>

                                        <CardFooter className="flex items-center justify-between gap-2 border-t bg-muted/20 p-3">
                                            <span className="truncate text-xs text-muted-foreground">
                                                {(doc.comments || []).length} commentaire{(doc.comments || []).length > 1 ? 's' : ''}
                                            </span>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8"
                                                    onClick={(e) => { e.stopPropagation(); setActiveDocument(doc); }}
                                                >
                                                    <Eye className="mr-1.5 h-4 w-4"/>
                                                    Voir
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                            disabled={doc.status === 'approved'}
                                                            onClick={(e) => e.stopPropagation()}
                                                            aria-label="Supprimer le document"
                                                        >
                                                            <Trash2 className="h-4 w-4"/>
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="glass-panel w-[92vw] rounded-lg">
                                                      <AlertDialogHeader><AlertDialogTitle className="font-display">Supprimer ce document ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible. Le document "{doc.name}" sera supprimé définitivement.</AlertDialogDescription></AlertDialogHeader>
                                                      <AlertDialogFooter className="flex-col gap-2 sm:flex-row"><AlertDialogCancel className="mt-0 border-border/50">Annuler</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(doc.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 premium-shadow-sm">Supprimer</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
