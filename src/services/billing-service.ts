import { db } from "@/firebase";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

export interface CabinetQuotas {
    maxClients: number;
    maxDocumentsPerMonth: number;
    usedDocumentsMonth: number;
    usedClients: number;
    storageLimitGb: number;
    plan: string;
}

export class BillingService {
    /**
     * Checks if the cabinet has exceeded its document quota.
     * Implements "Soft Lock": returns false but triggers a warning toast.
     */
    public static async checkDocumentQuota(cabinetId: string): Promise<{ isExceeded: boolean, usage: number, limit: number }> {
        try {
            const cabinetRef = doc(db, 'cabinets', cabinetId);
            const cabinetSnap = await getDoc(cabinetRef);
            
            if (!cabinetSnap.exists()) return { isExceeded: false, usage: 0, limit: 0 };
            
            const data = cabinetSnap.data();
            const quotas = data.quotas as CabinetQuotas;
            
            const isExceeded = quotas.usedDocumentsMonth >= quotas.maxDocumentsPerMonth;
            
            if (isExceeded) {
                toast({
                    title: "🚀 Limite de quota atteinte",
                    description: "Vous avez dépassé votre limite mensuelle. Des frais supplémentaires s'appliqueront via Stripe.",
                    variant: "default", // Soft lock: just info/warning
                });
            }
            
            return {
                isExceeded,
                usage: quotas.usedDocumentsMonth,
                limit: quotas.maxDocumentsPerMonth
            };
        } catch (error) {
            console.error("Error checking quota:", error);
            return { isExceeded: false, usage: 0, limit: 0 };
        }
    }

    /**
     * Manually increments document usage (usually handled by backend, but useful for frontend optimistic updates)
     */
    public static async incrementDocUsage(cabinetId: string, count: number = 1) {
        const cabinetRef = doc(db, 'cabinets', cabinetId);
        await updateDoc(cabinetRef, {
            'quotas.usedDocumentsMonth': increment(count)
        });
    }

    /**
     * Checks if a new client can be added.
     */
    public static async canAddClient(cabinetId: string): Promise<boolean> {
        const cabinetRef = doc(db, 'cabinets', cabinetId);
        const cabinetSnap = await getDoc(cabinetRef);
        
        if (!cabinetSnap.exists()) return false;
        
        const quotas = cabinetSnap.data().quotas;
        if (quotas.usedClients >= quotas.maxClients) {
            toast({
                title: "Limite de clients atteinte",
                description: "Veuillez mettre à jour votre abonnement pour ajouter plus de clients.",
                variant: "destructive"
            });
            return false;
        }
        return true;
    }
}
