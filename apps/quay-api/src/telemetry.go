package main

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type telemetry struct {
	base, service, status string
	client                *http.Client
}

func startOtel(ctx runtimeContext) *telemetry {
	return &telemetry{
		base:    strings.TrimRight(ctx.ExporterEndpoint, "/"),
		service: ctx.Service,
		status:  "healthy",
		client:  &http.Client{Timeout: 2 * time.Second},
	}
}

func (t *telemetry) emit(name string) {
	now := time.Now().UnixNano()
	traceID := fmt.Sprintf("%032x", uint64(now))
	spanID := fmt.Sprintf("%016x", uint64(now))
	traceBody := fmt.Sprintf("{\"resourceSpans\":[{\"resource\":{\"attributes\":[{\"key\":\"service.name\",\"value\":{\"stringValue\":\"%s\"}}]},\"scopeSpans\":[{\"spans\":[{\"traceId\":\"%s\",\"spanId\":\"%s\",\"name\":\"%s\",\"kind\":1,\"startTimeUnixNano\":\"%d\",\"endTimeUnixNano\":\"%d\",\"status\":{\"code\":1}}]}]}]}", t.service, traceID, spanID, name, now, now+1e6)
	logBody := fmt.Sprintf("{\"resourceLogs\":[{\"resource\":{\"attributes\":[{\"key\":\"service.name\",\"value\":{\"stringValue\":\"%s\"}}]},\"scopeLogs\":[{\"logRecords\":[{\"timeUnixNano\":\"%d\",\"severityNumber\":9,\"body\":{\"stringValue\":\"request\"}}]}]}]}", t.service, now)
	if err := t.post("/v1/traces", traceBody); err != nil {
		t.status = "degraded"
	}
	_ = t.post("/v1/logs", logBody)
}

func (t *telemetry) increment(name string) {
	now := time.Now().UnixNano()
	body := fmt.Sprintf("{\"resourceMetrics\":[{\"resource\":{\"attributes\":[{\"key\":\"service.name\",\"value\":{\"stringValue\":\"%s\"}}]},\"scopeMetrics\":[{\"metrics\":[{\"name\":\"%s\",\"sum\":{\"aggregationTemporality\":2,\"isMonotonic\":true,\"dataPoints\":[{\"asInt\":\"1\",\"startTimeUnixNano\":\"%d\",\"timeUnixNano\":\"%d\"}]}}]}]}]}", t.service, name, now, now)
	if err := t.post("/v1/metrics", body); err != nil {
		t.status = "degraded"
	}
}

func (t *telemetry) record(name string, value float64) {
	now := time.Now().UnixNano()
	body := fmt.Sprintf("{\"resourceMetrics\":[{\"resource\":{\"attributes\":[{\"key\":\"service.name\",\"value\":{\"stringValue\":\"%s\"}}]},\"scopeMetrics\":[{\"metrics\":[{\"name\":\"%s\",\"histogram\":{\"aggregationTemporality\":2,\"dataPoints\":[{\"count\":\"1\",\"sum\":%g,\"timeUnixNano\":\"%d\"}]}}]}]}]}", t.service, name, value, now)
	if err := t.post("/v1/metrics", body); err != nil {
		t.status = "degraded"
	}
}

func (t *telemetry) post(path, body string) error {
	req, err := http.NewRequestWithContext(context.Background(), http.MethodPost, t.base+path, strings.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("content-type", "application/json")
	res, err := t.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	_, _ = io.Copy(io.Discard, res.Body)
	return nil
}
