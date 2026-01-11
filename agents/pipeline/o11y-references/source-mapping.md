# Source Code Mapping

## Table of Contents
- [Telemetry to Code Mapping](#telemetry-to-code-mapping)
- [Stack Trace Analysis](#stack-trace-analysis)
- [Instrumentation Patterns](#instrumentation-patterns)
- [Code Search Strategies](#code-search-strategies)
- [Change Correlation](#change-correlation)
- [Language-Specific Patterns](#language-specific-patterns)

---

## Telemetry to Code Mapping

### Metric → Code

When you see a metric anomaly:

1. **Extract metric name** from the query result
2. **Search for metric registration** in code:
   ```bash
   grep -r "metric_name" --include="*.{go,java,py,ts,js}"
   grep -r "NewCounter\|NewGauge\|NewHistogram" --include="*.go"
   grep -r "@Counted\|@Timed" --include="*.java"
   grep -r "prometheus_client\|Counter\|Gauge" --include="*.py"
   ```
3. **Find usage sites** where the metric is incremented/observed
4. **Trace code path** from metric increment to entry point

**Common metric patterns:**

| Metric Pattern | Code Search |
|---------------|-------------|
| `http_requests_total` | HTTP handler, middleware |
| `db_query_duration` | Database client, repository |
| `cache_hits_total` | Cache wrapper, client |
| `queue_messages_total` | Message consumer/producer |

### Log → Code

When you find an error log:

1. **Extract log message** (unique part)
2. **Search for log statement**:
   ```bash
   grep -r "exact error message" --include="*.{go,java,py,ts,js}"
   ```
3. **Find surrounding context** (function, error handling)
4. **Trace call stack** upward

### Trace Span → Code

When analyzing a trace span:

1. **Extract span name** (often operation or function name)
2. **Search for span creation**:
   ```bash
   grep -r "span_name\|operation_name" --include="*.{go,java,py,ts,js}"
   grep -r "StartSpan\|@Traced\|tracer.start" --include="*.{go,java,py,ts,js}"
   ```
3. **Find instrumented code block**

---

## Stack Trace Analysis

### Extracting Key Information

From a stack trace:
```
java.lang.NullPointerException: Cannot invoke method on null object
    at com.example.UserService.getUser(UserService.java:45)
    at com.example.UserController.handleRequest(UserController.java:23)
    at org.springframework.web.servlet.FrameworkServlet.service(FrameworkServlet.java:897)
```

**Key elements:**
- **Exception type**: `NullPointerException`
- **Error message**: "Cannot invoke method on null object"
- **Origin**: `UserService.java:45` (first app frame)
- **Call chain**: Controller → Service

### Finding the Code

```bash
# Direct file:line lookup
cat src/main/java/com/example/UserService.java | head -50 | tail -10

# Search for class
find . -name "UserService.java"

# Search for method
grep -n "getUser" src/main/java/com/example/UserService.java
```

### Stack Trace Patterns by Language

**Java:**
```
at package.Class.method(File.java:line)
```
Search: `grep -r "class ClassName" --include="*.java"`

**Go:**
```
package/file.go:line +0xaddr
func (receiver) Method()
```
Search: `grep -r "func.*MethodName" --include="*.go"`

**Python:**
```
File "/path/file.py", line N, in function_name
```
Search: `grep -r "def function_name" --include="*.py"`

**JavaScript/TypeScript:**
```
at ClassName.methodName (file.js:line:col)
at /path/file.ts:line:col
```
Search: `grep -r "methodName" --include="*.{js,ts}"`

---

## Instrumentation Patterns

### HTTP Endpoints

| Framework | Pattern | Code Search |
|-----------|---------|-------------|
| Express.js | `app.get('/path', handler)` | `grep -r "app\.\(get\|post\|put\)"` |
| Spring | `@GetMapping("/path")` | `grep -r "@.*Mapping"` |
| Gin (Go) | `r.GET("/path", handler)` | `grep -r "\.GET\|\.POST"` |
| FastAPI | `@app.get("/path")` | `grep -r "@app\.\(get\|post\)"` |

### Database Operations

| Library | Pattern | Code Search |
|---------|---------|-------------|
| GORM | `db.Find(&users)` | `grep -r "\.Find\|\.Create\|\.Update"` |
| JPA | `repository.findById()` | `grep -r "repository\.\|@Query"` |
| SQLAlchemy | `session.query()` | `grep -r "session\.query\|\.execute"` |
| Prisma | `prisma.user.findMany()` | `grep -r "prisma\.\w+\.\w+"` |

### External Calls

| Library | Pattern | Code Search |
|---------|---------|-------------|
| axios | `axios.get(url)` | `grep -r "axios\.\(get\|post\)"` |
| http.Client | `client.Do(req)` | `grep -r "http\.Client\|\.Do("` |
| requests | `requests.get(url)` | `grep -r "requests\.\(get\|post\)"` |
| fetch | `fetch(url)` | `grep -r "fetch("` |

---

## Code Search Strategies

### Finding Error Handlers

```bash
# Try-catch blocks
grep -rn "catch\|except\|rescue" --include="*.{java,py,rb,ts,js}"

# Error callbacks
grep -rn "\.catch\|onError\|handleError" --include="*.{ts,js}"

# Go error handling
grep -rn "if err != nil" --include="*.go"
```

### Finding Configuration

```bash
# Environment variables
grep -rn "os\.Getenv\|process\.env\|environ" --include="*.{go,py,ts,js}"

# Config files
find . -name "*.yaml" -o -name "*.json" -o -name "*.toml" | head -20

# Feature flags
grep -rn "feature.*flag\|toggle\|experiment" --include="*.{go,java,py,ts,js}"
```

### Finding Dependencies

```bash
# Import statements
grep -rn "^import\|^from.*import\|require(" --include="*.{go,java,py,ts,js}"

# Package files
cat package.json go.mod requirements.txt pom.xml 2>/dev/null
```

---

## Change Correlation

### Recent Changes to Suspect Code

```bash
# Git log for specific file
git log --oneline -10 path/to/file.java

# Changes in time window
git log --since="2024-01-01" --until="2024-01-02" --oneline

# Diff with previous commit
git diff HEAD~1 path/to/file.java

# Who changed this line
git blame path/to/file.java | grep "line_content"
```

### Finding Related Deployments

```bash
# Recent tags/releases
git tag --sort=-creatordate | head -10

# Commits since last release
git log $(git describe --tags --abbrev=0)..HEAD --oneline

# Changes to specific path
git log --oneline -20 -- path/to/service/
```

### Change Impact Analysis

```bash
# Files changed together
git log --format="%H" --since="1 week ago" | while read commit; do
  git show --name-only $commit
done | sort | uniq -c | sort -rn

# Functions changed
git diff HEAD~5 --stat
git diff HEAD~5 -p | grep "^@@"
```

---

## Language-Specific Patterns

### Java/Spring

```bash
# Controllers
grep -rn "@RestController\|@Controller" --include="*.java"

# Services
grep -rn "@Service" --include="*.java"

# Repositories
grep -rn "@Repository\|extends JpaRepository" --include="*.java"

# Exception handlers
grep -rn "@ExceptionHandler\|@ControllerAdvice" --include="*.java"
```

### Go

```bash
# HTTP handlers
grep -rn "func.*http\.Handler\|func.*gin\.Context" --include="*.go"

# Error definitions
grep -rn "errors\.New\|fmt\.Errorf" --include="*.go"

# Main entry point
grep -rn "^func main()" --include="*.go"
```

### Python/FastAPI/Django

```bash
# API endpoints
grep -rn "@app\.\(get\|post\)\|def.*request" --include="*.py"

# Exception handlers
grep -rn "@app\.exception_handler\|def handle_exception" --include="*.py"

# Models
grep -rn "class.*Model\|class.*BaseModel" --include="*.py"
```

### TypeScript/Node.js

```bash
# Express routes
grep -rn "router\.\(get\|post\)\|app\.\(get\|post\)" --include="*.ts"

# Error middleware
grep -rn "errorHandler\|app\.use.*err" --include="*.ts"

# Service classes
grep -rn "class.*Service" --include="*.ts"
```

---

## Mapping Workflow Example

**Scenario**: Error rate spike on `/api/users` endpoint

1. **Query logs**:
   ```logql
   {service="api"} | json | path="/api/users" | level="error"
   ```
   → Found: `NullPointerException in UserService.getUser`

2. **Find code**:
   ```bash
   find . -name "UserService.java"
   grep -n "getUser" src/.../UserService.java
   ```
   → Line 45: `return user.getProfile().getName();`

3. **Identify issue**:
   `user.getProfile()` returns null for new users

4. **Check changes**:
   ```bash
   git log --oneline -5 src/.../UserService.java
   git show abc123
   ```
   → Yesterday's commit removed null check

5. **Verify fix**:
   Add null check, deploy, monitor error rate
