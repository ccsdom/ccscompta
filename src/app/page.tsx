'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/logo';
import { ArrowRight, Bot, ShieldCheck, Users, UploadCloud, ScanSearch, CheckSquare, Building } from 'lucide-react';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';


export default function LandingPage() {
  const features = [
    {
      icon: <Bot className="h-8 w-8 text-primary" />,
      title: "Extraction par IA",
      description: "Notre IA analyse vos documents, extrait les données clés et pré-remplit les informations pour vous faire gagner un temps précieux.",
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Collaboration en temps réel",
      description: "Comptables et clients collaborent sur la même plateforme. Posez des questions et laissez des commentaires directement sur les documents.",
    },
    {
      icon: <ShieldCheck className="h-8 w-8 text-primary" />,
      title: "Sécurité et Conformité",
      description: "Vos données sont stockées de manière sécurisée et nous garantissons la conformité avec les normes comptables en vigueur.",
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
      text: "CCS Compta a divisé par deux le temps que nous passions sur la saisie manuelle. C'est une révolution pour notre cabinet.",
    },
    {
      name: "Sophie L.",
      role: "Gérante, PME 'Innov-Solutions'",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
      text: "En tant que dirigeante, je n'ai plus à me soucier de la paperasse. Je prends une photo, je l'envoie, et c'est tout. Simple et efficace !",
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
             <Link href="#features" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:block">
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
        <section className="relative py-20 md:py-32">
             <div
                aria-hidden="true"
                className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-40 dark:opacity-20"
              >
                <div className="blur-[106px] h-56 bg-gradient-to-br from-primary to-purple-400 dark:from-blue-700" />
                <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300 dark:to-indigo-600" />
              </div>
          <div className="container relative mx-auto max-w-5xl px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Badge
                    variant="outline"
                    className="mb-6 rounded-full px-4 py-1 font-medium border-primary/30"
                >
                    La comptabilité du futur est arrivée
                </Badge>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl font-display">
                La comptabilité, réinventée. <br/>
                <span className="text-primary">Simple, Intelligente, Collaborative.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                Arrêtez de courir après les documents. CCS Compta automatise la collecte et la saisie pour que vous puissiez vous concentrer sur ce qui compte vraiment : conseiller vos clients.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link href="/login">Commencer maintenant <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                   <Link href="/support">Demander une démo</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="py-20 md:py-32 bg-muted/30">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
                Une plateforme tout-en-un
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                De la collecte de documents à la validation comptable, tout est centralisé.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              {features.map((feature, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}>
                  <Card className="h-full text-center">
                    <CardHeader>
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        {feature.icon}
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                 </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        <section id="how-it-works" className="py-20 md:py-32">
            <div className="container mx-auto max-w-6xl px-4">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
                        Un processus simple en 3 étapes
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        Gagnez du temps à chaque étape, de la collecte à la validation.
                    </p>
                </div>
                <div className="mt-16 grid grid-cols-1 gap-y-12 md:grid-cols-3 md:gap-x-8">
                     {howItWorks.map((step, i) => (
                        <motion.div 
                            key={i} 
                            className="relative flex flex-col items-center text-center"
                            initial={{ opacity: 0, y: 20 }} 
                            whileInView={{ opacity: 1, y: 0 }} 
                            transition={{ delay: i * 0.1, duration: 0.5 }} 
                            viewport={{ once: true }}
                        >
                            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/10 mb-6">
                                {step.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                            <p className="text-muted-foreground">{step.description}</p>
                            {i < howItWorks.length - 1 && (
                                <div className="hidden md:block absolute top-10 left-1/2 w-full translate-x-1/2">
                                    <svg className="w-full h-auto text-gray-200 dark:text-gray-700" viewBox="0 0 100 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5 10 C 25 1, 75 19, 95 10" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                                    </svg>
                                </div>
                            )}
                        </motion.div>
                     ))}
                </div>
            </div>
        </section>

        <section id="for-who" className="py-20 md:py-32 bg-muted/30">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">Conçu pour vous</h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">Que vous soyez un cabinet en croissance ou une entreprise moderne, nous avons la solution.</p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                                <Users className="h-8 w-8 text-primary" />
                            </div>
                            <CardTitle className="text-2xl">Pour les Cabinets Comptables</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                       <p className="text-muted-foreground">Libérez-vous des tâches répétitives et concentrez-vous sur le conseil à forte valeur ajoutée.</p>
                        <ul className="space-y-2 list-disc pl-5">
                            <li><span className="font-semibold">Gain de productivité :</span> Automatisez la saisie et le traitement des pièces comptables.</li>
                            <li><span className="font-semibold">Réduction des erreurs :</span> L'IA minimise les risques d'erreurs manuelles et détecte les anomalies.</li>
                            <li><span className="font-semibold">Relation client améliorée :</span> Offrez à vos clients un portail moderne et collaboratif.</li>
                        </ul>
                    </CardContent>
                </Card>
                 <Card className="flex flex-col">
                    <CardHeader>
                         <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                                <Building className="h-8 w-8 text-primary" />
                            </div>
                            <CardTitle className="text-2xl">Pour les Entreprises</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <p className="text-muted-foreground">Ne perdez plus de temps avec la paperasse et gardez une vision claire sur vos finances.</p>
                        <ul className="space-y-2 list-disc pl-5">
                            <li><span className="font-semibold">Simplicité maximale :</span> Envoyez vos documents par une simple photo ou un téléversement.</li>
                            <li><span className="font-semibold">Zéro papier :</span> Centralisez toutes vos factures et reçus en un seul endroit sécurisé.</li>
                            <li><span className="font-semibold">Visibilité en temps réel :</span> Suivez le statut de vos documents et communiquez facilement avec votre comptable.</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
          </div>
        </section>

         <section id="testimonials" className="py-20 md:py-32">
            <div className="container mx-auto max-w-6xl px-4">
                 <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
                        Ce que nos utilisateurs disent
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        Découvrez comment CCS Compta transforme le quotidien des cabinets et de leurs clients.
                    </p>
                </div>
                 <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
                    {testimonials.map((testimonial) => (
                        <Card key={testimonial.name} className="overflow-hidden">
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

        <section id="faq" className="py-20 md:py-32 bg-muted/30">
            <div className="container mx-auto max-w-4xl px-4">
                 <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">Questions Fréquentes</h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        Trouvez ici les réponses aux questions les plus courantes.
                    </p>
                </div>
                <Accordion type="single" collapsible className="w-full mt-12">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="text-lg">Mes données sont-elles en sécurité ?</AccordionTrigger>
                        <AccordionContent className="text-base text-muted-foreground">
                        Absolument. Nous utilisons un cryptage de pointe et nos serveurs sont hébergés dans des centres de données hautement sécurisés. La confidentialité et la sécurité de vos données financières sont notre priorité absolue.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger className="text-lg">Quels types de documents sont supportés ?</AccordionTrigger>
                        <AccordionContent className="text-base text-muted-foreground">
                        Vous pouvez téléverser la plupart des formats d'image (JPG, PNG) et les fichiers PDF. Notre système est optimisé pour reconnaître les factures d'achat, les factures de vente, les reçus et les relevés bancaires.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger className="text-lg">Est-ce compatible avec mon logiciel de production ?</AccordionTrigger>
                        <AccordionContent className="text-base text-muted-foreground">
                        Oui. CCS Compta est conçu pour s'intégrer facilement avec les principaux logiciels de production comptable, notamment Cegid. Les données validées peuvent être exportées dans un format compatible pour une intégration fluide.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto max-w-7xl px-4 py-8">
            <div className="flex flex-col-reverse items-center justify-between gap-4 md:flex-row">
                <p className="text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} CCS Compta. Tous droits réservés.
                </p>
            </div>
        </div>
      </footer>
    </div>
  );
}
