import { db } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { SystemAuditLog } from "@/lib/types";

export class AuditService {
    private static instance: AuditService;
    private collectionName = "audit";

    private constructor() {}

    public static getInstance(): AuditService {
        if (!AuditService.instance) {
            AuditService.instance = new AuditService();
        }
        return AuditService.instance;
    }

    /**
     * Logs a system action to Firestore.
     */
    public async logAction(event: Omit<SystemAuditLog, 'id' | 'date'>) {
        try {
            const auditRef = collection(db, this.collectionName);
            
            // Filter out undefined values (Firestore doesn't support them)
            const cleanEvent = Object.fromEntries(
                Object.entries(event).filter(([_, v]) => v !== undefined)
            );

            await addDoc(auditRef, {
                ...cleanEvent,
                date: new Date().toISOString(),
                createdAt: serverTimestamp() // For reliable ordering
            });
        } catch (error) {
            console.error("Failed to log audit event:", error);
            // Non-blocking: we don't throw here to avoid breaking the main flow
        }
    }

    /**
     * Helper for quick system-level logs
     */
    public async logSystem(action: string, type: SystemAuditLog['type'] = 'info', metadata?: any) {
        const userName = localStorage.getItem('userName') || 'System';
        const userEmail = localStorage.getItem('userEmail') || 'system@ccscompta.ai';

        return this.logAction({
            action,
            type,
            category: 'system',
            userName,
            userEmail,
            metadata
        });
    }

    /**
     * Helper for auth-level logs
     */
    public async logAuth(action: string, type: SystemAuditLog['type'] = 'info', metadata?: any) {
        const userName = localStorage.getItem('userName') || 'Unknown';
        const userEmail = localStorage.getItem('userEmail') || 'unknown@auth.ai';

        return this.logAction({
            action,
            type,
            category: 'auth',
            userName,
            userEmail,
            metadata
        });
    }
}

export const auditService = AuditService.getInstance();
