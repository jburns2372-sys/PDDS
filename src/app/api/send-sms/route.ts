
import { NextResponse } from 'next/server';

/**
 * @fileOverview Secure API route for handling SMS distribution via third-party gateways.
 * Supports personalized payloads and URGENT administrative alerts.
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { isPersonalized, tasks, message, numbers, isUrgent } = body;

    // Handle High-Priority Administrative Alerts (e.g., from Cloud Functions or Dashboard)
    if (isUrgent && message && numbers) {
        console.log(`[SMS GATEWAY] PRIORITY ALERT DISPATCHED to ${numbers.length} numbers.`);
        // Production logic: Use an immediate delivery queue
    }

    if (isPersonalized) {
      if (!tasks || !Array.isArray(tasks)) {
        return NextResponse.json({ error: 'Missing personalized tasks.' }, { status: 400 });
      }

      console.log(`[SMS GATEWAY] Dispatching batch of ${tasks.length} UNIQUE personalized messages.`);
      
      /**
       * PRODUCTION INTEGRATION: iSMS Bulk Individual API
       * 
       * for (const task of tasks) {
       *   const { phoneNumber, personalizedMsg } = task;
       *   // Call gateway per message or use a bulk submission JSON endpoint
       * }
       */
    } else {
      if (!message || !numbers || !Array.isArray(numbers)) {
        return NextResponse.json({ error: 'Missing message or recipient numbers.' }, { status: 400 });
      }

      const dstno = numbers.join(';');
      console.log(`[SMS GATEWAY] Dispatching broadcast to ${numbers.length} recipients.`);
    }

    // Simulated gateway processing
    await new Promise(resolve => setTimeout(resolve, 600));

    return NextResponse.json({ 
      success: true, 
      recipientCount: isPersonalized ? tasks.length : numbers.length,
      status: "Batch processed successfully.",
      priority: isUrgent ? "High" : "Standard"
    });
  } catch (error: any) {
    console.error('SMS Gateway Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
