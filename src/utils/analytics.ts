/**
 * Analytics Utility for EcoCapture
 * 
 * Tracks key events for user behavior analysis.
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

  trackUserJourney(event: string, properties?: Record<string, any>) {
    this.track(event, {
      ...properties,
      category: 'user_journey',
    });
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
    if (event.startsWith('analysis_')) return 'core_feature';
    if (event.startsWith('capture_')) return 'core_feature';
    if (event.startsWith('limit_')) return 'engagement';
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

  getStoredEvents(): AnalyticsEvent[] {
    try {
      const stored = localStorage.getItem('analytics_events');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  clearStoredEvents() {
    localStorage.removeItem('analytics_events');
  }
}

export const analytics = new Analytics();

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
