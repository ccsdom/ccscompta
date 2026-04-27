'use client'

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building, PlusCircle, Search, MoreHorizontal, Edit, Trash2, Download, CheckCircle, XCircle, FileSpreadsheet, LogIn, FileUp, Wand2, Users, Briefcase, Activity, ShieldCheck, UserPlus, ArrowRight, Filter } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ClientImportDialog } from '@/components/client-import-dialog';
import type { Client } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { AiClientDialog } from '@/components/ai-client-dialog';
import { useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, doc, writeBatch, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { cn } from '@/lib/utils';

import { useBranding } from '@/components/branding-provider';

export default function ClientsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { role: userRole, profile, isLoading: isBrandingLoading } = useBranding();

    const isStaff = useMemo(() => userRole && ['admin', 'accountant', 'secretary'].includes(userRole), [userRole]);

    const staffUsersQuery = useMemoFirebase(() => {
        if (!isStaff || !userRole) return null;
        
        // Admin sees everything
        if (userRole === 'admin') {
            return query(collection(db, 'clients'));
        }
        
        // Non-admin MUST have a cabinetId
        if (profile?.cabinetId) {
            return query(collection(db, 'clients'), where('cabinetId', '==', profile.cabinetId));
        }

        return null;
    }, [isStaff, userRole, profile?.cabinetId]);

    const clientUserQuery = useMemoFirebase(() => {
        if (isStaff || !profile?.id) return null;
        return doc(db, 'clients', profile.id);
    }, [isStaff, profile?.id]);

    const { data: allUsersData, isLoading: isLoadingStaffUsers } = useCollection<Client>(staffUsersQuery);
    const { data: clientUserData, isLoading: isLoadingClientUser } = useDoc<Client>(clientUserQuery);

    const allUsers = useMemo(() => {
        if (isStaff) return allUsersData;
        if (clientUserData) return [clientUserData];
        return [];
    }, [isStaff, allUsersData, clientUserData]);

    const accountantsQuery = useMemoFirebase(() => {
        if (!isStaff || !userRole) return null;
        
        const baseQuery = collection(db, 'clients');
        
        if (userRole === 'admin') {
            return query(baseQuery, where('role', '==', 'accountant'));
        }
        
        if (profile?.cabinetId) {
            return query(
                baseQuery, 
                where('role', '==', 'accountant'),
                where('cabinetId', '==', profile.cabinetId)
            );
        }
        
        return null;
    }, [isStaff, userRole, profile?.cabinetId]);
    const { data: accountants, isLoading: isLoadingAccountants } = useCollection<Client>(accountantsQuery);

    const [searchTerm, setSearchTerm] = useState('');
    const [userToDelete, setUserToDelete] = useState<Client | null>(null);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    
    const loading = isBrandingLoading || isLoadingStaffUsers || isLoadingClientUser || (isStaff && (isLoadingAccountants || isBrandingLoading));

    const { filteredClients } = useMemo(() => {
        const users = allUsers || [];
        const clients = users
            .filter(user => user.role === 'client' && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name));
            
        return { filteredClients: clients };
    }, [allUsers, searchTerm]);
    
    const handleSelectAll = (checked: boolean | string) => {
        if (checked) {
            setSelectedUserIds(filteredClients.map(u => u.id));
        } else {
            setSelectedUserIds([]);
        }
    }
    
    const handleSelectRow = (id: string, checked: boolean) => {
        setSelectedUserIds(prev => checked ? [...prev, id] : prev.filter(uid => uid !== id));
    }

    const handleImpersonate = (client: Client) => {
        localStorage.setItem('originalUserRole', userRole || 'admin');
        localStorage.setItem('originalUserName', profile?.name || 'Super Admin');
        localStorage.setItem('originalUserEmail', profile?.email || '');

        localStorage.setItem('userRole', 'client');
        localStorage.setItem('userName', client.legalRepresentative || client.name);
        localStorage.setItem('userEmail', client.email);
        localStorage.setItem('selectedClientId', client.id);

        toast({
            title: `Vue Client Activée`,
            description: `Vous naviguez maintenant en tant que ${client.name}.`,
        });

        window.dispatchEvent(new Event('storage'));
        router.push('/dashboard/my-documents');
    }
    
    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        
        try {
            const batch = writeBatch(db);
            const userRef = doc(db, 'clients', userToDelete.id);
            batch.delete(userRef);
            await batch.commit();

            toast({ title: 'Utilisateur supprimé', description: `L'utilisateur ${userToDelete.name} a été supprimé.` });
            setUserToDelete(null);
            setSelectedUserIds(prev => prev.filter(id => id !== userToDelete.id));

        } catch (error) {
            toast({ title: 'Erreur', description: "La suppression de l'utilisateur a échoué.", variant: 'destructive' });
        }
    }

    const handleBulkStatusChange = async (status: 'active' | 'inactive' | 'onboarding') => {
        try {
            const batch = writeBatch(db);
            selectedUserIds.forEach(id => {
                const userRef = doc(db, 'clients', id);
                batch.update(userRef, { status });
            });
            await batch.commit();
            
            toast({
                title: "Statuts mis à jour",
                description: `${selectedUserIds.length} utilisateurs ont été mis à jour.`
            });
            setSelectedUserIds([]);
        } catch (error) {
             toast({ title: 'Erreur', description: "La mise à jour en masse a échoué.", variant: 'destructive' });
        }
    }
    
    const getUsersToExport = () => {
        if (filteredClients.length === 0) {
            toast({
                title: "Aucun client à exporter",
                description: "La liste est vide.",
                variant: "destructive"
            });
            return null;
        }
        return filteredClients;
    }

    const handleExportXLSX = () => {
        const usersToExport = getUsersToExport();
        if (!usersToExport) return;

        const worksheet = XLSX.utils.json_to_sheet(usersToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");
        
        const date = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `export-clients-${date}.xlsx`);
        
        toast({
            title: "Exportation réussie",
            description: `${usersToExport.length} clients ont été exportés.`,
        });
    }

    const handleExportPDF = () => {
        const usersToExport = getUsersToExport();
        if (!usersToExport) return;

        const doc = new jsPDF();
        doc.text(`Liste des Clients`, 14, 16);
        (doc as any).autoTable({
            head: [['Nom', 'Email', 'Statut', 'Dernière Activité']],
            body: usersToExport.map(c => [c.name, c.email, c.status, new Date(c.lastActivity).toLocaleDateString('fr-FR')]),
            startY: 20,
        });

        const date = new Date().toISOString().slice(0, 10);
        doc.save(`export-clients-${date}.pdf`);

        toast({
            title: "Exportation réussie",
            description: `${usersToExport.length} clients ont été exportés.`,
        });
    }

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'active': 
                return <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 py-1 font-space font-black uppercase text-[9px] tracking-widest">Actif</Badge>
            case 'inactive': 
                return <Badge variant="outline" className="border-white/10 text-muted-foreground px-3 py-1 font-space font-black uppercase text-[9px] tracking-widest">Inactif</Badge>
            case 'onboarding': 
                return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-none px-3 py-1 font-space font-black uppercase text-[9px] tracking-widest">Intégration</Badge>
            default: 
                return <Badge variant="outline" className="border-white/10 px-3 py-1 font-space font-black uppercase text-[9px] tracking-widest">{status}</Badge>
        }
    }
    
    const getAccountantInitial = (accountantId?: string) => {
        if (!accountantId || !accountants) return '';
        const accountant = accountants.find(a => a.id === accountantId);
        return accountant ? accountant.name.split(' ').map(n => n[0]).join('') : '';
    }
    
    if (loading) {
        return (
            <div className="space-y-12 max-w-7xl mx-auto p-4 md:p-8 pb-20">
                <div className="flex justify-between items-end gap-6">
                    <div className="space-y-4 flex-1">
                        <Skeleton className="h-4 w-32 bg-white/5" />
                        <Skeleton className="h-16 w-3/4 bg-white/5" />
                        <Skeleton className="h-6 w-1/2 bg-white/5" />
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                    <Skeleton className="h-[600px] w-full bg-white/5 rounded-[2.5rem]" />
                </div>
            </div>
        )
    }

    if (!isStaff) {
        return (
             <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center p-6 text-center">
                <Card className="max-w-md glass-panel border-none premium-shadow p-12 rounded-[2.5rem]">
                    <div className="h-20 w-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="h-10 w-10 text-red-500" />
                    </div>
                    <h2 className="text-3xl font-black font-space tracking-tight mb-4 text-foreground">Zone Interdite</h2>
                    <p className="text-muted-foreground mb-8 text-lg font-medium">Vous n'avez pas les habilitations nécessaires pour accéder au pilotage SaaS.</p>
                    <Button onClick={() => router.push('/dashboard')} className="h-12 px-8 rounded-xl bg-primary font-space font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
                        Retour au Dashboard
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-10 p-4 md:p-8 max-w-7xl mx-auto pb-24">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                >
                    <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-space font-black uppercase tracking-widest text-[10px]">
                        Infrastructure Clients
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-black font-space tracking-tight gradient-text">Portefeuille Clients</h1>
                    <p className="text-muted-foreground text-xl max-w-2xl font-medium">Supervisez et modérez l'ensemble des structures comptables actives.</p>
                </motion.div>
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-wrap items-center gap-4"
                >
                    <ClientImportDialog onClientsImported={() => {}} />
                    <AiClientDialog />
                    <Button 
                        onClick={() => router.push('/dashboard/clients/new')}
                        className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 font-space font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/20 gap-3 group"
                    >
                        <UserPlus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        Nouveau Client
                    </Button>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="glass-panel border-none premium-shadow-lg overflow-hidden rounded-[2.5rem]">
                    <CardHeader className="p-8 pb-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="relative w-full md:max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                <Input
                                    placeholder="Rechercher une structure..."
                                    className="h-12 pl-12 rounded-xl bg-white/5 border-none font-semibold premium-shadow-sm focus-visible:ring-primary/50"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-12 px-6 rounded-xl border-white/10 glass-panel font-space font-black uppercase text-[10px] tracking-widest flex-1 md:flex-none">
                                            <Download className="mr-2 h-4 w-4" /> Exporter
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="glass-panel border-white/10 shadow-2xl rounded-xl p-2">
                                        <DropdownMenuItem onClick={handleExportXLSX} className="rounded-lg p-3 font-medium transition-colors cursor-pointer">
                                            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-500" />
                                            Exporter en .xlsx
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleExportPDF} className="rounded-lg p-3 font-medium transition-colors cursor-pointer">
                                            <FileUp className="mr-2 h-4 w-4 text-red-500" />
                                            Exporter en .pdf
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                        <AnimatePresence>
                            {selectedUserIds.length > 0 && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-8 pb-6 overflow-hidden"
                                >
                                    <div className="flex items-center space-x-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                        <Badge className="bg-primary text-primary-foreground border-none font-space font-black text-[10px]">{selectedUserIds.length} sélectionné(s)</Badge>
                                        <div className="flex-grow" />
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg bg-white/5 border-white/10 font-space font-black uppercase text-[9px] tracking-widest text-primary">
                                                    Actions groupées
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="glass-panel border-white/10 shadow-2xl p-2">
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger className="rounded-lg p-3 font-medium transition-colors">Changer le statut</DropdownMenuSubTrigger>
                                                    <DropdownMenuPortal>
                                                         <DropdownMenuSubContent className="glass-panel border-white/10 shadow-2xl p-2">
                                                            <DropdownMenuItem onClick={() => handleBulkStatusChange('active')} className="rounded-lg p-3 font-medium transition-colors">Actif</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleBulkStatusChange('inactive')} className="rounded-lg p-3 font-medium transition-colors">Inactif</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleBulkStatusChange('onboarding')} className="rounded-lg p-3 font-medium transition-colors">Intégration</DropdownMenuItem>
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuPortal>
                                                </DropdownMenuSub>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                         <Button variant="ghost" size="sm" onClick={() => setSelectedUserIds([])} className="h-9 font-space font-black uppercase text-[9px] tracking-widest text-muted-foreground hover:text-foreground">
                                            <XCircle className="mr-2 h-4 w-4" /> Annuler
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-white/5">
                                    <TableRow className="border-white/5">
                                        <TableHead className="w-[60px] px-8">
                                                <Checkbox
                                                onCheckedChange={(checked) => handleSelectAll(checked)}
                                                checked={filteredClients.length > 0 && filteredClients.every(u => selectedUserIds.includes(u.id))}
                                                aria-label="Tout sélectionner"
                                                className="border-white/20"
                                            />
                                        </TableHead>
                                        <TableHead className="font-space font-black uppercase text-[10px] tracking-widest py-6">Informations Client</TableHead>
                                        <TableHead className="font-space font-black uppercase text-[10px] tracking-widest">Type / Rôle</TableHead>
                                        <TableHead className="font-space font-black uppercase text-[10px] tracking-widest">Statut</TableHead>
                                        <TableHead className="hidden md:table-cell font-space font-black uppercase text-[10px] tracking-widest">Responsable</TableHead>
                                        <TableHead className="font-space font-black uppercase text-[10px] tracking-widest">Dernière activité</TableHead>
                                        <TableHead className="text-right pr-8 font-space font-black uppercase text-[10px] tracking-widest">Pilotage</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredClients.length > 0 ? filteredClients.map((user, idx) => (
                                        <motion.tr 
                                            key={user.id} 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            data-state={selectedUserIds.includes(user.id) ? "selected" : ""}
                                            className="group border-white/5 transition-colors hover:bg-white/5"
                                        >
                                            <TableCell className="px-8" onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    onCheckedChange={(checked) => handleSelectRow(user.id, !!checked)}
                                                    checked={selectedUserIds.includes(user.id)}
                                                    aria-label={`Sélectionner ${user.name}`}
                                                    className="border-white/20"
                                                />
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-300">
                                                        <Building className="h-6 w-6 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <button 
                                                            className="text-left font-black text-sm tracking-tight hover:text-primary transition-colors" 
                                                            onClick={() => router.push(`/dashboard/clients/${user.id}`)}
                                                        >
                                                            {user.name}
                                                        </button>
                                                        <span className="text-[10px] font-space font-black uppercase tracking-widest opacity-40">Client ID: {user.id.slice(0, 8)}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="border-white/10 font-space font-black uppercase text-[9px] tracking-widest bg-white/5">
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(user.status)}</TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {user.assignedAccountantId ? (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="flex items-center gap-2 group/avatar">
                                                                    <Avatar className="h-8 w-8 border-none bg-primary/10 transition-transform group-hover/avatar:scale-110">
                                                                        <AvatarFallback className="text-[10px] font-black font-space">{getAccountantInitial(user.assignedAccountantId)}</AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="text-xs font-semibold opacity-60 group-hover/avatar:opacity-100 transition-opacity">Expert Attribué</span>
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="glass-panel border-white/10 shadow-2xl p-2 font-space font-black text-[10px] uppercase tracking-widest">
                                                                {accountants?.find(a => a.id === user.assignedAccountantId)?.name}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                ) : (
                                                    <Badge variant="outline" className="opacity-30 border-dashed text-[9px] font-space font-black uppercase tracking-widest px-2 py-0">En attente</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 opacity-60">
                                                    <Activity className="h-3.5 w-3.5" />
                                                    <span className="font-mono text-xs">{new Date(user.lastActivity).toLocaleDateString('fr-FR')}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <div className="flex items-center justify-end gap-3">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-9 px-4 rounded-xl border-white/10 glass-panel font-space font-black uppercase text-[9px] tracking-widest opacity-60 hover:opacity-100 transition-all"
                                                        onClick={() => router.push(`/dashboard/clients/${user.id}/edit`)}
                                                    >
                                                        Modifier
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/5 group-hover:scale-110 transition-all">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="glass-panel border-white/10 shadow-2xl p-2 rounded-xl">
                                                                <DropdownMenuItem onClick={() => handleImpersonate(user)} className="rounded-lg p-3 font-medium transition-colors cursor-pointer text-primary">
                                                                <LogIn className="mr-2 h-4 w-4" />
                                                                Prendre la main
                                                            </DropdownMenuItem>
                                                                <DropdownMenuSeparator className="bg-white/5" />
                                                                <DropdownMenuItem className="text-red-500 rounded-lg p-3 font-medium transition-colors cursor-pointer" onClick={() => setUserToDelete(user)}>
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Supprimer
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </motion.tr>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-48 text-center bg-white/1 flex flex-col items-center justify-center space-y-4">
                                                <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10 opacity-30">
                                                    <Search className="h-8 w-8" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-space font-black uppercase text-xs tracking-widest opacity-40">Horizon Vide</p>
                                                    <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">Aucune structure ne correspond à vos critères de recherche.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent className="glass-panel border-white/10 shadow-2xl rounded-[2rem] p-8">
                    <AlertDialogHeader>
                        <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                            <Trash2 className="h-8 w-8 text-red-500" />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black font-space">Confirmation Irrévocable</AlertDialogTitle>
                        <AlertDialogDescription className="text-base font-medium">
                            Vous êtes sur le point de supprimer définitivement le profil de <span className="font-bold text-foreground">"{userToDelete?.name}"</span>. 
                            Cette action entrainera la perte de tous les accès et documents associés.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 gap-4">
                        <AlertDialogCancel onClick={() => setUserToDelete(null)} className="h-12 px-8 rounded-xl border-white/10 font-space font-black uppercase text-[10px] tracking-widest">Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} className="h-12 px-8 rounded-xl bg-red-500 hover:bg-red-600 font-space font-black uppercase text-[10px] tracking-widest border-none">Supprimer Définitivement</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
