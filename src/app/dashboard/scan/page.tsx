
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCcw, Send, Loader2, VideoOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { addDocument } from '@/ai/flows/document-actions';
import type { Document, AuditEvent, Notification, Client } from '@/lib/types';
import { ref, uploadBytes } from "firebase/storage";
import { useFirebase, db } from '@/firebase';
import { createInvoiceForDocument } from '@/ai/flows/invoice-actions';
import { getDoc, doc as getDocRef } from 'firebase/firestore';


const getCurrentUser = () => localStorage.getItem('userName') || 'Client Démo';

export default function ScanPage() {
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { toast } = useToast();
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [currentClient, setCurrentClient] = useState<Client | null>(null);
    const { storage } = useFirebase();

    useEffect(() => {
        const clientId = localStorage.getItem('selectedClientId');
        setSelectedClientId(clientId);
        // Load client profile via targeted get (not list) to avoid permission errors for non-staff
        if (clientId) {
            getDoc(getDocRef(db, 'clients', clientId))
                .then(snap => { if (snap.exists()) setCurrentClient({ ...snap.data() as Client, id: snap.id }); })
                .catch(err => console.warn('Could not load client profile:', err));
        }

        const getCameraPermission = async () => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error('La fonctionnalité MediaDevices n\'est pas supportée sur ce navigateur.');
                setHasCameraPermission(false);
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                setHasCameraPermission(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error('Erreur d\'accès à la caméra:', error);
                setHasCameraPermission(false);
            }
        };
        getCameraPermission();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

     const addAuditEvent = (trail: AuditEvent[], action: string): AuditEvent[] => {
        const event: AuditEvent = { action, date: new Date().toISOString(), user: getCurrentUser() };
        return [...trail, event];
    }
    
    const processScannedDocument = useCallback(async (dataUrl: string, clientId: string) => {
         const fileName = `scan-${new Date().toISOString()}.jpg`;
         const file = await (await fetch(dataUrl)).blob();

        const storagePath = `${clientId}/${Date.now()}-${fileName}`;
        
        try {
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, file);

            const initialTrail = addAuditEvent([], 'Document scanné par le client');
            const docForDb: Omit<Document, 'id'> = {
                name: fileName,
                uploadDate: new Date().toISOString(),
                status: 'pending',
                storagePath: storagePath,
                clientId: clientId,
                auditTrail: initialTrail,
                comments: [],
            };
            
            const newDocId = await addDocument(docForDb);
            
            // Now create an invoice for this new document
            if (currentClient) {
                await createInvoiceForDocument(currentClient, newDocId);
            } else {
                console.warn(`Could not find client profile for ID ${clientId} to create invoice.`);
            }

            window.dispatchEvent(new Event('storage')); // Refresh lists

        } catch (error) {
            console.error(`Error processing scanned file:`, error);
            // We re-throw the error to let the caller handle the UI feedback
            throw error;
        }
    }, [storage, toast, currentClient]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setCapturedImage(dataUrl);
            }
        }
    };

    const handleRetake = () => { setCapturedImage(null); };

    const handleSend = async () => {
        if (!capturedImage || !selectedClientId) {
             toast({ variant: "destructive", title: "Erreur", description: "Aucune image capturée ou client non identifié." });
             return;
        }

        setIsProcessing(true);
        toast({ title: 'Envoi en cours...', description: 'Votre document est en cours de traitement.' });
        
        try {
            await processScannedDocument(capturedImage, selectedClientId);
            toast({ title: 'Document envoyé !', description: 'Votre document a été traité et envoyé à votre comptable.' });
            setCapturedImage(null);
        } catch (error) {
             toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'envoyer le document. La sauvegarde a échoué.' });
        } finally {
            setIsProcessing(false);
            window.dispatchEvent(new Event('storage'));
        }
    };


    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-150 fill-mode-both">
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight font-display gradient-text">Scanner un document</h1>
                <p className="text-muted-foreground mt-2 text-lg max-w-2xl">Pointez votre caméra vers la pièce comptable pour la numériser et la transmettre instantanément.</p>
            </div>

            <Card className="glass-panel overflow-hidden border-primary/20 bg-gradient-to-br from-white/40 to-muted/10 dark:from-black/40 dark:to-muted/10 premium-shadow">
                <CardContent className="p-4 md:p-8">
                    {hasCameraPermission === false && (
                         <Alert variant="destructive" className="glass-panel border-destructive/30 mb-6 bg-destructive/10">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="font-display">Accès à la caméra refusé</AlertTitle>
                            <AlertDescription>
                                Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur pour utiliser la capture intelligente.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="aspect-video w-full max-w-4xl mx-auto bg-black/5 dark:bg-white/5 rounded-3xl overflow-hidden relative flex items-center justify-center ring-1 ring-border/50 premium-shadow-sm group">
                        {/* Frame indicators */}
                        <div className="absolute inset-8 border-2 border-primary/30 border-dashed rounded-2xl pointer-events-none z-10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <canvas ref={canvasRef} className="hidden" />

                        {capturedImage ? (
                            <img src={capturedImage} alt="Document capturé" className="w-full h-full object-contain bg-black/10 backdrop-blur-sm z-0 relative" />
                        ) : (
                            <video ref={videoRef} className="w-full h-full object-cover z-0 relative" autoPlay muted playsInline />
                        )}

                        {hasCameraPermission === null && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md z-20">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="mt-4 text-muted-foreground font-medium">Initialisation de la lentille intelligente...</p>
                            </div>
                        )}
                         {!capturedImage && hasCameraPermission === false && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md text-destructive z-20">
                                <div className="p-4 bg-destructive/10 rounded-full mb-4">
                                    <VideoOff className="h-10 w-10 text-destructive" />
                                </div>
                                <p className="font-semibold text-lg font-display">Capteur optique indisponible</p>
                            </div>
                        )}

                    </div>

                    <div className="flex justify-center items-center gap-4 mt-8">
                        {capturedImage ? (
                            <>
                                <Button variant="outline" size="lg" onClick={handleRetake} disabled={isProcessing} className="h-12 px-6 rounded-full glass-panel hover:bg-background">
                                    <RefreshCcw className="mr-2 h-5 w-5" /> Reprendre
                                </Button>
                                <Button size="lg" onClick={handleSend} disabled={isProcessing} className="h-12 px-8 rounded-full premium-shadow-sm group">
                                    {isProcessing ? (
                                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyse...</>
                                    ) : (
                                        <><Send className="mr-2 h-5 w-5 transition-transform group-hover:translate-x-1" /> Transmettre</>
                                    )}
                                </Button>
                            </>
                        ) : (
                            <Button 
                                size="lg" 
                                onClick={handleCapture} 
                                disabled={!hasCameraPermission} 
                                className="h-20 w-20 rounded-full premium-shadow border-4 border-background hover:scale-105 transition-all duration-300"
                            >
                                <Camera className="h-8 w-8" />
                                <span className="sr-only">Capturer</span>
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
