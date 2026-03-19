import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, userId, userName } = body;

    // PayMongo requires the amount in centavos (e.g., 500 PHP = 50000)
    const amountInCentavos = amount * 100;

    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        // We use Buffer to safely encode your secret key for Basic Auth
        authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY!).toString('base64')}`
      },
      body: JSON.stringify({
        data: {
          attributes: {
            send_email_receipt: false,
            show_description: true,
            show_line_items: true,
            line_items: [
              {
                currency: 'PHP',
                amount: amountInCentavos,
                name: 'PDDS Annual Dues',
                quantity: 1,
                description: `Membership dues for ${userName}`
              }
            ],
            payment_method_types: ['gcash', 'paymaya', 'qrph'],
            reference_number: userId, // We pass the Firebase UID here to track who paid
            description: 'PDDS Official Roster Dues',
            // Where to send the user after they pay or cancel
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/bantay-bayan?payment=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/bantay-bayan?payment=canceled`
          }
        }
      })
    };

    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', options);
    const data = await response.json();

    if (!response.ok) {
      console.error("PayMongo Error:", data);
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: response.status });
    }

    // Return the secure checkout URL to the frontend
    return NextResponse.json({ checkoutUrl: data.data.attributes.checkout_url });

  } catch (error) {
    console.error("Internal API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}