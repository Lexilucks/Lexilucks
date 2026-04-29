/**
 * Lexi Concierge Calendly Configuration
 * Exposes the Calendly links from environment variables.
 */

export const CALENDLY_LINKS = {
  voice10: process.env.CALENDLY_VOICE_10_LINK || 'https://calendly.com/demo/voice-10min',
  video20: process.env.CALENDLY_VIDEO_20_LINK || 'https://calendly.com/demo/video-20min',
  vip: process.env.CALENDLY_VIP_LINK || 'https://calendly.com/demo/vip-experience'
};

export function getSchedulingLink(packageType) {
  return CALENDLY_LINKS[packageType] || null;
}
