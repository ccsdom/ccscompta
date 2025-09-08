
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Download, CheckCircle, Clock, MoreHorizontal, FileDown, FilterX } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import type { Client } from '@/lib/client-data';
import { getClients } from '@/ai/flows/client-actions';
import { Input } from '@/components/ui/input';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';


interface Invoice {
    id: string;
    clientId: string;
    clientName: string;
    number: string;
    date: string;
    dueDate: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
}

const mockInvoices: Invoice[] = [
    { id: '1', clientId: 'client-01', clientName: 'ACTION AVENTURE', number: 'FACT-2024-007', date: '2024-07-01', dueDate: '2024-07-31', amount: 350.00, status: 'pending' },
    { id: '2', clientId: 'client-02', clientName: 'AUTO ECOLE DE LA MAIRIE', number: 'FACT-2024-006', date: '2024-06-01', dueDate: '2024-06-30', amount: 350.00, status: 'paid' },
    { id: '3', clientId: 'client-03', clientName: 'BODY MINUTE', number: 'FACT-2024-005', date: '2024-05-01', dueDate: '2024-05-31', amount: 350.00, status: 'paid' },
    { id: '4', clientId: 'client-04', clientName: 'CABINET FLORET', number: 'FACT-2023-BILAN', date: '2024-04-15', dueDate: '2024-05-15', amount: 1800.00, status: 'overdue' },
    { id: '5', clientId: 'client-05', clientName: 'CABINET MEDICAL GALEA', number: 'FACT-2024-004', date: '2024-04-01', dueDate: '2024-04-30', amount: 350.00, status: 'paid' },
    { id: '6', clientId: 'client-06', clientName: 'CHICKEN SPOT', number: 'FACT-2024-008', date: '2024-07-05', dueDate: '2024-08-05', amount: 450.00, status: 'pending' },
];

