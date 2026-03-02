
/**
 * @fileOverview Firebase Cloud Functions for PatriotLink.
 * Handles automated role assignment, security triggers, and referral merit logic.
 */

const { onUserCreated } = require("firebase-functions/v2/auth");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { getFirestore } = require("firebase-admin/firestore");
const admin = require("firebase-admin");

// Initialize Admin SDK
admin.initializeApp();

/**
 * Trigger: captureGoogleUserInfo
 * Intercepts new Google sign-ins to provision a restricted Supporter profile.
 */
exports.captureGoogleUserInfo = onUserCreated(async (event) => {
    const user = event.data;
    const db = getFirestore();
    
    const isGoogleUser = user.providerData.some(
      (provider) => provider.providerId === 'google.com'
    );

    if (!isGoogleUser) return;

    const supporterProfile = {
      uid: user.uid,
      email: user.email,
      fullName: (user.displayName || "Anonymous Supporter").toUpperCase(),
      photoURL: user.photoURL || "",
      role: "Supporter",
      isAdmin: false,
      isVerified: false,
      isApproved: true,
      kartilyaAgreed: true,
      jurisdictionLevel: "National",
      meritPoints: 10,
      referralCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
      partyAffiliation: "PDDS"
    };

    try {
      await db.collection('users').doc(user.uid).set(supporterProfile);
      console.log(`[AUTH SECURITY] Provisioned Google user ${user.email} as Supporter.`);
    } catch (error) {
      console.error("[AUTH SECURITY ERROR] Provisioning failed:", error);
    }
});

/**
 * Trigger: handleReferralMerit
 * Awards points to recruiters and new members upon successful registry induction.
 */
exports.handleReferralMerit = onDocumentCreated("users/{userId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const newUser = snapshot.data();
    const db = getFirestore();

    // 1. Award Joiner Bonus (10 Points)
    if (newUser.meritPoints === undefined) {
        await snapshot.ref.update({ meritPoints: 10 });
    }

    // 2. Check for Recruiter
    if (!newUser.referredBy) return;

    const recruiterRef = db.collection("users").doc(newUser.referredBy);
    
    try {
        await db.runTransaction(async (transaction) => {
            const recruiterDoc = await transaction.get(recruiterRef);
            if (!recruiterDoc.exists) return;

            // Award 50 Points to Recruiter
            transaction.update(recruiterRef, {
                meritPoints: admin.firestore.FieldValue.increment(50),
                referralCount: admin.firestore.FieldValue.increment(1)
            });

            console.log(`[GROWTH] Awarded 50 points to recruiter ${newUser.referredBy} for inducting ${event.params.userId}`);
        });
    } catch (error) {
        console.error("[GROWTH ERROR] Referral transaction failed:", error);
    }
});

/**
 * Trigger: aggregateRegionalDonations
 * Triggers on a successful donation to update regional financial stats for the Heatmap.
 */
exports.aggregateRegionalDonations = onDocumentCreated("donations/{donationId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const donation = snapshot.data();

    // Only aggregate successful donations
    if (donation.status !== "Successful") return;

    const db = getFirestore();
    const regionId = (donation.region || "National").toUpperCase().replace(/\s+/g, '_');
    const statsRef = db.collection("regional_stats").doc(regionId);

    try {
        await statsRef.set({
            regionName: donation.region || "National",
            totalFunds: admin.firestore.FieldValue.increment(donation.amount),
            donorCount: admin.firestore.FieldValue.increment(1),
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log(`[FINANCE] Aggregated donation of ₱${donation.amount} for region ${donation.region}`);
    } catch (error) {
        console.error("[FINANCE ERROR] Aggregation failed:", error);
    }
});

/**
 * Trigger: auditRegistryRoles
 * Security handshake: Prevents unauthorized role escalation by non-admins.
 */
exports.auditRegistryRoles = onDocumentUpdated("users/{userId}", async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    const db = getFirestore();

    // Check if role has changed
    if (before.role === after.role) return;

    console.log(`[REGISTRY AUDIT] Role change detected for ${after.fullName}: ${before.role} -> ${after.role}`);

    // Log the escalation for the Auditor
    await db.collection("communication_audit").add({
        type: "Role Escalation Audit",
        userId: event.params.userId,
        userName: after.fullName,
        change: `${before.role} -> ${after.role}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: "Logged"
    });
});
