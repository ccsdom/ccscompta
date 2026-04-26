
import * as admin from 'firebase-admin';

// Configuration (Assume service account or local emulator)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'ccs-compta'
  });
}

const db = admin.firestore();

async function seedCabinets() {
  const cabinets = [
    {
      id: 'cabinet-elite-paris',
      name: 'Alliance Expertise Paris',
      email: 'contact.ccs94@gmail.com',
      plan: 'SaaS Élite',
      clientsCount: 42,
      status: 'active',
      createdAt: new Date().toISOString(),
      logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=AEP',
      slogan: 'L\'excellence au service de vos chiffres'
    },
    {
      id: 'cabinet-lyon-compta',
      name: 'Rhône Gestion & Conseil',
      email: 'contact@rhone-gestion.fr',
      plan: 'Professionnel',
      clientsCount: 156,
      status: 'active',
      createdAt: new Date().toISOString(),
      logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=RGC',
      slogan: 'L\'expertise lyonnaise de proximité'
    },
    {
        id: 'cabinet-marseille-sud',
        name: 'Sud Compta Stratégie',
        email: 'admin@sud-compta.com',
        plan: 'Starter',
        clientsCount: 12,
        status: 'active',
        createdAt: new Date().toISOString(),
        logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=SCS'
      }
  ];

  console.log('🚀 Démarrage du seeding des cabinets...');

  for (const cabinet of cabinets) {
    await db.collection('cabinets').doc(cabinet.id).set(cabinet, { merge: true });
    console.log(`✅ Cabinet ajouté : ${cabinet.name}`);
  }

  console.log('✨ Seeding terminé avec succès !');
}

seedCabinets().catch(console.error);
