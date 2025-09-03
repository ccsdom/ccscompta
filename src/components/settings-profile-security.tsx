
'use client';

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { TabsContent } from "@/components/ui/tabs";


export function SettingsProfileSecurity() {
    const { toast } = useToast();
    const [userName, setUserName] = useState("Utilisateur Démo");
    const [userEmail, setUserEmail] = useState("demo@example.com");

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


    return (
        <>
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
        </>
    )
}
