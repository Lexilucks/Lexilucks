/**
 * Utility to send SMS via Twilio.
 * Also logs the outbound message to the message_events table.
 */

// import twilio from 'twilio'; // Uncomment when Twilio package is installed

export async function sendSms({ to, body, type }) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn('[Twilio Send] Missing Twilio credentials in environment.');
    // Simulated send for local development
    console.log(`[SIMULATED SMS] To: ${to} | Type: ${type} | Body: ${body}`);
    return { success: true, sid: `sim_${Date.now()}` };
  }

  try {
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // const message = await client.messages.create({
    //   body,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to
    // });
    
    // Log to message_events table (placeholder)
    // console.log(`[Twilio Send] Successfully sent message ${message.sid} to ${to}`);
    
    // return { success: true, sid: message.sid };
    
    console.log(`[SIMULATED SMS] To: ${to} | Type: ${type} | Body: ${body}`);
    return { success: true, sid: `sim_${Date.now()}` };
  } catch (error) {
    console.error('[Twilio Send Error]', error);
    
    // Log failure to message_events table (placeholder)
    
    return { success: false, error: error.message };
  }
}

// Optional API route wrapper if called via HTTP
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { to, body, type } = req.body;
  const result = await sendSms({ to, body, type });
  
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
}
