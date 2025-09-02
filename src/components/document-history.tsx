import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Receipt, Landmark, FileQuestion, Play, MoreHorizontal, FileClock, Eye, Trash2 } from "lucide-react";
import type { Document } from "@/app/dashboard/documents/page";
import { ScrollArea } from "@/components/ui/scroll-area";
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


interface DocumentHistoryProps {
  documents: Document[];
  onProcess: (doc: Document) => void;
  onDelete: (docId: string) => void;
  activeDocumentId?: string | null;
  setActiveDocument: (doc: Document) => void;
  selectedDocumentIds: string[];
  setSelectedDocumentIds: React.Dispatch<React.SetStateAction<string[]>>;
}

const getStatusBadge = (status: Document['status']) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline">En attente</Badge>;
    case 'processing':
        return <Badge variant="secondary">En traitement...</Badge>;
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
    if (docType.includes('invoice')) return <FileText className="h-5 w-5 text-muted-foreground" />;
    if (docType.includes('receipt')) return <Receipt className="h-5 w-5 text-muted-foreground" />;
    if (docType.includes('bank statement')) return <Landmark className="h-5 w-5 text-muted-foreground" />;
    return <FileQuestion className="h-5 w-5 text-muted-foreground" />;
}

export function DocumentHistory({ documents, onProcess, onDelete, activeDocumentId, setActiveDocument, selectedDocumentIds, setSelectedDocumentIds }: DocumentHistoryProps) {
  
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
            <CardDescription>Consultez et gérez vos documents téléversés.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex-1">
            <ScrollArea className="h-full max-h-[calc(100vh-350px)]">
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
                        <TableHead className="w-[50px] p-2 text-center"></TableHead>
                        <TableHead>Nom du fichier</TableHead>
                        <TableHead className="hidden md:table-cell">Date</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right w-[140px]">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {documents.length > 0 ? (
                        documents.map((doc) => (
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
                            <TableCell className="p-2 text-center">{getDocIcon(doc.type)}</TableCell>
                            <TableCell className="font-medium max-w-[150px] md:max-w-xs truncate" title={doc.name}>{doc.name}</TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">{doc.uploadDate}</TableCell>
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
                            <h3 className="text-lg font-semibold">Aucun document pour l'instant</h3>
                            <p className="text-sm text-muted-foreground mt-1">Téléversez votre premier document pour commencer.</p>
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </ScrollArea>
        </CardContent>
    </Card>
  );
}
