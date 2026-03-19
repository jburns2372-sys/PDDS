import { NextResponse } from "next/server";
import crypto from "crypto";
import { initializeApp, getApps } from "firebase-admin/app"; // Removed 'cert'
import { getFirestore } from "firebase-admin/firestore";

// The "Zero-Key Bypass"
// In production, Firebase App Hosting automatically injects its own secure credentials here.
if (!getApps().length) {
  initializeApp(); // No manual JSON key needed!
}
const db = getFirestore();

export async function POST(request: Request) {
  try {
    // 1. Get the raw body and signature header for security verification
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("paymongo-signature");
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

    if (!signatureHeader || !webhookSecret) {
      return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
    }

    // 2. Security Check: Verify the signature (Prevents fake payments)
    const elements = signatureHeader.split(",");
    const timestampMap = elements[0].split("=");
    const testModeMap = elements[1].split("=");
    const signatureMap = elements[2].split("=");
    
    const timestamp = timestampMap[1];
    const signature = testModeMap[0] === "te" ? testModeMap[1] : signatureMap[1];
    
    const payloadString = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payloadString)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Webhook signature mismatch!");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Process the Data
    const event = JSON.parse(rawBody);

    // We only care if the payment was actually successful
    if (event.data.attributes.type === "checkout_session.payment.paid") {
      
      // Extract the Firebase UID we passed earlier as the reference_number
      const userId = event.data.attributes.data.attributes.reference_number;
      
      if (userId) {
        // 4. Update Firestore directly as the Admin
        const userRef = db.collection("users").doc(userId);
        
        await userRef.update({
          lastDuesPaymentDate: new Date(), // Sets payment to current date/time
          membershipStatus: "Active"       // Automatically clears their standing
        });

        console.log(`Successfully updated Dues for Patriot: ${userId}`);
      }
    }

    // Always return a 200 OK so PayMongo knows you received the message
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}