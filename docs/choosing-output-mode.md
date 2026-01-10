# Choosing Between PR Comments and Auto-Commit

When setting up an AI agent to modify code via GitHub Actions, you have two main output modes. This document helps you choose the right one.

## The Two Modes

### PR Comments (Review Mode)
The agent analyzes code and posts suggestions as PR comments. You review and manually apply changes you agree with.

### Auto-Commit (Autonomous Mode)
The agent directly modifies files and commits changes to your branch.

## Comparison

| Aspect | PR Comments | Auto-Commit |
|--------|-------------|-------------|
| Human review | Before changes applied | After (in commit history) |
| Control | You decide what to accept | Agent decides |
| Speed | Slower (manual step) | Faster (fully automated) |
| Git history | Your commits stay yours | Mixed with bot commits |
| Risk | Lower (changes aren't applied) | Higher (must revert if wrong) |
| Learning | See suggestions, learn patterns | Changes happen silently |

## When to Use PR Comments

**Start here.** Use PR comments when:

- **You're new to this** - See what the agent suggests before trusting it
- **Subjectivity matters** - "Simpler" is subjective; you may disagree
- **Context is complex** - The agent doesn't know your full codebase history
- **Team collaboration** - Others can see and discuss suggestions
- **Clean git history matters** - No bot commits mixed with human work
- **Learning is a goal** - You want to see patterns you could adopt

## When to Use Auto-Commit

Switch to auto-commit when:

- **High trust established** - You've reviewed many suggestions and accept 95%+
- **Strong test coverage** - Tests will catch if something breaks
- **Low-risk changes** - Formatting, simple refactors
- **Speed is critical** - You want maximum automation
- **Easy to revert** - You're comfortable reverting commits if needed

## Recommended Progression

```
Week 1-4:  PR Comments    → Learn what the agent suggests
           ↓
           Review patterns, build confidence
           ↓
Week 5+:   Auto-Commit    → If you're accepting most suggestions
           (optional)
```

## Switching Between Modes

The workflow file (`code-simplify.yml`) controls which mode is used.

### Current Mode: PR Comments
The agent posts suggestions as comments. To apply them, copy the suggested code into your files.

### To Switch to Auto-Commit
See `code-simplify-autocommit.yml.example` for a version that commits directly.

Key differences:
1. Agent prompt says "modify files" instead of "analyze only"
2. Adds a commit step after the agent runs
3. Requires `contents: write` permission

## Hybrid Approaches

You can also combine both:

1. **Auto-commit formatting, comment on logic** - Let the agent fix formatting automatically, but post comments for logic changes
2. **Auto-commit to feature branches only** - Protect main/develop, allow auto-commits elsewhere
3. **Require approval threshold** - Only auto-commit if confidence is high

## Summary

**Default to PR comments.** The slight slowdown is worth the control and learning opportunity. Switch to auto-commit only after you've built trust in the agent's suggestions and have safety nets (tests, easy reverts) in place.
