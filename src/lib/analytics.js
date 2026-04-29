(function (global) {
  "use strict";

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

  const EVENT_NAMES = new Set(Object.values(EVENTS));
  const STORAGE_KEY = "lexi.analytics.events";
  const MAX_STORED_EVENTS = 80;

  /**
   * @typedef {keyof typeof EVENTS | string} AnalyticsEventName
   * @typedef {Record<string, string | number | boolean | null | undefined>} AnalyticsPayload
   */

  function getAttribution() {
    const params = new URLSearchParams(global.location ? global.location.search : "");
    const referrer = global.document ? global.document.referrer : "";
    return {
      source: params.get("utm_source") || params.get("source") || directSource(referrer),
      medium: params.get("utm_medium") || params.get("medium") || "",
      campaign: params.get("utm_campaign") || params.get("campaign") || "",
      term: params.get("utm_term") || "",
      content: params.get("utm_content") || "",
      referrer,
      landing_page: global.location ? global.location.href : ""
    };
  }

  function directSource(referrer) {
    if (!referrer) return "direct";
    try {
      return new URL(referrer).hostname;
    } catch (error) {
      return "referral";
    }
  }

  function storeEvent(event) {
    try {
      const existing = JSON.parse(global.localStorage.getItem(STORAGE_KEY) || "[]");
      existing.push(event);
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(-MAX_STORED_EVENTS)));
    } catch (error) {
      // Storage can fail in private mode; console fallback still runs.
    }
  }

  function sendToProviders(name, payload) {
    if (typeof global.gtag === "function") {
      global.gtag("event", name, payload);
    }
    if (typeof global.fbq === "function") {
      global.fbq("trackCustom", name, payload);
    }
    if (global.ttq && typeof global.ttq.track === "function") {
      global.ttq.track(name, payload);
    }
    if (global.posthog && typeof global.posthog.capture === "function") {
      global.posthog.capture(name, payload);
    }
    if (Array.isArray(global.dataLayer)) {
      global.dataLayer.push({ event: name, ...payload });
    }
  }

  /**
   * Track a typed analytics event with attribution and provider fallbacks.
   * @param {AnalyticsEventName} name
   * @param {AnalyticsPayload=} payload
   */
  function track(name, payload = {}) {
    const eventName = String(name);
    const event = {
      event: eventName,
      timestamp: new Date().toISOString(),
      page_path: global.location ? global.location.pathname : "",
      page_title: global.document ? global.document.title : "",
      ...getAttribution(),
      ...payload
    };

    storeEvent(event);
    sendToProviders(eventName, event);

    if (!global.LEXI_ANALYTICS_SILENT) {
      const valid = EVENT_NAMES.has(eventName);
      const method = valid ? "debug" : "warn";
      if (global.console && typeof global.console[method] === "function") {
        global.console[method]("[LexiAnalytics]", eventName, event);
      }
    }

    return event;
  }

  function instrumentClicks(root = global.document) {
    if (!root) return;
    root.addEventListener("click", (event) => {
      const clicked = event.target && event.target.closest
        ? event.target
        : event.target && event.target.parentElement;
      if (!clicked || !clicked.closest) return;
      const target = clicked.closest("[data-analytics-event]");
      if (!target) return;
      track(target.dataset.analyticsEvent, {
        label: target.dataset.analyticsLabel || target.textContent.trim().slice(0, 90),
        href: target.href || "",
        location: target.dataset.analyticsLocation || ""
      });
    });
  }

  function pageView() {
    track(EVENTS.PAGE_VIEW);
  }

  const api = {
    EVENTS,
    EVENT_NAMES: Array.from(EVENT_NAMES),
    getAttribution,
    instrumentClicks,
    pageView,
    track
  };

  global.LexiAnalytics = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
