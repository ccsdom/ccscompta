
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCcw, Send, Loader2, VideoOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { addDocument, updateDocument } from '@/ai/flows/document-actions';
import { recognizeDocumentType } from '@/ai/flows/recognize-document-type';
import { extractData } from '@/ai/flows/extract-data-from-documents';
import type { Document, AuditEvent, Notification } from '@/lib/types';
import { ref, uploadBytes } from "firebase/storage";
import { useFirebase } from '@/firebase';
import { fileToDataUri } from '@/lib/utils';


const getCurrentUser = () => localStorage.getItem('userName') || 'Client Démo';

export default function ScanPage() {
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { toast } = useToast();
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const { storage } = useFirebase();

    useEffect(() => {
        const clientId = localStorage.getItem('selectedClientId');
        setSelectedClientId(clientId);

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

     const createNotification = (doc: Document, message: string) => {
        const newNotification: Notification = {
          id: crypto.randomUUID(), documentId: doc.id, documentName: doc.name,
          message, date: new Date().toISOString(), isRead: false
        };
        const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]') as Notification[];
        localStorage.setItem('notifications', JSON.stringify([newNotification, ...existingNotifications]));
        window.dispatchEvent(new Event('storage'));
    };
    
    const processScannedDocument = useCallback(async (dataUrl: string, clientId: string) => {
         const fileName = `scan-${new Date().toISOString()}.jpg`;
         const file = await (await fetch(dataUrl)).blob();

        const storagePath = `${clientId}/${Date.now()}-${fileName}`;
        let createdDoc: Document | null = null;
        
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
            
            createdDoc = await addDocument(docForDb);
            if (!createdDoc) {
              throw new Error("Échec de la création de l'entrée du document dans la base de données.");
            }
            
            window.dispatchEvent(new Event('storage')); // Refresh lists

            let trail = createdDoc.auditTrail;

            trail = addAuditEvent(trail, 'Fichier stocké (scan)');
            await updateDocument({ id: createdDoc.id, updates: { auditTrail: trail, status: 'processing' } });

            const recognition = await recognizeDocumentType({ documentDataUri: dataUrl });
            trail = addAuditEvent(trail, `Type reconnu: ${recognition.documentType}`);
            
            const extracted = await extractData({ documentDataUri: dataUrl, documentType: recognition.documentType, clientId: clientId });
            trail = addAuditEvent(trail, 'Traitement IA terminé');
            
            const finalUpdates: Partial<Document> = {
                status: 'reviewing',
                extractedData: extracted,
                type: recognition.documentType,
                confidence: recognition.confidence,
                auditTrail: trail,
            };

            await updateDocument({ id: createdDoc.id, updates: finalUpdates });
            createNotification({ ...createdDoc, ...finalUpdates }, 'est prêt pour examen.');

        } catch (error) {
            console.error(`Error processing scanned file:`, error);
            if (createdDoc) {
                 const trail = addAuditEvent(createdDoc.auditTrail, `Erreur de traitement: ${error instanceof Error ? error.message : 'inconnue'}`);
                 await updateDocument({ id: createdDoc.id, updates: { status: 'error', auditTrail: trail } });
                 createNotification({ ...createdDoc, status: 'error' }, 'a échoué lors du traitement.');
            }
            throw error; // Re-throw to be caught by handleSend
        }
    }, [storage, toast]);

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
             toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'envoyer le document.' });
        } finally {
            setIsProcessing(false);
            window.dispatchEvent(new Event('storage'));
        }
    };


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Scanner un document</h1>
                <p className="text-muted-foreground mt-1">Utilisez votre caméra pour numériser et envoyer une pièce comptable.</p>
            </div>

            <Card>
                <CardContent className="p-4 md:p-6">
                    {hasCameraPermission === false && (
                         <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Accès à la caméra refusé</AlertTitle>
                            <AlertDescription>
                                Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur pour utiliser cette fonctionnalité.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="aspect-video w-full max-w-3xl mx-auto bg-muted rounded-lg overflow-hidden relative flex items-center justify-center">
                        <canvas ref={canvasRef} className="hidden" />

                        {capturedImage ? (
                            <img src={capturedImage} alt="Document capturé" className="w-full h-full object-contain" />
                        ) : (
                            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                        )}

                        {hasCameraPermission === null && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <p className="mt-2 text-muted-foreground">Demande d'accès à la caméra...</p>
                            </div>
                        )}
                         {!capturedImage && hasCameraPermission === false && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 text-destructive">
                                <VideoOff className="h-12 w-12" />
                                <p className="mt-2 font-semibold">Caméra non disponible</p>
                            </div>
                        )}

                    </div>

                    <div className="flex justify-center items-center gap-4 mt-6">
                        {capturedImage ? (
                            <>
                                <Button variant="outline" size="lg" onClick={handleRetake} disabled={isProcessing}>
                                    <RefreshCcw className="mr-2 h-5 w-5" /> Reprendre
                                </Button>
                                <Button size="lg" onClick={handleSend} disabled={isProcessing}>
                                    {isProcessing ? (
                                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Envoi...</>
                                    ) : (
                                        <><Send className="mr-2 h-5 w-5" /> Envoyer</>
                                    )}
                                </Button>
                            </>
                        ) : (
                            <Button size="lg" onClick={handleCapture} disabled={!hasCameraPermission} className="h-16 w-16 rounded-full">
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
