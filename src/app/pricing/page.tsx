
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
                                                {isYearly ? Math.floor(plan.priceYearly! / 12) : plan.priceMonthly}€
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
                                    <Link href={plan.priceMonthly !== null ? "/login" : "/support"}>
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

    