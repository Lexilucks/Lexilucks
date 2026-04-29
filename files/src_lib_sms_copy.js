// src/lib/sms-copy.js
// Purpose: All SMS templates (professional, compliant, no explicit content)
// CRITICAL: Route adult content to OnlyFans, label AI Assistant, clean messaging

export const SMS_TEMPLATES = {
  // ============================================
  // Initial Greeting & Age Gate
  // ============================================
  WELCOME: `Hi! 👋 Welcome to Lexi's exclusive fan experiences. This is Lexi AI Assistant. To continue, you must confirm you're 18+. Reply "YES" to proceed.`,

  AGE_GATE_REQUIRED: `⚠️ You must be 18+ to access these services. Reply "YES" to confirm your age, or "STOP" to unsubscribe.`,

  AGE_CONFIRMED: `✅ Thanks for confirming! Here are your options:\n\n1️⃣ Text List ($9)\n2️⃣ Fan Drop ($19)\n3️⃣ Priority Text ($29)\n4️⃣ Real Lexi Text ($49)\n5️⃣ 10-min Voice Call ($49)\n6️⃣ 20-min Video Call ($99)\n7️⃣ VIP Experience ($199)\n8️⃣ OnlyFans Link\n\nReply the number of your choice.`,

  // ============================================
  // Package Selection & Checkout
  // ============================================
  PACKAGE_SELECTED_TEXT_LIST: `🎁 You selected Text List ($9). This includes 5 personalized text messages from Lexi AI Assistant over 7 days.\n\nClick to pay: [STRIPE_LINK]`,

  PACKAGE_SELECTED_FAN_DROP: `🎁 You selected Fan Drop ($19). Lexi will drop a surprise exclusive photo/message just for you.\n\nClick to pay: [STRIPE_LINK]`,

  PACKAGE_SELECTED_PRIORITY_TEXT: `🎁 You selected Priority Text ($29). 3 priority messages answered within 12 hours.\n\nClick to pay: [STRIPE_LINK]`,

  PACKAGE_SELECTED_REAL_LEXI_TEXT: `🎁 You selected Real Lexi Text ($49). Personal text from real Lexi (not AI) within 24 hours.\n\nClick to pay: [STRIPE_LINK]`,

  PACKAGE_SELECTED_VOICE: `🎁 You selected 10-min Voice Call ($49). Schedule your call at checkout.\n\nClick to pay: [STRIPE_LINK]`,

  PACKAGE_SELECTED_VIDEO: `🎁 You selected 20-min Video Call ($99). Schedule your call at checkout.\n\nClick to pay: [STRIPE_LINK]`,

  PACKAGE_SELECTED_VIP: `🎁 You selected VIP Experience ($199). Premium 1-on-1 experience (voice, video, or both). Schedule at checkout.\n\nClick to pay: [STRIPE_LINK]`,

  CHECKOUT_LINK_SENT: `💳 Payment link sent! Click above to complete purchase. You'll get confirmation + scheduling link once payment succeeds.`,

  // ============================================
  // Post-Payment & Fulfillment
  // ============================================
  PAYMENT_SUCCEEDED_TEXT: `✅ Payment received! Your Text List purchase is confirmed.\n\nYou'll receive your 5 personalized texts over the next 7 days. Thanks for supporting Lexi!`,

  PAYMENT_SUCCEEDED_FAN_DROP: `✅ Payment received! Your Fan Drop is on the way.\n\nLexi will send your exclusive surprise within 24 hours. 🎉`,

  PAYMENT_SUCCEEDED_VOICE: `✅ Payment received! Your Voice Call is confirmed.\n\nBook your 10-min call here: [CALENDLY_LINK]\n\nTalk soon!`,

  PAYMENT_SUCCEEDED_VIDEO: `✅ Payment received! Your Video Call is confirmed.\n\nSchedule your 20-min call here: [CALENDLY_LINK]\n\nLooking forward to it!`,

  PAYMENT_SUCCEEDED_VIP: `✅ Payment received! Your VIP Experience is confirmed.\n\nSchedule your premium session here: [CALENDLY_LINK]\n\nLet's make it unforgettable! 💫`,

  SCHEDULING_REMINDER: `📅 Reminder: Don't forget to book your call! Click here to schedule: [CALENDLY_LINK]\n\nBooking closes in 7 days.`,

  // ============================================
  // Compliance & Admin
  // ============================================
  STOP_ACKNOWLEDGED: `👋 You've been unsubscribed from all messages. You won't receive any further SMS from us. Reply "UNSTOP" to re-subscribe.`,

  UNSTOP_CONFIRMED: `✅ You're re-subscribed! You'll receive messages about future offers and confirmations. Reply "STOP" to unsubscribe again.`,

  INVALID_RESPONSE: `❓ I didn't understand that. Reply with the number (1-8) of your choice, or "STOP" to unsubscribe.`,

  HELP: `📋 Lexi AI Assistant here. Type a number to select a package:\n1=Text List | 2=Fan Drop | 3=Priority Text | 4=Real Lexi | 5=Voice | 6=Video | 7=VIP | 8=OnlyFans`,

  // ============================================
  // Error & Edge Cases
  // ============================================
  ALREADY_COMPLETED: `✅ You've already completed this package! Check your email or visit Lexi's OnlyFans for more exclusive content.`,

  SYSTEM_ERROR: `⚠️ Something went wrong. Please try again or contact support@lexi.com`,

  MUST_BE_18: `⚠️ You must be 18+ to access these services. Reply "YES" to confirm age, or "STOP" to unsubscribe.`,

  ONLYFANS_REDIRECT: `🔗 For adult content, visit Lexi's OnlyFans: https://onlyfans.com/lexi\n\nReply STOP to unsubscribe.`,
};

/**
 * Replace placeholders in SMS templates
 * @param {string} template - SMS template key from SMS_TEMPLATES
 * @param {object} variables - { STRIPE_LINK, CALENDLY_LINK, etc }
 * @returns {string} - rendered SMS message
 */
export function renderSMS(template, variables = {}) {
  if (!SMS_TEMPLATES[template]) {
    throw new Error(`Unknown SMS template: ${template}`);
  }

  let message = SMS_TEMPLATES[template];

  // Replace variables
  Object.entries(variables).forEach(([key, value]) => {
    message = message.replace(`[${key}]`, value || '[ERROR: missing value]');
  });

  return message;
}

/**
 * Get package-specific confirmation SMS after payment
 */
export function getPaymentSuccessSMS(packageType) {
  const map = {
    textList: 'PAYMENT_SUCCEEDED_TEXT',
    fanDrop: 'PAYMENT_SUCCEEDED_FAN_DROP',
    priorityText: 'PAYMENT_SUCCEEDED_TEXT',
    realLexiText: 'PAYMENT_SUCCEEDED_TEXT',
    voice10: 'PAYMENT_SUCCEEDED_VOICE',
    video20: 'PAYMENT_SUCCEEDED_VIDEO',
    vip: 'PAYMENT_SUCCEEDED_VIP',
  };

  return map[packageType] || 'PAYMENT_SUCCEEDED_TEXT';
}

export default {
  SMS_TEMPLATES,
  renderSMS,
  getPaymentSuccessSMS,
};
