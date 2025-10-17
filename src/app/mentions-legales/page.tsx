
'use client';

import Link from "next/link";
import { Logo } from '@/components/logo';
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
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

export default function MentionsLegalesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" legacyBehavior>
            <a className="flex items-center gap-2 font-semibold">
              <Logo className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">CCS Compta</span>
            </a>
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
                          <div className="mb-2 mt-4 text-lg font-medium">CCS Compta</div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            La comptabilité, réinventée. Automatisez la collecte et la saisie pour vous concentrer sur l'essentiel.
                          </p>
                        </a>
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
                  <NavigationMenuLink active={usePathname() === '/about'} className={navigationMenuTriggerStyle()}>
                    À Propos
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/blog" legacyBehavior passHref>
                  <NavigationMenuLink active={usePathname() === '/blog'} className={navigationMenuTriggerStyle()}>
                    Blog
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/support" legacyBehavior passHref>
                  <NavigationMenuLink active={usePathname() === '/support'} className={navigationMenuTriggerStyle()}>
                    Support
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <div className="flex items-center gap-4">
            <Button asChild><Link href="/login">Se connecter</Link></Button>
          </div>
        </div>
      </header>
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="prose dark:prose-invert max-w-none">
            <h1>Mentions Légales</h1>
            <p className="lead">Informations légales concernant le site CCS Compta.</p>
            
            <h2>1. Éditeur du site</h2>
            <p><strong>Nom de la société :</strong> CCS Compta (dénomination fictive)</p>
            <p><strong>Forme juridique :</strong> Société par Actions Simplifiée (SAS)</p>
            <p><strong>Capital social :</strong> 10 000 €</p>
            <p><strong>Siège social :</strong> 123 Rue de l'Innovation, 75000 Paris, France</p>
            <p><strong>Numéro de téléphone :</strong> +33 1 23 45 67 89</p>
            <p><strong>Adresse e-mail :</strong> contact@ccs-compta.com</p>

            <h2>2. Directeur de la publication</h2>
            <p><strong>Nom du directeur :</strong> Alice Dubois (fictif)</p>
            <p><strong>Qualité :</strong> Présidente de CCS Compta</p>
            
            <h2>3. Hébergement</h2>
            <p>Ce site est hébergé par :</p>
            <p><strong>Hébergeur :</strong> Google Cloud Platform</p>
            <p><strong>Société :</strong> Google LLC</p>
            <p><strong>Adresse :</strong> 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA</p>

            <h2>4. Propriété intellectuelle</h2>
            <p>L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.</p>
            <p>La reproduction de tout ou partie de ce site sur un support électronique quel qu'il soit est formellement interdite sauf autorisation expresse du directeur de la publication.</p>
            
            <h2>5. Données personnelles</h2>
            <p>Les informations recueillies font l’objet d’un traitement informatique destiné à la gestion de la relation client. Conformément à la loi "informatique et libertés" du 6 janvier 1978 modifiée et au Règlement Général sur la Protection des Données (RGPD), vous bénéficiez d’un droit d’accès, de rectification, de suppression et d’opposition aux informations qui vous concernent.</p>
            <p>Pour plus d'informations, veuillez consulter notre <Link href="/politique-de-confidentialite">Politique de Confidentialité</Link>.</p>
          </div>
        </div>
      </main>
      <footer className="border-t bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-16">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
                 <div className="lg:col-span-1">
                    <Link href="/" legacyBehavior>
                        <a className="flex items-center gap-2 mb-4">
                            <Logo className="h-7 w-7 text-primary" />
                            <span className="font-bold text-xl">CCS Compta</span>
                        </a>
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
                      className="text-muted-foreground hover:text-primary">
                      <span className="sr-only">Twitter</span><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
                    </Link>
                    <Link
                      href="#"
                      className="text-muted-foreground hover:text-primary">
                      <span className="sr-only">LinkedIn</span><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
                    </Link>
                 </div>
             </div>
        </div>
      </footer>
    </div>
  );
}
