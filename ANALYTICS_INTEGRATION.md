# Analytics Integration Guide

## Overview

EcoCapture has a comprehensive analytics system for tracking user behavior, monetization events, and app performance.

## Current Implementation

✅ Analytics utility created (`src/utils/analytics.ts`)
✅ Event tracking in all ad components
✅ Local storage for debugging
✅ Ready for external analytics providers

## Tracked Events

### Core Features
- `analysis_started` - User initiates AI analysis
- `analysis_completed` - Analysis finishes successfully
- `analysis_failed` - Analysis errors
- `analysis_cached` - Cached result used
- `capture_created` - New capture saved
- `capture_deleted` - Capture removed
- `capture_favorited` - Capture marked as favorite

### Monetization
- `limit_reached_analysis` - Daily analysis limit hit
- `limit_reached_capture` - Storage limit hit
- `upgrade_dialog_shown` - Premium dialog displayed
- `upgrade_clicked` - User clicks upgrade button
- `premium_checkout_started` - Stripe checkout initiated
- `premium_purchased` - Subscription completed
- `subscription_cancelled` - User cancels premium

### Advertising
- `ad_shown` - Ad displayed to user
- `ad_closed` - User closes/completes ad
- `ad_clicked` - User clicks on ad
- `rewarded_ad_shown` - Rewarded ad starts
- `rewarded_ad_completed` - Rewarded ad finishes
- `rewarded_ad_failed` - Rewarded ad fails

### User Journey
- `onboarding_started` - First-time user flow begins
- `onboarding_completed` - User completes onboarding
- `app_installed` - PWA installed
- `user_signup` - New account created
- `user_login` - User logs in

## Integration Options

### Option 1: Google Analytics 4 (Recommended)

**Setup:**
1. Create GA4 property at [analytics.google.com](https://analytics.google.com/)
2. Get Measurement ID (format: `G-XXXXXXXXXX`)
3. Add to `index.html`:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

4. Update `src/utils/analytics.ts`:

```typescript
private sendEvent(event: AnalyticsEvent) {
  // Send to Google Analytics
  if (window.gtag) {
    window.gtag('event', event.event, {
      event_category: event.category,
      ...event.properties,
      user_id: event.userId,
    });
  }
  
  // Existing code...
}
```

5. Add type definitions in `src/vite-env.d.ts`:

```typescript
interface Window {
  gtag: (...args: any[]) => void;
}
```

### Option 2: Mixpanel

**Setup:**
1. Create account at [mixpanel.com](https://mixpanel.com/)
2. Get Project Token
3. Install SDK: `npm install mixpanel-browser`
4. Initialize in `src/main.tsx`:

```typescript
import mixpanel from 'mixpanel-browser';

mixpanel.init('YOUR_PROJECT_TOKEN', {
  debug: process.env.NODE_ENV === 'development',
});
```

5. Update `src/utils/analytics.ts`:

```typescript
import mixpanel from 'mixpanel-browser';

private sendEvent(event: AnalyticsEvent) {
  mixpanel.track(event.event, {
    category: event.category,
    ...event.properties,
  });
  
  // Existing code...
}
```

### Option 3: Amplitude

**Setup:**
1. Create account at [amplitude.com](https://amplitude.com/)
2. Get API Key
3. Install SDK: `npm install @amplitude/analytics-browser`
4. Initialize and track similar to Mixpanel

### Option 4: Custom Backend

Send events to your own backend:

```typescript
private async sendEvent(event: AnalyticsEvent) {
  try {
    await fetch('https://your-api.com/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.error('Analytics error:', error);
  }
}
```

## Usage in Code

### Basic Event Tracking

```typescript
import { analytics, ANALYTICS_EVENTS } from '@/utils/analytics';

// Track simple event
analytics.track(ANALYTICS_EVENTS.CAPTURE_CREATED);

// Track with properties
analytics.track(ANALYTICS_EVENTS.ANALYSIS_COMPLETED, {
  category: 'svampar',
  confidence: 0.95,
  duration_ms: 2500,
});
```

### Specialized Tracking

```typescript
// Monetization events
analytics.trackMonetization(ANALYTICS_EVENTS.PREMIUM_PURCHASED, {
  plan: 'yearly',
  amount: 950,
  currency: 'SEK',
});

// Ad events
analytics.trackAd(ANALYTICS_EVENTS.AD_SHOWN, 'banner', {
  position: 'bottom',
  page: 'logbook',
});

// User journey
analytics.trackUserJourney(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, {
  duration_seconds: 45,
  steps_completed: 3,
});
```

### User Identification

```typescript
// Set user ID when user logs in
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  analytics.setUserId(user.id);
}
```

## Key Metrics to Monitor

### Monetization Funnel
1. Free users hitting limits
2. Upgrade dialog shown
3. Upgrade clicked
4. Checkout started
5. Premium purchased

**Conversion Rate** = (Premium Purchased / Upgrade Dialog Shown) × 100

### Ad Performance
1. Ad impressions
2. Ad completions
3. Rewarded ad completions
4. Bonus claims

**Completion Rate** = (Ad Completions / Ad Shown) × 100

### User Engagement
1. Daily active users
2. Average analyses per user
3. Average captures per user
4. Retention rate (7-day, 30-day)

### Feature Usage
1. Most analyzed categories
2. Most captured species
3. Feature adoption rates
4. Error rates

## Debugging

### View Stored Events

```typescript
import { analytics } from '@/utils/analytics';

// Get all stored events
const events = analytics.getStoredEvents();
console.table(events);

// Clear stored events
analytics.clearStoredEvents();
```

### Browser Console

All events are logged to console in development mode:
```
📊 Analytics Event: {
  event: 'analysis_completed',
  category: 'core_feature',
  properties: { ... },
  timestamp: 1699999999999,
  userId: 'user-123'
}
```

## Privacy & GDPR

✅ Cookie consent banner implemented
✅ Users can decline analytics cookies
✅ No personal data tracked without consent
✅ User IDs are pseudonymous

Make sure to:
1. Update Privacy Policy with analytics disclosure
2. Allow users to opt-out
3. Anonymize IP addresses (GA4 setting)
4. Set data retention period (e.g., 14 months)

## Performance

Analytics is designed to be lightweight:
- Events queued until initialization
- Non-blocking async operations
- No impact on critical user flows
- Automatic batching (provider-dependent)

## Best Practices

1. **Event Naming** - Use predefined constants from `ANALYTICS_EVENTS`
2. **Property Consistency** - Always use same property names
3. **Error Handling** - Track failures, not just successes
4. **User Context** - Include relevant user properties
5. **Testing** - Verify events in dev before production

## Troubleshooting

### Events Not Showing in Dashboard

1. Check console for errors
2. Verify analytics initialized: `analytics.isInitialized`
3. Check provider configuration
4. Test with predefined test events

### Duplicate Events

1. Remove React StrictMode double-rendering
2. Check for multiple component mounts
3. Add event deduplication logic if needed

## Next Steps

1. ✅ Choose analytics provider (GA4 recommended)
2. ⏳ Create account and get credentials
3. ⏳ Integrate provider SDK
4. ⏳ Test event tracking
5. ⏳ Set up dashboards and reports
6. ⏳ Configure alerts for key metrics
