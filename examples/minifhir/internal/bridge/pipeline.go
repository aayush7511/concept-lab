package bridge

import (
	"context"
)

type Pipeline struct {
	Client Fetcher
	Limit  int
}

// Import preserves order and duplicates, returns no partial output on failure.
func (p Pipeline) Import(ctx context.Context, ids []string) ([]Patient, error) {
	panic("TODO(T7): implement")
}
