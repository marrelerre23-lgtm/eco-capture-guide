/**
 * Analytics Utility for EcoCapture
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

  init(userId?: string) {
    this.userId = userId || null;
    this.isInitialized = true;
    console.log('📊 Analytics initialized', { userId: this.userId });
    this.flushQueue();
  }

  setUserId(userId: string) {
    this.userId = userId;
    console.log('📊 Analytics user set:', userId);
  }

  track(event: string, properties?: Record<string, any>) {
    const eventData: AnalyticsEvent = {
      event,
      category: this.getCategoryFromEvent(event),
      properties,
      timestamp: Date.now(),
      userId: this.userId || undefined,
    };

    if (!this.isInitialized) {
      this.queue.push(eventData);
      return;
    }

    this.sendEvent(eventData);
  }

  private sendEvent(event: AnalyticsEvent) {
    if (process.env.NODE_ENV === 'development') {
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

  private flushQueue() {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) {
        this.sendEvent(event);
      }
    }
  }
}

export const analytics = new Analytics();

export const ANALYTICS_EVENTS = {
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;
