package bridge

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

type importFn func(context.Context, []string) ([]Patient, error)

func (f importFn) Import(c context.Context, s []string) ([]Patient, error) { return f(c, s) }

type fetchFn func(context.Context, string) (FHIRPatient, error)

func (f fetchFn) Fetch(c context.Context, s string) (FHIRPatient, error) { return f(c, s) }

type roundFn func(*http.Request) (*http.Response, error)

func (f roundFn) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }
func raw(id string) FHIRPatient                                     { return FHIRPatient{ResourceType: "Patient", ID: id} }
func TestT1_Contract(t *testing.T) {
	for _, tc := range []struct {
		body          string
		err           error
		status, calls int
	}{{`{"patient_ids":["p1"]}`, nil, 200, 1}, {`{"patient_ids":[]}`, nil, 400, 0}, {`{"patient_ids":["../x"]}`, nil, 400, 0}, {`{"patient_ids":["x"],"extra":1}`, nil, 400, 0}, {`{"patient_ids":["x"]} {}`, nil, 400, 0}, {`{"patient_ids":["x"]}`, ErrNotFound, 404, 1}, {`{"patient_ids":["x"]}`, errors.New("secret"), 502, 1}, {`{"patient_ids":["x"]}`, ErrInvalid, 400, 1}, {strings.Repeat(" ", 1<<20) + `{}`, nil, 400, 0}} {
		calls := 0
		h := Handler{importFn(func(context.Context, []string) ([]Patient, error) { calls++; return []Patient{{ID: "p1"}}, tc.err })}.Routes()
		w := httptest.NewRecorder()
		h.ServeHTTP(w, httptest.NewRequest("POST", "/imports", strings.NewReader(tc.body)))
		if w.Code != tc.status || calls != tc.calls || !strings.Contains(w.Header().Get("Content-Type"), "json") {
			t.Fatalf("%d calls=%d", w.Code, calls)
		}
		if strings.Contains(w.Body.String(), "secret") {
			t.Fatal("leaked error")
		}
	}
	w := httptest.NewRecorder()
	Handler{}.Routes().ServeHTTP(w, httptest.NewRequest("GET", "/healthz", nil))
	if w.Code != 200 {
		t.Fatal(w.Code)
	}
}
func TestT2_TokenExchange(t *testing.T) {
	for _, tc := range []struct {
		body string
		ok   bool
	}{{`{"access_token":"ok","token_type":"Bearer","expires_in":60}`, true}, {`{"access_token":"","token_type":"Bearer","expires_in":60}`, false}, {`{"access_token":"ok","token_type":"other","expires_in":60}`, false}, {`{"access_token":"ok","token_type":"Bearer","expires_in":0}`, false}, {`broken`, false}} {
		s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			id, secret, ok := r.BasicAuth()
			if !ok || id != "id" || secret != "secret" || r.Method != "POST" {
				t.Error("bad auth")
			}
			if e := r.ParseForm(); e != nil || r.Form.Get("grant_type") != "client_credentials" {
				t.Error("bad grant")
			}
			fmt.Fprint(w, tc.body)
		}))
		tok, err := (OAuth{s.URL, "id", "secret", s.Client()}).FetchToken(context.Background())
		s.Close()
		if tc.ok && (err != nil || tok.AccessToken != "ok") {
			t.Fatal(tok, err)
		}
		if !tc.ok && !errors.Is(err, ErrUpstream) {
			t.Fatal(err)
		}
	}
}
func TestT3_CacheAndTransport(t *testing.T) {
	now := time.Unix(100, 0)
	var calls atomic.Int32
	c := &TokenCache{Now: func() time.Time { return now }, Skew: 10 * time.Second, Fetch: func(context.Context) (Token, error) { calls.Add(1); return Token{"abc", "Bearer", 60}, nil }}
	var wg sync.WaitGroup
	for i := 0; i < 40; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			v, e := c.AccessToken(context.Background())
			if e != nil || v != "abc" {
				t.Error(v, e)
			}
		}()
	}
	wg.Wait()
	if calls.Load() != 1 {
		t.Fatal(calls.Load())
	}
	now = now.Add(50 * time.Second)
	if _, e := c.AccessToken(context.Background()); e != nil || calls.Load() != 2 {
		t.Fatal("boundary", e, calls.Load())
	}
	req := httptest.NewRequest("GET", "http://example.test", nil)
	a := AuthTransport{c, roundFn(func(r *http.Request) (*http.Response, error) {
		if r.Header.Get("Authorization") != "Bearer abc" {
			t.Error("missing bearer")
		}
		return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(""))}, nil
	})}
	resp, e := a.RoundTrip(req)
	if e != nil {
		t.Fatal(e)
	}
	resp.Body.Close()
	if req.Header.Get("Authorization") != "" {
		t.Fatal("mutated request")
	}
	now = now.Add(time.Minute)
	c.Fetch = func(context.Context) (Token, error) { return Token{}, ErrUpstream }
	if _, e := c.AccessToken(context.Background()); !errors.Is(e, ErrUpstream) {
		t.Fatal(e)
	}
}
func TestT4_FHIR(t *testing.T) {
	for _, tc := range []struct {
		status int
		body   string
		want   error
	}{{200, `{"resourceType":"Patient","id":"p1","future":true}`, nil}, {404, `{}`, ErrNotFound}, {503, `{}`, ErrUpstream}, {200, `broken`, ErrUpstream}, {200, `{"resourceType":"Observation","id":"p1"}`, ErrUpstream}, {200, `{"resourceType":"Patient","id":"p2"}`, ErrUpstream}} {
		s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path != "/Patient/p1" || r.Header.Get("Accept") != "application/fhir+json" {
				t.Error("bad request")
			}
			w.WriteHeader(tc.status)
			fmt.Fprint(w, tc.body)
		}))
		_, err := (FHIRClient{s.URL, s.Client()}).Fetch(context.Background(), "p1")
		s.Close()
		if !errors.Is(err, tc.want) {
			t.Fatal(err, tc.want)
		}
	}
	_, err := (FHIRClient{}).Fetch(context.Background(), "../escape")
	if !errors.Is(err, ErrInvalid) {
		t.Fatal(err)
	}
}
func TestT5_Transform(t *testing.T) {
	for _, tc := range []struct {
		name string
		in   FHIRPatient
		want Patient
		bad  bool
	}{{"minimal", raw("p1"), Patient{ID: "p1", Gender: "unknown"}, false}, {"official", FHIRPatient{ResourceType: "Patient", ID: "p2", Name: []Name{{Given: []string{"Nickname"}}, {Use: "official", Given: []string{" Ada ", "  M "}, Family: " Lovelace "}}, BirthDate: "2000-02-29", Gender: " FEMALE ", Telecom: []Telecom{{"phone", "123"}, {"email", " "}, {"email", " ADA@EXAMPLE.TEST "}}}, Patient{"p2", "Ada M Lovelace", "2000-02-29", "female", "ada@example.test"}, false}, {"fallback", FHIRPatient{ResourceType: "Patient", ID: "p3", Gender: "n/a", Name: []Name{{Family: " First "}, {Family: "Second"}}}, Patient{ID: "p3", FullName: "First", Gender: "unknown"}, false}, {"bad date", FHIRPatient{ResourceType: "Patient", ID: "p", BirthDate: "2023-02-29"}, Patient{}, true}, {"partial date", FHIRPatient{ResourceType: "Patient", ID: "p", BirthDate: "2000"}, Patient{}, true}, {"wrong resource", FHIRPatient{ResourceType: "Observation", ID: "p"}, Patient{}, true}, {"missing ID", raw(""), Patient{}, true}} {
		t.Run(tc.name, func(t *testing.T) {
			before := fmt.Sprintf("%#v", tc.in)
			got, e := Transform(tc.in)
			if tc.bad {
				if !errors.Is(e, ErrInvalid) {
					t.Fatal(e)
				}
				return
			}
			if e != nil || !reflect.DeepEqual(got, tc.want) {
				t.Fatal(got, e, tc.want)
			}
			if fmt.Sprintf("%#v", tc.in) != before {
				t.Fatal("mutated input")
			}
		})
	}
}

