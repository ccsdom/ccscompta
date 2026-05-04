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
    public async logSystem(action: string, type: SystemAuditLog['type'] = 'info', actor?: { name: string, email: string }, metadata?: any) {
        const userName = actor?.name || localStorage.getItem('userName') || 'System';
        const userEmail = actor?.email || localStorage.getItem('userEmail') || 'system@ccscompta.ai';

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
    public async logAuth(action: string, type: SystemAuditLog['type'] = 'info', actor?: { name: string, email: string }, metadata?: any) {
        const userName = actor?.name || localStorage.getItem('userName') || 'Unknown';
        const userEmail = actor?.email || localStorage.getItem('userEmail') || 'unknown@auth.ai';

        return this.logAction({
            action,
            type,
            category: 'auth',
            userName,
            userEmail,
            metadata
        });
    }

    /**
     * Logs impersonation events
     */
    public async logImpersonation(action: 'start' | 'stop', actor: { name: string, email: string, role: string }, target: { name: string, id: string, type: 'cabinet' | 'client' }) {
        return this.logAction({
            action: `Impersonation ${action}: ${actor.name} as ${target.name}`,
            type: action === 'start' ? 'warning' : 'info',
            category: 'impersonation',
            userName: actor.name,
            userEmail: actor.email,
            metadata: {
                actorRole: actor.role,
                targetId: target.id,
                targetName: target.name,
                targetType: target.type,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Logs actions on documents
     */
    public async logDocumentAction(action: string, actor: { name: string, email: string }, documentId: string, documentName: string, metadata?: any) {
        return this.logAction({
            action: `${action}: ${documentName}`,
            type: 'info',
            category: 'document',
            userName: actor.name,
            userEmail: actor.email,
            metadata: {
                ...metadata,
                documentId,
                documentName
            }
        });
    }
}

export const auditService = AuditService.getInstance();
