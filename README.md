# Task 2 — API Automation Test (Playwright)

Automation untuk tiga Petstore endpoints dari Task 1, written with Playwright Test (JavaScript) so API and UI automation share one stack.

- `POST /pet` — create a pet
- `GET /pet/findByStatus` — search pets by status
- `DELETE /pet/{petId}` — delete a pet

Base URL: `https://petstore.swagger.io/v2` (public demo API).

## Structure

```
task-2-api-automation/
├── playwright.config.js   # base URL, timeouts, reporters, workers
├── package.json
├── utils/
│   ├── api.js             # request wrapper: cleanup tracking + read retries
│   └── test-data.js       # unique pet ids/names per run
├── tests/
│   ├── pet-post.spec.js
│   ├── pet-find-by-status.spec.js
│   └── pet-delete.spec.js
└── reports/               # generated: HTML report, JSON results, run log
```

## Prerequisites

- Node.js 18+ (developed with Node 26)
- Internet access to petstore.swagger.io

No browser download is needed — these tests only use Playwright's request API.

## Install and run

```bash
npm install
npx playwright test
```

Open the HTML report after a run:

```bash
npm run test:report
# or: npx playwright show-report reports/html-report
```

Optional — point the suite at another Petstore instance:

```bash
PETSTORE_BASE_URL=https://petstore.example.com/v2 npx playwright test
```

## What the tests cover

| File | Tests |
|---|---|
| `pet-post.spec.js` | create with a full payload + verify it is persisted, create with required fields only, malformed JSON → 400, plus 2 expected-failure tests for the validation defects |
| `pet-find-by-status.spec.js` | results only contain the requested status, multi-status search, newly created pet appears in its list and disappears after deletion, plus 2 expected-failure tests |
| `pet-delete.spec.js` | delete returns the deleted id, pet is gone afterwards (GET → 404), pet disappears from `findByStatus`, deleting a missing pet → 404, plus 1 expected-failure test |

Test data uses unique 9-digit ids per run, and every pet created by a test is deleted in `afterEach` so the shared public dataset is not polluted.

## Expected failures (known defects)

Five tests assert the *documented* behaviour that the live API contradicts. They are marked with `test.fail()` and carry a `known-defect` annotation, so the suite result stays meaningful while the defect is still tracked:

| Test | Defect |
|---|---|
| POST /pet: empty payload rejected with 405 | BUG-002 — API returns 200 and creates a nameless record |
| POST /pet: status outside enum rejected with 405 | BUG-002 — `status: "sleepy"` is accepted and persisted |
| GET /pet/findByStatus: invalid status → 400 | BUG-001 — returns 200 + `[]` |
| GET /pet/findByStatus: status parameter required | BUG-001 — returns 200 + `[]` |
| DELETE /pet/{petId}: non-numeric id → 400 | BUG-004 — returns 404 + `java.lang.NumberFormatException` |

Full repro steps and evidence: `../task-1-manual-api/bug-reports/`.

If the API gets fixed, these tests will fail with "expected to fail, but passed" — that is the signal to remove `test.fail()` and turn them into normal assertions.

## Notes and limitations

- The Petstore is a shared public sandbox. Other users create and delete data constantly, so list sizes change between runs; tests never assume a fixed dataset.
- Tests run sequentially (`workers: 1`) to avoid hammering a shared API and to keep generated ids predictable.
- `retries: 1` plus read-only retry on 502/503/504 (in `utils/api.js`) covers transient hiccups of the demo instance. Write requests are never retried and the last attempt is always asserted, so failures are not hidden.
- Playwright serialises `data: "<string>"` as JSON. The malformed-JSON test therefore sends a `Buffer` to keep the payload raw.
