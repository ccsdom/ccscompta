
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileUp, File, CheckCircle, AlertCircle, Loader2, Download, UserPlus, KeyRound } from "lucide-react";
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';
import { type Client } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useAuth, functions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';


interface ClientImportDialogProps {
    onClientsImported: () => void;
    isMenuItem?: boolean;
}

type ParsedClient = Omit<Client, 'id' | 'newDocuments' | 'lastActivity' | 'status'>;
type ActivationLink = { name: string; email: string; setupLink: string };

export function ClientImportDialog({ onClientsImported, isMenuItem }: ClientImportDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedClient[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const clientAuth = useAuth();


    const REQUIRED_HEADERS = ['name', 'siret', 'address', 'legalRepresentative', 'fiscalYearEndDate', 'email', 'phone'];

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const uploadedFile = event.target.files[0];
            if (uploadedFile.type !== 'text/csv') {
                toast({
                    variant: 'destructive',
                    title: 'Type de fichier invalide',
                    description: 'Veuillez sÃ©lectionner un fichier CSV.'
                });
                return;
            }
            setFile(uploadedFile);
            handleParse(uploadedFile);
        }
    };

    const handleParse = (fileToParse: File) => {
        setParsedData([]);
        setErrors([]);
        setIsLoading(true);
        Papa.parse(fileToParse, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const headers = results.meta.fields || [];
                const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));

                if (missingHeaders.length > 0) {
                    setErrors([`Les en-tÃªtes suivants sont manquants dans votre fichier CSV : ${missingHeaders.join(', ')}.`]);
                    setIsLoading(false);
                    return;
                }

                if (results.errors.length > 0) {
                    setErrors(results.errors.map(e => `Ligne ${e.row}: ${e.message}`));
                }

                const validData = (results.data as ParsedClient[]).filter(row => row.name && row.name.trim() !== "");
                setParsedData(validData);
                setIsLoading(false);
            },
            error: (error) => {
                toast({
                    variant: 'destructive',
                    title: 'Erreur de lecture du fichier',
                    description: error.message
                });
                setIsLoading(false);
            }
        });
    };

    const handleImport = async () => {
        if (parsedData.length === 0 || errors.length > 0) {
            toast({
                variant: 'destructive',
                title: 'Importation impossible',
                description: 'Le fichier contient des erreurs ou aucune donnÃ©e valide Ã  importer.'
            });
            return;
        }

        setIsLoading(true);
        let importedCount = 0;
        let errorCount = 0;
        const activationLinks: ActivationLink[] = [];

        if (!clientAuth) {
            toast({ variant: 'destructive', title: 'Erreur d\'authentification', description: 'Veuillez vous reconnecter.' });
            setIsLoading(false);
            return;
        }

        const createUserFunc = httpsCallable(functions, 'createUserWithRole');


        for (const clientData of parsedData) {
            try {
                const dataToSend = {
                    ...clientData,
                    role: 'client',
                };

                const result = await createUserFunc(dataToSend);
                const resultData = result.data as { success: boolean; setupLink?: string };

                if (resultData.success) {
                    importedCount++;
                    if (resultData.setupLink) {
                        activationLinks.push({
                            name: clientData.name,
                            email: clientData.email,
                            setupLink: resultData.setupLink,
                        });
                    }
                } else {
                    throw new Error('La crÃ©ation a Ã©chouÃ© cÃ´tÃ© serveur.');
                }

            } catch (error: any) {
                errorCount++;
                console.error(`Failed to import client ${clientData.name}: ${error.message}`);
            }
        }

        if (importedCount > 0) {
            if (activationLinks.length > 0) {
                const csv = Papa.unparse(activationLinks);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `liens-activation-clients-${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(url);
            }

            toast({
                duration: 20000,
                title: 'Importation terminÃ©e, action requise !',
                description: (
                    <div className="space-y-2">
                        <p>{importedCount} profils clients et comptes d'accÃ¨s ont Ã©tÃ© crÃ©Ã©s.</p>
                        <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
                             <KeyRound className="h-4 w-4" />
                             <AlertTitle>Liens d'activation</AlertTitle>
                             <AlertDescription>
                                Un fichier CSV contenant les liens d'activation disponibles vient d'Ãªtre gÃ©nÃ©rÃ©.
                             </AlertDescription>
                         </Alert>
                    </div>
                )
            });
            onClientsImported();
        }

        if (errorCount > 0) {
             toast({
                variant: 'destructive',
                title: `${errorCount} erreur(s) lors de l'importation`,
                description: "Certains clients n'ont pas pu Ãªtre importÃ©s. VÃ©rifiez les doublons d'email ou de SIRET."
            });
        }

        // Reset state and close dialog
        setFile(null);
        setParsedData([]);
        setErrors([]);
        setIsOpen(false);
        setIsLoading(false);
    }

    const resetState = () => {
        setFile(null);
        setParsedData([]);
        setErrors([]);
    }

    const TriggerComponent = isMenuItem ? 'div' : Button;
    const triggerProps = isMenuItem ? {
        className: "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        children: <><FileUp className="mr-2 h-4 w-4" />Importer des clients</>
    } : {
        variant: "outline",
        children: <><FileUp className="mr-2 h-4 w-4" />Importer</>
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetState();
        }}>
            <DialogTrigger asChild>
                {isMenuItem ? (
                    <div className={(triggerProps as any).className}>
                        {(triggerProps as any).children}
                    </div>
                ) : (
                    <Button variant={(triggerProps as any).variant || "outline"}>
                        {(triggerProps as any).children}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Importer des clients depuis un fichier CSV</DialogTitle>
                    <DialogDescription>
                        TÃ©lÃ©versez un fichier CSV pour ajouter plusieurs clients en une seule fois. Le fichier doit contenir les en-tÃªtes : {REQUIRED_HEADERS.join(', ')}.
                    </DialogDescription>
                </DialogHeader>

                {!file ? (
                    <div className="py-8">
                        <label
                            htmlFor="csv-upload"
                            className="relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:border-primary/50"
                        >
                            <input
                                id="csv-upload"
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                                accept=".csv"
                            />
                            <div className="flex flex-col items-center justify-center text-center">
                                <File className="h-10 w-10 text-muted-foreground" />
                                <p className="mt-4 text-sm font-medium">
                                    Glissez-dÃ©posez ou <span className="font-semibold text-primary">parcourir</span>
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Fichier CSV uniquement
                                </p>
                            </div>
                        </label>
                        <div className="mt-6 text-center">
                           <a href="/clients-to-import.csv" download="clients-a-importer.csv" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2">
                                 <Download className="mr-2 h-4 w-4"/>
                                 TÃ©lÃ©charger le fichier prÃ©-rempli
                               </a>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted border mb-4">
                            <File className="h-5 w-5 shrink-0" />
                            <span className="font-medium truncate flex-1">{file.name}</span>
                            <Button variant="ghost" size="sm" onClick={resetState}>Changer de fichier</Button>
                        </div>

                        {isLoading && !parsedData.length ? (
                            <div className="h-64 flex flex-col items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="mt-4 text-muted-foreground">Analyse du fichier...</p>
                            </div>
                        ) : errors.length > 0 ? (
                            <div className="h-64 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                                <h3 className="font-bold flex items-center gap-2"><AlertCircle /> Erreurs dÃ©tectÃ©es</h3>
                                <ScrollArea className="mt-2 h-[200px] text-sm">
                                    <ul className="space-y-1 list-disc pl-5">
                                        {errors.map((error, i) => <li key={i}>{error}</li>)}
                                    </ul>
                                </ScrollArea>
                            </div>
                        ) : parsedData.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    AperÃ§u des donnÃ©es ({parsedData.length} clients dÃ©tectÃ©s)
                                </h3>
                                <ScrollArea className="h-64 border rounded-lg">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-background">
                                            <TableRow>
                                                <TableHead>Raison Sociale</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>SIRET</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {parsedData.map((client, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>{client.name}</TableCell>
                                                    <TableCell>{client.email}</TableCell>
                                                    <TableCell>{client.siret}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">Annuler</Button>
                    </DialogClose>
                    <Button onClick={handleImport} disabled={parsedData.length === 0 || errors.length > 0 || isLoading}>
                         {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Importation...</> : `Importer ${parsedData.length > 0 ? `(${parsedData.length} clients)`:''}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


