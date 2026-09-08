package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

const corsMethods = "GET, POST, PUT, DELETE, OPTIONS"
const corsHeaders = "content-type, authorization"

func health(ctx runtimeContext, status string) map[string]any {
	return map[string]any{
		"ok": true, "service": ctx.Service, "environment": ctx.Environment,
		"destination": ctx.Destination,
		"exporter": map[string]any{
			"endpoint": ctx.ExporterEndpoint, "status": status,
			"signals": []string{"traces", "logs", "metrics"},
		},
	}
}

func withCors(w http.ResponseWriter) {
	w.Header().Set("access-control-allow-origin", "*")
	w.Header().Set("access-control-allow-methods", corsMethods)
	w.Header().Set("access-control-allow-headers", corsHeaders)
}

func listen(service string, defaultPort int, html bool) {
	ctx := load(service)
	tel := startOtel(ctx)
	identity := createJsonIdentityStore(
		getenv("IDENTITY_ENABLED", "") == "true",
		getenv("IDENTITY_SEED_PATH", "/data/identity/seed.json"),
	)
	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		tel.emit("GET /health")
		withCors(w)
		w.Header().Set("content-type", "application/json")
		_ = json.NewEncoder(w).Encode(health(ctx, tel.status))
	})
	mux.HandleFunc("/auth/config", func(w http.ResponseWriter, r *http.Request) {
		tel.emit(r.Method + " /auth/config")
		withCors(w)
		if r.Method != http.MethodGet {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"error": "method not allowed"})
			return
		}
		handleAuthConfig(identity, w, r)
	})
	mux.HandleFunc("/auth/users", func(w http.ResponseWriter, r *http.Request) {
		tel.emit(r.Method + " /auth/users")
		withCors(w)
		if r.Method != http.MethodGet {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"error": "method not allowed"})
			return
		}
		handleAuthUsers(identity, w, r)
	})
	mux.HandleFunc("/auth/session", func(w http.ResponseWriter, r *http.Request) {
		tel.emit(r.Method + " /auth/session")
		withCors(w)
		handleAuthSession(identity, w, r)
	})
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		tel.emit("GET /")
		withCors(w)
		if html {
			w.Header().Set("content-type", "text/html; charset=utf-8")
			fmt.Fprintf(w, "<!doctype html><html><body><h1>%s</h1><p>env=%s</p></body></html>", ctx.Service, ctx.Environment)
		} else {
			fmt.Fprintln(w, ctx.Service)
		}
	})
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		withCors(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		mux.ServeHTTP(w, r)
	})
	p := port(defaultPort)
	fmt.Printf("%s listening on :%d APP_ENV=%s\n", ctx.Service, p, ctx.Environment)
	_ = http.ListenAndServe(fmt.Sprintf(":%d", p), handler)
}
