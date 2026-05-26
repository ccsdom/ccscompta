'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Camera, ImagePlus, Loader2, RefreshCcw, Send, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Client } from '@/lib/types';
import { db, useFirebase } from '@/firebase';
import { createInvoiceForDocument } from '@/ai/flows/invoice-actions';
import { doc as getDocRef, getDoc } from 'firebase/firestore';
import {
  summarizeUploadRejections,
  uploadClientDocument,
  validateAccountingFiles,
} from '@/lib/uploads/client-document-upload';

const getCurrentUser = () => localStorage.getItem('userName') || 'Client Demo';

export default function ScanPage() {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const { storage } = useFirebase();

  const stopCameraStream = useCallback(() => {
    if (!videoRef.current?.srcObject) return;

    const stream = videoRef.current.srcObject as MediaStream;
    stream.getTracks().forEach((track) => track.stop());
    videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setHasCameraPermission(false);
      return;
    }

    setHasCameraPermission(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      stopCameraStream();
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      setHasCameraPermission(false);
    }
  }, [stopCameraStream]);

  useEffect(() => {
    const loadClient = async () => {
      const clientId = localStorage.getItem('selectedClientId');
      setSelectedClientId(clientId);

      if (!clientId) {
        setCurrentClient(null);
        return;
      }

      try {
        const snap = await getDoc(getDocRef(db, 'clients', clientId));
        setCurrentClient(snap.exists() ? { ...(snap.data() as Client), id: snap.id } : null);
      } catch (error) {
        console.warn('Could not load client profile:', error);
        setCurrentClient(null);
      }
    };

    void loadClient();
    void startCamera();
    window.addEventListener('storage', loadClient);

    return () => {
      window.removeEventListener('storage', loadClient);
      stopCameraStream();
    };
  }, [startCamera, stopCameraStream]);

  const processScannedFile = useCallback(async (file: File, clientId: string) => {
    const result = await uploadClientDocument({
      db,
      storage,
      file,
      clientId,
      currentUser: getCurrentUser(),
      cabinetId: currentClient?.cabinetId,
      auditAction: 'Document scanne par le client',
    });

    if (currentClient) {
      void createInvoiceForDocument(currentClient, result.documentId)
        .catch((error) => console.warn('Could not create invoice for scanned document:', error));
    }

    window.dispatchEvent(new Event('storage'));
  }, [currentClient, storage]);

  const dataUrlToFile = async (dataUrl: string) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], `scan-${new Date().toISOString()}.jpg`, { type: 'image/jpeg' });
  };

  const handleCapturedOrImportedFile = async (file: File) => {
    if (!selectedClientId) {
      toast({ variant: 'destructive', title: 'Client non identifie', description: 'Reconnectez-vous avant de transmettre une piece.' });
      return;
    }

    const { acceptedFiles, rejectedFiles } = validateAccountingFiles([file]);
    if (rejectedFiles.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Fichier refuse',
        description: summarizeUploadRejections(rejectedFiles),
      });
      return;
    }

    setIsProcessing(true);
    toast({ title: 'Envoi en cours...', description: 'Votre document est en cours de sauvegarde.' });

    try {
      await processScannedFile(acceptedFiles[0], selectedClientId);
      toast({ title: 'Document envoye', description: 'Votre piece a ete transmise a votre comptable.' });
      setCapturedImage(null);
      void startCamera();
    } catch (error) {
      console.error('Scanned document upload failed:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'envoyer le document. La sauvegarde a echoue." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      toast({ variant: 'destructive', title: 'Camera pas encore prete', description: 'Patientez quelques secondes puis reessayez.' });
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));
    stopCameraStream();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    void startCamera();
  };

  const handleSend = async () => {
    if (!capturedImage) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Aucune image capturee.' });
      return;
    }

    const file = await dataUrlToFile(capturedImage);
    await handleCapturedOrImportedFile(file);
  };

  const handleGalleryImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    await handleCapturedOrImportedFile(file);
  };

  const canCapture = hasCameraPermission === true && !capturedImage && !isProcessing && Boolean(selectedClientId);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-150 fill-mode-both">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display gradient-text">Scanner un document</h1>
        <p className="text-muted-foreground mt-2 text-base sm:text-lg max-w-2xl">Capturez une piece comptable ou importez une photo deja prise.</p>
      </div>

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleGalleryImport}
        disabled={isProcessing}
      />

      <Card className="glass-panel overflow-hidden border-primary/20 bg-gradient-to-br from-white/40 to-muted/10 dark:from-black/40 dark:to-muted/10 premium-shadow">
        <CardContent className="p-3 sm:p-4 md:p-8">
          {!selectedClientId && (
            <Alert variant="destructive" className="glass-panel border-destructive/30 mb-6 bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-display">Client non identifie</AlertTitle>
              <AlertDescription>Selectionnez ou reconnectez le client avant de transmettre une piece.</AlertDescription>
            </Alert>
          )}

          {hasCameraPermission === false && (
            <Alert variant="destructive" className="glass-panel border-destructive/30 mb-6 bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-display">Acces camera indisponible</AlertTitle>
              <AlertDescription>Autorisez la camera dans le navigateur ou importez une photo depuis votre appareil.</AlertDescription>
            </Alert>
          )}

          <div className="aspect-[3/4] sm:aspect-video w-full max-w-4xl mx-auto bg-black/5 dark:bg-white/5 rounded-3xl overflow-hidden relative flex items-center justify-center ring-1 ring-border/50 premium-shadow-sm group">
            <div className="absolute inset-5 sm:inset-8 border-2 border-primary/30 border-dashed rounded-2xl pointer-events-none z-10 opacity-50 group-hover:opacity-100 transition-opacity" />
            <canvas ref={canvasRef} className="hidden" />

            {capturedImage ? (
              <img src={capturedImage} alt="Document capture" className="w-full h-full object-contain bg-black/10 backdrop-blur-sm z-0 relative" />
            ) : (
              <video ref={videoRef} className="w-full h-full object-cover z-0 relative" autoPlay muted playsInline />
            )}

            {hasCameraPermission === null && !capturedImage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md z-20 text-center px-6">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground font-medium">Initialisation de la camera...</p>
              </div>
            )}

            {!capturedImage && hasCameraPermission === false && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md text-destructive z-20 text-center px-6">
                <div className="p-4 bg-destructive/10 rounded-full mb-4">
                  <VideoOff className="h-10 w-10 text-destructive" />
                </div>
                <p className="font-semibold text-lg font-display">Camera indisponible</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs">Vous pouvez quand meme envoyer une photo depuis votre galerie.</p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
            {capturedImage ? (
              <>
                <Button variant="outline" size="lg" onClick={handleRetake} disabled={isProcessing} className="h-12 px-6 rounded-full glass-panel hover:bg-background">
                  <RefreshCcw className="mr-2 h-5 w-5" /> Reprendre
                </Button>
                <Button size="lg" onClick={handleSend} disabled={isProcessing || !selectedClientId} className="h-12 px-8 rounded-full premium-shadow-sm group">
                  {isProcessing ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Envoi...</>
                  ) : (
                    <><Send className="mr-2 h-5 w-5 transition-transform group-hover:translate-x-1" /> Transmettre</>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={handleCapture}
                  disabled={!canCapture}
                  className="h-16 sm:h-20 sm:w-20 rounded-full premium-shadow border-4 border-background hover:scale-105 transition-all duration-300"
                >
                  <Camera className="h-7 w-7 sm:h-8 sm:w-8" />
                  <span className="sr-only">Capturer</span>
                </Button>
                <Button variant="outline" size="lg" onClick={() => galleryInputRef.current?.click()} disabled={isProcessing || !selectedClientId} className="h-12 px-6 rounded-full glass-panel hover:bg-background">
                  <ImagePlus className="mr-2 h-5 w-5" /> Importer une photo
                </Button>
                {hasCameraPermission === false && (
                  <Button variant="ghost" size="lg" onClick={() => void startCamera()} disabled={isProcessing} className="h-12 px-6 rounded-full">
                    <RefreshCcw className="mr-2 h-5 w-5" /> Reessayer
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
