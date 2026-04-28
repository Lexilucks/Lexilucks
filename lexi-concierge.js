(function () {
  "use strict";

  var STORAGE_KEY = "lexi.concierge.profile.v2";
  var SESSION_KEY = "lexi.concierge.session.v2";
  var MAX_EVENTS = 80;
  var MAX_MESSAGES = 16;
  var INTENTS = ["membership", "shop", "events", "business", "gaming", "coachella", "creatorTools"];
  var endpoint = "";
  var VOICE_GUIDE = {
    identity: "AI concierge in Lexi Lucks' style, not Lexi herself.",
    pillars: ["confident", "celebratory", "inclusive", "playful with edge", "professional when needed", "authentic"],
    audienceModes: {
      fans: "warm, insider-y, community-first; use team, fam, vibes, join the team",
      brands: "professional, selective, value-focused; lead with audience, alignment, authentic partnerships",
      gaming: "LIVE, Level UP, chat, vibes, fam, Friday Play League energy",
      advocacy: "safe space, lifting the community, breaking molds, visibility, all are welcome"
    },
    boundaries: [
      "Never claim to be Lexi or promise a personal reply.",
      "Avoid stiff PR language, performative allyship, vague CTAs, and overly sexual professional copy.",
      "Lead with value, make one clear recommendation, and close with gratitude or a CTA."
    ]
  };
  var CAPABILITIES = [
    { label: "Event info", prompt: "How do I get party updates?", intent: "events" },
    { label: "Guest list status", prompt: "Check my guest list status", intent: "events" },
    { label: "Style guidance", prompt: "What should I wear to a Lexi event?", intent: "events" },
    { label: "Live schedule", prompt: "Where can I watch Lexi live?", intent: "gaming" },
    { label: "Membership perks", prompt: "Find my best tier", intent: "membership" },
    { label: "Brand inquiries", prompt: "I am a brand partner", intent: "business" }
  ];

  function nowIso() {
    return new Date().toISOString();
  }

  function safeJson(value, fallback) {
    try {
      return JSON.parse(value) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function loadProfile() {
    var profile = safeJson(localStorage.getItem(STORAGE_KEY), null);
    if (!profile) {
      profile = {
        version: 2,
        firstSeen: nowIso(),
        lastSeen: nowIso(),
        visits: 0,
        pages: {},
        intents: {},
        events: [],
        messages: [],
        variant: ["soft", "playful", "direct"][Math.floor(Math.random() * 3)]
      };
    }
    INTENTS.forEach(function (intent) {
      if (typeof profile.intents[intent] !== "number") profile.intents[intent] = 0;
    });
    return profile;
  }

  var profile = loadProfile();
  var state = {
    page: getPageInfo(),
    segment: "new",
    open: false,
    thinking: false
  };

  function saveProfile() {
    profile.lastSeen = nowIso();
    profile.events = profile.events.slice(-MAX_EVENTS);
    profile.messages = profile.messages.slice(-MAX_MESSAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }

  function getSessionId() {
    var id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = "s_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  function getPageInfo() {
    var path = window.location.pathname || "/";
    var normalized = path.toLowerCase();
    var title = document.title || "Lexi Lucks";
    var intent = "membership";

    if (normalized.indexOf("shop") !== -1) intent = "shop";
    else if (normalized.indexOf("dashboard") !== -1) intent = "events";
    else if (normalized.indexOf("coachella") !== -1) intent = "coachella";
    else if (normalized.indexOf("media-kit") !== -1 || normalized.indexOf("rate-card") !== -1 || normalized.indexOf("celine") !== -1) intent = "business";
    else if (normalized.indexOf("princess-protocol") !== -1 || normalized.indexOf("content-studio") !== -1 || normalized.indexOf("media-studio") !== -1) intent = "creatorTools";

    return { path: path, title: title, intent: intent };
  }

  function scoreIntent(intent, amount, meta) {
    if (!intent || INTENTS.indexOf(intent) === -1) return;
    profile.intents[intent] = (profile.intents[intent] || 0) + amount;
    profile.events.push({
      at: nowIso(),
      type: "intent",
      intent: intent,
      amount: amount,
      page: state.page.path,
      meta: meta || {}
    });
    saveProfile();
    state.segment = computeSegment();
    updateRecommendation();
  }

  function computeSegment() {
    var winner = "membership";
    var winnerScore = -1;
    INTENTS.forEach(function (intent) {
      var score = profile.intents[intent] || 0;
      if (score > winnerScore) {
        winner = intent;
        winnerScore = score;
      }
    });

    if (profile.visits <= 1 && winnerScore < 4) return "new";
    if (winner === "shop") return "shopper";
    if (winner === "events") return "vipGuest";
    if (winner === "business") return "brandPartner";
    if (winner === "gaming") return "gamingFan";
    if (winner === "coachella") return "coachella";
    if (winner === "creatorTools") return "creatorOps";
    return "innerCircle";
  }

  function classifyClick(target) {
    var label = ((target.innerText || target.getAttribute("aria-label") || "") + " " + (target.href || "")).toLowerCase();
    if (/patreon|subscribe|join|tier|kingdom|member|princess|royalty|queen/.test(label)) return "membership";
    if (/shop|merch|amazon|storefront|tiktok shop|streamlabs|product|affiliate/.test(label)) return "shop";
    if (/event|party|waitlist|guest|vip|dashboard|rsvp|list|status/.test(label)) return "events";
    if (/media kit|rate card|collab|brand|ugc|partnership|booking|pitch|mailto/.test(label)) return "business";
    if (/twitch|kick|discord|gaming|stream/.test(label)) return "gaming";
    if (/coachella|festival|itinerary|desert/.test(label)) return "coachella";
    if (/protocol|studio|creator|content pipeline|caption/.test(label)) return "creatorTools";
    return "";
  }

  function bootAnalytics() {
    getSessionId();
    profile.visits += 1;
    profile.pages[state.page.path] = (profile.pages[state.page.path] || 0) + 1;
    scoreIntent(state.page.intent, 2, { source: "pageview", title: state.page.title });

    document.addEventListener("click", function (event) {
      var target = event.target.closest("a,button");
      if (!target || target.closest(".llc-widget")) return;
      var intent = classifyClick(target);
      if (intent) {
        scoreIntent(intent, 3, {
          source: "click",
          label: (target.innerText || target.getAttribute("aria-label") || "").trim().slice(0, 90),
          href: target.href || ""
        });
      }
    }, { passive: true });

    var started = Date.now();
    window.addEventListener("beforeunload", function () {
      var seconds = Math.round((Date.now() - started) / 1000);
      profile.events.push({ at: nowIso(), type: "dwell", page: state.page.path, seconds: seconds });
      saveProfile();
    });
  }

  function greeting() {
    var segment = state.segment;
    var tone = profile.variant || "soft";
    var map = {
      new: "Hey! 💕 I am Lexi's AI concierge, here in her style to help you find the right lane: fan perks, shop, events, gaming, Coachella, or brand work.",
      shopper: "Looks like you are in shop mode. We can Level UP from curated picks to merch to inner-circle perks when you are ready. ✨",
      vipGuest: "Event lane unlocked. I can help with the party list, fan status, dress code, or VIP next steps.",
      brandPartner: "Brand mode, love. I can route you through the media kit, rate card, or a values-aligned campaign pitch fast.",
      gamingFan: "Gaming lane unlocked. LIVE links, Discord, merch, and community perks are all on deck.",
      coachella: "Coachella planning mode. I can open the master guide, itinerary, or brand deliverables so the weekend stays cute and organized.",
      creatorOps: "Creator systems mode. I can help map Princess Protocol, content tools, owned lists, and fan funnels.",
      innerCircle: "Inner-circle energy. I can help compare tiers and pick the access level that actually fits your vibe."
    };

    if (tone === "playful" && segment === "new") {
      return "Welcome in, team. Tell me the vibe: fan perks, brand collab, shop, Coachella, gaming, or VIP list.";
    }
    if (tone === "direct" && segment === "new") {
      return "I can get you to the highest-value page quickly: membership, shop, events, media kit, rate card, or Coachella.";
    }
    return map[segment] || map.new;
  }

  function recommendations() {
    return {
      new: {
        label: "Best next step",
        title: "Choose your Lexi lane",
        body: "Fans usually start with perks, shop, or events. Brands should open the media kit first, then the rate card.",
        actions: [
          { text: "Membership", href: "index.html#membership", intent: "membership" },
          { text: "Media kit", href: "media-kit.html", intent: "business" }
        ]
      },
      shopper: {
        label: "Shop funnel",
        title: "Shop the vibe, then join the team",
        body: "Start with curated picks, move into merch, then Patreon or membership for the inner-circle layer.",
        actions: [
          { text: "Open shop", href: "shop.html", intent: "shop" },
          { text: "Join Patreon", href: "https://patreon.com/lexilucks", intent: "membership" }
        ]
      },
      vipGuest: {
        label: "Event funnel",
        title: "Get on the list",
        body: "Safe space, amazing people, good vibes. Use the party list form for new interest or check fan status from the dashboard.",
        actions: [
          { text: "Party list", href: "index.html#party-network", intent: "events" },
          { text: "Fan status", href: "dashboard.html", intent: "events" }
        ]
      },
      brandPartner: {
        label: "Brand funnel",
        title: "Media kit to booked campaign",
        body: "Review audience proof, confirm packages, then send a partnership inquiry with the campaign objective and values alignment.",
        actions: [
          { text: "Media kit", href: "media-kit.html", intent: "business" },
          { text: "Rate card", href: "rate-card.html", intent: "business" }
        ]
      },
      gamingFan: {
        label: "Gaming funnel",
        title: "Stream, Discord, membership",
        body: "Catch the LIVE channels first, join the Discord vibes, then use membership or merch for the deeper community path.",
        actions: [
          { text: "Stream hub", href: "index.html#stream", intent: "gaming" },
          { text: "Shop merch", href: "shop.html", intent: "shop" }
        ]
      },
      coachella: {
        label: "Coachella 2026",
        title: "Guide plus itinerary",
        body: "Use the master guide for the full landscape and the itinerary URL when you need the shareable schedule path.",
        actions: [
          { text: "Master guide", href: "coachella2026.html", intent: "coachella" },
          { text: "Itinerary", href: "coachella2026-itinerary.html", intent: "coachella" }
        ]
      },
      creatorOps: {
        label: "Creator systems",
        title: "Turn attention into owned infrastructure",
        body: "Princess Protocol frames the funnel: website, content studio, list building, membership, and brand voice.",
        actions: [
          { text: "Protocol", href: "princess-protocol.html", intent: "creatorTools" },
          { text: "Dashboard", href: "dashboard.html", intent: "events" }
        ]
      },
      innerCircle: {
        label: "Membership funnel",
        title: "Pick the right tier",
        body: "Choose the starter tier for support, or move higher for priority access, community perks, and closer touchpoints.",
        actions: [
          { text: "Compare tiers", href: "index.html#membership", intent: "membership" },
          { text: "Join Patreon", href: "https://patreon.com/lexilucks", intent: "membership" }
        ]
      }
    };
  }

  function activeRecommendation() {
    return recommendations()[state.segment] || recommendations().new;
  }

  function renderWidget() {
    if (document.querySelector(".llc-widget")) return;

    var widget = document.createElement("div");
    widget.className = "llc-widget";
    widget.innerHTML = [
      "<button class=\"llc-launcher\" type=\"button\" aria-label=\"Open Lexi concierge\">",
      "  <span class=\"llc-launcher-mark\">L</span>",
      "  <span class=\"llc-unread\" data-llc-unread>1</span>",
      "</button>",
      "<section class=\"llc-panel\" aria-label=\"Lexi concierge\" aria-live=\"polite\">",
      "  <header class=\"llc-header\">",
      "    <div class=\"llc-avatar\">L</div>",
      "    <div class=\"llc-title\"><strong>Lexi's Concierge 2.0</strong><span><i class=\"llc-live-dot\"></i><span data-llc-segment>Preview mode</span></span></div>",
      "    <button class=\"llc-close\" type=\"button\" aria-label=\"Close concierge\">&times;</button>",
      "  </header>",
      "  <div class=\"llc-messages\" data-llc-messages></div>",
      "  <div>",
      "    <article class=\"llc-reco\" data-llc-reco></article>",
      "    <div class=\"llc-capabilities\" data-llc-capabilities></div>",
      "    <div class=\"llc-quick\" data-llc-quick></div>",
      "    <form class=\"llc-form\" data-llc-form>",
      "      <input class=\"llc-input\" data-llc-input autocomplete=\"off\" placeholder=\"Ask for tiers, shop, events, or brand work\" />",
      "      <button class=\"llc-send\" type=\"submit\" aria-label=\"Send\">›</button>",
      "    </form>",
      "  </div>",
      "</section>"
    ].join("");
    document.body.appendChild(widget);

    widget.querySelector(".llc-launcher").addEventListener("click", open);
    widget.querySelector(".llc-close").addEventListener("click", close);
    widget.querySelector("[data-llc-form]").addEventListener("submit", function (event) {
      event.preventDefault();
      var input = widget.querySelector("[data-llc-input]");
      var value = input.value.trim();
      if (!value || state.thinking) return;
      input.value = "";
      handleMessage(value);
    });

    renderMessages();
    updateRecommendation();
    renderCapabilities();
    renderQuickReplies();
  }

  function segmentLabel() {
    var labels = {
      new: "New visitor",
      shopper: "Shop-curious",
      vipGuest: "Event-curious",
      brandPartner: "Brand partner",
      gamingFan: "Gaming fan",
      coachella: "Coachella mode",
      creatorOps: "Creator systems",
      innerCircle: "Membership-ready"
    };
    return labels[state.segment] || "Personalized";
  }

  function renderMessages() {
    var wrap = document.querySelector("[data-llc-messages]");
    if (!wrap) return;
    if (!profile.messages.length) {
      profile.messages.push({ role: "assistant", text: greeting(), at: nowIso() });
      saveProfile();
    }
    wrap.innerHTML = profile.messages.map(function (message) {
      var isUser = message.role === "user";
      return [
        "<div class=\"llc-message " + (isUser ? "is-user" : "is-assistant") + "\">",
        isUser ? "" : "<div class=\"llc-avatar\">L</div>",
        "<div class=\"llc-bubble\">" + escapeHtml(message.text) + "</div>",
        "</div>"
      ].join("");
    }).join("");
    wrap.scrollTop = wrap.scrollHeight;
  }

  function updateRecommendation() {
    var recoEl = document.querySelector("[data-llc-reco]");
    var segmentEl = document.querySelector("[data-llc-segment]");
    if (!recoEl) return;
    if (segmentEl) segmentEl.textContent = segmentLabel();

    var reco = activeRecommendation();
    recoEl.innerHTML = [
      "<div class=\"llc-reco-label\">Demo mode · " + escapeHtml(reco.label) + "</div>",
      "<div class=\"llc-reco-title\">" + escapeHtml(reco.title) + "</div>",
      "<div class=\"llc-reco-body\">" + escapeHtml(reco.body) + "</div>",
      "<div class=\"llc-actions\">",
      reco.actions.map(function (action) {
        return "<a class=\"llc-action\" href=\"" + escapeAttr(action.href) + "\" data-llc-intent=\"" + escapeAttr(action.intent) + "\">" + escapeHtml(action.text) + "</a>";
      }).join(""),
      "</div>"
    ].join("");

    recoEl.querySelectorAll("[data-llc-intent]").forEach(function (link) {
      link.addEventListener("click", function () {
        scoreIntent(link.getAttribute("data-llc-intent"), 4, { source: "concierge_cta", href: link.href });
      });
    });
  }

  function renderCapabilities() {
    var wrap = document.querySelector("[data-llc-capabilities]");
    if (!wrap) return;
    wrap.innerHTML = CAPABILITIES.map(function (capability) {
      return [
        "<button type=\"button\" class=\"llc-capability\" data-llc-capability=\"" + escapeAttr(capability.intent) + "\" data-llc-prompt=\"" + escapeAttr(capability.prompt) + "\">",
        "<span>" + escapeHtml(capability.label) + "</span>",
        "</button>"
      ].join("");
    }).join("");
    wrap.querySelectorAll("[data-llc-prompt]").forEach(function (button) {
      button.addEventListener("click", function () {
        scoreIntent(button.getAttribute("data-llc-capability"), 4, { source: "capability_card" });
        handleMessage(button.getAttribute("data-llc-prompt"));
      });
    });
  }

  function renderQuickReplies() {
    var quick = document.querySelector("[data-llc-quick]");
    if (!quick) return;
    var prompts = [
      "Find my best tier",
      "Show the shop path",
      "I am a brand",
      "Plan Coachella",
      "Community links"
    ];
    quick.innerHTML = prompts.map(function (prompt) {
      return "<button type=\"button\">" + escapeHtml(prompt) + "</button>";
    }).join("");
    quick.querySelectorAll("button").forEach(function (button) {
      button.addEventListener("click", function () {
        handleMessage(button.textContent);
      });
    });
  }

  function pushMessage(role, text) {
    profile.messages.push({ role: role, text: text, at: nowIso() });
    profile.messages = profile.messages.slice(-MAX_MESSAGES);
    saveProfile();
    renderMessages();
  }

  function handleMessage(text) {
    pushMessage("user", text);
    window.LexiAnalytics?.track(window.LexiAnalytics.EVENTS.AI_CONCIERGE_MESSAGE_SUBMIT, {
      segment: state.segment,
      prompt_length: text.length
    });
    var intent = classifyText(text);
    if (intent) scoreIntent(intent, 5, { source: "chat", text: text.slice(0, 90) });

    if (endpoint) {
      askBackend(text).then(function (reply) {
        pushMessage("assistant", reply || localReply(text));
      }).catch(function () {
        pushMessage("assistant", localReply(text));
      });
    } else {
      window.setTimeout(function () {
        pushMessage("assistant", localReply(text));
      }, 180);
    }
  }

  function classifyText(text) {
    return classifyClick({ innerText: text, getAttribute: function () { return ""; }, href: "" });
  }

  function localReply(text) {
    var t = text.toLowerCase();
    if (/reset memory/.test(t)) {
      localStorage.removeItem(STORAGE_KEY);
      profile = loadProfile();
      state.segment = "new";
      updateRecommendation();
      return "Memory reset. Fresh slate.";
    }
    if (/tier|patreon|member|join|subscription|princess|royalty|queen|best/.test(t)) {
      return "For fan perks, start with the easiest yes: Curiosity, Party Network, Fan, Supporter, VIP, or Inner Circle. The promise is realistic: members-first updates, community perks, behind-the-scenes drops, and priority invite consideration when events have room. 💕";
    }
    if (/shop|amazon|merch|store|product|gift/.test(t)) {
      return "Shop path: Amazon picks first, merch second, then membership if they want the real inner-circle layer. Cute, clear, no overthinking. ✨";
    }
    if (/brand|media|rate|ugc|collab|sponsor|booking|campaign|pitch/.test(t)) {
      return "For brand work, lead with the media kit, then the rate card. Lexi's positioning is selective and values-aligned: audience trust, LGBTQ+ community reach, gaming culture, and polished deliverables.";
    }
    if (/coachella|festival|itinerary|desert|activation/.test(t)) {
      return "Coachella mode: use the master guide for discovery, then the itinerary for the clean shareable schedule. Brand deliverables live near the bottom so the business side stays organized.";
    }
    if (/event|party|vip|waitlist|guest|status|rsvp/.test(t)) {
      return "For events, use the Party Network form first. This demo cannot confirm a real guest list rank yet, but it can route you to RSVP updates, style guidance, and the right community path. 🎉";
    }
    if (/privacy|data|track|memory|reset/.test(t)) {
      return "This MVP stores anonymous personalization in this browser only. Type reset memory if you want me to clear it.";
    }
    if (/discord|community|safe space|lgbt|transcend|advocacy|pride/.test(t)) {
      return "Community lane: center safe space, real conversations, and visibility. The language should feel proud and welcoming: we belong here, all are welcome, let's build this together.";
    }
    if (/twitch|kick|live|game|gaming|stream|discord/.test(t)) {
      return "Gaming lane: LIVE, chat, vibes, fam. Send people to the stream or Discord first, then merch or membership once they are part of the rhythm.";
    }
    return "Tell me which lane you care about: membership, shop, events, Coachella, gaming, community, or brand work. I will route you to the strongest next step. Thanks for being here. 💕";
  }

  function askBackend(text) {
    state.thinking = true;
    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        message: text,
        page: state.page,
        segment: state.segment,
        profile: {
          visits: profile.visits,
          pages: profile.pages,
          intents: profile.intents,
          variant: profile.variant
        },
        voiceGuide: VOICE_GUIDE,
        history: profile.messages.slice(-8)
      })
    }).then(function (response) {
      if (!response.ok) throw new Error("Concierge API failed");
      return response.json();
    }).then(function (data) {
      return data.reply || data.message || "";
    }).finally(function () {
      state.thinking = false;
    });
  }

  function open() {
    var widget = document.querySelector(".llc-widget");
    if (!widget) return;
    widget.classList.add("is-open");
    state.open = true;
    var unread = widget.querySelector("[data-llc-unread]");
    if (unread) unread.style.display = "none";
    scoreIntent(state.page.intent, 1, { source: "open_widget" });
    window.LexiAnalytics?.track(window.LexiAnalytics.EVENTS.AI_CONCIERGE_OPEN, {
      segment: state.segment,
      page: state.page.path,
      mode: endpoint ? "api" : "demo"
    });
    var input = widget.querySelector("[data-llc-input]");
    if (input) setTimeout(function () { input.focus(); }, 50);
  }

  function close() {
    var widget = document.querySelector(".llc-widget");
    if (widget) widget.classList.remove("is-open");
    state.open = false;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char];
    });
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }

  function boot() {
    endpoint = (window.LEXI_CONCIERGE_ENDPOINT || (document.currentScript && document.currentScript.dataset.apiEndpoint) || "").trim();
    bootAnalytics();
    state.segment = computeSegment();
    renderWidget();
    window.LexiConcierge = {
      open: open,
      close: close,
      track: scoreIntent,
      getProfile: function () { return JSON.parse(JSON.stringify(profile)); },
      reset: function () {
        localStorage.removeItem(STORAGE_KEY);
        profile = loadProfile();
        state.segment = "new";
        renderMessages();
        updateRecommendation();
      }
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
