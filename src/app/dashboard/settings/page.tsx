
'use client';

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { Copy, KeyRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();
    const [userName, setUserName] = useState("Utilisateur Démo");
    const [userEmail, setUserEmail] = useState("demo@ccs-compta.com");

    const uploadEmail = `uploads-{ID_CLIENT}@ccs-compta-in.com`;

    useEffect(() => {
        const storedName = localStorage.getItem('userName');
        if (storedName) setUserName(storedName);

        const storedEmail = localStorage.getItem('userEmail');
        if (storedEmail) setUserEmail(storedEmail);
    }, []);

    const handleProfileSave = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        localStorage.setItem('userName', userName);
        toast({
            title: "Profil enregistré",
            description: "Votre nom a été mis à jour.",
        });
        window.dispatchEvent(new Event('storage')); // Notify header
    }

    const handlePasswordSave = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        toast({
            title: "Fonctionnalité non implémentée",
            description: "La modification du mot de passe n'est pas encore disponible.",
        });
    }

    const handlePreferencesSave = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        toast({
            title: "Préférences enregistrées",
            description: "Vos préférences ont été mises à jour.",
        });
    }
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(uploadEmail);
        toast({
            title: "Copié !",
            description: "L'adresse email a été copiée dans le presse-papiers.",
        });
    }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground mt-1">Gérez les paramètres de votre compte, vos intégrations et vos préférences.</p>
      </div>

       <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
            <TabsTrigger value="integrations">Intégrations</TabsTrigger>
            <TabsTrigger value="email-upload">Téléversement par Email</TabsTrigger>
            <TabsTrigger value="preferences">Préférences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
            <Card>
                <CardHeader>
                <CardTitle>Profil</CardTitle>
                <CardDescription>Gérez les informations de votre profil.</CardDescription>
                </CardHeader>
                <form>
                    <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src="https://picsum.photos/100" data-ai-hint="person face" alt="Utilisateur" />
                            <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <Button variant="outline" type="button">Changer l'avatar</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom</Label>
                            <Input id="name" value={userName} onChange={(e) => setUserName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={userEmail} readOnly disabled/>
                        </div>
                    </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4 justify-end">
                        <Button onClick={handleProfileSave}>Enregistrer les modifications</Button>
                    </CardFooter>
                </form>
            </Card>
        </TabsContent>

        <TabsContent value="security">
            <Card>
                <CardHeader>
                <CardTitle>Sécurité</CardTitle>
                <CardDescription>Changez votre mot de passe ici. Il est recommandé d'utiliser un mot de passe fort.</CardDescription>
                </CardHeader>
                <form>
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
                        <Button onClick={handlePasswordSave}>Changer le mot de passe</Button>
                    </CardFooter>
                </form>
            </Card>
        </TabsContent>
        
        <TabsContent value="integrations">
            <Card>
                <CardHeader>
                <CardTitle>Intégrations</CardTitle>
                <CardDescription>
                    Connectez CCS Compta à vos logiciels de production pour un flux de travail transparent.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                            <div className="bg-muted p-3 rounded-full">
                                <KeyRound className="h-6 w-6 text-muted-foreground" />
                            </div>
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
                    <Button>Enregistrer l'intégration</Button>
                </CardFooter>
            </Card>
        </TabsContent>

        <TabsContent value="email-upload">
            <Card>
                <CardHeader>
                <CardTitle>Téléversement par Email</CardTitle>
                <CardDescription>
                    Communiquez à vos clients leur adresse email dédiée pour qu'ils puissent envoyer leurs documents directement dans la plateforme.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="upload-email">Adresse de téléversement pour vos clients</Label>
                        <div className="flex items-center gap-2">
                            <Input id="upload-email" value={uploadEmail} readOnly />
                            <Button variant="outline" size="icon" type="button" onClick={copyToClipboard}>
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">Copier</span>
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground pt-1">
                            Note: Chaque client possède sa propre adresse unique. Vous pouvez la trouver dans les détails de leur dossier. L'adresse ci-dessus est un modèle.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="preferences">
            <Card>
                <CardHeader>
                <CardTitle>Préférences</CardTitle>
                <CardDescription>Personnalisez l'apparence et les notifications.</CardDescription>
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
                            <Label htmlFor="notifications">Notifications par email</Label>
                            <p className="text-sm text-muted-foreground">Recevez des emails lorsqu'un client téléverse un document.</p>
                        </div>
                        <Switch id="notifications" defaultChecked />
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4 justify-end">
                        <Button onClick={handlePreferencesSave}>Enregistrer les préférences</Button>
                </CardFooter>
            </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
