/**
 * Analytics Utility for EcoCapture
 * 
 * NOTE: This is a placeholder implementation that stores events in localStorage.
 * Replace sendEvent() with an actual analytics provider (e.g. PostHog, Mixpanel)
 * when ready for production analytics.
 */

interface AnalyticsEvent {
  event: string;
  category: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
}

class Analytics {
  private userId: string | null = null;

  setUserId(userId: string) {
    this.userId = userId;
    if (import.meta.env.DEV) console.log('📊 Analytics user set:', userId);
  }

  track(event: string, properties?: Record<string, any>) {
    const eventData: AnalyticsEvent = {
      event,
      category: this.getCategoryFromEvent(event),
      properties,
      timestamp: Date.now(),
      userId: this.userId || undefined,
    };

    this.sendEvent(eventData);
  }

  private sendEvent(event: AnalyticsEvent) {
    if (import.meta.env.DEV) {
      console.log('📊 Analytics Event:', event);
    }
    this.storeEvent(event);
  }

  private storeEvent(event: AnalyticsEvent) {
    try {
      const stored = localStorage.getItem('analytics_events');
      const events = stored ? JSON.parse(stored) : [];
      events.push(event);
      
      if (events.length > 100) {
        events.shift();
      }
      
      localStorage.setItem('analytics_events', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to store analytics event:', error);
    }
  }

  private getCategoryFromEvent(event: string): string {
    if (event.startsWith('onboarding_')) return 'user_journey';
    return 'general';
  }
}

export const analytics = new Analytics();

export const ANALYTICS_EVENTS = {
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;
