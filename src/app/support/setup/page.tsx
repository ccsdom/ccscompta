
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, AlertCircle, DatabaseZap } from "lucide-react";
import Link from "next/link";
import { Logo } from '@/components/logo';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const firestoreRules = `
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // --- FONCTIONS D'AIDE BASÉES SUR LE JETON D'AUTH (CUSTOM CLAIMS) ---
    function getCallerRole() {
      // Lit le rôle directement à partir du jeton d'authentification (rapide et gratuit)
      return request.auth.token.role; 
    }
    
    function isStaff() {
      return request.auth != null && getCallerRole() in ['admin', 'accountant', 'secretary'];
    }
    
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return request.auth != null && getCallerRole() == 'admin';
    }

    // --- COLLECTION D'UTILISATEURS ('clients') ---
    match /clients/{userId} {
      allow read, list: if isStaff() || isOwner(userId);
      // Règle cruciale : Autorise un nouvel utilisateur à créer son propre profil.
      allow create: if request.auth.uid == userId;
      // Seul un admin peut supprimer un utilisateur.
      allow delete: if isAdmin();
      // Un utilisateur ne peut pas changer son propre rôle, sauf s'il est admin.
      allow update: if (isOwner(userId) && !("role" in request.resource.data)) || isAdmin();
    }

    // --- AUTRES COLLECTIONS ---

    match /documents/{docId} {
      allow read, list: if isStaff() || (request.auth.uid == resource.data.clientId);
      allow create: if request.auth.uid == request.resource.data.clientId;
      allow update: if isStaff() || (request.auth.uid == resource.data.clientId);
      allow delete: if isStaff() || (request.auth.uid == resource.data.clientId);
    }
    
    match /invoices/{invoiceId} {
        allow read, list: if isStaff() || (request.auth.uid == resource.data.clientId);
        allow create, update, delete: if isStaff();
    }
    
     match /bilans/{bilanId} {
        allow read, list: if isStaff() || (request.auth.uid == resource.data.clientId);
        allow create, update, delete: if isStaff();
    }
  }
}
`.trim();

export default function SetupPage() {
    const { toast } = useToast();

    const copyToClipboard = (text: string | null) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({
            title: "Copié !",
            description: "Les règles ont été copiées dans le presse-papiers.",
        });
    }

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
       <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
         <Link href="/" className="flex items-center gap-2 font-semibold" legacyBehavior>
           <Logo className="h-6 w-6 text-primary" />
           <span className="font-bold text-lg">CCS Compta</span>
         </Link>
         <nav className="flex items-center gap-4">
           <Button asChild>
             <Link href="/login">Retour à la connexion</Link>
           </Button>
         </nav>
       </div>
     </header>
      <main className="flex-1">
        <section className="py-20 md:py-24">
            <div className="container mx-auto max-w-3xl px-4 space-y-8">
              <div className="text-center">
                <DatabaseZap className="mx-auto h-12 w-12 text-primary mb-4" />
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-display">Configuration Initiale</h1>
                <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Suivez cette étape unique pour sécuriser votre base de données et permettre la création de votre premier compte administrateur.</p>
              </div>

               <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">Règles de Sécurité Firestore</CardTitle>
                        <CardDescription>Ces règles sont nécessaires pour autoriser la création du premier utilisateur.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Action Manuelle Requise</AlertTitle>
                                <AlertDescription>
                                    Copiez ces règles et collez-les dans l'onglet <strong>Règles</strong> de la section <strong>Firestore Database</strong> de votre console Firebase, puis cliquez sur "Publier".
                                </AlertDescription>
                            </Alert>
                                <Textarea readOnly value={firestoreRules} className="h-96 font-mono text-xs bg-muted" />
                            <Button onClick={() => copyToClipboard(firestoreRules)}><Copy className="mr-2 h-4 w-4" /> Copier les règles</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
      </main>
    </div>
  );
}
