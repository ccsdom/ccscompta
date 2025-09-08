
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { getAgendaEvents } from '@/ai/flows/agenda-actions';
import type { AgendaEvent } from '@/lib/types';
import { format, getMonth, getYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Building, Percent, BookCheck, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const eventTypeConfig = {
    tva: { label: "Déclaration TVA", icon: Percent, color: 'bg-blue-500' },
    bilan: { label: "Bilan Annuel", icon: BookCheck, color: 'bg-green-500' },
    task: { label: "Tâche", icon: Briefcase, color: 'bg-orange-500' }
};


export default function AgendaPage() {
    const [events, setEvents] = useState<AgendaEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            try {
                const year = getYear(currentMonth);
                const month = getMonth(currentMonth);
                const fetchedEvents = await getAgendaEvents(year, month);
                setEvents(fetchedEvents);
            } catch (error) {
                console.error("Failed to fetch agenda events:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, [currentMonth]);

    const eventsByDate = useMemo(() => {
        return events.reduce((acc, event) => {
            const dateKey = format(event.date, 'yyyy-MM-dd');
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(event);
            return acc;
        }, {} as Record<string, AgendaEvent[]>);
    }, [events]);

    const selectedDayEvents = useMemo(() => {
        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        return eventsByDate[dateKey] || [];
    }, [selectedDate, eventsByDate]);
    
    const DayWithDot = ({ date }: { date: Date }) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const dayEvents = eventsByDate[dateKey];
        if (!dayEvents || dayEvents.length === 0) return null;
        
        return (
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex space-x-1">
                {dayEvents.slice(0, 3).map(event => {
                    const config = eventTypeConfig[event.type];
                    return <div key={event.id} className={`h-2 w-2 rounded-full ${config.color}`} />;
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
                <p className="text-muted-foreground mt-1">
                    Visualisez les échéances fiscales et les événements importants de vos clients.
                </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
                <Card className="lg:col-span-2">
                    <CardContent className="p-2 h-full">
                         {isLoading && !events.length ? (
                            <div className="flex items-center justify-center h-full">
                                <Skeleton className="w-full h-full" />
                            </div>
                         ): (
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(day) => day && setSelectedDate(day)}
                                onMonthChange={setCurrentMonth}
                                month={currentMonth}
                                locale={fr}
                                className="w-full h-full"
                                classNames={{
                                    months: "flex flex-col sm:flex-row space-y-4 sm:space-y-0 h-full",
                                    month: "space-y-4 w-full flex flex-col",
                                    table: "w-full border-collapse flex-1 flex flex-col",
                                    head_row: "flex border-b",
                                    head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.9rem] border-x p-2",
                                    row: "flex w-full mt-0 border-b flex-1",
                                    cell: "w-full text-center text-base p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md border-x first:border-l-0 last:border-r-0 flex flex-col justify-start items-center",
                                    day: "w-full h-auto p-2 font-semibold aria-selected:opacity-100 aspect-square flex items-center justify-center",
                                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-full",
                                    day_today: "bg-accent text-accent-foreground rounded-full",
                                    day_outside: "text-muted-foreground opacity-50",
                                }}
                                components={{
                                    DayContent: DayWithDot
                                }}
                            />
                         )}
                    </CardContent>
                </Card>
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>{format(selectedDate, "eeee dd LLLL yyyy", { locale: fr })}</CardTitle>
                        <CardDescription>Événements pour la journée sélectionnée.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full pr-4 -mr-4">
                            {isLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-20 w-full" />
                                    <Skeleton className="h-20 w-full" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                            ) : selectedDayEvents.length > 0 ? (
                                <ul className="space-y-3">
                                    {selectedDayEvents.map(event => {
                                        const config = eventTypeConfig[event.type];
                                        return (
                                            <li key={event.id} className="p-3 rounded-lg border flex items-start gap-3 bg-background hover:bg-muted/50 transition-colors">
                                                 <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${config.color} text-white shrink-0`}>
                                                    <config.icon className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm">{event.title}</p>
                                                    <div className="flex items-center text-xs text-muted-foreground gap-2 mt-1">
                                                        <Building className="h-3 w-3" />
                                                        <span>{event.clientName}</span>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/dashboard/clients/${event.clientId}`}>
                                                        Voir
                                                    </Link>
                                                </Button>
                                            </li>
                                        )
                                    })}
                                </ul>
                            ) : (
                                <div className="h-full flex items-center justify-center text-center">
                                    <p className="text-sm text-muted-foreground">Aucun événement pour cette date.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                     <CardFooter className="text-xs text-muted-foreground pt-6">
                        L'agenda affiche les échéances importantes générées automatiquement.
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

