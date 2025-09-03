'use client'

import { ClientForm } from "../client-form";
import type { Client } from '../page';
import { notFound, useParams } from 'next/navigation';

// Mock data fetching function
const getClientById = (id: string): Client | undefined => {
     const mockClients: Client[] = [
        { id: 'alpha', name: 'Entreprise Alpha', siret: '12345678901234', address: '123 Rue de la Paix, 75001 Paris', legalRepresentative: 'Jean Dupont', fiscalYearEndDate: '31/12', status: 'active', newDocuments: 3, lastActivity: '2024-07-16', email: 'contact@alpha.com', phone: '0123456789' },
        { id: 'beta', name: 'Bêta SARL', siret: '23456789012345', address: '45 Avenue des Champs-Élysées, 75008 Paris', legalRepresentative: 'Marie Curie', fiscalYearEndDate: '30/06', status: 'active', newDocuments: 0, lastActivity: '2024-07-15', email: 'compta@beta.eu', phone: '0987654321' },
        { id: 'gamma', name: 'Gamma Inc.', siret: '34567890123456', address: '67 Boulevard Saint-Germain, 75005 Paris', legalRepresentative: 'Louis Pasteur', fiscalYearEndDate: '31/03', status: 'onboarding', newDocuments: 1, lastActivity: '2024-07-17', email: 'factures@gamma.io', phone: '0112233445' },
        { id: 'delta', name: 'Delta Industries', siret: '45678901234567', address: '89 Rue de Rivoli, 75004 Paris', legalRepresentative: 'Simone Veil', fiscalYearEndDate: '30/09', status: 'active', newDocuments: 5, lastActivity: '2024-07-16', email: 'admin@delta-industries.fr', phone: '0655443322' },
        { id: 'epsilon', name: 'Epsilon Global', siret: '56789012345678', address: '101 Avenue Victor Hugo, 75116 Paris', legalRepresentative: 'Charles de Gaulle', fiscalYearEndDate: '31/12', status: 'inactive', newDocuments: 0, lastActivity: '2024-05-20', email: 'support@epsilon.com', phone: '0788990011' },
    ];
    return mockClients.find(c => c.id === id);
}


export default function EditClientPage() {
    const params = useParams<{ id: string }>();
    const client = getClientById(params.id);

    if (!client) {
        notFound();
    }
    
    const handleSave = (data: any) => {
        // In a real app, you would save this data to your backend
        console.log(`Saving client ${params.id}:`, data);
        alert("Modifications enregistrées (voir console) ! Redirection vers la liste des clients.");
        window.location.href = '/dashboard/clients';
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Modifier le Client</h1>
                <p className="text-muted-foreground mt-1">Mettez à jour les informations du dossier pour <span className="font-semibold text-foreground">{client.name}</span>.</p>
            </div>
            <ClientForm client={client} onSave={handleSave} />
        </div>
    )
}
