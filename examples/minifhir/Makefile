t%:
	go test -count=1 -v -run '^TestT$*_' ./internal/bridge

test:
	go test -count=1 ./...
race:
	go test -race -count=1 ./...
run:
	go run ./cmd/server
.PHONY: test race run
mock:
	go run ./cmd/mock
.PHONY: mock
