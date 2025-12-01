/**
 * Analytics Utility for EcoCapture
 * 
 * Tracks key events for monetization optimization and user behavior analysis.
 * Can be integrated with Google Analytics, Mixpanel, or custom analytics.
 */

interface AnalyticsEvent {
  event: string;
  category: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
}

class Analytics {
  private queue: AnalyticsEvent[] = [];
  private userId: string | null = null;
  private isInitialized = false;

  /**
   * Initialize analytics with user ID
   */
  init(userId?: string) {
    this.userId = userId || null;
    this.isInitialized = true;
    console.log('📊 Analytics initialized', { userId: this.userId });
    
    // Flush any queued events
    this.flushQueue();
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string) {
    this.userId = userId;
    console.log('📊 Analytics user set:', userId);
  }

  /**
   * Track an event
   */
  track(event: string, properties?: Record<string, any>) {
    const eventData: AnalyticsEvent = {
      event,
      category: this.getCategoryFromEvent(event),
      properties,
      timestamp: Date.now(),
      userId: this.userId || undefined,
    };

    // Queue event if not initialized
    if (!this.isInitialized) {
      this.queue.push(eventData);
      return;
    }

    this.sendEvent(eventData);
  }

  /**
   * Track monetization events
   */
  trackMonetization(event: string, properties?: Record<string, any>) {
    this.track(event, {
      ...properties,
      category: 'monetization',
    });
  }

  /**
   * Track ad events
   */
  trackAd(event: string, adType: 'banner' | 'interstitial' | 'rewarded', properties?: Record<string, any>) {
    this.track(event, {
      ...properties,
      adType,
      category: 'advertising',
    });
  }

  /**
   * Track user journey events
   */
  trackUserJourney(event: string, properties?: Record<string, any>) {
    this.track(event, {
      ...properties,
      category: 'user_journey',
    });
  }

  /**
   * Send event to analytics provider
   */
  private sendEvent(event: AnalyticsEvent) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event);
    }

    // Analytics provider integration ready for Phase 2
    // Store in localStorage for debugging
    this.storeEvent(event);
  }

  /**
   * Store event in localStorage for debugging
   */
  private storeEvent(event: AnalyticsEvent) {
    try {
      const stored = localStorage.getItem('analytics_events');
      const events = stored ? JSON.parse(stored) : [];
      events.push(event);
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.shift();
      }
      
      localStorage.setItem('analytics_events', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to store analytics event:', error);
    }
  }

  /**
   * Get category from event name
   */
  private getCategoryFromEvent(event: string): string {
    if (event.startsWith('ad_')) return 'advertising';
    if (event.startsWith('premium_') || event.startsWith('upgrade_')) return 'monetization';
    if (event.startsWith('analysis_')) return 'core_feature';
    if (event.startsWith('capture_')) return 'core_feature';
    if (event.startsWith('limit_')) return 'engagement';
    return 'general';
  }

  /**
   * Flush queued events
   */
  private flushQueue() {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) {
        this.sendEvent(event);
      }
    }
  }

  /**
   * Get stored events (for debugging)
   */
  getStoredEvents(): AnalyticsEvent[] {
    try {
      const stored = localStorage.getItem('analytics_events');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear stored events
   */
  clearStoredEvents() {
    localStorage.removeItem('analytics_events');
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Predefined event names for consistency
export const ANALYTICS_EVENTS = {
  // Analysis events
  ANALYSIS_STARTED: 'analysis_started',
  ANALYSIS_COMPLETED: 'analysis_completed',
  ANALYSIS_FAILED: 'analysis_failed',
  ANALYSIS_CACHED: 'analysis_cached',
  
  // Limit events
  LIMIT_REACHED_ANALYSIS: 'limit_reached_analysis',
  LIMIT_REACHED_CAPTURE: 'limit_reached_capture',
  LIMIT_WARNING_SHOWN: 'limit_warning_shown',
  
  // Ad events
  AD_SHOWN: 'ad_shown',
  AD_CLICKED: 'ad_clicked',
  AD_CLOSED: 'ad_closed',
  AD_FAILED: 'ad_failed',
  REWARDED_AD_SHOWN: 'rewarded_ad_shown',
  REWARDED_AD_COMPLETED: 'rewarded_ad_completed',
  REWARDED_AD_FAILED: 'rewarded_ad_failed',
  
  // Upgrade/Premium events
  UPGRADE_DIALOG_SHOWN: 'upgrade_dialog_shown',
  UPGRADE_CLICKED: 'upgrade_clicked',
  PREMIUM_CHECKOUT_STARTED: 'premium_checkout_started',
  PREMIUM_PURCHASED: 'premium_purchased',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  
  // Capture events
  CAPTURE_CREATED: 'capture_created',
  CAPTURE_DELETED: 'capture_deleted',
  CAPTURE_FAVORITED: 'capture_favorited',
  
  // User journey
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  APP_INSTALLED: 'app_installed',
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
} as const;
