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

test.describe('GET /pet/findByStatus', () => {
  test('should return only pets matching status "available"', async () => {
    const res = await api.findByStatus('available');
    expect(res.status()).toBe(200);

    const pets = await res.json();
    expect(Array.isArray(pets)).toBe(true);
    expect(pets.length).toBeGreaterThan(0);
    expect(pets.every((p) => p.status === 'available')).toBe(true);
  });

  test('should return only pets matching status "pending"', async () => {
    const res = await api.findByStatus('pending');
    expect(res.status()).toBe(200);

    const pets = await res.json();
    expect(Array.isArray(pets)).toBe(true);
    // an empty array is valid - it only means no pending pets exist right now
    expect(pets.every((p) => p.status === 'pending')).toBe(true);
  });

  test('should combine multiple status filters', async () => {
    const res = await api.findByStatus(['available', 'pending']);
    expect(res.status()).toBe(200);

    const pets = await res.json();
    expect(pets.length).toBeGreaterThan(0);
    expect(pets.every((p) => ['available', 'pending'].includes(p.status))).toBe(true);
  });

  test('should include a newly created pet in its status list', async () => {
    const pet = buildPet({ status: 'pending' });
    expect((await api.create(pet)).status()).toBe(200);

    const found = await api.findByStatus('pending');
    expect(found.status()).toBe(200);
    const inList = (await found.json()).some((p) => p.id === pet.id);
    expect(inList, `pet ${pet.id} should appear in the pending list`).toBe(true);

    expect((await api.remove(pet.id)).status()).toBe(200);

    const afterDelete = await api.findByStatus('pending');
    const stillThere = (await afterDelete.json()).some((p) => p.id === pet.id);
    expect(stillThere, `pet ${pet.id} should be gone after DELETE`).toBe(false);
  });

  // The two tests below assert the documented behaviour (400 Invalid status
  // value / required parameter). The live API returns 200 with an empty array,
  // so they are marked as expected failures. See bug report BUG-001.

  test('should reject an invalid status value with 400', async () => {
    test.fail();
    test.info().annotations.push({ type: 'known-defect', description: 'BUG-001: findByStatus returns 200 + [] for an invalid status value' });

    const res = await api.findByStatus('notastatus');
    expect(res.status(), 'documented: 400 Invalid status value').toBe(400);
  });

  test('should require the status query parameter', async ({ request }) => {
    test.fail();
    test.info().annotations.push({ type: 'known-defect', description: 'BUG-001: findByStatus without the status parameter returns 200 + []' });

    const res = await request.get('pet/findByStatus', { timeout: 30_000 });
    expect(res.status(), 'documented: 400 (status is a required parameter)').toBe(400);
  });
});
