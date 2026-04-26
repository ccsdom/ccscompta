'use client';

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Card, 
    CardHeader, 
    CardTitle, 
    CardContent, 
    CardDescription, 
    CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { 
    Copy, 
    KeyRound, 
    Bot, 
    Shield, 
    Loader2, 
    AlertCircle, 
    DatabaseZap, 
    User, 
    Briefcase, 
    UserCog, 
    UploadCloud,
    Building2,
    Palette,
    Check,
    Globe,
    Mail,
    Phone,
    MapPin,
    ArrowRight,
    Sparkles,
    ShieldCheck
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { configureFirestoreSecurityRules, configureStorageSecurityRules } from "@/ai/flows/security-rules-actions";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/firebase';
import { useRouter } from "next/navigation";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";
import { STORAGE_BUCKET } from "@/firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import type { Client, Cabinet } from "@/lib/types";
import { updateCabinet } from "@/ai/flows/cabinet-actions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const THEME_COLORS = [
    { name: 'Emeraude', color: '#10b981' },
    { name: 'Océan', color: '#0ea5e9' },
    { name: 'Royal', color: '#6366f1' },
    { name: 'Violet', color: '#8b5cf6' },
    { name: 'Rose', color: '#f43f5e' },
    { name: 'Ambre', color: '#f59e0b' },
    { name: 'Ardoise', color: '#64748b' },
];

