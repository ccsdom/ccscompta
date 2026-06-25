'use client';

import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown, Info, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentSummaryProps {
    summary?: string;
    insight?: {
        type: 'positive' | 'negative' | 'neutral';
        message: string;
    };
    className?: string;
}

export function DocumentSummary({ summary, insight, className }: DocumentSummaryProps) {
    if (!summary && !insight) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("glass-panel p-5 premium-shadow-sm border-none bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 rounded-3xl mb-6", className)}
        >
            <div className="flex items-start gap-4">
                <div className="mt-1 p-2 rounded-2xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <Sparkles className="h-4 w-4" />
                </div>
                <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between">
                        <h4 className="font-black font-space text-[10px] uppercase tracking-widest text-primary/80">Résumé Intelligent</h4>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10">
                            <Zap className="h-3 w-3 text-primary animate-pulse" />
                            <span className="text-[8px] font-black uppercase tracking-tighter opacity-70">Powered by Gemini</span>
                        </div>
                    </div>
                    
                    {summary && (
                        <p className="text-sm leading-relaxed font-medium">
                            {summary}
                        </p>
                    )}

                    {insight && (
                        <div className={cn(
                            "flex items-center gap-3 p-3 rounded-2xl border",
                            insight.type === 'positive' && "bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                            insight.type === 'negative' && "bg-red-500/5 border-red-500/10 text-red-600 dark:text-red-400",
                            insight.type === 'neutral' && "bg-blue-500/5 border-blue-500/10 text-blue-600 dark:text-blue-400"
                        )}>
                            {insight.type === 'positive' && <TrendingUp className="h-4 w-4 shrink-0" />}
                            {insight.type === 'negative' && <TrendingDown className="h-4 w-4 shrink-0" />}
                            {insight.type === 'neutral' && <Info className="h-4 w-4 shrink-0" />}
                            <p className="text-xs font-bold leading-tight">{insight.message}</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
