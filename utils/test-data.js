/**
 * Unique test data for the shared public Petstore instance.
 * Ids are 9 digits with a random tail so other users' data rarely collides.
 */
const RUN_BASE = Number(String(Date.now()).slice(-7)) * 100 + Math.floor(Math.random() * 90);
let seq = 0;

function nextId() {
  seq += 1;
  return RUN_BASE + seq;
}

function buildPet(overrides = {}) {
  const id = overrides.id ?? nextId();
  return {
    id,
    name: `QA_Auto_${Date.now()}_${id}`,
    photoUrls: ['https://example.com/qa-auto.jpg'],
    tags: [{ id: 1, name: 'qa-automation' }],
    status: 'available',
    ...overrides,
  };
}

module.exports = { buildPet, nextId };
