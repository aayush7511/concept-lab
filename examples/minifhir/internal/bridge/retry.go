package bridge

import (
	"context"
	"net/http"
	"time"
)

type RetryTransport struct {
	Base        http.RoundTripper
	MaxAttempts int
	Delay, Cap  time.Duration
	Sleep       Sleeper
}

// Backoff uses a one-based failed attempt and saturates instead of overflowing.
func Backoff(base, cap time.Duration, attempt int) time.Duration {
	panic("TODO(T6): implement")
}

// RoundTrip retries only GET network errors, 429, 502, 503 and 504.
func (t RetryTransport) RoundTrip(r *http.Request) (*http.Response, error) {
	panic("TODO(T6): implement")
}
func Sleep(ctx context.Context, d time.Duration) error {
	timer := time.NewTimer(d)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-timer.C:
		return nil
	}
}
