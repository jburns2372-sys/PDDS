import { NextResponse } from "next/server";
import crypto from "crypto";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// --- 🛡️ LAZY INITIALIZATION HELPER ---
const getDb = () => {
  // Check if we already initialized
  if (getApps().length > 0) return getFirestore();

  // Extract Credentials
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // BUILD-TIME SAFETY: 
  // If variables are missing (like during 'next build'), 
  // we skip initialization so the build doesn't crash.
  if (!projectId || !clientEmail || !privateKey) {
    console.warn("⚠️ Firebase Admin credentials missing. Skipping init (Build Phase).");
    return null; 
  }

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  
  return getFirestore();
};

export async function POST(request: Request) {
  try {
    const db = getDb();
    
    // If we're in a state where DB couldn't init, return error
    if (!db) {
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    const rawBody = await request.text();
    const signatureHeader = request.headers.get("paymongo-signature");
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

    if (!signatureHeader || !webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. SIGNATURE VERIFICATION
    const sigParts = signatureHeader.split(",");
    const timestamp = sigParts.find(p => p.startsWith("t="))?.split("=")[1];
    const signature = sigParts.find(p => p.startsWith("te="))?.split("=")[1] || 
                      sigParts.find(p => p.startsWith("li="))?.split("=")[1];

    const payloadString = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(payloadString).digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Signature Mismatch" }, { status: 401 });
    }

    // 2. DATA PROCESSING
    const event = JSON.parse(rawBody);
    
    if (event.data.attributes.type === "checkout_session.payment.paid") {
      const session = event.data.attributes.data;
      const { userId, paymentType } = session.attributes.metadata;
      const amount = session.attributes.amount / 100;

      if (paymentType === "MEMBERSHIP_DUES") {
        await db.collection("users").doc(userId).update({
          membershipStatus: "Active",
          lastDuesPaymentDate: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
      }

      await db.collection("donations").add({
        uid: userId,
        fullName: session.attributes.billing?.name || "Verified Patriot",
        amount: amount,
        type: paymentType === "MEMBERSHIP_DUES" ? "Membership Dues" : "Voluntary Contribution",
        status: "Successful",
        timestamp: FieldValue.serverTimestamp()
      });

      await db.collection("activity_logs").add({
        action: paymentType === "MEMBERSHIP_DUES" ? "DUES_PAID" : "DONATION_RECEIVED",
        targetUserId: userId,
        targetUserName: session.attributes.billing?.name || "Member",
        timestamp: FieldValue.serverTimestamp(),
        details: `${paymentType === "MEMBERSHIP_DUES" ? "Annual Dues" : "Contribution"} of ₱${amount} processed via PayMongo.`
      });
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("🚨 Webhook Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
