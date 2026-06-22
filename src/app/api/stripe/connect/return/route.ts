import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { admin, db } from '@/lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2026-05-27.dahlia' as any,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cabinetId = searchParams.get('cabinetId');
  const accountId = searchParams.get('accountId');

  if (!cabinetId || !accountId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?error=invalid_return`);
  }

  try {
    // Check account status in Stripe
    const account = await stripe.accounts.retrieve(accountId);
    
    const isReady = account.details_submitted && account.charges_enabled;

    // db is already imported
    
    await db.collection('cabinets').doc(cabinetId).update({
        stripeConnectStatus: isReady ? 'active' : 'restricted'
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?connect_success=${isReady ? 'true' : 'partial'}`);
  } catch (error) {
    console.error('Stripe Connect Return Error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?error=verification_failed`);
  }
}
