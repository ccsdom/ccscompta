'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Download, CheckCircle, Clock, MoreHorizontal, FileDown, FilterX, Users } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import type { Invoice, Client } from '@/lib/types';
import { Input } from '@/components/ui/input';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useBranding } from '@/components/branding-provider';
import { where } from 'firebase/firestore';

export default function BillingPage() {
    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
    const { toast } = useToast();
    const { role, profile, isLoading: isBrandingLoading } = useBranding();

    // Filters state
    const [clientFilter, setClientFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');

    const isStaff = useMemo(() => role && ['accountant', 'secretary'].includes(role), [role]);

    // Explicit block for Super Admin to force impersonation
    if (role === 'admin') {
        return (
             <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center p-6 text-center">
                <Card className="max-w-md glass-panel border-none premium-shadow p-12 rounded-[2.5rem]">
                    <div className="h-20 w-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="h-10 w-10 text-red-500" />
                    </div>
                    <h2 className="text-3xl font-black font-space tracking-tight mb-4 text-foreground">Zone Interdite</h2>
                    <p className="text-muted-foreground mb-8 text-lg font-medium">L'accès direct à la facturation cabinet est restreint pour le Super Admin. Veuillez impersonner un cabinet pour gérer sa facturation.</p>
                    <Button onClick={() => router.push('/dashboard/cabinets')} className="h-12 px-8 rounded-xl bg-primary font-space font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
                        Aller à la Gestion Cabinets
                    </Button>
                </Card>
            </div>
        )
    }

    const clientsQuery = useMemoFirebase(() => {
        if (!isStaff || !role) return null;
        
        if (profile?.cabinetId) {
            return query(collection(db, 'clients'), where('cabinetId', '==', profile.cabinetId));
        }

        return null;
    }, [isStaff, role, profile?.cabinetId]);
    const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
    
    const invoicesQuery = useMemoFirebase(() => {
        if (!isStaff || !role) return null;
        
        if (profile?.cabinetId) {
            return query(collection(db, 'invoices'), where('cabinetId', '==', profile.cabinetId));
        }

        return null;
    }, [isStaff, role, profile?.cabinetId]);
    const { data: invoices, isLoading: isLoadingInvoices } = useCollection<Invoice>(invoicesQuery);

    const loading = isBrandingLoading || (isStaff && (isLoadingClients || isLoadingInvoices));


    const filteredInvoices = useMemo(() => {
        if (!invoices) return [];
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
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [invoices, clientFilter, statusFilter, startDateFilter, endDateFilter]);

    const handleSelectAll = (checked: boolean | 'indeterminate') => {
        setSelectedInvoiceIds(checked ? filteredInvoices.map(inv => inv.id) : []);
    };
    
    const handleSelectRow = (invoiceId: string, checked: boolean) => {
        setSelectedInvoiceIds(prev => 
            checked ? [...prev, invoiceId] : prev.filter(id => id !== invoiceId)
        );
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStartDate = e.target.value;
        setStartDateFilter(newStartDate);
        if (endDateFilter && newStartDate > endDateFilter) {
            setEndDateFilter(newStartDate);
        }
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEndDate = e.target.value;
        setEndDateFilter(newEndDate);
        if (startDateFilter && newEndDate < startDateFilter) {
            setStartDateFilter(newEndDate);
        }
    };


    const handleResetFilters = () => {
        setClientFilter('all');
        setStatusFilter('all');
        setStartDateFilter('');
        setEndDateFilter('');
        setSelectedInvoiceIds([]);
    }

    const handleBulkMarkAsPaid = async () => {
        const updates = selectedInvoiceIds.map(id => 
            updateDoc(doc(db, 'invoices', id), { status: 'paid' })
        );
        await Promise.all(updates);

        toast({
            title: "Factures mises à jour",
            description: `${selectedInvoiceIds.length} facture(s) ont été marquées comme payées.`,
        });
        setSelectedInvoiceIds([]);
    }

    const handleBulkDownloadPDF = () => {
        const docToExport = invoices?.filter(inv => selectedInvoiceIds.includes(inv.id)) || [];
        if (docToExport.length === 0) return;
        
        const pdf = new jsPDF();
        pdf.text("Factures sélectionnées", 14, 16);
        (pdf as any).autoTable({
            head: [['Client', 'Numéro', 'Montant', 'Statut']],
            body: docToExport.map(inv => [
                    inv.clientName,
                    inv.number,
                    inv.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
                    inv.status
                ]),
            startY: 20,
        });
        pdf.save(`export-factures-${new Date().toISOString().slice(0, 10)}.pdf`);
        toast({ title: 'Téléchargement lancé', description: 'Le PDF avec les factures sélectionnées est en cours de génération.' });
    };

    const handleBulkExportCSV = () => {
        const dataToExport = invoices?.filter(inv => selectedInvoiceIds.includes(inv.id))
            .map(({ clientName, number, amount, status, date, dueDate }) => ({
                Client: clientName,
                Numero: number,
                Montant: amount,
                Statut: status,
                Date: date,
                Echeance: dueDate,
            })) || [];
        
        if(dataToExport.length === 0) return;

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

    
    if (!isStaff) {
         return (
             <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center">
                <Card className="w-full max-w-md text-center">
                     <CardHeader>
                        <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                        <CardTitle className="mt-4">Accès non autorisé</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-9 w-1/3" />
                    <Skeleton className="h-5 w-2/3 mt-2" />
                </div>
                <Card>
                    <CardHeader><Skeleton className="h-10 w-full" /></CardHeader>
                    <CardContent>
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }


    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">Facturation Clients</h1>
                <p className="text-muted-foreground mt-1">Suivez les paiements et gérez les factures de vos clients.</p>
            </div>
             <Card>
                <CardHeader>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <CardTitle>Suivi des factures</CardTitle>
                            <CardDescription>Filtrez et gérez les factures de vos clients.</CardDescription>
                        </div>
                         <div className="flex flex-wrap items-center gap-4">
                             {isStaff && (
                                <Select value={clientFilter} onValueChange={setClientFilter}>
                                    <SelectTrigger className="w-full sm:w-auto min-w-[160px]">
                                        <SelectValue placeholder="Client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous les clients</SelectItem>
                                        {(clients || []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                             )}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-auto min-w-[140px]">
                                    <SelectValue placeholder="Statut" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les statuts</SelectItem>
                                    <SelectItem value="paid">Payée</SelectItem>
                                    <SelectItem value="pending">En attente</SelectItem>
                                    <SelectItem value="overdue">En retard</SelectItem>
                                </SelectContent>
                            </Select>
                             <div className="flex items-center gap-2 flex-wrap">
                                 <Label htmlFor="start-date" className="text-sm font-medium">Période:</Label>
                                 <Input id="start-date" type="date" value={startDateFilter} onChange={handleStartDateChange} className="w-full sm:w-auto"/>
                                 <span className="text-muted-foreground">à</span>
                                 <Input type="date" value={endDateFilter} onChange={handleEndDateChange} className="w-full sm:w-auto"/>
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
                                    <Button variant="outline">Actions <MoreHorizontal className="ml-2 h-4 w-4"/></Button>
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
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]">
                                        <Checkbox
                                            checked={filteredInvoices.length > 0 && selectedInvoiceIds.length === filteredInvoices.length}
                                            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
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
                    </div>

                    {/* Mobile Card List */}
                    <div className="md:hidden space-y-4">
                       {filteredInvoices.length > 0 ? filteredInvoices.map(invoice => (
                           <Card key={invoice.id}>
                               <CardHeader className="flex flex-row justify-between items-start p-4 pb-2">
                                   <div>
                                       <CardTitle className="text-base">{invoice.clientName}</CardTitle>
                                       <CardDescription>{invoice.number}</CardDescription>
                                   </div>
                                   {getStatusBadge(invoice.status)}
                               </CardHeader>
                               <CardContent className="p-4 pt-2 flex items-end justify-between">
                                    <div>
                                        <p className="text-2xl font-bold">{invoice.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
                                        <p className="text-xs text-muted-foreground">Échéance : {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon">
                                            <Download className="h-4 w-4" />
                                            <span className="sr-only">Télécharger</span>
                                        </Button>
                                        {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                                            <Button variant="outline" size="icon">
                                                <CreditCard className="h-4 w-4" />
                                                <span className="sr-only">Payer</span>
                                            </Button>
                                        )}
                                    </div>
                               </CardContent>
                           </Card>
                       )) : (
                            <div className="h-48 text-center flex flex-col items-center justify-center text-muted-foreground">
                                <FilterX className="h-10 w-10 mb-2"/>
                                <p className="font-semibold">Aucune facture trouvée</p>
                                <p className="text-sm">Essayez de modifier vos filtres.</p>
                            </div>
                       )}
                    </div>
                </CardContent>
                 <CardFooter className="text-xs text-muted-foreground p-6">
                    <p>Pour toute question concernant une facture, veuillez contacter votre gestionnaire de dossier.</p>
                </CardFooter>
            </Card>
        </div>
    )
}

    