import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { admin, db } from '@/lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2025-02-24.acacia',
});

// We need to parse raw body for Stripe webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      // For local testing without a webhook secret, we skip signature verification
      if (process.env.STRIPE_WEBHOOK_SECRET) {
        event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
      } else {
        event = JSON.parse(rawBody) as Stripe.Event;
      }
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // db is already imported

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const clientId = session.metadata?.clientId;
        const subscriptionId = session.subscription as string;
        
        if (clientId && subscriptionId) {
          // Retrieve the subscription to get its status
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const itemId = subscription.items.data[0]?.id;

          await db.collection('clients').doc(clientId).update({
            stripeSubscriptionId: subscriptionId,
            stripeSubscriptionItemId: itemId,
            pricingPlan: 'pro', // we assume 'pro' is the paid plan
            status: 'active',
          });
          console.log(`Updated client ${clientId} with subscription ${subscriptionId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        // Here we could handle recurring payments, reset quotas, etc.
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Invoice ${invoice.id} paid for customer ${invoice.customer}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        // Find client by stripeCustomerId
        const clientsRef = db.collection('clients');
        const snapshot = await clientsRef.where('stripeCustomerId', '==', subscription.customer).get();
        
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          await doc.ref.update({
            pricingPlan: 'basic',
            stripeSubscriptionId: null,
            stripeSubscriptionItemId: null,
          });
          console.log(`Canceled subscription for client ${doc.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Stripe Webhook Handler Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
