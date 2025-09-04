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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "./ui/skeleton";


interface DocumentHistoryProps {
  documents: Document[];
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

const getDocIcon = (type?: string) => {
    const docType = type?.toLowerCase() ?? '';
    const className = "h-5 w-5 text-muted-foreground";

    let icon: React.ReactNode;
    let tooltipContent: string;

    if (docType.includes('purchase invoice')) {
        icon = <ArrowDownToLine className={className} />;
        tooltipContent = "Facture d'achat";
    } else if (docType.includes('sales invoice')) {
        icon = <ArrowUpFromLine className={className} />;
        tooltipContent = "Facture de vente";
    } else if (docType.includes('receipt')) {
        icon = <Receipt className={className} />;
        tooltipContent = 'Reçu';
    } else if (docType.includes('bank statement')) {
        icon = <Landmark className={className} />;
        tooltipContent = 'Relevé bancaire';
    } else {
        icon = <FileQuestion className={className} />;
        tooltipContent = 'Type de document inconnu';
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex justify-center items-center h-full">{icon}</div>
            </TooltipTrigger>
            <TooltipContent side="right"><p>{tooltipContent}</p></TooltipContent>
        </Tooltip>
    );
}

export function DocumentHistory({ documents, onProcess, onDelete, activeDocumentId, setActiveDocument, selectedDocumentIds, setSelectedDocumentIds, isLoading }: DocumentHistoryProps) {
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const paginatedDocuments = useMemo(() => {
        const start = pageIndex * pageSize;
        const end = start + pageSize;
        return documents.slice(start, end);
    }, [documents, pageIndex, pageSize]);

    const pageCount = Math.ceil(documents.length / pageSize);

    const handleSelectAll = (checked: boolean | string) => {
        if (checked) {
            setSelectedDocumentIds(documents.map(d => d.id));
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
  
    return (
        <Card className="flex-1 flex flex-col">
            <CardHeader>
                <CardTitle>Historique des documents</CardTitle>
                <CardDescription>Consultez et gérez les documents téléversés par le client.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col justify-between">
                <ScrollArea className="h-full max-h-[calc(100vh-400px)]">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                            <TableHead className="w-[40px] px-4">
                                <Checkbox
                                    onCheckedChange={handleSelectAll}
                                    checked={documents.length > 0 && selectedDocumentIds.length === documents.length}
                                    indeterminate={selectedDocumentIds.length > 0 && selectedDocumentIds.length < documents.length}
                                    aria-label="Tout sélectionner"
                                />
                            </TableHead>
                            <TableHead className="w-[50px] p-2 text-center">Type</TableHead>
                            <TableHead>Nom du fichier</TableHead>
                            <TableHead className="hidden md:table-cell">Date</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right w-[140px]">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {isLoading ? (
                             Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell className="px-4"><Skeleton className="h-4 w-4" /></TableCell>
                                    <TableCell className="p-2 text-center"><Skeleton className="h-5 w-5 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                                    <TableCell className="text-right space-x-1"><Skeleton className="h-8 w-20 inline-block" /></TableCell>
                                </TableRow>
                            ))
                        ) : paginatedDocuments.length > 0 ? (
                            paginatedDocuments.map((doc) => (
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
                                <TableCell className="p-2 text-center">
                                    <TooltipProvider>
                                        {getDocIcon(doc.type)}
                                    </TooltipProvider>
                                </TableCell>
                                <TableCell className="font-medium max-w-[150px] md:max-w-xs truncate" title={doc.name}>{doc.name}</TableCell>
                                <TableCell className="hidden md:table-cell text-muted-foreground">{new Date(doc.uploadDate).toLocaleDateString('fr-FR')}</TableCell>
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
                            ))
                        ) : (
                            <TableRow>
                            <TableCell colSpan={6} className="h-48 text-center">
                                <FileClock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold">Aucun document pour ce client</h3>
                                <p className="text-sm text-muted-foreground mt-1">Le client n'a pas encore téléversé de documents.</p>
                            </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </ScrollArea>
                <div className="flex items-center justify-end space-x-2 md:space-x-6 lg:space-x-8 p-4 border-t">
                    <div className="flex-1 text-sm text-muted-foreground">
                        {selectedDocumentIds.length} sur {documents.length} ligne(s) sélectionnée(s).
                    </div>
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Lignes par page</p>
                        <Select
                        value={`${pageSize}`}
                        onValueChange={(value) => {
                            setPageSize(Number(value))
                            setPageIndex(0)
                        }}
                        >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[10, 20, 30, 40, 50].map((size) => (
                            <SelectItem key={size} value={`${size}`}>
                                {size}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        Page {pageIndex + 1} sur {pageCount}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => setPageIndex(0)}
                            disabled={pageIndex === 0}
                        >
                            <span className="sr-only">Première page</span>
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => setPageIndex(pageIndex - 1)}
                            disabled={pageIndex === 0}
                        >
                            <span className="sr-only">Page précédente</span>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => setPageIndex(pageIndex + 1)}
                             disabled={pageIndex >= pageCount - 1}
                        >
                            <span className="sr-only">Page suivante</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                             onClick={() => setPageIndex(pageCount - 1)}
                             disabled={pageIndex >= pageCount - 1}
                        >
                            <span className="sr-only">Dernière page</span>
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
