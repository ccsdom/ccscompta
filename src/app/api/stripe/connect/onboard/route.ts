import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cabinetId } = body;

    if (!cabinetId) {
      return NextResponse.json({ error: 'Cabinet ID requis' }, { status: 400 });
    }

    const admin = getFirebaseAdminApp();
    const db = admin.firestore();
    const cabinetRef = db.collection('cabinets').doc(cabinetId);
    const cabinetDoc = await cabinetRef.get();

    if (!cabinetDoc.exists) {
      return NextResponse.json({ error: 'Cabinet introuvable' }, { status: 404 });
    }

    const cabinetData = cabinetDoc.data();
    let accountId = cabinetData?.stripeConnectAccountId;

    // 1. Create a Connected Account if one doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'standard', // 'standard' est le plus souple pour les experts-comptables
        country: 'FR',
        email: cabinetData?.email,
        business_profile: {
          name: cabinetData?.name,
        },
      });
      accountId = account.id;

      await cabinetRef.update({ 
        stripeConnectAccountId: accountId,
        stripeConnectStatus: 'pending'
      });
    }

    // 2. Create an Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/onboard?cabinetId=${cabinetId}`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/return?cabinetId=${cabinetId}&accountId=${accountId}`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Stripe Connect Onboard Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Support GET for refresh_url
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const cabinetId = searchParams.get('cabinetId');

    if (!cabinetId) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?error=missing_cabinet`);
    }

    try {
        const admin = getFirebaseAdminApp();
        const db = admin.firestore();
        const cabinetDoc = await db.collection('cabinets').doc(cabinetId).get();
        const accountId = cabinetDoc.data()?.stripeConnectAccountId;

        if (!accountId) throw new Error("No account ID");

        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/onboard?cabinetId=${cabinetId}`,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/return?cabinetId=${cabinetId}&accountId=${accountId}`,
            type: 'account_onboarding',
        });

        return NextResponse.redirect(accountLink.url);
    } catch (e) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?error=refresh_failed`);
    }
}
