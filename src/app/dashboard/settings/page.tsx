'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
    const { toast } = useToast();

    const handleSave = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        toast({
            title: "Paramètres enregistrés",
            description: "Vos informations ont été mises à jour.",
        });
    }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground mt-1">Gérez les paramètres de votre compte et vos préférences.</p>
      </div>
      
      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Gérez les informations de votre profil public.</CardDescription>
        </CardHeader>
        <form>
            <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src="https://picsum.photos/100" data-ai-hint="person face" alt="Utilisateur" />
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <Button variant="outline" type="button">Changer l'avatar</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input id="name" defaultValue="Utilisateur Démo" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="demo@papertrail.com" readOnly disabled/>
                </div>
            </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4 justify-end">
                <Button onClick={handleSave}>Enregistrer</Button>
            </CardFooter>
        </form>
      </Card>

      {/* Password Section */}
      <Card>
        <CardHeader>
          <CardTitle>Mot de passe</CardTitle>
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
                <Button onClick={handleSave}>Changer le mot de passe</Button>
            </CardFooter>
        </form>
      </Card>

        {/* Preferences Section */}
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
                <Switch id="theme" />
            </div>
            <Separator />
             <div className="flex items-center justify-between">
                <div>
                    <Label htmlFor="notifications">Notifications par email</Label>
                    <p className="text-sm text-muted-foreground">Recevez des emails lorsque vos documents sont traités.</p>
                </div>
                <Switch id="notifications" defaultChecked />
            </div>
        </CardContent>
         <CardFooter className="border-t px-6 py-4 justify-end">
                <Button onClick={handleSave}>Enregistrer les préférences</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
