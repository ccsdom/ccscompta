
'use client';

import Link from "next/link";
import { Logo } from '@/components/logo';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Users, ShieldCheck, FileJson, CalendarCheck2, BarChart2, MessageSquare, ScanLine } from "lucide-react";
import Image from "next/image";
import { motion } from 'framer-motion';

const features = [
    {
        icon: <Bot className="h-8 w-8 text-primary" />,
        title: "Extraction de Données par IA",
        description: "Notre technologie OCR et IA de pointe lit vos factures, reçus ou relevés bancaires. Elle extrait et structure automatiquement les informations essentielles, éliminant la saisie manuelle.",
    },
    {
        icon: <Users className="h-8 w-8 text-primary" />,
        title: "Portail Client Collaboratif",
        description: "Offrez à vos clients un espace unique pour téléverser leurs documents et suivre leur traitement. La communication est centralisée, transparente et efficace.",
    },
    {
        icon: <FileJson className="h-8 w-8 text-primary" />,
        title: "Validation et Intégration",
        description: "Vérifiez les données extraites par l'IA en un clin d'œil. Une fois approuvées, elles sont prêtes à être envoyées vers votre logiciel de production (ex: Cegid).",
    },
    {
        icon: <BarChart2 className="h-8 w-8 text-primary" />,
        title: "Tableaux de Bord Analytiques",
        description: "Transformez les données en informations exploitables. Visualisez les dépenses par catégorie, fournisseur, et leur évolution pour un meilleur pilotage financier.",
    },
    {
        icon: <CalendarCheck2 className="h-8 w-8 text-primary" />,
        title: "Gestion Proactive des Échéances",
        description: "Ne manquez plus jamais une date importante. Notre agenda génère automatiquement les échéances de TVA et de bilan pour chaque client.",
    },
    {
        icon: <ShieldCheck className="h-8 w-8 text-primary" />,
        title: "Sécurité et Conformité",
        description: "La sécurité de vos données est notre priorité. Nous utilisons les standards de l'industrie pour garantir la confidentialité et l'intégrité de vos données financières.",
    },
    {
        icon: <ScanLine className="h-8 w-8 text-primary" />,
        title: "Scan Mobile",
        description: "Permettez à vos clients de numériser leurs documents directement depuis leur smartphone, pour une collecte encore plus rapide et facile.",
    },
    {
        icon: <MessageSquare className="h-8 w-8 text-primary" />,
        title: "Support par Chatbot IA",
        description: "Un assistant virtuel disponible pour répondre aux questions fréquentes de vos utilisateurs, libérant ainsi du temps pour votre équipe de support.",
    }
];


export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
       <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">CCS Compta</span>
          </Link>
          <nav className="flex items-center gap-4">
             <Link href="/features" className="text-sm font-medium text-primary sm:block">
              Fonctionnalités
            </Link>
             <Link href="/support" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:block">
              Support
            </Link>
            <Button asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 md:py-24">
            <div className="container mx-auto max-w-6xl px-4">
              <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-display">La Plateforme Complète pour la Comptabilité Moderne</h1>
                <p className="text-muted-foreground mt-3 max-w-3xl mx-auto text-lg">Découvrez en détail comment chaque fonctionnalité de CCS Compta est conçue pour simplifier votre quotidien, automatiser les tâches répétitives et optimiser votre productivité.</p>
              </div>

              <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {features.map((feature, index) => (
                   <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.5 }} viewport={{ once: true }}>
                     <Card className="h-full text-center hover:shadow-lg transition-shadow">
                        <CardHeader>
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            {feature.icon}
                        </div>
                        <CardTitle>{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                        </CardContent>
                    </Card>
                   </motion.div>
                ))}
              </div>

            </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto max-w-7xl px-4 py-8">
            <div className="flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">
                <p className="text-sm text-muted-foreground text-center md:text-left">
                    &copy; {new Date().getFullYear()} CCS Compta. Tous droits réservés.
                </p>
                <nav className="flex items-center gap-4">
                    <Link href="/features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                        Fonctionnalités
                    </Link>
                    <Link href="/support" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                        Support
                    </Link>
                </nav>
            </div>
        </div>
      </footer>
    </div>
  );
}
