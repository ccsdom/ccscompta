
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, HelpCircle, MessageSquare, Bot, Menu } from "lucide-react";
import Link from "next/link";
import { Logo } from '@/components/logo';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import React from 'react';
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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


export default function SupportPage() {
    const navLinks = [
    { href: "/fonctionnalites", text: "Fonctionnalités" },
    { href: "/tarifs", text: "Tarifs" },
    { href: "/a-propos", text: "À Propos" },
    { href: "/blog", text: "Blog" },
    { href: "/assistance", text: "Support" }
  ];
  const pathname = usePathname();


  const faqs = [
    {
      question: "La sécurité de mes données est-elle garantie ?",
      answer: "Absolument. Nous utilisons des protocoles de chiffrement de pointe et les infrastructures sécurisées de Google Cloud pour garantir que vos données sont protégées en permanence. L'accès est strictement contrôlé par des règles de sécurité robustes.",
    },
    {
      question: "La mise en place est-elle compliquée ?",
      answer: "Pas du tout ! CCS Compta est conçu pour être intuitif. La création de votre cabinet et de vos premiers clients peut se faire en quelques minutes. Notre assistant IA peut même pré-remplir les informations des entreprises pour accélérer le processus.",
    },
    {
      question: "Quels types de documents puis-je traiter ?",
      answer: "Notre IA est entraînée pour reconnaître une grande variété de documents comptables : factures d'achat, factures de vente, tickets de caisse, notes de frais, et même les relevés bancaires pour un rapprochement facilité.",
    },
    {
      question: "Comment puis-je contacter mon comptable ?",
      answer: "Dans votre espace client, ouvrez n'importe quel document. Vous y trouverez un onglet 'Commentaires' qui vous permet de communiquer directement avec votre comptable au sujet de ce document spécifique.",
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
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
                       <Link
                         href="/"
                       >
                         <div className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md">
                          <Logo className="h-6 w-6" />
                          <div className="mb-2 mt-4 text-lg font-medium">
                            CCS Compta
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            La comptabilité, réinventée. Automatisez la collecte et la saisie pour vous concentrer sur l'essentiel.
                          </p>
                         </div>
                       </Link>
                     </NavigationMenuLink>
                   </li>
                   <ListItem href="/fonctionnalites" title="Fonctionnalités">
                     Découvrez comment l'IA transforme votre productivité.
                   </ListItem>
                   <ListItem href="/tarifs" title="Tarifs">
                     Des plans simples et transparents pour tous les besoins.
                   </ListItem>
                   <ListItem href="/securite" title="Sécurité">
                     Votre confiance, notre priorité.
                   </ListItem>
                 </ul>
               </NavigationMenuContent>
             </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()} active={pathname === '/a-propos'}>
                  <Link href="/a-propos">À Propos</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()} active={pathname === '/blog'}>
                  <Link href="/blog">Blog</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()} active={pathname === '/assistance'}>
                  <Link href="/assistance">Support</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
           </NavigationMenuList>
         </NavigationMenu>
         <div className="flex items-center gap-2">
            <Button asChild className="hidden md:inline-flex">
             <Link href="/connexion">Se connecter</Link>
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
                          <Link href="/connexion" className="font-semibold text-primary hover:text-primary/90">Se connecter</Link>
                        </SheetClose>
                     </nav>
                  </SheetContent>
                </Sheet>
              </div>
         </div>
       </div>
     </header>
      <main className="flex-1">
        <section className="py-20 md:py-24">
            <div className="container mx-auto max-w-5xl px-4 space-y-16">
              <div className="text-center">
                <HelpCircle className="mx-auto h-12 w-12 text-primary mb-4" />
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-display">Centre d'Aide</h1>
                <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-lg">Nous sommes là pour vous aider. Trouvez les réponses à vos questions ou contactez directement notre équipe.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <Card className="flex flex-col items-center p-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                        <Bot className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold">ComptaBot IA</h3>
                      <p className="text-muted-foreground text-sm mt-1 mb-4">Obtenez des réponses instantanées à vos questions sur l'utilisation de la plateforme.</p>
                      <Button variant="outline" className="w-full mt-auto">Discuter avec le bot</Button>
                  </Card>
                   <Card className="flex flex-col items-center p-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold">Support par Email</h3>
                      <p className="text-muted-foreground text-sm mt-1 mb-4">Envoyez-nous un email. Nous nous efforçons de répondre en moins de 24h.</p>
                      <Button asChild className="w-full mt-auto">
                        <a href="mailto:support@ccs-compta.com">support@ccs-compta.com</a>
                      </Button>
                  </Card>
                   <Card className="flex flex-col items-center p-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold">Support Téléphonique</h3>
                      <p className="text-muted-foreground text-sm mt-1 mb-4">Notre ligne est ouverte du Lundi au Vendredi, de 9h à 17h.</p>
                      <Button variant="secondary" className="w-full mt-auto text-lg font-bold">01 23 45 67 89</Button>
                  </Card>
              </div>

              <div className="pt-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight font-display">Questions Fréquentes</h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Consultez les réponses aux questions les plus courantes.</p>
                </div>
                 <Card>
                    <CardContent className="p-6">
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="text-lg text-left font-semibold">{faq.question}</AccordionTrigger>
                            <AccordionContent className="pt-2">
                            <p className="text-base text-muted-foreground">{faq.answer}</p>
                            </AccordionContent>
                        </AccordionItem>
                        ))}
                    </Accordion>
                    </CardContent>
                </Card>
              </div>
            </div>
        </section>
      </main>
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
                            <Link href="/fonctionnalites" className="text-sm text-muted-foreground transition-colors hover:text-primary">Fonctionnalités</Link>
                            <Link href="/tarifs" className="text-sm text-muted-foreground transition-colors hover:text-primary">Tarifs</Link>
                            <Link href="/securite" className="text-sm text-muted-foreground transition-colors hover:text-primary">Sécurité</Link>
                        </nav>
                    </div>
                     <div>
                        <p className="font-semibold text-foreground">Entreprise</p>
                        <nav className="mt-4 flex flex-col space-y-3">
                            <Link href="/a-propos" className="text-sm text-muted-foreground transition-colors hover:text-primary">À Propos</Link>
                            <Link href="/blog" className="text-sm text-muted-foreground transition-colors hover:text-primary">Blog</Link>
                            <Link href="/assistance" className="text-sm text-muted-foreground transition-colors hover:text-primary">Contact</Link>
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
                      <span className="sr-only">LinkedIn</span><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd"/></svg>
                    </Link>
                 </div>
             </div>
        </div>
      </footer>
    </div>
  );
}
