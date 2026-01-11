/**
 * UserService Tests
 * @author neil-the-nowledgable
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  getUserProfile,
  getUserPermissions,
  validateSession,
  formatDisplayName,
  cacheUser,
  clearUserCache
} from '../src/services/UserService.js';

describe('UserService', () => {
  beforeEach(() => {
    // Clear cache between tests
    clearUserCache('test-user');
  });

  describe('getUserProfile', () => {
    it('should return profile for cached user', () => {
      const userData = {
        profile: { name: 'Test', email: 'test@test.com' }
      };
      cacheUser('test-user', userData);

      const result = getUserProfile('test-user');
      assert.deepStrictEqual(result, userData.profile);
    });

    it('should handle missing user gracefully', () => {
      // BUG: Currently throws TypeError on cache miss
      // This test documents the expected behavior after fix
      const result = getUserProfile('non-existent-user');
      assert.strictEqual(result, null);
    });
  });

  describe('formatDisplayName', () => {
    it('should use nickname when available', () => {
      const user = { nickname: 'CoolUser', firstName: 'John', lastName: 'Doe' };
      assert.strictEqual(formatDisplayName(user), 'CoolUser');
    });

    it('should fall back to full name', () => {
      const user = { firstName: 'John', lastName: 'Doe' };
      assert.strictEqual(formatDisplayName(user), 'John Doe');
    });

    it('should fall back to email prefix', () => {
      const user = { email: 'john@example.com' };
      assert.strictEqual(formatDisplayName(user), 'john');
    });

    it('should return Anonymous as last resort', () => {
      const user = {};
      assert.strictEqual(formatDisplayName(user), 'Anonymous');
    });
  });
});
