'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  TrendingUp,
  Users,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useBranding } from '@/components/branding-provider';
import { salesService } from '@/services/sales-service';
import { SalesInvoice } from '@/lib/types';
import Link from 'next/link';

export default function SalesDashboard() {
  const { profile: userProfile } = useBranding();
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (userProfile?.id) {
      loadInvoices();
    }
  }, [userProfile?.id]);

  const loadInvoices = async () => {
    try {
      const data = await salesService.getClientInvoices(userProfile!.id);
      setInvoices(data);
    } catch (error) {
      console.error("Error loading invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: SalesInvoice['status']) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Payée</Badge>;
      case 'sent':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Envoyée</Badge>;
      case 'overdue':
        return <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20">En retard</Badge>;
      default:
        return <Badge variant="outline">Brouillon</Badge>;
    }
  };

  const stats = [
    { label: 'Chiffre d\'Affaires', value: '12 450,00 €', icon: TrendingUp, color: 'text-blue-500', trend: '+12%' },
    { label: 'En attente', value: '3 200,00 €', icon: Clock, color: 'text-amber-500', trend: '5 factures' },
    { label: 'Payé ce mois', value: '8 900,00 €', icon: CheckCircle2, color: 'text-emerald-500', trend: '+8%' },
    { label: 'Clients actifs', value: '12', icon: Users, color: 'text-purple-500', trend: '+2 nouveaux' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black font-space tracking-tight">Mes Ventes</h1>
          <p className="text-muted-foreground font-medium">Gérez vos factures et suivez votre trésorerie en temps réel.</p>
        </div>
        <Link href="/dashboard/sales/new">
          <Button className="h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black font-space gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            <Plus className="h-5 w-5" /> Nouvelle Facture
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-panel border-none premium-shadow overflow-hidden group">
              <CardContent className="p-6 relative">
                <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
                   <stat.icon className="h-24 w-24" />
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-xl bg-white/5 border border-white/10 ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground font-space">{stat.label}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black font-space">{stat.value}</span>
                  <span className="text-[10px] font-bold text-muted-foreground mt-1 flex items-center gap-1">
                    {stat.trend.startsWith('+') ? <ArrowUpRight className="h-3 w-3 text-emerald-500" /> : <Clock className="h-3 w-3" />}
                    {stat.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="glass-panel rounded-[2rem] border-none premium-shadow overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Rechercher un client, un numéro..." 
                    className="pl-10 h-11 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20"
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" className="h-11 rounded-xl border-white/10 bg-white/5 gap-2 font-space uppercase text-[10px] tracking-widest font-black">
                    <Filter className="h-4 w-4" /> Filtres
                </Button>
                <Button variant="outline" className="h-11 rounded-xl border-white/10 bg-white/5 gap-2 font-space uppercase text-[10px] tracking-widest font-black">
                    <Download className="h-4 w-4" /> Export
                </Button>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-white/5">
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground font-space">N° Facture</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground font-space">Client</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground font-space">Date</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground font-space">Total TTC</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground font-space">Statut</th>
                <th className="p-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="p-6"><div className="h-12 bg-white/5 rounded-xl w-full"></div></td>
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-6 rounded-full bg-white/5">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">Aucune facture trouvée.</p>
                      <Link href="/dashboard/sales/new">
                        <Button variant="link" className="text-primary font-black font-space">Créer votre première facture</Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="p-6 font-black font-space">{invoice.invoiceNumber}</td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{invoice.customerName}</span>
                        <span className="text-[10px] text-muted-foreground">{invoice.customerEmail}</span>
                      </div>
                    </td>
                    <td className="p-6 text-sm font-medium">{new Date(invoice.date).toLocaleDateString()}</td>
                    <td className="p-6 font-black font-space">{invoice.totalTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                    <td className="p-6">{getStatusBadge(invoice.status)}</td>
                    <td className="p-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-white/10">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-panel border-white/10 p-2 min-w-[160px]">
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer font-medium"><FileText className="h-4 w-4" /> Voir / Éditer</DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer font-medium"><Download className="h-4 w-4" /> Télécharger PDF</DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer font-medium text-emerald-500 focus:text-emerald-500"><CreditCard className="h-4 w-4" /> Marquer payée</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
