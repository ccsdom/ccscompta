
'use client';

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { Copy, KeyRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsProfileSecurity } from "@/components/settings-profile-security";

export default function SettingsPage() {
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();
    const [userName, setUserName] = useState("Utilisateur Démo");
    const [userEmail, setUserEmail] = useState("demo@ccs-compta.com");

    const uploadEmail = `uploads-{ID_CLIENT}@ccs-compta-in.com`;


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
        
        <SettingsProfileSecurity />

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
