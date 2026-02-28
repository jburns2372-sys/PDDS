import { NextResponse } from 'next/server';

/**
 * @fileOverview Secure API route for handling SMS distribution via third-party gateways.
 * Optimized for iSMS / Philippine SMS gateway protocols.
 */

export async function POST(request: Request) {
  try {
    const { message, numbers } = await request.json();

    if (!message || !numbers || !Array.isArray(numbers)) {
      return NextResponse.json({ error: 'Missing message or recipient numbers.' }, { status: 400 });
    }

    // iSMS / Gateway Format: dstno uses semicolon separation
    const dstno = numbers.join(';');
    
    console.log(`[SMS GATEWAY] Dispatching batch of ${numbers.length} recipients.`);
    
    /**
     * PRODUCTION INTEGRATION: iSMS API
     * 
     * const un = process.env.ISMS_USERNAME;
     * const pwd = process.env.ISMS_PASSWORD;
     * const url = `https://www.isms.com.my/api_send_sms_by_group.php?un=${un}&pwd=${pwd}&dstno=${encodeURIComponent(dstno)}&msg=${encodeURIComponent(message)}&type=1`;
     * 
     * const response = await fetch(url);
     * const result = await response.text();
     */

    // Simulated gateway delay for UI demonstration
    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({ 
      success: true, 
      recipientCount: numbers.length,
      status: "Batch accepted by gateway."
    });
  } catch (error: any) {
    console.error('SMS Gateway Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
