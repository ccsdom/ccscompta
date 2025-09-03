
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
import { Copy, KeyRound, Bot } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsProfileSecurity } from "@/components/settings-profile-security";
import { Slider } from "@/components/ui/slider";

export default function SettingsPage() {
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();
    const [automationSettings, setAutomationSettings] = useState({
        isEnabled: false,
        confidenceThreshold: 0.95,
        autoSend: false,
    });

    useEffect(() => {
        const storedSettings = localStorage.getItem('automationSettings');
        if (storedSettings) {
            setAutomationSettings(JSON.parse(storedSettings));
        }
    }, []);

    const handleAutomationSave = () => {
        localStorage.setItem('automationSettings', JSON.stringify(automationSettings));
        toast({
            title: "Paramètres d'automatisation enregistrés",
            description: "Les nouvelles règles d'automatisation ont été appliquées.",
        });
        window.dispatchEvent(new Event('storage'));
    }


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
        <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
            <TabsTrigger value="automation">Automatisation</TabsTrigger>
            <TabsTrigger value="integrations">Intégrations</TabsTrigger>
            <TabsTrigger value="email-upload">Téléversement par Email</TabsTrigger>
            <TabsTrigger value="preferences">Préférences</TabsTrigger>
        </TabsList>
        
        <SettingsProfileSecurity />

        <TabsContent value="automation">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bot className="h-6 w-6" /> Automatisation IA</CardTitle>
                    <CardDescription>
                        Activez l'approbation automatique des documents lorsque l'IA est suffisamment confiante dans la qualité de l'extraction.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
                        <div>
                            <Label htmlFor="enable-automation" className="font-semibold">Activer l'auto-approbation</Label>
                            <p className="text-sm text-muted-foreground">Si activé, les documents seront automatiquement approuvés s'ils respectent le seuil de confiance.</p>
                        </div>
                        <Switch
                            id="enable-automation"
                            checked={automationSettings.isEnabled}
                            onCheckedChange={(checked) => setAutomationSettings(prev => ({ ...prev, isEnabled: checked }))}
                        />
                    </div>
                    <div className={`space-y-4 ${!automationSettings.isEnabled ? 'opacity-50' : ''}`}>
                         <Separator />
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <Label htmlFor="confidence-threshold">Seuil de confiance</Label>
                                <span className="text-sm font-medium text-primary">{Math.round(automationSettings.confidenceThreshold * 100)}%</span>
                            </div>
                            <Slider
                                id="confidence-threshold"
                                min={0.8}
                                max={1}
                                step={0.01}
                                value={[automationSettings.confidenceThreshold]}
                                onValueChange={(value) => setAutomationSettings(prev => ({ ...prev, confidenceThreshold: value[0] }))}
                                disabled={!automationSettings.isEnabled}
                            />
                            <p className="text-xs text-muted-foreground mt-2">Seuil de confiance minimum requis de la part de l'IA pour approuver un document automatiquement.</p>
                        </div>
                         <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="auto-send">Envoi automatique vers Cegid</Label>
                                <p className="text-sm text-muted-foreground">Si activé, les documents auto-approuvés seront immédiatement envoyés à Cegid.</p>
                            </div>
                            <Switch
                                id="auto-send"
                                checked={automationSettings.autoSend}
                                onCheckedChange={(checked) => setAutomationSettings(prev => ({ ...prev, autoSend: checked }))}
                                disabled={!automationSettings.isEnabled}
                            />
                        </div>
                    </div>
                </CardContent>
                 <CardFooter className="border-t px-6 py-4 justify-end">
                    <Button onClick={handleAutomationSave}>Enregistrer les automatisations</Button>
                </CardFooter>
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
