# neil-the-nowledgable Agent Pipeline

> *"The true measure of wealth is not what we extract, but what we sustain."*

A GitHub Actions-powered multi-agent pipeline that automatically investigates production issues, designs fixes, implements them, validates with tests, and captures lessons learned.

Created by **[@neil-the-nowledgable](https://github.com/neil-the-nowledgable)**

## Why "Nowledgable"?

**Nowledgable** describes understanding how to harness AI to unleash extraordinary productivity—not for its own sake, but in service of people, animals, and the living environment that sustains us all.

The natural world is the cradle of all life. The true wealth of a people is measured by the health of their world—the interconnected web of life of which we are all part.

[Read the full philosophy →](docs/NOWLEDGABLE.md)

---

## Table of Contents

- [What This Does](#what-this-does)
- [Quick Start](#quick-start)
- [Pipeline Stages](#pipeline-stages)
- [O11y Investigation](#o11y-observability-investigation)
- [Workflows Reference](#workflows-reference)
- [Configuration](#configuration)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)

---

## What This Does

```
Error in Logs → Investigation → Fix Design → Implementation → Testing → Knowledge Update
```

Instead of manually debugging production issues, this pipeline:
1. **Detects** errors from your logs
2. **Investigates** the root cause and traces it to the originating PR
3. **Designs** a targeted fix with tradeoffs considered
4. **Implements** the fix with professional code quality
5. **Tests** the fix to ensure it works
6. **Learns** by documenting the incident for future prevention

---

## Quick Start

### 1. Add Required Secrets

Go to your repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Required | Description |
|--------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `PROMETHEUS_URL` | For O11y | Prometheus server URL |
| `LOKI_URL` | For O11y | Loki log aggregation URL |
| `TEMPO_URL` | For O11y | Tempo distributed tracing URL |
| `PYROSCOPE_URL` | Optional | Pyroscope profiling URL |
| `GRAFANA_TOKEN` | Optional | For authenticated endpoints |

### 2. Create Pipeline Labels

The pipeline uses labels to track progress. Create these labels in your repo:

```bash
gh label create "pipeline:investigate" --description "Pipeline: Investigation stage" --color "0052CC"
gh label create "pipeline:design" --description "Pipeline: Design stage" --color "5319E7"
gh label create "pipeline:implement" --description "Pipeline: Implementation stage" --color "006B75"
gh label create "pipeline:test" --description "Pipeline: Testing stage" --color "D93F0B"
gh label create "pipeline:learn" --description "Pipeline: Knowledge update" --color "0E8A16"
gh label create "incident" --description "Production incident" --color "B60205"
gh label create "critical" --description "Critical severity" --color "B60205"
gh label create "high" --description "High severity" --color "D93F0B"
gh label create "medium" --description "Medium severity" --color "FBCA04"
gh label create "low" --description "Low severity" --color "C2E0C6"
```

### 3. Test the Pipeline

**Option A: Manual trigger with sample error**

1. Go to **Actions** → **Log Watcher - Pipeline Trigger**
2. Click **Run workflow**
3. Paste this sample error:
   ```
   2024-01-15T10:30:00Z ERROR UserService - TypeError: Cannot read property 'profile' of undefined
       at getUserProfile (src/services/UserService.js:14:12)
       at handleRequest (src/controllers/UserController.js:28:5)
   ```
4. Watch the pipeline create an issue and investigate

**Option B: Use the sample project**

```bash
# The sample-project has intentional bugs
cat sample-project/logs/error.log
# Then trigger the workflow with that content
```

---

## Pipeline Stages

### Stage 1: Detection (Log Watcher)

**Trigger:** `log-watcher.yml`

Scans for errors and creates a tracking issue.

```yaml
# Trigger manually
gh workflow run "Log Watcher - Pipeline Trigger" \
  -f log_content="ERROR: Connection refused to database"
```

### Stage 2: Investigation

**Trigger:** Label `pipeline:investigate` or automatic from log-watcher

The Investigator agent:
- Searches the codebase for the error source
- Uses `git blame` to find the originating commit
- Traces to the PR that introduced the issue
- Posts findings to the issue

### Stage 3: Fix Design

**Trigger:** Label `pipeline:design` or comment `/proceed`

The Designer agent:
- Reviews the investigation report
- Proposes fix approaches with tradeoffs
- Specifies testing requirements
- Posts design to the issue

### Stage 4: Implementation

**Trigger:** Label `pipeline:implement` or comment `/proceed`

The Implementer agent:
- Creates a branch
- Implements the fix following code standards
- Opens a PR linked to the issue
- Follows existing naming conventions

### Stage 5: Testing

**Trigger:** Label `pipeline:test` or automatic on PR

The Tester agent:
- Runs standard test suite
- Validates specific fix requirements
- Checks for regressions
- Posts results to PR

### Stage 6: Knowledge Update

**Trigger:** Label `pipeline:learn` or comment `/proceed`

The Knowledge Updater agent:
- Documents what went wrong
- Extracts lessons learned
- Updates `docs/LESSONS_LEARNED.md`
- Suggests prevention measures

---

## O11y (Observability) Investigation

For production environments with Prometheus, Loki, Tempo, or Pyroscope, the O11y investigator provides deep telemetry analysis.

### Trigger Methods

#### 1. Manual Investigation

```bash
gh workflow run "O11y - Investigate Incident" \
  -f incident_summary="Checkout latency spike" \
  -f service="payment-api" \
  -f severity="high" \
  -f create_issue=true
```

#### 2. From Log Watcher (Enhanced Mode)

```bash
gh workflow run "Log Watcher - Pipeline Trigger" \
  -f log_content="ERROR: timeout waiting for database" \
  -f service_name="api" \
  -f use_o11y=true
```

#### 3. Alertmanager Webhook

Configure Alertmanager to trigger investigations automatically:

```yaml
# alertmanager.yml
receivers:
  - name: github-investigation
    webhook_configs:
      - url: https://api.github.com/repos/OWNER/REPO/dispatches
        http_config:
          authorization:
            credentials: <GITHUB_TOKEN>
        send_resolved: false

route:
  receiver: github-investigation
  routes:
    - match:
        severity: critical
      receiver: github-investigation
```

#### 4. Slack Integration

Trigger from Slack with a simple curl:

```bash
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/OWNER/REPO/dispatches \
  -d '{
    "event_type": "alert-fired",
    "client_payload": {
      "alert": {
        "labels": {"service": "api", "severity": "high"},
        "annotations": {"summary": "Error rate spike on /checkout"}
      }
    }
  }'
```

### O11y Investigation Capabilities

| Signal | Queries | Use Case |
|--------|---------|----------|
| **Metrics** | PromQL (RED, USE methods) | Quantify error rates, latency, saturation |
| **Logs** | LogQL | Find stack traces, error context |
| **Traces** | TraceQL | Follow request paths, find slow spans |
| **Profiles** | Pyroscope | CPU/memory hotspots |
| **Code** | git blame, grep | Map telemetry to source |

### Example O11y Output

```markdown
## Summary
Payment service latency increased 300% due to database connection pool exhaustion.

## Timeline
- 14:25: Connection pool warnings begin
- 14:28: P99 latency exceeds 2s threshold
- 14:30: Alert fires, investigation triggered

## Evidence
### Metrics
- `db_connections_active / db_connections_max` = 0.98 (near exhaustion)
- `histogram_quantile(0.99, http_request_duration_seconds)` = 4.2s

### Logs
```
14:28:15 WARN Connection pool near capacity (98/100)
14:29:02 ERROR Timeout waiting for database connection
```

## Root Cause
Commit abc123 removed connection timeout, causing connections to leak.

## Code Location
`src/db/pool.js:45` - missing `connectionTimeout` option

## Recommendations
1. Restore connectionTimeout setting
2. Add connection pool monitoring alert
3. Implement circuit breaker for DB calls
```

---

## Workflows Reference

| Workflow | File | Triggers |
|----------|------|----------|
| Log Watcher | `log-watcher.yml` | `workflow_dispatch`, `push` to logs/ |
| Investigate | `pipeline-investigate.yml` | `workflow_call`, label |
| Design | `pipeline-design.yml` | `workflow_call`, `workflow_dispatch`, label |
| Implement | `pipeline-implement.yml` | `workflow_call`, `workflow_dispatch`, label |
| Test | `pipeline-test.yml` | `workflow_call`, PR label |
| Learn | `pipeline-learn.yml` | `workflow_call`, `workflow_dispatch`, PR label |
| O11y Investigate | `o11y-investigate.yml` | `workflow_dispatch`, `workflow_call`, `repository_dispatch` |

---

## Configuration

### Agent Prompts

Customize agent behavior by editing files in `agents/pipeline/`:

| File | Controls |
|------|----------|
| `investigator.md` | How to trace root causes |
| `designer.md` | Fix design principles |
| `implementer.md` | Code quality standards, naming conventions |
| `tester.md` | Validation criteria |
| `knowledge-updater.md` | What to document |
| `o11y-investigator.md` | Observability investigation process |

### O11y Reference Docs

Query templates and patterns in `agents/pipeline/o11y-references/`:

| File | Contains |
|------|----------|
| `query-templates.md` | PromQL, LogQL, TraceQL examples |
| `investigation-patterns.md` | Step-by-step investigation workflows |
| `error-taxonomy.md` | Error types and relationships |
| `source-mapping.md` | Mapping telemetry to code |

### Brand Identity

Edit `.claude/brand.json` to customize:
- Bot name and commit signatures
- Issue label prefixes
- Footer templates

---

## Advanced Usage

### Fully Autonomous Mode

To run without human checkpoints, modify each workflow to auto-trigger the next stage:

```yaml
# In pipeline-investigate.yml, uncomment:
# design:
#   needs: investigate
#   uses: ./.github/workflows/pipeline-design.yml
#   with:
#     issue_number: ${{ inputs.issue_number }}
#   secrets: inherit
```

### Scheduled Health Checks

Add proactive monitoring:

```yaml
# Add to o11y-investigate.yml
on:
  schedule:
    - cron: '0 */4 * * *'  # Every 4 hours
```

### Post-Deployment Validation

Trigger O11y check after deployments:

```yaml
on:
  deployment_status:
    types: [success]

jobs:
  validate:
    if: github.event.deployment_status.state == 'success'
    uses: ./.github/workflows/o11y-investigate.yml
    with:
      incident_summary: "Post-deployment health check"
      service: ${{ github.event.deployment.payload.service }}
      severity: medium
```

### Local Skills

Use these commands locally with Claude Code:

| Command | Description |
|---------|-------------|
| `/simplify-pr 123` | Analyze a PR and suggest simplifications |
| `/track-pr 123` | Track a PR as your unit of work |

---

## Troubleshooting

### "ANTHROPIC_API_KEY: empty"

Add the secret in **Settings → Secrets → Actions → New repository secret**

### "Label not found"

Create the required labels (see Quick Start step 2)

### Shell escaping errors in comments

The workflows use `--body-file` to avoid shell escaping issues. If you see garbled output, ensure you're using the latest workflow versions.

### O11y queries returning empty

1. Verify secrets are set: `PROMETHEUS_URL`, `LOKI_URL`, etc.
2. Check that the service name matches your telemetry labels
3. Ensure the observability stack is accessible from GitHub Actions runners

### Pipeline stuck at a stage

Add the appropriate label to proceed:
- `pipeline:design` after investigation
- `pipeline:implement` after design
- `pipeline:test` after implementation
- `pipeline:learn` after testing

Or comment `/proceed` on the issue/PR.

---

## Documentation

- [What is Nowledgable?](docs/NOWLEDGABLE.md) - The philosophy and mission
- [Choosing Output Mode](docs/choosing-output-mode.md) - PR comments vs auto-commit
- [Multi-Agent Pipeline Architecture](docs/multi-agent-pipeline.md) - How the pipeline works
- [Helpful Accidents](docs/helpful-accidents.md) - On human-AI collaboration

---

## License

MIT - Use freely, attribute kindly.

---

*Built with Claude by [@neil-the-nowledgable](https://github.com/neil-the-nowledgable)*
