'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { useBranding } from '@/components/branding-provider';
import { Document, Client } from '@/lib/types';
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
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PieChart as ReChartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// --- Constants (CCS Billing Model) ---
const FIXED_BALANCE_FEE = 400;
const LINE_FEE = 0.50;

export default function BillingReportPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const { profile: userProfile } = useBranding();
  const cabinetId = userProfile?.cabinetId;
  const isAdmin = userProfile?.role === 'admin';

  // 1. Listen for Docs & Clients
  useEffect(() => {
    if (!userProfile) return;

    const docsRef = collection(db, 'documents');
    const clientsRef = collection(db, 'clients');

    const qDocs = isAdmin ? query(docsRef) : query(docsRef, where('cabinetId', '==', cabinetId));
    const qClients = isAdmin 
      ? query(clientsRef, where('role', '==', 'client')) 
      : query(clientsRef, where('role', '==', 'client'), where('cabinetId', '==', cabinetId));

    const unsubDocs = onSnapshot(qDocs, (snapshot) => {
      setDocuments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Document)));
    });
    
    const unsubClients = onSnapshot(qClients, (snapshot) => {
      setClients(snapshot.docs.map(c => ({ id: c.id, ...c.data() } as Client)));
      setLoading(false);
    });

    return () => {
      unsubDocs();
      unsubClients();
    };
  }, [userProfile, cabinetId, isAdmin]);

  // 2. Aggregate Data per Client for the selected period
  const billingData = useMemo(() => {
    const periodDocs = documents.filter(doc => doc.billingPeriod === selectedPeriod && doc.status === 'approved');
    
    return clients.map(client => {
      const clientDocs = periodDocs.filter(d => d.clientId === client.id);
      const totalLines = clientDocs.reduce((acc, doc) => acc + (doc.billableLines || 0), 0);
      const totalDocs = clientDocs.length;
      
      const variableAmount = totalLines * LINE_FEE;
      const totalAmount = FIXED_BALANCE_FEE + variableAmount;

      return {
        id: client.id,
        name: client.name,
        totalDocs,
        totalLines,
        variableAmount,
        fixedAmount: FIXED_BALANCE_FEE,
        totalAmount
      };
    }).filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [documents, clients, selectedPeriod, searchQuery]);

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

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
        <Calculator className="h-10 w-10 text-primary opacity-50" />
      </motion.div>
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight font-heading flex items-center gap-3">
             Production & Facturation
            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">Vue Cabinet</Badge>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Retrouvez ici le relevé de production mensuel pour chaque client. 
            Modèle CCS : <span className="text-foreground font-semibold">400€ HT (Bilan) + 0,50€ par ligne saisie</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="space-y-4">
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
                           <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold tracking-widest text-primary hover:text-primary hover:bg-primary/5">
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

    </div>
  );
}
