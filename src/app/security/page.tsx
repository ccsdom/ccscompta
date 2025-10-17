
'use client';

import Link from "next/link";
import { Logo } from '@/components/logo';
import { Button } from "@/components/ui/button";
import { ShieldCheck, Database, Lock, Globe, FileKey2 } from "lucide-react";
import Image from "next/image";

export default function SecurityPage() {
  const securityFeatures = [
    {
      icon: <Lock className="h-6 w-6 text-primary" />,
      title: "Chiffrement de bout en bout",
      description: "Toutes les données, qu'elles soient en transit ou au repos, sont chiffrées à l'aide de protocoles de sécurité robustes (TLS 1.3, AES-256). Vos informations sont illisibles, même pour nous."
    },
    {
      icon: <Database className="h-6 w-6 text-primary" />,
      title: "Infrastructure Google Cloud",
      description: "Nous nous appuyons sur l'infrastructure sécurisée de Google, l'une des plus fiables au monde. Vos données bénéficient de la même protection que les services de Google."
    },
    {
      icon: <FileKey2 className="h-6 w-6 text-primary" />,
      title: "Règles d'accès granulaires",
      description: "Grâce à Firebase Security Rules, l'accès aux données est strictement cloisonné. Un client ne peut voir que ses propres documents, et seuls les comptables et administrateurs autorisés peuvent y accéder."
    },
    {
      icon: <Globe className="h-6 w-6 text-primary" />,
      title: "Conformité RGPD",
      description: "Nous nous engageons à respecter le Règlement Général sur la Protection des Données. Vous gardez le contrôle total sur vos informations et pouvez demander leur suppression à tout moment."
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
       <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">CCS Compta</span>
          </Link>
          <nav className="flex items-center gap-4">
             <Link href="/features" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:block">Fonctionnalités</Link>
             <Link href="/pricing" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:block">Tarifs</Link>
             <Link href="/security" className="text-sm font-medium text-primary sm:block">Sécurité</Link>
             <Link href="/blog" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:block">Blog</Link>
             <Link href="/about" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:block">À Propos</Link>
             <Link href="/support" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:block">Support</Link>
            <Button asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 md:py-24 text-center">
            <div className="container mx-auto max-w-4xl px-4">
                <ShieldCheck className="mx-auto h-16 w-16 text-primary mb-4" />
                 <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl font-display">
                    Votre confiance, <span className="text-primary">notre priorité.</span>
                </h1>
                <p className="text-muted-foreground mt-6 max-w-3xl mx-auto text-lg">
                    Chez CCS Compta, nous prenons la sécurité de vos données financières très au sérieux. Découvrez les mesures que nous mettons en place pour garantir la confidentialité et l'intégrité de vos informations.
                </p>
            </div>
        </section>

        <section className="py-12 md:py-20 bg-muted/30">
            <div className="container mx-auto max-w-5xl px-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {securityFeatures.map((feature, index) => (
                        <div key={index} className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0 mt-1">
                                {feature.icon}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">{feature.title}</h3>
                                <p className="text-muted-foreground mt-1">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        <section className="py-20">
             <div className="container mx-auto max-w-6xl px-4">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="order-2 md:order-1">
                        <h2 className="text-3xl font-bold tracking-tight font-display mb-4">Un engagement pour la transparence</h2>
                        <p className="text-muted-foreground mb-4">
                           Nous croyons qu'une sécurité robuste passe aussi par la transparence. Nos règles d'accès sont claires et peuvent être auditées. Nous n'accédons jamais à vos données sans votre consentement explicite dans le cadre du support.
                        </p>
                        <Button asChild variant="outline">
                            <Link href="/support">Contacter notre équipe sécurité</Link>
                        </Button>
                    </div>
                    <div className="order-1 md:order-2">
                         <Image 
                            src="https://picsum.photos/seed/security-lock/800/600"
                            alt="Illustration d'un cadenas numérique"
                            width={800}
                            height={600}
                            className="rounded-xl shadow-lg"
                            data-ai-hint="digital security lock"
                        />
                    </div>
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
                    <Link href="/features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Fonctionnalités</Link>
                    <Link href="/pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Tarifs</Link>
                    <Link href="/security" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Sécurité</Link>
                    <Link href="/about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">À Propos</Link>
                    <Link href="/support" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Support</Link>
                </nav>
            </div>
        </div>
      </footer>
    </div>
  );
}
