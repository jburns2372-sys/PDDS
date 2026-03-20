import { NextResponse } from "next/server";

/**
 * @fileOverview PayMongo Checkout Session Node.
 * Converts amount to centavos and enriches metadata for automated activation.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, userId, userName, description, paymentType, success_url, cancel_url } = body;

    if (!amount || !userId) {
      return NextResponse.json({ error: "Missing identity tags" }, { status: 400 });
    }

    // PayMongo standard: PHP to centavos
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
            line_items: [
              {
                currency: 'PHP',
                amount: amountInCentavos,
                name: 'PDDS PatriotLink Contribution',
                quantity: 1,
                description: description || 'Contribution to the Movement'
              }
            ],
            payment_method_types: ['gcash', 'paymaya', 'qrph'],
            metadata: {
              userId: userId,
              userName: userName,
              paymentType: paymentType || "VOLUNTARY_DONATION"
            },
            description: description || 'National Command Registry Settlement',
            success_url: success_url || `${process.env.NEXT_PUBLIC_APP_URL}/patriot-pondo/success`,
            cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/patriot-pondo`
          }
        }
      })
    };

    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', options);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.errors?.[0]?.detail || "API Failure" }, { status: response.status });
    }

    return NextResponse.json({ checkoutUrl: data.data.attributes.checkout_url });

  } catch (error) {
    return NextResponse.json({ error: "Internal Protocol Error" }, { status: 500 });
  }
}
