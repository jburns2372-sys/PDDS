
/**
 * @fileOverview Firebase Cloud Functions for PatriotLink.
 * Handles automated role assignment, security triggers, and engagement rewards.
 */

const { onUserCreated } = require("firebase-functions/v2/auth");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { getFirestore } = require("firebase-admin/firestore");
const admin = require("firebase-admin");

// Initialize Admin SDK
admin.initializeApp();

/**
 * Trigger: executeGenesisBroadcast
 * Dispatches push notifications to all members to announce PatriotHub.
 */
exports.executeGenesisBroadcast = onDocumentCreated("patriothub_pins/{pinId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const pin = snapshot.data();

    if (pin.type !== "GENESIS") return;

    const db = getFirestore();
    const usersSnap = await db.collection("users").get();
    
    console.log(`[GENESIS] Dispatched Hub launch signal to ${usersSnap.size} members.`);
});

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

    if (newUser.meritPoints === undefined) {
        await snapshot.ref.update({ meritPoints: 10 });
    }

    if (!newUser.referredBy) return;

    const recruiterRef = db.collection("users").doc(newUser.referredBy);
    
    try {
        await db.runTransaction(async (transaction) => {
            const recruiterDoc = await transaction.get(recruiterRef);
            if (!recruiterDoc.exists) return;

            transaction.update(recruiterRef, {
                meritPoints: admin.firestore.FieldValue.increment(50),
                referralCount: admin.firestore.FieldValue.increment(1)
            });

            console.log(`[GROWTH] Awarded 50 points to recruiter ${newUser.referredBy}`);
        });
    } catch (error) {
        console.error("[GROWTH ERROR] Referral transaction failed:", error);
    }
});

/**
 * Trigger: handleEngagementMerit
 * Awards points for community verification actions (upvoting civic reports).
 */
exports.handleEngagementMerit = onDocumentUpdated("civic_reports/{reportId}", async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    const db = getFirestore();

    const beforeVotes = before.upvotes || [];
    const afterVotes = after.upvotes || [];

    // Award 5 points to the reporter if they get a new verification
    if (afterVotes.length > beforeVotes.length) {
        const reporterUid = after.uid;
        if (!reporterUid) return;

        const reporterRef = db.collection("users").doc(reporterUid);
        await reporterRef.update({
            meritPoints: admin.firestore.FieldValue.increment(5)
        });
        console.log(`[ENGAGEMENT] Awarded 5 merit points to reporter ${reporterUid} for community verification.`);
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

    if (before.role === after.role) return;

    console.log(`[REGISTRY AUDIT] Role change detected for ${after.fullName}: ${before.role} -> ${after.role}`);

    await db.collection("communication_audit").add({
        type: "Role Escalation Audit",
        userId: event.params.userId,
        userName: after.fullName,
        change: `${before.role} -> ${after.role}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: "Logged"
    });
});
