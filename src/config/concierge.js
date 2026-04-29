/**
 * Lexi Concierge Frontend Configuration
 * Contains non-secret configuration variables for the frontend.
 */

window.CONCIERGE_CONFIG = {
  // Use environment variables injected at build time, or default fallbacks
  phoneNumber: "+1 (555) 123-4567", // Simulated ENV var: process.env.LEXI_PHONE_NUMBER
  assistantName: "Lexi Concierge",
  brandColors: {
    primary: "#FF0080",
    secondary: "#FF69B4"
  },
  onlyFansUrl: "https://www.onlyfans.com/tslollypopz"
};
