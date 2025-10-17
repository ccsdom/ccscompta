
'use client';

import Link from "next/link";
import { Logo } from '@/components/logo';
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, User } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";

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
          <nav className="flex items-center gap-4">
             <Link href="/features" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:block">Fonctionnalités</Link>
             <Link href="/pricing" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:block">Tarifs</Link>
             <Link href="/security" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:block">Sécurité</Link>
             <Link href="/blog" className="text-sm font-medium text-primary sm:block">Blog</Link>
             <Link href="/about" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:block">À Propos</Link>
             <Link href="/support" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:block">Support</Link>
            <Button asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
          </nav>
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
