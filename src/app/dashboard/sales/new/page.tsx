'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  ChevronLeft, 
  Calculator,
  User,
  Calendar,
  Layers,
  FileCheck,
  Eye,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useBranding } from '@/components/branding-provider';
import { salesService } from '@/services/sales-service';
import { SalesInvoiceItem, SalesInvoice } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const VAT_RATES = [0, 5.5, 10, 20];

export default function NewInvoicePage() {
  const { profile: userProfile } = useBranding();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    address: ''
  });

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  
  const [items, setItems] = useState<Omit<SalesInvoiceItem, 'id' | 'totalHT' | 'totalVAT' | 'totalTTC'>[]>([
    { description: '', quantity: 1, unitPrice: 0, vatRate: 20 }
  ]);

  const [totals, setTotals] = useState({
    ht: 0,
    vat: 0,
    ttc: 0
  });

  useEffect(() => {
    calculateTotals();
  }, [items]);

  const calculateTotals = () => {
    let ht = 0;
    let vatTotal = 0;

    items.forEach(item => {
      const lineHT = item.quantity * item.unitPrice;
      const lineVAT = lineHT * (item.vatRate / 100);
      ht += lineHT;
      vatTotal += lineVAT;
    });

    setTotals({
      ht,
      vat: vatTotal,
      ttc: ht + vatTotal
    });
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, vatRate: 20 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (status: SalesInvoice['status']) => {
    if (!customer.name) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez renseigner le nom du client.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedItems: SalesInvoiceItem[] = items.map((item, idx) => {
        const ht = item.quantity * item.unitPrice;
        const vat = ht * (item.vatRate / 100);
        return {
          id: idx.toString(),
          ...item,
          totalHT: ht,
          totalVAT: vat,
          totalTTC: ht + vat
        };
      });

      await salesService.createInvoice({
        clientId: userProfile!.id,
        cabinetId: userProfile!.cabinetId || '',
        date,
        dueDate,
        customerName: customer.name,
        customerEmail: customer.email,
        customerAddress: customer.address,
        items: formattedItems,
        totalHT: totals.ht,
        totalVAT: totals.vat,
        totalTTC: totals.ttc,
        status,
        notes
      });

      toast({ title: 'Facture créée', description: `La facture a été enregistrée en tant que ${status === 'draft' ? 'brouillon' : 'envoyée'}.` });
      router.push('/dashboard/sales');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="rounded-xl gap-2 font-space uppercase text-[10px] tracking-widest font-black">
          <ChevronLeft className="h-4 w-4" /> Retour
        </Button>
        <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={isSubmitting} className="rounded-xl border-white/10 bg-white/5 gap-2 font-space uppercase text-[10px] tracking-widest font-black h-11 px-6">
                <Save className="h-4 w-4" /> Brouillon
            </Button>
            <Button onClick={() => handleSubmit('sent')} disabled={isSubmitting} className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-space uppercase text-[10px] tracking-widest font-black h-11 px-6 shadow-lg shadow-primary/20">
                <Send className="h-4 w-4" /> Valider & Envoyer
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 rounded-[2rem] border-none premium-shadow space-y-8">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <User className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black font-space tracking-tight">Informations Client</h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Nom du client</Label>
                    <Input 
                        placeholder="E.g. Acme Corp" 
                        value={customer.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomer({...customer, name: e.target.value})}
                        className="h-12 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Email (Optionnel)</Label>
                    <Input 
                        placeholder="facturation@client.com" 
                        value={customer.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomer({...customer, email: e.target.value})}
                        className="h-12 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20"
                    />
                </div>
                <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Adresse</Label>
                    <Textarea 
                        placeholder="123 rue de la Paix, 75000 Paris" 
                        value={customer.address}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomer({...customer, address: e.target.value})}
                        className="min-h-[100px] rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 resize-none"
                    />
                </div>
             </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-8 rounded-[2rem] border-none premium-shadow space-y-8">
             <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        <Layers className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-black font-space tracking-tight">Articles & Services</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={addItem} className="text-primary font-black font-space uppercase text-[10px] tracking-widest bg-primary/5 hover:bg-primary/10 rounded-xl px-4">
                    <Plus className="h-3 w-3 mr-2" /> Ajouter une ligne
                </Button>
             </div>

             <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {items.map((item, idx) => (
                        <motion.div 
                            key={idx} 
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="group grid grid-cols-12 gap-4 items-end bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
                        >
                            <div className="col-span-12 md:col-span-5 space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Désignation</Label>
                                <Input 
                                    placeholder="Prestation de service..." 
                                    value={item.description}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(idx, 'description', e.target.value)}
                                    className="h-10 rounded-lg bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="col-span-4 md:col-span-2 space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Qté</Label>
                                <Input 
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                    className="h-10 rounded-lg bg-white/5 border-white/10 text-center"
                                />
                            </div>
                            <div className="col-span-8 md:col-span-2 space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Prix Unitaire HT</Label>
                                <Input 
                                    type="number"
                                    value={item.unitPrice}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    className="h-10 rounded-lg bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="col-span-10 md:col-span-2 space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">TVA (%)</Label>
                                <Select value={item.vatRate.toString()} onValueChange={v => updateItem(idx, 'vatRate', parseFloat(v))}>
                                    <SelectTrigger className="h-10 rounded-lg bg-white/5 border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="glass-panel border-white/10 rounded-xl">
                                        {VAT_RATES.map(rate => (
                                            <SelectItem key={rate} value={rate.toString()} className="font-space">{rate}%</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2 md:col-span-1 pb-1">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => removeItem(idx)}
                                    disabled={items.length === 1}
                                    className="h-10 w-10 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
             </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-8 rounded-[2rem] border-none premium-shadow space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Settings className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black font-space tracking-tight">Notes & Conditions</h2>
             </div>
             <Textarea 
                placeholder="Ex: Conditions de paiement, RIB, etc." 
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                className="min-h-[120px] rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 resize-none"
             />
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-8 rounded-[2rem] border-none premium-shadow sticky top-8 space-y-8 bg-gradient-to-br from-primary/10 to-transparent">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/30">
                    <Calculator className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black font-space tracking-tight">Récapitulatif</h2>
             </div>

             <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Date d'émission</Label>
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-white/5 border-white/10 h-10 text-xs" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Échéance</Label>
                    <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="bg-white/5 border-white/10 h-10 text-xs" />
                </div>
             </div>

             <div className="space-y-4 border-t border-white/10 pt-6">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium uppercase tracking-tighter">Total HT</span>
                    <span className="font-bold">{totals.ht.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium uppercase tracking-tighter">TVA cumulée</span>
                    <span className="font-bold">{totals.vat.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <span className="text-lg font-black font-space uppercase tracking-tight">Total TTC</span>
                    <span className="text-2xl font-black font-space text-primary">{totals.ttc.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                </div>
             </div>

             <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-50">
                    <Eye className="h-3 w-3" /> Preview Rapide
                </div>
                <div className="text-[10px] font-medium leading-relaxed">
                    Facture client pour <strong>{customer.name || '...'}</strong><br/>
                    {items.length} ligne(s) d'articles.<br/>
                    Payable avant le {new Date(dueDate).toLocaleDateString()}.
                </div>
             </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
