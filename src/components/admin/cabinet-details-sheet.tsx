
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Cabinet } from "@/app/dashboard/cabinets/page";
import { Building2, Users, FileText, BarChart, Mail, KeyRound, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from "@/hooks/use-toast";


interface CabinetDetailsSheetProps {
    cabinet: Cabinet | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onUpdateStatus: (cabinetId: string, status: Cabinet['status']) => void;
}

const mockActivityData = [
  { name: 'Jan', docs: 40 }, { name: 'Fév', docs: 30 },
  { name: 'Mar', docs: 50 }, { name: 'Avr', docs: 45 },
  { name: 'Mai', docs: 60 }, { name: 'Juin', docs: 55 },
];

const mockAccountants = [
    { name: 'Marie Dubois', email: 'marie@cabinet.com' },
    { name: 'Pierre Martin', email: 'pierre@cabinet.com' },
    { name: 'Sophie Lambert', email: 'sophie@cabinet.com' },
];

export function CabinetDetailsSheet({ cabinet, isOpen, onOpenChange, onUpdateStatus }: CabinetDetailsSheetProps) {
    const { toast } = useToast();
    
    if (!cabinet) return null;

    const handleStatusChange = (status: Cabinet['status']) => {
        onUpdateStatus(cabinet.id, status);
        toast({
            title: "Statut mis à jour",
            description: `Le statut du cabinet "${cabinet.name}" est maintenant "${status}".`,
        });
    }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
                <SheetHeader className="p-6">
                    <SheetTitle className="flex items-center gap-3">
                         <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted shrink-0">
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="truncate">
                           <span className="text-2xl">{cabinet.name}</span>
                        </div>
                    </SheetTitle>
                    <SheetDescription>
                        Créé le {new Date(cabinet.creationDate).toLocaleDateString('fr-FR')} - ID: {cabinet.id}
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div className="p-3 rounded-lg bg-muted/50">
                            <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-xl font-bold">{cabinet.clientCount}</p>
                            <p className="text-xs text-muted-foreground">Clients</p>
                        </div>
                         <div className="p-3 rounded-lg bg-muted/50">
                            <FileText className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-xl font-bold">{cabinet.docCount.toLocaleString('fr-FR')}</p>
                            <p className="text-xs text-muted-foreground">Documents</p>
                        </div>
                         <div className="p-3 rounded-lg bg-muted/50">
                            <BarChart className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-xl font-bold">€12,450</p>
                            <p className="text-xs text-muted-foreground">CA (simulé)</p>
                        </div>
                    </div>
                    
                    <Separator />

                    <div>
                        <h4 className="font-semibold mb-3">Activité récente (documents)</h4>
                         <div className="h-[150px] w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChart data={mockActivityData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: 'var(--radius)',
                                        }}
                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Bar dataKey="docs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    
                    <Separator />

                    <div>
                        <h4 className="font-semibold mb-3">Comptes administrateur</h4>
                        <div className="space-y-3">
                             {mockAccountants.slice(0, 2).map(acc => (
                                 <div key={acc.email} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border">
                                            <AvatarFallback>{acc.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-sm">{acc.name}</p>
                                            <p className="text-xs text-muted-foreground">{acc.email}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm">Gérer</Button>
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>
                <SheetFooter className="p-6 bg-muted/30 border-t flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Statut:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                 <Button variant="outline" className="w-[120px] justify-between">
                                    {cabinet.status === 'active' && 'Actif'}
                                    {cabinet.status === 'inactive' && 'Inactif'}
                                    {cabinet.status === 'trial' && 'Essai'}
                                    <ShieldCheck className="h-4 w-4 ml-2 opacity-50"/>
                                 </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleStatusChange('active')}>Actif</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange('inactive')}>Inactif</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange('trial')}>Essai</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => alert('Feature non implémentée')}>
                            <Mail className="mr-2 h-4 w-4" />
                            Contacter
                        </Button>
                         <Button variant="secondary" onClick={() => alert('Feature non implémentée')}>
                            <KeyRound className="mr-2 h-4 w-4" />
                            Réinit. MDP
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
