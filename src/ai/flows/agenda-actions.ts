
'use server';

import type { AgendaEvent } from '@/lib/types';
import { getClientsForServer } from './client-actions';
import { getYear, getMonth, set, addMonths, lastDayOfMonth } from 'date-fns';

const generateTvaEvents = (client: { id: string; name: string }, currentYear: number): AgendaEvent[] => {
    const events: AgendaEvent[] = [];
    // Générer les échéances de TVA pour l'année en cours
    for (let i = 0; i < 12; i++) {
        const dueDate = set(new Date(currentYear, i, 1), { date: 20 }); // Le 20 de chaque mois
        events.push({
            id: `tva-${client.id}-${currentYear}-${i}`,
            title: `Déclaration TVA - ${client.name}`,
            date: dueDate,
            type: 'tva',
            clientId: client.id,
            clientName: client.name,
        });
    }
    return events;
}

const generateBilanEvent = (client: { id: string; name: string; fiscalYearEndDate: string }, currentYear: number): AgendaEvent | null => {
    if (!client.fiscalYearEndDate) return null;
    
    try {
        const [day, month] = client.fiscalYearEndDate.split('/').map(Number);
        
        // La date de clôture de l'exercice N
        const closeDate = set(new Date(currentYear, month - 1, day), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });

        // L'échéance de dépôt du bilan est 3 mois après la date de clôture
        const dueDate = lastDayOfMonth(addMonths(closeDate, 3));

        return {
            id: `bilan-${client.id}-${currentYear}`,
            title: `Clôture Bilan - ${client.name}`,
            date: dueDate,
            type: 'bilan',
            clientId: client.id,
            clientName: client.name
        };
    } catch(e) {
        console.error(`Could not parse fiscalYearEndDate for client ${client.name}: ${client.fiscalYearEndDate}`);
        return null;
    }
}


export async function getAgendaEvents(year?: number, month?: number): Promise<AgendaEvent[]> {
    const clients = await getClientsForServer();
    const allEvents: AgendaEvent[] = [];
    
    const targetDate = new Date();
    const currentYear = getYear(targetDate);
    const targetYear = year ?? currentYear;

    clients.forEach(client => {
        // Ajouter les échéances de TVA pour l'année cible
        allEvents.push(...generateTvaEvents(client, targetYear));
        
        // Ajouter l'échéance du bilan
        const bilanEvent = generateBilanEvent(client, targetYear);
        if (bilanEvent) {
            allEvents.push(bilanEvent);
        }

        // Si on est en début d'année, on peut aussi vouloir voir le bilan de l'année précédente
        if(getMonth(targetDate) < 4) { // Si on est avant mai
             const bilanEventLastYear = generateBilanEvent(client, targetYear - 1);
             if (bilanEventLastYear) {
                allEvents.push(bilanEventLastYear);
             }
        }
    });

    if (year !== undefined && month !== undefined) {
         return allEvents.filter(event => 
            getYear(new Date(event.date)) === year && getMonth(new Date(event.date)) === month
        );
    }
    
    return allEvents;
}

    