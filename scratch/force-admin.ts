import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Manual env loading for scratch script
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};

let currentKey = '';
let currentValue = '';
let inQuotes = false;

envContent.split('\n').forEach(line => {
    if (!inQuotes) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            currentKey = key.trim();
            const val = valueParts.join('=').trim();
            if (val.startsWith('"') && !val.endsWith('"')) {
                inQuotes = true;
                currentValue = val.substring(1) + '\n';
            } else {
                env[currentKey] = val.replace(/^"(.*)"$/, '$1');
            }
        }
    } else {
        if (line.includes('"')) {
            inQuotes = false;
            currentValue += line.substring(0, line.indexOf('"'));
            env[currentKey] = currentValue;
        } else {
            currentValue += line + '\n';
        }
    }
});

Object.assign(process.env, env);

// Initialisation
if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID || 'ccs-compta',
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            })
        });
    } else {
        admin.initializeApp({
            projectId: 'ccs-compta'
        });
    }
}

const db = admin.firestore();

async function promoteToAdmin(email: string) {
    console.log(`Promotion de ${email}...`);
    try {
        const user = await admin.auth().getUserByEmail(email);
        const uid = user.uid;

        // 1. Set Custom Claims
        await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
        console.log(`✅ Custom Claims définis pour ${uid}`);

        // 2. Update Firestore
        await db.collection('clients').doc(uid).set({
            role: 'admin',
            email: email,
            status: 'active',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`✅ Document Firestore mis à jour`);

        console.log("C'est terminé. L'utilisateur doit se reconnecter pour voir les changements.");
    } catch (error) {
        console.error("❌ Erreur:", error);
    }
}

promoteToAdmin('app.ccs94@gmail.com');
