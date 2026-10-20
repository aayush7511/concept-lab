package bridge

import (
	"encoding/json"
	"net/http"
)

type Handler struct{ Pipeline Importer }
type ErrorBody struct {
	Error string `json:"error"`
}

// WriteJSON is provided boilerplate. Handlers must decide status before writing.
func WriteJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// Routes serves GET /healthz and POST /imports. Import requests contain patient_ids.
func (h Handler) Routes() http.Handler {
	panic("TODO(T1): implement")
}
