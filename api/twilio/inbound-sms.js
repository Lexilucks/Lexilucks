/**
 * POST /api/twilio/inbound-sms
 * 
 * Webhook handler for Twilio incoming SMS messages.
 * Parses the inbound message, verifies Twilio signature, and routes to the state machine.
 */

import { matchKeyword } from '../../src/lib/sms-keywords.js';
import { STATES, isValidTransition } from '../../src/lib/sms-state-machine.js';
import { sendSms } from './send-sms.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Verify Twilio webhook signature here (placeholder)
    
    // 2. Parse inbound message
    const { Body, From, To } = req.body;
    
    // 3. Log event to message_events table (placeholder)
    console.log(`[Twilio Inbound] Received SMS from ${From}: ${Body}`);
    
    // 4. Route to SMS state machine
    const { intent, value } = matchKeyword(Body);
    console.log(`[Twilio Intent] ${intent} - ${value}`);
    
    // In a real implementation, you would:
    // A. Fetch the user's current request state from Supabase
    // B. Check isValidTransition(currentState, nextState)
    // C. Perform the action (e.g. send menu, send checkout link)
    // D. Update the state in Supabase
    
    if (intent === 'MENU') {
       await sendSms({ to: From, body: "Menu response goes here", type: "menu" });
    }

    // 5. Return TwiML response (empty for now, as we handle outbound asynchronously)
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send('<Response></Response>');
  } catch (error) {
    console.error('[Twilio Inbound Error]', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