type trackedBody struct{ closed *atomic.Int32 }

func (b trackedBody) Read([]byte) (int, error) { return 0, io.EOF }
func (b trackedBody) Close() error             { b.closed.Add(1); return nil }
func TestT6_Retry(t *testing.T) {
	if Backoff(time.Second, 5*time.Second, 10000) != 5*time.Second || Backoff(time.Second, 0, 1) != time.Second || Backoff(time.Second, 0, 10000) <= 0 {
		t.Fatal("backoff")
	}
	for _, status := range []int{400, 401, 404, 429, 500, 502, 503, 504} {
		var calls, closed atomic.Int32
		var delays []time.Duration
		rt := RetryTransport{Base: roundFn(func(*http.Request) (*http.Response, error) {
			calls.Add(1)
			return &http.Response{StatusCode: status, Body: trackedBody{&closed}}, nil
		}), MaxAttempts: 3, Delay: time.Second, Cap: 5 * time.Second, Sleep: func(_ context.Context, d time.Duration) error { delays = append(delays, d); return nil }}
		resp, e := rt.RoundTrip(httptest.NewRequest("GET", "http://x", nil))
		if e != nil {
			t.Fatal(e)
		}
		retry := status == 429 || status == 502 || status == 503 || status == 504
		want := int32(1)
		if retry {
			want = 3
		}
		if calls.Load() != want || closed.Load() != want-1 {
			t.Fatal(status, calls.Load(), closed.Load())
		}
		resp.Body.Close()
		if retry && !reflect.DeepEqual(delays, []time.Duration{time.Second, 2 * time.Second}) {
			t.Fatal(delays)
		}
		calls.Store(0)
		resp, e = rt.RoundTrip(httptest.NewRequest("POST", "http://x", nil))
		if e != nil || calls.Load() != 1 {
			t.Fatal("POST retry")
		}
		resp.Body.Close()
	}
	ctx, cancel := context.WithCancel(context.Background())
	calls := 0
	rt := RetryTransport{Base: roundFn(func(*http.Request) (*http.Response, error) { calls++; return nil, io.ErrUnexpectedEOF }), MaxAttempts: 3, Sleep: func(ctx context.Context, _ time.Duration) error { cancel(); return ctx.Err() }}
	_, e := rt.RoundTrip(httptest.NewRequest("GET", "http://x", nil).WithContext(ctx))
	if !errors.Is(e, context.Canceled) || calls != 1 {
		t.Fatal(e, calls)
	}
}
func TestT7_ConcurrencyOrder(t *testing.T) {
	var active, maxActive atomic.Int32
	gate := make(chan struct{})
	entered := make(chan struct{}, 3)
	p := Pipeline{Limit: 2, Client: fetchFn(func(ctx context.Context, id string) (FHIRPatient, error) {
		n := active.Add(1)
		defer active.Add(-1)
		for old := maxActive.Load(); n > old; old = maxActive.Load() {
			if maxActive.CompareAndSwap(old, n) {
				break
			}
		}
		entered <- struct{}{}
		select {
		case <-gate:
		case <-ctx.Done():
			return FHIRPatient{}, ctx.Err()
		}
		return raw(id), nil
	})}
	done := make(chan struct{})
	var out []Patient
	var err error
	go func() { defer close(done); out, err = p.Import(context.Background(), []string{"b", "a", "b"}) }()
	for i := 0; i < 2; i++ {
		select {
		case <-entered:
		case <-time.After(2 * time.Second):
			close(gate)
			t.Fatal("not concurrent")
		}
	}
	close(gate)
	<-done
	if err != nil || maxActive.Load() != 2 || len(out) != 3 || out[0].ID != "b" || out[1].ID != "a" || out[2].ID != "b" {
		t.Fatal(out, err, maxActive.Load())
	}
}
func TestT7_ErrorCancellation(t *testing.T) {
	started := make(chan struct{})
	p := Pipeline{Limit: 2, Client: fetchFn(func(ctx context.Context, id string) (FHIRPatient, error) {
		if id == "bad" {
			<-started
			return FHIRPatient{}, ErrNotFound
		}
		close(started)
		<-ctx.Done()
		return FHIRPatient{}, ctx.Err()
	})}
	out, e := p.Import(context.Background(), []string{"bad", "waiting"})
	if out != nil || !errors.Is(e, ErrNotFound) {
		t.Fatal(out, e)
	}
	if _, e := (Pipeline{Limit: 0}).Import(context.Background(), nil); !errors.Is(e, ErrInvalid) {
		t.Fatal(e)
	}
}
func TestT8_EndToEnd(t *testing.T) {
	var tokens, attempts atomic.Int32
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/token" {
			tokens.Add(1)
			fmt.Fprint(w, `{"access_token":"demo","token_type":"Bearer","expires_in":120}`)
			return
		}
		if r.Header.Get("Authorization") != "Bearer demo" {
			w.WriteHeader(401)
			return
		}
		if attempts.Add(1) == 1 {
			w.WriteHeader(503)
			return
		}
		fmt.Fprintf(w, `{"resourceType":"Patient","id":%q,"name":[{"given":[" Ada "],"family":"Lovelace"}]}`, strings.TrimPrefix(r.URL.Path, "/Patient/"))
	}))
	defer s.Close()
	h, e := New(Config{s.URL + "/token", s.URL, "id", "secret", 2})
	if e != nil {
		t.Fatal(e)
	}
	api := httptest.NewServer(h)
	defer api.Close()
	for i := 0; i < 2; i++ {
		resp, e := api.Client().Post(api.URL+"/imports", "application/json", strings.NewReader(`{"patient_ids":["p1","p2"]}`))
		if e != nil {
			t.Fatal(e)
		}
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if resp.StatusCode != 200 || !strings.Contains(string(body), `"full_name":"Ada Lovelace"`) {
			t.Fatal(resp.Status, string(body))
		}
	}
	if tokens.Load() != 1 || attempts.Load() != 5 {
		t.Fatal(tokens.Load(), attempts.Load())
	}
	if _, e := New(Config{}); !errors.Is(e, ErrInvalid) {
		t.Fatal(e)
	}
}