export default function BillingPage() {
    const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
    const { toast } = useToast();

    // Filters state
    const [clientFilter, setClientFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');

     useEffect(() => {
        const fetchClients = async () => {
            const clientsData = await getClients();
            setClients(clientsData);
        }
        fetchClients();
    }, []);

    const filteredInvoices = useMemo(() => {
        return invoices.filter(invoice => {
            const invoiceDate = new Date(invoice.date);
            const start = startDateFilter ? new Date(startDateFilter) : null;
            const end = endDateFilter ? new Date(endDateFilter) : null;

            if (start) start.setHours(0,0,0,0);
            if (end) end.setHours(23,59,59,999);

            return (clientFilter === 'all' || invoice.clientId === clientFilter) &&
                   (statusFilter === 'all' || invoice.status === statusFilter) &&
                   (!start || invoiceDate >= start) &&
                   (!end || invoiceDate <= end);
        });
    }, [invoices, clientFilter, statusFilter, startDateFilter, endDateFilter]);

    const handleSelectAll = (checked: boolean | 'indeterminate') => {
        setSelectedInvoiceIds(checked ? filteredInvoices.map(inv => inv.id) : []);
    };
    
    const handleSelectRow = (invoiceId: string, checked: boolean) => {
        setSelectedInvoiceIds(prev => 
            checked ? [...prev, invoiceId] : prev.filter(id => id !== invoiceId)
        );
    };

    const handleResetFilters = () => {
        setClientFilter('all');
        setStatusFilter('all');
        setStartDateFilter('');
        setEndDateFilter('');
        setSelectedInvoiceIds([]);
    }

    const handleBulkMarkAsPaid = () => {
        setInvoices(prev => prev.map(inv => 
            selectedInvoiceIds.includes(inv.id) ? { ...inv, status: 'paid' } : inv
        ));
        toast({
            title: "Factures mises à jour",
            description: `${selectedInvoiceIds.length} facture(s) ont été marquées comme payées.`,
        });
        setSelectedInvoiceIds([]);
    }

    const handleBulkDownloadPDF = () => {
        const doc = new jsPDF();
        doc.text("Factures sélectionnées", 14, 16);
        (doc as any).autoTable({
            head: [['Client', 'Numéro', 'Montant', 'Statut']],
            body: invoices
                .filter(inv => selectedInvoiceIds.includes(inv.id))
                .map(inv => [
                    inv.clientName,
                    inv.number,
                    inv.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
                    inv.status
                ]),
            startY: 20,
        });
        doc.save(`export-factures-${new Date().toISOString().slice(0, 10)}.pdf`);
        toast({ title: 'Téléchargement lancé', description: 'Le PDF avec les factures sélectionnées est en cours de génération.' });
    };

    const handleBulkExportCSV = () => {
        const dataToExport = invoices
            .filter(inv => selectedInvoiceIds.includes(inv.id))
            .map(({ clientName, number, amount, status, date, dueDate }) => ({
                Client: clientName,
                Numero: number,
                Montant: amount,
                Statut: status,
                Date: date,
                Echeance: dueDate,
            }));
        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `export-factures-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'Exportation réussie', description: 'Le fichier CSV a été téléchargé.' });
    };

    const getStatusBadge = (status: Invoice['status']) => {
        switch(status) {
            case 'paid': return <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100/80"><CheckCircle className="mr-1 h-3 w-3"/>Payée</Badge>
            case 'pending': return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3"/>En attente</Badge>
            case 'overdue': return <Badge variant="destructive"><Clock className="mr-1 h-3 w-3"/>En retard</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    const hasActiveFilters = clientFilter !== 'all' || statusFilter !== 'all' || startDateFilter !== '' || endDateFilter !== '';

    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">Facturation Clients</h1>
                <p className="text-muted-foreground mt-1">Suivez les paiements et gérez les factures de vos clients.</p>
            </div>
             <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle>Suivi des factures</CardTitle>
                            <CardDescription>Filtrez et gérez les factures de vos clients.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                             <Select value={clientFilter} onValueChange={setClientFilter}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Filtrer par client" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les clients</SelectItem>
                                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-[160px]">
                                    <SelectValue placeholder="Filtrer par statut" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les statuts</SelectItem>
                                    <SelectItem value="paid">Payée</SelectItem>
                                    <SelectItem value="pending">En attente</SelectItem>
                                    <SelectItem value="overdue">En retard</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2">
                                <Input type="date" value={startDateFilter} onChange={e => setStartDateFilter(e.target.value)} className="w-full md:w-auto"/>
                                <span className="text-muted-foreground">-</span>
                                <Input type="date" value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} className="w-full md:w-auto"/>
                            </div>
                             {hasActiveFilters && (
                                <Button variant="ghost" onClick={handleResetFilters}>
                                    <FilterX className="mr-2 h-4 w-4"/>
                                    Réinitialiser
                                </Button>
                             )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     {selectedInvoiceIds.length > 0 && (
                        <div className="bg-muted p-2 rounded-lg mb-4 flex items-center justify-between">
                             <span className="text-sm font-medium pl-2">{selectedInvoiceIds.length} facture(s) sélectionnée(s)</span>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">Actions en masse <MoreHorizontal className="ml-2 h-4 w-4"/></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleBulkMarkAsPaid}>
                                        <CheckCircle className="mr-2 h-4 w-4" /> Marquer comme payée
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                     <DropdownMenuItem onClick={handleBulkDownloadPDF}>
                                        <FileDown className="mr-2 h-4 w-4" /> Télécharger en PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleBulkExportCSV}>
                                        <FileDown className="mr-2 h-4 w-4" /> Exporter en CSV
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                 <TableHead className="w-[40px]">
                                    <Checkbox
                                        checked={filteredInvoices.length > 0 && selectedInvoiceIds.length === filteredInvoices.length}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Tout sélectionner"
                                    />
                                </TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Numéro</TableHead>
                                <TableHead>Échéance</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInvoices.length > 0 ? filteredInvoices.map(invoice => (
                                <TableRow key={invoice.id} data-state={selectedInvoiceIds.includes(invoice.id) && 'selected'}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedInvoiceIds.includes(invoice.id)}
                                            onCheckedChange={(checked) => handleSelectRow(invoice.id, !!checked)}
                                            aria-label={`Sélectionner la facture ${invoice.number}`}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{invoice.clientName}</TableCell>
                                    <TableCell>{invoice.number}</TableCell>
                                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</TableCell>
                                    <TableCell>{invoice.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</TableCell>
                                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon">
                                            <Download className="h-4 w-4" />
                                            <span className="sr-only">Télécharger</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        Aucune facture ne correspond à vos filtres.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                 <CardFooter className="text-xs text-muted-foreground p-6">
                    <p>Pour toute question concernant une facture, veuillez contacter directement votre gestionnaire de dossier.</p>
                </CardFooter>
            </Card>
        </div>
    )

    
}
