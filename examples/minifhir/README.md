# minifhir

A hands-on Go OAuth + FHIR ETL practice project following `OA-REPO-GUIDE.md`, in the same ticket-based format as minibricks. **Start with [SPEC.md](SPEC.md).** Eight tickets, roughly 4–5 hours, compiling TODO scaffold, visible grader tests, and a separate reference solution.

```bash
cd examples/minifhir
make t1    # start here; TODO panic is expected
make t5    # independent table-driven transform exercise
make test  # all tickets
make race  # all tickets under the race detector
```

Requires Go 1.22+ and `golang.org/x/sync` (pinned in go.mod/go.sum). Run `go mod download` if the dependency is not cached. Tests use synthetic local HTTP servers, no account or credentials needed. Never put actual patient data in this practice project.

## Try it after T8

Terminal 1:
```bash
make mock
```
Terminal 2:
```bash
TOKEN_URL=http://localhost:9090/token FHIR_URL=http://localhost:9090 CLIENT_ID=demo CLIENT_SECRET=demo make run
```
Terminal 3:
```bash
curl -s localhost:8080/healthz
curl -s -X POST localhost:8080/imports -H 'Content-Type: application/json' -d '{"patient_ids":["p1","p2"]}'
curl -s -X POST localhost:8080/imports -H 'Content-Type: application/json' -d '{"patient_ids":["missing"]}'
```

The mock accepts any valid ID except `missing` (404). Grader tests provide transient failures and fake time. The “load” step emits normalized JSON; storage is optional stretch work.

After completing a ticket, say **“test minifhir T1”** for review. Keep `../minifhir-ANSWERS/` closed until you have attempted it.
