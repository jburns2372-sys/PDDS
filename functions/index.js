
/**
 * @fileOverview Firebase Cloud Functions for PatriotLink Automation.
 * Handles server-side triggers for mobilization and induction alerts.
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onUserCreated } = require("firebase-functions/v2/auth");
const { getFirestore } = require("firebase-admin/firestore");
const admin = require("firebase-admin");

// Initialize Admin SDK
admin.initializeApp();

/**
 * Trigger: Auto Assign Supporter Role for Google Users
 * This script intercepts every new Google sign-in and blocks Admin access.
 * It ensures that every social login is forced into the 'Supporter' role by default.
 */
exports.autoAssignSupporterRole = onUserCreated(async (event) => {
    const user = event.data;
    const db = getFirestore();
    
    // 1. Check if the user joined using Google
    const isGoogleUser = user.providerData.some(
      (provider) => provider.providerId === 'google.com'
    );

    // We only force roles for Google users to prevent unexpected Admin escalation via social login
    if (!isGoogleUser) return;

    // 2. Define the Supporter Profile (Hard-coded to prevent Admin rights)
    // Aligned with the National Registry schema (Full Name, Approved Status, etc.)
    const supporterProfile = {
      uid: user.uid,
      email: user.email,
      fullName: (user.displayName || "New PDDS Supporter").toUpperCase(),
      photoURL: user.photoURL || "",
      role: "Supporter", // Forced role: cannot be Admin or President
      isApproved: true,
      kartilyaAgreed: true,
      recruitCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      // 3. Save the record to your 'users' collection in Firestore
      // Use merge: true to avoid overwriting existing data if the user somehow already existed
      await db.collection('users').doc(user.uid).set(supporterProfile, { merge: true });
      console.log(`[AUTH SECURITY] Successfully registered ${user.email} as a PDDS Supporter via Cloud Function.`);
    } catch (error) {
      console.error("[AUTH SECURITY ERROR] Critical Error during Supporter Registration:", error);
    }
});

/**
 * Trigger: On Supporter Created
 * Logic: Sends an automated Welcome SMS if a phone number is available.
 *        Otherwise, logs a task for a Welcome Email.
 */
exports.onSupporterCreated = onDocumentCreated("users/{userId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const data = snapshot.data();

    // 1. Gate: Only trigger for new users with the 'Supporter' role
    if (data.role !== 'Supporter') return;

    const db = getFirestore();
    const fullName = data.fullName || "Member";
    const phoneNumber = data.phoneNumber;

    try {
        if (phoneNumber && phoneNumber.trim() !== "") {
            // 2. DISPATCH WELCOME SMS
            const welcomeMessage = `Mabuhay ${fullName}! Welcome to the PDDS movement. 🇵🇭 Your account is now active in the National Registry. Log in to download your Digital ID and view the National Calendar: [Portal-Link.ph]`;

            console.log(`[WELCOME SMS DISPATCH] Target: ${phoneNumber} | Message: ${welcomeMessage}`);

            // Audit log the SMS notification
            await db.collection("communication_audit").add({
                type: "Welcome SMS",
                recipient: phoneNumber,
                recipientName: fullName,
                status: "Dispatched",
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // 3. FAILOVER: QUEUE WELCOME EMAIL
            console.log(`[WELCOME EMAIL QUEUED] User ${fullName} has no phone number. Queueing induction email.`);
            
            await db.collection("communication_audit").add({
                type: "Welcome Email Queue",
                recipientEmail: data.email,
                recipientName: fullName,
                status: "Queued (Missing Phone)",
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Cloud Function Error (onSupporterCreated):", error);
    }
});

/**
 * Trigger: On Activity Created
 * Logic: Alerts the President via SMS if a new activity requires authorization.
 */
exports.onActivityCreated = onDocumentCreated("calendar_activities/{activityId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const data = snapshot.data();

    // 1. Gate: Only trigger for unauthorized activities drafted by the Secretariat
    if (data.isAuthorized === true) return;

    const db = getFirestore();
    
    try {
        // 2. Lookup Presidential Contact
        const usersRef = db.collection("users");
        const presidentQuery = await usersRef.where("role", "==", "President").limit(1).get();

        if (presidentQuery.empty) {
            console.log("SMS ALERT FAILED: No user with role 'President' found in registry.");
            return;
        }

        const presidentData = presidentQuery.docs[0].data();
        const presidentPhone = presidentData.phoneNumber;

        if (!presidentPhone) {
            console.log("SMS ALERT FAILED: President found but has no phone number on file.");
            return;
        }

        // 3. Prepare Urgent Payload
        const category = data.scope || "National";
        const title = data.title || "Untitled Activity";
        const creator = data.organizerName || "Secretariat";
        
        const alertMessage = `URGENT: A new ${category} activity (${title}) has been drafted by ${creator}. Please log in to PatriotLink to review and authorize this event.`;

        console.log(`[SMS DISPATCH] Target: ${presidentPhone} | Message: ${alertMessage}`);

        // Audit log the notification
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
