
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import type { Client } from '@/app/dashboard/clients/page';

const jsonFilePath = path.join(process.cwd(), 'src', 'data', 'clients.json');

async function readClients(): Promise<Client[]> {
    try {
        const fileContent = await fs.readFile(jsonFilePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        // If the file doesn't exist, return an empty array
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function writeClients(clients: Client[]): Promise<void> {
    await fs.writeFile(jsonFilePath, JSON.stringify(clients, null, 4), 'utf-8');
}

export async function getClients(): Promise<Client[]> {
    return await readClients();
}

export async function getClientById(id: string): Promise<Client | undefined> {
    const clients = await readClients();
    return clients.find(client => client.id === id);
}

export async function addClient(newClientData: Omit<Client, 'id' | 'newDocuments' | 'lastActivity'>): Promise<Client> {
    const clients = await readClients();
    const newClient: Client = {
        ...newClientData,
        id: crypto.randomUUID(),
        newDocuments: 0,
        lastActivity: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    };
    const updatedClients = [...clients, newClient];
    await writeClients(updatedClients);
    return newClient;
}

export async function updateClient(id: string, updatedData: Partial<Omit<Client, 'id'>>): Promise<Client | null> {
    const clients = await readClients();
    const clientIndex = clients.findIndex(client => client.id === id);

    if (clientIndex === -1) {
        return null;
    }

    const updatedClient = {
        ...clients[clientIndex],
        ...updatedData,
    };

    clients[clientIndex] = updatedClient;
    await writeClients(clients);
    return updatedClient;
}

export async function deleteClient(id: string): Promise<boolean> {
    const clients = await readClients();
    const updatedClients = clients.filter(client => client.id !== id);

    if (clients.length === updatedClients.length) {
        return false; // Client not found
    }

    await writeClients(updatedClients);
    return true;
}
