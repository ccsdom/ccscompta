
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'ccs-compta'
    });
}

async function checkUser(uid: string) {
    try {
        const user = await admin.auth().getUser(uid);
        console.log('User found:', user.email);
        console.log('Custom claims:', user.customClaims);
        
        const clientDoc = await admin.firestore().collection('clients').doc(uid).get();
        console.log('Client doc exists:', clientDoc.exists);
        if (clientDoc.exists) {
            console.log('Client doc data:', clientDoc.data());
        }
    } catch (error) {
        console.error('Error checking user:', error);
    }
}

checkUser('3xFUMs6FDVQEO1O6hmEE2NDeGd03');
