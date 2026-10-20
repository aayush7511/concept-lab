package bridge

import (
	"context"
	"net/http"
	"regexp"
)

// ValidID accepts the FHIR logical-ID subset [A-Za-z0-9.-]{1,64}.
func ValidID(id string) bool { return regexp.MustCompile(`^[A-Za-z0-9.\-]{1,64}$`).MatchString(id) }

type FHIRClient struct {
	BaseURL string
	HTTP    *http.Client
}

func (c FHIRClient) Fetch(ctx context.Context, id string) (FHIRPatient, error) {
	panic("TODO(T4): implement")
}
