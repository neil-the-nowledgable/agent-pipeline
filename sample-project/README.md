# Sample Project

A test project with intentional bugs for testing the neil-the-nowledgable agent pipeline.

## Intentional Issues

This project contains several code quality issues designed to be caught by the pipeline:

### UserService.js

| Issue | Location | Description |
|-------|----------|-------------|
| Cache miss bug | `getUserProfile()` | Doesn't handle when user isn't in cache - throws TypeError |
| Nested conditionals | `getUserPermissions()` | 4 levels of nesting, hard to follow |
| Poor naming | `validateSession()` | Variables named `s`, `t`, `d`, `x` - unclear intent |
| Nested ternary | `formatDisplayName()` | Hard to read, should be if/else or switch |

### CacheService.js

| Issue | Location | Description |
|-------|----------|-------------|
| Poor naming | `setCacheItem()` | Parameters named `k`, `v`, `ttl` |
| Confusing logic | `isNotExpired()` | Double negatives, hard to reason about |
| Verbose code | `clearExpiredItems()` | Could be simplified |

### Error Log

`logs/app.log` contains a simulated production error:

```
TypeError: Cannot read properties of undefined (reading 'profile')
    at getUserProfile (file:///app/src/services/UserService.js:14:12)
```

This error would trigger the pipeline to:
1. Create an investigation issue
2. Trace to the problematic code
3. Design a fix (add null check)
4. Implement and test it

## Testing Locally

```bash
# Run the app (works with cached user)
npm start

# Run tests (one documents the bug)
npm test
```

## Using with the Pipeline

1. Push this to a GitHub repo
2. Manually trigger the Log Watcher workflow
3. Paste the error from `logs/app.log`
4. Watch the pipeline investigate and fix

Or use `/simplify-pr` locally to get suggestions for the code issues.
