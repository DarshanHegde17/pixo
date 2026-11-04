import { Platform, BackHandler } from 'react-native';

/**
 * PIXO Centralized Global Navigation Service
 * 
 * Handles back navigation across:
 * 1. Mobile browsers (Chrome, Safari, Firefox) via popstate
 * 2. Desktop browsers via browser Back button and history
 * 3. Android APK via hardware BackHandler
 * 4. In-app PIXO Back Arrow buttons
 * 
 * Rules:
 * - Exactly one step backward per action.
 * - Layered priority handling:
 *     1. Confirmation popups (priority: 100)
 *     2. Active gameplay pause menu (priority: 80)
 *     3. Modals and overlays (priority: 50)
 *     4. Internal page history (priority: 10)
 *     5. Root Dashboard exit confirmation (priority: 0)
 * - State preservation across backward and forward transitions.
 * - Prevents duplicate entries and navigation loops.
 */
class NavigationServiceSingleton {
  constructor() {
    this.history = [{ id: 'home', title: 'Dashboard', params: {} }];
    this.handlers = []; // { id, handler: () => boolean, priority: number }
    this.subscribers = new Set();
    this.exitSubscribers = new Set();
    this.isHandlingPopState = false;
    this.isInitialized = false;

    this.init();
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Android Native Hardware Back Handler
    if (Platform.OS === 'android') {
      try {
        BackHandler.addEventListener('hardwareBackPress', () => {
          return this.goBack(false);
        });
      } catch (err) {
        console.warn('[NavigationService] Failed to bind Android BackHandler:', err);
      }
    }

    // 2. Mobile Browser and Desktop Browser PopState Handler
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history) {
      try {
        // Initial state entry
        if (!window.history.state || !window.history.state.pixoRoute) {
          window.history.replaceState(
            { pixoRoute: 'home', depth: 1, timestamp: Date.now() },
            '',
            window.location.pathname + window.location.search
          );
        }

        window.addEventListener('popstate', (event) => {
          this.handleBrowserPopState(event);
        });
      } catch (err) {
        console.warn('[NavigationService] Failed to bind Web popstate:', err);
      }
    }
  }

  // Handle browser native Back button (or forward button)
  handleBrowserPopState(event) {
    if (this.isHandlingPopState) return;

    this.isHandlingPopState = true;
    try {
      const state = event.state;

      // Check if any registered back interceptor (pause menu, modal, confirmation) consumes this
      const intercepted = this.executeTopBackHandler();
      if (intercepted) {
        // Re-push state so browser history index doesn't drift away from internal app state
        const currentRoute = this.getCurrentRoute();
        window.history.pushState(
          { pixoRoute: currentRoute.id, depth: this.history.length, timestamp: Date.now() },
          '',
          window.location.pathname + (currentRoute.id === 'home' ? '' : `#${currentRoute.id}`)
        );
        return;
      }

      // If user navigated backward in history
      if (this.history.length > 1) {
        this.history.pop();
        const prev = this.history[this.history.length - 1];
        this.notifySubscribers(prev);
      } else {
        // On root dashboard: re-push root state and show exit confirmation popup
        window.history.pushState(
          { pixoRoute: 'home', depth: 1, timestamp: Date.now() },
          '',
          window.location.pathname
        );
        this.triggerExitConfirmation();
      }
    } finally {
      this.isHandlingPopState = false;
    }
  }

  /**
   * Register a high-priority back interceptor (e.g. Pause Menu, Modal Close, Exit Dialog)
   * @param {string} id Unique identifier for the handler
   * @param {function} handler Function returning true if it consumed the back action
   * @param {number} priority Higher numbers execute first (e.g., 100: dialog, 80: pause, 50: modal)
   */
  registerBackHandler(id, handler, priority = 50) {
    // Remove any existing handler with same id
    this.handlers = this.handlers.filter((h) => h.id !== id);
    this.handlers.push({ id, handler, priority });
    // Sort descending by priority
    this.handlers.sort((a, b) => b.priority - a.priority);

    return () => this.unregisterBackHandler(id);
  }

  /**
   * Unregister a back handler
   */
  unregisterBackHandler(id) {
    this.handlers = this.handlers.filter((h) => h.id !== id);
  }

  /**
   * Execute the top-most registered back handler (if any returns true)
   */
  executeTopBackHandler() {
    for (const item of this.handlers) {
      try {
        const handled = item.handler();
        if (handled) {
          return true;
        }
      } catch (err) {
        console.warn(`[NavigationService] Handler ${item.id} threw error:`, err);
      }
    }
    return false;
  }

  /**
   * Navigate forward to a new internal route
   * @param {string} routeId Route identifier (e.g., 'home', 'games', 'quests', 'store', 'profile')
   * @param {object} params Optional parameters
   */
  navigate(routeId, params = {}) {
    if (!routeId) return;

    const current = this.getCurrentRoute();
    // Prevent duplicate consecutive entries
    if (current && current.id === routeId) {
      if (JSON.stringify(current.params) === JSON.stringify(params)) {
        return;
      }
    }

    const newEntry = {
      id: routeId,
      title: this.getRouteTitle(routeId),
      params: params || {},
      timestamp: Date.now(),
    };

    // If navigating to root dashboard, reset history stack to clean ['home']
    if (routeId === 'home') {
      this.history = [newEntry];
    } else {
      // Avoid looping: if route already exists in recent history, trim up to that point
      const existingIdx = this.history.findIndex((item) => item.id === routeId);
      if (existingIdx !== -1 && existingIdx !== this.history.length - 1) {
        // Re-focus existing history slice
        this.history = this.history.slice(0, existingIdx + 1);
        this.history[existingIdx].params = params;
      } else {
        this.history.push(newEntry);
      }
    }

    // Update browser history on Web
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history && !this.isHandlingPopState) {
      try {
        const hash = routeId === 'home' ? '' : `#${routeId}`;
        window.history.pushState(
          { pixoRoute: routeId, depth: this.history.length, timestamp: Date.now() },
          '',
          window.location.pathname + hash
        );
      } catch (e) {
        console.warn('[NavigationService] pushState failed:', e);
      }
    }

    this.notifySubscribers(this.getCurrentRoute());
  }

  /**
   * Replace the current route in history without pushing
   */
  replace(routeId, params = {}) {
    if (!routeId) return;

    const newEntry = {
      id: routeId,
      title: this.getRouteTitle(routeId),
      params: params || {},
      timestamp: Date.now(),
    };

    if (this.history.length > 0) {
      this.history[this.history.length - 1] = newEntry;
    } else {
      this.history.push(newEntry);
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history && !this.isHandlingPopState) {
      try {
        const hash = routeId === 'home' ? '' : `#${routeId}`;
        window.history.replaceState(
          { pixoRoute: routeId, depth: this.history.length, timestamp: Date.now() },
          '',
          window.location.pathname + hash
        );
      } catch (e) {
        console.warn('[NavigationService] replaceState failed:', e);
      }
    }

    this.notifySubscribers(newEntry);
  }

  /**
   * Unified Global Go-Back Action
   * Used by:
   * 1. PIXO's visible Back Arrow on every page
   * 2. Android hardware Back button
   * 3. Browser native Back button
   * 
   * Order of execution:
   * 1. Check registered modal / pause interceptors
   * 2. If no interceptor consumed it, pop one step backward in internal history
   * 3. If on Dashboard (history length <= 1), trigger exit confirmation
   * 
   * @param {boolean} fromBrowserPop Whether triggered by native popstate event
   * @returns {boolean} True if navigation/back was handled
   */
  goBack(fromBrowserPop = false) {
    // 1. First check if any registered interceptor (confirmation, pause menu, modal) handles this
    const intercepted = this.executeTopBackHandler();
    if (intercepted) {
      return true;
    }

    // 2. If inside an internal page and history depth > 1
    if (this.history.length > 1) {
      this.history.pop();
      const previousRoute = this.history[this.history.length - 1];

      // Sync browser history if this call was initiated by in-app Back button or Android BackHandler
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history && !fromBrowserPop) {
        try {
          const hash = previousRoute.id === 'home' ? '' : `#${previousRoute.id}`;
          window.history.replaceState(
            { pixoRoute: previousRoute.id, depth: this.history.length, timestamp: Date.now() },
            '',
            window.location.pathname + hash
          );
        } catch (e) {
          console.warn('[NavigationService] sync state failed:', e);
        }
      }

      this.notifySubscribers(previousRoute);
      return true;
    }

    // 3. At root Dashboard: prompt application exit confirmation
    this.triggerExitConfirmation();
    return true; // Return true to tell Android BackHandler not to abruptly kill process
  }

  /**
   * Trigger root dashboard exit confirmation popup
   */
  triggerExitConfirmation() {
    for (const listener of this.exitSubscribers) {
      try {
        listener();
      } catch (err) {
        console.warn('[NavigationService] exit listener error:', err);
      }
    }
  }

  /**
   * Actually exit the application (called when user confirms Exit on Android)
   */
  exitApp() {
    if (Platform.OS === 'android') {
      try {
        BackHandler.exitApp();
      } catch (err) {
        console.warn('[NavigationService] BackHandler.exitApp() failed:', err);
      }
    } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // In web browser, cannot force close window if not opened by script; prompt friendly message
      alert('Thank you for playing PIXO! You may close this browser tab.');
    }
  }

  /**
   * Subscribe to route changes
   * @param {function} callback Called with current route on navigation
   * @returns {function} Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Subscribe to root dashboard exit requests
   * @param {function} callback Called when user presses Back on root Dashboard
   * @returns {function} Unsubscribe function
   */
  onExitRequest(callback) {
    this.exitSubscribers.add(callback);
    return () => {
      this.exitSubscribers.delete(callback);
    };
  }

  notifySubscribers(currentRoute) {
    for (const callback of this.subscribers) {
      try {
        callback(currentRoute, this.history);
      } catch (err) {
        console.warn('[NavigationService] subscriber error:', err);
      }
    }
  }

  getCurrentRoute() {
    return this.history[this.history.length - 1] || { id: 'home', title: 'Dashboard', params: {} };
  }

  getHistoryDepth() {
    return this.history.length;
  }

  getPreviousRoute() {
    if (this.history.length > 1) {
      return this.history[this.history.length - 2];
    }
    return null;
  }

  canGoBack() {
    return this.history.length > 1;
  }

  getRouteTitle(routeId) {
    switch (routeId) {
      case 'home':
        return 'Dashboard';
      case 'games':
        return 'All Games Vault';
      case 'quests':
        return 'Daily Quests';
      case 'store':
        return 'Rewards & Coin Store';
      case 'profile':
        return 'Player Profile';
      case 'target_number':
        return 'Target Number';
      case 'logic_code':
        return 'Cyber Strike: Logic Code';
      default:
        return 'PIXO';
    }
  }
}

export const NavigationService = new NavigationServiceSingleton();
export default NavigationService;
