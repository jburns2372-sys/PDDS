import { NextResponse } from "next/server";
import crypto from "crypto";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

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

    if (!signatureHeader || !webhookSecret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sigParts = signatureHeader.split(",");
    const timestamp = sigParts.find(p => p.startsWith("t="))?.split("=")[1];
    const signature = sigParts.find(p => p.startsWith("te="))?.split("=")[1] || sigParts.find(p => p.startsWith("li="))?.split("=")[1];

    const payloadString = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(payloadString).digest("hex");

    if (signature !== expectedSignature) return NextResponse.json({ error: "Signature Mismatch" }, { status: 401 });

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
        
        await db.collection("donations").add({
          uid: userId,
          fullName: session.attributes.billing?.name || "Verified Patriot",
          amount: amount,
          type: "Membership Dues",
          status: "Successful",
          timestamp: FieldValue.serverTimestamp()
        });
      } else {
        await db.collection("donations").add({
          uid: userId,
          fullName: session.attributes.billing?.name || "Anonymous Patriot",
          amount: amount,
          type: "Voluntary Contribution",
          status: "Successful",
          timestamp: FieldValue.serverTimestamp()
        });
      }

      await db.collection("activity_logs").add({
        action: paymentType === "MEMBERSHIP_DUES" ? "DUES_PAID" : "DONATION_RECEIVED",
        targetUserId: userId,
        targetUserName: session.attributes.billing?.name || "Member",
        timestamp: FieldValue.serverTimestamp(),
        details: `${paymentType === "MEMBERSHIP_DUES" ? "Annual Dues" : "Contribution"} of ₱${amount} processed via PayMongo.`
      });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Server Protocol Error" }, { status: 500 });
  }
}
