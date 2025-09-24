
'use client';

import Link from "next/link";
import { Logo } from '@/components/logo';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Users, ShieldCheck, FileJson, CalendarCheck2, BarChart2 } from "lucide-react";
import Image from "next/image";

const features = [
    {
        icon: <Bot className="h-10 w-10 text-primary" />,
        title: "Extraction de Données par IA",
        description: "Notre technologie OCR et IA de pointe lit vos documents, qu'il s'agisse de factures, de reçus ou de relevés bancaires. Elle identifie, extrait et structure automatiquement les informations essentielles : fournisseurs, dates, montants, TVA, et même les lignes de transactions sur un relevé. Fini la saisie manuelle, bonjour la productivité.",
        image: {
            src: "https://picsum.photos/seed/feature-ai/600/400",
            alt: "Illustration de l'intelligence artificielle analysant des documents.",
            hint: "artificial intelligence"
        }
    },
    {
        icon: <Users className="h-10 w-10 text-primary" />,
        title: "Plateforme de Collaboration Intuitive",
        description: "Fini les échanges d'emails interminables. Notre plateforme permet aux comptables et à leurs clients de communiquer directement sur les documents. Posez une question, laissez un commentaire, suivez l'historique des actions. La communication est centralisée, transparente et efficace.",
        image: {
            src: "https://picsum.photos/seed/feature-collab/600/400",
            alt: "Illustration de la collaboration entre plusieurs utilisateurs.",
            hint: "team collaboration"
        }
    },
    {
        icon: <FileJson className="h-10 w-10 text-primary" />,
        title: "Validation et Intégration Simplifiées",
        description: "L'interface de validation permet aux comptables de vérifier les données extraites par l'IA en un clin d'œil. Une fois approuvées, les données sont prêtes à être envoyées vers votre logiciel de production comme Cegid, garantissant des écritures comptables précises et rapides.",
        image: {
            src: "https://picsum.photos/seed/feature-validation/600/400",
            alt: "Illustration d'un flux de validation de données.",
            hint: "data validation"
        }
    },
    {
        icon: <BarChart2 className="h-10 w-10 text-primary" />,
        title: "Tableaux de Bord Analytiques",
        description: "Transformez vos données comptables en informations exploitables. Nos tableaux de bord offrent une vue d'ensemble claire des dépenses par catégorie, par fournisseur, et de l'évolution mensuelle. Un outil puissant pour le pilotage financier, aussi bien pour le cabinet que pour le client.",
        image: {
            src: "https://picsum.photos/seed/feature-analytics/600/400",
            alt: "Graphiques et analyses de données financières.",
            hint: "financial charts"
        }
    },
    {
        icon: <CalendarCheck2 className="h-10 w-10 text-primary" />,
        title: "Gestion Proactive des Échéances",
        description: "Ne manquez plus jamais une date importante. Notre agenda intelligent génère automatiquement les échéances de TVA et de bilan pour chaque client en fonction de leur date de clôture fiscale, offrant une vue d'ensemble et une planification sans effort.",
         image: {
            src: "https://picsum.photos/seed/feature-agenda/600/400",
            alt: "Calendrier avec des échéances marquées.",
            hint: "calendar planning"
        }
    },
    {
        icon: <ShieldCheck className="h-10 w-10 text-primary" />,
        title: "Sécurité et Conformité Avant Tout",
        description: "La sécurité de vos données est notre priorité. Nous utilisons les standards de l'industrie pour le stockage et la transmission des informations. Notre plateforme est conçue pour respecter les normes de conformité et garantir la confidentialité et l'intégrité de vos données financières.",
         image: {
            src: "https://picsum.photos/seed/feature-security/600/400",
            alt: "Illustration d'un bouclier protégeant des données.",
            hint: "data security"
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
        <section className="py-20 md:py-24">
            <div className="container mx-auto max-w-5xl px-4 space-y-16">
              <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-display">Toute la puissance de l'IA pour votre comptabilité</h1>
                <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Découvrez en détail comment chaque fonctionnalité de CCS Compta est conçue pour simplifier votre quotidien et optimiser votre productivité.</p>
              </div>

              <div className="space-y-20">
                {features.map((feature, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                        <div className={`md:order-${index % 2 === 0 ? 1 : 2}`}>
                            <div className="flex items-center gap-4 mb-4">
                                {feature.icon}
                                <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-display">{feature.title}</h2>
                            </div>
                            <p className="text-muted-foreground text-lg">{feature.description}</p>
                        </div>
                        <div className={`md:order-${index % 2 === 0 ? 2 : 1}`}>
                            <Card className="overflow-hidden shadow-lg">
                                <CardContent className="p-0">
                                <Image 
                                    src={feature.image.src} 
                                    alt={feature.image.alt}
                                    width={600}
                                    height={400}
                                    className="w-full object-cover"
                                    data-ai-hint={feature.image.hint}
                                />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ))}
              </div>

            </div>
        </section>
      </main>

       <footer className="border-t">
        <div className="container mx-auto max-w-7xl px-4 py-8">
            <div className="flex flex-col-reverse items-center justify-between gap-4 md:flex-row">
                <p className="text-sm text-muted-foreground">
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
