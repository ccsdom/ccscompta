'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Building, 
    Save, 
    ChevronLeft, 
    CreditCard, 
    Globe, 
    Mail, 
    Phone, 
    MapPin,
    FileText,
    Landmark,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useBranding } from '@/components/branding-provider';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';

export default function SalesSettingsPage() {
    const { profile } = useBranding();
    const router = useRouter();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        companyName: '',
        siret: '',
        vatNumber: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        iban: '',
        bic: '',
        bankName: ''
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                companyName: profile.name || '',
                siret: profile.siret || '',
                vatNumber: profile.vatNumber || '',
                address: profile.address || '',
                phone: profile.phone || '',
                email: profile.email || '',
                website: profile.website || '',
                iban: profile.iban || '',
                bic: profile.bic || '',
                bankName: profile.bankName || ''
            });
        }
    }, [profile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.id) return;

        setIsSaving(true);
        try {
            const docRef = doc(db, 'clients', profile.id);
            await updateDoc(docRef, {
                name: formData.companyName,
                siret: formData.siret,
                vatNumber: formData.vatNumber,
                address: formData.address,
                phone: formData.phone,
                email: formData.email,
                website: formData.website,
                iban: formData.iban,
                bic: formData.bic,
                bankName: formData.bankName
            });
            toast({
                title: "Paramètres enregistrés",
                description: "Vos informations de facturation ont été mises à jour.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erreur",
                description: error.message,
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-[1000px] mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => router.back()} className="rounded-xl gap-2 font-space uppercase text-[10px] tracking-widest font-black">
                    <ChevronLeft className="h-4 w-4" /> Retour
                </Button>
                <h1 className="text-3xl font-black font-space tracking-tight">Paramètres de Facturation</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Legal Info */}
                    <Card className="glass-panel border-none premium-shadow rounded-[2rem] overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                    <Building className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-black font-space uppercase tracking-tight">Identité Légale</CardTitle>
                                    <CardDescription>Informations affichées en haut de vos factures.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Nom de l'entreprise / Raison Sociale</Label>
                                <Input 
                                    value={formData.companyName}
                                    onChange={e => setFormData({...formData, companyName: e.target.value})}
                                    className="h-11 rounded-xl bg-white/5 border-white/10"
                                    placeholder="E.g. SAS Ma Succès"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">SIRET</Label>
                                    <Input 
                                        value={formData.siret}
                                        onChange={e => setFormData({...formData, siret: e.target.value})}
                                        className="h-11 rounded-xl bg-white/5 border-white/10"
                                        placeholder="14 chiffres"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">N° TVA Intracom.</Label>
                                    <Input 
                                        value={formData.vatNumber}
                                        onChange={e => setFormData({...formData, vatNumber: e.target.value})}
                                        className="h-11 rounded-xl bg-white/5 border-white/10"
                                        placeholder="FR..."
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Adresse du Siège</Label>
                                <Input 
                                    value={formData.address}
                                    onChange={e => setFormData({...formData, address: e.target.value})}
                                    className="h-11 rounded-xl bg-white/5 border-white/10"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Info */}
                    <Card className="glass-panel border-none premium-shadow rounded-[2rem] overflow-hidden">
                        <CardHeader className="bg-blue-500/5 border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                    <Globe className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-black font-space uppercase tracking-tight">Coordonnées</CardTitle>
                                    <CardDescription>Pour que vos clients puissent vous contacter.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1 flex items-center gap-2"><Mail className="h-3 w-3" /> Email de facturation</Label>
                                <Input 
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    className="h-11 rounded-xl bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1 flex items-center gap-2"><Phone className="h-3 w-3" /> Téléphone</Label>
                                <Input 
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    className="h-11 rounded-xl bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1 flex items-center gap-2"><Globe className="h-3 w-3" /> Site Web</Label>
                                <Input 
                                    value={formData.website}
                                    onChange={e => setFormData({...formData, website: e.target.value})}
                                    className="h-11 rounded-xl bg-white/5 border-white/10"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bank Info */}
                    <Card className="md:col-span-2 glass-panel border-none premium-shadow rounded-[2rem] overflow-hidden">
                        <CardHeader className="bg-emerald-500/5 border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    <Landmark className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-black font-space uppercase tracking-tight">Informations de Paiement (RIB)</CardTitle>
                                    <CardDescription>Ces informations apparaîtront en bas de facture pour vos clients.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Nom de la banque</Label>
                                <Input 
                                    value={formData.bankName}
                                    onChange={e => setFormData({...formData, bankName: e.target.value})}
                                    className="h-11 rounded-xl bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">IBAN</Label>
                                <Input 
                                    value={formData.iban}
                                    onChange={e => setFormData({...formData, iban: e.target.value})}
                                    className="h-11 rounded-xl bg-white/5 border-white/10"
                                    placeholder="FR76 ..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">BIC / SWIFT</Label>
                                <Input 
                                    value={formData.bic}
                                    onChange={e => setFormData({...formData, bic: e.target.value})}
                                    className="h-11 rounded-xl bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="md:col-span-2 flex items-end pb-1">
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 w-full">
                                    <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Vos coordonnées bancaires sont stockées de manière sécurisée et ne sont utilisées que pour l'affichage sur vos factures PDF.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSaving} className="h-14 px-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black font-space gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                        <Save className="h-5 w-5" /> Enregistrer les modifications
                    </Button>
                </div>
            </form>
        </div>
    );
}
