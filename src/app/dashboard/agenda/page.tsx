
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, AlertTriangle } from 'lucide-react';


export default function AgendaPage() {
    const [isLoading, setIsLoading] = useState(false);


    if (isLoading) {
        return (
             <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
                    <p className="text-muted-foreground mt-1">
                        Visualisez les échéances fiscales et les événements importants de vos clients.
                    </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
                    <Skeleton className="lg:col-span-2 h-full" />
                    <Skeleton className="h-full" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
                <p className="text-muted-foreground mt-1">
                    Visualisez les échéances fiscales et les événements importants de vos clients.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Fonctionnalité en cours de développement</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="h-96 flex flex-col items-center justify-center text-center p-4">
                        <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="font-semibold text-lg text-foreground">L'agenda arrive bientôt</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md">
                           Cette fonctionnalité est en cours de refonte pour garantir sa stabilité et sa performance. Elle sera de retour dans une future mise à jour.
                        </p>
                     </div>
                </CardContent>
            </Card>
        </div>
    );
}
