# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pet-delete.spec.js >> DELETE /pet/{petId} >> should return 400 for a non-numeric pet id
- Location: tests\pet-delete.spec.js:59:3

# Error details

```
Error: documented: 400 Invalid ID supplied

expect(received).toBe(expected) // Object.is equality

Expected: 400
Received: 404
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | const { PetApi } = require('../utils/api');
  3  | const { buildPet, nextId } = require('../utils/test-data');
  4  | 
  5  | let api;
  6  | 
  7  | test.beforeEach(async ({ request }) => {
  8  |   api = new PetApi(request);
  9  | });
  10 | 
  11 | test.afterEach(async () => {
  12 |   await api.cleanup();
  13 | });
  14 | 
  15 | test.describe('DELETE /pet/{petId}', () => {
  16 |   test('should delete an existing pet', async () => {
  17 |     const pet = buildPet();
  18 |     expect((await api.create(pet)).status()).toBe(200);
  19 | 
  20 |     const res = await api.remove(pet.id);
  21 |     expect(res.status()).toBe(200);
  22 | 
  23 |     const body = await res.json();
  24 |     expect(body.code).toBe(200);
  25 |     expect(String(body.message)).toBe(String(pet.id));
  26 |   });
  27 | 
  28 |   test('should make the deleted pet unavailable afterwards', async () => {
  29 |     const pet = buildPet();
  30 |     expect((await api.create(pet)).status()).toBe(200);
  31 |     expect((await api.remove(pet.id)).status()).toBe(200);
  32 | 
  33 |     // observed behaviour of the live API: GET after DELETE returns 404 "Pet not found"
  34 |     const res = await api.getById(pet.id);
  35 |     expect(res.status()).toBe(404);
  36 |     expect((await res.json()).message).toBe('Pet not found');
  37 |   });
  38 | 
  39 |   test('should remove the deleted pet from findByStatus results', async () => {
  40 |     const pet = buildPet({ status: 'available' });
  41 |     expect((await api.create(pet)).status()).toBe(200);
  42 |     expect((await api.remove(pet.id)).status()).toBe(200);
  43 | 
  44 |     const res = await api.findByStatus('available');
  45 |     expect(res.status()).toBe(200);
  46 |     const stillListed = (await res.json()).some((p) => p.id === pet.id);
  47 |     expect(stillListed, `deleted pet ${pet.id} should not be in the available list`).toBe(false);
  48 |   });
  49 | 
  50 |   test('should return 404 when the pet does not exist', async () => {
  51 |     const res = await api.remove(nextId()); // never created
  52 |     expect(res.status()).toBe(404);
  53 |   });
  54 | 
  55 |   // The test below asserts the documented behaviour (400 Invalid ID supplied).
  56 |   // The live API returns 404 with a raw java.lang.NumberFormatException body,
  57 |   // so it is marked as an expected failure. See bug report BUG-004.
  58 | 
  59 |   test('should return 400 for a non-numeric pet id', async ({ request }) => {
  60 |     test.fail();
  61 |     test.info().annotations.push({ type: 'known-defect', description: 'BUG-004: DELETE /pet/abc returns 404 + java.lang.NumberFormatException instead of 400' });
  62 | 
  63 |     const res = await request.delete('pet/abc', { timeout: 30_000 });
> 64 |     expect(res.status(), 'documented: 400 Invalid ID supplied').toBe(400);
     |                                                                 ^ Error: documented: 400 Invalid ID supplied
  65 |   });
  66 | });
  67 | 
```