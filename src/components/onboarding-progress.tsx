'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Landmark, UploadCloud, UserCheck, Sparkles, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface OnboardingProgressProps {
  hasCompletedProfile: boolean;
  hasConnectedBank: boolean;
  hasUploadedDocument: boolean;
  className?: string;
}

export function OnboardingProgress({
  hasCompletedProfile,
  hasConnectedBank,
  hasUploadedDocument,
  className
}: OnboardingProgressProps) {
  const [progress, setProgress] = useState(0);

  const steps = [
    {
      id: 'profile',
      title: 'Profil complété',
      icon: UserCheck,
      isCompleted: hasCompletedProfile,
    },
    {
      id: 'bank',
      title: 'Banque connectée',
      icon: Landmark,
      isCompleted: hasConnectedBank,
    },
    {
      id: 'document',
      title: 'Premier justificatif',
      icon: UploadCloud,
      isCompleted: hasUploadedDocument,
    }
  ];

  const completedCount = steps.filter(s => s.isCompleted).length;
  const targetProgress = (completedCount / steps.length) * 100;
  const isFullyOnboarded = completedCount === steps.length;

  // Animation fluide de la barre de progression
  useEffect(() => {
    const timer = setTimeout(() => setProgress(targetProgress), 300);
    return () => clearTimeout(timer);
  }, [targetProgress]);

  if (isFullyOnboarded) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className={cn("mb-6", className)}
      >
        <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-transparent premium-shadow overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-emerald-500/20 to-transparent flex items-center justify-center">
            <Trophy className="h-12 w-12 text-emerald-500 opacity-50" />
          </div>
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-5 w-5 text-emerald-500" />
                <h3 className="font-display font-bold text-lg text-emerald-600 dark:text-emerald-400">
                  Onboarding Terminé !
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Votre compte est parfaitement configuré pour la comptabilité automatisée.
              </p>
            </div>
            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-space uppercase tracking-widest text-xs px-3 py-1">
              Pionnier Zero-Touch
            </Badge>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <Card className={cn("glass-panel border-primary/20 bg-gradient-to-br from-primary/5 to-transparent mb-6", className)}>
      <CardContent className="p-4 sm:p-6 space-y-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="font-display font-bold text-lg">En route vers le Zero-Touch Accounting</h3>
              <p className="text-sm text-muted-foreground">Complétez ces étapes pour automatiser votre gestion.</p>
            </div>
            <span className="font-space font-black text-primary text-xl">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-primary/10" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.id} 
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
                  step.isCompleted 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                    : "bg-background/50 border-border/50 text-muted-foreground opacity-70"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-full",
                  step.isCompleted ? "bg-emerald-500/20" : "bg-muted"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{step.title}</p>
                </div>
                <div className="shrink-0">
                  {step.isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 opacity-30" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
