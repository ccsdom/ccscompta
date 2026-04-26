'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
    History, 
    Download, 
    Eye, 
    Search,
    Calendar,
    FileText,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReconciliationHistoryPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const reconciliationsQuery = useMemoFirebase(() => {
        return query(collection(db, 'reconciliations'), orderBy('createdAt', 'desc'));
    }, []);

    const { data: reports, isLoading } = useCollection<any>(reconciliationsQuery);

    const filteredReports = reports?.filter(r => 
        r.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.clientId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Historique des Rapprochements</h1>
                    <p className="text-muted-foreground mt-1">Consultez et gérez les rapports de lettrage archivés.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-full max-w-sm" />
                </div>
                <Card>
                    <CardContent className="p-0">
                        <div className="space-y-2 p-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <History className="h-8 w-8 text-primary" />
                        Historique des Rapprochements
                    </h1>
                    <p className="text-muted-foreground mt-1">Archive complète du cabinet comptable.</p>
                </div>
            </div>

            <Card className="border-primary/10 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher un client..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="w-[180px]">Date</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Résumé (IA)</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReports && filteredReports.length > 0 ? (
                                filteredReports.map((report) => (
                                    <TableRow key={report.id} className="hover:bg-muted/20 transition-colors">
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
                                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground ml-5">
                                                    {new Date(report.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                    {report.clientName ? report.clientName[0].toUpperCase() : 'C'}
                                                </div>
                                                <span className="font-semibold">{report.clientName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={report.status === 'completed' ? 'default' : 'outline'} className="gap-1">
                                                {report.status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                                {report.status === 'completed' ? 'Archivé' : report.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[300px]">
                                            <p className="text-sm line-clamp-1 text-muted-foreground">
                                                {report.summary || "Rapprochement effectué via IA"}
                                            </p>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                                    {report.matches?.length || 0} Lettrages
                                                </span>
                                                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                                                    {report.anomalies?.length || 0} Anomalies
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="icon" variant="ghost" className="h-8 w-8" title="Consulter">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" title="Télécharger PDF">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <FileText className="h-8 w-8 mb-2 opacity-20" />
                                            <p>Aucun rapprochement trouvé.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
