'use client';

import Link from "next/link";
import { Logo } from '@/components/logo';
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, User, Menu, Mail, Sparkles, TrendingUp } from "lucide-react";
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
import { motion } from 'framer-motion';

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
      image: { src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800&h=450", alt: "Data analytics Dashboard", hint: "accounting process optimization" },
      excerpt: "La clôture comptable est souvent un processus stressant. Découvrez comment l'intelligence artificielle peut transformer cette tâche en un processus fluide et sans erreur."
    },
    {
      title: "CCS Compta annonce son intégration avec le logiciel Cegid",
      category: "Nouveautés",
      author: "Bruno Petit",
      date: "1 Juillet 2024",
      image: { src: "https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&q=80&w=800&h=450", alt: "Business meeting", hint: "software integration logos" },
      excerpt: "Nous sommes fiers d'annoncer notre nouvelle intégration native avec Cegid, permettant une synchronisation transparente de vos données comptables."
    },
    {
      title: "Comment la numérisation des notes de frais révolutionne la vie des entrepreneurs",
      category: "Productivité",
      author: "Carla Moreau",
      date: "20 Juin 2024",
      image: { src: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800&h=450", alt: "Mobile scanning", hint: "mobile receipt scanning" },
      excerpt: "Fini les boîtes à chaussures remplies de reçus ! Le scan mobile change la donne pour la gestion des notes de frais au quotidien."
    },
    {
        title: "La facture électronique devient obligatoire : êtes-vous prêts ?",
        category: "Législation",
        author: "Alice Dubois",
        date: "10 Juin 2024",
        image: { src: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800&h=450", alt: "Legal documents", hint: "legal documents" },
        excerpt: "La réforme sur la facturation électronique B2B entre en vigueur prochainement. Voici les étapes clés pour préparer votre entreprise sereinement."
    }
  ];

  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);
  
  const navLinks = [
    { href: "/fonctionnalites", text: "Fonctionnalités" },
    { href: "/tarifs", text: "Tarifs" },
    { href: "/a-propos", text: "À Propos" },
    { href: "/blog", text: "Blog" },
    { href: "/assistance", text: "Support" }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans selection:bg-primary/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/">
            <div className="flex items-center gap-2 font-semibold group">
              <Logo className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-bold text-lg hidden sm:inline-block tracking-tight">CCS Compta</span>
            </div>
          </Link>

          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50">Découvrir</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <Link href="/">
                          <div className="flex h-full w-full select-none flex-col justify-end rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-6 no-underline outline-none focus:shadow-md border border-primary/10">
                            <Logo className="h-8 w-8 text-primary mb-4" />
                            <div className="mb-2 text-lg font-bold">CCS Compta</div>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              La comptabilité, réinventée. Automatisez la collecte et la saisie pour vous concentrer sur l'essentiel.
                            </p>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <ListItem href="/fonctionnalites" title="Fonctionnalités">Découvrez comment l'IA transforme votre productivité.</ListItem>
                    <ListItem href="/tarifs" title="Tarifs">Des plans simples et transparents pour tous les besoins.</ListItem>
                    <ListItem href="/securite" title="Sécurité">Votre confiance, notre priorité.</ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

             <NavigationMenuItem>
                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-muted/50")} active={pathname === '/a-propos'}>
                  <Link href="/a-propos">À Propos</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-muted/50")} active={pathname === '/blog'}>
                  <Link href="/blog">Blog</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-muted/50")} active={pathname === '/assistance'}>
                  <Link href="/assistance">Support</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-4">
             <Button asChild className="hidden md:inline-flex rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
              <Link href="/connexion">Connexion Client</Link>
            </Button>
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Ouvrir le menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                   <nav className="flex flex-col gap-6 text-lg font-medium mt-12">
                     <SheetClose asChild>
                       <Link href="/">
                        <div className="flex items-center gap-3 text-lg font-semibold mb-8">
                         <Logo className="h-8 w-8 text-primary" />
                         <span className="font-bold text-2xl tracking-tight">CCS Compta</span>
                        </div>
                       </Link>
                     </SheetClose>
                     {navLinks.map(link => (
                       <SheetClose asChild key={link.href}>
                          <Link href={link.href} className="text-muted-foreground hover:text-foreground hover:translate-x-2 transition-transform">
                            {link.text}
                          </Link>
                       </SheetClose>
                     ))}
                      <div className="pt-8 mt-auto">
                        <SheetClose asChild>
                            <Button asChild className="w-full rounded-full" size="lg">
                                <Link href="/connexion">Se connecter</Link>
                            </Button>
                        </SheetClose>
                      </div>
                   </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        
        {/* Header Section */}
        <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background -z-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full -z-10 opacity-50" />
            
            <div className="container mx-auto max-w-5xl px-4 text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <Badge variant="outline" className="mb-6 border-primary/30 text-primary bg-primary/5 px-4 py-1.5 rounded-full text-sm font-medium">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Ressources & Actualités
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight font-display text-balance mb-6">
                        Explorez le futur de<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                            l'expertise comptable
                        </span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Découvrez nos derniers articles, conseils d'experts et actualités pour optimiser la gestion de votre entreprise.
                    </p>
                </motion.div>
            </div>
        </section>

        {/* Featured Post (Hero) */}
        <section className="py-8 px-4">
            <div className="container mx-auto max-w-6xl">
                <motion.div 
                    initial={{ opacity: 0, y: 40 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.7, delay: 0.2 }}
                >
                    <Link href={`/blog/#${featuredPost.title.replace(/\s+/g, '-')}`}>
                        <div className="relative rounded-3xl overflow-hidden group aspect-[16/9] md:aspect-[21/9] shadow-2xl shadow-primary/10 border border-white/10">
                            <Image 
                                src={featuredPost.image.src} 
                                alt={featuredPost.image.alt} 
                                fill 
                                className="object-cover transition-transform duration-700 group-hover:scale-105" 
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                            
                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-white">
                                <div className="max-w-3xl">
                                    <Badge className="bg-primary hover:bg-primary text-primary-foreground mb-4 font-bold tracking-wider uppercase text-xs rounded-full px-3 py-1 border-none shadow-lg">
                                        À la une : {featuredPost.category}
                                    </Badge>
                                    <h2 className="text-3xl md:text-5xl font-bold font-display leading-tight mb-4 group-hover:text-primary-foreground transition-colors text-balance">
                                        {featuredPost.title}
                                    </h2>
                                    <p className="text-white/80 text-lg md:text-xl line-clamp-2 mb-6 max-w-2xl">
                                        {featuredPost.excerpt}
                                    </p>
                                    <div className="flex items-center gap-6 text-sm font-medium text-white/60">
                                        <span className="flex items-center gap-2"><User className="h-4 w-4" /> {featuredPost.author}</span>
                                        <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {featuredPost.date}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                </motion.div>
            </div>
        </section>

        {/* Articles Grid */}
        <section className="py-16 md:py-24 bg-muted/20">
          <div className="container mx-auto max-w-6xl px-4">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
                <div>
                    <h3 className="text-3xl font-bold font-display tracking-tight">Derniers articles</h3>
                    <p className="text-muted-foreground mt-2">Plongez dans nos dernières analyses.</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 max-w-full no-scrollbar">
                    {['Tous', 'Conseils', 'Productivité', 'Nouveautés', 'Législation'].map((cat, i) => (
                        <Badge 
                            key={cat} 
                            variant={i === 0 ? 'default' : 'secondary'} 
                            className={cn(
                                "cursor-pointer whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-all hover:scale-105", 
                                i === 0 ? "bg-foreground text-background shadow-md" : "hover:bg-muted-foreground/10"
                            )}
                        >
                            {cat}
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {remainingPosts.map((post, index) => (
                <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                    <Card className="h-full overflow-hidden flex flex-col group border-none shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 bg-background/50 backdrop-blur-sm">
                    <div className="relative h-56 overflow-hidden">
                        <Image 
                            src={post.image.src}
                            alt={post.image.alt}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute top-4 left-4">
                            <Badge className="bg-background/80 backdrop-blur-md text-foreground border-none shadow-sm hover:bg-background">
                                {post.category}
                            </Badge>
                        </div>
                    </div>
                    <CardContent className="flex-1 p-6">
                        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mb-4">
                            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {post.date}</span>
                        </div>
                        <CardTitle className="text-xl mb-3 leading-snug group-hover:text-primary transition-colors">
                            <Link href={`/blog/#${post.title.replace(/\s+/g, '-')}`} className="focus:outline-none">
                                <span className="absolute inset-0" aria-hidden="true" />
                                {post.title}
                            </Link>
                        </CardTitle>
                        <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
                            {post.excerpt}
                        </p>
                    </CardContent>
                    <CardFooter className="p-6 pt-0 border-t mt-auto">
                        <div className="w-full flex items-center justify-between pt-4">
                            <span className="text-sm font-semibold flex items-center gap-2">
                                <Avatar className="h-6 w-6" name={post.author} />
                                {post.author}
                            </span>
                            <span className="text-primary font-medium text-sm flex items-center group-hover:translate-x-1 transition-transform">
                                Lire <ArrowRight className="ml-1 h-4 w-4" />
                            </span>
                        </div>
                    </CardFooter>
                    </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5" />
            <div className="absolute -bottom-1/2 -right-1/4 w-full h-full bg-gradient-to-t from-primary/10 to-transparent blur-3xl rounded-full -z-10" />
            <div className="container mx-auto max-w-4xl px-4 relative z-10">
                <div className="glass-panel p-8 md:p-16 rounded-[3rem] border border-white/20 shadow-2xl bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-xl text-center">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-8">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black font-display tracking-tight mb-4">
                        Ne manquez aucune <span className="text-primary">opportunité</span>
                    </h2>
                    <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                        Abonnez-vous à notre newsletter pour recevoir nos meilleurs conseils, les évolutions légales et nos astuces productivité directement dans votre boîte mail.
                    </p>
                    <form className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto" onSubmit={(e) => e.preventDefault()}>
                        <Input 
                            type="email" 
                            placeholder="votre.email@entreprise.fr" 
                            className="h-14 rounded-full px-6 bg-background shadow-inner text-base"
                            required
                        />
                        <Button type="submit" size="lg" className="h-14 rounded-full px-8 shadow-lg shadow-primary/20 hover:scale-105 transition-transform font-bold">
                            S'abonner
                        </Button>
                    </form>
                    <p className="text-xs text-muted-foreground mt-4">
                        Nous respectons votre vie privée. Pas de spam, désinscription en un clic.
                    </p>
                </div>
            </div>
        </section>
      </main>

      {/* Footer minimaliste en attendant le global */}
      <footer className="border-t py-12 bg-background">
        <div className="container mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
                <Logo className="h-6 w-6 text-muted-foreground" />
                <span className="font-bold text-muted-foreground">CCS Compta</span>
            </div>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} CCS Compta. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

// Avatar Helper (simple fallback)
function Avatar({ className, name }: { className?: string, name: string }) {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    return (
        <div className={cn("rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold", className)}>
            {initials}
        </div>
    );
}
