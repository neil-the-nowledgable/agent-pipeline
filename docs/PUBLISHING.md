# Publishing to GitHub

Guide for publishing the neil-the-nowledgable Agent Pipeline.

## Repository Structure

### Option A: Single Repository (Recommended for Starting)

Publish everything to one repo: `neil-the-nowledgable/agent-pipeline`

```
agent-pipeline/
├── .github/workflows/      # Pipeline workflows
├── .claude/                # Skills, state, brand config
├── agents/                 # Agent prompts
├── docs/                   # Documentation
├── sample-project/         # Test project (optional - see below)
└── README.md
```

**Pros:** Simple, everything in one place, easy to get started
**Cons:** Sample project clutters the main repo

### Option B: Separate Repositories (Recommended for Sharing)

Split into focused repos:

1. **`neil-the-nowledgable/agent-pipeline`** - The core pipeline
   ```
   agent-pipeline/
   ├── .github/workflows/
   ├── agents/
   ├── docs/
   └── README.md
   ```

2. **`neil-the-nowledgable/agent-pipeline-example`** - Demo project
   ```
   agent-pipeline-example/
   ├── sample-project files...
   └── README.md (links to main repo)
   ```

**Pros:** Clean separation, users can fork just what they need
**Cons:** More repos to maintain

## Files to Include

### Essential (Always Include)

| Path | Purpose |
|------|---------|
| `.github/workflows/*.yml` | The pipeline workflows |
| `agents/pipeline/*.md` | Agent prompts |
| `agents/code-simplifier.md` | Simplifier agent |
| `README.md` | Main documentation |
| `docs/multi-agent-pipeline.md` | Architecture docs |

### Recommended

| Path | Purpose |
|------|---------|
| `.claude/skills/*.md` | Local slash commands |
| `.claude/brand.json` | Brand configuration template |
| `docs/choosing-output-mode.md` | User guidance |
| `LICENSE` | MIT recommended |

### Optional

| Path | Purpose |
|------|---------|
| `sample-project/` | Demo - consider separate repo |
| `docs/helpful-accidents.md` | Philosophy - personal choice |
| `.claude/state/`, `.claude/learnings/` | Runtime dirs - add to .gitignore |

## Before Publishing

### 1. Create .gitignore

```gitignore
# Runtime state
.claude/state/
.claude/learnings/

# Node
node_modules/
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/
*.swp
```

### 2. Add LICENSE

Create `LICENSE` file with MIT license (or your preference).

### 3. Update Brand References

Search and replace placeholder references:
- Ensure `neil-the-nowledgable` appears consistently
- Update any example URLs to your actual GitHub

### 4. Test the Workflows

Before publishing, verify:
1. Workflows have valid YAML syntax
2. Agent prompts are complete
3. Sample project runs locally

```bash
# Validate YAML
for f in .github/workflows/*.yml; do
  echo "Checking $f"
  python -c "import yaml; yaml.safe_load(open('$f'))"
done

# Test sample project
cd sample-project && npm test
```

## Publishing Steps

### Initial Setup

```bash
# Initialize git if needed
cd /path/to/github-actions
git init

# Create repo on GitHub first, then:
git remote add origin git@github.com:neil-the-nowledgable/agent-pipeline.git

# Add files
git add .
git commit -m "Initial commit: neil-the-nowledgable Agent Pipeline

Multi-agent pipeline for automated issue investigation and resolution.

Features:
- Log-triggered error detection
- 5-stage agent pipeline (investigate → design → implement → test → learn)
- PR-based code simplification commands
- Lessons learned documentation

Built with Claude."

git push -u origin main
```

### Adding Topics

On GitHub, add topics to make it discoverable:
- `github-actions`
- `ai-agents`
- `claude`
- `automation`
- `devops`
- `code-quality`

### Creating a Release

After publishing:

1. Go to **Releases** → **Create new release**
2. Tag: `v1.0.0`
3. Title: `v1.0.0 - Initial Release`
4. Description:
   ```markdown
   ## neil-the-nowledgable Agent Pipeline v1.0.0

   Initial release of the multi-agent pipeline for automated issue resolution.

   ### Features
   - 🔍 Log Watcher: Detects errors and creates investigation issues
   - 🕵️ Investigator Agent: Traces errors to root cause
   - 🎨 Designer Agent: Creates targeted fix designs
   - 🔧 Implementer Agent: Writes professional-quality fixes
   - 🧪 Tester Agent: Validates fixes
   - 📚 Knowledge Agent: Documents lessons learned

   ### Getting Started
   See README.md for setup instructions.
   ```

## Promoting Your Work

### LinkedIn Post Template

```
Excited to share my new open-source project: the Agent Pipeline 🤖

It's a GitHub Actions-powered system that uses AI agents to automatically:
→ Detect production errors
→ Investigate root causes
→ Design and implement fixes
→ Test changes
→ Document lessons learned

Think of it as having a tireless junior dev that never forgets to update the docs.

Check it out: github.com/neil-the-nowledgable/agent-pipeline

#AI #DevOps #Automation #OpenSource
```

### Twitter/X Thread Starter

```
🧵 I built a multi-agent pipeline that automates debugging

Error happens → 5 AI agents work together → PR with fix + lessons documented

Here's how it works: (1/6)
```

## Maintenance

### Responding to Issues

When users open issues:
- Use your own pipeline to investigate if applicable
- Document fixes as lessons learned
- Consider adding to FAQ in README

### Updating Agents

When Claude improves or you learn better prompts:
- Update agent .md files
- Note changes in CHANGELOG.md
- Bump version for significant changes

---

*Good luck with the launch! - neil-the-nowledgable*
