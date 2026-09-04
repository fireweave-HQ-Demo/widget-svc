package main

import (
	"encoding/json"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
)

var bearerRe = regexp.MustCompile(`(?i)^Bearer\s+(.+)$`)

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("content-type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func bearer(r *http.Request) string {
	m := bearerRe.FindStringSubmatch(r.Header.Get("authorization"))
	if len(m) < 2 {
		return ""
	}
	return strings.TrimSpace(m[1])
}

func handleAuthConfig(store *IdentityStore, w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"enabled": store.Enabled})
}

func handleAuthUsers(store *IdentityStore, w http.ResponseWriter, r *http.Request) {
	if !store.Enabled {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "identity disabled"})
		return
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit == 0 {
		limit = 50
	}
	writeJSON(w, http.StatusOK, map[string]any{"users": store.ListUsers(limit)})
}

func handleAuthSession(store *IdentityStore, w http.ResponseWriter, r *http.Request) {
	if !store.Enabled {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "identity disabled"})
		return
	}
	switch r.Method {
	case http.MethodGet:
		user, eval, ok := store.Session(bearer(r))
		if !ok {
			writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "no session"})
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"user": user, "evaluationContext": eval})
	case http.MethodPost:
		body, err := io.ReadAll(r.Body)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid json"})
			return
		}
		var payload struct {
			UserID string `json:"userId"`
		}
		if err := json.Unmarshal(body, &payload); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid json"})
			return
		}
		userID := strings.TrimSpace(payload.UserID)
		if userID == "" {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "userId required"})
			return
		}
		token, user, eval, ok := store.Login(userID)
		if !ok {
			writeJSON(w, http.StatusNotFound, map[string]any{"error": "unknown user"})
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{
			"sessionToken": token, "user": user, "evaluationContext": eval,
		})
	case http.MethodDelete:
		writeJSON(w, http.StatusOK, map[string]any{"ok": true})
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"error": "method not allowed"})
	}
}
