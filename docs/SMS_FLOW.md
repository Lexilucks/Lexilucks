# Lexi Concierge SMS Flow

This document maps out the user journey for the SMS system.

## State Machine
```
[new] 
  → (user texts keyword) 
  → [menu_sent] 
  → (user selects package #) 
  → [package_selected] 
  → (system sends checkout link) 
  → [checkout_sent]
  → (user pays on Stripe)
  → [paid] (webhook trigger)
  → (system sends scheduling link for voice/video)
  → [scheduling_sent]
  → (user schedules or no-op)
  → [scheduled/completed]
```

## System Responses

1. **Initial Text**: When a fan texts a keyword like `ACCESS`, the system responds with the Menu and transitions the state to `menu_sent`.
2. **Selection**: Fan replies with `1` through `8`. System transitions state to `package_selected`, then responds with the appropriate Stripe checkout link and moves to `checkout_sent`.
3. **Payment**: Processed silently via Stripe webhooks. State moves to `paid`.
4. **Post-Payment**: Depending on the package, the system automatically sends a scheduling link or confirmation. State moves to `scheduling_sent` or `completed`.
