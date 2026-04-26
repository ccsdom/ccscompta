import { db } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";

export class EmailService {
    private static collectionName = "mail";

    /**
     * Sends an invitation email to a cabinet admin.
     */
    public static async sendCabinetInvitation(cabinet: { name: string, email: string, id: string }) {
        const loginUrl = `${window.location.origin}/login?cabinetId=${cabinet.id}`;
        
        const html = `
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #0c0c0c; color: #ffffff; padding: 40px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #6366f1; font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: -1px; font-style: italic;">CCS COMPTA <span style="color: #ffffff;">SAAS</span></h1>
                </div>
                
                <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 20px; color: #6366f1;">BIENVENUE, ${cabinet.name.toUpperCase()}</h2>
                
                <p style="font-size: 14px; line-height: 1.6; color: rgba(255, 255, 255, 0.7); margin-bottom: 25px;">
                    Votre infrastructure de gestion comptable IA est prête. Vous pouvez désormais accéder à votre espace partenaire et commencer à gérer vos clients.
                </p>
                
                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 12px; margin-bottom: 30px;">
                    <p style="margin: 0; font-size: 12px; font-weight: 700; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Vos Identifiants</p>
                    <p style="margin: 0; font-size: 14px; font-weight: 600;">E-mail : <span style="color: #6366f1;">${cabinet.email}</span></p>
                    <p style="margin: 0; font-size: 12px; opacity: 0.5; margin-top: 5px;">Utilisez cet email pour configurer votre mot de passe lors de la première connexion.</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="${loginUrl}" style="display: inline-block; background-color: #6366f1; color: #ffffff; padding: 16px 32px; border-radius: 10px; text-decoration: none; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Activer mon Espace</a>
                </div>
                
                <hr style="margin: 40px 0; border: 0; border-top: 1px solid rgba(255, 255, 255, 0.05);" />
                
                <p style="font-size: 10px; text-align: center; color: rgba(255, 255, 255, 0.3); line-height: 1.5;">
                    Ce message a été généré automatiquement par le Mission Control de CCS Compta.<br/>
                    Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
                </p>
            </div>
        `;

        return addDoc(collection(db, this.collectionName), {
            to: cabinet.email,
            message: {
                subject: `🚀 [Accès SaaS] Bienvenue sur votre plateforme ${cabinet.name}`,
                html: html,
            },
            metadata: {
                cabinetId: cabinet.id,
                type: 'invitation'
            },
            createdAt: new Date().toISOString()
        });
    }
}
