
'use client';

import Link from "next/link";
import { Logo } from '@/components/logo';
import { Button } from "@/components/ui/button";
import { Bot, Users, ShieldCheck, FileJson, CalendarCheck2, BarChart2, MessageSquare, ScanLine, ArrowRight } from "lucide-react";
import Image from "next/image";
import { motion } from 'framer-motion';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import React from 'react';
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";

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
                  <NavigationMenuLink active={usePathname() === "/about"}>
                    À Propos
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
               <NavigationMenuItem>
                <Link href="/blog" legacyBehavior passHref>
                  <NavigationMenuLink active={usePathname() === "/blog"}>
                    Blog
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
               <NavigationMenuItem>
                <Link href="/support" legacyBehavior passHref>
                  <NavigationMenuLink active={usePathname() === "/support"}>
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

      <footer className="border-t bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-16">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
                 <div className="lg:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <Logo className="h-7 w-7 text-primary" />
                        <span className="font-bold text-xl">CCS Compta</span>
                    </div>
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
                    <Link href="#" className="text-muted-foreground hover:text-primary"><span className="sr-only">Twitter</span><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg></Link>
                    <Link href="#" className="text-muted-foreground hover:text-primary"><span className="sr-only">LinkedIn</span><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg></Link>
                 </div>
             </div>
        </div>
      </footer>
    </div>
  );
}

    