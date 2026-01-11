# Query Templates

## Table of Contents
- [RED Method Queries](#red-method-queries)
- [USE Method Queries](#use-method-queries)
- [Error Analysis](#error-analysis)
- [Latency Analysis](#latency-analysis)
- [Dependency Analysis](#dependency-analysis)
- [Anomaly Detection](#anomaly-detection)
- [TraceQL Patterns](#traceql-patterns)
- [LogQL Patterns](#logql-patterns)

---

## RED Method Queries

**R**ate, **E**rrors, **D**uration - for services

### Rate (Throughput)

```promql
# Request rate per second
sum(rate(http_requests_total[5m]))

# By service
sum by (service) (rate(http_requests_total[5m]))

# By endpoint
sum by (path) (rate(http_requests_total[5m]))

# Rate change vs 1 hour ago
sum(rate(http_requests_total[5m]))
  / sum(rate(http_requests_total[5m] offset 1h))
```

### Errors

```promql
# Error rate (percentage)
sum(rate(http_requests_total{status=~"5.."}[5m]))
  / sum(rate(http_requests_total[5m])) * 100

# Error rate by service
sum by (service) (rate(http_requests_total{status=~"5.."}[5m]))
  / sum by (service) (rate(http_requests_total[5m])) * 100

# Error count spike detection
sum(rate(http_requests_total{status=~"5.."}[5m]))
  > 2 * sum(rate(http_requests_total{status=~"5.."}[5m] offset 1h))
```

### Duration

```promql
# Latency percentiles
histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
histogram_quantile(0.90, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# Average duration
sum(rate(http_request_duration_seconds_sum[5m]))
  / sum(rate(http_request_duration_seconds_count[5m]))

# Latency by endpoint
histogram_quantile(0.99, sum by (path, le) (rate(http_request_duration_seconds_bucket[5m])))
```

---

## USE Method Queries

**U**tilization, **S**aturation, **E**rrors - for resources

### CPU

```promql
# Utilization (how busy)
sum(rate(container_cpu_usage_seconds_total[5m])) by (container)
  / sum(container_spec_cpu_quota / container_spec_cpu_period) by (container)

# Saturation (throttling)
sum(rate(container_cpu_cfs_throttled_seconds_total[5m])) by (container)

# System-wide CPU
1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m]))
```

### Memory

```promql
# Utilization
container_memory_working_set_bytes / container_spec_memory_limit_bytes

# Saturation (OOM pressure)
rate(container_oom_events_total[5m])

# Available memory
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes
```

### Disk

```promql
# Utilization
1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)

# Saturation (I/O wait)
rate(node_disk_io_time_weighted_seconds_total[5m])

# IOPS
sum(rate(node_disk_reads_completed_total[5m])) + sum(rate(node_disk_writes_completed_total[5m]))
```

### Network

```promql
# Utilization (bandwidth)
rate(node_network_receive_bytes_total[5m]) + rate(node_network_transmit_bytes_total[5m])

# Saturation (drops)
rate(node_network_receive_drop_total[5m]) + rate(node_network_transmit_drop_total[5m])

# Errors
rate(node_network_receive_errs_total[5m]) + rate(node_network_transmit_errs_total[5m])
```

---

## Error Analysis

### Error Breakdown

```promql
# By status code
sum by (status) (rate(http_requests_total{status=~"[45].."}[5m]))

# By error type
sum by (error_type) (rate(errors_total[5m]))

# Top error-producing endpoints
topk(10, sum by (path) (rate(http_requests_total{status=~"5.."}[5m])))

# Top error-producing instances
topk(5, sum by (instance) (rate(http_requests_total{status=~"5.."}[5m])))
```

### Error Patterns

```promql
# Sustained error rate (errors for >5 min)
sum(rate(http_requests_total{status=~"5.."}[5m])) > 0.1
  and sum(rate(http_requests_total{status=~"5.."}[5m] offset 5m)) > 0.1

# Error rate increasing
deriv(sum(rate(http_requests_total{status=~"5.."}[5m]))[10m:1m]) > 0

# Error budget burn rate (SLO)
sum(rate(http_requests_total{status=~"5.."}[1h]))
  / sum(rate(http_requests_total[1h]))
  / (1 - 0.999)  # For 99.9% SLO
```

### Timeout vs Server Errors

```promql
# 504 Gateway Timeout
sum(rate(http_requests_total{status="504"}[5m]))

# 503 Service Unavailable
sum(rate(http_requests_total{status="503"}[5m]))

# 500 Internal Server Error
sum(rate(http_requests_total{status="500"}[5m]))

# Client errors (4xx)
sum(rate(http_requests_total{status=~"4.."}[5m]))
```

---

## Latency Analysis

### Latency Distribution

```promql
# Full percentile spread
histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))  # median
histogram_quantile(0.75, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
histogram_quantile(0.90, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
histogram_quantile(0.999, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
```

### Latency Hotspots

```promql
# Slowest endpoints
topk(10, histogram_quantile(0.99, sum by (path, le) (rate(http_request_duration_seconds_bucket[5m]))))

# Slowest services
topk(5, histogram_quantile(0.99, sum by (service, le) (rate(http_request_duration_seconds_bucket[5m]))))

# Latency by instance (find bad pods)
histogram_quantile(0.99, sum by (instance, le) (rate(http_request_duration_seconds_bucket[5m])))
```

### Latency Comparison

```promql
# Current vs 1 hour ago
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
  / histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m] offset 1h)) by (le))

# Current vs yesterday
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
  / histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m] offset 1d)) by (le))
```

---

## Dependency Analysis

### Database

```promql
# Query latency
histogram_quantile(0.99, sum(rate(db_query_duration_seconds_bucket[5m])) by (le, query_type))

# Connection pool
db_connections_active / db_connections_max

# Query rate
sum by (query_type) (rate(db_queries_total[5m]))

# Slow queries
topk(10, histogram_quantile(0.99, sum by (query, le) (rate(db_query_duration_seconds_bucket[5m]))))
```

### External APIs

```promql
# Client request latency
histogram_quantile(0.99, sum by (host, le) (rate(http_client_duration_seconds_bucket[5m])))

# Client error rate
sum by (host) (rate(http_client_requests_total{status=~"5.."}[5m]))
  / sum by (host) (rate(http_client_requests_total[5m]))

# Circuit breaker status
circuit_breaker_state{service="$service"}  # 0=closed, 1=open, 0.5=half-open
```

### Cache

```promql
# Hit rate
sum(rate(cache_hits_total[5m])) / sum(rate(cache_requests_total[5m]))

# Miss rate trend
1 - (sum(rate(cache_hits_total[5m])) / sum(rate(cache_requests_total[5m])))

# Cache latency
histogram_quantile(0.99, sum(rate(cache_operation_duration_seconds_bucket[5m])) by (le))
```

### Message Queue

```promql
# Queue depth
rabbitmq_queue_messages or kafka_consumer_lag

# Consumer lag
sum by (topic) (kafka_consumergroup_lag)

# Processing rate
sum(rate(messages_processed_total[5m]))

# Dead letter queue
sum(dead_letter_queue_messages)
```

---

## Anomaly Detection

### Deviation from Normal

```promql
# Z-score: how many std devs from mean
(
  sum(rate(http_requests_total[5m]))
  - avg_over_time(sum(rate(http_requests_total[5m]))[1d:5m])
)
/ stddev_over_time(sum(rate(http_requests_total[5m]))[1d:5m])

# Significant change (>2 std devs)
abs(
  sum(rate(http_requests_total[5m]))
  - avg_over_time(sum(rate(http_requests_total[5m]))[1d:5m])
) > 2 * stddev_over_time(sum(rate(http_requests_total[5m]))[1d:5m])
```

### Sudden Changes

```promql
# Rate of change
deriv(sum(rate(http_requests_total[5m]))[10m:1m])

# Spike detection (50% increase in 5 min)
sum(rate(http_requests_total[5m]))
  > 1.5 * sum(rate(http_requests_total[5m] offset 5m))

# Drop detection (50% decrease)
sum(rate(http_requests_total[5m]))
  < 0.5 * sum(rate(http_requests_total[5m] offset 5m))
```

---

## TraceQL Patterns

### Error Traces

```
# All error traces
{ status = error }

# Errors for specific service
{ status = error && resource.service.name = "api" }

# Errors with specific exception
{ status = error && span.exception.type = "NullPointerException" }
```

### Slow Traces

```
# Traces over 1 second
{ duration > 1s }

# Slow traces for endpoint
{ duration > 500ms && span.http.route = "/api/users" }

# Find where time is spent
{ duration > 2s } | select(span.duration, span.name, resource.service.name)
```

### Cross-Service

```
# Traces touching database
{ span.db.system = "postgresql" }

# Traces with external calls
{ span.http.host =~ ".*external.*" }

# Traces spanning multiple services
{ resource.service.name = "frontend" } >> { resource.service.name = "api" }
```

---

## LogQL Patterns

### Error Logs

```logql
# All errors
{service="$service"} | json | level="error"

# Errors with stack traces
{service="$service"} |~ "(?i)(exception|stacktrace|panic)"

# Error rate metric
sum by (service) (count_over_time({service=~".+"} | json | level="error" [5m]))
```

### Pattern Extraction

```logql
# Extract status codes
{service="$service"} | pattern `<_> <status> <_>` | status >= 500

# Extract latency
{service="$service"} | pattern `latency=<latency>ms` | latency > 1000

# JSON field extraction
{service="$service"} | json | user_id != "" | line_format "{{.message}}"
```

### Correlation

```logql
# Logs with trace ID
{service="$service"} | json | trace_id != ""

# Logs around specific time
{service="$service"} | json
# Use time range selector in query

# Logs for specific request
{service="$service"} | json | request_id = "$request_id"
```

### Aggregations

```logql
# Error count by type
sum by (error_type) (count_over_time({service="$service"} | json | level="error" [5m]))

# Log volume by level
sum by (level) (count_over_time({service="$service"} | json [5m]))

# Top error messages
topk(10, sum by (message) (count_over_time({service="$service"} | json | level="error" [1h])))
```
