// Package bridge implements a small, synthetic FHIR R4 subset for OA practice.
package bridge

import (
	"context"
	"errors"
	"time"
)

var ErrInvalid = errors.New("invalid input")
var ErrNotFound = errors.New("patient not found")
var ErrUpstream = errors.New("upstream failure")

type Name struct {
	Use    string   `json:"use"`
	Family string   `json:"family"`
	Given  []string `json:"given"`
}
type Telecom struct {
	System string `json:"system"`
	Value  string `json:"value"`
}
type FHIRPatient struct {
	ResourceType string    `json:"resourceType"`
	ID           string    `json:"id"`
	Name         []Name    `json:"name"`
	BirthDate    string    `json:"birthDate"`
	Gender       string    `json:"gender"`
	Telecom      []Telecom `json:"telecom"`
}
type Patient struct {
	ID        string `json:"id"`
	FullName  string `json:"full_name"`
	BirthDate string `json:"birth_date"`
	Gender    string `json:"gender"`
	Email     string `json:"email"`
}
type Token struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
}
type TokenSource interface {
	AccessToken(context.Context) (string, error)
}
type Fetcher interface {
	Fetch(context.Context, string) (FHIRPatient, error)
}
type Importer interface {
	Import(context.Context, []string) ([]Patient, error)
}
type Sleeper func(context.Context, time.Duration) error
