
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
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Logo className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline font-bold text-lg">CCS Compta</span>
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
                <Link href="/about" asChild>
                  <NavigationMenuLink active={pathname === "/about"} className={navigationMenuTriggerStyle()}>
                    À Propos
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/blog" asChild>
                  <NavigationMenuLink active={pathname === "/blog"} className={navigationMenuTriggerStyle()}>
                    Blog
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/support" asChild>
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
                       <SheetClose asChild>
                         <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4">
                           <Logo className="h-6 w-6 text-primary" />
                           <span className="font-bold text-lg">CCS Compta</span>
                         </Link>
                       </SheetClose>
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
          {/* Footer identique à FeaturesPage, avec suppression des asChild */}
        </div>
      </footer>
    </div>
  );
}
