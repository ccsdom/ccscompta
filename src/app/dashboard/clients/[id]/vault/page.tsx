'use client';

import { useState, useRef, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDoc, useCollection, useMemoFirebase, db, storage } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import type { VaultDocument, VaultCategory, Client } from '@/lib/types';
import { uploadVaultDocument } from '@/lib/uploads/vault-document-upload';
import { useToast } from '@/hooks/use-toast';
import { Shield, UploadCloud, Folder, FileText, Download, Building, FileSignature, Users, Landmark, MoreHorizontal, FileIcon, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getDownloadURL, ref } from 'firebase/storage';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

const categoriesConfig: Record<VaultCategory, { label: string, icon: any, color: string, bg: string }> = {
    legal: { label: 'Juridique (Kbis, Statuts)', icon: Building, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    tax: { label: 'Fiscal (Liasses)', icon: Landmark, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    hr: { label: 'RH & Social', icon: Users, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    contract: { label: 'Contrats & Baux', icon: FileSignature, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    other: { label: 'Divers', icon: Folder, color: 'text-slate-500', bg: 'bg-slate-500/10' },
};

export default function AccountantVaultPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: clientId } = use(params);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedCategory, setSelectedCategory] = useState<VaultCategory>('legal');
    const [isUploading, setIsUploading] = useState(false);

    const clientRef = useMemoFirebase(() => doc(db, 'clients', clientId), [clientId]);
    const { data: client, isLoading: isLoadingClient } = useDoc<Client>(clientRef);

    const vaultQuery = useMemoFirebase(() => query(collection(db, 'vault_documents'), where('clientId', '==', clientId)), [clientId]);
    const { data: documents, isLoading: isLoadingDocs } = useCollection<VaultDocument>(vaultQuery);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !client) return;
        const file = e.target.files[0];
        
        setIsUploading(true);
        try {
            await uploadVaultDocument({
                db,
                storage,
                file,
                clientId: client.id,
                uploadedBy: 'accountant',
                uploaderName: 'Le Cabinet',
                category: selectedCategory
            });
            toast({ title: "Document sécurisé", description: "Le document a été ajouté au coffre-fort de votre client." });
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

    if (isLoadingClient || isLoadingDocs) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-1/2" />
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
        <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                         <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                            <Link href={`/dashboard/clients/${clientId}`}>
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Retour à la fiche
                            </Link>
                        </Button>
                    </div>
                    <h1 className="text-3xl font-black font-space tracking-tight flex items-center gap-3">
                        <Shield className="h-8 w-8 text-primary" />
                        Coffre-fort : {client?.name}
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">Espace GED collaboratif et sécurisé pour les documents permanents.</p>
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
                                                        {new Date(doc.uploadDate).toLocaleDateString()} par {doc.uploaderName || (doc.uploadedBy === 'client' ? 'le client' : 'vous')}
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
                accept="application/pdf,image/*"
            />
        </div>
    );
}
