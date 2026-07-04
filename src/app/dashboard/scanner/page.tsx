'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, UploadCloud, X, CheckCircle2, ScanLine, RotateCw, Sparkles, Sliders, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBranding } from '@/components/branding-provider';
import { db, storage } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, doc, writeBatch, increment, getDoc } from 'firebase/firestore';
import type { Document, AuditEvent } from '@/lib/types';

type Step = 'capture' | 'edit' | 'uploading' | 'success';
type FilterType = 'original' | 'premium' | 'binarized';

export default function ScannerPage() {
  const { profile } = useBranding();
  const { toast } = useToast();
  const router = useRouter();
  
  const [step, setStep] = useState<Step>('capture');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('premium');
  
  // Interactive cropping percentages (0.0 to 1.0)
  const [crop, setCrop] = useState({ left: 0.05, top: 0.05, right: 0.95, bottom: 0.95 });
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270 degrees
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  
  // Dragging handles state
  const [activeHandle, setActiveHandle] = useState<number | null>(null);
  
  const clearSelection = () => {
    setSelectedFile(null);
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setImageSrc(null);
    setStep('capture');
    setCrop({ left: 0.05, top: 0.05, right: 0.95, bottom: 0.95 });
    setRotation(0);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setImageSrc(url);
        setStep('edit');
      } else if (file.type === 'application/pdf') {
        // PDF files cannot be processed via HTML5 Canvas directly in this way
        // So we skip editing step and upload directly
        setSelectedFile(file);
        setStep('edit');
      } else {
        toast({
          variant: "destructive",
          title: "Format refusé",
          description: "Veuillez capturer une photo ou déposer une image."
        });
      }
    }
  };

  // Automatic contour detection suggestion
  const runAutoCrop = useCallback((imgEl: HTMLImageElement) => {
    let bestLeft = 0.05;
    let bestTop = 0.05;
    let bestRight = 0.95;
    let bestBottom = 0.95;
    
    try {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 100;
      tempCanvas.height = 100;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(imgEl, 0, 0, 100, 100);
        const data = tempCtx.getImageData(0, 0, 100, 100).data;
        
        // Scan Left margin
        for (let x = 0; x < 40; x++) {
          let colSum = 0;
          for (let y = 15; y < 85; y++) {
            const idx = (y * 100 + x) * 4;
            colSum += 0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2];
          }
          if (colSum / 70 > 115) {
            bestLeft = x / 100;
            break;
          }
        }
        
        // Scan Right margin
        for (let x = 99; x > 60; x--) {
          let colSum = 0;
          for (let y = 15; y < 85; y++) {
            const idx = (y * 100 + x) * 4;
            colSum += 0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2];
          }
          if (colSum / 70 > 115) {
            bestRight = x / 100;
            break;
          }
        }
        
        // Scan Top margin
        for (let y = 0; y < 40; y++) {
          let rowSum = 0;
          for (let x = 15; x < 85; x++) {
            const idx = (y * 100 + x) * 4;
            rowSum += 0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2];
          }
          if (rowSum / 70 > 115) {
            bestTop = y / 100;
            break;
          }
        }
        
        // Scan Bottom margin
        for (let y = 99; y > 60; y--) {
          let rowSum = 0;
          for (let x = 15; x < 85; x++) {
            const idx = (y * 100 + x) * 4;
            rowSum += 0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2];
          }
          if (rowSum / 70 > 115) {
            bestBottom = y / 100;
            break;
          }
        }
      }
    } catch (e) {
      console.warn("Auto-crop failed, using defaults:", e);
    }
    
    if (bestRight - bestLeft < 0.25) {
      bestLeft = 0.05;
      bestRight = 0.95;
    }
    if (bestBottom - bestTop < 0.25) {
      bestTop = 0.05;
      bestBottom = 0.95;
    }
    
    setCrop({ left: bestLeft, top: bestTop, right: bestRight, bottom: bestBottom });
  }, []);

  // Update canvas preview
  const updateCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new globalThis.Image();
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      
      // Determine rotated canvas size
      const isRotated = rotation === 90 || rotation === 270;
      const displayWidth = isRotated ? img.naturalHeight : img.naturalWidth;
      const displayHeight = isRotated ? img.naturalWidth : img.naturalHeight;
      
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      
      // Draw rotated image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      ctx.restore();
      
      // Apply pixel processing filters
      if (filter !== 'original') {
        try {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;
          
          if (filter === 'premium') {
            // Document Scan contrast optimization
            let min = 255, max = 0;
            for (let i = 0; i < d.length; i += 4) {
              const v = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
              if (v < min) min = v;
              if (v > max) max = v;
            }
            const range = max - min || 1;
            for (let i = 0; i < d.length; i += 4) {
              const v = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
              let nv = ((v - min) / range) * 255;
              // Clean whites and boost blacks
              if (nv > 170) nv = nv + (255 - nv) * 0.6;
              else if (nv < 110) nv = nv * 0.75;
              
              d[i] = nv;
              d[i+1] = nv;
              d[i+2] = nv;
            }
          } else if (filter === 'binarized') {
            // High-contrast clean Black and White
            let sum = 0;
            for (let i = 0; i < d.length; i += 4) {
              sum += 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
            }
            const avg = sum / (d.length / 4);
            // Adaptive threshold
            for (let i = 0; i < d.length; i += 4) {
              const v = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
              const nv = v > avg - 15 ? 255 : 0;
              d[i] = nv;
              d[i+1] = nv;
              d[i+2] = nv;
            }
          }
          
          ctx.putImageData(imgData, 0, 0);
        } catch (e) {
          console.error("Filter processing failed:", e);
        }
      }
      
      // Draw interactive crop overlay
      const w = canvas.width;
      const h = canvas.height;
      
      // 1. Draw outer dim overlays
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      // Top
      ctx.fillRect(0, 0, w, crop.top * h);
      // Bottom
      ctx.fillRect(0, crop.bottom * h, w, (1 - crop.bottom) * h);
      // Left
      ctx.fillRect(0, crop.top * h, crop.left * w, (crop.bottom - crop.top) * h);
      // Right
      ctx.fillRect(crop.right * w, crop.top * h, (1 - crop.right) * w, (crop.bottom - crop.top) * h);
      
      // 2. Draw crop border
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = Math.max(3, w * 0.005);
      ctx.strokeRect(crop.left * w, crop.top * h, (crop.right - crop.left) * w, (crop.bottom - crop.top) * h);
      
      // 3. Draw crop handles
      const handleSize = Math.max(12, w * 0.015);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = Math.max(2, w * 0.003);
      
      const corners = [
        { x: crop.left * w, y: crop.top * h }, // 0: Top-Left
        { x: crop.right * w, y: crop.top * h }, // 1: Top-Right
        { x: crop.right * w, y: crop.bottom * h }, // 2: Bottom-Right
        { x: crop.left * w, y: crop.bottom * h }  // 3: Bottom-Left
      ];
      
      corners.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, handleSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      });
    };
  }, [imageSrc, filter, crop, rotation]);

  useEffect(() => {
    updateCanvas();
  }, [updateCanvas]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    
    // Convert client coordinates to canvas internal pixel coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = clientX * scaleX;
    const y = clientY * scaleY;
    
    const w = canvas.width;
    const h = canvas.height;
    const handleSize = Math.max(30, w * 0.04); // enlarged hit zone for fingers
    
    const corners = [
      { x: crop.left * w, y: crop.top * h }, // 0
      { x: crop.right * w, y: crop.top * h }, // 1
      { x: crop.right * w, y: crop.bottom * h }, // 2
      { x: crop.left * w, y: crop.bottom * h }  // 3
    ];
    
    let clickedHandle = null;
    for (let i = 0; i < corners.length; i++) {
      const dist = Math.hypot(corners[i].x - x, corners[i].y - y);
      if (dist < handleSize) {
        clickedHandle = i;
        break;
      }
    }
    
    if (clickedHandle !== null) {
      setActiveHandle(clickedHandle);
      canvas.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeHandle === null) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    
    const px = Math.min(Math.max(0, clientX / rect.width), 1);
    const py = Math.min(Math.max(0, clientY / rect.height), 1);
    
    setCrop(prev => {
      const next = { ...prev };
      if (activeHandle === 0) { // Top-Left
        next.left = Math.min(px, prev.right - 0.15);
        next.top = Math.min(py, prev.bottom - 0.15);
      } else if (activeHandle === 1) { // Top-Right
        next.right = Math.max(px, prev.left + 0.15);
        next.top = Math.min(py, prev.bottom - 0.15);
      } else if (activeHandle === 2) { // Bottom-Right
        next.right = Math.max(px, prev.left + 0.15);
        next.bottom = Math.max(py, prev.top + 0.15);
      } else if (activeHandle === 3) { // Bottom-Left
        next.left = Math.min(px, prev.right - 0.15);
        next.bottom = Math.max(py, prev.top + 0.15);
      }
      return next;
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeHandle !== null) {
      canvasRef.current?.releasePointerCapture(e.pointerId);
      setActiveHandle(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !profile?.id) return;
    
    setStep('uploading');
    setUploadProgress(0);
    
    try {
      let finalFile: File = selectedFile;
      
      // If it is an image and we processed it, extract cropped/filtered content from canvas
      if (selectedFile.type.startsWith('image/') && canvasRef.current && imgRef.current) {
        const cropCanvas = document.createElement('canvas');
        const canvas = canvasRef.current;
        
        const w = canvas.width;
        const h = canvas.height;
        
        const cropX = crop.left * w;
        const cropY = crop.top * h;
        const cropW = (crop.right - crop.left) * w;
        const cropH = (crop.bottom - crop.top) * h;
        
        cropCanvas.width = cropW;
        cropCanvas.height = cropH;
        
        const cropCtx = cropCanvas.getContext('2d');
        if (cropCtx) {
          // Draw cropped section from main processed canvas
          cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
          
          // Get compressed Blob
          const blobPromise = new Promise<Blob | null>((resolve) => {
            cropCanvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
          });
          const croppedBlob = await blobPromise;
          if (croppedBlob) {
            finalFile = new File([croppedBlob], selectedFile.name.replace(/\.[^/.]+$/, "") + "-scanned.jpg", {
              type: 'image/jpeg'
            });
          }
        }
      }

      // 1. Resolve client cabinet
      const clientSnap = await getDoc(doc(db, 'clients', profile.id));
      if (!clientSnap.exists()) {
        throw new Error('Client introuvable.');
      }
      const cabinetId = clientSnap.data().cabinetId || '';
      if (!cabinetId) {
        throw new Error('Cabinet introuvable pour ce client.');
      }

      // 2. Storage Upload with progress tracking
      const storagePath = `${profile.id}/${Date.now()}-${finalFile.name}`;
      const storageRef = ref(storage, storagePath);
      
      const uploadTask = uploadBytesResumable(storageRef, finalFile, {
        contentType: finalFile.type
      });

      await new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(Math.round(progress));
          }, 
          (error) => reject(error), 
          () => resolve()
        );
      });

      // 3. Insert document record and increment client doc counter
      const documentRef = doc(collection(db, 'documents'));
      const clientRef = doc(db, 'clients', profile.id);
      
      const auditEvent: AuditEvent = {
        action: 'Document numérisé via Mobile Scanner',
        date: new Date().toISOString(),
        user: profile.name || 'Client',
      };
      
      const documentData: Omit<Document, 'id' | 'dataUrl'> = {
        name: finalFile.name,
        uploadDate: new Date().toISOString(),
        status: 'pending',
        storagePath,
        clientId: profile.id,
        cabinetId,
        comments: [],
        auditTrail: [auditEvent],
        sizeBytes: finalFile.size,
      };
      
      const batch = writeBatch(db);
      batch.set(documentRef, documentData);
      batch.update(clientRef, { newDocuments: increment(1) });
      
      await batch.commit();

      setStep('success');
      toast({
        title: "Numérisation réussie !",
        description: "Votre document a été nettoyé et envoyé au cabinet.",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      setStep('edit');
      toast({
        variant: "destructive",
        title: "Erreur d'envoi",
        description: error.message || "Impossible de finaliser l'upload.",
      });
    }
  };

  const rotateImage = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  if (step === 'uploading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] p-6 max-w-md mx-auto text-center space-y-6">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
            <circle 
              cx="50" 
              cy="50" 
              r="40" 
              stroke="var(--primary)" 
              strokeWidth="8" 
              fill="none" 
              strokeDasharray="251.2"
              strokeDashoffset={251.2 - (251.2 * uploadProgress) / 100}
              className="transition-all duration-300 ease-out"
            />
          </svg>
          <span className="absolute text-2xl font-black font-space">{uploadProgress}%</span>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black font-space uppercase">Envoi Sécurisé</h2>
          <p className="text-muted-foreground text-sm font-medium">Compression du scan et synchronisation avec le cabinet...</p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 max-w-md mx-auto text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black font-space uppercase italic text-emerald-500">Scan Envoyé !</h1>
          <p className="text-muted-foreground text-sm font-medium leading-relaxed px-4">
            Le document a été nettoyé avec succès. Notre moteur d'analyse IA extrait actuellement les données de facturation.
          </p>
        </div>
        <div className="flex flex-col w-full gap-3">
          <Button onClick={() => router.push('/dashboard/my-documents')} className="h-12 w-full font-bold">
            Consulter mes achats
          </Button>
          <Button onClick={clearSelection} variant="outline" className="h-12 w-full border-white/10 hover:bg-white/5 font-semibold text-muted-foreground hover:text-foreground">
            Scanner une autre pièce
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 max-w-md mx-auto">
      {step === 'capture' && (
        <div className="text-center mb-8 animate-in fade-in duration-500">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 text-primary mb-4 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]">
            <ScanLine className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black font-space tracking-tight uppercase italic text-primary">Scanner Intelligent</h1>
          <p className="text-muted-foreground mt-2 font-medium text-sm leading-relaxed">
            Prenez vos factures en photo. Le scanner va automatiquement recadrer la pièce et optimiser sa lisibilité.
          </p>
        </div>
      )}

      <Card className="w-full glass-panel border-white/10 premium-shadow overflow-hidden transition-all duration-500">
        <CardContent className="p-6">
          {step === 'capture' ? (
            <div 
              className="border-2 border-dashed border-white/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-all duration-300 group h-72"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-4 group-hover:scale-110 transition-transform duration-500">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="font-bold mb-1">Prendre une photo</h3>
              <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">Ouvrez l'appareil photo du smartphone pour numériser votre reçu en direct.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-in fade-in duration-500" ref={containerRef}>
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5" /> Ajustement du scan
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      if (imgRef.current) runAutoCrop(imgRef.current);
                    }}
                    className="h-8 w-8 hover:bg-white/10" 
                    title="Auto-crop contours"
                  >
                    <Sparkles className="h-4 w-4 text-amber-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={rotateImage} className="h-8 w-8 hover:bg-white/10" title="Rotation 90°">
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Editing Canvas */}
              <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/5 flex items-center justify-center aspect-[3/4] w-full">
                <canvas 
                  ref={canvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="max-w-full max-h-full object-contain cursor-crosshair touch-none"
                />
              </div>

              {/* Filter selection tabs */}
              <div className="grid grid-cols-3 gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setFilter('original')}
                  className={cn(
                    "py-2 text-[10px] font-black uppercase rounded-lg transition-all",
                    filter === 'original' ? "bg-white/10 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Original
                </button>
                <button
                  onClick={() => setFilter('premium')}
                  className={cn(
                    "py-2 text-[10px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1",
                    filter === 'premium' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Sparkles className="h-3 w-3" /> Premium
                </button>
                <button
                  onClick={() => setFilter('binarized')}
                  className={cn(
                    "py-2 text-[10px] font-black uppercase rounded-lg transition-all",
                    filter === 'binarized' ? "bg-white/10 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Noir & Blanc
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  onClick={clearSelection}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl font-bold border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground"
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleUpload}
                  className="flex-1 h-12 rounded-xl font-bold flex gap-2"
                >
                  <Check className="h-4 w-4" /> Envoyer le scan
                </Button>
              </div>
            </div>
          )}

          {/* Hidden camera upload field */}
          <input
            type="file"
            accept="image/*"
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
