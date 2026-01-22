import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
// Assuming you have a way to update Supabase from Next.js
// If not, we might need a dedicated internal API or direct SDK usage

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
    const body = await req.text();
    const sig = headers().get("stripe-signature");

    let event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
        console.error("Webhook Signature Verification Failed:", err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const { userId, guildId, planType } = session.metadata;

        console.log(`🌸 Payment Success: User ${userId} purchased ${planType} for guild ${guildId}`);

        // Call Bot API to update Supabase and Sync Roles
        try {
            const botApiUrl = process.env.NEXT_PUBLIC_BOT_API_URL || "http://127.0.0.1:5000";
            await fetch(`${botApiUrl}/api/action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "update_premium_status",
                    user_id: userId,
                    plan_type: planType
                })
            });
            console.log(`✅ Bot notified for user ${userId}`);
        } catch (botErr) {
            console.error("❌ Failed to notify Bot API:", botErr.message);
        }
    }

    return NextResponse.json({ received: true });
}
