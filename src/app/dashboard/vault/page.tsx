'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBranding } from '@/components/branding-provider';
import { useCollection, useMemoFirebase, db, storage } from '@/firebase';
import { collection, query, where, doc, deleteDoc } from 'firebase/firestore';
import type { VaultDocument, VaultCategory } from '@/lib/types';
import { uploadVaultDocument } from '@/lib/uploads/vault-document-upload';
import { useToast } from '@/hooks/use-toast';
import { Shield, UploadCloud, Folder, FileText, Download, Building, FileSignature, Users, Landmark, MoreHorizontal, FileIcon, Search, Trash2, HardDrive } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getDownloadURL, ref } from 'firebase/storage';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const categoriesConfig: Record<VaultCategory, { label: string, icon: any, color: string, bg: string }> = {
    legal: { label: 'Juridique (Kbis, Statuts)', icon: Building, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    tax: { label: 'Fiscal (Liasses)', icon: Landmark, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    hr: { label: 'RH & Social', icon: Users, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    contract: { label: 'Contrats & Baux', icon: FileSignature, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    other: { label: 'Divers', icon: Folder, color: 'text-slate-500', bg: 'bg-slate-500/10' },
};

export default function VaultPage() {
    const { profile } = useBranding();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedCategory, setSelectedCategory] = useState<VaultCategory>('legal');
    const [isUploading, setIsUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeDragCategory, setActiveDragCategory] = useState<VaultCategory | null>(null);

    const vaultQuery = useMemoFirebase(() => {
        if (!profile?.id) return null;
        return query(collection(db, 'vault_documents'), where('clientId', '==', profile.id));
    }, [profile?.id]);

    const { data: documents, isLoading } = useCollection<VaultDocument>(vaultQuery);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !profile?.id) return;
        const file = e.target.files[0];
        
        setIsUploading(true);
        try {
            await uploadVaultDocument({
                db,
                storage,
                file,
                clientId: profile.id,
                uploadedBy: 'client',
                uploaderName: profile.name,
                category: selectedCategory
            });
            toast({ title: "Document sécurisé", description: `Le fichier "${file.name}" a été ajouté au dossier ${categoriesConfig[selectedCategory].label}.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erreur", description: error.message });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const triggerUpload = (category: VaultCategory) => {
        setSelectedCategory(category);
        fileInputRef.current?.click();
    };

    const handleDownload = async (doc: VaultDocument) => {
        try {
            const url = await getDownloadURL(ref(storage, doc.storagePath));
            window.open(url, '_blank');
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de télécharger le document." });
        }
    };

    const handleDelete = async (docId: string) => {
        try {
            await deleteDoc(doc(db, 'vault_documents', docId));
            toast({ variant: 'destructive', title: "Document supprimé", description: "Le document a été retiré de votre coffre-fort." });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible de supprimer le document." });
        }
    };

    const handleDragOver = (e: React.DragEvent, category: VaultCategory) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveDragCategory(category);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveDragCategory(null);
    };

    const handleDrop = async (e: React.DragEvent, category: VaultCategory) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveDragCategory(null);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && profile?.id) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/') || file.type === 'application/pdf') {
                setIsUploading(true);
                try {
                    await uploadVaultDocument({
                        db,
                        storage,
                        file,
                        clientId: profile.id,
                        uploadedBy: 'client',
                        uploaderName: profile.name,
                        category
                    });
                    toast({ title: "Document sécurisé", description: `Le fichier "${file.name}" a été glissé-déposé dans ${categoriesConfig[category].label}.` });
                } catch (error: any) {
                    toast({ variant: "destructive", title: "Erreur", description: error.message });
                } finally {
                    setIsUploading(false);
                }
            } else {
                toast({ variant: "destructive", title: "Format refusé", description: "Veuillez déposer une image ou un fichier PDF." });
            }
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 space-y-6">
                <Skeleton className="h-12 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-48" />)}
                </div>
            </div>
        );
    }

    const filteredDocs = documents?.filter(doc => 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const groupedDocs = filteredDocs.reduce((acc, doc) => {
        acc[doc.category] = acc[doc.category] || [];
        acc[doc.category].push(doc);
        return acc;
    }, {} as Record<VaultCategory, VaultDocument[]>) || {} as Record<VaultCategory, VaultDocument[]>;

    // Simulated storage used calculation (1.5 MB avg per document)
    const simulatedStorageUsed = (documents?.length || 0) * 1.5;
    const storagePercentage = Math.min(100, (simulatedStorageUsed / 1024) * 100);

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-500">
            {/* Header section with Storage Info */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border/30">
                <div>
                    <h1 className="text-4xl font-black font-space tracking-tight flex items-center gap-3">
                        <Shield className="h-8 w-8 text-primary animate-pulse" />
                        Mon Coffre-fort
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">L'espace crypté et sécurisé pour vos documents permanents et légaux.</p>
                </div>

                {/* Storage usage widget */}
                <Card className="glass-panel border-white/10 dark:border-white/5 bg-background/20 p-4 max-w-sm w-full shrink-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <HardDrive className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between text-xs font-semibold">
                                <span>Stockage Utilisé</span>
                                <span className="text-muted-foreground">{simulatedStorageUsed.toFixed(1)} Mo / 1 Go</span>
                            </div>
                            {/* Sleek progress bar */}
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-1.5">
                                <div 
                                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out" 
                                    style={{ width: `${storagePercentage}%` }} 
                                />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Rechercher un document..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-11 bg-background/40 border-border/40 focus-visible:ring-primary focus-visible:ring-1"
                    />
                </div>
                {searchQuery && (
                    <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="shrink-0">
                        Réinitialiser la recherche
                    </Button>
                )}
            </div>

            {/* Folders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 pt-4">
                {(Object.entries(categoriesConfig) as [VaultCategory, any][]).map(([key, config]) => {
                    const isDraggingOverThis = activeDragCategory === key;
                    const catDocs = groupedDocs[key] || [];

                    return (
                        <div key={key} className="relative mt-4">
                            {/* Folder Tab Effect */}
                            <div className={cn(
                                "absolute -top-2.5 left-4 h-3 w-20 rounded-t-xl border-t border-x transition-all duration-300",
                                isDraggingOverThis 
                                    ? "bg-primary/20 border-primary/30" 
                                    : "bg-background/40 border-border/20 group-hover:border-primary/25"
                            )} />
                            <Card 
                                className={cn(
                                    "glass-panel border-none premium-shadow overflow-hidden transition-all duration-300 group h-[380px] flex flex-col",
                                    isDraggingOverThis && "ring-2 ring-primary bg-primary/[0.04] scale-[1.02]"
                                )}
                                onDragOver={(e) => handleDragOver(e, key)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, key)}
                            >
                                <CardHeader className="pb-2 shrink-0">
                                    <div className="flex items-center justify-between">
                                        <div className={cn(
                                            "p-3 rounded-2xl transition-transform duration-500 group-hover:scale-105",
                                            config.bg, config.color
                                        )}>
                                            <config.icon className="h-6 w-6" />
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-muted"
                                            onClick={() => triggerUpload(key)}
                                            disabled={isUploading}
                                            title="Téléverser un document"
                                        >
                                            <UploadCloud className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <CardTitle className="text-base font-bold tracking-tight mt-4 truncate" title={config.label}>
                                        {config.label}
                                    </CardTitle>
                                    <CardDescription>
                                        {catDocs.length} document{catDocs.length > 1 ? 's' : ''}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-2 flex-1 overflow-hidden flex flex-col justify-between">
                                    {catDocs.length > 0 ? (
                                        <ScrollArea className="flex-1 max-h-[220px] pr-1">
                                            <ul className="space-y-2">
                                                {catDocs.map(doc => (
                                                    <li key={doc.id} className="flex items-center justify-between p-2 rounded-xl bg-background/30 border border-border/10 hover:bg-muted/40 transition-colors group/item">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                                            <div className="flex flex-col overflow-hidden text-left">
                                                                <span className="text-xs font-semibold truncate max-w-[120px]" title={doc.name}>
                                                                    {doc.name}
                                                                </span>
                                                                <span className="text-[9px] text-muted-foreground">
                                                                    {new Date(doc.uploadDate).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/item:opacity-100 transition-opacity rounded-lg">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-40">
                                                                <DropdownMenuItem onClick={() => handleDownload(doc)} className="cursor-pointer">
                                                                    <Download className="h-4 w-4 mr-2" /> Télécharger
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleDelete(doc.id)} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                                                                    <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </li>
                                                ))}
                                            </ul>
                                        </ScrollArea>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center p-4 border border-dashed border-border/40 rounded-2xl bg-muted/5 min-h-[140px]">
                                            <p className="text-xs text-muted-foreground text-center font-medium">
                                                {isDraggingOverThis ? "Déposez ici !" : "Glissez-déposez un document ici"}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    );
                })}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,application/pdf"
            />
        </div>
    );
}
