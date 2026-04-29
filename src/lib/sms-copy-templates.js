/**
 * Lexi Concierge SMS Templates
 * Centralized copy for all SMS communication.
 */

const SMS_TEMPLATES = {
  menu: `Lexi Concierge Menu:
1️⃣  Join Free Text List
2️⃣  $7.77 Flirty Fan Drop
3️⃣  $24.99 Priority Text
4️⃣  $49 Real Lexi Text Pass
5️⃣  $99 Voice Call (10 min)
6️⃣  $199 Video Call (20 min)
7️⃣  $499 VIP Experience
8️⃣  Adult Content (→ OnlyFans)

Reply with number or text HELP`,

  confirmation_free: `Welcome to Lexi's Text List! You'll get updates, drops, and alerts here. Reply STOP at any time to opt out.`,
  
  checkout_link: (packageId, checkoutUrl) => `Ready to lock in your ${packageId} request? Complete payment here: ${checkoutUrl}`,
  
  payment_received_voice: (calendlyLink) => `✅ Payment received! Book your 10-min voice call here:
${calendlyLink}
⏰ Slots fill up fast. Schedule within 48h to lock in a time.`,

  payment_received_video: (calendlyLink) => `✅ Payment received! Book your 20-min video call here:
${calendlyLink}
⏰ Please schedule within 48h.`,

  payment_received_vip: (calendlyLink) => `✅ Payment received! Book your VIP Experience review here:
${calendlyLink}`,

  payment_received_text: `✅ Payment received! Lexi's team will review your request. Look out for a response here soon!`,

  reminder_24h: `Reminder: Your call with Lexi is in 24 hours. Be ready!`,
  
  reminder_2h: `Heads up! Your call with Lexi starts in 2 hours.`,
  
  help: `Need help? Reply 1-8 to see packages, STATUS to check your request, or STOP to opt out.`,
  
  stop: `You have been unsubscribed from Lexi Concierge and will not receive further messages.`,
  
  age_gate_error: `Sorry, you must confirm you are 18+ to access Lexi's fan packages.`
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SMS_TEMPLATES;
} else {
  window.SMS_TEMPLATES = SMS_TEMPLATES;
}
