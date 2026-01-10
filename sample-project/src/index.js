/**
 * Sample Application Entry Point
 * @author neil_the_knowledgable
 *
 * This application demonstrates common issues that the
 * agent pipeline can detect and fix.
 */

import { getUserProfile, cacheUser } from './services/UserService.js';
import { getCacheStats } from './services/CacheService.js';

console.log('Starting sample application...');

// Simulate normal operation
cacheUser('user-123', {
  id: 'user-123',
  profile: { name: 'Test User', email: 'test@example.com' },
  isActive: true,
  permissions: { read: true, write: false }
});

// This works
const profile = getUserProfile('user-123');
console.log('Got profile:', profile);

// This will crash - user not in cache
// Uncomment to reproduce the error:
// const missingProfile = getUserProfile('user-999');

console.log('Cache stats:', getCacheStats());
console.log('Application running.');
