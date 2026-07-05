'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, doc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useBranding } from '@/components/branding-provider';
import { Document, Client, Invoice } from '@/lib/types';
import { 
  Calculator, 
  TrendingUp, 
  Download, 
  Users, 
  FileText, 
  Search,
  ChevronDown,
  Calendar,
  DollarSign,
  PieChart,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  HelpCircle,
  RefreshCw,
  Zap,
  Settings,
  LinkIcon,
  ExternalLink,
  Wallet,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// --- Constants (CCS Billing Model) ---
const FIXED_BALANCE_FEE = 400;
const LINE_FEE = 0.50;

type ReminderTone = 'diplomatic' | 'assertive' | 'warm';

function generateAiReminder(clientName: string, invNumber: string, amount: number, dueDate: string, tone: ReminderTone): string {
  const formattedAmount = amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  switch (tone) {
    case 'diplomatic':
      return `Bonjour ${clientName},

J'espère que vous allez bien.

Je me permets de vous contacter concernant la facture n° ${invNumber} d'un montant de ${formattedAmount}, émise par notre cabinet et arrivant à échéance le ${dueDate}. Il est possible que ce document ait échappé à votre vigilance.

Nous vous serions reconnaissants de bien vouloir vérifier son statut et, le cas échéant, procéder à son règlement depuis votre portail sécurisé CCS Compta.

Si le paiement a déjà été effectué, n'hésitez pas à nous le signaler afin que nous puissions mettre à jour nos écritures.

Bien cordialement,
Votre expert-comptable`;
    case 'assertive':
      return `Bonjour ${clientName},

Nous constatons à ce jour que la facture n° ${invNumber} d'un montant de ${formattedAmount}, émise par notre cabinet et arrivée à échéance le ${dueDate}, reste impayée.

Nous vous demandons de bien vouloir régulariser cette situation dans les plus brefs délais en effectuant le règlement en ligne via votre espace client CCS Compta. 

En cas de difficultés de trésorerie passagères, nous vous invitons à prendre contact avec notre cabinet pour en échanger.

Dans l'attente de votre règlement,
Le service facturation du cabinet`;
    case 'warm':
      return `Bonjour ${clientName},

Comment se passe votre semaine ?

Un petit message amical de notre équipe pour vous rappeler que la facture de prestations n° ${invNumber} d'un montant de ${formattedAmount} est disponible sur votre espace (échéance au ${dueDate}).

Vous pouvez la régler en quelques clics en toute sécurité sur votre tableau de bord CCS Compta.

Si vous avez la moindre question concernant vos déclarations ou vos documents récents, nous restons disponibles.

Prenez soin de vous,
L'équipe de votre Cabinet`;
  }
}

export default function BillingReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [activeView, setActiveView] = useState<'production' | 'stripe'>('production');
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  const { profile: userProfile, role: userRole, cabinet } = useBranding();
  
  // GhostHunter Billing States
  const [activeInvoiceForReminder, setActiveInvoiceForReminder] = useState<Invoice | null>(null);
  const [reminderText, setReminderText] = useState('');
  const [reminderTone, setReminderTone] = useState<ReminderTone>('diplomatic');
  const cabinetId = userProfile?.cabinetId;
  const isStaff = userRole && ['accountant', 'secretary'].includes(userRole);
  const isAdmin = userRole === 'admin';

  // 1. Listen for Docs & Clients & Invoices
  useEffect(() => {
    if (!userProfile) return;
    
    // Only query if the user is staff or admin
    if (!isStaff && !isAdmin) {
        setLoading(false);
        return;
    }

    const docsRef = collection(db, 'documents');
    const clientsRef = collection(db, 'clients');
    const invoicesRef = collection(db, 'invoices');

    // Filter documents by billingPeriod server-side to save cost and memory
    const qDocs = isAdmin 
      ? query(docsRef, where('billingPeriod', '==', selectedPeriod)) 
      : query(docsRef, where('cabinetId', '==', cabinetId), where('billingPeriod', '==', selectedPeriod));
      
    const qClients = isAdmin 
      ? query(clientsRef, where('role', '==', 'client')) 
      : query(clientsRef, where('role', '==', 'client'), where('cabinetId', '==', cabinetId));

    const unsubDocs = onSnapshot(qDocs, (snapshot) => {
      setDocuments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Document)));
    }, (error) => {
      console.error("Firestore docs subscription failed:", error);
    });
    
    const unsubClients = onSnapshot(qClients, (snapshot) => {
      setClients(snapshot.docs.map(c => ({ id: c.id, ...c.data() } as Client)));
      setLoading(false);
    }, (error) => {
      console.error("Firestore clients subscription failed:", error);
      setLoading(false);
    });

    const unsubInvoices = onSnapshot(invoicesRef, (snapshot) => {
      setInvoices(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    }, (error) => {
      console.error("Firestore invoices subscription failed:", error);
    });

    return () => {
      unsubDocs();
      unsubClients();
      unsubInvoices();
    };
  }, [userProfile, cabinetId, isAdmin, isStaff, selectedPeriod]);

  // 2. Aggregate Data per Client for the selected period
  const billingData = useMemo(() => {
    const periodDocs = documents.filter(doc => doc.status === 'approved');
    
    // Linear pass O(D) to group documents by client
    const docsByClient = new Map<string, Document[]>();
    periodDocs.forEach(d => {
      if (d.clientId) {
        const list = docsByClient.get(d.clientId) || [];
        list.push(d);
        docsByClient.set(d.clientId, list);
      }
    });

    // O(C) mapping
    return clients.map(client => {
      const clientDocs = docsByClient.get(client.id) || [];
      const totalLines = clientDocs.reduce((acc, doc) => acc + (doc.billableLines || 0), 0);
      const totalDocs = clientDocs.length;
      
      const variableAmount = totalLines * LINE_FEE;
      const totalAmount = FIXED_BALANCE_FEE + variableAmount;

      const clientInvoice = invoices.find(
        inv => inv.clientId === client.id && 
        (inv.date.startsWith(selectedPeriod) || inv.number.includes(selectedPeriod))
      );

      return {
        id: client.id,
        name: client.name,
        totalDocs,
        totalLines,
        variableAmount,
        fixedAmount: FIXED_BALANCE_FEE,
        totalAmount,
        invoice: clientInvoice
      };
    }).filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [documents, clients, invoices, selectedPeriod, searchQuery]);

  // 3. Global Stats
  const globalStats = useMemo(() => {
    const totalRevenue = billingData.reduce((acc, c) => acc + c.totalAmount, 0);
    const totalLines = billingData.reduce((acc, c) => acc + c.totalLines, 0);
    const topClient = [...billingData].sort((a, b) => b.totalAmount - a.totalAmount)[0];
    
    return { totalRevenue, totalLines, topClient };
  }, [billingData]);

  // 4. Period Selection (Last 6 months)
  const periods = useMemo(() => {
    const p = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      p.push(d.toISOString().substring(0, 7));
    }
    return p;
  }, []);

  // Security Access Guard at component rendering level
  if (!isStaff && !isAdmin) {
      return (
           <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center p-6 text-center">
              <Card className="max-w-md glass-panel border-none premium-shadow p-12 rounded-[2.5rem]">
                  <div className="h-20 w-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <ShieldCheck className="h-10 w-10 text-red-500" />
                  </div>
                  <h2 className="text-3xl font-black font-space tracking-tight mb-4 text-foreground">Zone Interdite</h2>
                  <p className="text-muted-foreground mb-8 text-lg font-medium">Vous n'avez pas les habilitations nécessaires pour accéder au pilotage de la facturation cabinet.</p>
                  <Button onClick={() => router.push('/dashboard')} className="h-12 px-8 rounded-xl bg-primary font-space font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
                      Retour au Dashboard
                  </Button>
              </Card>
          </div>
      );
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
        <Calculator className="h-10 w-10 text-primary opacity-50" />
      </motion.div>
    </div>
  );

  const isStripeConnected = cabinet?.stripeConnectStatus === 'active';
  const isStripePending = cabinet?.stripeConnectStatus === 'pending';

  const handleConnectStripe = async () => {
    if (!cabinet?.id) return;
    setIsStripeLoading(true);
    try {
      const response = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cabinetId: cabinet.id })
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Erreur de connexion");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
      setIsStripeLoading(false);
    }
  };

  const handleGenerateInvoice = async (clientId: string, clientName: string, amount: number, period: string) => {
    try {
      const invoicesRef = collection(db, 'invoices');
      const invoiceNumber = `FAC-${period}-${clientId.substring(0, 4).toUpperCase()}`;
      
      const today = new Date().toISOString().substring(0, 10);
      const dueDateObj = new Date();
      dueDateObj.setDate(dueDateObj.getDate() + 15);
      const dueDate = dueDateObj.toISOString().substring(0, 10);

      const newInvoiceDoc = doc(invoicesRef);
      await setDoc(newInvoiceDoc, {
        clientId,
        clientName,
        number: invoiceNumber,
        date: today,
        dueDate,
        amount,
        status: 'pending'
      });

      toast({
        title: "Facture générée !",
        description: `La facture ${invoiceNumber} de ${amount.toFixed(2)} € a été créée avec succès.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur de génération",
        description: error.message || "Impossible de générer la facture.",
      });
    }
  };

  const handleSendReminder = async () => {
    if (!activeInvoiceForReminder) return;
    setIsStripeLoading(true);
    try {
      const notifRef = collection(db, 'notifications');
      await addDoc(notifRef, {
        clientId: activeInvoiceForReminder.clientId,
        message: `Relance Facture Cabinet : La facture ${activeInvoiceForReminder.number} d'un montant de ${activeInvoiceForReminder.amount.toFixed(2)} € est en attente. Règlement requis.`,
        date: new Date().toISOString(),
        isRead: false,
        type: 'billing_reminder',
        extraData: {
          invoiceId: activeInvoiceForReminder.id,
          text: reminderText
        }
      });

      toast({
        title: "Relance envoyée !",
        description: `L'email de relance pour la facture ${activeInvoiceForReminder.number} a été envoyé au client.`,
      });
      setActiveInvoiceForReminder(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur d'envoi",
        description: error.message || "Impossible d'envoyer la relance.",
      });
    } finally {
      setIsStripeLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-white/5">
        <div>
          <h1 className="text-3xl font-black tracking-tight font-heading flex items-center gap-3">
            {activeView === 'production' ? "Production & Facturation" : "Tableau Stripe Connect"}
            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">Vue Cabinet</Badge>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl font-medium">
            {activeView === 'production' 
              ? "Retrouvez ici le relevé de production mensuel pour chaque client. Modèle CCS : 400€ HT (Bilan) + 0,50€ par ligne saisie."
              : "Suivez vos commissions, votre solde de virements et gérez votre compte Stripe Connect relié."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tab switcher */}
          <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 shrink-0">
            {[
              { id: 'production', label: 'Production', icon: FileText },
              { id: 'stripe', label: 'Stripe Connect', icon: CreditCard }
            ].map((tab) => {
              const isActive = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeView === 'production' && (
            <>
               <div className="flex flex-col gap-1">
                 <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Période</label>
                 <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-[180px] bg-card border-primary/10 shadow-sm font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map(p => (
                        <SelectItem key={p} value={p}>{new Date(p).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
               </div>
               <Button variant="outline" className="mt-auto h-10 border-primary/10 hover:bg-primary/5">
                 <Download className="mr-2 h-4 w-4" /> Export CSV
               </Button>
            </>
          )}
        </div>
      </div>

      {activeView === 'production' ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-bottom-2 duration-300">
            {[
              { label: 'Revenu Estimé Total', val: `${globalStats.totalRevenue.toLocaleString()} €`, sub: 'Logiciel + Lignes IA', icon: DollarSign, color: 'text-emerald-500 bg-emerald-500/10' },
              { label: 'Lignes Saisies (IA)', val: globalStats.totalLines.toLocaleString(), sub: 'Volume de production', icon: TrendingUp, color: 'text-violet-500 bg-violet-500/10' },
              { label: 'Revenu IA Actif', val: `${(globalStats.totalLines * LINE_FEE).toLocaleString()} €`, sub: 'Marge brute pure', icon: PieChart, color: 'text-sky-500 bg-sky-500/10' },
              { label: 'Top Client', val: globalStats.topClient?.name || '-', sub: 'Plus gros consommateur', icon: Users, color: 'text-amber-500 bg-amber-500/10' },
            ].map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-none shadow-sm bg-gradient-to-br from-card to-card/50 overflow-hidden group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn("p-2 rounded-lg", kpi.color)}>
                        <kpi.icon className="h-5 w-5" />
                      </div>
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">{kpi.label}</h3>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black font-mono tracking-tighter">{kpi.val}</span>
                      </div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 mt-2">{kpi.sub}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Main Table Area */}
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher un client..." 
                  className="pl-10 h-10 bg-card border-none shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
               <AnimatePresence mode='popLayout'>
                {billingData.map((client, idx) => (
                  <motion.div
                    key={client.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="group hover:shadow-md transition-all border-none bg-card/50 backdrop-blur-sm overflow-hidden border-l-4 border-l-transparent hover:border-l-primary/50">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row md:items-center">
                          
                          {/* Left Side: Client Info */}
                          <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r bg-muted/10 group-hover:bg-muted/20 transition-colors">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-xl">
                                {client.name.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-bold text-lg leading-none">{client.name}</h3>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <FileText className="h-3 w-3" /> {client.totalDocs} documents ce mois
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                               <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none font-mono">
                                 ID: {client.id.substring(0, 8)}
                               </Badge>
                               <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold tracking-widest text-primary hover:text-primary hover:bg-primary/5" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
                                 Détail <ArrowRight className="ml-1 h-3 w-3" />
                               </Button>
                            </div>
                          </div>

                          {/* Middle: Production metrics */}
                          <div className="p-6 flex-1 grid grid-cols-2 gap-8">
                             <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Production Lignes</p>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-2xl font-black font-mono tracking-tighter">{client.totalLines}</span>
                                  <span className="text-xs text-muted-foreground font-medium">lignes saisies</span>
                                </div>
                                <div className="w-full h-1 bg-muted rounded-full mt-2 overflow-hidden">
                                   <motion.div 
                                     initial={{ width: 0 }}
                                     animate={{ width: `${Math.min((client.totalLines / 100) * 100, 100)}%` }}
                                     className="h-full bg-primary"
                                   />
                                </div>
                             </div>
                             <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Valorisation IA</p>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-2xl font-black font-mono tracking-tighter">{client.variableAmount.toFixed(2)} €</span>
                                  <span className="text-xs text-muted-foreground font-medium">HT</span>
                                </div>
                                <p className="text-[9px] text-muted-foreground mt-2 italic">Calculé sur 0,50€ / ligne</p>
                             </div>
                          </div>

                          {/* Invoicing Status & Actions (GhostHunter Billing) */}
                          <div className="p-6 border-t md:border-t-0 md:border-l md:border-r border-white/5 flex flex-col justify-center gap-3 md:w-[240px]">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Facturation</span>
                              {client.invoice ? (
                                client.invoice.status === 'paid' ? (
                                  <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none font-bold text-[9px] px-2 py-0.5 rounded-lg">Payée</Badge>
                                ) : client.invoice.status === 'overdue' ? (
                                  <Badge variant="destructive" className="bg-rose-500/15 text-rose-500 border-none font-bold text-[9px] px-2 py-0.5 rounded-lg animate-pulse">En retard</Badge>
                                ) : (
                                  <Badge className="bg-amber-500/10 text-amber-500 border-none font-bold text-[9px] px-2 py-0.5 rounded-lg">En attente</Badge>
                                )
                              ) : (
                                <Badge variant="secondary" className="bg-white/5 text-muted-foreground border-none font-bold text-[9px] px-2 py-0.5 rounded-lg">Non émise</Badge>
                              )}
                            </div>
                            
                            {client.invoice ? (
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-foreground truncate">{client.invoice.number}</div>
                                <div className="text-[10px] text-muted-foreground font-semibold">Échéance : {new Date(client.invoice.dueDate).toLocaleDateString('fr-FR')}</div>
                              </div>
                            ) : (
                              <div className="text-[10px] text-muted-foreground italic font-medium">Aucune facture émise.</div>
                            )}

                            {client.invoice ? (
                              (client.invoice.status === 'pending' || client.invoice.status === 'overdue') && (
                                <Button 
                                  onClick={() => {
                                    setActiveInvoiceForReminder(client.invoice!);
                                    setReminderTone('diplomatic');
                                    setReminderText(generateAiReminder(
                                      client.name, 
                                      client.invoice!.number, 
                                      client.invoice!.amount, 
                                      new Date(client.invoice!.dueDate).toLocaleDateString('fr-FR'), 
                                      'diplomatic'
                                    ));
                                  }}
                                  className="w-full h-8 rounded-lg font-bold text-xs bg-amber-500 hover:bg-amber-600 text-black border-none flex gap-1.5 justify-center items-center shadow-lg shadow-amber-500/10"
                                >
                                  <AlertCircle className="h-3.5 w-3.5" /> Relancer (Ghost)
                                </Button>
                              )
                            ) : (
                              <Button 
                                onClick={() => handleGenerateInvoice(client.id, client.name, client.totalAmount, selectedPeriod)}
                                className="w-full h-8 rounded-lg font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground border-none flex gap-1.5 justify-center items-center"
                              >
                                <Calculator className="h-3.5 w-3.5" /> Émettre Facture
                              </Button>
                            )}
                          </div>

                          {/* Right: Final Total */}
                          <div className="p-6 md:w-[200px] flex flex-col items-center justify-center bg-primary/5 group-hover:bg-primary/10 transition-colors">
                             <div className="text-center">
                                <p className="text-[10px] uppercase font-bold text-primary tracking-widest mb-1">Total à Facturer</p>
                                <div className="text-3xl font-black font-mono tracking-tight text-primary">
                                  {client.totalAmount.toFixed(2)} €
                                </div>
                                <p className="text-[9px] text-primary/60 mt-1">Dont {client.fixedAmount}€ de fixe</p>
                             </div>
                          </div>

                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
               </AnimatePresence>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Stripe Connect KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-bottom-2 duration-300">
            {[
              { label: 'Solde Stripe Connect', val: `2 450,00 €`, sub: 'Prochain transfert le 10/07', icon: Wallet, color: 'text-indigo-500 bg-indigo-500/10' },
              { label: 'Commissions Cabinet (90%)', val: `${(globalStats.totalRevenue * 0.9).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`, sub: 'Net collecté sur les clients', icon: DollarSign, color: 'text-emerald-500 bg-emerald-500/10' },
              { label: 'Frais Plateforme (10%)', val: `${(globalStats.totalRevenue * 0.1).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`, sub: 'Frais de service CCS Compta', icon: Zap, color: 'text-violet-500 bg-violet-500/10' },
              { label: 'Statut Stripe Connect', val: isStripeConnected ? 'Actif' : isStripePending ? 'En attente' : 'Inactif', sub: cabinet?.stripeConnectAccountId || 'Aucun compte lié', icon: ShieldCheck, color: isStripeConnected ? 'text-emerald-500 bg-emerald-500/10' : isStripePending ? 'text-amber-500 bg-amber-500/10' : 'text-rose-500 bg-rose-500/10' },
            ].map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-none shadow-sm bg-gradient-to-br from-card to-card/50 overflow-hidden group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn("p-2 rounded-lg", kpi.color)}>
                        <kpi.icon className="h-5 w-5" />
                      </div>
                      {kpi.label === 'Statut Stripe Connect' ? (
                        <div className={cn(
                          "h-2.5 w-2.5 rounded-full animate-pulse",
                          isStripeConnected ? "bg-emerald-500" : isStripePending ? "bg-amber-500" : "bg-rose-500"
                        )} />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">{kpi.label}</h3>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black font-mono tracking-tighter">{kpi.val}</span>
                      </div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 mt-2 truncate">{kpi.sub}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Stripe Connect Configuration and Payouts */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-in fade-in duration-500">
            {/* Connection settings */}
            <Card className="lg:col-span-2 glass-panel border-white/10 dark:border-white/5 bg-background/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <Settings className="h-5 w-5 text-primary" />
                  Configuration Stripe Connect
                </CardTitle>
                <CardDescription>Recevez les paiements de vos abonnements et factures clients directement sur votre banque.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isStripeConnected ? (
                  <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-500 rounded-2xl">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <AlertTitle className="font-bold">Cabinet connecté & opérationnel</AlertTitle>
                    <AlertDescription className="text-xs font-semibold mt-1">
                      Votre cabinet est relié à la plateforme avec l'ID Connect <code className="bg-emerald-500/15 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">{cabinet?.stripeConnectAccountId}</code>. Les virements de vos clients seront versés automatiquement sur votre compte bancaire.
                    </AlertDescription>
                  </Alert>
                ) : isStripePending ? (
                  <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-500 rounded-2xl">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <AlertTitle className="font-bold">Inscription Stripe en cours</AlertTitle>
                    <AlertDescription className="text-xs font-semibold mt-1">
                      Vous avez initié la liaison Connect mais l'onboarding n'est pas terminé. Veuillez finaliser les informations sur Stripe pour débloquer les virements.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="bg-rose-500/10 border-rose-500/20 text-rose-500 rounded-2xl">
                    <AlertCircle className="h-4 w-4 text-rose-500" />
                    <AlertTitle className="font-bold">Liaison Stripe requise</AlertTitle>
                    <AlertDescription className="text-xs font-semibold mt-1">
                      Aucun compte Stripe Connect n'est lié à votre cabinet. Les règlements automatiques par carte pour vos clients sont actuellement désactivés.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-xs text-muted-foreground font-medium leading-relaxed bg-white/5 border border-white/5 p-4 rounded-2xl">
                  <div className="font-bold text-foreground mb-1">Comment ça marche ?</div>
                  Stripe Connect vous permet de recevoir les paiements par carte bancaire de vos clients lors du règlement de leurs factures de prestations de cabinet. Les fonds sont déposés sur votre solde Stripe Connect (frais CCS Compta de 10% déduits) et transférés régulièrement sur votre compte bancaire.
                </div>
              </CardContent>
              <CardFooter className="border-t border-white/5 pt-4">
                {!isStripeConnected ? (
                  <Button onClick={handleConnectStripe} disabled={isStripeLoading} className="w-full h-11 rounded-xl font-bold flex gap-2">
                    {isStripeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
                    {isStripePending ? "Reprendre l'inscription Stripe" : "Lier mon compte Stripe Connect"}
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full h-11 rounded-xl font-bold border-white/10 hover:bg-white/5 gap-2" onClick={() => window.open('https://dashboard.stripe.com', '_blank')}>
                    <ExternalLink className="h-4 w-4" /> Accéder à Stripe Dashboard
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* Payouts history */}
            <Card className="lg:col-span-3 glass-panel border-white/10 dark:border-white/5 bg-background/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <Wallet className="h-5 w-5 text-indigo-400" />
                  Historique des Virements (Payouts)
                </CardTitle>
                <CardDescription>Derniers transferts effectués vers votre compte bancaire enregistré.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date de virement</th>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Compte de Destination</th>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Montant Net</th>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { date: '01 Juil 2026', dest: 'Banque Populaire *3482', amount: 1890.00, status: 'success' },
                        { date: '15 Juin 2026', dest: 'Banque Populaire *3482', amount: 2120.50, status: 'success' },
                        { date: '01 Juin 2026', dest: 'Banque Populaire *3482', amount: 1450.00, status: 'success' }
                      ].map((payout, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 text-sm font-semibold text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                              {payout.date}
                            </div>
                          </td>
                          <td className="p-4 text-sm font-bold text-foreground">{payout.dest}</td>
                          <td className="p-4 text-sm font-black font-mono text-indigo-400">+{payout.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                          <td className="p-4">
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold text-[9px] px-2 py-0.5 rounded-lg">
                              Réussi
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* GhostHunter Billing Reminder Dialog */}
      <Dialog open={!!activeInvoiceForReminder} onOpenChange={() => setActiveInvoiceForReminder(null)}>
        <DialogContent className="glass-panel border-white/10 premium-shadow max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-space uppercase flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-amber-500 animate-pulse" />
              Relance Facture (GhostHunter)
            </DialogTitle>
            <DialogDescription>
              Personnalisez et envoyez un rappel de paiement intelligent pour cette facture de cabinet.
            </DialogDescription>
          </DialogHeader>

          {activeInvoiceForReminder && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Facture</div>
                  <div className="font-bold text-sm text-foreground mt-0.5">{activeInvoiceForReminder.number}</div>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Montant</div>
                  <div className="font-bold text-sm text-foreground mt-0.5">
                    {activeInvoiceForReminder.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>
              </div>

              {/* Tone Selector */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-60">Ton du message (IA)</Label>
                <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 w-full">
                  {[
                    { id: 'diplomatic', label: 'Diplomate', tone: 'diplomatic' as const },
                    { id: 'assertive', label: 'Ferme / Relance', tone: 'assertive' as const },
                    { id: 'warm', label: 'Chaleureux', tone: 'warm' as const }
                  ].map((t) => {
                    const isActive = reminderTone === t.tone;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setReminderTone(t.tone);
                          const clientName = activeInvoiceForReminder.clientName;
                          setReminderText(generateAiReminder(
                            clientName, 
                            activeInvoiceForReminder.number, 
                            activeInvoiceForReminder.amount, 
                            new Date(activeInvoiceForReminder.dueDate).toLocaleDateString('fr-FR'), 
                            t.tone
                          ));
                        }}
                        className={cn(
                          "flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300",
                          isActive
                            ? "bg-amber-500 text-black shadow-lg shadow-amber-500/25"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Textarea */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-60">Contenu du Courriel</Label>
                <Textarea 
                  value={reminderText}
                  onChange={(e) => setReminderText(e.target.value)}
                  rows={10}
                  className="bg-white/5 border-white/10 rounded-2xl text-xs font-medium font-sans leading-relaxed focus-visible:ring-amber-500"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveInvoiceForReminder(null)} className="rounded-xl border-white/10">
              Annuler
            </Button>
            <Button 
              onClick={handleSendReminder}
              disabled={isStripeLoading} 
              className="rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-black border-none gap-2 px-6"
            >
              {isStripeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              Envoyer la relance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
