import { useState, useEffect, useCallback } from 'react';
import { Platform, BackHandler } from 'react-native';

/**
 * PIXO Centralized Global Navigation Service
 * 
 * Provides robust, professional navigation management across:
 * 1. Mobile browsers (Chrome, Safari, Firefox, Samsung Internet) via popstate
 * 2. Desktop browsers via browser Back and Forward buttons
 * 3. Installed Android applications (APK) via hardware BackHandler
 * 4. In-app visible PIXO Back Arrow on every page/subpage
 * 
 * Guarantees:
 * - ONE BACK PRESS = ONE PAGE BACK.
 * - Every internal page navigation creates a valid history entry.
 * - Supports navigate(-1) and React Router useNavigate / useLocation hooks.
 * - Prevents accidental website exits while previous internal PIXO pages exist.
 * - Tactical Pause Menu interception for active gameplay.
 * - Zero infinite traps, zero duplicate entries, zero unexpected full-page reloads.
 */
class NavigationServiceSingleton {
  constructor() {
    this.history = [{ id: 'home', title: 'Dashboard', params: {}, index: 0, path: '/#home' }];
    this.currentIndex = 0;
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

    // 1. Android Native Hardware Back Handler (Single dedicated listener)
    if (Platform.OS === 'android') {
      try {
        BackHandler.addEventListener('hardwareBackPress', () => {
          return this.goBack(false);
        });
      } catch (err) {
        console.warn('[NavigationService] Android BackHandler listener registration warning:', err);
      }
    }

    // 2. Mobile Browser and Desktop Browser PopState Handler
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history) {
      try {
        // Inspect initial hash or URL path
        const rawHash = (window.location.hash || '').replace('#', '').trim();
        const initialRoute = this.isValidRoute(rawHash) ? rawHash : 'home';

        // Check if an existing PIXO session state exists in browser history
        if (!window.history.state || typeof window.history.state.pixoIndex !== 'number') {
          // Replace initial state with index 0 without destroying browser referrer
          window.history.replaceState(
            { pixoRoute: initialRoute, pixoIndex: 0, app: 'pixo' },
            this.getRouteTitle(initialRoute),
            window.location.pathname + (initialRoute === 'home' ? '' : `#${initialRoute}`)
          );
        }

        this.history = [
          {
            id: initialRoute,
            title: this.getRouteTitle(initialRoute),
            params: {},
            index: 0,
            path: `/#${initialRoute}`,
          },
        ];
        this.currentIndex = 0;

        window.addEventListener('popstate', (event) => {
          this.handleBrowserPopState(event);
        });
      } catch (err) {
        console.warn('[NavigationService] Web popstate listener registration warning:', err);
      }
    }
  }

  isValidRoute(routeId) {
    const valid = [
      'home',
      'games',
      'quests',
      'store',
      'profile',
      'target_number',
      'target_level_select',
      'target_gameplay',
      'cyber_strike',
      'cyber_strike_levels',
      'cyber_strike_gameplay',
      'game_details',
    ];
    return valid.includes(routeId);
  }

  // Handle browser native Back button or forward gesture
  handleBrowserPopState(event) {
    if (this.isHandlingPopState) return;

    this.isHandlingPopState = true;
    try {
      const state = event.state;

      // 1. Check if any active modal, pause menu, or confirmation dialog consumes this Back press
      const intercepted = this.executeTopBackHandler();
      if (intercepted) {
        // Because the mobile browser has already physically popped its URL,
        // re-push the current route so that the browser pointer stays matched to the app state
        const currentRoute = this.getCurrentRoute();
        const hash = currentRoute.id === 'home' ? '' : `#${currentRoute.id}`;
        window.history.pushState(
          {
            pixoRoute: currentRoute.id,
            pixoIndex: this.currentIndex,
            params: currentRoute.params,
            app: 'pixo',
          },
          currentRoute.title,
          window.location.pathname + hash
        );
        return;
      }

      // 2. User navigated via browser Back or Forward between internal PIXO pages
      if (state && state.app === 'pixo' && typeof state.pixoIndex === 'number') {
        const targetIndex = state.pixoIndex;
        const targetRoute = state.pixoRoute || 'home';
        const targetParams = state.params || {};

        this.currentIndex = targetIndex;
        if (targetIndex < this.history.length) {
          this.history = this.history.slice(0, targetIndex + 1);
        } else {
          this.history.push({
            id: targetRoute,
            title: this.getRouteTitle(targetRoute),
            params: targetParams,
            index: targetIndex,
            path: `/#${targetRoute}`,
          });
        }

        this.notifySubscribers(this.getCurrentRoute());
        return;
      }

      // 3. Popped to an entry where state.pixoIndex is not set, but internal history has previous pages
      if (this.currentIndex > 0 && this.history.length > 1) {
        this.currentIndex--;
        this.history.pop();
        const prev = this.history[this.history.length - 1];
        
        // Re-sync browser state
        const hash = prev.id === 'home' ? '' : `#${prev.id}`;
        window.history.replaceState(
          {
            pixoRoute: prev.id,
            pixoIndex: this.currentIndex,
            params: prev.params,
            app: 'pixo',
          },
          prev.title,
          window.location.pathname + hash
        );

        this.notifySubscribers(prev);
        return;
      }

      // 4. On root Dashboard and there is NO previous internal PIXO page!
      // Prevent accidental exit by re-pushing root state and displaying exit confirmation dialog
      window.history.pushState(
        { pixoRoute: 'home', pixoIndex: 0, app: 'pixo' },
        'Dashboard',
        window.location.pathname
      );
      this.triggerExitConfirmation();
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
    this.handlers = this.handlers.filter((h) => h.id !== id);
    this.handlers.push({ id, handler, priority });
    this.handlers.sort((a, b) => b.priority - a.priority);

    return () => this.unregisterBackHandler(id);
  }

  unregisterBackHandler(id) {
    this.handlers = this.handlers.filter((h) => h.id !== id);
  }

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
   * Navigate forward to a new internal route or backward via navigate(-1)
   * Compatible with React Router's navigate(to, options) signature
   */
  navigate(to, paramsOrOptions = {}) {
    // Support navigate(-1)
    if (typeof to === 'number') {
      if (to === -1) {
        return this.goBack(false);
      }
      return;
    }

    const routeId = to;
    if (!routeId) return;

    const params = paramsOrOptions?.state || paramsOrOptions?.params || paramsOrOptions || {};

    const current = this.getCurrentRoute();
    // Prevent duplicate consecutive entries
    if (current && current.id === routeId) {
      if (JSON.stringify(current.params) === JSON.stringify(params)) {
        return;
      }
    }

    // Slice forward history if navigating from an earlier index in stack
    this.currentIndex++;
    if (this.currentIndex <= this.history.length) {
      this.history = this.history.slice(0, this.currentIndex);
    }

    const newEntry = {
      id: routeId,
      title: this.getRouteTitle(routeId),
      params: params || {},
      index: this.currentIndex,
      path: `/#${routeId}`,
      timestamp: Date.now(),
    };

    this.history.push(newEntry);

    // Push valid history entry to browser
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history && !this.isHandlingPopState) {
      try {
        const hash = routeId === 'home' ? '' : `#${routeId}`;
        window.history.pushState(
          {
            pixoRoute: routeId,
            pixoIndex: this.currentIndex,
            params,
            app: 'pixo',
          },
          newEntry.title,
          window.location.pathname + hash
        );
      } catch (e) {
        console.warn('[NavigationService] pushState failed:', e);
      }
    }

    this.notifySubscribers(newEntry);
  }

  /**
   * Replace the current route in history without pushing a new entry
   */
  replace(routeId, params = {}) {
    if (!routeId) return;

    const newEntry = {
      id: routeId,
      title: this.getRouteTitle(routeId),
      params: params || {},
      index: this.currentIndex,
      path: `/#${routeId}`,
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
          {
            pixoRoute: routeId,
            pixoIndex: this.currentIndex,
            params,
            app: 'pixo',
          },
          newEntry.title,
          window.location.pathname + hash
        );
      } catch (e) {
        console.warn('[NavigationService] replaceState failed:', e);
      }
    }

    this.notifySubscribers(newEntry);
  }

  /**
   * Unified Global Go-Back Action (One Back Press = One Page Back)
   * 
   * Used by:
   * 1. PIXO's visible Back Arrow on every page
   * 2. Android hardware Back button
   * 3. Browser native Back button
   */
  goBack(fromBrowserPop = false) {
    // 1. First check if any registered interceptor (confirmation, pause menu, modal) handles this
    const intercepted = this.executeTopBackHandler();
    if (intercepted) {
      return true;
    }

    // 2. If inside an internal page and a previous internal PIXO route exists
    if (this.currentIndex > 0 && this.history.length > 1) {
      // In mobile browser, trigger window.history.back() so popstate event fires
      // and keeps browser history and internal stack in 100% lockstep
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history && !fromBrowserPop) {
        window.history.back();
        return true;
      }

      // On Android APK or non-browser fallback:
      this.currentIndex--;
      this.history.pop();
      const previousRoute = this.history[this.history.length - 1];
      this.notifySubscribers(previousRoute);
      return true;
    }

    // 3. At root Dashboard (no previous internal route):
    // DO NOT blindly call history.back() when there is no previous internal route!
    this.triggerExitConfirmation();
    return true; // Return true to tell Android BackHandler not to abruptly kill process
  }

  triggerExitConfirmation() {
    for (const listener of this.exitSubscribers) {
      try {
        listener();
      } catch (err) {
        console.warn('[NavigationService] exit listener error:', err);
      }
    }
  }

  exitApp() {
    if (Platform.OS === 'android') {
      try {
        BackHandler.exitApp();
      } catch (err) {
        console.warn('[NavigationService] BackHandler.exitApp() failed:', err);
      }
    } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
      alert('Thank you for playing PIXO! You may close this browser tab.');
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

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
    return this.history[this.history.length - 1] || { id: 'home', title: 'Dashboard', params: {}, index: 0 };
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
    return this.currentIndex > 0 && this.history.length > 1;
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
        return 'Target Number (Speed Math)';
      case 'target_level_select':
        return 'Target Number • Level Selection';
      case 'target_gameplay':
        return 'Target Number • Gameplay Arena';
      case 'cyber_strike':
        return 'Cyber Strike: 2099';
      case 'cyber_strike_levels':
        return 'Cyber Strike • Category Levels';
      case 'cyber_strike_gameplay':
        return 'Cyber Strike • Mission Gameplay';
      case 'game_details':
        return 'Game Details';
      default:
        return 'PIXO';
    }
  }
}

export const NavigationService = new NavigationServiceSingleton();

/**
 * React Router compatibility hook: useNavigate
 * Usage:
 *   const navigate = useNavigate();
 *   navigate(-1); // Go back one internal step
 *   navigate('games'); // Go to Games
 *   navigate('target_number'); // Go to Target Number
 */
export function useNavigate() {
  return useCallback((to, options) => {
    if (typeof to === 'number') {
      if (to === -1) {
        return NavigationService.goBack(false);
      }
      return;
    }
    NavigationService.navigate(to, options?.state || options?.params);
  }, []);
}

/**
 * React Router compatibility hook: useLocation
 * Usage:
 *   const location = useLocation();
 *   console.log(location.pathname, location.state);
 */
export function useLocation() {
  const [currentRoute, setCurrentRoute] = useState(() => NavigationService.getCurrentRoute());
  useEffect(() => {
    return NavigationService.subscribe((route) => {
      setCurrentRoute(route);
    });
  }, []);
  return {
    pathname: currentRoute.path || `/${currentRoute.id}`,
    hash: `#${currentRoute.id}`,
    state: currentRoute.params,
    key: String(currentRoute.index || 0),
  };
}

export default NavigationService;
