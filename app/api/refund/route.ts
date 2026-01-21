import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
    try {
        const { paymentIntentId } = await req.json();

        if (!paymentIntentId) {
            return NextResponse.json({ error: "Payment Intent ID is required" }, { status: 400 });
        }

        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
        });

        return NextResponse.json({ success: true, refundId: refund.id });
    } catch (error) {
        console.error("Refund Error:", error);
        return NextResponse.json(
            { error: "Refund Error", details: error instanceof Error ? error.message : "Unknown" },
            { status: 500 }
        );
    }
}
