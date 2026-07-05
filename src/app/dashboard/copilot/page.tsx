'use client';

import { useState, useEffect, useRef } from 'react';
import { useBranding } from '@/components/branding-provider';
import { db } from '@/firebase';
import { collection, query, where, getDocs, onSnapshot, doc } from 'firebase/firestore';
import { 
  Send, Bot, User, Sparkles, TrendingUp, Landmark, 
  FileText, Coins, HelpCircle, Loader2, Trash2, ArrowRight,
  Info, ShieldCheck, CheckCircle2, RefreshCw, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supportChat, type SupportChatMessage } from '@/services/support-chat-service';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTED_QUESTIONS = [
  { text: "Combien ai-je dépensé au total ?", icon: Coins },
  { text: "Quels sont mes 3 plus gros fournisseurs ?", icon: TrendingUp },
  { text: "Quel est mon montant de TVA récupérable ?", icon: Landmark },
  { text: "Comment fonctionne l'import par email ?", icon: HelpCircle }
];

export default function CopilotPage() {
  const { profile } = useBranding();
  const { toast } = useToast();
  const [clientId, setClientId] = useState<string | null>(null);
  
  // Chat state
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  
  // Client context stats state
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalVat: 0,
    docCount: 0,
    topVendors: [] as string[],
    missingCount: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Resolve Client Id
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedClientId = localStorage.getItem('selectedClientId');
      if (storedClientId) {
        setClientId(storedClientId);
      } else if (profile?.id && profile?.role === 'client') {
        setClientId(profile.id);
      }
    }
  }, [profile]);

  // 2. Load Persisted Chat History
  useEffect(() => {
    if (clientId) {
      const savedHistory = localStorage.getItem(`copilot_chat_history_${clientId}`);
      if (savedHistory) {
        try {
          setMessages(JSON.parse(savedHistory));
        } catch (e) {
          console.warn("Could not load persisted chat history", e);
        }
      } else {
        // Welcome message
        setMessages([
          { 
            role: 'model', 
            text: `Bonjour ${profile?.name || 'Dirigeant'} ! Je suis votre **Assistant IA CCS Compta**.\n\nJe connais en temps réel vos factures approuvées, vos statistiques de dépenses ainsi que vos rapprochements bancaires.\n\nComment puis-je vous aider aujourd'hui ?` 
          }
        ]);
      }
    }
  }, [clientId, profile]);

  // 3. Persist Chat History
  useEffect(() => {
    if (clientId && messages.length > 0) {
      localStorage.setItem(`copilot_chat_history_${clientId}`, JSON.stringify(messages));
    }
  }, [messages, clientId]);

  // 4. Fetch Client Financial Context & Missing Documents Count
  useEffect(() => {
    if (!clientId) return;

    setIsLoadingStats(true);
    
    // Listen to missing documents count
    const unsubMissing = onSnapshot(doc(db, 'missing_documents', clientId), (snap) => {
      if (snap.exists()) {
        const count = snap.data()?.items?.filter((i: any) => i.status === 'missing')?.length || 0;
        setStats(prev => ({ ...prev, missingCount: count }));
      } else {
        setStats(prev => ({ ...prev, missingCount: 0 }));
      }
    });

    // Fetch approved docs context
    const fetchApprovedDocs = async () => {
      try {
        const q = query(
          collection(db, 'documents'),
          where('clientId', '==', clientId),
          where('status', '==', 'approved')
        );
        const snap = await getDocs(q);
        
        let total = 0;
        let vat = 0;
        const vendors: Record<string, number> = {};

        snap.docs.forEach(docSnap => {
          const data = docSnap.data();
          const amounts = data.extractedData?.amounts || [];
          const vatVal = data.extractedData?.vatAmount || 0;
          const vendor = (data.extractedData?.vendorNames || [])[0] || 'Inconnu';
          const amount = amounts.reduce((a: number, b: number) => a + b, 0);
          
          total += amount;
          vat += vatVal;
          vendors[vendor] = (vendors[vendor] || 0) + amount;
        });

        const sortedVendors = Object.entries(vendors)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name]) => name);

        setStats(prev => ({
          ...prev,
          totalSpent: total,
          totalVat: vat,
          docCount: snap.docs.length,
          topVendors: sortedVendors
        }));
      } catch (err) {
        console.warn("Could not load financial context statistics", err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchApprovedDocs();

    return () => {
      unsubMissing();
    };
  }, [clientId]);

  // 5. Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;
    
    setLastFailedMessage(null);
    const userMessage: SupportChatMessage = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build history excluding welcome message if necessary, or just send all messages
      const responseText = await supportChat({
        history: [...messages, userMessage],
        clientId: clientId || undefined
      });

      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      console.error("AI chat assistant failed", error);
      setLastFailedMessage(textToSend);
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: "L'assistant IA n'a pas pu formuler de réponse. Veuillez réessayer."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (!clientId) return;
    localStorage.removeItem(`copilot_chat_history_${clientId}`);
    setMessages([
      { 
        role: 'model', 
        text: `Historique effacé. Je suis prêt pour vos nouvelles questions !` 
      }
    ]);
    toast({ title: "Conversation réinitialisée" });
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col md:flex-row gap-6 p-4 md:p-6 max-w-7xl mx-auto overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
      
      {/* LEFT PANEL: Context / Dashboard Overview (Glassmorphic) */}
      <div className="w-full md:w-80 shrink-0 flex flex-col gap-4">
        
        {/* Title */}
        <div className="pb-2 border-b border-white/5">
          <h1 className="text-3xl font-black font-space tracking-tight flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-primary animate-pulse" />
            Assistant IA
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Votre conseiller financier & technique disponible 24/7.</p>
        </div>

        {/* Dashboard Context Summary */}
        <Card className="glass-panel border-white/10 dark:border-white/5 bg-background/20 premium-shadow rounded-3xl overflow-hidden flex-1 flex flex-col">
          <CardHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent pb-4 shrink-0">
            <CardTitle className="text-sm font-space font-black uppercase tracking-wider text-primary flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5" />
              Contexte Connecté
            </CardTitle>
            <CardDescription className="text-[10px] font-semibold">Les données lues par l'IA pour vos réponses.</CardDescription>
          </CardHeader>
          
          <CardContent className="p-4 flex-1 overflow-y-auto space-y-4 text-xs font-semibold">
            {isLoadingStats ? (
              <div className="flex flex-col gap-3 py-6 items-center justify-center opacity-40">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-[10px] font-space uppercase tracking-wider">Synchronisation...</p>
              </div>
            ) : (
              <>
                {/* Stat 1: Solde & Dépenses */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-white/5 dark:bg-slate-900/40 border border-white/5">
                  <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase font-space tracking-wider">
                    <Coins className="h-3.5 w-3.5" />
                    Dépenses validées
                  </div>
                  <div className="text-lg font-black font-space text-foreground tabular-nums">
                    {stats.totalSpent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium">
                    Basé sur {stats.docCount} document{stats.docCount > 1 ? 's' : ''} approuvé{stats.docCount > 1 ? 's' : ''}.
                  </div>
                </div>

                {/* Stat 2: TVA Récupérable */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-white/5 dark:bg-slate-900/40 border border-white/5">
                  <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase font-space tracking-wider">
                    <Landmark className="h-3.5 w-3.5" />
                    TVA déductible
                  </div>
                  <div className="text-lg font-black font-space text-emerald-500 tabular-nums">
                    {stats.totalVat.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>

                {/* Stat 3: Top Fournisseurs */}
                {stats.topVendors.length > 0 && (
                  <div className="space-y-2 p-3 rounded-2xl bg-white/5 dark:bg-slate-900/40 border border-white/5">
                    <div className="text-muted-foreground text-[10px] uppercase font-space tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Top Fournisseurs
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {stats.topVendors.map((vendor, i) => (
                        <Badge key={i} variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] rounded-lg px-2 py-0.5 font-bold">
                          {vendor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stat 4: Missing Justifications Alert */}
                {stats.missingCount > 0 && (
                  <div className="space-y-1.5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 animate-pulse">
                    <div className="text-[10px] uppercase font-space tracking-wider flex items-center gap-1.5 font-black">
                      <Info className="h-3.5 w-3.5" />
                      Justificatifs requis
                    </div>
                    <div className="text-[11px] font-bold">
                      {stats.missingCount} transaction{stats.missingCount > 1 ? 's' : ''} sans justificatif.
                    </div>
                  </div>
                )}

                {/* Secure Badge */}
                <div className="pt-4 flex items-center gap-2 justify-center text-[10px] text-muted-foreground/60 border-t border-white/5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Isolation Multi-tenant Active</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RIGHT PANEL: Chat Workspace */}
      <div className="flex-1 flex flex-col h-full bg-white/5 dark:bg-[#020617]/20 border border-white/5 rounded-[2rem] premium-shadow-lg overflow-hidden relative">
        
        {/* Chat Header Row */}
        <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Bot className="h-5.5 w-5.5" />
            </div>
            <div>
              <div className="font-space font-black uppercase text-xs tracking-wider text-foreground">AI Accountant Copilot</div>
              <div className="text-[9px] text-muted-foreground font-semibold flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Modèle Gemini 2.5 Flash connecté
              </div>
            </div>
          </div>
          
          <Button variant="ghost" size="icon" onClick={handleClearHistory} className="h-9 w-9 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10" title="Réinitialiser la conversation">
            <Trash2 className="h-4.5 w-4.5" />
          </Button>
        </div>

        {/* Scrollable Conversation Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isAi = msg.role === 'model';
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex gap-4 items-start max-w-[85%] md:max-w-[75%]",
                    isAi ? "mr-auto" : "ml-auto flex-row-reverse"
                  )}
                >
                  {/* Avatar bubble */}
                  <div className={cn(
                    "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border",
                    isAi 
                      ? "bg-primary/10 border-primary/20 text-primary" 
                      : "bg-white/5 border-white/10 text-foreground"
                  )}>
                    {isAi ? <Bot className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                  </div>

                  {/* Message bubble */}
                  <div className={cn(
                    "rounded-2xl p-4 text-sm font-medium leading-relaxed shadow-sm whitespace-pre-wrap",
                    isAi 
                      ? "bg-white/5 dark:bg-slate-900/30 border border-white/5 text-foreground" 
                      : "bg-primary text-primary-foreground font-semibold"
                  )}>
                    {msg.text}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {/* Typing Loading State */}
          {isLoading && (
            <div className="flex gap-4 items-start mr-auto max-w-[75%]">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border bg-primary/10 border-primary/20 text-primary">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <div className="rounded-2xl p-4 bg-white/5 border border-white/5 flex items-center gap-1.5 h-11 shrink-0">
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts & Input Bar */}
        <div className="p-4 border-t border-white/5 bg-white/[0.02] space-y-4 shrink-0">
          
          {/* Suggested Prompts (Hidden on mobile if space is tight) */}
          {messages.length <= 1 && !isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {SUGGESTED_QUESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(item.text)}
                  className="flex items-center justify-between text-left p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-primary/[0.02] text-xs font-semibold text-muted-foreground hover:text-foreground transition-all duration-300 group"
                >
                  <span className="mr-2 truncate">{item.text}</span>
                  <item.icon className="h-4 w-4 shrink-0 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          )}

          {/* Retry Banner */}
          {lastFailedMessage && !isLoading && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold animate-in slide-in-from-bottom-2 duration-300">
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0 animate-bounce" />
                La dernière requête a échoué. Souhaitez-vous réessayer ?
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const msg = lastFailedMessage;
                    setLastFailedMessage(null);
                    handleSend(msg);
                  }}
                  className="h-8 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-500 font-bold flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Réessayer
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setLastFailedMessage(null)}
                  className="h-8 w-8 p-0 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground flex items-center justify-center"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Form input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-3 relative"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Faites une demande à l'IA (ex: Quels sont mes frais Orange ?)..."
              disabled={isLoading}
              className="bg-background border border-input focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary/50 text-foreground h-12 pr-14 premium-shadow-sm font-semibold rounded-2xl"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="absolute right-1.5 top-1.5 h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300"
            >
              <Send className="h-4.5 w-4.5" />
            </Button>
          </form>
        </div>

      </div>

    </div>
  );
}
