# /track-pr

Track a pull request as the unit of work for your development session.

## Usage

```
/track-pr <pr-number>     # Start tracking
/track-pr status          # Show current tracking state
/track-pr suggest         # Get next improvement suggestions
/track-pr accept <n>      # Mark suggestion as accepted
/track-pr reject <n>      # Mark suggestion as rejected (with reason)
/track-pr done            # End tracking, summarize session
```

## What This Command Does

Unlike `/simplify-pr` (one-time analysis), `/track-pr` maintains context across your session:

1. Remembers which PR you're working on
2. Tracks which suggestions you've accepted/rejected
3. Learns from your decisions within the session
4. Provides iterative suggestions as you make changes
5. Summarizes learnings at the end

## Instructions

### Starting a Tracking Session

When user runs `/track-pr <number>`:

1. Fetch PR details via `gh pr view`
2. Create a tracking state file at `.claude/state/pr-<number>.json`:

```json
{
  "pr": {
    "number": 123,
    "title": "Add user authentication",
    "base": "main",
    "head": "feature/auth",
    "started": "2026-01-10T10:30:00Z"
  },
  "files": ["src/auth/login.ts", "src/auth/validate.ts"],
  "suggestions": [],
  "accepted": [],
  "rejected": [],
  "iterations": 0
}
```

3. Announce tracking has started:

```
Now tracking PR #123: "Add user authentication"

I'll monitor your changes and suggest improvements as you work.
Commands:
- /track-pr suggest - Get improvement suggestions
- /track-pr status - See what's been done
- /track-pr done - End session and summarize
```

### Providing Suggestions

When user runs `/track-pr suggest`:

1. Read current state from tracking file
2. Re-analyze the PR files (they may have changed)
3. Filter out already-addressed suggestions
4. Present new suggestions, numbered for reference
5. Update the tracking file with new suggestions

### Accepting/Rejecting

When user runs `/track-pr accept 1` or `/track-pr reject 2`:

1. Move the suggestion to accepted/rejected list
2. If rejecting, ask for a brief reason (helps calibrate future suggestions)
3. Update tracking file

### Ending the Session

When user runs `/track-pr done`:

1. Summarize the session:
   - How many suggestions made
   - How many accepted/rejected
   - Patterns in what was accepted (to inform future sessions)

2. Optionally append learnings to project docs

3. Clean up tracking state

## Tracking State Schema

```json
{
  "pr": {
    "number": 123,
    "title": "string",
    "base": "main",
    "head": "feature/auth",
    "started": "ISO timestamp"
  },
  "files": ["array of file paths"],
  "suggestions": [
    {
      "id": 1,
      "file": "src/auth/login.ts",
      "title": "Flatten nested conditionals",
      "current": "code snippet",
      "suggested": "code snippet",
      "why": "explanation",
      "status": "pending|accepted|rejected",
      "rejectionReason": "optional"
    }
  ],
  "iterations": 3,
  "patterns": {
    "accepted": ["early returns", "const over let"],
    "rejected": ["aggressive inlining"]
  }
}
```

## Example Session

```
User: /track-pr 42

Claude: Now tracking PR #42: "Add user authentication"
3 files changed. Ready to suggest improvements.

User: /track-pr suggest

Claude:
## Suggestions for PR #42 (Iteration 1)

1. **src/auth/login.ts** - Flatten nested conditionals
2. **src/auth/login.ts** - Use early return pattern
3. **src/auth/validate.ts** - Extract validation logic

Say `/track-pr accept 1` or `/track-pr reject 2 "too aggressive"`

User: /track-pr accept 1

Claude: Applied suggestion 1. Updated tracking state.

User: /track-pr reject 2 "I prefer explicit nesting here for readability"

Claude: Noted. I'll avoid suggesting early returns in similar contexts.

User: /track-pr done

Claude:
## Session Summary for PR #42

- **Duration:** 45 minutes
- **Suggestions made:** 3
- **Accepted:** 1 (flatten nested conditionals)
- **Rejected:** 1 (early returns - "prefer explicit nesting for readability")
- **Skipped:** 1

### Patterns Learned
- You prefer explicit nesting over early returns when readability matters
- You accept structural simplifications that reduce indentation

Saved to `.claude/learnings/pr-42-session.md`
```

## Integration with Option C

The tracking state and learned patterns from `/track-pr` sessions feed into the multi-agent pipeline. When an issue is traced back to a PR, the system can reference past sessions to understand your preferences.
