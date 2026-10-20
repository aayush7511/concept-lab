// Local synthetic OAuth + FHIR server; no external account needed.
package main

import (
	"encoding/json"
	"log"
	"minifhir/internal/bridge"
	"net/http"
)

func main() {
	m := http.NewServeMux()
	m.HandleFunc("POST /token", func(w http.ResponseWriter, r *http.Request) {
		id, secret, ok := r.BasicAuth()
		if !ok || id != "demo" || secret != "demo" {
			w.WriteHeader(401)
			return
		}
		if err := r.ParseForm(); err != nil || r.Form.Get("grant_type") != "client_credentials" {
			w.WriteHeader(400)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(bridge.Token{AccessToken: "synthetic-token", TokenType: "Bearer", ExpiresIn: 60})
	})
	m.HandleFunc("GET /Patient/{id}", func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer synthetic-token" {
			w.WriteHeader(401)
			return
		}
		id := r.PathValue("id")
		if id == "missing" {
			w.WriteHeader(404)
			return
		}
		w.Header().Set("Content-Type", "application/fhir+json")
		_ = json.NewEncoder(w).Encode(bridge.FHIRPatient{ResourceType: "Patient", ID: id, Name: []bridge.Name{{Use: "official", Given: []string{" Ada "}, Family: "Lovelace"}}, Gender: "female", BirthDate: "2000-02-29"})
	})
	log.Print("synthetic upstream on :9090 (demo/demo)")
	log.Fatal(http.ListenAndServe(":9090", m))
}
