
'use client';

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { Copy, KeyRound, Bot, Shield, Loader2, AlertCircle, DatabaseZap, User, Briefcase, UserCog } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { configureFirestoreSecurityRules } from "@/ai/flows/security-rules-actions";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/firebase';
import { updateClient } from "@/ai/flows/client-actions";
import { useRouter } from "next/navigation";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";


export default function SettingsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const clientAuth = useAuth();

    const [userRole, setUserRole] = useState<string | null>(null);
    const [userName, setUserName] = useState("Utilisateur");
    const [userEmail, setUserEmail] = useState("");
    const [userUid, setUserUid] = useState<string | null>(null);

    const [automationSettings, setAutomationSettings] = useState({
        isEnabled: false,
        confidenceThreshold: 0.95,
        autoSend: false,
    });
    const [firestoreRules, setFirestoreRules] = useState<string | null>(null);
    const [isLoadingFirestoreRules, setIsLoadingFirestoreRules] = useState(false);
    const [isAdminRoleLoading, setIsAdminRoleLoading] = useState(false);

    useEffect(() => {
        const role = localStorage.getItem('userRole');
        setUserRole(role);
        
        const name = localStorage.getItem('userName');
        if (name) setUserName(name);

        const email = localStorage.getItem('userEmail');
        if (email) setUserEmail(email);
        
        const unsubscribe = clientAuth.onAuthStateChanged(async (user) => {
            if (user) {
                setUserUid(user.uid);
            } else {
                setUserUid(null);
            }
        });

        const storedAutomation = localStorage.getItem('automationSettings');
        if (storedAutomation) {
            setAutomationSettings(JSON.parse(storedAutomation));
        }

        return () => unsubscribe();
    }, [clientAuth]);

    const handleProfileSave = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('userName', userName);
        localStorage.setItem('userEmail', userEmail);
        if (userUid) {
            updateClient({ id: userUid, updates: { name: userName, email: userEmail } });
        }
        toast({
            title: "Profil enregistré",
            description: "Vos informations ont été mises à jour.",
        });
        window.dispatchEvent(new Event('storage'));
    }

    const handlePasswordSave = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Fonctionnalité non implémentée",
            description: "La modification du mot de passe n'est pas encore disponible.",
        });
    }

    const handleAutomationSave = () => {
        localStorage.setItem('automationSettings', JSON.stringify(automationSettings));
        toast({
            title: "Paramètres d'automatisation enregistrés",
            description: "Les nouvelles règles d'automatisation ont été appliquées.",
        });
        window.dispatchEvent(new Event('storage'));
    }
    
    const handleFetchFirestoreRules = async () => {
        setIsLoadingFirestoreRules(true);
        const result = await configureFirestoreSecurityRules();
        if (result.success) {
            setFirestoreRules(result.rules);
        } else {
             toast({
                variant: 'destructive',
                title: "Erreur",
                description: "Impossible de récupérer les règles de sécurité de Firestore.",
            });
        }
        setIsLoadingFirestoreRules(false);
    }
    
    const copyToClipboard = (text: string | null) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({
            title: "Copié !",
            description: "Les règles ont été copiées dans le presse-papiers.",
        });
    }
    
     const handleSetAdminRole = async () => {
        setIsAdminRoleLoading(true);
        try {
            const functions = getFunctions(getApp());
            const setAdminRoleFunc = httpsCallable(functions, 'setAdminRole');

            const result = await setAdminRoleFunc();
            const data = result.data as { success: boolean, message: string };

            if (!data.success) {
                throw new Error(data.message || 'Une erreur est survenue.');
            }
            
            toast({
                title: 'Rôle mis à jour !',
                description: "Vous avez maintenant le rôle d'administrateur. Veuillez vous déconnecter et vous reconnecter pour que les changements prennent effet.",
                duration: 7000
            });
            
            await clientAuth.signOut();
            router.push('/login');

        } catch (error: any) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: error.message || "Une erreur inconnue est survenue lors de l'assignation du rôle.",
            });
        } finally {
            setIsAdminRoleLoading(false);
        }
    }


    const isStaff = userRole === 'accountant' || userRole === 'admin' || userRole === 'secretary';

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                <p className="text-muted-foreground mt-1">Gérez les informations de votre compte et vos préférences.</p>
            </div>
             <Tabs defaultValue="profile" className="space-y-4">
                <TabsList className="h-auto flex-wrap justify-start">
                    <TabsTrigger value="profile">Profil</TabsTrigger>
                    <TabsTrigger value="security">Sécurité</TabsTrigger>
                    <TabsTrigger value="preferences">Préférences</TabsTrigger>
                    {isStaff && <TabsTrigger value="automation">Automatisation</TabsTrigger>}
                    {isStaff && <TabsTrigger value="data-security">Sécurité des Données</TabsTrigger>}
                    {isStaff && <TabsTrigger value="integrations">Intégrations</TabsTrigger>}
                    <TabsTrigger value="admin">Administration</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                        <CardTitle>Profil</CardTitle>
                        <CardDescription>Gérez les informations de votre profil public.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleProfileSave}>
                            <CardContent className="space-y-6">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${userEmail}`} alt={userName} />
                                        <AvatarFallback>{userName?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <Button variant="outline" type="button">Changer l'avatar</Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nom</Label>
                                        <Input id="name" value={userName} onChange={(e) => setUserName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t px-6 py-4 justify-end">
                                <Button type="submit">Enregistrer</Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                        <CardTitle>Sécurité</CardTitle>
                        <CardDescription>Changez votre mot de passe. Utilisez un mot de passe long et complexe pour plus de sécurité.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handlePasswordSave}>
                            <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Mot de passe actuel</Label>
                                <Input id="current-password" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                                <Input id="new-password" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
                                <Input id="confirm-password" type="password" />
                            </div>
                            </CardContent>
                            <CardFooter className="border-t px-6 py-4 justify-end">
                                <Button type="submit">Changer le mot de passe</Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>
                
                <TabsContent value="preferences">
                     <Card>
                        <CardHeader>
                            <CardTitle>Préférences</CardTitle>
                            <CardDescription>Personnalisez l'apparence et le comportement de l'application.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="theme">Thème sombre</Label>
                                    <p className="text-sm text-muted-foreground">Basculez entre le thème clair et le thème sombre.</p>
                                </div>
                                <Switch 
                                id="theme" 
                                checked={theme === 'dark'}
                                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                                />
                            </div>
                            <Separator />
                             <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="notifications-email">Notifications par email</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {isStaff 
                                            ? "Recevez des emails quand un client téléverse un document."
                                            : "Recevez des emails quand votre comptable valide un document."
                                        }
                                    </p>
                                </div>
                                <Switch id="notifications-email" defaultChecked />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {isStaff && (
                    <>
                        <TabsContent value="automation">
                             <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" /> Automatisation IA</CardTitle>
                                    <CardDescription>
                                        Activez l'approbation automatique des documents lorsque l'IA est suffisamment confiante.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                                        <div>
                                            <Label htmlFor="enable-automation" className="font-semibold">Activer l'auto-approbation</Label>
                                            <p className="text-sm text-muted-foreground">Les documents seront approuvés automatiquement s'ils respectent le seuil de confiance.</p>
                                        </div>
                                        <Switch
                                            id="enable-automation"
                                            checked={automationSettings.isEnabled}
                                            onCheckedChange={(checked) => setAutomationSettings(prev => ({ ...prev, isEnabled: checked }))}
                                        />
                                    </div>
                                    <div className={`space-y-4 ${!automationSettings.isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <Separator />
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <Label htmlFor="confidence-threshold">Seuil de confiance</Label>
                                                <span className="text-sm font-medium text-primary">{Math.round(automationSettings.confidenceThreshold * 100)}%</span>
                                            </div>
                                            <Slider
                                                id="confidence-threshold"
                                                min={0.8} max={1} step={0.01}
                                                value={[automationSettings.confidenceThreshold]}
                                                onValueChange={(value) => setAutomationSettings(prev => ({ ...prev, confidenceThreshold: value[0] }))}
                                            />
                                        </div>
                                        <Separator />
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label htmlFor="auto-send">Envoi automatique vers Cegid</Label>
                                                <p className="text-sm text-muted-foreground">Les documents auto-approuvés seront immédiatement envoyés à Cegid.</p>
                                            </div>
                                            <Switch
                                                id="auto-send"
                                                checked={automationSettings.autoSend}
                                                onCheckedChange={(checked) => setAutomationSettings(prev => ({ ...prev, autoSend: checked }))}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                 <CardFooter className="border-t px-6 py-4 justify-end">
                                    <Button onClick={handleAutomationSave}>Enregistrer</Button>
                                 </CardFooter>
                            </Card>
                        </TabsContent>
                        
                        <TabsContent value="data-security">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><DatabaseZap className="h-5 w-5"/> Sécurité des Données (Firestore)</CardTitle>
                                    <CardDescription>Configurez les règles de sécurité Firestore pour isoler les données des clients et protéger votre application.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {firestoreRules ? (
                                        <div className="space-y-4">
                                            <Alert>
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle>Action Manuelle Requise</AlertTitle>
                                                <AlertDescription>
                                                    Copiez ces règles et collez-les dans l'onglet <strong>Règles</strong> de la section <strong>Firestore Database</strong> de votre console Firebase.
                                                </AlertDescription>
                                            </Alert>
                                             <Textarea readOnly value={firestoreRules} className="h-72 font-mono text-xs bg-muted" />
                                            <Button onClick={() => copyToClipboard(firestoreRules)}><Copy className="mr-2 h-4 w-4" /> Copier les règles</Button>
                                        </div>
                                    ) : (
                                         <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                                            <p className="mb-4 text-muted-foreground">Générez les règles de sécurité finales pour votre application.</p>
                                             <Button onClick={handleFetchFirestoreRules} disabled={isLoadingFirestoreRules}>
                                                {isLoadingFirestoreRules ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Génération...</> : "Générer les règles Firestore"}
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="integrations">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Intégrations</CardTitle>
                                    <CardDescription>Connectez CCS Compta à vos logiciels de production.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-muted p-3 rounded-full"><KeyRound className="h-6 w-6 text-muted-foreground" /></div>
                                            <div>
                                                <h4 className="font-semibold">Cegid</h4>
                                                <p className="text-sm text-muted-foreground">Synchronisez vos écritures comptables.</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" disabled>Connecté</Button>
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        <Label htmlFor="cegid-api-key">Clé d'API Cegid</Label>
                                        <Input id="cegid-api-key" type="password" defaultValue="********************" />
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t px-6 py-4 justify-end">
                                    <Button>Enregistrer</Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                    </>
                )}
                
                 <TabsContent value="admin">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><UserCog className="h-5 w-5"/> Administration</CardTitle>
                            <CardDescription>Actions réservées aux administrateurs de la plateforme.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Alert>
                                <Briefcase className="h-4 w-4" />
                                <AlertTitle>Devenir Administrateur</AlertTitle>
                                <AlertDescription>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <p className="text-sm">Cliquez sur ce bouton pour assigner le rôle "admin" à votre propre compte. Cette action nécessite que la Cloud Function "setAdminRole" soit déployée sur votre projet Firebase.</p>
                                        <Button onClick={handleSetAdminRole} disabled={isAdminRoleLoading || userRole === 'admin'}>
                                            {isAdminRoleLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mise à jour...</> : (userRole === 'admin' ? "Déjà Admin" : "Me donner le rôle Admin")}
                                        </Button>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
