'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building, PlusCircle, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

export interface Client {
    id: string;
    name: string;
    siret: string;
    address: string;
    legalRepresentative: string;
    fiscalYearEndDate: string;
    status: 'active' | 'inactive' | 'onboarding';
    newDocuments: number;
    lastActivity: string;
    email: string;
    phone: string;
}

const mockClients: Client[] = [
    { id: 'alpha', name: 'Entreprise Alpha', siret: '12345678901234', address: '123 Rue de la Paix, 75001 Paris', legalRepresentative: 'Jean Dupont', fiscalYearEndDate: '31/12', status: 'active', newDocuments: 3, lastActivity: '2024-07-16', email: 'contact@alpha.com', phone: '0123456789' },
    { id: 'beta', name: 'Bêta SARL', siret: '23456789012345', address: '45 Avenue des Champs-Élysées, 75008 Paris', legalRepresentative: 'Marie Curie', fiscalYearEndDate: '30/06', status: 'active', newDocuments: 0, lastActivity: '2024-07-15', email: 'compta@beta.eu', phone: '0987654321' },
    { id: 'gamma', name: 'Gamma Inc.', siret: '34567890123456', address: '67 Boulevard Saint-Germain, 75005 Paris', legalRepresentative: 'Louis Pasteur', fiscalYearEndDate: '31/03', status: 'onboarding', newDocuments: 1, lastActivity: '2024-07-17', email: 'factures@gamma.io', phone: '0112233445' },
    { id: 'delta', name: 'Delta Industries', siret: '45678901234567', address: '89 Rue de Rivoli, 75004 Paris', legalRepresentative: 'Simone Veil', fiscalYearEndDate: '30/09', status: 'active', newDocuments: 5, lastActivity: '2024-07-16', email: 'admin@delta-industries.fr', phone: '0655443322' },
    { id: 'epsilon', name: 'Epsilon Global', siret: '56789012345678', address: '101 Avenue Victor Hugo, 75116 Paris', legalRepresentative: 'Charles de Gaulle', fiscalYearEndDate: '31/12', status: 'inactive', newDocuments: 0, lastActivity: '2024-05-20', email: 'support@epsilon.com', phone: '0788990011' },
];

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>(mockClients);
    const [searchTerm, setSearchTerm] = useState('');
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const router = useRouter();

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectClient = (clientId: string) => {
        localStorage.setItem('selectedClientId', clientId);
        window.dispatchEvent(new Event('storage'));
        router.push('/dashboard/documents');
    }
    
    const handleDeleteClient = (client: Client) => {
        setClients(prev => prev.filter(c => c.id !== client.id));
        setClientToDelete(null);
    }


    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'active': return <Badge>Actif</Badge>
            case 'inactive': return <Badge variant="outline">Inactif</Badge>
            case 'onboarding': return <Badge variant="secondary">Intégration</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestion des clients</h1>
                    <p className="text-muted-foreground mt-1">Affichez, ajoutez et gérez vos dossiers clients.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/clients/new')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nouveau Client
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Liste des clients</CardTitle>
                            <CardDescription>Parcourez vos clients ou recherchez un dossier spécifique.</CardDescription>
                        </div>
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
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Nom de l'entreprise</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Documents en attente</TableHead>
                                <TableHead>Dernière activité</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClients.length > 0 ? filteredClients.map(client => (
                                <TableRow key={client.id} className="group">
                                    <TableCell>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                            <Building className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{client.name}</TableCell>
                                    <TableCell>{getStatusBadge(client.status)}</TableCell>
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
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Modifier
                                                    </DropdownMenuItem>
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
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Aucun client trouvé.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action est irréversible. Le dossier du client "{clientToDelete?.name}" sera définitivement supprimé, y compris tous ses documents.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setClientToDelete(null)}>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={() => clientToDelete && handleDeleteClient(clientToDelete)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
