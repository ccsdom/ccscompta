
'use client';

import Link from "next/link";
import { Logo } from '@/components/logo';
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, User, Menu } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import React from 'react';
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => (
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
));
ListItem.displayName = "ListItem";

export default function BlogPage() {
  const pathname = usePathname();

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
                        <Link href="/" className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md">
                          <Logo className="h-6 w-6" />
                          <div className="mb-2 mt-4 text-lg font-medium">CCS Compta</div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            La comptabilité, réinventée. Automatisez la collecte et la saisie pour vous concentrer sur l'essentiel.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <ListItem href="/features" title="Fonctionnalités">Découvrez comment l'IA transforme votre productivité.</ListItem>
                    <ListItem href="/pricing" title="Tarifs">Des plans simples et transparents pour tous les besoins.</ListItem>
                    <ListItem href="/security" title="Sécurité">Votre confiance, notre priorité.</ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/about" legacyBehavior passHref>
                  <NavigationMenuLink active={pathname === "/about"} className={navigationMenuTriggerStyle()}>
                    À Propos
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/blog" legacyBehavior passHref>
                  <NavigationMenuLink active={pathname === "/blog"} className={navigationMenuTriggerStyle()}>
                    Blog
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/support" legacyBehavior passHref>
                  <NavigationMenuLink active={pathname === "/support"} className={navigationMenuTriggerStyle()}>
                    Support
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-4">
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
                     <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4">
                       <Logo className="h-6 w-6 text-primary" />
                       <span className="font-bold text-lg">CCS Compta</span>
                     </Link>
                     {navLinks.map(link => (
                       <SheetClose asChild key={link.href}>
                          <Link href={link.href} className="text-muted-foreground hover:text-foreground">{link.text}</Link>
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
        {/* Section Blog Header */}
        <section className="py-20 md:py-24 text-center">
          <div className="container mx-auto max-w-4xl px-4">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl font-display">Notre Blog</h1>
            <p className="text-muted-foreground mt-6 max-w-3xl mx-auto text-lg">
              Conseils, nouveautés et réflexions sur le futur de la comptabilité.
            </p>
          </div>
        </section>

        {/* Section Posts */}
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

      {/* Footer identique au AboutPage */}
      {/* ... copier le footer corrigé du AboutPage ... */}
    </div>
  );
}
