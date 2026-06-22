import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';

// Initialize Stripe (we fall back to a dummy key if not set, for local dev/builds)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2025-02-24.acacia', // Utiliser la dernière version recommandée par Stripe
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientId, priceId, successUrl, cancelUrl } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID requis' }, { status: 400 });
    }

    // Default to a 49€/month plan if no priceId provided (for V1 simplicity)
    const activePriceId = priceId || process.env.STRIPE_PRICE_ID_DEFAULT || 'price_dummy';

    // 1. Fetch Client from Firebase
    const admin = getFirebaseAdminApp();
    const db = admin.firestore();
    const clientRef = db.collection('clients').doc(clientId);
    const clientDoc = await clientRef.get();

    if (!clientDoc.exists) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
    }

    const clientData = clientDoc.data();
    let stripeCustomerId = clientData?.stripeCustomerId;

    // 2. Create Stripe Customer if not exists
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: clientData?.email,
        name: clientData?.name,
        metadata: {
          clientId: clientId,
        },
      });
      stripeCustomerId = customer.id;

      // Save to Firebase
      await clientRef.update({ stripeCustomerId });
    }

    // 3. Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [
        {
          price: activePriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
      metadata: {
        clientId: clientId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
