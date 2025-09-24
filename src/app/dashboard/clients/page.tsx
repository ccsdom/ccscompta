
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building, PlusCircle, Search, MoreHorizontal, Edit, Trash2, Download, CheckCircle, XCircle, FileSpreadsheet, File, FileType, LogIn, FileUp, CalendarClock, FileClock, Wand2 } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ClientImportDialog } from '@/components/client-import-dialog';
import { getAccountants, type Accountant, getClients, addClient, updateClient, deleteClient as deleteClientAction } from '@/ai/flows/client-actions';
import type { Client } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { AiClientDialog } from '@/components/ai-client-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [accountants, setAccountants] = useState<Accountant[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
    const router = useRouter();
    const { toast } = useToast();

    const fetchClientsAndAccountants = useCallback(async () => {
        setLoading(true);
        try {
            const [clientsData, accountantsData] = await Promise.all([
                getClients(),
                getAccountants()
            ]);
            setClients(clientsData.sort((a, b) => a.name.localeCompare(b.name)));
            setAccountants(accountantsData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast({
                title: "Erreur de chargement",
                description: "Impossible de récupérer les données des clients.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchClientsAndAccountants();
    }, [fetchClientsAndAccountants]);
    
    const filteredClients = useMemo(() => clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [clients, searchTerm]);
    
    const handleSelectAll = (checked: boolean | string) => {
        if (checked) {
            setSelectedClientIds(filteredClients.map(c => c.id));
        } else {
            setSelectedClientIds([]);
        }
    }
    
    const handleSelectRow = (id: string, checked: boolean) => {
        setSelectedClientIds(prev => checked ? [...prev, id] : prev.filter(clientId => clientId !== id));
    }

    const handleSelectClient = (clientId: string) => {
        localStorage.setItem('selectedClientId', clientId);
        window.dispatchEvent(new Event('storage'));
        router.push('/dashboard/documents');
    }

    const handleImpersonate = (client: Client) => {
        localStorage.setItem('originalUserRole', localStorage.getItem('userRole') || 'admin');
        localStorage.setItem('originalUserName', localStorage.getItem('userName') || 'Super Admin');
        localStorage.setItem('originalUserEmail', localStorage.getItem('userEmail') || '');

        localStorage.setItem('userRole', 'client');
        localStorage.setItem('userName', client.legalRepresentative);
        localStorage.setItem('userEmail', client.email);
        localStorage.setItem('selectedClientId', client.id);

        toast({
            title: `Vue Client Activée`,
            description: `Vous naviguez maintenant en tant que ${client.name}.`,
        });

        window.dispatchEvent(new Event('storage'));
        router.push('/dashboard/my-documents');
    }
    
    const handleDeleteClient = async () => {
        if (!clientToDelete) return;
        
        await deleteClientAction(clientToDelete.id);
        toast({ title: 'Client supprimé', description: `Le client ${clientToDelete.name} a été supprimé.` });
        setClientToDelete(null);
        fetchClientsAndAccountants(); // Refetch data
    }

    const handleBulkStatusChange = async (status: 'active' | 'inactive' | 'onboarding') => {
        const promises = selectedClientIds.map(id => updateClient({id, updates: { status }}));
        await Promise.all(promises);
        
        toast({
            title: "Statuts mis à jour",
            description: `${selectedClientIds.length} clients ont été mis à jour.`
        });
        setSelectedClientIds([]);
        fetchClientsAndAccountants(); // Refetch data
    }
    
    const getClientsToExport = () => {
        if (clients.length === 0) {
            toast({
                title: "Aucun client à exporter",
                description: "La liste des clients est vide.",
                variant: "destructive"
            });
            return null;
        }
        return clients;
    }

    const handleExportXLSX = () => {
        const clientsToExport = getClientsToExport();
        if (!clientsToExport) return;

        const worksheet = XLSX.utils.json_to_sheet(clientsToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");
        
        const date = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `export-clients-${date}.xlsx`);
        
        toast({
            title: "Exportation réussie",
            description: `${clientsToExport.length} clients ont été exportés au format Excel.`,
        });
    }

    const handleExportCSV = () => {
        const clientsToExport = getClientsToExport();
        if (!clientsToExport) return;

        const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(clientsToExport));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const date = new Date().toISOString().slice(0, 10);
        link.setAttribute("download", `export-clients-${date}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: "Exportation réussie",
            description: `${clientsToExport.length} clients ont été exportés au format CSV.`,
        });
    }

    const handleExportPDF = () => {
        const clientsToExport = getClientsToExport();
        if (!clientsToExport) return;

        const doc = new jsPDF();
        doc.text("Liste des Clients", 14, 16);
        (doc as any).autoTable({
            head: [['Nom', 'Email', 'SIRET', 'Statut', 'Dernière Activité']],
            body: clientsToExport.map(c => [c.name, c.email, c.siret, c.status, new Date(c.lastActivity).toLocaleDateString('fr-FR')]),
            startY: 20,
        });

        const date = new Date().toISOString().slice(0, 10);
        doc.save(`export-clients-${date}.pdf`);

         toast({
            title: "Exportation réussie",
            description: `${clientsToExport.length} clients ont été exportés au format PDF.`,
        });
    }

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'active': return <Badge>Actif</Badge>
            case 'inactive': return <Badge variant="outline">Inactif</Badge>
            case 'onboarding': return <Badge variant="secondary">Intégration</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }
    
    const getAccountantInitial = (accountantId?: string) => {
        if (!accountantId) return '';
        const accountant = accountants.find(a => a.id === accountantId);
        return accountant ? accountant.name.split(' ').map(n => n[0]).join('') : '';
    }
    
    // Renders Skeleton loaders for both mobile and desktop
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
                {/* Desktop skeleton */}
                <div className="hidden md:block">
                     <Skeleton className="h-12 w-full mb-4" />
                     <Skeleton className="h-96 w-full" />
                </div>
                {/* Mobile skeleton */}
                <div className="space-y-4 md:hidden">
                    <Skeleton className="h-12 w-full" />
                    {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
                </div>
            </div>
        )
    }

    const BulkActionsToolbar = () => (
        <div className="flex items-center space-x-2 bg-muted p-2 rounded-md border mb-4">
            <span className="text-sm font-medium text-muted-foreground pl-2">{selectedClientIds.length} sélectionné(s)</span>
            <div className="flex-grow" />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">Actions en masse</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Changer le statut</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                             <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => handleBulkStatusChange('active')}>Actif</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBulkStatusChange('inactive')}>Inactif</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBulkStatusChange('onboarding')}>Intégration</DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>
             <Button variant="ghost" size="sm" onClick={() => setSelectedClientIds([])}>
                <XCircle className="mr-2 h-4 w-4" />
                Annuler
            </Button>
        </div>
    )

    return (
        <div className="space-y-6">
             <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestion des clients</h1>
                    <p className="text-muted-foreground mt-1">Créez et gérez les dossiers et les accès de vos clients.</p>
                </div>
                 <div className="flex items-center gap-2">
                    {/* Desktop Buttons */}
                    <div className="hidden md:flex items-center gap-2">
                        <ClientImportDialog onClientsImported={fetchClientsAndAccountants} />
                        <AiClientDialog />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline"><Download className="mr-2 h-4 w-4" />Exporter</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={handleExportXLSX}><FileSpreadsheet className="mr-2 h-4 w-4" />Exporter en Excel (.xlsx)</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportPDF}><FileType className="mr-2 h-4 w-4" />Exporter en PDF</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportCSV}><File className="mr-2 h-4 w-4" />Exporter en CSV</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button onClick={() => router.push('/dashboard/clients/new')}><PlusCircle className="mr-2 h-4 w-4" />Nouveau Client</Button>
                    </div>
                    {/* Mobile Actions Dropdown */}
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button>Actions</Button>
                            </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push('/dashboard/clients/new')}><PlusCircle className="mr-2 h-4 w-4" />Nouveau Client</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <ClientImportDialog onClientsImported={fetchClientsAndAccountants} isMenuItem />
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <AiClientDialog isMenuItem />
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger><Download className="mr-2 h-4 w-4" />Exporter</DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuSubContent>
                                            <DropdownMenuItem onClick={handleExportXLSX}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel (.xlsx)</DropdownMenuItem>
                                            <DropdownMenuItem onClick={handleExportPDF}><FileType className="mr-2 h-4 w-4" />PDF</DropdownMenuItem>
                                            <DropdownMenuItem onClick={handleExportCSV}><File className="mr-2 h-4 w-4" />CSV</DropdownMenuItem>
                                        </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                </DropdownMenuSub>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Mobile search */}
             <div className="md:hidden">
                 <div className="relative">
                    <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par nom..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            
            {selectedClientIds.length > 0 && <BulkActionsToolbar />}

            {/* Desktop view */}
            <Card className="hidden md:block">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Liste des clients</CardTitle>
                            <CardDescription>Parcourez vos clients ou recherchez un dossier spécifique.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-full max-w-sm">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Rechercher par nom..."
                                        className="pl-8"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px] px-4">
                                     <Checkbox
                                        onCheckedChange={handleSelectAll}
                                        checked={filteredClients.length > 0 && selectedClientIds.length === filteredClients.length}
                                        indeterminate={selectedClientIds.length > 0 && selectedClientIds.length < filteredClients.length}
                                        aria-label="Tout sélectionner"
                                    />
                                </TableHead>
                                <TableHead>Nom de l'entreprise</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="hidden md:table-cell">Comptable Attribué</TableHead>
                                <TableHead>Documents en attente</TableHead>
                                <TableHead>Dernière activité</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClients.length > 0 ? filteredClients.map(client => (
                                <TableRow key={client.id} data-state={selectedClientIds.includes(client.id) ? "selected" : ""}>
                                    <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            onCheckedChange={(checked) => handleSelectRow(client.id, !!checked)}
                                            checked={selectedClientIds.includes(client.id)}
                                            aria-label={`Sélectionner ${client.name}`}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                            <Building className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <button className="text-left hover:underline" onClick={() => handleSelectClient(client.id)}>
                                            {client.name}
                                        </button>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(client.status)}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {client.assignedAccountantId ? (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback>{getAccountantInitial(client.assignedAccountantId)}</AvatarFallback>
                                                        </Avatar>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{accountants.find(a => a.id === client.assignedAccountantId)?.name}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ) : (
                                            <Badge variant="outline">Non attribué</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {client.newDocuments > 0 ? (
                                            <Badge variant="destructive">{client.newDocuments}</Badge>
                                        ) : (
                                            <span className="text-muted-foreground">0</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{new Date(client.lastActivity).toLocaleDateString('fr-FR')}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handleSelectClient(client.id)}>
                                                Ouvrir le dossier
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Plus d'actions</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                     <DropdownMenuItem onClick={() => handleImpersonate(client)}>
                                                        <LogIn className="mr-2 h-4 w-4" />
                                                        Prendre la main
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Modifier
                                                    </DropdownMenuItem>
                                                     <DropdownMenuSeparator />
                                                     <DropdownMenuItem className="text-destructive" onClick={() => setClientToDelete(client)}>
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Supprimer
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        Aucun client trouvé.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Mobile view */}
            <div className="space-y-4 md:hidden">
                {filteredClients.length > 0 ? filteredClients.map(client => (
                    <Card key={client.id} className="relative" onClick={() => handleSelectClient(client.id)}>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted shrink-0">
                                <Building className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="font-semibold truncate">{client.name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    {getStatusBadge(client.status)}
                                    <span className="mx-1">·</span>
                                    <div className="flex items-center gap-1.5" title="Documents en attente">
                                        <FileClock className="h-3 w-3" />
                                        <span>{client.newDocuments}</span>
                                    </div>
                                    <span className="mx-1">·</span>
                                     <div className="flex items-center gap-1.5" title="Dernière activité">
                                        <CalendarClock className="h-3 w-3" />
                                        <span>{new Date(client.lastActivity).toLocaleDateString('fr-FR')}</span>
                                    </div>
                                </div>
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleSelectClient(client.id)}>Ouvrir</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleImpersonate(client)}>Prendre la main</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/clients/${client.id}`)}>Modifier</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive" onClick={() => setClientToDelete(client)}>Supprimer</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardContent>
                    </Card>
                )) : (
                    <Card>
                        <CardContent className="h-48 flex flex-col items-center justify-center text-center">
                            <Search className="h-10 w-10 text-muted-foreground mb-3" />
                            <h3 className="font-semibold">Aucun client trouvé</h3>
                            <p className="text-sm text-muted-foreground mt-1">Essayez d'affiner votre recherche.</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Le dossier du client "{clientToDelete?.name}" sera définitivefent supprimé, y compris tous ses documents.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setClientToDelete(null)}>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

    