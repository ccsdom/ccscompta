
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/logo';
import { ArrowRight, Bot, Users, CheckSquare, UploadCloud, ScanSearch, Building, Briefcase, Handshake, Target, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import React from 'react';
import { usePathname } from "next/navigation";
import { Input } from '@/components/ui/input';

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"


export default function LandingPage() {
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
  const features = [
    {
      icon: <Bot className="h-6 w-6" />,
      title: "Extraction par IA",
      description: "Notre IA analyse vos documents, extrait les données clés et pré-remplit les informations.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Portail Collaboratif",
      description: "Comptables et clients collaborent sur la même plateforme sécurisée.",
    },
    {
      icon: <CheckSquare className="h-6 w-6" />,
      title: "Validation Simplifiée",
      description: "Vérifiez et approuvez les données en un clic avant l'intégration comptable.",
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
  
  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/">
            <div className="flex items-center gap-2 font-semibold">
                <Logo className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">CCS Compta</span>
            </div>
          </Link>
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Découvrir</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                          href="/"
                        >
                          <Logo className="h-6 w-6" />
                          <div className="mb-2 mt-4 text-lg font-medium">
                            CCS Compta
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            La comptabilité, réinventée. Automatisez la collecte et la saisie pour vous concentrer sur l'essentiel.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <ListItem href="/features" title="Fonctionnalités">
                      Découvrez comment l'IA transforme votre productivité.
                    </ListItem>
                    <ListItem href="/pricing" title="Tarifs">
                      Des plans simples et transparents pour tous les besoins.
                    </ListItem>
                    <ListItem href="/security" title="Sécurité">
                      Votre confiance, notre priorité.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                 <Link href="/about" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    À Propos
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                 <Link href="/blog" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Blog
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                 <Link href="/support" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Support
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <div className="flex items-center gap-4">
            <Button asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden">
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
            
            <div className="container relative z-10 mx-auto max-w-6xl px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ duration: 0.5 }}
                        className="text-center md:text-left"
                    >
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl font-display">
                            La comptabilité, <br/><span className="text-primary">sans effort.</span>
                        </h1>
                        <p className="mt-6 max-w-2xl mx-auto md:mx-0 text-lg text-muted-foreground">
                            Arrêtez de courir après les documents. CCS Compta automatise la collecte et la saisie pour que vous puissiez vous concentrer sur ce qui compte vraiment : conseiller vos clients.
                        </p>
                        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:items-start md:justify-start justify-center">
                            <Button size="lg" asChild>
                                <Link href="/login">Démarrer gratuitement <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </div>
                    </motion.div>
                     <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="relative"
                    >
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
        <section id="features" className="py-20 md:py-24">
            <div className="container mx-auto max-w-5xl px-4">
                 <div className="text-center mb-16">
                    <Badge variant="secondary" className="mb-4">Fonctionnalités</Badge>
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
                        Une plateforme tout-en-un
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        De la collecte de documents à l'analyse financière, tout est centralisé.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {features.map((feature, i) => (
                    <motion.div key={i} className="flex flex-col items-start" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}>
                        <div className="flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
                            {feature.icon}
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </motion.div>
                ))}
                </div>
            </div>
        </section>

        
        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 md:py-32 bg-muted/20">
            <div className="container mx-auto max-w-5xl px-4">
                <div className="text-center">
                     <Badge variant="secondary" className="mb-4">Processus</Badge>
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
                        Un flux de travail simplifié
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        Gagnez du temps à chaque étape, de la collecte à la validation.
                    </p>
                </div>
                 <div className="relative mt-20 max-w-xl mx-auto">
                     <div aria-hidden="true" className="absolute left-1/2 h-full w-px -translate-x-1/2 bg-border border-dashed" />
                     {howItWorks.map((step, i) => (
                        <motion.div 
                            key={i}
                            className="relative flex items-start gap-8 mb-16 last:mb-0"
                            initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true, amount: 0.6 }}
                        >
                            <div className="z-10 flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-card shrink-0">
                                {step.icon}
                            </div>
                             <div className={cn("mt-6 text-left", i % 2 === 1 && "md:text-right")}>
                                <Badge variant="outline" className="mb-2">Étape {step.step}</Badge>
                                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                                <p className="text-muted-foreground">{step.description}</p>
                             </div>
                        </motion.div>
                    ))}
                 </div>
            </div>
        </section>
        
        {/* For Who Section */}
        <section id="for-who" className="py-20 md:py-32">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">Public Cible</Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
                Conçu pour les professionnels exigeants
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Que vous soyez un cabinet en croissance ou une entreprise moderne, nous avons la solution.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-8">
                 <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 shrink-0 mb-6">
                  <Building className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Pour les Cabinets Comptables</h3>
                <p className="text-muted-foreground mb-6">Standardisez la collecte, automatisez la saisie et offrez un portail moderne à vos clients. Concentrez-vous sur le conseil à haute valeur ajoutée.</p>
                <Button variant="outline" asChild>
                    <Link href="/features">Découvrir les avantages <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </Card>
              <Card className="p-8">
                 <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 shrink-0 mb-6">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Pour les Entreprises & Indépendants</h3>
                <p className="text-muted-foreground mb-6">Simplifiez la transmission de vos pièces comptables. Suivez leur traitement en temps réel et accédez à des tableaux de bord clairs sur votre activité.</p>
                <Button variant="outline" asChild>
                    <Link href="/features">Voir les fonctionnalités <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 md:py-32 bg-muted/20">
            <div className="container mx-auto max-w-6xl px-4">
                 <div className="text-center">
                    <Badge variant="secondary" className="mb-4">Témoignages</Badge>
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
        <section id="faq" className="py-20 md:py-32 bg-muted/20">
          <div className="container mx-auto max-w-3xl px-4">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">FAQ</Badge>
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
                  <AccordionTrigger className="text-lg font-medium text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground pt-2">
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
      <footer className="border-t bg-background">
       <div className="container mx-auto max-w-7xl px-4 py-16">
           <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
                <div className="lg:col-span-1">
                     <Link href="/">
                        <div className="flex items-center gap-2 mb-4">
                            <Logo className="h-7 w-7 text-primary" />
                            <span className="font-bold text-xl">CCS Compta</span>
                        </div>
                    </Link>
                   <p className="text-muted-foreground max-w-xs text-sm">La comptabilité de demain, dès aujourd'hui. Simplifiez, automatisez, conseillez.</p>
               </div>
               
               <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-2">
                   <div>
                       <p className="font-semibold text-foreground">Produit</p>
                       <nav className="mt-4 flex flex-col space-y-3">
                           <Link href="/features" className="text-sm text-muted-foreground transition-colors hover:text-primary">Fonctionnalités</Link>
                           <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-primary">Tarifs</Link>
                           <Link href="/security" className="text-sm text-muted-foreground transition-colors hover:text-primary">Sécurité</Link>
                       </nav>
                   </div>
                    <div>
                       <p className="font-semibold text-foreground">Entreprise</p>
                       <nav className="mt-4 flex flex-col space-y-3">
                           <Link href="/about" className="text-sm text-muted-foreground transition-colors hover:text-primary">À Propos</Link>
                           <Link href="/blog" className="text-sm text-muted-foreground transition-colors hover:text-primary">Blog</Link>
                           <Link href="/support" className="text-sm text-muted-foreground transition-colors hover:text-primary">Contact</Link>
                       </nav>
                   </div>
                   <div>
                       <p className="font-semibold text-foreground">Légal</p>
                       <nav className="mt-4 flex flex-col space-y-3">
                           <Link href="/mentions-legales" className="text-sm text-muted-foreground transition-colors hover:text-primary">Mentions Légales</Link>
                           <Link href="/politique-de-confidentialite" className="text-sm text-muted-foreground transition-colors hover:text-primary">Politique de Confidentialité</Link>
                       </nav>
                   </div>
               </div>

               <div className="lg:col-span-1">
                    <p className="font-semibold text-foreground">Restez informés</p>
                    <p className="text-muted-foreground text-sm mt-4">Abonnez-vous à notre newsletter pour les dernières nouvelles.</p>
                    <form className="mt-4 flex gap-2">
                       <Input type="email" placeholder="Votre email" className="max-w-xs" />
                       <Button type="submit">S'inscrire</Button>
                    </form>
               </div>
           </div>
            <div className="mt-12 border-t pt-8 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} CCS Compta. Tous droits réservés.</p>
                <div className="flex space-x-4">
                   <Link
                     href="#"
                     className="text-muted-foreground hover:text-primary"
                     >
                      <span className="sr-only">Twitter</span><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
                    </Link>
                   <Link
                     href="#"
                     className="text-muted-foreground hover:text-primary"
                     >
                      <span className="sr-only">LinkedIn</span><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
                    </Link>
                </div>
            </div>
       </div>
     </footer>
    </div>
  );
}

    