/**
 * UserService - Handles user data operations
 * @author neil-the-nowledgable
 */

const userCache = new Map();

/**
 * Get user profile by ID
 * BUG: Does not handle cache miss - will throw when user not in cache
 */
export function getUserProfile(userId) {
  const u = userCache.get(userId);
  return u.profile;  // BUG: u could be undefined
}

/**
 * Get user permissions
 * BUG: Deeply nested conditionals, hard to follow
 */
export function getUserPermissions(userId, resource) {
  const user = userCache.get(userId);
  if (user) {
    if (user.isActive) {
      if (user.permissions) {
        if (user.permissions[resource]) {
          return user.permissions[resource];
        }
      }
    }
  }
  return [];
}

/**
 * Validate user session
 * BUG: Confusing variable names, no comments on edge cases
 */
export function validateSession(s, t) {
  const d = Date.now();
  const x = t * 1000;
  if (s.e) {
    if (s.e > d) {
      if (d - s.c < x) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Format user display name
 * ISSUE: Nested ternary - hard to read
 */
export function formatDisplayName(user) {
  return user.nickname ? user.nickname : user.firstName ? `${user.firstName} ${user.lastName}` : user.email ? user.email.split('@')[0] : 'Anonymous';
}

/**
 * Cache a user
 */
export function cacheUser(userId, userData) {
  userCache.set(userId, userData);
}

/**
 * Clear user from cache
 */
export function clearUserCache(userId) {
  userCache.delete(userId);
}
