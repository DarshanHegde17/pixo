/**
 * Robust Cross-Platform Session Storage
 * Works across Web (localStorage), Native (AsyncStorage if available), and Memory fallback
 */

let isWebPlatform = typeof window !== 'undefined';
try {
  const rn = require('react-native');
  if (rn && rn.Platform) {
    isWebPlatform = rn.Platform.OS === 'web';
  }
} catch {
  isWebPlatform = typeof window !== 'undefined';
}

let nativeAsyncStorage = null;

try {
  // Dynamically try loading @react-native-async-storage/async-storage
  // to avoid hard crashes if native modules aren't linked yet
  const storageModule = require('@react-native-async-storage/async-storage');
  nativeAsyncStorage = storageModule.default || storageModule;
} catch (e) {
  // Fallback will be used
  nativeAsyncStorage = null;
}

const memoryStorage = new Map();

export const SessionStorage = {
  /**
   * Save item
   * @param {string} key
   * @param {any} value
   */
  async setItem(key, value) {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    memoryStorage.set(key, stringValue);

    if (isWebPlatform && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, stringValue);
        return;
      } catch (err) {
        console.warn('Error saving to web localStorage:', err);
      }
    }

    if (nativeAsyncStorage) {
      try {
        await nativeAsyncStorage.setItem(key, stringValue);
        return;
      } catch (err) {
        console.warn('Error saving to AsyncStorage:', err);
      }
    }
  },

  /**
   * Retrieve item
   * @param {string} key
   * @returns {Promise<any | null>}
   */
  async getItem(key) {
    if (isWebPlatform && typeof window !== 'undefined' && window.localStorage) {
      try {
        const val = window.localStorage.getItem(key);
        if (val !== null) {
          memoryStorage.set(key, val);
          try {
            return JSON.parse(val);
          } catch {
            return val;
          }
        }
      } catch (err) {
        console.warn('Error reading from web localStorage:', err);
      }
    }

    if (nativeAsyncStorage) {
      try {
        const val = await nativeAsyncStorage.getItem(key);
        if (val !== null) {
          memoryStorage.set(key, val);
          try {
            return JSON.parse(val);
          } catch {
            return val;
          }
        }
      } catch (err) {
        console.warn('Error reading from AsyncStorage:', err);
      }
    }

    // Memory fallback
    if (memoryStorage.has(key)) {
      const val = memoryStorage.get(key);
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }

    return null;
  },

  /**
   * Remove item
   * @param {string} key
   */
  async removeItem(key) {
    memoryStorage.delete(key);

    if (isWebPlatform && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch (err) {
        console.warn('Error removing from web localStorage:', err);
      }
    }

    if (nativeAsyncStorage) {
      try {
        await nativeAsyncStorage.removeItem(key);
      } catch (err) {
        console.warn('Error removing from AsyncStorage:', err);
      }
    }
  },

  /**
   * Clear all storage
   */
  async clear() {
    memoryStorage.clear();

    if (isWebPlatform && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.clear();
      } catch (err) {
        console.warn('Error clearing web localStorage:', err);
      }
    }

    if (nativeAsyncStorage) {
      try {
        await nativeAsyncStorage.clear();
      } catch (err) {
        console.warn('Error clearing AsyncStorage:', err);
      }
    }
  },
};

export default SessionStorage;
