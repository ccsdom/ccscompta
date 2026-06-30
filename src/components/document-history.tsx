import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, Eye, Trash2, FileClock, Loader2, FileText, CheckCircle2, FileWarning, MessageSquare } from "lucide-react";
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
      return (
        <Badge variant="outline" className="flex items-center gap-1.5 bg-amber-500/5 text-amber-500 border-amber-500/20 font-semibold px-2 rounded-xl">
          <FileClock className="h-3 w-3"/>
          En attente
        </Badge>
      );
    case 'processing':
      return (
        <Badge variant="secondary" className="flex items-center gap-1.5 bg-primary/5 text-primary border-primary/20 font-semibold px-2 rounded-xl">
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          En traitement...
        </Badge>
      );
    case 'reviewing':
      return (
        <Badge className="bg-yellow-500/5 hover:bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 flex items-center gap-1.5 font-semibold px-2 rounded-xl">
          <FileWarning className="h-3 w-3"/>
          En examen
        </Badge>
      );
    case 'approved':
      return (
        <Badge className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20 flex items-center gap-1.5 font-semibold px-2 rounded-xl">
          <CheckCircle2 className="h-3 w-3"/>
          Approuvé
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="destructive" className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/25 font-semibold px-2 rounded-xl shadow-inner">
          Erreur
        </Badge>
      );
    case 'duplicate':
      return (
        <Badge variant="secondary" className="bg-slate-500/10 text-slate-500 border-slate-500/20 font-semibold px-2 rounded-xl">
          Doublon
        </Badge>
      );
    default:
      return <Badge variant="outline" className="rounded-xl px-2">Inconnu</Badge>;
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
        documentDate ? { label: 'Date pièce', value: documentDate } : null,
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
            <div className="space-y-4 p-4">
                <Skeleton className="h-10 w-full rounded-xl opacity-50" />
                <Skeleton className="h-10 w-full rounded-xl opacity-50" />
                <Skeleton className="h-10 w-full rounded-xl opacity-50" />
            </div>
        )
    }

    if (!documents || documents.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border rounded-3xl border-dashed border-border/40 min-h-[220px]">
                <FileClock className="mx-auto h-12 w-12 text-muted-foreground/35 mb-4" />
                <h3 className="text-base font-bold font-display">Aucun document</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-[240px] font-semibold">Aucun document n'a été trouvé avec vos critères ou filtres actifs.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Desktop Table View */}
            <div className="hidden md:block">
                <Table>
                    <TableHeader className="bg-white/[0.01]">
                        <TableRow className="border-b-border/20 hover:bg-transparent">
                            <TableHead className="font-bold text-foreground/80 h-12 pl-4 text-xs uppercase tracking-wider">Document</TableHead>
                            <TableHead className="font-bold text-foreground/80 h-12 text-xs uppercase tracking-wider">Date de téléversement</TableHead>
                            <TableHead className="font-bold text-foreground/80 h-12 text-xs uppercase tracking-wider">Statut</TableHead>
                            <TableHead className="text-right font-bold text-foreground/80 h-12 pr-4 text-xs uppercase tracking-wider">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {documents.map((doc) => (
                        <TableRow 
                            key={doc.id} 
                            data-state={selectedDocumentIds.includes(doc.id) ? "selected" : ""}
                            className={cn(
                                "cursor-pointer transition-all duration-300 hover:bg-muted/30 border-b-border/10 group relative",
                                activeDocumentId === doc.id && "bg-primary/[0.04] hover:bg-primary/[0.06]"
                            )}
                            onClick={() => setActiveDocument(doc)}
                        >
                            {/* Hover highlight bar indicator */}
                            <TableCell className="font-semibold py-4 pl-4 relative">
                                <div className={cn(
                                    "absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-lg transition-transform scale-y-0 origin-center duration-300",
                                    activeDocumentId === doc.id ? "scale-y-100" : "group-hover:scale-y-50"
                                )} />
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2.5 rounded-xl border transition-colors duration-300",
                                        activeDocumentId === doc.id 
                                            ? "bg-primary/20 border-primary/30" 
                                            : "bg-muted/40 border-border/20 group-hover:bg-primary/10 group-hover:border-primary/20"
                                    )}>
                                        <FileText className={cn("h-5 w-5", activeDocumentId === doc.id ? "text-primary" : "text-muted-foreground/80 group-hover:text-primary")}/>
                                    </div>
                                    <span className="truncate max-w-xs font-bold text-sm tracking-tight text-foreground/95" title={doc.name}>{doc.name}</span>
                                </div>
                            </TableCell>
                            <TableCell className="py-4 text-xs font-semibold text-muted-foreground">{formatDate(doc.uploadDate)}</TableCell>
                            <TableCell className="py-4">{getStatusBadge(doc.status)}</TableCell>
                            <TableCell className="text-right space-x-2 py-4 pr-4" onClick={(e) => e.stopPropagation()}>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground opacity-0 group-hover:opacity-100" 
                                    onClick={() => setActiveDocument(doc)}
                                >
                                    <Eye className="h-4.5 w-4.5"/>
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-9 w-9 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-all text-muted-foreground opacity-0 group-hover:opacity-100" 
                                            disabled={doc.status === 'approved'}
                                        >
                                            <Trash2 className="h-4.5 w-4.5"/>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="glass-panel w-[90vw] md:w-full max-w-md rounded-3xl border-white/15 dark:border-white/5 backdrop-blur-2xl">
                                        <AlertDialogHeader>
                                            <div className="h-12 w-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mb-4">
                                                <Trash2 className="h-6 w-6" />
                                            </div>
                                            <AlertDialogTitle className="font-display font-bold text-lg">Supprimer ce document ?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                                                Cette action est définitive et irréversible. Le document <strong className="text-foreground">"{doc.name}"</strong> sera supprimé de votre espace GED.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="mt-6 flex-col sm:flex-row gap-2">
                                            <AlertDialogCancel className="border-border/40 mt-0 h-10 rounded-xl font-bold text-xs">Annuler</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => onDelete(doc.id)} className="bg-rose-500 hover:bg-rose-600 text-white premium-shadow h-10 rounded-xl font-bold text-xs border-none">
                                                Supprimer
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
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
                        <h4 className="px-2 pb-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 font-space">{month}</h4>
                        <div className="space-y-3">
                            {monthlyGroups[month].map(doc => {
                                const facts = getDocumentFacts(doc);
                                const isActive = activeDocumentId === doc.id;

                                return (
                                    <Card
                                        key={doc.id}
                                        onClick={() => setActiveDocument(doc)}
                                        className={cn(
                                            "overflow-hidden rounded-2xl border-white/10 dark:border-white/5 bg-background/40 transition-all duration-300 active:scale-[0.99] border",
                                            isActive && "border-primary/40 bg-primary/[0.03] ring-1 ring-primary/20"
                                        )}
                                    >
                                        <CardHeader className="p-4 pb-2">
                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    "mt-0.5 shrink-0 rounded-xl border p-2",
                                                    isActive ? "bg-primary/20 border-primary/30 text-primary" : "bg-muted/60 border-border/10 text-muted-foreground"
                                                )}>
                                                    <FileText className="h-4.5 w-4.5"/>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <CardTitle className="truncate text-sm font-bold tracking-tight text-foreground/95" title={doc.name}>{doc.name}</CardTitle>
                                                    <CardDescription className="mt-0.5 text-[10px] text-muted-foreground font-semibold">{formatDate(doc.uploadDate)}</CardDescription>
                                                </div>
                                                <div className="shrink-0">{getStatusBadge(doc.status)}</div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="px-4 pb-3 pt-2">
                                            {facts.length > 0 ? (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {facts.map((fact) => (
                                                        <div key={fact.label} className="min-w-0 rounded-xl bg-muted/30 border border-border/5 p-2 flex flex-col justify-between">
                                                            <div className="text-[9px] font-bold text-muted-foreground/75 uppercase tracking-wide">{fact.label}</div>
                                                            <div className="truncate text-xs font-bold text-foreground mt-0.5" title={fact.value}>{fact.value}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="rounded-xl bg-muted/20 border border-dashed border-border/40 px-3 py-3 text-xs text-muted-foreground/75 font-semibold text-center leading-relaxed">
                                                    Analyse comptable en cours...
                                                </div>
                                            )}
                                        </CardContent>

                                        <CardFooter className="flex items-center justify-between gap-2 border-t border-border/10 bg-white/[0.01] p-3 px-4">
                                            <span className="truncate text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                                                <MessageSquare className="h-3.5 w-3.5 opacity-60" />
                                                {(doc.comments || []).length} note{(doc.comments || []).length > 1 ? 's' : ''}
                                            </span>
                                            <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 rounded-xl text-xs font-bold px-3 hover:bg-muted"
                                                    onClick={() => setActiveDocument(doc)}
                                                >
                                                    <Eye className="mr-1.5 h-3.5 w-3.5"/>
                                                    Voir
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                                                            disabled={doc.status === 'approved'}
                                                        >
                                                            <Trash2 className="h-4 w-4"/>
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="glass-panel w-[92vw] rounded-3xl border-white/15 dark:border-white/5 backdrop-blur-2xl">
                                                      <AlertDialogHeader>
                                                          <div className="h-12 w-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mb-4">
                                                              <Trash2 className="h-6 w-6" />
                                                          </div>
                                                          <AlertDialogTitle className="font-display font-bold text-lg">Supprimer ce document ?</AlertDialogTitle>
                                                          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                                                              Cette action est définitive et irréversible. Le document <strong className="text-foreground">"{doc.name}"</strong> sera supprimé définitivement.
                                                          </AlertDialogDescription>
                                                      </AlertDialogHeader>
                                                      <AlertDialogFooter className="flex-col gap-2 sm:flex-row mt-6">
                                                          <AlertDialogCancel className="mt-0 border-border/40 h-10 rounded-xl font-bold text-xs">Annuler</AlertDialogCancel>
                                                          <AlertDialogAction onClick={() => onDelete(doc.id)} className="bg-rose-500 hover:bg-rose-600 text-white premium-shadow h-10 rounded-xl font-bold text-xs border-none">Supprimer</AlertDialogAction>
                                                      </AlertDialogFooter>
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
