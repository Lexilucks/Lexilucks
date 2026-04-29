/**
 * Lexi Concierge Analytics Events
 * Event dictionary for tracking user actions across the funnel.
 */

const EVENTS = Object.freeze({
  PAGE_VIEW: "page_view",
  HERO_CTA_CLICK: "hero_cta_click",
  PARTY_NETWORK_FORM_START: "party_network_form_start",
  PARTY_NETWORK_FORM_SUBMIT: "party_network_form_submit",
  SOCIAL_CLICK: "social_click",
  LIVE_PLATFORM_CLICK: "live_platform_click",
  PATREON_TIER_CLICK: "patreon_tier_click",
  MERCH_CLICK: "merch_click",
  DISCORD_CLICK: "discord_click",
  BRAND_INQUIRY_CLICK: "brand_inquiry_click",
  AI_CONCIERGE_OPEN: "ai_concierge_open",
  AI_CONCIERGE_MESSAGE_SUBMIT: "ai_concierge_message_submit",
  TRANSCEND_CTA_CLICK: "transcend_cta_click",
  TEXT_CALL_PAGE_VIEW: "text_call_page_view",
  TEXT_CALL_PACKAGE_CLICK: "text_call_package_click",
  TEXT_CALL_FORM_START: "text_call_form_start",
  TEXT_CALL_FORM_SUBMIT: "text_call_form_submit",
  TEXT_CALL_STRIPE_CLICK: "text_call_stripe_click",
  TEXT_CALL_ONLYFANS_CLICK: "text_call_onlyfans_click",
  TEXT_CALL_AI_OPEN: "text_call_ai_open",
  TEXT_CALL_AI_MESSAGE: "text_call_ai_message",
  REAL_LEXI_UPGRADE_CLICK: "real_lexi_upgrade_click",
  LEAD_FORM_ERROR: "lead_form_error"
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EVENTS;
} else {
  window.ANALYTICS_EVENTS = EVENTS;
}
