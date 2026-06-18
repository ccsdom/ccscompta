'use client';

import Link from "next/link";
import { ArrowRight, Calendar, User, Mail, Sparkles } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import React from 'react';

import { Input } from "@/components/ui/input";
import { motion } from 'framer-motion';
import { PublicHeader } from '@/components/public-header';
import { blogPosts } from '@/lib/data/blog-posts';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';


export default function BlogPage() {

  const posts = blogPosts;

  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);
  


  return (
    <div className="flex flex-col min-h-screen bg-background font-sans selection:bg-primary/30">
      {/* Header */}
      <PublicHeader />

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
                    <Link href={`/blog/${featuredPost.slug}`}>
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
                            <Link href={`/blog/${post.slug}`} className="focus:outline-none">
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
