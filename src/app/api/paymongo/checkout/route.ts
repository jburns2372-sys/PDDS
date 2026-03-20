import { NextResponse } from "next/server";

/**
 * @fileOverview PayMongo Checkout Session Creator.
 * Generates secure payment links for Annual Dues.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, userId, userName } = body;

    if (!amount || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // PayMongo requires the amount in centavos (e.g., 500 PHP = 50000)
    const amountInCentavos = Math.round(amount * 100);

    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY!).toString('base64')}`
      },
      body: JSON.stringify({
        data: {
          attributes: {
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            line_items: [
              {
                currency: 'PHP',
                amount: amountInCentavos,
                name: 'PDDS Annual Membership Dues',
                quantity: 1,
                description: `Official registration dues for ${userName} (UID: ${userId})`
              }
            ],
            payment_method_types: ['gcash', 'paymaya', 'qrph'],
            reference_number: userId, // CRITICAL: Used by the webhook to activate the user
            description: 'PDDS PatriotLink Registry Dues',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/home?payment=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/patriot-pondo?payment=canceled`
          }
        }
      })
    };

    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', options);
    const data = await response.json();

    if (!response.ok) {
      console.error("PayMongo API Error:", data);
      return NextResponse.json({ error: data.errors?.[0]?.detail || "Failed to create checkout session" }, { status: response.status });
    }

    return NextResponse.json({ checkoutUrl: data.data.attributes.checkout_url });

  } catch (error) {
    console.error("Internal API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
