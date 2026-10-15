const { test, expect } = require('@playwright/test');
const { PetApi } = require('../utils/api');
const { buildPet, nextId } = require('../utils/test-data');

let api;

test.beforeEach(async ({ request }) => {
  api = new PetApi(request);
});

test.afterEach(async () => {
  await api.cleanup();
});

test.describe('DELETE /pet/{petId}', () => {
  test('should delete an existing pet', async () => {
    const pet = buildPet();
    expect((await api.create(pet)).status()).toBe(200);

    const res = await api.remove(pet.id);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.code).toBe(200);
    expect(String(body.message)).toBe(String(pet.id));
  });

  test('should make the deleted pet unavailable afterwards', async () => {
    const pet = buildPet();
    expect((await api.create(pet)).status()).toBe(200);
    expect((await api.remove(pet.id)).status()).toBe(200);

    // observed behaviour of the live API: GET after DELETE returns 404 "Pet not found"
    const res = await api.getById(pet.id);
    expect(res.status()).toBe(404);
    expect((await res.json()).message).toBe('Pet not found');
  });

  test('should remove the deleted pet from findByStatus results', async () => {
    const pet = buildPet({ status: 'available' });
    expect((await api.create(pet)).status()).toBe(200);
    expect((await api.remove(pet.id)).status()).toBe(200);

    const res = await api.findByStatus('available');
    expect(res.status()).toBe(200);
    const stillListed = (await res.json()).some((p) => p.id === pet.id);
    expect(stillListed, `deleted pet ${pet.id} should not be in the available list`).toBe(false);
  });

  test('should return 404 when the pet does not exist', async () => {
    const res = await api.remove(nextId()); // never created
    expect(res.status()).toBe(404);
  });

  // The test below asserts the documented behaviour (400 Invalid ID supplied).
  // The live API returns 404 with a raw java.lang.NumberFormatException body,
  // so it is marked as an expected failure. See bug report BUG-004.

  test('should return 400 for a non-numeric pet id', async ({ request }) => {
    test.fail();
    test.info().annotations.push({ type: 'known-defect', description: 'BUG-004: DELETE /pet/abc returns 404 + java.lang.NumberFormatException instead of 400' });

    const res = await request.delete('pet/abc', { timeout: 30_000 });
    expect(res.status(), 'documented: 400 Invalid ID supplied').toBe(400);
  });
});
