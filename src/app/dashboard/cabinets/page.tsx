
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Network, PlusCircle, Users } from "lucide-react";
import { getCabinets } from '@/ai/flows/cabinet-actions';
import type { Cabinet } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function CabinetsPage() {
    const [cabinets, setCabinets] = useState<Cabinet[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchCabinets = async () => {
            setLoading(true);
            try {
                const fetchedCabinets = await getCabinets();
                setCabinets(fetchedCabinets);
            } catch (e) {
                console.error("Failed to fetch cabinets", e);
            } finally {
                setLoading(false);
            }
        };
        fetchCabinets();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestion des Cabinets</h1>
                    <p className="text-muted-foreground mt-1">Gérez les cabinets comptables inscrits sur la plateforme.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/cabinets/new')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nouveau Cabinet
                </Button>
            </div>

             {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
            ) : cabinets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cabinets.map(cabinet => (
                        <Card key={cabinet.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <Network className="h-5 w-5 text-muted-foreground"/>
                                    {cabinet.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button className="w-full mt-2" asChild>
                                  <Link href={`/dashboard/cabinets/${cabinet.id}`}>Gérer le cabinet</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                 <Card className="mt-8 text-center col-span-full">
                    <CardHeader>
                        <CardTitle>Aucun cabinet trouvé</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                           Commencez par créer votre premier cabinet pour pouvoir y ajouter des collaborateurs et des clients.
                        </p>
                        <Button onClick={() => router.push('/dashboard/cabinets/new')}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Créer un Cabinet
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
