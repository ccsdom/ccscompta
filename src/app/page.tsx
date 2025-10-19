
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/logo';
import { ArrowRight, Bot, Users, CheckSquare, UploadCloud, ScanSearch, Building, Briefcase, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import React from 'react';
import { usePathname } from "next/navigation";
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';

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
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
        </a>
      </NavigationMenuLink>
    </li>
  )
});
ListItem.displayName = "ListItem";

export default function LandingPage() {
  const pathname = usePathname();

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
      answer: "Absolument. Nous utilisons des protocoles de chiffrement de pointe et les infrastructures sécurisées de Google Cloud pour garantir que vos données sont protégées en permanence."
    },
    {
      question: "La mise en place est-elle compliquée ?",
      answer: "Pas du tout ! CCS Compta est conçu pour être intuitif. La création de votre cabinet et de vos premiers clients peut se faire en quelques minutes."
    },
    {
      question: "Quels types de documents puis-je traiter ?",
      answer: "Notre IA reconnaît factures, tickets de caisse, notes de frais et relevés bancaires pour un rapprochement facile."
    }
  ];

  const features = [
    { icon: <Bot className="h-6 w-6" />, title: "Extraction par IA", description: "Notre IA analyse vos documents et pré-remplit les informations." },
    { icon: <Users className="h-6 w-6" />, title: "Portail Collaboratif", description: "Comptables et clients collaborent sur la même plateforme." },
    { icon: <CheckSquare className="h-6 w-6" />, title: "Validation Simplifiée", description: "Vérifiez et approuvez les données en un clic." },
  ];

  const howItWorks = [
    { icon: <UploadCloud className="h-10 w-10 text-primary" />, step: 1, title: "Téléversement Facile", description: "Le client envoie ses documents rapidement depuis n'importe où." },
    { icon: <ScanSearch className="h-10 w-10 text-primary" />, step: 2, title: "Analyse par l'IA", description: "L'IA extrait et structure les données essentielles." },
    { icon: <CheckSquare className="h-10 w-10 text-primary" />, step: 3, title: "Validation en un Clic", description: "Le comptable valide les informations avant intégration." },
  ];

  const navLinks = [
    { href: "/features", text: "Fonctionnalités" },
    { href: "/pricing", text: "Tarifs" },
    { href: "/about", text: "À Propos" },
    { href: "/blog", text: "Blog" },
    { href: "/support", text: "Support" }
  ];


  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/">
            <div className="flex items-center gap-2 font-semibold">
                <Logo className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg hidden sm:inline-block">CCS Compta</span>
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
                        <Link href="/">
                          <div
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                          >
                            <Logo className="h-6 w-6" />
                            <div className="mb-2 mt-4 text-lg font-medium">CCS Compta</div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              La comptabilité, réinventée. Automatisez la collecte et la saisie pour vous concentrer sur l'essentiel.
                            </p>
                          </div>
                        </Link>
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
                  <NavigationMenuLink className={navigationMenuTriggerStyle()} active={pathname === '/about'}>
                    À Propos
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/blog" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()} active={pathname === '/blog'}>
                    Blog
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/support" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()} active={pathname === '/support'}>
                    Support
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-2">
            <Button asChild className="hidden md:inline-flex">
              <Link href="/login">Se connecter</Link>
            </Button>
            <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Ouvrir le menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                     <nav className="grid gap-6 text-lg font-medium mt-8">
                       <SheetClose asChild>
                       <Link href="/">
                        <div className="flex items-center gap-2 text-lg font-semibold mb-4">
                         <Logo className="h-6 w-6 text-primary" />
                         <span className="font-bold text-lg">CCS Compta</span>
                        </div>
                       </Link>
                       </SheetClose>
                       {navLinks.map(link => (
                         <SheetClose asChild key={link.href}>
                           <Link href={link.href} className="text-muted-foreground hover:text-foreground">
                             {link.text}
                           </Link>
                         </SheetClose>
                       ))}
                       <SheetClose asChild>
                         <Link href="/login" className="font-semibold text-primary hover:text-primary/90">Se connecter</Link>
                       </SheetClose>
                     </nav>
                  </SheetContent>
                </Sheet>
              </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-24 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <Badge variant="outline" className="mb-4">
                <Bot className="h-4 w-4 mr-2"/> La puissance de l'IA au service de votre compta
              </Badge>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-display">
                La comptabilité, <br /> réinventée pour les <span className="text-primary">cabinets modernes</span>.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                Automatisez la collecte et la saisie des documents comptables. Libérez du temps pour ce qui compte vraiment : le conseil client.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/login">
                    Démarrer maintenant <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/features">Découvrir les fonctionnalités</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-12 md:py-20">
            <div className="container mx-auto max-w-5xl px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    {features.map((feature, index) => (
                        <div key={index}>
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                                {feature.icon}
                            </div>
                            <h3 className="text-lg font-semibold">{feature.title}</h3>
                            <p className="mt-1 text-muted-foreground text-sm">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        <section className="py-12 md:py-20 bg-muted/30">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="grid md:grid-cols-2 gap-16 items-center">
                <div>
                   <h2 className="text-3xl font-bold tracking-tight font-display mb-4">Un flux de travail <span className="text-primary">sans friction</span>.</h2>
                   <p className="text-muted-foreground text-lg mb-8">
                     De la réception du document à son intégration dans votre logiciel de production, chaque étape est optimisée.
                   </p>
                    <div className="space-y-6">
                      {howItWorks.map((step) => (
                        <div key={step.step} className="flex items-start gap-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background border shadow-sm shrink-0">
                            {step.icon}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{step.title}</h3>
                            <p className="text-muted-foreground">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                </div>
                <div>
                    <Image src="https://picsum.photos/seed/dashboard/800/1000" alt="Dashboard de l'application CCS Compta" width={800} height={1000} className="rounded-xl shadow-2xl" data-ai-hint="application dashboard screenshot" />
                </div>
            </div>
          </div>
        </section>
        
        <section className="py-24">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight font-display">Conçu pour <span className="text-primary">tous les acteurs</span> du cabinet</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <Card>
                        <CardHeader>
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-2">
                                <Building className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold">Pour les Clients</h3>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Un portail simple pour déposer des documents, suivre leur statut et communiquer, réduisant ainsi les échanges d'e-mails.</p>
                        </CardContent>
                    </Card>
                    <Card className="border-primary ring-2 ring-primary">
                         <CardHeader>
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-2">
                                <Briefcase className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold">Pour les Experts-Comptables</h3>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Supervisez tous vos dossiers, accédez à des analyses et concentrez-vous sur des missions à plus forte valeur ajoutée.</p>
                        </CardContent>
                    </Card>
                     <Card>
                         <CardHeader>
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-2">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold">Pour les Collaborateurs</h3>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Un outil centralisé pour traiter les documents, poser des questions et préparer les écritures, le tout de manière fluide.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight font-display">
              Ils nous font confiance
            </h2>
            <p className="mt-3 text-muted-foreground">Rejoignez les cabinets et entreprises qui ont choisi de travailler plus intelligemment.</p>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="text-left">
                  <CardContent className="p-6">
                    <p className="text-muted-foreground">"{testimonial.text}"</p>
                  </CardContent>
                  <CardHeader className="flex flex-row items-center gap-4 pt-0">
                    <Avatar>
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        <section className="py-24">
            <div className="container mx-auto max-w-3xl text-center">
                 <h2 className="text-3xl font-bold tracking-tight font-display mb-8">
                    Questions fréquentes
                </h2>
                <Accordion type="single" collapsible className="w-full text-left">
                    {faqs.map((faq, index) => (
                         <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger className="text-lg font-semibold">{faq.question}</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground text-base">
                               {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>

        <section className="py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Prêt à transformer votre cabinet ?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
              Demandez une démo personnalisée ou commencez dès aujourd'hui.
            </p>
            <div className="mt-8">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/login">
                  Commencer l'aventure <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
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
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

    