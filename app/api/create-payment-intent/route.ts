import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
    try {
        const { amount, workshopTitle } = await req.json();

        if (!amount) {
            return NextResponse.json({ error: "Amount is required" }, { status: 400 });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to paise/cents (Stripe currency is smallest unit)
            currency: "lkr", // Assuming Sri Lankan Rupee since user used LKR symbol earlier
            description: `Workshop: ${workshopTitle}`,
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error("Internal Error:", error);
        return NextResponse.json(
            { error: "Internal Error", details: error instanceof Error ? error.message : "Unknown" },
            { status: 500 }
        );
    }
}
