import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { planType, guildId } = await req.json();

        // 🌸 Price IDs Mapping (Live Prices)
        const prices = {
            pro: "price_1SsBpIFfpRfjpLqwzoo9jcgK", // 199 THB Plan 💎
            premium: "price_1SsCWPFfpRfjpLqwuMQOs8wN" // 599 THB Plan (New ID from Papa) 👑
        };

        const priceId = prices[planType];
        if (!priceId) {
            return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
        }

        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ["card"], // 💳 PromptPay doesn't support automatic recurring subscriptions
            line_items: [
                {
                    price: priceId,
                    quantity: 1, // 🌸 Fixed: Always 1 unit (Price ID determines the cost)
                },
            ],
            mode: "subscription",
            success_url: `${process.env.NEXTAUTH_URL}/servers/${guildId}/premium?success=true`,
            cancel_url: `${process.env.NEXTAUTH_URL}/servers/${guildId}/premium?canceled=true`,
            metadata: {
                userId: session.user.id || session.user.uid,
                guildId: guildId,
                planType: planType
            },
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (err) {
        console.error("Stripe Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
