package main

import (
	"os"
	"strconv"
)

type runtimeContext struct {
	Service, Environment, Destination, ExporterEndpoint string
}

func load(service string) runtimeContext {
	return runtimeContext{
		Service:          service,
		Environment:      getenv("APP_ENV", "dev"),
		Destination:      getenv("BENCH_DESTINATION", "control"),
		ExporterEndpoint: getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://collector:4318"),
	}
}

func getenv(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

func port(fallback int) int {
	if v := os.Getenv("PORT"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}
