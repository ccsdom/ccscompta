
'use client'

import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, PlusCircle, Search, MoreHorizontal, Edit, Trash2, Users, FileText, BadgeCheck } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CabinetDetailsSheet } from '@/components/admin/cabinet-details-sheet';


export interface Cabinet {
    id: string;
    name: string;
    adminName: string;
    adminEmail: string;
    clientCount: number;
    docCount: number;
    status: 'active' | 'inactive' | 'trial';
    creationDate: string;
}

const mockCabinets: Cabinet[] = [
    { id: 'cab_1', name: 'Cabinet Fiduciaire Martin', adminName: 'Pierre Martin', adminEmail: 'pierre.martin@fiducia.fr', clientCount: 15, docCount: 1240, status: 'active', creationDate: '2023-01-15' },
    { id: 'cab_2', name: 'Compta-Expert & Associés', adminName: 'Sophie Lambert', adminEmail: 'sophie@compta-expert.com', clientCount: 42, docCount: 8932, status: 'active', creationDate: '2022-11-20' },
    { id: 'cab_3', name: 'Audit Conseil Dubois', adminName: 'Marie Dubois', adminEmail: 'm.dubois@audit-conseil.fr', clientCount: 8, docCount: 530, status: 'trial', creationDate: '2024-07-01' },
    { id: 'cab_4', name: 'Mon-Comptable.net', adminName: 'Julien Petit', adminEmail: 'julien.petit@mon-comptable.net', clientCount: 120, docCount: 25780, status: 'active', creationDate: '2021-05-10' },
    { id: 'cab_5', name: 'Ancienne Firm Co', adminName: 'Laura Ancien', adminEmail: 'laura@ancienne.com', clientCount: 0, docCount: 0, status: 'inactive', creationDate: '2022-02-18' },
];

export default function CabinetsPage() {
    const [cabinets, setCabinets] = useState<Cabinet[]>(mockCabinets);
    const [searchTerm, setSearchTerm] = useState('');
    const [cabinetToDelete, setCabinetToDelete] = useState<Cabinet | null>(null);
    const [selectedCabinet, setSelectedCabinet] = useState<Cabinet | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const router = useRouter();

    const filteredCabinets = cabinets.filter(cabinet =>
        cabinet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cabinet.adminName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const platformStats = useMemo(() => ({
        totalCabinets: cabinets.length,
        totalClients: cabinets.reduce((acc, cab) => acc + cab.clientCount, 0),
        totalDocuments: cabinets.reduce((acc, cab) => acc + cab.docCount, 0),
        activeCabinets: cabinets.filter(cab => cab.status === 'active').length,
    }), [cabinets]);


    const handleDeleteCabinet = (cabinet: Cabinet) => {
        setCabinets(prev => prev.filter(c => c.id !== cabinet.id));
        setCabinetToDelete(null);
    }
    
    const handleManageCabinet = (cabinet: Cabinet) => {
        setSelectedCabinet(cabinet);
        setIsSheetOpen(true);
    }
    
    const handleUpdateCabinetStatus = (cabinetId: string, status: Cabinet['status']) => {
        setCabinets(prev => prev.map(c => c.id === cabinetId ? {...c, status} : c));
    }


    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'active': return <Badge>Actif</Badge>
            case 'inactive': return <Badge variant="outline">Inactif</Badge>
            case 'trial': return <Badge variant="secondary">Essai</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tableau de bord Super-Administrateur</h1>
                    <p className="text-muted-foreground mt-1">Supervisez l'ensemble de l'activité de la plateforme.</p>
                </div>
                <Button onClick={() => alert('Feature non implémentée.')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nouveau Cabinet
                </Button>
            </div>
            
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total des Cabinets</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{platformStats.totalCabinets}</div>
                        <p className="text-xs text-muted-foreground">Cabinets inscrits sur la plateforme.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total des Clients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{platformStats.totalClients.toLocaleString('fr-FR')}</div>
                        <p className="text-xs text-muted-foreground">Clients gérés tous cabinets confondus.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total des Documents</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{platformStats.totalDocuments.toLocaleString('fr-FR')}</div>
                        <p className="text-xs text-muted-foreground">Documents traités sur la plateforme.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cabinets Actifs</CardTitle>
                        <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{platformStats.activeCabinets} / {platformStats.totalCabinets}</div>
                        <p className="text-xs text-muted-foreground">Cabinets avec un statut "Actif".</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Liste des cabinets</CardTitle>
                            <CardDescription>Parcourez les cabinets ou recherchez un dossier spécifique.</CardDescription>
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
                                <TableHead>Nom du Cabinet</TableHead>
                                <TableHead>Administrateur</TableHead>
                                <TableHead>Clients</TableHead>
                                <TableHead>Documents (Total)</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCabinets.length > 0 ? filteredCabinets.map(cabinet => (
                                <TableRow key={cabinet.id} className="group">
                                    <TableCell className="font-medium flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                            <Building2 className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        {cabinet.name}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8 border">
                                                <AvatarFallback>{cabinet.adminName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm">{cabinet.adminName}</p>
                                                <p className="text-xs text-muted-foreground">{cabinet.adminEmail}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{cabinet.clientCount}</TableCell>
                                    <TableCell>{cabinet.docCount.toLocaleString('fr-FR')}</TableCell>
                                    <TableCell>{getStatusBadge(cabinet.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handleManageCabinet(cabinet)}>
                                                Gérer
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Plus d'actions</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => alert('Feature non implémentée')}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Modifier
                                                    </DropdownMenuItem>
                                                     <DropdownMenuItem className="text-destructive" onClick={() => setCabinetToDelete(cabinet)}>
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
                                        Aucun cabinet trouvé.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AlertDialog open={!!cabinetToDelete} onOpenChange={(open) => !open && setCabinetToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action est irréversible. Le cabinet "{cabinetToDelete?.name}" sera définitivement supprimé, ainsi que tous les comptes et documents qui lui sont associés.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setCabinetToDelete(null)}>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={() => cabinetToDelete && handleDeleteCabinet(cabinetToDelete)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <CabinetDetailsSheet 
                cabinet={selectedCabinet}
                isOpen={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                onUpdateStatus={handleUpdateCabinetStatus}
            />
        </div>
    )

}
