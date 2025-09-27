
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Network, PlusCircle } from "lucide-react";

export default function CabinetsPage() {

    // Mock data for now
    const cabinets = [
        { id: 'cab-01', name: 'Cabinet Principal (CCS)', users: 3, clients: 150 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestion des Cabinets</h1>
                    <p className="text-muted-foreground mt-1">Gérez les cabinets comptables inscrits sur la plateforme.</p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nouveau Cabinet
                </Button>
            </div>

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
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Utilisateurs:</span>
                                <span className="font-semibold">{cabinet.users}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Clients gérés:</span>
                                <span className="font-semibold">{cabinet.clients}</span>
                            </div>
                            <Button className="w-full mt-2">Gérer le cabinet</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

             <Card className="mt-8 text-center">
                <CardHeader>
                    <CardTitle>Fonctionnalité en cours de développement</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Cette section est une maquette pour la gestion future de multiples cabinets. La logique pour ajouter, modifier et gérer les cabinets sera implémentée dans les prochaines versions.
                    </p>
                </CardContent>
            </Card>

        </div>
    );
}
