
'use client';

import Link from "next/link";
import { Logo } from '@/components/logo';
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, User } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
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


export default function BlogPage() {
  const posts = [
    {
      title: "5 astuces pour optimiser votre processus de clôture comptable avec l'IA",
      category: "Conseils",
      author: "Alice Dubois",
      date: "15 Juillet 2024",
      image: { src: "https://picsum.photos/seed/blog1/800/450", alt: "Personne travaillant sur un ordinateur portable avec des graphiques", hint: "accounting process optimization" },
      excerpt: "La clôture comptable est souvent un processus stressant. Découvrez comment l'intelligence artificielle peut transformer cette tâche en un processus fluide et sans erreur."
    },
    {
      title: "CCS Compta annonce son intégration avec le logiciel Cegid",
      category: "Nouveautés",
      author: "Bruno Petit",
      date: "1 Juillet 2024",
      image: { src: "https://picsum.photos/seed/blog2/800/450", alt: "Logos de CCS Compta et Cegid côte à côte", hint: "software integration logos" },
      excerpt: "Nous sommes fiers d'annoncer notre nouvelle intégration native avec Cegid, permettant une synchronisation transparente de vos données comptables."
    },
    {
      title: "Comment la numérisation des notes de frais révolutionne la vie des entrepreneurs",
      category: "Productivité",
      author: "Carla Moreau",
      date: "20 Juin 2024",
      image: { src: "https://picsum.photos/seed/blog3/800/450", alt: "Smartphone scannant un reçu de restaurant", hint: "mobile receipt scanning" },
      excerpt: "Fini les boîtes à chaussures remplies de reçus ! Le scan mobile change la donne pour la gestion des notes de frais au quotidien."
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
                  <NavigationMenuLink asChild className={cn("font-medium text-sm px-4 py-2 rounded-md hover:bg-accent", usePathname() === "/about" ? "bg-accent/50" : "")}>
                    <p>À Propos</p>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
               <NavigationMenuItem>
                <Link href="/blog" legacyBehavior passHref>
                  <NavigationMenuLink asChild className={cn("font-medium text-sm px-4 py-2 rounded-md hover:bg-accent", usePathname() === "/blog" ? "bg-accent/50" : "")}>
                    <p>Blog</p>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
               <NavigationMenuItem>
                <Link href="/support" legacyBehavior passHref>
                  <NavigationMenuLink asChild className={cn("font-medium text-sm px-4 py-2 rounded-md hover:bg-accent", usePathname() === "/support" ? "bg-accent/50" : "")}>
                    <p>Support</p>
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
                    Notre Blog
                </h1>
                <p className="text-muted-foreground mt-6 max-w-3xl mx-auto text-lg">
                    Conseils, nouveautés et réflexions sur le futur de la comptabilité.
                </p>
            </div>
        </section>

        <section className="py-12 md:py-20 bg-muted/30">
            <div className="container mx-auto max-w-6xl px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post, index) => (
                        <Card key={index} className="overflow-hidden flex flex-col">
                            <Image 
                                src={post.image.src}
                                alt={post.image.alt}
                                width={800}
                                height={450}
                                className="w-full h-48 object-cover"
                                data-ai-hint={post.image.hint}
                            />
                             <CardHeader>
                                <Badge variant="secondary" className="mb-2 w-fit">{post.category}</Badge>
                                <CardTitle className="text-xl h-20">{post.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-muted-foreground">{post.excerpt}</p>
                            </CardContent>
                             <CardFooter className="flex-col items-start gap-4">
                               <div className="text-xs text-muted-foreground flex items-center gap-4">
                                  <span className="flex items-center gap-1.5"><User className="h-3 w-3" /> {post.author}</span>
                                  <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {post.date}</span>
                                </div>
                                <Button variant="outline" className="w-full">Lire l'article <ArrowRight className="ml-2 h-4 w-4" /></Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

      </main>

      <footer className="border-t bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <Logo className="h-7 w-7 text-primary" />
                        <span className="font-bold text-xl">CCS Compta</span>
                    </div>
                    <p className="text-muted-foreground max-w-xs">La comptabilité de demain, dès aujourd'hui. Simplifiez, automatisez, conseillez.</p>
                </div>

                <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-3 lg:col-span-2">
                    <div>
                        <p className="font-semibold text-foreground">Produit</p>
                        <nav className="mt-4 flex flex-col space-y-2 text-sm">
                            <Link href="/features" className="text-muted-foreground transition-colors hover:text-primary">Fonctionnalités</Link>
                            <Link href="/pricing" className="text-muted-foreground transition-colors hover:text-primary">Tarifs</Link>
                            <Link href="/security" className="text-muted-foreground transition-colors hover:text-primary">Sécurité</Link>
                        </nav>
                    </div>
                     <div>
                        <p className="font-semibold text-foreground">Entreprise</p>
                        <nav className="mt-4 flex flex-col space-y-2 text-sm">
                            <Link href="/about" className="text-muted-foreground transition-colors hover:text-primary">À Propos</Link>
                            <Link href="/blog" className="text-muted-foreground transition-colors hover:text-primary">Blog</Link>
                            <Link href="/contact" className="text-muted-foreground transition-colors hover:text-primary">Contact</Link>
                        </nav>
                    </div>
                    <div>
                        <p className="font-semibold text-foreground">Ressources</p>
                        <nav className="mt-4 flex flex-col space-y-2 text-sm">
                            <Link href="/support" className="text-muted-foreground transition-colors hover:text-primary">Support</Link>
                            <Link href="/docs" className="text-muted-foreground transition-colors hover:text-primary">Documentation</Link>
                        </nav>
                    </div>
                </div>
            </div>
             <div className="mt-12 border-t pt-8 flex flex-col items-center justify-between gap-4 md:flex-row">
                 <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} CCS Compta. Tous droits réservés.</p>
                 {/* Social links placeholder */}
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
