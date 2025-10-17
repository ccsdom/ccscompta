
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/logo';
import { ArrowRight, Bot, Users, UploadCloud, ScanSearch, CheckSquare, Building, Briefcase, Share2, ShieldCheck, Zap, Scale } from 'lucide-react';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";


export default function LandingPage() {
  const features = [
    {
      icon: <Bot className="h-6 w-6 text-primary" />,
      title: "Extraction par IA",
      description: "Notre IA analyse vos documents, extrait les données clés et pré-remplit les informations pour vous faire gagner un temps précieux.",
    },
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: "Portail Collaboratif",
      description: "Comptables et clients collaborent sur la même plateforme. Posez des questions et laissez des commentaires directement sur les documents.",
    },
    {
      icon: <CheckSquare className="h-6 w-6 text-primary" />,
      title: "Validation Simplifiée",
      description: "Vérifiez et approuvez les données extraites en un clic, assurant l'exactitude avant l'intégration comptable.",
    },
  ];

  const howItWorks = [
    {
        icon: <UploadCloud className="h-10 w-10 text-primary" />,
        step: 1,
        title: "Téléversement Facile",
        description: "Le client envoie ses documents de n'importe où, en quelques clics ou par un simple scan depuis son mobile."
    },
    {
        icon: <ScanSearch className="h-10 w-10 text-primary" />,
        step: 2,
        title: "Analyse par l'IA",
        description: "L'intelligence artificielle extrait et structure les données essentielles (fournisseur, dates, montants, TVA)."
    },
    {
        icon: <CheckSquare className="h-10 w-10 text-primary" />,
        step: 3,
        title: "Validation en un Clic",
        description: "Le comptable vérifie et valide les informations, qui sont alors prêtes pour être intégrées en production."
    }
  ];

  const testimonials = [
    {
      name: "Alain D.",
      role: "Expert-Comptable, Cabinet Fidu-Conseil",
      avatar: "https://randomuser.me/api/portraits/men/75.jpg",
      text: "CCS Compta a divisé par deux le temps que nous passions sur la saisie manuelle. C'est une révolution pour notre cabinet et la relation avec nos clients est plus fluide que jamais.",
    },
    {
      name: "Sophie L.",
      role: "Gérante, PME 'Innov-Solutions'",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
      text: "En tant que dirigeante, je n'ai plus à me soucier de la paperasse. Je prends une photo, je l'envoie, et c'est tout. L'application me donne une visibilité claire sur mes dépenses, c'est simple et efficace !",
    },
  ];

  const faqs = [
      {
          question: "La sécurité de mes données est-elle garantie ?",
          answer: "Absolument. Nous utilisons des protocoles de chiffrement de pointe et les infrastructures sécurisées de Google Cloud pour garantir que vos données sont protégées en permanence. L'accès est strictement contrôlé par des règles de sécurité robustes."
      },
      {
          question: "La mise en place est-elle compliquée ?",
          answer: "Pas du tout ! CCS Compta est conçu pour être intuitif. La création de votre cabinet et de vos premiers clients peut se faire en quelques minutes. De plus, notre assistant IA peut pré-remplir les informations des entreprises pour accélérer encore le processus."
      },
      {
          question: "Quels types de documents puis-je traiter ?",
          answer: "Notre IA est entraînée pour reconnaître une grande variété de documents comptables : factures d'achat, factures de vente, tickets de caisse, notes de frais, et même les relevés bancaires pour un rapprochement facilité."
      }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">CCS Compta</span>
          </Link>
          <nav className="flex items-center gap-4">
             <Link href="/features" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:block">
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
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 overflow-hidden">
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background z-10"></div>
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
            
            <div className="container relative z-20 mx-auto max-w-6xl px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                        <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1 font-medium">
                            La comptabilité du futur est arrivée
                        </Badge>
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl font-display">
                            La comptabilité, <span className="text-primary">sans effort.</span>
                        </h1>
                        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
                            Arrêtez de courir après les documents. CCS Compta automatise la collecte et la saisie pour que vous puissiez vous concentrer sur ce qui compte vraiment : conseiller vos clients.
                        </p>
                        <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                            <Button size="lg" asChild>
                                <Link href="/login">Démarrer gratuitement <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </div>
                    </motion.div>
                     <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}>
                        <div className="relative rounded-xl bg-muted/50 p-2 ring-1 ring-inset ring-primary/10">
                            <Image 
                                src="https://picsum.photos/seed/dashboard-ui/1200/900" 
                                alt="Dashboard de l'application CCS Compta"
                                width={1200}
                                height={900}
                                className="rounded-md shadow-2xl"
                                data-ai-hint="dashboard application"
                                priority
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-24 bg-muted/30">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
                    Une plateforme, des possibilités infinies
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                    Découvrez les outils conçus pour transformer votre productivité.
                </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {features.map((feature, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}>
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold mt-6 mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                 </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 md:py-32">
            <div className="container mx-auto max-w-4xl px-4">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
                        Un processus simple en 3 étapes
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        Gagnez du temps à chaque étape, de la collecte à la validation.
                    </p>
                </div>
                 <div className="relative mt-20">
                     <div aria-hidden="true" className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border border-dashed" />
                     {howItWorks.map((step, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.2 }}
                            viewport={{ once: true, amount: 0.5 }}
                            className="relative flex flex-col items-center mb-12"
                        >
                            <div className="z-10 flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-primary/10 shrink-0 relative">
                                {step.icon}
                                <div className="absolute -top-3 -right-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl ring-4 ring-background">{step.step}</div>
                            </div>
                             <div className="mt-6 text-center">
                                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                                <p className="text-muted-foreground max-w-xs">{step.description}</p>
                             </div>
                        </motion.div>
                     ))}
                 </div>
            </div>
        </section>
        
        {/* For Who Section */}
        <section id="for-who" className="py-20 md:py-32 bg-muted/30">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
                Conçu pour les professionnels exigeants
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Que vous soyez un cabinet en croissance ou une entreprise moderne, nous avons la solution.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 shrink-0 mx-auto mb-6">
                  <Building className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Pour les Cabinets Comptables</h3>
                <p className="text-muted-foreground mb-6">Standardisez la collecte, automatisez la saisie et offrez un portail moderne à vos clients. Concentrez-vous sur le conseil à haute valeur ajoutée.</p>
                <Button variant="outline">Découvrir les avantages <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Card>
              <Card className="p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 shrink-0 mx-auto mb-6">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Pour les Entreprises & Indépendants</h3>
                <p className="text-muted-foreground mb-6">Simplifiez la transmission de vos pièces comptables. Suivez leur traitement en temps réel et accédez à des tableaux de bord clairs sur votre activité.</p>
                <Button variant="outline">Voir les fonctionnalités <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 md:py-32">
            <div className="container mx-auto max-w-6xl px-4">
                 <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
                        Ils nous font confiance
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        Découvrez comment CCS Compta transforme le quotidien des cabinets et de leurs clients.
                    </p>
                </div>
                 <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
                    {testimonials.map((testimonial) => (
                        <Card key={testimonial.name} className="overflow-hidden hover:shadow-lg transition-shadow">
                           <CardContent className="p-8">
                                <p className="text-lg font-medium leading-relaxed text-foreground">"{testimonial.text}"</p>
                            </CardContent>
                             <CardHeader className="flex flex-row items-center gap-4 bg-muted/50 p-6">
                                <Avatar className="h-14 w-14 border-2 border-primary/50">
                                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-lg">{testimonial.name}</p>
                                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* Integrations Section */}
        <section id="integrations" className="py-20 md:py-32 text-center">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl font-display">
              S'intègre à vos outils préférés
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              CCS Compta se connecte à votre écosystème pour un flux de travail sans couture.
            </p>
            <div className="mt-12 flex justify-center items-center gap-8">
              <div className="flex items-center justify-center h-20 w-40 p-4 bg-muted/50 rounded-lg">
                <p className="font-bold text-2xl text-muted-foreground">Cegid</p>
              </div>
            </div>
          </div>
        </section>


        {/* FAQ Section */}
        <section id="faq" className="py-20 md:py-32 bg-muted/30">
          <div className="container mx-auto max-w-3xl px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
                Questions fréquentes
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Trouvez les réponses aux questions les plus courantes.
              </p>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-lg font-medium">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24">
            <div className="container mx-auto max-w-4xl px-4 text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
                    Prêt à transformer votre comptabilité ?
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                    Rejoignez les cabinets et entreprises qui ont choisi de travailler plus intelligemment.
                </p>
                <div className="mt-8">
                    <Button size="lg" asChild>
                        <Link href="/login">Créer un compte gratuitement</Link>
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

