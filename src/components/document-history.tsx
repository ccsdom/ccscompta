

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
import { format } from "date-fns";
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
        const monthKey = format(new Date(doc.uploadDate), 'LLLL yyyy', { locale: fr });
        if (!acc[monthKey]) {
            acc[monthKey] = [];
        }
        acc[monthKey].push(doc);
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
                        <TableRow>
                            <TableHead>Document</TableHead>
                            <TableHead>Date de téléversement</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {documents.map((doc) => (
                        <TableRow 
                            key={doc.id} 
                            data-state={selectedDocumentIds.includes(doc.id) ? "selected" : ""}
                            className="cursor-pointer"
                            onClick={() => setActiveDocument(doc)}
                        >
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                    <div className="bg-muted p-2 rounded-md">
                                        <FileText className="h-5 w-5 text-muted-foreground"/>
                                    </div>
                                    <span className="truncate max-w-xs" title={doc.name}>{doc.name}</span>
                                </div>
                            </TableCell>
                            <TableCell>{new Date(doc.uploadDate).toLocaleDateString('fr-FR')}</TableCell>
                            <TableCell>{getStatusBadge(doc.status)}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="outline" size="icon" onClick={() => setActiveDocument(doc)}><Eye className="h-4 w-4"/></Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="icon" disabled={doc.status === 'approved'}><Trash2 className="h-4 w-4"/></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Êtes-vous certain ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible. Le document "{doc.name}" sera supprimé.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(doc.id)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction></AlertDialogFooter>
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
                    <div key={month}>
                        <h4 className="text-sm font-semibold p-1 capitalize mb-2">{month}</h4>
                        <div className="space-y-4">
                            {monthlyGroups[month].map(doc => (
                                <Card key={doc.id} onClick={() => setActiveDocument(doc)} className="cursor-pointer active:border-primary">
                                    <CardHeader className="p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="font-medium truncate" title={doc.name}>{doc.name}</div>
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 -mt-1 -mr-1 shrink-0" disabled={doc.status === 'approved'}><Trash2 className="h-4 w-4 text-muted-foreground"/></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                  <AlertDialogHeader><AlertDialogTitle>Êtes-vous certain ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible. Le document "{doc.name}" sera supprimé.</AlertDialogDescription></AlertDialogHeader>
                                                  <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(doc.id)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                        <CardDescription>{new Date(doc.uploadDate).toLocaleDateString('fr-FR')}</CardDescription>
                                    </CardHeader>
                                    <CardFooter className="p-4 flex justify-between items-center">
                                        {getStatusBadge(doc.status)}
                                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setActiveDocument(doc); }}><Eye className="h-4 w-4 mr-2"/>Voir</Button>
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
