
'use client';

import Link from "next/link";
import { Logo } from '@/components/logo';
import { Button } from "@/components/ui/button";
import { ShieldCheck, Database, Lock, Globe, FileKey2, Menu } from "lucide-react";
import Image from "next/image";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
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

export default function SecurityPage() {
  const pathname = usePathname();
    const navLinks = [
    { href: "/features", text: "Fonctionnalités" },
    { href: "/pricing", text: "Tarifs" },
    { href: "/about", text: "À Propos" },
    { href: "/blog", text: "Blog" },
    { href: "/support", text: "Support" }
  ];


  const securityFeatures = [
    {
      icon: <Lock className="h-6 w-6 text-primary" />,
      title: "Chiffrement de bout en bout",
      description: "Toutes les données, qu'elles soient en transit ou au repos, sont chiffrées à l'aide de protocoles robustes (TLS 1.3, AES-256). Vos informations sont illisibles, même pour nous."
    },
    {
      icon: <Database className="h-6 w-6 text-primary" />,
      title: "Infrastructure Google Cloud",
      description: "Nous nous appuyons sur l'infrastructure sécurisée de Google. Vos données bénéficient de la même protection que les services de Google."
    },
    {
      icon: <FileKey2 className="h-6 w-6 text-primary" />,
      title: "Règles d'accès granulaires",
      description: "Grâce à Firebase Security Rules, l'accès aux données est strictement cloisonné. Chaque client ne voit que ses documents, et seuls les comptables autorisés y ont accès."
    },
    {
      icon: <Globe className="h-6 w-6 text-primary" />,
      title: "Conformité RGPD",
      description: "Nous respectons le RGPD. Vous gardez le contrôle total sur vos informations et pouvez demander leur suppression à tout moment."
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      {/* --- Header --- */}
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
      {/* --- Main Content --- */}
      <main className="flex-1">
        <section className="py-20 md:py-24 text-center">
          <ShieldCheck className="mx-auto h-16 w-16 text-primary mb-4" />
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl font-display">
            Votre confiance, <span className="text-primary">notre priorité.</span>
          </h1>
          <p className="text-muted-foreground mt-6 max-w-3xl mx-auto text-lg">
            Chez CCS Compta, nous prenons la sécurité de vos données financières très au sérieux.
          </p>
        </section>

        <section className="py-12 md:py-20 bg-muted/30">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0 mt-1">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground mt-1">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1">
                <h2 className="text-3xl font-bold tracking-tight font-display mb-4">Un engagement pour la transparence</h2>
                <p className="text-muted-foreground mb-4">
                  Nos règles d'accès sont claires et auditées. Nous n'accédons jamais à vos données sans votre consentement explicite.
                </p>
                <Button asChild variant="outline">
                  <Link href="/support">Contacter notre équipe sécurité</Link>
                </Button>
              </div>
              <div className="order-1 md:order-2">
                <Image 
                  src="https://picsum.photos/seed/security-lock/800/600"
                  alt="Illustration d'un cadenas numérique"
                  width={800}
                  height={600}
                  className="rounded-xl shadow-lg"
                  data-ai-hint="digital security lock"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      {/* --- Footer --- */}
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
                className="text-muted-foreground hover:text-primary">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary">
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
