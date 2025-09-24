
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/logo';
import { ArrowRight, Bot, ShieldCheck, Users, UploadCloud, ScanSearch, CheckSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
  const features = [
    {
      icon: <Bot className="h-8 w-8 text-primary" />,
      title: "Extraction par IA",
      description: "Notre IA analyse vos documents, extrait les données clés et pré-remplit les informations pour vous faire gagner un temps précieux.",
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Collaboration en temps réel",
      description: "Comptables et clients collaborent sur la même plateforme. Posez des questions et laissez des commentaires directement sur les documents.",
    },
    {
      icon: <ShieldCheck className="h-8 w-8 text-primary" />,
      title: "Sécurité et Conformité",
      description: "Vos données sont stockées de manière sécurisée et nous garantissons la conformité avec les normes comptables en vigueur.",
    },
  ];

  const howItWorks = [
    {
        icon: <UploadCloud className="h-10 w-10 text-primary" />,
        step: 1,
        title: "Téléversement Facile",
        description: "Le client envoie ses documents de n'importe où, en quelques clics ou par un simple scan depuis son mobile."
    },
    {
        icon: <ScanSearch className="h-10 w-10 text-primary" />,
        step: 2,
        title: "Analyse par l'IA",
        description: "L'intelligence artificielle extrait et structure les données essentielles (fournisseur, dates, montants, TVA)."
    },
    {
        icon: <CheckSquare className="h-10 w-10 text-primary" />,
        step: 3,
        title: "Validation en un Clic",
        description: "Le comptable vérifie et valide les informations, qui sont alors prêtes pour être intégrées en production."
    }
  ];

  const testimonials = [
    {
      name: "Alain D.",
      role: "Expert-Comptable, Cabinet Fidu-Conseil",
      avatar: "https://randomuser.me/api/portraits/men/75.jpg",
      text: "CCS Compta a divisé par deux le temps que nous passions sur la saisie manuelle. C'est une révolution pour notre cabinet.",
    },
    {
      name: "Sophie L.",
      role: "Gérante, PME 'Innov-Solutions'",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
      text: "En tant que dirigeante, je n'ai plus à me soucier de la paperasse. Je prends une photo, je l'envoie, et c'est tout. Simple et efficace !",
    },
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
             <Link href="#features" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:block">
              Fonctionnalités
            </Link>
             <Link href="#testimonials" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:block">
              Témoignages
            </Link>
            <Button asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative py-20 md:py-32">
             <div
                aria-hidden="true"
                className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-40 dark:opacity-20"
              >
                <div className="blur-[106px] h-56 bg-gradient-to-br from-primary to-purple-400 dark:from-blue-700" />
                <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300 dark:to-indigo-600" />
              </div>
          <div className="container relative mx-auto max-w-5xl px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Badge
                    variant="outline"
                    className="mb-6 rounded-full px-4 py-1 font-medium"
                >
                    La comptabilité du futur est arrivée
                </Badge>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl font-display">
                La comptabilité, réinventée. <br/>
                <span className="text-primary">Simple, Intelligente, Collaborative.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                Arrêtez de courir après les documents. CCS Compta automatise la collecte et la saisie pour que vous puissiez vous concentrer sur ce qui compte vraiment : conseiller vos clients.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link href="/login">Commencer maintenant <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                   <Link href="/login">Demander une démo</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="py-20 md:py-32 bg-muted/30">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
                Une plateforme tout-en-un
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                De la collecte de documents à la validation comptable, tout est centralisé.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              {features.map((feature, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}>
                  <Card className="h-full text-center">
                    <CardHeader>
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        {feature.icon}
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                 </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        <section id="how-it-works" className="py-20 md:py-32">
            <div className="container mx-auto max-w-6xl px-4">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
                        Un processus simple en 3 étapes
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        Gagnez du temps à chaque étape, de la collecte à la validation.
                    </p>
                </div>
                <div className="mt-16 grid grid-cols-1 gap-y-12 md:grid-cols-3 md:gap-x-8">
                     {howItWorks.map((step, i) => (
                        <motion.div 
                            key={i} 
                            className="relative flex flex-col items-center text-center"
                            initial={{ opacity: 0, y: 20 }} 
                            whileInView={{ opacity: 1, y: 0 }} 
                            transition={{ delay: i * 0.1, duration: 0.5 }} 
                            viewport={{ once: true }}
                        >
                            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/10 mb-6">
                                {step.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                            <p className="text-muted-foreground">{step.description}</p>
                            {i < howItWorks.length - 1 && (
                                <div className="hidden md:block absolute top-10 left-1/2 w-full translate-x-1/2">
                                    <svg className="w-full h-auto text-gray-200 dark:text-gray-700" viewBox="0 0 100 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5 10 C 25 1, 75 19, 95 10" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                                    </svg>
                                </div>
                            )}
                        </motion.div>
                     ))}
                </div>
            </div>
        </section>

         <section id="testimonials" className="py-20 md:py-32 bg-muted/30">
            <div className="container mx-auto max-w-6xl px-4">
                 <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
                        Ce que nos utilisateurs disent
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        Découvrez comment CCS Compta transforme le quotidien des cabinets et de leurs clients.
                    </p>
                </div>
                 <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
                    {testimonials.map((testimonial) => (
                        <Card key={testimonial.name} className="overflow-hidden">
                           <CardContent className="p-8">
                                <p className="text-lg font-medium leading-relaxed text-foreground">"{testimonial.text}"</p>
                            </CardContent>
                             <CardHeader className="flex flex-row items-center gap-4 bg-background p-6">
                                <Avatar className="h-14 w-14 border-2 border-primary/50">
                                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-lg">{testimonial.name}</p>
                                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

      </main>

      <footer className="border-t">
        <div className="container mx-auto max-w-7xl px-4 py-8">
            <div className="flex flex-col-reverse items-center justify-between gap-4 md:flex-row">
                <p className="text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} CCS Compta. Tous droits réservés.
                </p>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.46.67.88-.53 1.56-1.37 1.88-2.38-.83.49-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.27 0 .34.04.67.11.98-3.56-.18-6.72-1.88-8.84-4.48-.37.63-.58 1.37-.58 2.15 0 1.48.75 2.79 1.9 3.55-.7-.02-1.37-.22-1.95-.54v.05c0 2.07 1.47 3.8 3.42 4.19-.36.1-.74.15-1.14.15-.27 0-.54-.03-.8-.08.54 1.7 2.11 2.93 3.97 2.96-1.46 1.14-3.3 1.82-5.3 1.82-.34 0-.68-.02-1.02-.06 1.89 1.21 4.14 1.92 6.56 1.92 7.88 0 12.2-6.54 12.2-12.2 0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"></path></svg>
                    </Button>
                    <Button variant="ghost" size="icon">
                         <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"></path></svg>
                    </Button>
                     <Button variant="ghost" size="icon">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"></path></svg>
                    </Button>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}

    