
'use client';

import Link from "next/link";
import { Logo } from '@/components/logo';
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
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


export default function PricingPage() {
    const [isYearly, setIsYearly] = useState(false);

    const plans = [
        {
            name: "Indépendant",
            description: "Idéal pour les freelances et petites entreprises.",
            priceMonthly: 29,
            priceYearly: 290,
            features: [
                "1 accès utilisateur",
                "Jusqu'à 50 documents/mois",
                "Extraction IA standard",
                "Support par email"
            ]
        },
        {
            name: "PME",
            description: "Pour les entreprises en croissance.",
            priceMonthly: 79,
            priceYearly: 790,
            features: [
                "5 accès utilisateurs",
                "Jusqu'à 200 documents/mois",
                "Extraction IA avancée",
                "Support prioritaire",
                "Tableaux de bord analytiques"
            ],
            popular: true
        },
        {
            name: "Cabinet",
            description: "La solution complète pour les experts-comptables.",
            priceMonthly: null, // "Contactez-nous"
            priceYearly: null,
            features: [
                "Utilisateurs illimités (comptables et clients)",
                "Documents illimités",
                "Marque blanche",
                "API d'intégration",
                "Support dédié"
            ]
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
                  <NavigationMenuLink asChild className="font-medium text-sm px-4 py-2 rounded-md hover:bg-accent data-[active]:bg-accent/50">
                    <p>À Propos</p>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
               <NavigationMenuItem>
                <Link href="/blog" legacyBehavior passHref>
                  <NavigationMenuLink asChild className="font-medium text-sm px-4 py-2 rounded-md hover:bg-accent data-[active]:bg-accent/50">
                    <p>Blog</p>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
               <NavigationMenuItem>
                <Link href="/support" legacyBehavior passHref>
                  <NavigationMenuLink asChild className="font-medium text-sm px-4 py-2 rounded-md hover:bg-accent data-[active]:bg-accent/50">
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
                    Des tarifs <span className="text-primary">simples et transparents</span>
                </h1>
                <p className="text-muted-foreground mt-6 max-w-3xl mx-auto text-lg">
                    Choisissez le plan qui correspond à vos besoins. Pas de frais cachés, pas de surprises.
                </p>
                <div className="flex items-center justify-center space-x-4 mt-8">
                    <Label htmlFor="billing-cycle" className={!isYearly ? 'text-foreground' : 'text-muted-foreground'}>Mensuel</Label>
                    <Switch id="billing-cycle" checked={isYearly} onCheckedChange={setIsYearly} />
                    <Label htmlFor="billing-cycle" className={isYearly ? 'text-foreground' : 'text-muted-foreground'}>
                        Annuel <span className="text-primary font-semibold">(-2 mois offerts)</span>
                    </Label>
                </div>
            </div>
        </section>

        <section className="py-12 md:py-20 bg-muted/30">
            <div className="container mx-auto max-w-6xl px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                    {plans.map((plan, index) => (
                        <Card key={index} className={cn("flex flex-col", plan.popular && "border-primary ring-2 ring-primary")}>
                            {plan.popular && <div className="bg-primary text-primary-foreground text-center text-sm font-semibold py-1 rounded-t-lg">Le plus populaire</div>}
                             <CardHeader className="text-center">
                                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="text-center mb-6">
                                    {plan.priceMonthly !== null ? (
                                        <>
                                            <span className="text-4xl font-bold">
                                                {isYearly ? plan.priceYearly! / 12 : plan.priceMonthly}€
                                            </span>
                                            <span className="text-muted-foreground">/ mois</span>
                                            {isYearly && <p className="text-sm text-muted-foreground">facturé {plan.priceYearly}€ par an</p>}
                                        </>
                                    ) : (
                                        <p className="text-3xl font-bold h-[56px] flex items-center justify-center">Sur devis</p>
                                    )}
                                </div>
                                <ul className="space-y-3">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <Check className="h-5 w-5 text-primary" />
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" asChild size="lg" variant={plan.popular ? 'default' : 'outline'}>
                                    <Link href={plan.priceMonthly !== null ? "/login" : "/contact"}>
                                        {plan.priceMonthly !== null ? "Choisir ce plan" : "Contactez-nous"}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
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
