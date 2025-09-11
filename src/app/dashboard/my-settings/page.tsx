'use client';

import { SettingsProfileSecurity } from "@/components/settings-profile-security";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function MySettingsPage() {
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();

    const handlePreferencesSave = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        toast({
            title: "Préférences enregistrées",
            description: "Vos préférences ont été mises à jour.",
        });
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                <p className="text-muted-foreground mt-1">Gérez les informations de votre compte et vos préférences.</p>
            </div>
             <Tabs defaultValue="profile" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="profile">Profil</TabsTrigger>
                    <TabsTrigger value="security">Sécurité</TabsTrigger>
                    <TabsTrigger value="preferences">Préférences</TabsTrigger>
                </TabsList>

                <SettingsProfileSecurity />
                
                <TabsContent value="preferences">
                     <Card>
                        <CardHeader>
                        <CardTitle>Préférences</CardTitle>
                        <CardDescription>Personnalisez l'apparence de l'application.</CardDescription>
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
                                    <Label htmlFor="notifications-client">Notifications par email</Label>
                                    <p className="text-sm text-muted-foreground">Recevez des emails quand votre comptable valide un document.</p>
                                </div>
                                <Switch id="notifications-client" defaultChecked />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4 justify-end">
                                <Button onClick={handlePreferencesSave}>Enregistrer les préférences</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
