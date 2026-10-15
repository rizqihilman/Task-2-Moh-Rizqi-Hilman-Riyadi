# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pet-find-by-status.spec.js >> GET /pet/findByStatus >> should require the status query parameter
- Location: tests\pet-find-by-status.spec.js:73:3

# Error details

```
Error: documented: 400 (status is a required parameter)

expect(received).toBe(expected) // Object.is equality

Expected: 400
Received: 200
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | const { PetApi } = require('../utils/api');
  3  | const { buildPet } = require('../utils/test-data');
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
  15 | test.describe('GET /pet/findByStatus', () => {
  16 |   test('should return only pets matching status "available"', async () => {
  17 |     const res = await api.findByStatus('available');
  18 |     expect(res.status()).toBe(200);
  19 | 
  20 |     const pets = await res.json();
  21 |     expect(Array.isArray(pets)).toBe(true);
  22 |     expect(pets.length).toBeGreaterThan(0);
  23 |     expect(pets.every((p) => p.status === 'available')).toBe(true);
  24 |   });
  25 | 
  26 |   test('should return only pets matching status "pending"', async () => {
  27 |     const res = await api.findByStatus('pending');
  28 |     expect(res.status()).toBe(200);
  29 | 
  30 |     const pets = await res.json();
  31 |     expect(Array.isArray(pets)).toBe(true);
  32 |     // an empty array is valid - it only means no pending pets exist right now
  33 |     expect(pets.every((p) => p.status === 'pending')).toBe(true);
  34 |   });
  35 | 
  36 |   test('should combine multiple status filters', async () => {
  37 |     const res = await api.findByStatus(['available', 'pending']);
  38 |     expect(res.status()).toBe(200);
  39 | 
  40 |     const pets = await res.json();
  41 |     expect(pets.length).toBeGreaterThan(0);
  42 |     expect(pets.every((p) => ['available', 'pending'].includes(p.status))).toBe(true);
  43 |   });
  44 | 
  45 |   test('should include a newly created pet in its status list', async () => {
  46 |     const pet = buildPet({ status: 'pending' });
  47 |     expect((await api.create(pet)).status()).toBe(200);
  48 | 
  49 |     const found = await api.findByStatus('pending');
  50 |     expect(found.status()).toBe(200);
  51 |     const inList = (await found.json()).some((p) => p.id === pet.id);
  52 |     expect(inList, `pet ${pet.id} should appear in the pending list`).toBe(true);
  53 | 
  54 |     expect((await api.remove(pet.id)).status()).toBe(200);
  55 | 
  56 |     const afterDelete = await api.findByStatus('pending');
  57 |     const stillThere = (await afterDelete.json()).some((p) => p.id === pet.id);
  58 |     expect(stillThere, `pet ${pet.id} should be gone after DELETE`).toBe(false);
  59 |   });
  60 | 
  61 |   // The two tests below assert the documented behaviour (400 Invalid status
  62 |   // value / required parameter). The live API returns 200 with an empty array,
  63 |   // so they are marked as expected failures. See bug report BUG-001.
  64 | 
  65 |   test('should reject an invalid status value with 400', async () => {
  66 |     test.fail();
  67 |     test.info().annotations.push({ type: 'known-defect', description: 'BUG-001: findByStatus returns 200 + [] for an invalid status value' });
  68 | 
  69 |     const res = await api.findByStatus('notastatus');
  70 |     expect(res.status(), 'documented: 400 Invalid status value').toBe(400);
  71 |   });
  72 | 
  73 |   test('should require the status query parameter', async ({ request }) => {
  74 |     test.fail();
  75 |     test.info().annotations.push({ type: 'known-defect', description: 'BUG-001: findByStatus without the status parameter returns 200 + []' });
  76 | 
  77 |     const res = await request.get('pet/findByStatus', { timeout: 30_000 });
> 78 |     expect(res.status(), 'documented: 400 (status is a required parameter)').toBe(400);
     |                                                                              ^ Error: documented: 400 (status is a required parameter)
  79 |   });
  80 | });
  81 | 
```