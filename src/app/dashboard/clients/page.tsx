

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building, PlusCircle, Search, MoreHorizontal, Edit, Trash2, Download, CheckCircle, XCircle, FileSpreadsheet, File, FileType, LogIn, FileUp, CalendarClock, FileClock, Wand2, Users, Briefcase } from "lucide-react";
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
import { getAccountants, type Accountant, getClients, updateClient, deleteClient as deleteClientAction } from '@/ai/flows/client-actions';
import type { Client } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { AiClientDialog } from '@/components/ai-client-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [accountants, setAccountants] = useState<Accountant[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
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
                description: "Impossible de récupérer les données des utilisateurs.",
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
        client.role === 'client' && client.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [clients, searchTerm]);

    const filteredTeam = useMemo(() => clients.filter(user =>
        user.role !== 'client' && user.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [clients, searchTerm]);
    
    const handleSelectAll = (checked: boolean | string, type: 'client' | 'team') => {
        const usersToSelect = type === 'client' ? filteredClients : filteredTeam;
        if (checked) {
            setSelectedUserIds(prev => [...new Set([...prev, ...usersToSelect.map(u => u.id)])]);
        } else {
            const userToSelectIds = usersToSelect.map(u => u.id);
            setSelectedUserIds(prev => prev.filter(id => !userToSelectIds.includes(id)));
        }
    }
    
    const handleSelectRow = (id: string, checked: boolean) => {
        setSelectedUserIds(prev => checked ? [...prev, id] : prev.filter(userId => userId !== id));
    }

    const handleImpersonate = (client: Client) => {
        localStorage.setItem('originalUserRole', localStorage.getItem('userRole') || 'admin');
        localStorage.setItem('originalUserName', localStorage.getItem('userName') || 'Super Admin');
        localStorage.setItem('originalUserEmail', localStorage.getItem('userEmail') || '');

        localStorage.setItem('userRole', 'client');
        localStorage.setItem('userName', client.legalRepresentative || client.name);
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
        toast({ title: 'Utilisateur supprimé', description: `L'utilisateur ${clientToDelete.name} a été supprimé.` });
        setClientToDelete(null);
        fetchClientsAndAccountants(); // Refetch data
    }

    const handleBulkStatusChange = async (status: 'active' | 'inactive' | 'onboarding') => {
        const promises = selectedUserIds.map(id => updateClient({id, updates: { status }}));
        await Promise.all(promises);
        
        toast({
            title: "Statuts mis à jour",
            description: `${selectedUserIds.length} utilisateurs ont été mis à jour.`
        });
        setSelectedUserIds([]);
        fetchClientsAndAccountants(); // Refetch data
    }
    
    const getUsersToExport = (type: 'client' | 'team' | 'all') => {
        const usersToExport = type === 'all' 
            ? clients 
            : (type === 'client' ? filteredClients : filteredTeam);
        
        if (usersToExport.length === 0) {
            toast({
                title: "Aucun utilisateur à exporter",
                description: "La liste sélectionnée est vide.",
                variant: "destructive"
            });
            return null;
        }
        return usersToExport;
    }

    const handleExportXLSX = (type: 'client' | 'team' | 'all') => {
        const usersToExport = getUsersToExport(type);
        if (!usersToExport) return;

        const worksheet = XLSX.utils.json_to_sheet(usersToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Utilisateurs");
        
        const date = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `export-utilisateurs-${type}-${date}.xlsx`);
        
        toast({
            title: "Exportation réussie",
            description: `${usersToExport.length} utilisateurs ont été exportés.`,
        });
    }

    const handleExportPDF = (type: 'client' | 'team' | 'all') => {
        const usersToExport = getUsersToExport(type);
        if (!usersToExport) return;

        const doc = new jsPDF();
        doc.text(`Liste des ${type === 'client' ? 'Clients' : 'Membres de l\'équipe'}`, 14, 16);
        (doc as any).autoTable({
            head: [['Nom', 'Email', 'Rôle', 'Statut', 'Dernière Activité']],
            body: usersToExport.map(c => [c.name, c.email, c.role, c.status, new Date(c.lastActivity).toLocaleDateString('fr-FR')]),
            startY: 20,
        });

        const date = new Date().toISOString().slice(0, 10);
        doc.save(`export-utilisateurs-${type}-${date}.pdf`);

         toast({
            title: "Exportation réussie",
            description: `${usersToExport.length} utilisateurs ont été exportés.`,
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
                <Skeleton className="h-12 w-full mb-4" />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    const BulkActionsToolbar = () => (
        <div className="flex items-center space-x-2 bg-muted p-2 rounded-md border mb-4">
            <span className="text-sm font-medium text-muted-foreground pl-2">{selectedUserIds.length} sélectionné(s)</span>
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
             <Button variant="ghost" size="sm" onClick={() => setSelectedUserIds([])}>
                <XCircle className="mr-2 h-4 w-4" />
                Annuler
            </Button>
        </div>
    )

    const UserTable = ({ users, type }: { users: Client[], type: 'client' | 'team' }) => (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[40px] px-4">
                            <Checkbox
                            onCheckedChange={(checked) => handleSelectAll(checked, type)}
                            checked={users.length > 0 && users.every(u => selectedUserIds.includes(u.id))}
                            indeterminate={users.length > 0 && users.some(u => selectedUserIds.includes(u.id)) && !users.every(u => selectedUserIds.includes(u.id))}
                            aria-label={`Tout sélectionner pour ${type}`}
                        />
                    </TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    {type === 'client' && <TableHead className="hidden md:table-cell">Comptable Attribué</TableHead>}
                    <TableHead>Dernière activité</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.length > 0 ? users.map(user => (
                    <TableRow key={user.id} data-state={selectedUserIds.includes(user.id) ? "selected" : ""}>
                        <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                                onCheckedChange={(checked) => handleSelectRow(user.id, !!checked)}
                                checked={selectedUserIds.includes(user.id)}
                                aria-label={`Sélectionner ${user.name}`}
                            />
                        </TableCell>
                        <TableCell className="font-medium flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                <Building className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <button className="text-left hover:underline" onClick={() => router.push(`/dashboard/clients/${user.id}`)}>
                                {user.name}
                            </button>
                        </TableCell>
                        <TableCell className="capitalize">{user.role}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                         {type === 'client' && (
                            <TableCell className="hidden md:table-cell">
                                {user.assignedAccountantId ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>{getAccountantInitial(user.assignedAccountantId)}</AvatarFallback>
                                                </Avatar>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{accountants.find(a => a.id === user.assignedAccountantId)?.name}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : (
                                    <Badge variant="outline">Non attribué</Badge>
                                )}
                            </TableCell>
                         )}
                        <TableCell>{new Date(user.lastActivity).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/clients/${user.id}/edit`)}>
                                    Modifier
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Plus d'actions</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                            {user.role === 'client' && <DropdownMenuItem onClick={() => handleImpersonate(user)}>
                                            <LogIn className="mr-2 h-4 w-4" />
                                            Prendre la main
                                        </DropdownMenuItem>}
                                        <DropdownMenuItem onClick={() => { localStorage.setItem('selectedClientId', user.id); window.dispatchEvent(new Event('storage')); router.push('/dashboard/documents'); }}>
                                            <File className="mr-2 h-4 w-4" />
                                            Voir les documents
                                        </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive" onClick={() => setClientToDelete(user)}>
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
                            Aucun utilisateur trouvé.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    return (
        <div className="space-y-6">
             <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
                    <p className="text-muted-foreground mt-1">Créez et gérez les profils des clients et de votre équipe.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-2">
                        <ClientImportDialog onClientsImported={fetchClientsAndAccountants} />
                        <AiClientDialog />
                        <Button onClick={() => router.push('/dashboard/clients/new')}><PlusCircle className="mr-2 h-4 w-4" />Nouvel Utilisateur</Button>
                    </div>
                     <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button>Actions</Button></DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push('/dashboard/clients/new')}><PlusCircle className="mr-2 h-4 w-4" />Nouvel Utilisateur</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}><ClientImportDialog onClientsImported={fetchClientsAndAccountants} isMenuItem /></DropdownMenuItem>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}><AiClientDialog isMenuItem /></DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
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
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="outline"><Download className="mr-2 h-4 w-4" />Exporter</Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleExportXLSX('client')}>Clients (.xlsx)</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExportXLSX('team')}>Équipe (.xlsx)</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleExportPDF('client')}>Clients (.pdf)</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExportPDF('team')}>Équipe (.pdf)</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {selectedUserIds.length > 0 && <div className="px-6 pb-4"><BulkActionsToolbar /></div>}
                    <Tabs defaultValue="clients">
                        <TabsList className="mx-6">
                            <TabsTrigger value="clients"><Users className="mr-2 h-4 w-4"/>Clients ({filteredClients.length})</TabsTrigger>
                            <TabsTrigger value="team"><Briefcase className="mr-2 h-4 w-4"/>Équipe ({filteredTeam.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="clients">
                           <UserTable users={filteredClients} type="client" />
                        </TabsContent>
                        <TabsContent value="team">
                           <UserTable users={filteredTeam} type="team" />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Le profil de "{clientToDelete?.name}" sera définitivement supprimé, y compris son accès utilisateur et tous les documents associés.
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
