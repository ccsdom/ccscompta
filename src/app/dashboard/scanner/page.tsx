'use client';

import { useState, useRef } from 'react';
import { Camera, UploadCloud, X, CheckCircle2, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBranding } from '@/components/branding-provider';
import { uploadClientDocument } from '@/lib/uploads/client-document-upload';
import { db, storage } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function ScannerPage() {
  const { profile } = useBranding();
  const { toast } = useToast();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Vérification rapide de type (image ou pdf)
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        toast({
          variant: "destructive",
          title: "Format refusé",
          description: "Veuillez déposer une image ou un fichier PDF."
        });
      }
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!selectedFile || !profile?.id) return;

    setIsUploading(true);
    try {
      await uploadClientDocument({
        db,
        storage,
        file: selectedFile,
        clientId: profile.id,
        currentUser: profile.name || 'Client',
      });

      toast({
        title: "Document envoyé !",
        description: "Votre facture a été envoyée et sera traitée par notre IA.",
      });

      clearSelection();
      router.push('/dashboard/my-documents');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur d'envoi",
        description: error.message || "Impossible d'envoyer le document.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 max-w-md mx-auto animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mb-4">
          <ScanLine className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black font-space tracking-tight">Scanner Mobile</h1>
        <p className="text-muted-foreground mt-2 font-medium text-sm leading-relaxed">Prenez vos reçus et factures en photo sur mobile ou glissez-déposez-les ici sur ordinateur.</p>
      </div>

      <Card className={cn(
        "w-full glass-panel border-white/10 premium-shadow overflow-hidden transition-all duration-300",
        isDragActive && "ring-2 ring-primary border-primary/30 scale-[1.02]"
      )}>
        <CardContent className="p-6">
          {!selectedFile ? (
            <div 
              className={cn(
                "border-2 border-dashed border-white/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-colors group h-64",
                isDragActive && "border-primary bg-primary/5"
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <div className="p-4 rounded-full bg-primary/20 text-primary mb-4 group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="font-bold mb-1">Prendre une photo / Déposer</h3>
              <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">Appuyez pour ouvrir l'appareil photo ou glissez-déposez un fichier.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="relative rounded-2xl overflow-hidden bg-black/20 aspect-[3/4] w-full flex items-center justify-center">
                {previewUrl && (
                  <Image 
                    src={previewUrl} 
                    alt="Aperçu du scan" 
                    fill 
                    className="object-contain"
                  />
                )}
                <button 
                  onClick={clearSelection}
                  className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md transition-colors"
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <Button 
                onClick={handleUpload} 
                disabled={isUploading}
                className="w-full h-14 rounded-xl font-bold font-space text-lg shadow-xl"
              >
                {isUploading ? (
                  <>
                    <UploadCloud className="mr-2 h-5 w-5 animate-bounce" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Envoyer le document
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Input file caché (optimisé pour mobile : capture native) */}
          <input
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
