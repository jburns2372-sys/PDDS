import { NextResponse } from "next/server";
import crypto from "crypto";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin for background activation
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

/**
 * @fileOverview PayMongo Webhook Handler.
 * Security: Verifies the paymongo-signature before processing account activation.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("paymongo-signature");
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

    if (!signatureHeader || !webhookSecret) {
      console.error("Webhook verification failed: Missing signature or secret.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Verify PayMongo Signature
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
      return NextResponse.json({ error: "Signature Mismatch" }, { status: 401 });
    }

    // 2. Process Successful Payment
    const event = JSON.parse(rawBody);
    if (event.data.attributes.type === "checkout_session.payment.paid") {
      
      const sessionData = event.data.attributes.data.attributes;
      const userId = sessionData.reference_number;
      
      if (userId) {
        console.log(`[PAYMENT VERIFIED] Activating Patriot UID: ${userId}`);
        
        const userRef = db.collection("users").doc(userId);
        
        // Activate the member in the National Registry
        await userRef.update({
          membershipStatus: "Active",
          lastDuesPaymentDate: new Date(),
          updatedAt: new Date()
        });

        // Optional: Log to a master collections ledger
        await db.collection("donations").add({
          uid: userId,
          amount: sessionData.amount / 100,
          status: "Successful",
          type: "Membership Dues",
          paymentMethod: sessionData.source?.type || "unknown",
          timestamp: new Date()
        });

        console.log(`[REGISTRY SUCCESS] UID ${userId} is now ACTIVE.`);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
