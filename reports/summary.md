# Task 2 — API Automation Report

**Run:** 15 Oct 2026, 09:39 (UTC+7) · Playwright 1.64.1 · Node v26.7.0 · Windows
**Command:** `npx playwright test`
**Target:** https://petstore.swagger.io/v2

## Results

| Metric | Count |
|---|---|
| Total tests | 16 |
| Passed | 11 |
| Expected failures (known defects) | 5 |
| Failed (unexpected) | 0 |
| Skipped | 0 |
| Flaky | 0 |
| Duration | 27.6 s |

Playwright treats the 5 known-defect tests as *expected* failures (they are marked `test.fail()`), so the run exits with code 0. `reports/results.json` shows `expected: 16, unexpected: 0`.

## Expected failures — all mapped to confirmed defects

| Test | Observed behaviour | Defect |
|---|---|---|
| POST /pet › should reject an empty payload with 405 | 200, creates nameless record | BUG-002 |
| POST /pet › should reject a status value outside the allowed enum with 405 | 200, persists `status: "sleepy"` | BUG-002 |
| GET /pet/findByStatus › should reject an invalid status value with 400 | 200 + `[]` | BUG-001 |
| GET /pet/findByStatus › should require the status query parameter | 200 + `[]` | BUG-001 |
| DELETE /pet/{petId} › should return 400 for a non-numeric pet id | 404 + `java.lang.NumberFormatException` | BUG-004 |

Repro steps and evidence: `../../task-1-manual-api/bug-reports/`.

## Passed tests

**POST /pet**
- should create a new pet successfully (payload echoed + retrievable via GET)
- should create a pet with only the required fields
- should reject malformed JSON with 400

**GET /pet/findByStatus**
- should return only pets matching status "available"
- should return only pets matching status "pending"
- should combine multiple status filters
- should include a newly created pet in its status list

**DELETE /pet/{petId}**
- should delete an existing pet
- should make the deleted pet unavailable afterwards (GET → 404 "Pet not found")
- should remove the deleted pet from findByStatus results
- should return 404 when the pet does not exist

## Artifacts

- `html-report/index.html` — full HTML report (open with `npm run test:report`)
- `results.json` — machine-readable Playwright results
- `run-log.txt` — console output of this run

## Notes

- Run repeated twice with identical outcomes (11 pass / 5 expected fail). One earlier draft run failed 11 tests because of a URL-joining bug in the draft config (`baseURL` with a path needs a trailing slash) — fixed before this run; the final run is the one reported above.
- The public demo API is shared and occasionally slow; read requests retry on 502/503/504 and the suite retries a failed test once, without masking the final result.
