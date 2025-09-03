
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import { Mail, Phone, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function SupportPage() {

  const faqs = [
    {
      question: "Comment téléverser mes documents ?",
      answer: "C'est très simple ! Sur la page 'Mes Documents', utilisez la zone de glisser-déposer ou le bouton 'Parcourir' pour sélectionner vos fichiers (PDF, JPG, PNG). Vous pouvez aussi utiliser l'icône d'ajout rapide (+) dans l'en-tête pour un accès encore plus rapide.",
      image: {
        src: "https://picsum.photos/600/300",
        alt: "Capture d'écran du téléverseur de fichiers",
        hint: "file uploader"
      }
    },
    {
      question: "Que signifient les différents statuts des documents ?",
      answer: "Chaque document passe par plusieurs étapes : 'En attente' (téléversé, non traité), 'En traitement' (l'IA analyse le document), 'En examen' (prêt pour la validation de votre comptable), 'Approuvé' (validé par votre comptable), et 'Erreur' (le traitement a échoué).",
      image: {
        src: "https://picsum.photos/600/250",
        alt: "Capture d'écran montrant les badges de statut",
        hint: "status badges"
      }
    },
    {
      question: "Comment communiquer avec mon comptable au sujet d'un document ?",
      answer: "Ouvrez n'importe quel document en cliquant dessus dans la liste. Dans le panneau de détails, vous trouverez un onglet 'Commentaires'. Vous pouvez y ajouter des messages, poser des questions et voir les réponses de votre comptable.",
      image: {
        src: "https://picsum.photos/600/400",
        alt: "Capture d'écran de la section commentaires",
        hint: "comments section"
      }
    },
    {
        question: "Puis-je personnaliser mon tableau de bord analytique ?",
        answer: "Oui ! En tant que comptable, sur la page 'Analyse Détaillée', vous trouverez un bouton 'Personnaliser' en haut à droite. Il vous permet d'afficher ou de masquer les différents graphiques et cartes statistiques selon vos préférences. Vos choix sont sauvegardés pour vos prochaines visites.",
        image: {
            src: "https://picsum.photos/600/350",
            alt: "Capture d'écran du menu de personnalisation des analyses",
            hint: "analytics customization"
        }
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Votre message a été envoyé ! Notre équipe vous répondra dans les plus brefs délais.');
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center">
        <HelpCircle className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-4xl font-bold tracking-tight">Aide & Support</h1>
        <p className="text-muted-foreground mt-2">Trouvez les réponses à vos questions ou contactez notre équipe.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foire Aux Questions (FAQ)</CardTitle>
          <CardDescription>Consultez les réponses aux questions les plus fréquentes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-lg">{faq.question}</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <p className="text-base text-muted-foreground">{faq.answer}</p>
                   <div className="overflow-hidden rounded-md border shadow-sm">
                        <Image 
                            src={faq.image.src} 
                            alt={faq.image.alt}
                            width={600}
                            height={300}
                            className="w-full object-cover"
                            data-ai-hint={faq.image.hint}
                        />
                   </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Contacter le support</CardTitle>
            <CardDescription>Pour toute question spécifique, remplissez le formulaire ci-dessous.</CardDescription>
          </CardHeader>
           <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Votre Nom</Label>
                    <Input id="name" placeholder="Jean Dupont" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Votre Email</Label>
                    <Input id="email" type="email" placeholder="jean.dupont@email.com" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="subject">Sujet</Label>
                    <Input id="subject" placeholder="Question sur la facturation" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="message">Votre Message</Label>
                    <Textarea id="message" placeholder="Décrivez votre problème ou votre question ici..." rows={5} required/>
                </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full">Envoyer le message</Button>
                </CardFooter>
           </form>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Autres moyens de contact</CardTitle>
                <CardDescription>Vous pouvez aussi nous joindre directement.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
                <div className="flex items-start gap-4">
                    <Mail className="h-6 w-6 text-primary mt-1" />
                    <div>
                        <h4 className="font-semibold">Par Email</h4>
                        <p className="text-muted-foreground">Envoyez-nous un email à l'adresse ci-dessous. Nous nous efforçons de répondre en moins de 24h.</p>
                        <a href="mailto:support@ccs-compta.com" className="text-primary font-medium hover:underline">support@ccs-compta.com</a>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 text-primary mt-1" />
                    <div>
                        <h4 className="font-semibold">Par Téléphone</h4>
                        <p className="text-muted-foreground">Notre ligne téléphonique est ouverte du Lundi au Vendredi, de 9h à 17h.</p>
                        <p className="font-medium text-foreground">01 23 45 67 89</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <HelpCircle className="h-6 w-6 text-primary mt-1" />
                    <div>
                        <h4 className="font-semibold">Base de connaissances</h4>
                        <p className="text-muted-foreground">Pour une aide détaillée sur toutes les fonctionnalités, consultez notre documentation complète.</p>
                        <Button variant="outline" className="mt-2" asChild>
                            <Link href="/DOCUMENTATION.md" download>Consulter la documentation</Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
