
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, HelpCircle, MessageSquare, Bot } from "lucide-react";
import Link from "next/link";
import { Logo } from '@/components/logo';

export default function SupportPage() {

  const faqs = [
    {
      question: "La sécurité de mes données est-elle garantie ?",
      answer: "Absolument. Nous utilisons des protocoles de chiffrement de pointe et les infrastructures sécurisées de Google Cloud pour garantir que vos données sont protégées en permanence. L'accès est strictement contrôlé par des règles de sécurité robustes.",
    },
    {
      question: "La mise en place est-elle compliquée ?",
      answer: "Pas du tout ! CCS Compta est conçu pour être intuitif. La création de votre cabinet et de vos premiers clients peut se faire en quelques minutes. Notre assistant IA peut même pré-remplir les informations des entreprises pour accélérer le processus.",
    },
    {
      question: "Quels types de documents puis-je traiter ?",
      answer: "Notre IA est entraînée pour reconnaître une grande variété de documents comptables : factures d'achat, factures de vente, tickets de caisse, notes de frais, et même les relevés bancaires pour un rapprochement facilité.",
    },
    {
      question: "Comment puis-je contacter mon comptable ?",
      answer: "Dans votre espace client, ouvrez n'importe quel document. Vous y trouverez un onglet 'Commentaires' qui vous permet de communiquer directement avec votre comptable au sujet de ce document spécifique.",
    }
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
             <Link href="/security" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:block">Sécurité</Link>
             <Link href="/blog" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:block">Blog</Link>
             <Link href="/about" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:block">À Propos</Link>
             <Link href="/support" className="text-sm font-medium text-primary sm:block">Support</Link>
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
                <HelpCircle className="mx-auto h-12 w-12 text-primary mb-4" />
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-display">Centre d'Aide</h1>
                <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-lg">Nous sommes là pour vous aider. Trouvez les réponses à vos questions ou contactez directement notre équipe.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <Card className="flex flex-col items-center p-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                        <Bot className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold">ComptaBot IA</h3>
                      <p className="text-muted-foreground text-sm mt-1 mb-4">Obtenez des réponses instantanées à vos questions sur l'utilisation de la plateforme.</p>
                      <Button variant="outline" className="w-full mt-auto">Discuter avec le bot</Button>
                  </Card>
                   <Card className="flex flex-col items-center p-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold">Support par Email</h3>
                      <p className="text-muted-foreground text-sm mt-1 mb-4">Envoyez-nous un email. Nous nous efforçons de répondre en moins de 24h.</p>
                      <Button asChild className="w-full mt-auto">
                        <a href="mailto:support@ccs-compta.com">support@ccs-compta.com</a>
                      </Button>
                  </Card>
                   <Card className="flex flex-col items-center p-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold">Support Téléphonique</h3>
                      <p className="text-muted-foreground text-sm mt-1 mb-4">Notre ligne est ouverte du Lundi au Vendredi, de 9h à 17h.</p>
                      <Button variant="secondary" className="w-full mt-auto text-lg font-bold">01 23 45 67 89</Button>
                  </Card>
              </div>

              <div className="pt-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight font-display">Questions Fréquentes</h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Consultez les réponses aux questions les plus courantes.</p>
                </div>
                 <Card>
                    <CardContent className="p-6">
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="text-lg text-left font-semibold">{faq.question}</AccordionTrigger>
                            <AccordionContent className="pt-2">
                            <p className="text-base text-muted-foreground">{faq.answer}</p>
                            </AccordionContent>
                        </AccordionItem>
                        ))}
                    </Accordion>
                    </CardContent>
                </Card>
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
