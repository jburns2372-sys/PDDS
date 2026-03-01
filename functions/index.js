/**
 * @fileOverview Firebase Cloud Functions for PatriotLink Automation.
 * Handles server-side triggers for member registration and mobilization alerts.
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onUserCreated } = require("firebase-functions/v2/auth");
const { getFirestore } = require("firebase-admin/firestore");
const admin = require("firebase-admin");

// Initialize Admin SDK
admin.initializeApp();

/**
 * Trigger: Force Supporter Role for Google Users
 * This script captures Google user info and blocks unauthorized Admin access.
 * It ensures that every social login is forced into the 'Supporter' role by default.
 */
exports.autoAssignSupporterRole = onUserCreated(async (event) => {
    const user = event.data;
    const db = getFirestore();
    
    // 1. Check if the user joined using Google
    const isGoogleUser = user.providerData.some(
      (provider) => provider.providerId === 'google.com'
    );

    // Only force roles for Google users as requested
    if (!isGoogleUser) return;

    // 2. Define the Supporter Profile
    // Aligned with the National Registry schema and user requirements.
    const supporterProfile = {
      uid: user.uid,
      email: user.email,
      fullName: (user.displayName || "Anonymous Supporter").toUpperCase(),
      photoURL: user.photoURL || "",
      role: "Supporter", // Forced role: cannot be Admin or President
      isAdmin: false,    // Strictly denied Admin status per security requirement
      isApproved: true,
      kartilyaAgreed: true,
      jurisdictionLevel: "National",
      recruitCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      // 3. Save the record to your 'users' collection in Firestore
      // Use set with no merge to ensure the role is IRREVOCABLY overwritten to Supporter on creation
      await db.collection('users').doc(user.uid).set(supporterProfile);
      console.log(`[AUTH SECURITY] Successfully registered Google user ${user.email} as a Supporter in the National Registry.`);
    } catch (error) {
      console.error("[AUTH SECURITY ERROR] Critical Error during Supporter Registration:", error);
    }
});

/**
 * Trigger: On Supporter Created
 * Logic: Sends an automated Welcome SMS audit if a phone number is available.
 */
exports.onSupporterCreated = onDocumentCreated("users/{userId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const data = snapshot.data();

    // Gate: Only trigger for new users with the 'Supporter' role
    if (data.role !== 'Supporter') return;

    const db = getFirestore();
    const fullName = data.fullName || "Member";
    const phoneNumber = data.phoneNumber;

    try {
        if (phoneNumber && phoneNumber.trim() !== "") {
            const welcomeMessage = `Mabuhay ${fullName}! Welcome to the PDDS movement. 🇵🇭 Your account is now active in the National Registry. Log in to download your Digital ID: [Portal-Link.ph]`;

            console.log(`[WELCOME SMS DISPATCH] Target: ${phoneNumber} | Message: ${welcomeMessage}`);

            // Audit log the SMS notification
            await db.collection("communication_audit").add({
                type: "Welcome SMS",
                recipient: phoneNumber,
                recipientName: fullName,
                status: "Dispatched",
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Cloud Function Error (onSupporterCreated):", error);
    }
});

/**
 * Trigger: On Activity Created
 * Logic: Alerts the President via SMS audit if a new activity requires authorization.
 */
exports.onActivityCreated = onDocumentCreated("calendar_activities/{activityId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const data = snapshot.data();

    if (data.isAuthorized === true) return;

    const db = getFirestore();
    
    try {
        const usersRef = db.collection("users");
        const presidentQuery = await usersRef.where("role", "==", "President").limit(1).get();

        if (presidentQuery.empty) {
            console.log("SMS ALERT FAILED: No user with role 'President' found.");
            return;
        }

        const presidentData = presidentQuery.docs[0].data();
        const presidentPhone = presidentData.phoneNumber;

        if (!presidentPhone) return;

        const category = data.scope || "National";
        const title = data.title || "Untitled Activity";
        const creator = data.organizerName || "Secretariat";
        
        const alertMessage = `URGENT: A new ${category} activity (${title}) has been drafted by ${creator}. Please review and authorize in the Audit Center.`;

        console.log(`[SMS DISPATCH] Target: ${presidentPhone} | Message: ${alertMessage}`);

        await db.collection("communication_audit").add({
            type: "Presidential SMS Alert",
            recipient: presidentPhone,
            message: alertMessage,
            status: "Dispatched",
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

    } catch (error) {
        console.error("Cloud Function Error (onActivityCreated):", error);
    }
});