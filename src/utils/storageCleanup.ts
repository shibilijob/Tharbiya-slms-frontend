/**
 * Centralized Client-Side Storage Cleanup Utility
 * 
 * Safely removes application-specific data from localStorage and sessionStorage
 * during logout without using localStorage.clear() (preserving third-party / unrelated data).
 */

export const APPLICATION_LOCAL_STORAGE_KEYS = [
  'tharbiyah_students',
  'tharbiyah_auth_user',
  'tharbiyah_auth_token',
  'token',
  'tharbiyah_attendance',
  'tharbiyah_assessments',
  'tharbiyah_quran_progress',
  'tharbiyah_practical_criteria',
  'tharbiyah_notifications',
  'tharbiyah_akhlaq',
  'tharbiyah_remarks',
  'tharbiyah_goals',
  'tharbiyah_announcements',
  'tharbiyah_achievements',
  'tharbiyah_timetables',
  'tharbiyah_subjects_list',
] as const;

const APPLICATION_PREFIX = 'tharbiyah_';
const SESSION_KEYS = ['pending_oauth_role'] as const;
const SESSION_PREFIXES = ['tharbiyah_', 'pending_oauth_'] as const;

/**
 * Removes all application-specific cached, session, and credential data
 * from localStorage and sessionStorage.
 */
export const clearAppStorage = (): void => {
  try {
    // 1. Remove all explicitly defined application keys
    for (const key of APPLICATION_LOCAL_STORAGE_KEYS) {
      try {
        localStorage.removeItem(key);
      } catch (err) {
        console.warn(`Failed to remove localStorage key: ${key}`, err);
      }
    }

    // 2. Scan and remove any dynamically generated keys starting with 'tharbiyah_' or legacy 'token'
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(APPLICATION_PREFIX) || key === 'token')) {
          keysToRemove.push(key);
        }
      }
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    } catch (scanErr) {
      console.warn('Error scanning dynamic localStorage keys during logout:', scanErr);
    }

    // 3. Remove application-specific sessionStorage keys
    for (const key of SESSION_KEYS) {
      try {
        sessionStorage.removeItem(key);
      } catch {}
    }
    try {
      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && SESSION_PREFIXES.some((p) => key.startsWith(p))) {
          sessionKeysToRemove.push(key);
        }
      }
      for (const key of sessionKeysToRemove) {
        sessionStorage.removeItem(key);
      }
    } catch (sessionErr) {
      console.warn('Error scanning dynamic sessionStorage keys during logout:', sessionErr);
    }
  } catch (error) {
    console.error('Failed to execute clearAppStorage:', error);
  }
};
