

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
    default:
      return <Badge variant="outline">Inconnu</Badge>;
  }
};

const groupDocumentsByMonth = (documents: Document[]) => {
    return documents.reduce((acc, doc) => {
        const date = new Date(doc.uploadDate);
        if (isValid(date)) {
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
    const sortedMonths = Object.keys(monthlyGroups).sort((a,b) => new Date(monthlyGroups[b][0].uploadDate).getTime() - new Date(monthlyGroups[a][0].uploadDate).getTime());

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
                            className="cursor-pointer transition-colors duration-300 hover:bg-primary/5 data-[state=selected]:bg-primary/10 border-b-border/20 group"
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
                            <TableCell className="py-4 text-muted-foreground">{new Date(doc.uploadDate).toLocaleDateString('fr-FR')}</TableCell>
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
            <div className="space-y-6 md:hidden">
                {sortedMonths.map(month => (
                    <div key={month} className="animate-in slide-in-from-bottom-4 fade-in duration-500">
                        <h4 className="text-sm font-bold text-muted-foreground px-2 capitalize mb-3">{month}</h4>
                        <div className="space-y-4">
                            {monthlyGroups[month].map(doc => (
                                <Card key={doc.id} onClick={() => setActiveDocument(doc)} className="cursor-pointer active:scale-[0.98] glass-panel border-border/40 hover:border-primary/40 transition-all duration-300 premium-shadow-sm group overflow-hidden relative">
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <CardHeader className="p-4 pb-2">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="bg-primary/10 p-2 rounded-lg border border-primary/20 group-hover:bg-primary/20 transition-colors shrink-0">
                                                    <FileText className="h-4 w-4 text-primary"/>
                                                </div>
                                                <div className="font-semibold truncate" title={doc.name}>{doc.name}</div>
                                            </div>
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1 shrink-0 hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground" disabled={doc.status === 'approved'}><Trash2 className="h-4 w-4"/></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="glass-panel w-[90vw] rounded-2xl">
                                                  <AlertDialogHeader><AlertDialogTitle className="font-display">Supprimer ce document ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible. Le document "{doc.name}" sera supprimé définitivement.</AlertDialogDescription></AlertDialogHeader>
                                                  <AlertDialogFooter className="flex-col sm:flex-row gap-2"><AlertDialogCancel className="border-border/50 mt-0">Annuler</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(doc.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 premium-shadow-sm">Supprimer</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                        <CardDescription className="ml-11 text-xs opacity-80">{new Date(doc.uploadDate).toLocaleDateString('fr-FR')}</CardDescription>
                                    </CardHeader>
                                    <CardFooter className="p-4 pt-3 flex justify-between items-center bg-muted/5">
                                        {getStatusBadge(doc.status)}
                                        <Button size="sm" variant="ghost" className="hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground font-medium" onClick={(e) => { e.stopPropagation(); setActiveDocument(doc); }}><Eye className="h-4 w-4 mr-2"/>Consulter</Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
