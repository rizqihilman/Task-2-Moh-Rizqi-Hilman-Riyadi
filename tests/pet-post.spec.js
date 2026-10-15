const { test, expect } = require('@playwright/test');
const { PetApi } = require('../utils/api');
const { buildPet } = require('../utils/test-data');

let api;

test.beforeEach(async ({ request }) => {
  api = new PetApi(request);
});

test.afterEach(async () => {
  await api.cleanup();
});

test.describe('POST /pet', () => {
  test('should create a new pet successfully', async () => {
    const pet = buildPet({ category: { id: 1, name: 'dogs' } });

    const res = await api.create(pet);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toMatchObject({
      id: pet.id,
      name: pet.name,
      status: 'available',
      category: pet.category,
    });
    expect(body.photoUrls).toEqual(pet.photoUrls);
    expect(body.tags).toEqual(pet.tags);

    // the pet must really be stored, not only echoed back
    const check = await api.getById(pet.id);
    expect(check.status()).toBe(200);
    expect(await check.json()).toMatchObject({ id: pet.id, name: pet.name, status: 'available' });
  });

  test('should create a pet with only the required fields', async () => {
    const pet = buildPet({ tags: undefined, category: undefined });
    delete pet.tags;
    delete pet.category;

    const res = await api.create(pet);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.id).toBe(pet.id);
    expect(body.name).toBe(pet.name);
    expect(body.photoUrls).toEqual(pet.photoUrls);
  });

  test('should reject malformed JSON with 400', async ({ request }) => {
    // Buffer keeps the payload raw - Playwright would otherwise JSON-serialize
    // the string and turn the malformed body into a valid JSON string literal.
    const res = await request.post('pet', {
      headers: { 'Content-Type': 'application/json' },
      data: Buffer.from('{ "id": 1, "name": '),
      timeout: 30_000,
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toBeTruthy();
  });

  // The two tests below assert the documented behaviour (405 Invalid input).
  // The live API contradicts its own documentation, so they are marked as
  // expected failures. See task-1-manual-api/bug-reports/ (BUG-002).

  test('should reject an empty payload with 405', async ({ request }) => {
    test.fail();
    test.info().annotations.push({ type: 'known-defect', description: 'BUG-002: POST /pet accepts an empty payload and creates a nameless record' });

    const res = await request.post('pet', { data: {}, timeout: 30_000 });

    // best effort: try to remove the junk record the API just created
    if (res.status() === 200) {
      const body = await res.json().catch(() => null);
      if (body?.id) await api.remove(body.id).catch(() => {});
    }

    expect(res.status(), 'documented: 405 Invalid input').toBe(405);
  });

  test('should reject a status value outside the allowed enum with 405', async () => {
    test.fail();
    test.info().annotations.push({ type: 'known-defect', description: 'BUG-002: POST /pet accepts status "sleepy" and persists it' });

    const pet = buildPet({ status: 'sleepy' });

    const res = await api.create(pet);
    expect(res.status(), 'documented: 405 Invalid input (status must be available | pending | sold)').toBe(405);
  });
});
