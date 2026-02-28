
/**
 * @fileOverview Firebase Cloud Functions for PatriotLink Automation.
 * Handles server-side triggers for mobilization alerts.
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getFirestore } = require("firebase-admin/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

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

        /**
         * PRODUCTION INTEGRATION (e.g., Twilio / iSMS)
         * 
         * const response = await fetch('https://api.your-sms-gateway.com/send', {
         *   method: 'POST',
         *   body: JSON.stringify({ to: presidentPhone, message: alertMessage, priority: 'high' })
         * });
         */
        
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
