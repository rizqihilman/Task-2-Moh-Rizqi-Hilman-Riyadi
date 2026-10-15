# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pet-post.spec.js >> POST /pet >> should reject a status value outside the allowed enum with 405
- Location: tests\pet-post.spec.js:85:3

# Error details

```
Error: documented: 405 Invalid input (status must be available | pending | sold)

expect(received).toBe(expected) // Object.is equality

Expected: 405
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
  15 | test.describe('POST /pet', () => {
  16 |   test('should create a new pet successfully', async () => {
  17 |     const pet = buildPet({ category: { id: 1, name: 'dogs' } });
  18 | 
  19 |     const res = await api.create(pet);
  20 |     expect(res.status()).toBe(200);
  21 | 
  22 |     const body = await res.json();
  23 |     expect(body).toMatchObject({
  24 |       id: pet.id,
  25 |       name: pet.name,
  26 |       status: 'available',
  27 |       category: pet.category,
  28 |     });
  29 |     expect(body.photoUrls).toEqual(pet.photoUrls);
  30 |     expect(body.tags).toEqual(pet.tags);
  31 | 
  32 |     // the pet must really be stored, not only echoed back
  33 |     const check = await api.getById(pet.id);
  34 |     expect(check.status()).toBe(200);
  35 |     expect(await check.json()).toMatchObject({ id: pet.id, name: pet.name, status: 'available' });
  36 |   });
  37 | 
  38 |   test('should create a pet with only the required fields', async () => {
  39 |     const pet = buildPet({ tags: undefined, category: undefined });
  40 |     delete pet.tags;
  41 |     delete pet.category;
  42 | 
  43 |     const res = await api.create(pet);
  44 |     expect(res.status()).toBe(200);
  45 | 
  46 |     const body = await res.json();
  47 |     expect(body.id).toBe(pet.id);
  48 |     expect(body.name).toBe(pet.name);
  49 |     expect(body.photoUrls).toEqual(pet.photoUrls);
  50 |   });
  51 | 
  52 |   test('should reject malformed JSON with 400', async ({ request }) => {
  53 |     // Buffer keeps the payload raw - Playwright would otherwise JSON-serialize
  54 |     // the string and turn the malformed body into a valid JSON string literal.
  55 |     const res = await request.post('pet', {
  56 |       headers: { 'Content-Type': 'application/json' },
  57 |       data: Buffer.from('{ "id": 1, "name": '),
  58 |       timeout: 30_000,
  59 |     });
  60 | 
  61 |     expect(res.status()).toBe(400);
  62 |     const body = await res.json();
  63 |     expect(body.message).toBeTruthy();
  64 |   });
  65 | 
  66 |   // The two tests below assert the documented behaviour (405 Invalid input).
  67 |   // The live API contradicts its own documentation, so they are marked as
  68 |   // expected failures. See task-1-manual-api/bug-reports/ (BUG-002).
  69 | 
  70 |   test('should reject an empty payload with 405', async ({ request }) => {
  71 |     test.fail();
  72 |     test.info().annotations.push({ type: 'known-defect', description: 'BUG-002: POST /pet accepts an empty payload and creates a nameless record' });
  73 | 
  74 |     const res = await request.post('pet', { data: {}, timeout: 30_000 });
  75 | 
  76 |     // best effort: try to remove the junk record the API just created
  77 |     if (res.status() === 200) {
  78 |       const body = await res.json().catch(() => null);
  79 |       if (body?.id) await api.remove(body.id).catch(() => {});
  80 |     }
  81 | 
  82 |     expect(res.status(), 'documented: 405 Invalid input').toBe(405);
  83 |   });
  84 | 
  85 |   test('should reject a status value outside the allowed enum with 405', async () => {
  86 |     test.fail();
  87 |     test.info().annotations.push({ type: 'known-defect', description: 'BUG-002: POST /pet accepts status "sleepy" and persists it' });
  88 | 
  89 |     const pet = buildPet({ status: 'sleepy' });
  90 | 
  91 |     const res = await api.create(pet);
> 92 |     expect(res.status(), 'documented: 405 Invalid input (status must be available | pending | sold)').toBe(405);
     |                                                                                                       ^ Error: documented: 405 Invalid input (status must be available | pending | sold)
  93 |   });
  94 | });
  95 | 
```