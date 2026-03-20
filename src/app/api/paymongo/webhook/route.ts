import { NextResponse } from "next/server";
import crypto from "crypto";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// --- 🛡️ INITIALIZE SECURE COMMAND BRIDGE ---
// This allows the server to update Firestore without needing a logged-in user
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
      console.error("❌ Webhook Unauthorized: Missing Credentials");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. VERIFY SIGNATURE (Ensures the request actually came from PayMongo)
    const sigParts = signatureHeader.split(",");
    const timestamp = sigParts.find(p => p.startsWith("t="))?.split("=")[1];
    const signature = sigParts.find(p => p.startsWith("te="))?.split("=")[1] || 
                      sigParts.find(p => p.startsWith("li="))?.split("=")[1];

    const payloadString = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payloadString)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("⚠️ SECURITY ALERT: Webhook Signature Mismatch!");
      return NextResponse.json({ error: "Signature Mismatch" }, { status: 401 });
    }

    // 2. EXTRACT TRANSACTION INTEL
    const event = JSON.parse(rawBody);
    
    if (event.data.attributes.type === "checkout_session.payment.paid") {
      const session = event.data.attributes.data;
      const attributes = session.attributes;
      
      // Pulling the metadata we tagged in your PatriotPondo page
      const { userId, paymentType } = attributes.metadata;
      const amount = attributes.amount / 100; // Convert centavos to PHP

      if (!userId) {
        console.error("❌ Error: Payment received but no userId found in metadata.");
        return NextResponse.json({ error: "Missing Metadata" }, { status: 400 });
      }

      // --- 3. THE "VAULT SWITCH" LOGIC ---
      
      if (paymentType === "MEMBERSHIP_DUES") {
        // ACTION A: ACTIVATE MEMBER IN REGISTRY
        await db.collection("users").doc(userId).update({
          membershipStatus: "Active",
          lastDuesPaid: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
        
        // ACTION B: LOG TO TREASURY VAULT (DUES LEDGER)
        await db.collection("donations").add({
          uid: userId,
          fullName: attributes.billing?.name || "Verified Patriot",
          amount: amount,
          type: "Membership Dues",
          status: "Successful",
          timestamp: FieldValue.serverTimestamp()
        });

        console.log(`✅ VAULT UPDATED: Patriot ${userId} is now ACTIVE.`);
      } 
      else {
        // ACTION C: LOG TO VOLUNTARY PONDO LEDGER
        await db.collection("donations").add({
          uid: userId,
          fullName: attributes.billing?.name || "Anonymous Patriot",
          amount: amount,
          type: "Voluntary Contribution",
          status: "Successful",
          timestamp: FieldValue.serverTimestamp()
        });

        console.log(`✅ PONDO UPDATED: Donation recorded for ${userId}.`);
      }

      // ACTION D: NOTIFY ADMIN DASHBOARD (Recent Pulses)
      await db.collection("activity_logs").add({
        action: paymentType === "MEMBERSHIP_DUES" ? "DUES_PAID" : "DONATION_RECEIVED",
        targetUserId: userId,
        targetUserName: attributes.billing?.name || "Member",
        timestamp: FieldValue.serverTimestamp(),
        details: `${paymentType === "MEMBERSHIP_DUES" ? "Annual Dues" : "Donation"} of ₱${amount} processed via PayMongo.`
      });
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error("🚨 Webhook Critical Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}