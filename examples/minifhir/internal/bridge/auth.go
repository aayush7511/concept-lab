package bridge

import (
	"context"
	"net/http"
	"time"
)

type TokenCache struct {
	Fetch func(context.Context) (Token, error)
	Now   func() time.Time
	Skew  time.Duration
	// TODO(T3): add what you need
}

// AccessToken serializes refreshes. Failed exchanges must not replace cached state.
func (c *TokenCache) AccessToken(ctx context.Context) (string, error) {
	panic("TODO(T3): implement")
}

type AuthTransport struct {
	Source TokenSource
	Base   http.RoundTripper
}

// RoundTrip must clone the request before attaching Authorization.
func (a AuthTransport) RoundTrip(r *http.Request) (*http.Response, error) {
	panic("TODO(T3): implement")
}
