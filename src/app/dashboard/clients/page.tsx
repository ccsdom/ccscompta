'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building, PlusCircle, Search } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

const mockClients = [
    { id: 'alpha', name: 'Entreprise Alpha', status: 'active', newDocuments: 3, lastActivity: '2024-07-16' },
    { id: 'beta', name: 'Bêta SARL', status: 'active', newDocuments: 0, lastActivity: '2024-07-15' },
    { id: 'gamma', name: 'Gamma Inc.', status: 'onboarding', newDocuments: 1, lastActivity: '2024-07-17' },
    { id: 'delta', name: 'Delta Industries', status: 'active', newDocuments: 5, lastActivity: '2024-07-16' },
    { id: 'epsilon', name: 'Epsilon Global', status: 'inactive', newDocuments: 0, lastActivity: '2024-05-20' },
];

export default function ClientsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    const filteredClients = mockClients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectClient = (clientId: string) => {
        localStorage.setItem('selectedClientId', clientId);
        window.dispatchEvent(new Event('storage'));
        router.push('/dashboard/documents');
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
                <Button>
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
                                <TableHead>Nouveaux documents</TableHead>
                                <TableHead>Dernière activité</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClients.length > 0 ? filteredClients.map(client => (
                                <TableRow key={client.id}>
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
                                        <Button variant="outline" size="sm" onClick={() => handleSelectClient(client.id)}>
                                            Ouvrir le dossier
                                        </Button>
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
        </div>
    )
}
