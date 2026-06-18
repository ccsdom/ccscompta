import { Trophy, Target, TrendingUp, AlertCircle, Medal, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GamificationDashboardProps {
  documentsCount: number;
  anomaliesCount: number;
}

export function GamificationDashboard({ documentsCount, anomaliesCount }: GamificationDashboardProps) {
  // Calcul du Health Score
  // Hypothèse : total transactions = documentsCount + anomaliesCount
  const totalTransactions = documentsCount + anomaliesCount;
  const healthScore = totalTransactions === 0 ? 100 : Math.round((documentsCount / totalTransactions) * 100);
  
  let scoreColor = "text-emerald-500";
  let progressColor = "bg-emerald-500";
  let message = "Parfait ! Votre comptabilité est à jour.";
  
  if (healthScore < 50) {
    scoreColor = "text-red-500";
    progressColor = "bg-red-500";
    message = "Attention, beaucoup de justificatifs manquants.";
  } else if (healthScore < 90) {
    scoreColor = "text-orange-500";
    progressColor = "bg-orange-500";
    message = "Presque ça ! Encore un petit effort.";
  }

  const isPerfect = healthScore === 100 && totalTransactions > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Widget 1: Health Score */}
      <Card className="glass-panel border-none premium-shadow bg-gradient-to-br from-card to-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Target className="h-4 w-4" />
            Santé Comptable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between mb-2">
            <span className={cn("text-5xl font-black font-display", scoreColor)}>
              {healthScore}%
            </span>
            <span className="text-sm text-muted-foreground mb-1 font-medium">{documentsCount} / {totalTransactions} docs</span>
          </div>
          <Progress value={healthScore} className={cn("h-3 mb-3", progressColor)} />
          <p className="text-sm font-medium text-foreground/80">{message}</p>
        </CardContent>
      </Card>

      {/* Widget 2: Badges & Trophées */}
      <Card className="glass-panel border-none premium-shadow bg-gradient-to-br from-indigo-500/10 to-purple-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Vos Trophées
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 items-center">
          <div className={cn("flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all", isPerfect ? "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400 shadow-lg shadow-amber-500/20 scale-110" : "bg-muted/50 border-muted text-muted-foreground grayscale opacity-50")}>
             <Medal className="h-8 w-8 mb-1" />
             <span className="text-xs font-bold text-center leading-tight">Zéro<br/>Défaut</span>
          </div>
          <div className="flex-1">
             <p className="text-sm font-medium">
               {isPerfect ? "Bravo ! Vous avez débloqué le badge du mois." : "Complétez tous vos justificatifs pour débloquer le badge Zéro Défaut."}
             </p>
          </div>
        </CardContent>
      </Card>

      {/* Widget 3: Impact Expert */}
      <Card className="glass-panel border-none premium-shadow bg-gradient-to-br from-emerald-500/10 to-teal-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Temps gagné
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
               <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">-{anomaliesCount * 5}m</span>
            </div>
            <div>
              <p className="text-sm font-medium">Temps de relance évité à votre cabinet ce mois-ci grâce à votre rigueur.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
