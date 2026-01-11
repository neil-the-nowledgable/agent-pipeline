# Lessons Learned

A living document of incidents and what we learned from them.

---

## Issue #4: API Latency Spike on /users Endpoint

**Date:** 2026-01-11
**Severity:** High
**Service:** api
**Resolution Time:** ~30 minutes (automated pipeline)

### What Happened

The `/users` endpoint experienced elevated error rates and latency spikes. Users requesting profiles for non-cached users received 500 Internal Server errors instead of appropriate responses.

### Root Cause

The `getUserProfile()` function in `UserService.js` assumed all user lookups would return cached data. When `userCache.get(userId)` returned `undefined` (cache miss), the code attempted to access `u.profile` on undefined, throwing a TypeError.

```javascript
// Before (buggy)
export function getUserProfile(userId) {
  const u = userCache.get(userId);
  return u.profile;  // TypeError when u is undefined
}
```

### Resolution

Added null check to handle cache misses gracefully:

```javascript
// After (fixed)
export function getUserProfile(userId) {
  const u = userCache.get(userId);
  if (!u) {
    return null;  // Gracefully handle cache miss
  }
  return u.profile;
}
```

### Lessons Learned

1. **Always validate return values from Map/Cache lookups**
   - `Map.get()` returns `undefined` for missing keys
   - Never assume cache hits - always have a fallback path

2. **Defensive programming prevents cascading failures**
   - A simple null check prevented 500 errors
   - Callers can now distinguish "not found" from "system error"

3. **Tests should cover cache miss scenarios**
   - The original test documented the bug but didn't enforce the fix
   - Updated test now verifies graceful handling

### Prevention Measures

- [ ] Add lint rule: require null checks after `Map.get()` calls
- [ ] Code review checklist: verify cache miss handling
- [ ] Add cache hit/miss metrics for monitoring
- [ ] Consider implementing cache-aside pattern with DB fallback

### Pipeline Performance

This incident was fully handled by the automated agent pipeline:

| Stage | Agent | Duration |
|-------|-------|----------|
| Detection | Log Watcher | Instant |
| Investigation | O11y Investigator | ~2 min |
| Design | Fix Designer | ~1.5 min |
| Implementation | Implementer | ~45 sec |
| Testing | Tester | ~2 min |

**Total automated resolution:** ~6 minutes of agent time

---
