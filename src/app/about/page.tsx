
'use client';

import Link from "next/link";
import { Logo } from '@/components/logo';
import { Button } from "@/components/ui/button";
import { Building, Users, Handshake, Target, ArrowRight } from "lucide-react";
import Image from "next/image";
import { motion } from 'framer-motion';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import React from 'react';

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


export default function AboutPage() {
  const team = [
    { name: "Alice Dubois", role: "Fondatrice & CEO", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
    { name: "Bruno Petit", role: "Directeur Technique (CTO)", avatar: "https://randomuser.me/api/portraits/men/45.jpg" },
    { name: "Carla Moreau", role: "Responsable Produit", avatar: "https://randomuser.me/api/portraits/women/46.jpg" },
    { name: "David Martin", role: "Développeur Principal", avatar: "https://randomuser.me/api/portraits/men/47.jpg" },
  ];

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
                  <NavigationMenuLink className="font-medium text-sm px-4 py-2 rounded-md hover:bg-accent">
                    À Propos
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
               <NavigationMenuItem>
                <Link href="/blog" legacyBehavior passHref>
                  <NavigationMenuLink className="font-medium text-sm px-4 py-2 rounded-md hover:bg-accent">
                    Blog
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
               <NavigationMenuItem>
                <Link href="/support" legacyBehavior passHref>
                  <NavigationMenuLink className="font-medium text-sm px-4 py-2 rounded-md hover:bg-accent">
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
                    Notre mission : <span className="text-primary">simplifier la comptabilité</span> grâce à la technologie.
                </h1>
                <p className="text-muted-foreground mt-6 max-w-3xl mx-auto text-lg">
                    Nous croyons que les comptables et les entrepreneurs méritent des outils plus intelligents pour pouvoir se concentrer sur la croissance et le conseil, pas sur la paperasse.
                </p>
            </div>
        </section>

        <section className="py-12 md:py-20 bg-muted/30">
            <div className="container mx-auto max-w-6xl px-4">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                         <Image 
                            src="https://picsum.photos/seed/about-us/800/600"
                            alt="Équipe de CCS Compta en réunion"
                            width={800}
                            height={600}
                            className="rounded-xl shadow-lg"
                            data-ai-hint="team meeting office"
                        />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight font-display mb-4">L'histoire de CCS Compta</h2>
                        <p className="text-muted-foreground mb-4">
                            Née de la frustration face aux processus comptables traditionnels, lents et sources d'erreurs, CCS Compta a été fondée en 2023 avec une idée simple : utiliser la puissance de l'intelligence artificielle pour automatiser les tâches répétitives et libérer le potentiel des experts-comptables.
                        </p>
                        <p className="text-muted-foreground">
                            Aujourd'hui, nous sommes fiers de proposer une plateforme qui transforme la collaboration entre les cabinets et leurs clients, en rendant les échanges plus fluides, les données plus fiables et les analyses plus pertinentes.
                        </p>
                    </div>
                </div>
            </div>
        </section>
        
        <section className="py-20 md:py-24">
            <div className="container mx-auto max-w-6xl px-4 text-center">
                <h2 className="text-3xl font-bold tracking-tight font-display mb-12">Nos Valeurs</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4"><Target className="h-6 w-6 text-primary" /></div>
                        <h3 className="text-xl font-semibold">Simplicité</h3>
                        <p className="text-muted-foreground mt-2">Nous concevons des outils intuitifs qui ne nécessitent pas de manuel d'utilisation.</p>
                    </div>
                     <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4"><Handshake className="h-6 w-6 text-primary" /></div>
                        <h3 className="text-xl font-semibold">Partenariat</h3>
                        <p className="text-muted-foreground mt-2">Nous travaillons main dans la main avec les cabinets pour répondre à leurs vrais besoins.</p>
                    </div>
                     <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4"><Building className="h-6 w-6 text-primary" /></div>
                        <h3 className="text-xl font-semibold">Innovation</h3>
                        <p className="text-muted-foreground mt-2">Nous explorons constamment les nouvelles technologies pour améliorer votre quotidien.</p>
                    </div>
                </div>
            </div>
        </section>

        <section className="py-20 md:py-24 bg-muted/30">
            <div className="container mx-auto max-w-5xl px-4 text-center">
                <h2 className="text-3xl font-bold tracking-tight font-display mb-12">Notre Équipe</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {team.map((member, index) => (
                         <motion.div 
                            key={index}
                            className="flex flex-col items-center"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <Image src={member.avatar} alt={member.name} width={96} height={96} className="rounded-full mb-4 shadow-md" />
                            <h4 className="font-semibold">{member.name}</h4>
                            <p className="text-sm text-primary">{member.role}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>

        <section className="py-24">
            <div className="container mx-auto max-w-4xl px-4 text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
                    Rejoignez l'aventure
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                    Prêt à faire partie de la révolution comptable ?
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

    