
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getCabinetById, getCabinetUserCount } from '@/ai/flows/cabinet-actions';
import type { Cabinet, Client } from '@/lib/types';
import { PlusCircle, Users, Briefcase, Building } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { db } from '@/firebase';


const getStatusBadge = (status: string) => {
    switch(status) {
        case 'active': return <Badge>Actif</Badge>
        case 'inactive': return <Badge variant="outline">Inactif</Badge>
        case 'onboarding': return <Badge variant="secondary">Intégration</Badge>
        default: return <Badge variant="outline">{status}</Badge>
    }
}

const UserTable = ({ users }: { users: Client[] }) => {
    const router = useRouter();
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Statut</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.length > 0 ? users.map(user => (
                    <TableRow key={user.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/clients/${user.id}/edit`)}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                    </TableRow>
                )) : (
                     <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">Aucun utilisateur de ce type.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}

export default function ManageCabinetPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const [cabinet, setCabinet] = useState<Cabinet | null>(null);
    const [loadingCabinet, setLoadingCabinet] = useState(true);

    const usersQuery = useMemoFirebase(() => {
        if (!params.id) return null;
        return query(collection(db, 'clients'), where('cabinetId', '==', params.id));
    }, [params.id]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<Client>(usersQuery);

    useEffect(() => {
        if (params.id) {
            const fetchCabinet = async () => {
                setLoadingCabinet(true);
                const cabinetData = await getCabinetById(params.id);
                setCabinet(cabinetData);
                setLoadingCabinet(false);
            };
            fetchCabinet();
        }
    }, [params.id]);

    const { clients, team } = useMemo(() => ({
        clients: users?.filter(u => u.role === 'client') || [],
        team: users?.filter(u => u.role !== 'client') || [],
    }), [users]);

    if (loadingCabinet || isLoadingUsers) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-9 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
                <div className="flex justify-end">
                    <Skeleton className="h-10 w-40" />
                </div>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                    <CardContent><Skeleton className="h-64 w-full" /></CardContent>
                </Card>
            </div>
        )
    }

    if (!cabinet) {
        return notFound();
    }
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestion du Cabinet</h1>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {cabinet.name}
                    </p>
                </div>
                 <Button onClick={() => router.push(`/dashboard/clients/new?cabinetId=${cabinet.id}`)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter un utilisateur
                </Button>
            </div>
            
            <Card>
                 <CardHeader>
                    <CardTitle>Utilisateurs du Cabinet</CardTitle>
                    <CardDescription>Liste des clients et des membres de l'équipe associés à ce cabinet.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="clients">
                        <TabsList>
                            <TabsTrigger value="clients"><Users className="mr-2 h-4 w-4" />Clients ({clients.length})</TabsTrigger>
                            <TabsTrigger value="team"><Briefcase className="mr-2 h-4 w-4" />Équipe ({team.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="clients" className="mt-4">
                            <UserTable users={clients} />
                        </TabsContent>
                        <TabsContent value="team" className="mt-4">
                            <UserTable users={team} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
