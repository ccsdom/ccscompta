
'use client';

import Link from "next/link";
import { Logo } from '@/components/logo';
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import React from 'react';
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

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
        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
          {children}
        </p>
      </a>
    </NavigationMenuLink>
  </li>
));
ListItem.displayName = "ListItem";

export default function MentionsLegalesPage() {
  const pathname = usePathname();
  const navLinks = [
    { href: "/features", text: "Fonctionnalités" },
    { href: "/pricing", text: "Tarifs" },
    { href: "/about", text: "À Propos" },
    { href: "/blog", text: "Blog" },
    { href: "/support", text: "Support" }
  ];


  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      {/* HEADER */}
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
                          <div className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md">
                            <Logo className="h-6 w-6" />
                            <div className="mb-2 mt-4 text-lg font-medium">CCS Compta</div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              La comptabilité, réinventée. Automatisez la collecte et la saisie pour vous concentrer sur l'essentiel.
                            </p>
                          </div>
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
                <Link href="/about" passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()} active={pathname === '/about'}>
                    À Propos
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/blog" passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()} active={pathname === '/blog'}>
                    Blog
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/support" passHref>
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
      {/* MAIN CONTENT */}
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="prose dark:prose-invert max-w-none">
            <h1>Mentions Légales</h1>
            <p className="lead">Informations légales concernant le site CCS Compta.</p>

            <h2>1. Éditeur du site</h2>
            <p><strong>Nom :</strong> CCS Compta (fictif)</p>
            <p><strong>Forme juridique :</strong> SAS</p>
            <p><strong>Capital social :</strong> 10 000 €</p>
            <p><strong>Siège social :</strong> 123 Rue de l'Innovation, 75000 Paris, France</p>
            <p><strong>Téléphone :</strong> +33 1 23 45 67 89</p>
            <p><strong>Email :</strong> contact@ccs-compta.com</p>

            <h2>2. Directeur de la publication</h2>
            <p><strong>Nom :</strong> Alice Dubois (fictif)</p>
            <p><strong>Qualité :</strong> Présidente</p>

            <h2>3. Hébergement</h2>
            <p>Hébergeur : Google Cloud Platform</p>
            <p>Société : Google LLC</p>
            <p>Adresse : 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA</p>

            <h2>4. Propriété intellectuelle</h2>
            <p>Tous droits de reproduction réservés, incluant documents téléchargeables et représentations graphiques ou photographiques. Toute reproduction sans autorisation est interdite.</p>

            <h2>5. Données personnelles</h2>
            <p>Les données recueillies sont destinées à la gestion de la relation client et respectent la loi "informatique et libertés" et le RGPD. Vous pouvez exercer vos droits via notre <Link href="/politique-de-confidentialite">Politique de Confidentialité</Link>.</p>
          </div>
        </div>
      </main>
      {/* FOOTER */}
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
              {/* Icônes réseaux */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

    