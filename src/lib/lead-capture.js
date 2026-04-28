(function (global) {
  "use strict";

  const STORAGE_KEY = "lexi.partyNetwork.leads";
  const DEFAULT_ENDPOINT = "https://formspree.io/f/xkopkbkr";

  function trim(value) {
    return String(value || "").trim();
  }

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trim(value));
  }

  function normalizePhone(value) {
    return trim(value).replace(/[^\d+]/g, "");
  }

  function validateLead(data) {
    const errors = {};
    if (!trim(data.name)) errors.name = "Please enter your name.";
    if (!isEmail(data.email)) errors.email = "Please enter a valid email.";
    if (data.smsOptIn && normalizePhone(data.phone).replace(/^\+1/, "").length < 10) {
      errors.phone = "Add a valid phone number for SMS updates.";
    }
    if (!data.emailConsent && !data.smsOptIn) {
      errors.consent = "Choose at least one way Lexi's team can contact you.";
    }
    return {
      ok: Object.keys(errors).length === 0,
      errors
    };
  }

  function getAttribution() {
    if (global.LexiAnalytics) return global.LexiAnalytics.getAttribution();
    const params = new URLSearchParams(global.location ? global.location.search : "");
    return {
      source: params.get("utm_source") || "direct",
      medium: params.get("utm_medium") || "",
      campaign: params.get("utm_campaign") || "",
      referrer: global.document ? global.document.referrer : "",
      landing_page: global.location ? global.location.href : ""
    };
  }

  function serializeForm(form) {
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    return {
      ...data,
      name: trim(data.name),
      email: trim(data.email).toLowerCase(),
      phone: normalizePhone(data.phone),
      instagram: trim(data.instagram),
      interest: trim(data.interest || data.tier || "party-network"),
      emailConsent: fd.has("emailConsent"),
      smsOptIn: fd.has("smsOptIn"),
      termsConsent: fd.has("termsConsent"),
      attribution: getAttribution(),
      submitted_at: new Date().toISOString()
    };
  }

  function storeLead(lead) {
    try {
      const existing = JSON.parse(global.localStorage.getItem(STORAGE_KEY) || "[]");
      existing.push(lead);
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(-200)));
    } catch (error) {
      // Private browsing fallback: fail quietly after form success.
    }
  }

  async function submitLead(lead, endpoint = DEFAULT_ENDPOINT) {
    const body = {
      ...lead,
      _subject: "Party Network lead - lexilucks.com",
      source: lead.attribution.source,
      medium: lead.attribution.medium,
      campaign: lead.attribution.campaign,
      referrer: lead.attribution.referrer,
      landing_page: lead.attribution.landing_page
    };

    storeLead(lead);

    if (!endpoint) {
      return { ok: true, mode: "local" };
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(body)
      });
      return { ok: response.ok, mode: response.ok ? "remote" : "local", status: response.status };
    } catch (error) {
      return { ok: true, mode: "local", error: error.message };
    }
  }

  function setError(form, errors) {
    form.querySelectorAll("[data-error-for]").forEach((el) => {
      const key = el.dataset.errorFor;
      el.textContent = errors[key] || "";
      el.hidden = !errors[key];
    });
    Object.keys(errors).forEach((key) => {
      const field = form.querySelector(`[name="${key}"]`);
      if (field) field.setAttribute("aria-invalid", "true");
    });
  }

  function clearErrors(form) {
    form.querySelectorAll("[aria-invalid='true']").forEach((el) => el.removeAttribute("aria-invalid"));
    form.querySelectorAll("[data-error-for]").forEach((el) => {
      el.textContent = "";
      el.hidden = true;
    });
  }

  function initLeadForm(selector = "[data-lead-form]") {
    const form = global.document && global.document.querySelector(selector);
    if (!form) return;
    const status = form.querySelector("[data-form-status]");
    let started = false;

    form.addEventListener("input", () => {
      if (started) return;
      started = true;
      global.LexiAnalytics?.track(global.LexiAnalytics.EVENTS.PARTY_NETWORK_FORM_START, {
        form: "party_network"
      });
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearErrors(form);
      const lead = serializeForm(form);
      const validation = validateLead(lead);

      if (!validation.ok) {
        setError(form, validation.errors);
        if (status) {
          status.textContent = "Almost there. Please fix the highlighted fields.";
          status.dataset.state = "error";
        }
        global.LexiAnalytics?.track(global.LexiAnalytics.EVENTS.LEAD_FORM_ERROR, {
          form: "party_network",
          fields: Object.keys(validation.errors).join(",")
        });
        return;
      }

      const button = form.querySelector("[type='submit']");
      if (button) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = "Sending...";
      }

      const result = await submitLead(lead, form.dataset.endpoint || DEFAULT_ENDPOINT);
      global.LexiAnalytics?.track(global.LexiAnalytics.EVENTS.PARTY_NETWORK_FORM_SUBMIT, {
        form: "party_network",
        mode: result.mode,
        interest: lead.interest,
        sms_opt_in: lead.smsOptIn,
        email_consent: lead.emailConsent
      });

      if (status) {
        status.textContent = result.mode === "remote"
          ? "You're on the list. Watch your email or texts for members-first updates, RSVP windows, and next steps."
          : "You're saved locally for preview mode. Once the backend is connected, this form will send to Lexi's list automatically.";
        status.dataset.state = "success";
      }
      form.reset();

      if (button) {
        button.disabled = false;
        button.textContent = button.dataset.originalText || "Join the Party Network";
      }
    });
  }

  const api = {
    DEFAULT_ENDPOINT,
    STORAGE_KEY,
    initLeadForm,
    normalizePhone,
    serializeForm,
    storeLead,
    submitLead,
    validateLead
  };

  global.LexiLeadCapture = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
