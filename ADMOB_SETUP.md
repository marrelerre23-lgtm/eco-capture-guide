# Google AdMob / AdSense Setup Guide

## Overview

EcoCapture supports monetization through ads. Since this is a web application, we use **Google AdSense** rather than AdMob (which is for mobile apps).

## Current Status

✅ Ad infrastructure implemented
✅ Analytics tracking integrated
✅ Test mode with simulated ads
⏳ Awaiting real AdSense configuration

## Setup Steps

### 1. Create Google AdSense Account

1. Visit [Google AdSense](https://www.google.com/adsense/)
2. Sign up with your Google account
3. Complete the application process
4. Wait for approval (can take a few days)

### 2. Get Your Publisher ID

Once approved:
1. Log into AdSense Dashboard
2. Go to **Account** → **Settings**
3. Copy your **Publisher ID** (format: `pub-XXXXXXXXXXXXXXXX`)

### 3. Create Ad Units

1. In AdSense Dashboard, go to **Ads** → **Ad units**
2. Create the following ad units:

   **Banner Ad Unit** (for Logbook/Overview pages)
   - Type: Display ads
   - Size: Responsive
   - Name: "EcoCapture Banner"
   - Copy the **Ad slot ID**

   **Interstitial Ad Unit** (for pre-analysis screen)
   - Type: In-article ads or Multiplex ads
   - Name: "EcoCapture Interstitial"
   - Copy the **Ad slot ID**

### 4. Configure in Code

Update `src/config/admob.ts`:

```typescript
export const ADMOB_CONFIG = {
  // ... existing config
  
  adSense: {
    publisherId: 'pub-XXXXXXXXXXXXXXXX', // Your Publisher ID
    
    adSlots: {
      banner: '1234567890', // Your Banner Ad slot
      interstitial: '0987654321', // Your Interstitial Ad slot
    },
  },
};
```

### 5. Add AdSense Script to HTML

The script is automatically loaded by the app when a Publisher ID is configured. However, you can also add it manually to `index.html`:

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=pub-XXXXXXXXXXXXXXXX"
     crossorigin="anonymous"></script>
```

### 6. Update Ad Components

Replace placeholder divs in:
- `src/components/AdDisplay.tsx` (interstitial ads)
- `src/components/BannerAd.tsx` (banner ads)

With real AdSense ad units:

```tsx
<ins className="adsbygoogle"
     style={{ display: 'block' }}
     data-ad-client="pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="1234567890"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

### 7. Test Ads

1. Enable test mode in development
2. Use AdSense's test mode to verify ad placement
3. Check analytics tracking in browser console

### 8. Rewarded Ads (Mobile Only)

For future mobile app development using React Native or similar:

1. Create AdMob account at [Google AdMob](https://admob.google.com/)
2. Create rewarded ad units
3. Integrate using appropriate SDK
4. Update `ADMOB_CONFIG.adUnits.rewarded` with real Ad Unit ID

## Analytics Integration

All ad events are automatically tracked:
- `ad_shown` - When an ad is displayed
- `ad_closed` - When user closes/completes ad
- `rewarded_ad_shown` - When rewarded ad starts
- `rewarded_ad_completed` - When rewarded ad finishes
- `rewarded_ad_failed` - When rewarded ad fails

View analytics in browser console or integrate with:
- Google Analytics 4
- Mixpanel
- Amplitude
- Custom analytics backend

## Testing

### Test Mode (Current)
- Simulated ads with countdown timers
- No real ad networks called
- Analytics tracking works

### Production Mode
- Real ads from AdSense
- Revenue tracking enabled
- Full analytics integration

## Important Notes

⚠️ **Never commit API keys to git** - Publisher IDs and Ad Slot IDs are publishable and safe to include in client code

⚠️ **AdSense Policy Compliance** - Ensure your app complies with AdSense policies:
- No click encouragement
- No ad placement manipulation
- Clear ad labels
- Proper spacing around ads

⚠️ **Performance** - Monitor page load times after adding ads. Use lazy loading if needed.

⚠️ **GDPR Compliance** - Cookie consent banner is already implemented. Make sure AdSense consent is properly configured.

## Revenue Optimization

1. **A/B Testing** - Test different ad placements
2. **Ad Density** - Balance user experience with monetization
3. **Premium Conversion** - Track which users upgrade after seeing ads
4. **Rewarded Ads** - Monitor completion rates and bonus claim rates

## Support

- [AdSense Help Center](https://support.google.com/adsense/)
- [AdSense Policies](https://support.google.com/adsense/answer/48182)
- [AdMob Documentation](https://developers.google.com/admob) (for future mobile app)

## Next Steps

1. ✅ Apply for Google AdSense account
2. ⏳ Wait for approval
3. ⏳ Create ad units
4. ⏳ Configure Publisher ID in code
5. ⏳ Test ads in production
6. ⏳ Monitor revenue and analytics
