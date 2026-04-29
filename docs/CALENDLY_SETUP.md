# Calendly Setup Guide

This guide details how to set up Calendly to handle scheduling for Lexi's voice, video, and VIP requests.

## 1. Create Calendly Event Types

1. Log in to [Calendly](https://calendly.com).
2. Create **three separate Event Types**:
   - **10-Min Voice Call**
   - **20-Min Video Call**
   - **VIP Experience Review**
3. Configure each event type:
   - **Location**: Set to "Phone call" or "Zoom/Google Meet" depending on the package.
   - **Availability**: Set specific blocks of time Lexi is available to take calls (e.g., Fridays 2-4 PM).
   - **Invitee Questions**: Ask for their phone number (required) to match against the Supabase request.
4. **Important**: Mark these event types as **Hidden** so they do not appear on the main Calendly landing page. Only fans with the direct link should be able to book.

## 2. Configure Environment Variables

Once the event types are created, copy their shareable links and add them to your `.env.local` file:

```
CALENDLY_VOICE_10_LINK=https://calendly.com/your-username/voice-10min
CALENDLY_VIDEO_20_LINK=https://calendly.com/your-username/video-20min
CALENDLY_VIP_LINK=https://calendly.com/your-username/vip-experience
```

## 3. How the Integration Works

When a fan successfully pays for a `voice10`, `video20`, or `vip` package via Stripe, the Stripe Webhook (`api/stripe/webhook.js`) will detect the payment. 

The system will then call the `send-scheduling-link.js` helper, which fetches the correct Calendly link from `src/config/calendly-config.js` and texts it directly to the fan.
