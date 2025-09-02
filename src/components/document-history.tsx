import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Receipt, Landmark, FileQuestion, Play, MoreHorizontal, FileClock } from "lucide-react";
import type { Document } from "@/app/dashboard/page";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DocumentHistoryProps {
  documents: Document[];
  onProcess: (doc: Document) => void;
  activeDocumentId?: string | null;
  setActiveDocument: (doc: Document) => void;
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

export function DocumentHistory({ documents, onProcess, activeDocumentId, setActiveDocument }: DocumentHistoryProps) {
  return (
    <Card className="flex-1 flex flex-col">
        <CardHeader>
            <CardTitle>Historique des documents</CardTitle>
            <CardDescription>Consultez et gérez vos documents téléversés.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex-1">
            <ScrollArea className="h-full">
                <Table>
                    <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                        <TableHead className="w-[50px] p-2 text-center"></TableHead>
                        <TableHead>Nom du fichier</TableHead>
                        <TableHead className="hidden md:table-cell">Date</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right w-[100px]">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {documents.length > 0 ? (
                        documents.map((doc) => (
                        <TableRow 
                            key={doc.id} 
                            className={`cursor-pointer ${activeDocumentId === doc.id ? 'bg-secondary' : ''}`}
                            onClick={() => setActiveDocument(doc)}
                        >
                            <TableCell className="p-2 text-center">{getDocIcon(doc.type)}</TableCell>
                            <TableCell className="font-medium max-w-[150px] md:max-w-xs truncate" title={doc.name}>{doc.name}</TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">{doc.uploadDate}</TableCell>
                            <TableCell>{getStatusBadge(doc.status)}</TableCell>
                            <TableCell className="text-right">
                            {(doc.status === 'pending' || doc.status === 'error') && (
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onProcess(doc); }}>
                                <Play className="h-4 w-4 mr-2" />
                                Traiter
                                </Button>
                            )}
                            {(doc.status === 'reviewing' || doc.status === 'approved' || doc.status === 'processing') && (
                                 <Button variant="ghost" size="sm" onClick={() => setActiveDocument(doc)}>
                                    {doc.status === 'processing' ? 'Affichage...' : 'Afficher'}
                                </Button>
                            )}
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={5} className="h-48 text-center">
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
