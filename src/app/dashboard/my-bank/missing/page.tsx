'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertCircle, UploadCloud, Search, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from '@/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function MissingDocumentsPage() {
    const [missingItems, setMissingItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState<number | null>(null);

    const storedClientId = typeof window !== 'undefined' ? localStorage.getItem('selectedClientId') : null;

    useEffect(() => {
        if (!storedClientId) return;
        
        const unsub = onSnapshot(doc(db, 'missing_documents', storedClientId), (snap) => {
            if (snap.exists()) {
                const items = snap.data()?.items || [];
                setMissingItems(items.filter((i: any) => i.status === 'missing'));
            } else {
                setMissingItems([]);
            }
            setIsLoading(false);
        });
        
        return () => unsub();
    }, [storedClientId]);

    const handleUploadMock = async (index: number, tx: any) => {
        setIsUploading(index);
        // Simulation d'upload et de lettrage
        setTimeout(async () => {
            try {
                if (!storedClientId) return;
                
                const docRef = doc(db, 'missing_documents', storedClientId);
                // On met à jour le statut dans la liste (en vrai on devrait chercher par index ou id)
                const newItems = [...missingItems];
                const itemIndex = newItems.findIndex(i => i.transactionIndex === tx.transactionIndex);
                if (itemIndex > -1) {
                    newItems[itemIndex].status = 'uploaded';
                    await updateDoc(docRef, { items: newItems });
                }

                toast({
                    title: "Justificatif envoyé",
                    description: `Le document pour ${tx.description} a bien été transmis à votre comptable.`,
                });
            } catch (err: any) {
                toast({
                    variant: 'destructive',
                    title: "Erreur",
                    description: "Une erreur est survenue lors de l'envoi."
                });
            } finally {
                setIsUploading(null);
            }
        }, 1500);
    };

    return (
        <div className="space-y-8 p-4 md:p-6 max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link href="/dashboard/my-bank" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary w-fit transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour à Ma Banque
                </Link>
                
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight font-display gradient-text">Justificatifs Manquants</h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Votre cabinet comptable a besoin de ces documents pour clôturer votre dossier.
                    </p>
                </div>
            </div>

            {/* List */}
            <Card className="glass-panel border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <h3 className="font-space font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        Transactions Orphelines ({missingItems.length})
                    </h3>
                </div>
                
                <CardContent className="p-0">
                    <div className="divide-y divide-white/5">
                        <AnimatePresence mode="popLayout">
                            {isLoading ? (
                                <div className="p-12 text-center flex flex-col items-center gap-4">
                                    <Search className="h-8 w-8 animate-bounce text-primary opacity-20" />
                                    <p className="text-xs text-muted-foreground animate-pulse">Recherche des pièces manquantes...</p>
                                </div>
                            ) : missingItems.length === 0 ? (
                                <div className="p-16 text-center space-y-4">
                                    <div className="h-16 w-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                    </div>
                                    <p className="text-foreground text-lg font-bold">Tout est parfait !</p>
                                    <p className="text-sm text-muted-foreground">Vous n'avez aucun justificatif manquant pour le moment.</p>
                                </div>
                            ) : missingItems.map((tx, idx) => (
                                <motion.div 
                                    layout
                                    key={tx.transactionIndex}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-white/5 transition-colors group"
                                >
                                    <div className="flex items-start md:items-center gap-4 flex-1">
                                        <div className="h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner bg-orange-500/10 text-orange-500">
                                            <AlertCircle className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-base tracking-tight">{tx.description}</p>
                                            <p className="text-xs text-muted-foreground font-mono uppercase opacity-70 flex gap-2">
                                                <span>{tx.date}</span>
                                                <span>•</span>
                                                <span className="text-foreground font-bold">
                                                    {Math.abs(tx.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="w-full md:w-auto flex flex-col items-end gap-2">
                                        <Button 
                                            variant="default"
                                            disabled={isUploading === tx.transactionIndex}
                                            onClick={() => handleUploadMock(tx.transactionIndex, tx)}
                                            className="w-full md:w-auto rounded-xl shadow-lg bg-orange-500 hover:bg-orange-600 text-white font-bold"
                                        >
                                            {isUploading === tx.transactionIndex ? (
                                                <Search className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <UploadCloud className="mr-2 h-4 w-4" />
                                            )}
                                            Envoyer le justificatif
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
