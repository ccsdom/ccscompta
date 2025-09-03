'use client'

import { ClientForm } from "../client-form";

export default function NewClientPage() {

    const handleSave = (data: any) => {
        // In a real app, you would save this data to your backend
        console.log("Saving new client:", data);
        // For now, we can just log it and redirect
        alert("Nouveau client ajouté (voir console) ! Redirection vers la liste des clients.");
        window.location.href = '/dashboard/clients';
    }


    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Nouveau Client</h1>
                <p className="text-muted-foreground mt-1">Remplissez les informations ci-dessous pour créer un nouveau dossier client.</p>
            </div>
            <ClientForm onSave={handleSave} />
        </div>
    )
}
