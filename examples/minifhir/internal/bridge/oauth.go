package bridge

import (
	"context"
	"net/http"
)

type OAuth struct {
	URL, ClientID, ClientSecret string
	HTTP                        *http.Client
}

// FetchToken exchanges client credentials using HTTP Basic authentication.
func (o OAuth) FetchToken(ctx context.Context) (Token, error) {
	panic("TODO(T2): implement")
}
