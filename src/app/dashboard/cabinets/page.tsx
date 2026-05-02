'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
    } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
    Building, 
    Search,
    CreditCard,
    Users,
    LogIn,
    Activity,
    ShieldCheck,
    AlertCircle,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    Mail,
    CheckCircle2
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auditService } from "@/services/audit-service";
import { EmailService } from "@/services/email-service";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { useBranding } from "@/components/branding-provider";

export default function CabinetsManagementPage() {
    const { profile: userProfile } = useBranding();
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();
    const router = useRouter();

    const cabinetsQuery = useMemoFirebase(() => {
        return query(collection(db, 'cabinets'), orderBy('name', 'asc'));
    }, []);

    const { data: cabinets, isLoading } = useCollection<any>(cabinetsQuery);

    const filteredCabinets = cabinets?.filter(c => 
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCabinet, setEditingCabinet] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleImpersonate = async (cabinet: any) => {
        // Enregistrer l'état original pour pouvoir revenir
        // Seulement si on n'est pas déjà en train d'impersonner
        if (!localStorage.getItem('originalUserRole')) {
            localStorage.setItem('originalUserRole', 'admin');
            localStorage.setItem('originalUserName', 'Super Admin');
            localStorage.setItem('originalUserEmail', 'app.ccs94@gmail.com');
        }
        
        // Simuler le rôle cabinet (accountant)
        localStorage.setItem('userRole', 'accountant');
        localStorage.setItem('userName', cabinet.name);
        localStorage.setItem('userEmail', cabinet.email || 'contact@cabinet.com');
        localStorage.setItem('selectedCabinetId', cabinet.id);
        
        await auditService.logSystem(`Impersonation activée pour le cabinet: ${cabinet.name}`, 'security');

        // Log the impersonation event
        if (userProfile) {
            await auditService.logImpersonation('start', 
                { name: userProfile.name, email: userProfile.email, role: userProfile.role },
                { name: cabinet.name, id: cabinet.id, type: 'cabinet' }
            );
        }

        window.dispatchEvent(new Event('storage'));
        router.push('/dashboard/accountant');
    };

    const handleSaveCabinet = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const plan = formData.get('plan') as string;
        const maxClients = parseInt(formData.get('maxClients') as string) || 10;
        const maxDocs = parseInt(formData.get('maxDocs') as string) || 100;
        const storageLimit = parseInt(formData.get('storageLimit') as string) || 5;

        const cabinetData = {
            name,
            email,
            plan,
            quotas: {
                maxClients,
                maxDocumentsPerMonth: maxDocs,
                maxCollaborators: 5,
                storageLimitGb: storageLimit,
                usedDocumentsMonth: editingCabinet?.quotas?.usedDocumentsMonth || 0,
                usedClients: editingCabinet?.quotas?.usedClients || 0
            }
        };

        try {
            if (editingCabinet) {
                await updateDoc(doc(db, 'cabinets', editingCabinet.id), cabinetData);
                await auditService.logSystem(`Mise à jour quotas/plan pour ${name}`, 'info');
                toast({ title: "Quotas mis à jour" });
            } else {
                const id = `cabinet-${Math.random().toString(36).substr(2, 9)}`;
                await setDoc(doc(db, 'cabinets', id), {
                    ...cabinetData,
                    id,
                    status: 'active',
                    createdAt: new Date().toISOString(),
                });
                await auditService.logSystem(`Nouveau cabinet créé avec plan ${plan}: ${name}`, 'info');
                toast({ title: "Cabinet déployé" });
            }
            setIsDialogOpen(false);
            setEditingCabinet(null);
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur de sauvegarde" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendInvitation = async (cabinet: any) => {
        try {
            await auditService.logSystem(`INVITATION : Envoi des accès pour ${cabinet.name} (${cabinet.email})`, 'security');
            
            // 1. Déclencher l'envoi réel du mail via le service d'email
            await EmailService.sendCabinetInvitation({
                id: cabinet.id,
                name: cabinet.name,
                email: cabinet.email
            });

            // 2. Mettre à jour Firestore pour le suivi UI
            await updateDoc(doc(db, 'cabinets', cabinet.id), {
                invitationSentAt: new Date().toISOString(),
                invitationStatus: 'pending'
            });

            toast({
                title: "Mail d'invitation envoyé",
                description: `Le pack de bienvenue a été transmis à ${cabinet.email}.`,
            });
        } catch (error) {
            console.error("Erreur invitation:", error);
            toast({ variant: "destructive", title: "Erreur d'invitation", description: "Le service d'email est momentanément indisponible." });
        }
    };

    if (isLoading) {
        return <div className="p-8"><Skeleton className="h-20 w-full mb-4" /><Skeleton className="h-64 w-full" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-2 font-space uppercase italic text-primary">
                        <Building className="h-8 w-8" />
                        Gestion des Cabinets
                    </h1>
                    <p className="text-muted-foreground mt-1">Supervision globale de l'écosystème CCS Compta.</p>
                </div>
                <div className="flex gap-2">
                    <Card className="px-4 py-2 border-primary/20 bg-primary/5 flex items-center gap-3">
                        <Activity className="h-4 w-4 text-primary animate-pulse" />
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-60">Fermes Actives</p>
                            <p className="text-xl font-black">{cabinets?.length || 0}</p>
                        </div>
                    </Card>
                </div>
            </div>

            <Card className="glass-panel border-primary/10 overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <div className="flex items-center justify-between">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher un cabinet (nom, email)..."
                                className="pl-10 bg-background/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="font-bold gap-2" onClick={() => { setEditingCabinet(null); setIsDialogOpen(true); }}>
                                    <Plus className="h-4 w-4" /> Nouveau Cabinet
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="glass-panel border-white/10 sm:max-w-[425px]">
                                <form onSubmit={handleSaveCabinet}>
                                    <DialogHeader>
                                        <DialogTitle className="font-space font-black uppercase tracking-tight italic">
                                            {editingCabinet ? 'Modifier le Cabinet' : 'Enregistrer un Cabinet'}
                                        </DialogTitle>
                                        <DialogDescription>
                                            Configurez l'accès au SaaS pour cette nouvelle structure.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-[10px] uppercase font-black tracking-widest opacity-50">Nom du Cabinet</Label>
                                            <Input id="name" name="name" defaultValue={editingCabinet?.name} className="bg-white/5 border-white/10" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-[10px] uppercase font-black tracking-widest opacity-50">Email de contact</Label>
                                            <Input id="email" name="email" type="email" defaultValue={editingCabinet?.email} className="bg-white/5 border-white/10" required />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black tracking-widest opacity-50">Plan</Label>
                                                <Select name="plan" defaultValue={editingCabinet?.plan || 'starter'}>
                                                    <SelectTrigger className="bg-white/5 border-white/10">
                                                        <SelectValue placeholder="Choisir un plan" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="starter">Starter (Indépendant)</SelectItem>
                                                        <SelectItem value="professional">Professionnel (Cabinet)</SelectItem>
                                                        <SelectItem value="enterprise">Entreprise (Multi-sites)</SelectItem>
                                                        <SelectItem value="elite">Élite (Full Cloud AI)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="maxClients" className="text-[10px] uppercase font-black tracking-widest opacity-50">Max Clients</Label>
                                                <Input id="maxClients" name="maxClients" type="number" defaultValue={editingCabinet?.quotas?.maxClients || 10} className="bg-white/5 border-white/10" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="maxDocs" className="text-[10px] uppercase font-black tracking-widest opacity-50">Max Docs / mois</Label>
                                                <Input id="maxDocs" name="maxDocs" type="number" defaultValue={editingCabinet?.quotas?.maxDocumentsPerMonth || 100} className="bg-white/5 border-white/10" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="storageLimit" className="text-[10px] uppercase font-black tracking-widest opacity-50">Stockage (GB)</Label>
                                                <Input id="storageLimit" name="storageLimit" type="number" defaultValue={editingCabinet?.quotas?.storageLimitGb || 5} className="bg-white/5 border-white/10" />
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={isSaving} className="w-full font-black uppercase text-[10px] tracking-widest h-12">
                                            {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : editingCabinet ? 'Mettre à jour' : 'Déployer la structure'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-primary/5">
                                <TableHead className="text-[10px] uppercase font-black tracking-widest opacity-40">Cabinet</TableHead>
                                <TableHead className="text-[10px] uppercase font-black tracking-widest opacity-40">Plan & Statut</TableHead>
                                <TableHead className="text-[10px] uppercase font-black tracking-widest opacity-40">Quotas & Usage IA</TableHead>
                                <TableHead className="text-[10px] uppercase font-black tracking-widest opacity-40 text-center">Accès</TableHead>
                                <TableHead className="text-[10px] uppercase font-black tracking-widest opacity-40">Clients</TableHead>
                                <TableHead className="text-right text-[10px] uppercase font-black tracking-widest opacity-40">Commandes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCabinets && filteredCabinets.length > 0 ? (
                                filteredCabinets.map((cabinet) => (
                                    <TableRow key={cabinet.id} className="hover:bg-primary/5 transition-colors group">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 font-black">
                                                    {cabinet.name?.[0].toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm">{cabinet.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">{cabinet.email || 'id: ' + cabinet.id}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <Badge variant="outline" className="font-black text-[9px] uppercase tracking-tighter bg-primary/10 text-primary border-primary/20 w-fit">
                                                    {cabinet.plan || 'SaaS Élite'}
                                                </Badge>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 w-fit">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-[9px] font-black uppercase text-emerald-500 tracking-tighter">Opérationnel</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-2 min-w-[140px]">
                                                <div className="flex justify-between text-[9px] font-black uppercase opacity-60">
                                                    <span>IA Usage</span>
                                                    <span className={cn(
                                                        (cabinet.quotas?.usedDocumentsMonth || 0) > (cabinet.quotas?.maxDocumentsPerMonth || 100) * 0.9 ? "text-primary" : ""
                                                    )}>
                                                        {cabinet.quotas?.usedDocumentsMonth || 0} / {cabinet.quotas?.maxDocumentsPerMonth || 100}
                                                    </span>
                                                </div>
                                                <Progress 
                                                    value={((cabinet.quotas?.usedDocumentsMonth || 0) / (cabinet.quotas?.maxDocumentsPerMonth || 100)) * 100} 
                                                    className="h-1 bg-white/5"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {cabinet.invitationStatus === 'pending' ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <Badge variant="outline" className="text-[8px] font-black border-blue-500/30 text-blue-500 bg-blue-500/5 uppercase animate-pulse">Invité</Badge>
                                                    <span className="text-[7px] font-bold opacity-40">{new Date(cabinet.invitationSentAt).toLocaleDateString()}</span>
                                                </div>
                                            ) : cabinet.invitationStatus === 'accepted' ? (
                                                <Badge variant="outline" className="text-[8px] font-black border-emerald-500/30 text-emerald-500 bg-emerald-500/5 uppercase">Connecté</Badge>
                                            ) : (
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 hover:bg-primary/20 text-primary border border-primary/10"
                                                    onClick={() => handleSendInvitation(cabinet)}
                                                >
                                                    <Mail className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-sm font-black font-space">{cabinet.quotas?.usedClients || (cabinet.clientsCount || 0)}</span>
                                                <span className="text-[9px] font-bold opacity-30 text-white uppercase tracking-tighter">/ {cabinet.quotas?.maxClients || 10}</span>
                                            </div>
                                        </TableCell>
                                         <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    size="sm" 
                                                    variant="secondary" 
                                                    className="h-8 font-bold gap-2 text-[10px] uppercase bg-white/5 hover:bg-primary/20 border border-white/10"
                                                    onClick={() => handleImpersonate(cabinet)}
                                                >
                                                    <LogIn className="h-3 w-3" /> Supervision
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 hover:bg-white/10"
                                                    onClick={() => { setEditingCabinet(cabinet); setIsDialogOpen(true); }}
                                                >
                                                    <Pencil className="h-3.5 w-3.5 opacity-40" />
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 hover:bg-destructive/10 text-destructive/40 hover:text-destructive"
                                                    onClick={async () => {
                                                        if (confirm("Supprimer ce cabinet ? Action irréversible.")) {
                                                            await deleteDoc(doc(db, 'cabinets', cabinet.id));
                                                            await auditService.logSystem(`Suppression du cabinet: ${cabinet.name}`, 'error');
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                            <AlertCircle className="h-10 w-10 mb-2" />
                                            <p className="font-bold">Aucun cabinet trouvé.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}