# neil_the_knowledgable Agent Pipeline

> *"Automating wisdom, one pipeline at a time."*

A GitHub Actions-powered multi-agent pipeline that automatically investigates production issues, designs fixes, implements them, validates with tests, and captures lessons learned.

Created by **[@neil_the_knowledgable](https://github.com/neil_the_knowledgable)**

## What This Does

```
Error in Logs → Investigation → Fix Design → Implementation → Testing → Knowledge Update
```

Instead of manually debugging production issues, this pipeline:
1. **Detects** errors from your logs
2. **Investigates** the root cause and traces it to the originating PR
3. **Designs** a targeted fix
4. **Implements** the fix with professional code quality
5. **Tests** the fix to ensure it works
6. **Learns** by documenting the incident for future prevention

## Quick Start

### 1. Add Your API Key

Go to your repo: **Settings → Secrets → Actions → New secret**
- Name: `ANTHROPIC_API_KEY`
- Value: Your Anthropic API key

### 2. Copy the Workflows

Copy these directories to your repo:
```
.github/workflows/    # The pipeline workflows
agents/               # Agent prompts
```

### 3. Test It

**Manual test:**
1. Go to **Actions** → **Log Watcher - Pipeline Trigger**
2. Click **Run workflow**
3. Paste an error log
4. Watch the pipeline work

**Or trigger on real logs:**
Configure `log-watcher.yml` to watch your actual log files.

## Components

### Skills (Local Commands)

| Command | Description |
|---------|-------------|
| `/simplify-pr 123` | Analyze a PR and suggest simplifications |
| `/track-pr 123` | Track a PR as your unit of work for a session |

### Pipeline Agents

| Agent | Role |
|-------|------|
| **Investigator** | Traces errors to root cause and originating PR |
| **Designer** | Creates targeted fix designs with tradeoffs |
| **Implementer** | Writes professional-quality code |
| **Tester** | Validates fixes and checks for regressions |
| **Knowledge Updater** | Documents lessons learned |

### Workflows

| Workflow | Trigger |
|----------|---------|
| `log-watcher.yml` | Detects errors, creates issues |
| `pipeline-investigate.yml` | Runs investigation agent |
| `pipeline-design.yml` | Runs fix design agent |
| `pipeline-implement.yml` | Creates PR with fix |
| `pipeline-test.yml` | Validates the fix |
| `pipeline-learn.yml` | Updates documentation |

## Human Checkpoints

By default, the pipeline pauses for approval between stages. Labels trigger progression:

```
Issue Created → [pipeline:investigate] → Investigation Complete
                                       ↓
                        [pipeline:design] → Design Complete
                                           ↓
                            [pipeline:implement] → PR Created
                                                   ↓
                                    [pipeline:test] → Tests Pass
                                                       ↓
                                        [pipeline:learn] → Done!
```

For fully autonomous operation, uncomment the auto-trigger sections in each workflow.

## Customization

### Brand Identity

Edit `.claude/brand.json` to customize:
- Bot name and commit signatures
- Issue label prefixes
- Footer templates

### Agent Behavior

Edit the agent prompts in `agents/pipeline/`:
- `investigator.md` - How to trace root causes
- `designer.md` - Fix design principles
- `implementer.md` - Code quality standards
- `tester.md` - Validation criteria
- `knowledge-updater.md` - What to document

## Sample Project

See `sample-project/` for a test project with intentional bugs. Use it to:
1. Test the pipeline locally
2. Understand what kinds of issues it can catch
3. Practice with the `/simplify-pr` command

## Documentation

- [Choosing Output Mode](docs/choosing-output-mode.md) - PR comments vs auto-commit
- [Multi-Agent Pipeline Architecture](docs/multi-agent-pipeline.md) - How the pipeline works
- [Helpful Accidents](docs/helpful-accidents.md) - Philosophy behind the design

## License

MIT - Use freely, attribute kindly.

---

*Built with Claude by [@neil_the_knowledgable](https://github.com/neil_the_knowledgable)*
