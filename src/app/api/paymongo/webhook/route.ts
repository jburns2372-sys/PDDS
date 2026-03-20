import { NextResponse } from "next/server";
import crypto from "crypto";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Initialize Firebase Admin securely
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}
const db = getFirestore();

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("paymongo-signature");
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

    if (!signatureHeader || !webhookSecret) {
      console.error("❌ Webhook Unauthorized: Missing Header or Secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. ROBUST SIGNATURE VERIFICATION
    // Parsing by searching for keys rather than fixed array indexes
    const sigParts = signatureHeader.split(",");
    const timestamp = sigParts.find(p => p.startsWith("t="))?.split("=")[1];
    const testSignature = sigParts.find(p => p.startsWith("te="))?.split("=")[1];
    const liveSignature = sigParts.find(p => p.startsWith("li="))?.split("=")[1];
    
    // Use test signature if present, otherwise use live
    const signature = testSignature || liveSignature;

    if (!timestamp || !signature) {
      return NextResponse.json({ error: "Invalid Signature Format" }, { status: 400 });
    }

    const payloadString = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payloadString)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("⚠️ Webhook Signature Mismatch!");
      return NextResponse.json({ error: "Signature Mismatch" }, { status: 401 });
    }

    // 2. PROCESS SUCCESSFUL PAYMENT
    const event = JSON.parse(rawBody);
    
    if (event.data.attributes.type === "checkout_session.payment.paid") {
      const session = event.data.attributes.data;
      const attributes = session.attributes;
      
      // We use the metadata or reference_number to identify our Patriot
      const userId = attributes.metadata?.userId || attributes.reference_number;
      const paymentType = attributes.metadata?.paymentType;

      if (userId) {
        const userRef = db.collection("users").doc(userId);

        // --- COMMAND ACTION: ACTIVATE MEMBER ---
        await userRef.update({
          membershipStatus: "Active",
          lastDuesPaid: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });

        // --- COMMAND ACTION: LOG TO DONATIONS LEDGER ---
        await db.collection("donations").add({
          uid: userId,
          fullName: attributes.billing?.name || "Anonymous Patriot",
          amount: attributes.amount / 100, // Convert centavos to PHP
          status: "Successful",
          type: paymentType === "MEMBERSHIP_DUES" ? "Annual Dues" : "Contribution",
          paymentMethod: attributes.payment_method_used || "unknown",
          timestamp: FieldValue.serverTimestamp()
        });

        // --- COMMAND ACTION: UPDATE ACTIVITY FEED ---
        await db.collection("activity_logs").add({
          adminId: "SYSTEM_PAYMONGO",
          adminName: "PayMongo Bridge",
          action: "DUES_PAID",
          targetUserId: userId,
          targetUserName: attributes.billing?.name || "Member",
          timestamp: FieldValue.serverTimestamp(),
          details: `Patriot settled ${attributes.amount / 100} PHP via PayMongo.`
        });

        console.log(`✅ SUCCESS: Patriot ${userId} is now ACTIVE.`);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error("🚨 Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}