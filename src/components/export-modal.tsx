
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, CheckCircle2, AlertCircle, Loader2, FileSpreadsheet } from "lucide-react";
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase';
import { useToast } from "@/hooks/use-toast";

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDocIds: string[];
    onSuccess: () => void;
}

export function ExportModal({ isOpen, onClose, selectedDocIds, onSuccess }: ExportModalProps) {
    const [format, setFormat] = useState<'FEC' | 'CSV'>('FEC');
    const [isExporting, setIsExporting] = useState(false);
    const [exportResult, setExportResult] = useState<{ fileName: string; count: number } | null>(null);
    const { toast } = useToast();

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const exportFunc = httpsCallable(functions, 'exportDocuments');
            const result = await exportFunc({ documentIds: selectedDocIds, format });
            
            const { fileContent, fileName, count } = result.data as any;

            // Trigger download
            const blob = new Blob([fileContent], { type: format === 'CSV' ? 'text/csv' : 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setExportResult({ fileName, count });
            toast({ title: "Exportation réussie", description: `${count} documents exportés avec succès !` });
            onSuccess();
        } catch (error: any) {
            console.error('Export error:', error);
            toast({ variant: "destructive", title: "Erreur d'exportation", description: "Une erreur est survenue lors de la génération du fichier." });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glass-panel border-none premium-shadow max-w-md rounded-[2.5rem] p-0 overflow-hidden">
                <div className="p-8 space-y-6">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black font-space tracking-tight">Export Comptable</DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium">
                            Générez vos écritures pour {selectedDocIds.length} documents sélectionnés.
                        </DialogDescription>
                    </DialogHeader>

                    {!exportResult ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setFormat('FEC')}
                                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 group ${
                                        format === 'FEC' 
                                        ? 'border-primary bg-primary/5' 
                                        : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
                                    }`}
                                >
                                    <div className={`p-3 rounded-2xl transition-colors ${format === 'FEC' ? 'bg-primary text-primary-foreground' : 'bg-white/5 text-muted-foreground group-hover:text-foreground'}`}>
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <span className="font-space font-black text-xs uppercase tracking-widest">Format FEC</span>
                                    <span className="text-[10px] opacity-40 text-center leading-tight">Standard DGFIP / Sage / Cegid</span>
                                </button>

                                <button 
                                    onClick={() => setFormat('CSV')}
                                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 group ${
                                        format === 'CSV' 
                                        ? 'border-primary bg-primary/5' 
                                        : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
                                    }`}
                                >
                                    <div className={`p-3 rounded-2xl transition-colors ${format === 'CSV' ? 'bg-primary text-primary-foreground' : 'bg-white/5 text-muted-foreground group-hover:text-foreground'}`}>
                                        <FileSpreadsheet className="h-6 w-6" />
                                    </div>
                                    <span className="font-space font-black text-xs uppercase tracking-widest">Format CSV</span>
                                    <span className="text-[10px] opacity-40 text-center leading-tight">Exploitation libre / Excel</span>
                                </button>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                                <p className="text-[11px] text-amber-200/70 font-medium leading-relaxed">
                                    L'export marquera ces documents comme "Exportés". Ils ne seront plus inclus dans les prochains exports automatiques pour éviter les doublons.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-12 flex flex-col items-center text-center space-y-4"
                        >
                            <div className="h-20 w-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-2">
                                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-black font-space">Export Terminé !</h3>
                            <p className="text-sm text-muted-foreground">
                                Votre fichier <span className="text-foreground font-mono font-bold">{exportResult.fileName}</span> est prêt.
                            </p>
                        </motion.div>
                    )}

                    <DialogFooter className="flex gap-3 sm:gap-0">
                        {!exportResult ? (
                            <>
                                <Button variant="ghost" onClick={onClose} disabled={isExporting} className="rounded-2xl font-space font-black uppercase text-[10px] tracking-widest">
                                    Annuler
                                </Button>
                                <Button 
                                    onClick={handleExport} 
                                    disabled={isExporting}
                                    className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 font-space font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20"
                                >
                                    {isExporting ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>Générer l'export <Download className="h-4 w-4 ml-2" /></>
                                    )}
                                </Button>
                            </>
                        ) : (
                            <Button onClick={onClose} className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 font-space font-black uppercase text-xs tracking-widest">
                                Fermer
                            </Button>
                        )}
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
