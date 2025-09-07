import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Receipt, Landmark, FileQuestion, Play, Eye, Trash2, FileClock, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Loader2, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import type { Document } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useState, useMemo } from 'react';
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
import { Skeleton } from "./ui/skeleton";

type DocumentGroup = {
    title: string;
    icon: React.ElementType;
    documents: Document[];
};

interface DocumentHistoryProps {
  documentGroups: DocumentGroup[];
  onProcess: (doc: Document) => void;
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


export function DocumentHistory({ documentGroups, onProcess, onDelete, activeDocumentId, setActiveDocument, selectedDocumentIds, setSelectedDocumentIds, isLoading }: DocumentHistoryProps) {

    const handleSelectAll = (checked: boolean | string) => {
        if (checked) {
            const allDocIds = documentGroups.flatMap(g => g.documents.map(d => d.id));
            setSelectedDocumentIds(allDocIds);
        } else {
            setSelectedDocumentIds([]);
        }
    }

    const handleSelectRow = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedDocumentIds(prev => [...prev, id]);
        } else {
            setSelectedDocumentIds(prev => prev.filter(docId => docId !== id));
        }
    }
  
    if (isLoading) {
         return (
            <div className="space-y-4">
                <div className="h-10 w-1/3 bg-muted rounded-md animate-pulse"></div>
                <div className="border rounded-lg">
                    <div className="h-14 bg-muted/50 rounded-t-lg"></div>
                    <div className="p-4 space-y-2">
                        <div className="h-12 bg-muted rounded-md animate-pulse"></div>
                        <div className="h-12 bg-muted rounded-md animate-pulse"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (documentGroups.length === 0) {
        return (
            <Card>
                <CardContent className="h-48 flex flex-col items-center justify-center text-center">
                    <FileClock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Aucun document trouvé</h3>
                    <p className="text-sm text-muted-foreground mt-1">Le client n'a pas encore téléversé de documents, ou aucun document ne correspond à vos filtres.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {documentGroups.map((group) => (
                <Card key={group.title}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <group.icon className="h-6 w-6" /> {group.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px] px-4">
                                        <Checkbox
                                            onCheckedChange={(checked) => {
                                                const docIds = group.documents.map(d => d.id);
                                                if (checked) {
                                                    setSelectedDocumentIds(prev => [...new Set([...prev, ...docIds])]);
                                                } else {
                                                    setSelectedDocumentIds(prev => prev.filter(id => !docIds.includes(id)));
                                                }
                                            }}
                                            checked={group.documents.every(d => selectedDocumentIds.includes(d.id))}
                                            indeterminate={group.documents.some(d => selectedDocumentIds.includes(d.id)) && !group.documents.every(d => selectedDocumentIds.includes(d.id))}
                                            aria-label={`Sélectionner tous les ${group.title}`}
                                        />
                                    </TableHead>
                                    <TableHead>Document</TableHead>
                                    <TableHead className="hidden lg:table-cell">Fournisseur</TableHead>
                                    <TableHead className="hidden md:table-cell text-right">Montant</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right w-[140px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {group.documents.map((doc) => (
                                <TableRow 
                                    key={doc.id} 
                                    data-state={selectedDocumentIds.includes(doc.id) ? "selected" : ""}
                                    className={`cursor-pointer ${activeDocumentId === doc.id ? 'bg-muted/80' : ''}`}
                                    onClick={() => setActiveDocument(doc)}
                                >
                                    <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            onCheckedChange={(checked) => handleSelectRow(doc.id, !!checked)}
                                            checked={selectedDocumentIds.includes(doc.id)}
                                            aria-label={`Sélectionner ${doc.name}`}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium max-w-[150px] md:max-w-xs truncate" title={doc.name}>{doc.name}</div>
                                        <div className="text-xs text-muted-foreground">{new Date(doc.uploadDate).toLocaleDateString('fr-FR')}</div>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-muted-foreground">{doc.extractedData?.vendorNames?.[0] || 'N/A'}</TableCell>
                                     <TableCell className="hidden md:table-cell text-right font-mono text-sm">
                                        {doc.extractedData?.amounts?.[0]?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '-'}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                                    <TableCell className="text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                                    <TooltipProvider>
                                        {(doc.status === 'pending' || doc.status === 'error') && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={() => onProcess(doc)}>
                                                        <Play className="h-4 w-4" />
                                                        <span className="sr-only">Traiter</span>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Traiter le document</p></TooltipContent>
                                            </Tooltip>
                                        )}
                                        {(doc.status === 'reviewing' || doc.status === 'approved' || doc.status === 'processing') && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={() => setActiveDocument(doc)}>
                                                        <Eye className="h-4 w-4" />
                                                        <span className="sr-only">Afficher</span>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Afficher les détails</p></TooltipContent>
                                            </Tooltip>
                                        )}

                                        <AlertDialog>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">Supprimer</span>
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                </TooltipTrigger>
                                                <TooltipContent className="border-destructive text-destructive"><p>Supprimer le document</p></TooltipContent>
                                            </Tooltip>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Cette action est irréversible. Le document "{doc.name}" sera définitivement supprimé.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDelete(doc.id)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        </TooltipProvider>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
