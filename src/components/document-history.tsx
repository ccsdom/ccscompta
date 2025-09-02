import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Receipt, Landmark, FileQuestion, Play, MoreHorizontal } from "lucide-react";
import type { Document } from "@/app/page";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DocumentHistoryProps {
  documents: Document[];
  onProcess: (doc: Document) => void;
  activeDocumentId?: string | null;
  setActiveDocument: (doc: Document) => void;
}

const getStatusBadge = (status: Document['status']) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline">Pending</Badge>;
    case 'processing':
      return <Badge variant="secondary">Processing</Badge>;
    case 'reviewing':
      return <Badge variant="default">Review</Badge>;
    case 'approved':
      return <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">Approved</Badge>;
    case 'error':
      return <Badge variant="destructive">Error</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
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
    <Card>
      <CardHeader>
        <CardTitle>Document History</CardTitle>
        <CardDescription>An audit trail of all uploaded documents.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px] p-2 text-center">Type</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead className="hidden md:table-cell">Upload Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <TableRow 
                    key={doc.id} 
                    className={`cursor-pointer ${activeDocumentId === doc.id ? 'bg-primary/5' : ''}`}
                    onClick={() => setActiveDocument(doc)}
                  >
                    <TableCell className="p-2 text-center">{getDocIcon(doc.type)}</TableCell>
                    <TableCell className="font-medium max-w-[150px] md:max-w-xs truncate" title={doc.name}>{doc.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{doc.uploadDate}</TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell className="text-right">
                      {(doc.status === 'pending' || doc.status === 'error') && (
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onProcess(doc); }}>
                          <Play className="h-4 w-4" />
                          <span className="sr-only">Process</span>
                        </Button>
                      )}
                      {(doc.status === 'reviewing' || doc.status === 'approved') && (
                        <Button variant="ghost" size="icon" onClick={() => setActiveDocument(doc)}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No documents uploaded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
