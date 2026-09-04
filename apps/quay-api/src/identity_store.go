package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"os"
)

type IdentityStore struct {
	Enabled bool
	users   []BenchUser
	byID    map[string]BenchUser
	sessions map[string]string
}

func createJsonIdentityStore(enabled bool, seedPath string) *IdentityStore {
	store := &IdentityStore{
		Enabled:  enabled,
		byID:     map[string]BenchUser{},
		sessions: map[string]string{},
	}
	if enabled {
		store.users = loadUsers(seedPath)
		for _, u := range store.users {
			store.byID[u.ID] = u
		}
	}
	return store
}

func (s *IdentityStore) ListUsers(limit int) []BenchUser {
	if limit < 1 {
		limit = 1
	}
	if limit > len(s.users) {
		limit = len(s.users)
	}
	return s.users[:limit]
}

func (s *IdentityStore) Login(userID string) (token string, user BenchUser, eval EvaluationContext, ok bool) {
	user, ok = s.byID[userID]
	if !ok {
		return "", BenchUser{}, EvaluationContext{}, false
	}
	buf := make([]byte, 16)
	_, _ = rand.Read(buf)
	token = hex.EncodeToString(buf)
	s.sessions[token] = user.ID
	return token, user, toEvaluationContext(user), true
}

func (s *IdentityStore) Session(token string) (user BenchUser, eval EvaluationContext, ok bool) {
	if token == "" {
		return BenchUser{}, EvaluationContext{}, false
	}
	userID, ok := s.sessions[token]
	if !ok {
		return BenchUser{}, EvaluationContext{}, false
	}
	user, ok = s.byID[userID]
	if !ok {
		return BenchUser{}, EvaluationContext{}, false
	}
	return user, toEvaluationContext(user), true
}

func loadUsers(seedPath string) []BenchUser {
	raw, err := os.ReadFile(seedPath)
	if err != nil {
		return nil
	}
	var seed struct {
		Users []BenchUser `json:"users"`
	}
	if err := json.Unmarshal(raw, &seed); err != nil {
		return nil
	}
	return seed.Users
}
