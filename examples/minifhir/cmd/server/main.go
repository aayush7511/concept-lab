package main

import (
	"context"
	"errors"
	"log"
	"minifhir/internal/bridge"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	h, err := bridge.New(bridge.Config{TokenURL: os.Getenv("TOKEN_URL"), FHIRURL: os.Getenv("FHIR_URL"), ClientID: os.Getenv("CLIENT_ID"), ClientSecret: os.Getenv("CLIENT_SECRET"), Concurrency: 4})
	if err != nil {
		log.Fatal(err)
	}
	s := &http.Server{Addr: ":8080", Handler: h, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 30 * time.Second, IdleTimeout: 60 * time.Second}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	done := make(chan struct{})
	go func() {
		defer close(done)
		<-ctx.Done()
		shutdown, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := s.Shutdown(shutdown); err != nil {
			log.Print(err)
		}
	}()
	if err := s.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
	stop()
	<-done
}
