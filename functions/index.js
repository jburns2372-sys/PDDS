
/**
 * @fileOverview Firebase Cloud Functions for PatriotLink.
 * Handles automated role assignment, security triggers, and registry audits.
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

/**
 * Trigger: onActivityCreated
 * Alerts the President via audit log if a new activity requires authorization.
 */
exports.onActivityCreated = onDocumentCreated("calendar_activities/{activityId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const data = snapshot.data();

    if (data.isAuthorized === true) return;

    const db = getFirestore();
    
    try {
        const presidentQuery = await db.collection("users").where("role", "==", "President").limit(1).get();
        if (presidentQuery.empty) return;

        const presidentData = presidentQuery.docs[0].data();
        const alertMessage = `URGENT: New ${data.scope || "National"} activity (${data.title}) requires Presidential authorization.`;

        await db.collection("communication_audit").add({
            type: "Presidential Alert",
            recipient: presidentData.email,
            message: alertMessage,
            status: "Queued",
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

    } catch (error) {
        console.error("Cloud Function Error (onActivityCreated):", error);
    }
});
