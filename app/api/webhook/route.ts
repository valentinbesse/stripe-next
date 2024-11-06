import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe';
import { supabaseAdmin } from '@/utils/supabaseServer';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get('stripe-signature')!;

        let event;

        try {
            event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
        } catch (error: any) {
            console.error(`Webhook signature verification failed: ${error.message}`);
            return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
        }

        // Handle the checkout.session.completed event

        console.log(`Received event: ${event.type}`);

        if (event.type === 'checkout.session.completed') {
            const session: Stripe.Checkout.Session = event.data.object;
            console.log(session);
            const userId = session.metadata?.user_id;

            console.log(`User ID: ${userId}`);

            // Create or update the stripe_customer_id in the stripe_customers table

            const { error } = await supabaseAdmin
                .from('stripe_customers')
                .upsert({
                    user_id: userId,
                    stripe_customer_id: session.customer,
                    subscription_id: session.subscription,
                    plan_active: true,
                    plan_expires: null,
                })

            }

            if ( event.type === 'customer.subscription.updated') {
                const subscription: Stripe.Subscription = event.data.object;
                console.log(subscription);

                const { error } = await supabaseAdmin
                    .from('stripe_customers')
                    .update({
                        plan_expires: subscription.cancel_at,
                    })
                    .eq('subscription_id', subscription.id);
            }

            if ( event.type === 'customer.subscription.deleted') {
                const subscription: Stripe.Subscription = event.data.object;
                console.log(subscription);

                const { error } = await supabaseAdmin
                    .from('stripe_customers')
                    .update({
                        plan_active: false,
                        subscription_id: null,
                    })
                    .eq('subscription_id', subscription.id);
            }

            return NextResponse.json({ message: 'success' });
        } catch (error: any) {
            console.error(error);
            return NextResponse.json({ error: error.message }, { status: 500 });

        }
    }