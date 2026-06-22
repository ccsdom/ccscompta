'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBranding } from '@/components/branding-provider';
import { useCollection, useMemoFirebase, db, storage } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { VaultDocument, VaultCategory } from '@/lib/types';
import { uploadVaultDocument } from '@/lib/uploads/vault-document-upload';
import { useToast } from '@/hooks/use-toast';
import { Shield, UploadCloud, Folder, FileText, Download, Building, FileSignature, Users, Landmark, MoreHorizontal, FileIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getDownloadURL, ref } from 'firebase/storage';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
            toast({ title: "Document sécurisé", description: "Le document a été ajouté à votre coffre-fort." });
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

    if (isLoading) {
        return (
            <div className="p-8 space-y-6">
                <Skeleton className="h-12 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
                </div>
            </div>
        );
    }

    const groupedDocs = documents?.reduce((acc, doc) => {
        acc[doc.category] = acc[doc.category] || [];
        acc[doc.category].push(doc);
        return acc;
    }, {} as Record<VaultCategory, VaultDocument[]>) || {} as Record<VaultCategory, VaultDocument[]>;

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black font-space tracking-tight flex items-center gap-3">
                        <Shield className="h-8 w-8 text-primary" />
                        Mon Coffre-fort
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">L'espace sécurisé pour vos documents permanents (Kbis, Statuts, Contrats).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(Object.entries(categoriesConfig) as [VaultCategory, any][]).map(([key, config]) => (
                    <Card key={key} className="glass-panel border-none premium-shadow overflow-hidden group">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className={`p-3 rounded-2xl ${config.bg} ${config.color}`}>
                                    <config.icon className="h-6 w-6" />
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-white/10"
                                    onClick={() => triggerUpload(key)}
                                    disabled={isUploading}
                                >
                                    <UploadCloud className="h-5 w-5" />
                                </Button>
                            </div>
                            <CardTitle className="text-lg mt-4">{config.label}</CardTitle>
                            <CardDescription>
                                {groupedDocs[key]?.length || 0} document{(groupedDocs[key]?.length || 0) > 1 ? 's' : ''}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {groupedDocs[key]?.length > 0 ? (
                                <ul className="space-y-2">
                                    {groupedDocs[key].map(doc => (
                                        <li key={doc.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group/item">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-sm font-medium truncate">{doc.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        Ajouté le {new Date(doc.uploadDate).toLocaleDateString()} par {doc.uploaderName || (doc.uploadedBy === 'accountant' ? 'le cabinet' : 'vous')}
                                                    </span>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleDownload(doc)} className="cursor-pointer">
                                                        <Download className="h-4 w-4 mr-2" /> Télécharger
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center p-4 border border-dashed border-white/10 rounded-xl">
                                    <p className="text-xs text-muted-foreground">Dossier vide</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
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
