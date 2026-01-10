# Multi-Agent Pipeline: Log → Investigate → Fix → Test → Learn

A pipeline of specialized agents that automatically investigate production issues, trace them to source, design and implement fixes, validate them, and update organizational knowledge.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TRIGGER LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Log File ──────┐                                                          │
│   Error Alert ───┼──▶ Log Watcher ──▶ Creates Issue Ticket                  │
│   Manual ────────┘    (GitHub Action)                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AGENT LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│   │ INVESTIGATOR│    │ FIX         │    │ IMPLEMENTER │    │ TESTER      │  │
│   │             │───▶│ DESIGNER    │───▶│             │───▶│             │  │
│   │ - Parse log │    │             │    │             │    │             │  │
│   │ - Find root │    │ - Design    │    │ - Write     │    │ - Run tests │  │
│   │   cause     │    │   solution  │    │   code      │    │ - Validate  │  │
│   │ - Trace to  │    │ - Consider  │    │ - Create PR │    │ - Report    │  │
│   │   PR/commit │    │   tradeoffs │    │             │    │             │  │
│   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│                                                                     │        │
│                                                                     ▼        │
│                                                          ┌─────────────┐     │
│                                                          │ KNOWLEDGE   │     │
│                                                          │ UPDATER     │     │
│                                                          │             │     │
│                                                          │ - Update    │     │
│                                                          │   lessons   │     │
│                                                          │ - Document  │     │
│                                                          │   patterns  │     │
│                                                          └─────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              OUTPUT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   - Pull Request with fix                                                   │
│   - Test results                                                            │
│   - Updated LESSONS_LEARNED.md                                              │
│   - Issue ticket updated with resolution                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Pipeline Flow

### Stage 1: Log Watcher (Trigger)

**Trigger**: Log file change, error pattern detected, or manual dispatch

**Actions**:
1. Parse log file for errors/anomalies
2. Extract error details (message, stack trace, timestamp)
3. Create a GitHub Issue with structured data
4. Trigger the investigation workflow

**Output**: GitHub Issue with error context

---

### Stage 2: Investigator Agent

**Input**: GitHub Issue with error details

**Actions**:
1. Parse the error message and stack trace
2. Search codebase for relevant files
3. Use `git blame` to find the commit that introduced the issue
4. Trace the commit back to its PR
5. Gather context: what was the PR trying to do?
6. Identify the root cause

**Output**: Investigation report added to the Issue
```markdown
## Investigation Report

**Error**: NullPointerException in UserService.getProfile()
**Root Cause**: Missing null check after database query
**Introduced in**: PR #234 "Add user profile caching"
**Commit**: abc123
**Author**: @developer
**Why it happened**: Cache miss case wasn't handled
```

---

### Stage 3: Fix Designer Agent

**Input**: Investigation report

**Actions**:
1. Read the relevant code sections
2. Understand the original intent (from PR description)
3. Design a fix that:
   - Addresses the root cause
   - Preserves original functionality
   - Follows project patterns
4. Consider tradeoffs (performance, complexity, scope)
5. Document the proposed approach

**Output**: Fix design document
```markdown
## Proposed Fix

**Approach**: Add null check with fallback to database fetch

**Changes**:
1. `src/services/UserService.ts:45` - Add cache miss handling
2. `src/services/UserService.ts:52` - Add logging for cache misses

**Tradeoffs**:
- Slightly more database calls on cold cache
- But prevents crashes and improves observability

**Alternatives considered**:
- Pre-warming cache (rejected: adds complexity)
- Returning empty profile (rejected: breaks downstream)
```

---

### Stage 4: Implementer Agent

**Input**: Fix design document

**Actions**:
1. Create a new branch from the target branch
2. Implement the designed changes
3. Ensure code follows project conventions
4. Create a Pull Request with:
   - Clear description referencing the Issue
   - Link to original problem PR
   - Explanation of the fix

**Output**: Pull Request ready for review

---

### Stage 5: Tester Agent

**Input**: Pull Request with fix

**Actions**:
1. Checkout the PR branch
2. Run existing test suite
3. Verify the specific fix:
   - Can we reproduce the original error?
   - Does the fix prevent it?
4. Run any relevant integration tests
5. Report results

**Output**: Test results added to PR
```markdown
## Test Results

✅ Unit tests: 142 passed
✅ Integration tests: 28 passed
✅ Regression test: Original error no longer reproducible
⚠️ Coverage: 2 new lines not covered (logging statements)

**Recommendation**: Ready to merge
```

---

### Stage 6: Knowledge Updater Agent

**Input**: Completed fix cycle (Issue, PR, test results)

**Actions**:
1. Extract learnings from the incident:
   - What went wrong?
   - Why wasn't it caught?
   - How was it fixed?
2. Update relevant documentation:
   - `LESSONS_LEARNED.md` - Add incident summary
   - Code comments if pattern is subtle
   - Update CLAUDE.md if it informs future dev
3. Identify patterns:
   - Is this a recurring issue type?
   - Should we add a linting rule?
   - Should we update code review checklist?

**Output**: Updated documentation + recommendations
```markdown
## Lesson Learned: Cache Miss Handling

**Incident**: PR #456 (fixing issue from PR #234)
**Date**: 2026-01-10

**What happened**: Cache lookup returned null, code assumed cache hit.

**Root cause**: Missing defensive check for cache miss case.

**Prevention**:
- Always handle cache miss as a valid state
- Add this to code review checklist for caching PRs

**Pattern**: When adding caching, explicitly handle:
1. Cache hit
2. Cache miss
3. Cache error
```

## State Management

The pipeline maintains state in `.claude/pipeline/`:

```
.claude/pipeline/
├── issues/
│   └── issue-123.json       # Tracking state for each issue
├── investigations/
│   └── issue-123-report.md  # Investigation findings
├── designs/
│   └── issue-123-fix.md     # Fix design documents
└── learnings/
    └── 2026-01-10-cache-miss.md  # Extracted learnings
```

## Configuration

```yaml
# .claude/pipeline-config.yml

trigger:
  log_patterns:
    - "ERROR"
    - "FATAL"
    - "Exception"
  log_paths:
    - "logs/*.log"
    - "/var/log/app/*.log"

agents:
  investigator:
    model: opus
    timeout: 300
  designer:
    model: opus
    timeout: 300
  implementer:
    model: sonnet
    timeout: 600
  tester:
    model: sonnet
    timeout: 300
  knowledge:
    model: haiku
    timeout: 120

output:
  lessons_learned_path: "docs/LESSONS_LEARNED.md"
  create_pr: true
  require_human_approval: true  # Pause before merge
```

## Human Checkpoints

By default, the pipeline pauses for human approval at:

1. **After Investigation**: Confirm root cause is correct
2. **After Fix Design**: Approve the approach
3. **After Tests Pass**: Final review before merge

Set `require_human_approval: false` for fully autonomous operation.
