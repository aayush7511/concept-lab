package bridge

import (
	"net/http"
)

type Config struct {
	TokenURL, FHIRURL, ClientID, ClientSecret string
	Concurrency                               int
}

// New wires one shared cache and a timeout-bound authenticated FHIR client.
// HTTP is allowed for localhost practice. Use HTTPS for external services.
func New(c Config) (http.Handler, error) {
	panic("TODO(T8): implement")
}
