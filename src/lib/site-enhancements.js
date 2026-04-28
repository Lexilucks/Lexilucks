(function (global) {
  "use strict";

  function ready(callback) {
    if (!global.document) return;
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function fillAttributionFields(form) {
    if (!form || !global.LexiAnalytics) return;
    const attribution = global.LexiAnalytics.getAttribution();
    Object.keys(attribution).forEach((key) => {
      const field = form.querySelector(`[name="${key}"]`);
      if (field) field.value = attribution[key] || "";
    });
  }

  function openHashTarget(hash) {
    const target = hash && global.document.querySelector(hash);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function initMobileCtas() {
    global.document.querySelectorAll("[data-scroll-target]").forEach((button) => {
      button.addEventListener("click", () => openHashTarget(button.dataset.scrollTarget));
    });
  }

  ready(() => {
    global.LexiAnalytics?.pageView();
    global.LexiAnalytics?.instrumentClicks();

    const leadForm = global.document.querySelector("[data-lead-form]");
    fillAttributionFields(leadForm);
    global.LexiLeadCapture?.initLeadForm("[data-lead-form]");

    initMobileCtas();
  });
})(typeof window !== "undefined" ? window : globalThis);
