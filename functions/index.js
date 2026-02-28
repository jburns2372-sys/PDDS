
/**
 * @fileOverview Firebase Cloud Functions for PatriotLink Automation.
 * Handles server-side triggers for mobilization and induction alerts.
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getFirestore } = require("firebase-admin/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

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

            /**
             * PRODUCTION INTEGRATION (e.g., Twilio / Movider)
             * 
             * await fetch('https://api.sms-gateway.com/send', {
             *   method: 'POST',
             *   body: JSON.stringify({ to: phoneNumber, message: welcomeMessage })
             * });
             */

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
            console.log(`[WELCOME EMAIL QUEUED] User ${fullName} (${event.params.userId}) has no phone number. Queueing induction email.`);
            
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