export default function SettingsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const clientAuth = useAuth();
    
    const [userAuth, setUserAuth] = useState<any>(null);
    useEffect(() => {
        return clientAuth.onAuthStateChanged(user => setUserAuth(user));
    }, [clientAuth]);

    const userRef = useMemo(() => userAuth ? doc(db, 'clients', userAuth.uid) : null, [userAuth]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<Client>(userRef);

    const cabinetRef = useMemo(() => userProfile?.cabinetId ? doc(db, 'cabinets', userProfile.cabinetId) : null, [userProfile]);
    const { data: cabinet, isLoading: isCabinetLoading } = useDoc<Cabinet>(cabinetRef);

    const [activeTab, setActiveTab] = useState("profile");
    const [isAdminRoleLoading, setIsAdminRoleLoading] = useState(false);
    const [isUpdatingCabinet, setIsUpdatingCabinet] = useState(false);

    // Automation Local State
    const [automationSettings, setAutomationSettings] = useState({
        isEnabled: false,
        confidenceThreshold: 0.95,
        autoSend: false,
    });

    useEffect(() => {
        const storedAutomation = localStorage.getItem('automationSettings');
        if (storedAutomation) {
            setAutomationSettings(JSON.parse(storedAutomation));
        }
    }, []);

    const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!userRef) return;
        const formData = new FormData(e.currentTarget);
        const name = formData.get('userName') as string;
        
        try {
            await updateDoc(userRef, { name });
            toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées avec succès." });
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible de mettre à jour le profil.", variant: "destructive" });
        }
    };

    const handleCabinetUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!cabinet) return;
        setIsUpdatingCabinet(true);
        const formData = new FormData(e.currentTarget);
        
        const data = {
            name: formData.get('name') as string,
            slogan: formData.get('slogan') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string,
            address: formData.get('address') as string,
        };

        try {
            const result = await updateCabinet(cabinet.id, data);
            if (result.success) {
                toast({ title: "Cabinet mis à jour", description: "Les informations de votre structure ont été enregistrées." });
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "Erreur", description: error.message || "Une erreur est survenue.", variant: "destructive" });
        } finally {
            setIsUpdatingCabinet(false);
        }
    };

    const handleThemeColorChange = async (color: string) => {
        if (!cabinet) return;
        try {
            await updateCabinet(cabinet.id, { primaryColor: color });
            toast({ 
                title: "Couleur mise à jour", 
                description: `La couleur ${color} a été définie comme thème principal du cabinet.` 
            });
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible de changer la couleur.", variant: "destructive" });
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !cabinet) return;

        try {
            const { getStorage, ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
            const storage = getStorage();
            const logoRef = ref(storage, `cabinets/${cabinet.id}/logo_${Date.now()}`);
            
            toast({ title: "Téléchargement en cours...", description: "Votre logo est en train d'être traité." });
            
            const snapshot = await uploadBytes(logoRef, file);
            const downloadUrl = await getDownloadURL(snapshot.ref);
            
            await updateCabinet(cabinet.id, { logoUrl: downloadUrl });
            
            toast({ title: "Branding mis à jour", description: "Le logo de votre cabinet a été modifié avec succès." });
        } catch (error) {
            console.error("Logo upload failed", error);
            toast({ title: "Échec du téléchargement", description: "Une erreur est survenue lors de l'envoi du logo.", variant: "destructive" });
        }
    };

    const handleAutomationSave = () => {
        localStorage.setItem('automationSettings', JSON.stringify(automationSettings));
        toast({
            title: "Automatisation enregistrée",
            description: "Les règles d'intelligence artificielle ont été mises à jour.",
        });
    };

    const handleSetAdminRole = async () => {
        setIsAdminRoleLoading(true);
        try {
            const functions = getFunctions(getApp());
            const setAdminRoleFunc = httpsCallable(functions, 'setAdminRole');
            const result = await setAdminRoleFunc();
            const data = result.data as { success: boolean, message: string };

            if (!data.success) throw new Error(data.message);
            
            toast({
                title: 'Rôle mis à jour !',
                description: "Vous êtes maintenant Administrateur. Reconnexion nécessaire.",
                duration: 5000
            });
            await clientAuth.signOut();
            router.push('/login');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: error.message || "Une erreur est survenue.",
            });
        } finally {
            setIsAdminRoleLoading(false);
        }
    };

    const isStaff = userProfile?.role === 'accountant' || userProfile?.role === 'admin' || userProfile?.role === 'secretary';

    if (isProfileLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12 pb-24">
            {/* Header section with Luxe style */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                >
                    <div className="flex items-center gap-3">
                        <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-space font-black uppercase tracking-widest text-[10px]">
                            Poste de Contrôle
                        </Badge>
                        <div className="h-1 w-1 rounded-full bg-white/20" />
                        <span className="text-[10px] font-space font-black uppercase tracking-widest text-muted-foreground opacity-50">v4.2.0</span>
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black font-space tracking-tight gradient-text">
                        Paramètres
                    </h1>
                    <p className="text-muted-foreground text-xl max-w-2xl font-medium">
                        Configurez votre expérience et gérez les ressources de votre organisation.
                    </p>
                </motion.div>
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md"
                >
                    <Avatar className="h-14 w-14 ring-4 ring-primary/10 border-2 border-white/5">
                        <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${userProfile?.email}`} />
                        <AvatarFallback>{userProfile?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-space font-black text-sm uppercase tracking-tight">{userProfile?.name}</span>
                        <span className="text-xs text-muted-foreground font-medium opacity-60">{userProfile?.role}</span>
                    </div>
                </motion.div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
                <div className="overflow-x-auto pb-4 scrollbar-hide">
                    <TabsList className="h-auto w-max flex justify-start gap-4 bg-transparent p-0">
                        <TabsTrigger value="profile" className="settings-tab">Profil</TabsTrigger>
                        {isStaff && <TabsTrigger value="cabinet" className="settings-tab">Le Cabinet</TabsTrigger>}
                        <TabsTrigger value="security" className="settings-tab">Sécurité</TabsTrigger>
                        <TabsTrigger value="preferences" className="settings-tab">Préférences</TabsTrigger>
                        {isStaff && <TabsTrigger value="automation" className="settings-tab">IA & Automatisation</TabsTrigger>}
                        {userProfile?.role === 'admin' && <TabsTrigger value="system" className="settings-tab text-primary">Système</TabsTrigger>}
                    </TabsList>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* PROFILE TAB */}
                        <TabsContent value="profile" className="mt-0">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <Card className="lg:col-span-2 glass-panel border-none premium-shadow overflow-hidden rounded-[2.5rem]">
                                    <form onSubmit={handleProfileUpdate}>
                                        <CardHeader className="p-8 border-b border-white/10">
                                            <CardTitle className="font-space font-black text-2xl uppercase tracking-tight flex items-center gap-3">
                                                <User className="h-6 w-6 text-primary" /> Informations Personnelles
                                            </CardTitle>
                                            <CardDescription className="text-base font-medium opacity-60 italic">Identité de l'utilisateur sur la plateforme.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-8 space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] uppercase font-black tracking-widest opacity-50 ml-1">Nom d'affichage</Label>
                                                    <Input name="userName" defaultValue={userProfile?.name} className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20 transition-all font-medium text-lg" />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] uppercase font-black tracking-widest opacity-50 ml-1">Adresse Email</Label>
                                                    <Input disabled value={userProfile?.email} className="h-14 bg-white/[0.02] border-white/5 rounded-2xl opacity-50 cursor-not-allowed font-medium text-lg" />
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="p-8 bg-white/5 flex justify-end">
                                            <Button type="submit" className="h-14 px-10 rounded-2xl bg-primary font-space font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                                                Enregistrer les modifications
                                            </Button>
                                        </CardFooter>
                                    </form>
                                </Card>

                                <Card className="glass-panel border-none premium-shadow rounded-[2.5rem] p-8 flex flex-col items-center text-center space-y-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
                                    <div className="relative">
                                        <Avatar className="h-40 w-40 ring-8 ring-white/5 border-4 border-white/10">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${userProfile?.email}`} />
                                            <AvatarFallback className="text-4xl">{userProfile?.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <Button size="icon" className="absolute bottom-2 right-2 h-10 w-10 rounded-2xl bg-white text-black hover:bg-white/90 shadow-xl shadow-black/20">
                                            <UploadCloud className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black font-space uppercase tracking-tight">{userProfile?.name}</h3>
                                        <Badge variant="outline" className="border-white/20 text-[10px] font-space font-black uppercase tracking-[0.2em] px-3 py-1 opacity-60">
                                            UID: {userProfile?.id.slice(0, 12)}...
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-[200px]">
                                        Votre avatar est généré automatiquement basé sur votre email. Vous pouvez le changer manuellement.
                                    </p>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* CABINET TAB */}
                        {isStaff && (
                            <TabsContent value="cabinet" className="mt-0">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <Card className="glass-panel border-none premium-shadow rounded-[2.5rem] overflow-hidden">
                                        <form onSubmit={handleCabinetUpdate}>
                                            <CardHeader className="p-8 border-b border-white/10">
                                                <CardTitle className="font-space font-black text-2xl uppercase tracking-tight flex items-center gap-3">
                                                    <Building2 className="h-6 w-6 text-primary" /> Identité du Cabinet
                                                </CardTitle>
                                                <CardDescription className="text-base font-medium opacity-60">Informations publiques et branding de votre structure.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-8 space-y-8">
                                                <div className="space-y-4">
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] uppercase font-black tracking-widest opacity-50 ml-1">Nom de la structure</Label>
                                                        <Input name="name" defaultValue={cabinet?.name} className="h-14 bg-white/5 border-white/10 rounded-2xl font-black font-space text-lg uppercase tracking-tight" />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] uppercase font-black tracking-widest opacity-50 ml-1">Slogan / Baseline</Label>
                                                        <Input name="slogan" defaultValue={cabinet?.slogan} placeholder="L'excellence comptable pour demain..." className="h-14 bg-white/5 border-white/10 rounded-2xl font-medium" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="space-y-3">
                                                            <Label className="text-[10px] uppercase font-black tracking-widest opacity-50 ml-1">Email professionnel</Label>
                                                            <Input name="email" type="email" defaultValue={cabinet?.email} className="h-14 bg-white/5 border-white/10 rounded-2xl" />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <Label className="text-[10px] uppercase font-black tracking-widest opacity-50 ml-1">Téléphone</Label>
                                                            <Input name="phone" defaultValue={cabinet?.phone} className="h-14 bg-white/5 border-white/10 rounded-2xl" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] uppercase font-black tracking-widest opacity-50 ml-1">Adresse Siège Social</Label>
                                                        <Input name="address" defaultValue={cabinet?.address} className="h-14 bg-white/5 border-white/10 rounded-2xl" />
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="p-8 bg-white/5 flex justify-end">
                                                <Button disabled={isUpdatingCabinet} type="submit" className="h-14 px-10 rounded-2xl bg-primary font-space font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 group">
                                                    {isUpdatingCabinet ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sauvegarder les détails"}
                                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                </Button>
                                            </CardFooter>
                                        </form>
                                    </Card>

                                    <div className="space-y-8">
                                        <Card className="glass-panel border-none premium-shadow rounded-[2.5rem] p-8 space-y-8">
                                            <div className="flex items-center gap-3">
                                                <Palette className="h-6 w-6 text-primary" />
                                                <h3 className="font-space font-black text-xl uppercase tracking-tight">Thème Visuel</h3>
                                            </div>
                                            <div className="space-y-6">
                                                <Label className="text-[10px] uppercase font-black tracking-widest opacity-50 ml-1">Couleur Signature</Label>
                                                <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                                                    {THEME_COLORS.map(c => (
                                                        <motion.button
                                                            key={c.color}
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleThemeColorChange(c.color)}
                                                            className={cn(
                                                                "h-10 w-10 rounded-full border-2 transition-all flex items-center justify-center",
                                                                cabinet?.primaryColor === c.color 
                                                                    ? "border-white ring-4 ring-primary/20 scale-110" 
                                                                    : "border-transparent"
                                                            )}
                                                            style={{ backgroundColor: c.color }}
                                                            title={c.name}
                                                        >
                                                            {cabinet?.primaryColor === c.color && <Check className="h-4 w-4 text-white" />}
                                                        </motion.button>
                                                    ))}
                                                </div>
                                                <div className="pt-4 flex items-center gap-3">
                                                    <div className="flex-1 h-14 bg-white/5 border border-white/10 rounded-2xl px-4 flex items-center gap-3">
                                                        <div className="h-6 w-6 rounded-full border border-white/20" style={{ backgroundColor: cabinet?.primaryColor }} />
                                                        <span className="font-mono text-sm uppercase opacity-60 tracking-wider font-bold">{cabinet?.primaryColor || '#FFFFFF'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>

                                        <Card className="glass-panel border-none premium-shadow rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group">
                                            <div className="flex items-center gap-3 relative z-10">
                                                <Sparkles className="h-6 w-6 text-primary" />
                                                <h3 className="font-space font-black text-xl uppercase tracking-tight">Logo du Cabinet</h3>
                                            </div>
                                            <div className="relative z-10 p-8 border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center space-y-4 hover:border-primary/50 transition-colors cursor-pointer group/upload relative">
                                                <input 
                                                    type="file" 
                                                    className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                                                    onChange={handleLogoUpload}
                                                    accept="image/*"
                                                />
                                                {cabinet?.logoUrl ? (
                                                    <img src={cabinet.logoUrl} alt="Logo Cabinet" className="h-24 object-contain relative z-10" />
                                                ) : (
                                                    <Building2 className="h-16 w-16 text-muted-foreground opacity-20" />
                                                )}
                                                <div className="text-center relative z-10">
                                                    <p className="font-space font-black uppercase text-[10px] tracking-widest">Glissez-déposez votre logo</p>
                                                    <p className="text-xs text-muted-foreground font-medium opacity-60">PNG, SVG ou JPEG max 2Mo</p>
                                                </div>
                                                <Button variant="outline" className="h-10 px-6 rounded-xl border-white/10 font-space font-black text-[10px] uppercase tracking-widest relative z-10 pointer-events-none">
                                                    Parcourir
                                                </Button>
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            </TabsContent>
                        )}

                        {/* SECURITY TAB */}
                        <TabsContent value="security" className="mt-0">
                            <Card className="max-w-3xl mx-auto glass-panel border-none premium-shadow rounded-[2.5rem] overflow-hidden">
                                <CardHeader className="p-8 border-b border-white/10">
                                    <CardTitle className="font-space font-black text-2xl uppercase tracking-tight flex items-center gap-3">
                                        <ShieldCheck className="h-6 w-6 text-emerald-500" /> Authentification & Accès
                                    </CardTitle>
                                    <CardDescription className="text-base font-medium opacity-60 italic">Protégez l'accès à votre centre de commandement.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] uppercase font-black tracking-widest opacity-50 ml-1">Mot de passe actuel</Label>
                                            <Input type="password" placeholder="••••••••••••" className="h-14 bg-white/5 border-white/10 rounded-2xl" />
                                        </div>
                                        <Separator className="bg-white/5" />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] uppercase font-black tracking-widest opacity-50 ml-1">Nouveau mot de passe</Label>
                                                <Input type="password" placeholder="Ex: !LuxeCompta2024" className="h-14 bg-white/5 border-white/10 rounded-2xl" />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] uppercase font-black tracking-widest opacity-50 ml-1">Confirmation</Label>
                                                <Input type="password" placeholder="••••••••••••" className="h-14 bg-white/5 border-white/10 rounded-2xl" />
                                            </div>
                                        </div>
                                    </div>

                                    <Alert className="bg-emerald-500/10 border-emerald-500/20 rounded-2xl p-6">
                                        <Shield className="h-5 w-5 text-emerald-500" />
                                        <AlertTitle className="font-space font-black uppercase text-xs tracking-widest mb-1 text-emerald-500">Protection Active</AlertTitle>
                                        <AlertDescription className="text-sm font-medium opacity-80">
                                            Votre compte est protégé par le protocole Firebase Zero-Trust. Assurez-vous d'utiliser une clé complexe.
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                                <CardFooter className="p-8 bg-white/5 flex justify-end">
                                    <Button className="h-14 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-space font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-500/20">
                                        Réinitialiser le mot de passe
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        {/* PREFERENCES TAB */}
                        <TabsContent value="preferences" className="mt-0">
                            <Card className="max-w-3xl mx-auto glass-panel border-none premium-shadow rounded-[2.5rem]">
                                <CardHeader className="p-8 border-b border-white/10">
                                    <CardTitle className="font-space font-black text-2xl uppercase tracking-tight">Affichage & Expérience</CardTitle>
                                    <CardDescription className="text-base font-medium opacity-60">Personnalisez votre interface de travail.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-10">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="font-space font-black uppercase text-sm tracking-tight">Mode Apparence</p>
                                            <p className="text-xs text-muted-foreground font-medium opacity-60">Basculez entre le thème sombre et clair pour un confort visuel optimal.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant={theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('light')} className="rounded-xl font-black uppercase text-[10px]">Clair</Button>
                                            <Button variant={theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('dark')} className="rounded-xl font-black uppercase text-[10px]">Sombre</Button>
                                        </div>
                                    </div>
                                    <Separator className="bg-white/5" />
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="font-space font-black uppercase text-sm tracking-tight">Notifications Temps Réel</p>
                                            <p className="text-xs text-muted-foreground font-medium opacity-60">Recevez des alertes instantanées pour les activités critiques.</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* AUTOMATION TAB */}
                        {isStaff && (
                            <TabsContent value="automation" className="mt-0">
                                <Card className="max-w-3xl mx-auto glass-panel border-none premium-shadow rounded-[2.5rem] overflow-hidden">
                                     <CardHeader className="p-8 border-b border-white/10 bg-primary/5">
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse">
                                                <Bot className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="font-space font-black text-2xl uppercase tracking-tight">IA & Automatisation</CardTitle>
                                                <Badge className="bg-emerald-500/20 text-emerald-500 border-none font-black text-[9px] tracking-widest uppercase">Moteur Cognitif v4.0</Badge>
                                            </div>
                                        </div>
                                        <CardDescription className="text-base font-medium opacity-60">Optimisez vos flux de travail grâce à l'intelligence artificielle générative.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-10">
                                        <div className="flex items-center justify-between p-6 border border-primary/20 bg-primary/5 rounded-[2rem]">
                                            <div className="space-y-1">
                                                <p className="font-space font-black uppercase text-sm tracking-tight">Auto-Approbation Cognitive</p>
                                                <p className="text-xs text-muted-foreground font-medium opacity-60 max-w-sm">Les documents seront approuvés sans intervention humaine si le score de confiance dépasse le seuil.</p>
                                            </div>
                                            <Switch
                                                checked={automationSettings.isEnabled}
                                                onCheckedChange={(checked) => setAutomationSettings(prev => ({ ...prev, isEnabled: checked }))}
                                            />
                                        </div>

                                        <div className={cn("space-y-8 transition-all duration-500", !automationSettings.isEnabled && "opacity-30 grayscale pointer-events-none")}>
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-center px-1">
                                                    <p className="font-space font-black uppercase text-xs tracking-widest text-primary">Seuil de Confiance de l'IA</p>
                                                    <span className="font-space font-black text-2xl text-primary">{Math.round(automationSettings.confidenceThreshold * 100)}%</span>
                                                </div>
                                                <Slider
                                                    min={0.8} max={0.99} step={0.01}
                                                    value={[automationSettings.confidenceThreshold]}
                                                    onValueChange={(value) => setAutomationSettings(prev => ({ ...prev, confidenceThreshold: value[0] }))}
                                                    className="py-4"
                                                />
                                                <div className="flex justify-between text-[9px] font-black uppercase opacity-30 tracking-[0.2em] px-1">
                                                    <span>Précision Standard (80%)</span>
                                                    <span>Zéro Erreur (99%)</span>
                                                </div>
                                            </div>

                                            <Separator className="bg-white/5" />

                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="font-space font-black uppercase text-sm tracking-tight">Injection directe CEGID</p>
                                                    <p className="text-xs text-muted-foreground font-medium opacity-60">Exportation automatique des documents auto-approuvés.</p>
                                                </div>
                                                <Switch
                                                    checked={automationSettings.autoSend}
                                                    onCheckedChange={(checked) => setAutomationSettings(prev => ({ ...prev, autoSend: checked }))}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="p-8 bg-white/5 flex justify-end">
                                        <Button onClick={handleAutomationSave} className="h-14 px-10 rounded-2xl bg-primary font-space font-black uppercase text-xs tracking-widest">
                                            Actualiser le moteur d'automatisation
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </TabsContent>
                        )}

                        {/* SYSTEM TAB */}
                        {userProfile?.role === 'admin' && (
                            <TabsContent value="system" className="mt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <Card className="glass-panel border-none premium-shadow rounded-[2.5rem]">
                                        <CardHeader className="p-8 border-b border-white/10">
                                            <CardTitle className="font-space font-black text-2xl uppercase tracking-tight flex items-center gap-3 text-primary">
                                                <DatabaseZap className="h-6 w-6" /> Noyau de Sécurité
                                            </CardTitle>
                                            <CardDescription className="text-base font-medium opacity-60 italic">Administration bas niveau et permissions Firestore/Storage.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-8 space-y-6">
                                            <div className="space-y-4">
                                                <Button onClick={configureFirestoreSecurityRules} className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-foreground font-space font-black uppercase text-xs tracking-widest justify-start gap-3 hover:bg-white/10">
                                                    <Shield className="h-5 w-5 opacity-40" /> Générer les règles Firestore
                                                </Button>
                                                <Button onClick={configureStorageSecurityRules} className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-foreground font-space font-black uppercase text-xs tracking-widest justify-start gap-3 hover:bg-white/10">
                                                    <Globe className="h-5 w-5 opacity-40" /> Déployer règles Storage
                                                </Button>
                                            </div>
                                            <Alert className="bg-primary/5 border-primary/20 rounded-2xl">
                                                <AlertCircle className="h-4 w-4 text-primary" />
                                                <AlertDescription className="text-xs font-medium opacity-80 leading-relaxed">
                                                    Ces actions génèrent des scripts à copier dans la console Firebase pour verrouiller l'infrastructure.
                                                </AlertDescription>
                                            </Alert>
                                        </CardContent>
                                    </Card>

                                    <Card className="glass-panel border-none premium-shadow rounded-[2.5rem]">
                                        <CardHeader className="p-8 border-b border-white/10">
                                            <CardTitle className="font-space font-black text-2xl uppercase tracking-tight flex items-center gap-3">
                                                <UserCog className="h-6 w-6" /> Super Administration
                                            </CardTitle>
                                            <CardDescription className="text-base font-medium opacity-60">Privilèges et élévation de profil.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-8 space-y-6">
                                            <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10">
                                                <p className="text-xs font-medium opacity-70 leading-relaxed mb-6">
                                                    Élévation forcée du rôle utilisateur. Cette action utilise une Cloud Function sécurisée pour modifier les permissions serveur.
                                                </p>
                                                <Button 
                                                    onClick={handleSetAdminRole} 
                                                    disabled={isAdminRoleLoading || userProfile?.role === 'admin'}
                                                    className="w-full h-14 rounded-2xl font-space font-black uppercase text-xs tracking-widest"
                                                >
                                                    {isAdminRoleLoading ? <Loader2 className="animate-spin mr-2" /> : "Devenir Super Admin"}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        )}
                    </motion.div>
                </AnimatePresence>
            </Tabs>
        </div>
    );
}
