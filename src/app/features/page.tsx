
'use client';

import Link from "next/link";
import { Logo } from '@/components/logo';
import { Button } from "@/components/ui/button";
import { Bot, Users, ShieldCheck, FileJson, CalendarCheck2, BarChart2, MessageSquare, ScanLine, ArrowRight } from "lucide-react";
import Image from "next/image";
import { motion } from 'framer-motion';

const features = [
    {
        icon: <Bot className="h-8 w-8 text-primary" />,
        title: "Extraction de Données par IA",
        description: "Notre technologie OCR et IA de pointe lit vos factures, reçus ou relevés bancaires. Elle extrait et structure automatiquement les informations essentielles (fournisseurs, dates, montants, TVA), éliminant la saisie manuelle et les risques d'erreurs.",
        image: {
            src: "https://picsum.photos/seed/feature1/800/600",
            alt: "Illustration de l'extraction de données par IA",
            hint: "AI data extraction process"
        }
    },
    {
        icon: <Users className="h-8 w-8 text-primary" />,
        title: "Portail Client Collaboratif",
        description: "Offrez à vos clients un espace unique, sécurisé et intuitif pour téléverser leurs documents et suivre leur traitement en temps réel. La communication est centralisée, transparente et efficace.",
        image: {
            src: "https://picsum.photos/seed/feature2/800/600",
            alt: "Tableau de bord du portail client",
            hint: "client dashboard interface"
        }
    },
    {
        icon: <FileJson className="h-8 w-8 text-primary" />,
        title: "Validation et Intégration",
        description: "Vérifiez les données extraites par l'IA en un clin d'œil grâce à une interface claire. Une fois approuvées, elles sont prêtes à être envoyées vers votre logiciel de production (ex: Cegid), garantissant un flux de travail sans couture.",
        image: {
            src: "https://picsum.photos/seed/feature3/800/600",
            alt: "Interface de validation de document",
            hint: "data validation UI"
        }
    },
    {
        icon: <BarChart2 className="h-8 w-8 text-primary" />,
        title: "Tableaux de Bord Analytiques",
        description: "Transformez les données brutes en informations exploitables. Visualisez les dépenses par catégorie, fournisseur, et leur évolution pour un meilleur pilotage financier et des conseils plus pertinents.",
        image: {
            src: "https://picsum.photos/seed/feature4/800/600",
            alt: "Graphiques d'analyse financière",
            hint: "analytics charts graphs"
        }
    },
    {
        icon: <CalendarCheck2 className="h-8 w-8 text-primary" />,
        title: "Gestion Proactive des Échéances",
        description: "Ne manquez plus jamais une date importante. Notre agenda génère automatiquement les échéances de TVA et de bilan pour chaque client, vous permettant d'anticiper et de planifier efficacement.",
        image: {
            src: "https://picsum.photos/seed/feature5/800/600",
            alt: "Calendrier avec les échéances fiscales",
            hint: "calendar deadlines"
        }
    },
    {
        icon: <ScanLine className="h-8 w-8 text-primary" />,
        title: "Scan Mobile",
        description: "Permettez à vos clients de numériser leurs documents directement depuis leur smartphone. L'image est optimisée et téléversée en un instant, pour une collecte encore plus rapide et facile.",
        image: {
            src: "https://picsum.photos/seed/feature6/800/600",
            alt: "Utilisation du scan mobile sur un smartphone",
            hint: "mobile phone scanning"
        }
    },
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
        <section className="py-20 md:py-24 text-center">
            <div className="container mx-auto max-w-4xl px-4">
                 <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl font-display">
                    Des fonctionnalités puissantes, une <span className="text-primary">simplicité radicale</span>.
                </h1>
                <p className="text-muted-foreground mt-6 max-w-3xl mx-auto text-lg">
                    Découvrez comment chaque outil de CCS Compta est conçu pour transformer votre productivité et clarifier votre vision financière.
                </p>
            </div>
        </section>

        <section className="py-12 md:py-20">
            <div className="container mx-auto max-w-6xl px-4 space-y-24">
                {features.map((feature, index) => (
                   <motion.div 
                        key={index} 
                        className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true, amount: 0.3 }}
                    >
                        <div className={index % 2 === 0 ? 'md:order-1' : 'md:order-2'}>
                           <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                             {feature.icon}
                           </div>
                           <h2 className="text-3xl font-bold tracking-tight mb-4 font-display">{feature.title}</h2>
                           <p className="text-muted-foreground text-lg">{feature.description}</p>
                        </div>
                        <div className={index % 2 === 0 ? 'md:order-2' : 'md:order-1'}>
                            <div className="relative rounded-xl bg-muted/50 p-2 ring-1 ring-inset ring-primary/10">
                                <Image 
                                    src={feature.image.src} 
                                    alt={feature.image.alt}
                                    width={800}
                                    height={600}
                                    className="rounded-md shadow-xl"
                                    data-ai-hint={feature.image.hint}
                                />
                            </div>
                        </div>
                   </motion.div>
                ))}
            </div>
        </section>

        {/* --- Call to Action --- */}
        <section className="py-24 bg-muted/30">
            <div className="container mx-auto max-w-4xl px-4 text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
                    Prêt à moderniser votre comptabilité ?
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                    Rejoignez les cabinets et entreprises qui ont choisi de travailler plus intelligemment.
                </p>
                <div className="mt-8">
                    <Button size="lg" asChild>
                        <Link href="/login">Commencer maintenant <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
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

    