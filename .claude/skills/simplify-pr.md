# /simplify-pr

Analyze a pull request and suggest code simplifications.

## Usage

```
/simplify-pr <pr-number-or-url>
/simplify-pr 123
/simplify-pr https://github.com/owner/repo/pull/123
```

## What This Command Does

1. Fetches the PR details and changed files
2. Analyzes each changed file for simplification opportunities
3. Presents suggestions with before/after code snippets
4. Optionally applies changes you approve

## Instructions

When the user invokes `/simplify-pr`, follow this process:

### Step 1: Fetch PR Information

Use the `gh` CLI to get PR details:

```bash
# Get PR metadata
gh pr view <number> --json number,title,baseRefName,headRefName,files

# Get the diff
gh pr diff <number>
```

### Step 2: Checkout and Read Changed Files

```bash
# List changed files
gh pr view <number> --json files --jq '.files[].path'
```

Then read each file that matches code extensions (.js, .ts, .jsx, .tsx, .py, .go, .rs, etc.)

### Step 3: Analyze for Simplifications

For each file, look for:

- **Unnecessary complexity**: Nested conditionals that could be flattened
- **Redundant code**: Duplicate logic, unused variables
- **Clarity improvements**: Better naming, clearer structure
- **Pattern violations**: Inconsistent with project conventions

Apply these principles:
- Preserve all functionality - only change how, not what
- Prefer clarity over brevity
- Avoid nested ternaries
- Don't over-abstract

### Step 4: Present Suggestions

For each suggestion, output:

```markdown
## <filename>

### Suggestion: <brief title>

**Current:**
```<lang>
<current code>
```

**Suggested:**
```<lang>
<simplified code>
```

**Why:** <one sentence explanation>
```

### Step 5: Offer to Apply

After presenting all suggestions, ask:

> Would you like me to apply any of these changes? You can say:
> - "Apply all" - I'll make all the suggested changes
> - "Apply 1, 3" - I'll apply specific suggestions by number
> - "None" - Just keep these as notes

If the user wants changes applied, edit the files directly.
