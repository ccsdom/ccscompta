'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, FileUp, FileCheck, FileClock } from "lucide-react";
import { BarChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const mockAccountantData = {
    totalClients: 12,
    docsUploadedToday: 45,
    docsPendingReview: 12,
    docsApprovedToday: 78,
    activityByClient: [
        { name: 'Epsilon Global', docs: 30 },
        { name: 'Gamma Inc.', docs: 22 },
        { name: 'Alpha', docs: 15 },
        { name: 'Bêta', docs: 8 },
        { name: 'Delta', docs: 5 },
    ].sort((a, b) => b.docs - a.docs),
    recentActivities: [
        { client: 'Epsilon Global', action: '3 documents en attente', time: 'il y a 5 minutes' },
        { client: 'Entreprise Alpha', action: 'A approuvé 2 factures', time: 'il y a 15 minutes' },
        { client: 'Gamma Inc.', action: 'A téléversé 1 relevé bancaire', time: 'il y a 1 heure' },
    ]
}

export default function AccountantDashboard() {

    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">Tableau de bord global</h1>
                <p className="text-muted-foreground mt-1">Vue d'ensemble de l'activité de tous vos clients.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockAccountantData.totalClients}</div>
                        <p className="text-xs text-muted-foreground">Total des dossiers gérés</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Documents du jour</CardTitle>
                        <FileUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{mockAccountantData.docsUploadedToday}</div>
                        <p className="text-xs text-muted-foreground">Téléversés par les clients aujourd'hui</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">En attente d'examen</CardTitle>
                        <FileClock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockAccountantData.docsPendingReview}</div>
                        <p className="text-xs text-muted-foreground">Tous clients confondus</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Validations du jour</CardTitle>
                        <FileCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockAccountantData.docsApprovedToday}</div>
                        <p className="text-xs text-muted-foreground">Documents approuvés par vos soins</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Activité par client (24h)</CardTitle>
                        <CardDescription>Nombre de documents téléversés par les clients les plus actifs.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={{ docs: { label: "Documents", color: "hsl(var(--chart-1))" }}} className="h-[250px] w-full">
                            <BarChart data={mockAccountantData.activityByClient} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} layout="vertical">
                                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={8} width={100} />
                                <XAxis dataKey="docs" type="number" hide />
                                 <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent 
                                        formatter={(value) => `${value} docs`}
                                        indicator="dot" 
                                    />}
                                />
                                <Bar dataKey="docs" fill="var(--color-docs)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card>
                     <CardHeader>
                        <CardTitle>Activités récentes</CardTitle>
                        <CardDescription>Derniers événements sur les dossiers clients.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {mockAccountantData.recentActivities.map((activity, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted mt-1">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{activity.client}</p>
                                        <p className="text-sm text-muted-foreground">{activity.action}</p>
                                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" className="w-full mt-4" asChild>
                            <Link href="/dashboard/clients">Voir tous les clients</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
