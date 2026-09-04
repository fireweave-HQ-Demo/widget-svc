package main

import (
	"strconv"
	"strings"
	"time"
)

type BenchUser struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Org     string `json:"org"`
	Plan    string `json:"plan"`
	Country string `json:"country"`
}

type EvaluationContext struct {
	DistinctID string            `json:"distinctId"`
	Properties map[string]any    `json:"properties"`
}

func userIndex(id string) int {
	raw := strings.TrimPrefix(id, "user_")
	n, err := strconv.Atoi(raw)
	if err != nil {
		return 0
	}
	return n
}

func toEvaluationContext(user BenchUser) EvaluationContext {
	idx := userIndex(user.ID)
	base := time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC)
	signup := base.AddDate(0, 0, idx)
	return EvaluationContext{
		DistinctID: user.ID,
		Properties: map[string]any{
			"email":      user.Email,
			"name":       user.Name,
			"org":        user.Org,
			"plan":       user.Plan,
			"country":    user.Country,
			"signupDate": signup.Format("2006-01-02"),
			"beta":       idx%3 == 0,
		},
	}
}
