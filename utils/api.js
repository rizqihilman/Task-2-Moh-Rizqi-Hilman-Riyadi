/**
 * Small wrapper around Playwright's APIRequestContext.
 *
 * - Tracks pets created during a test so they can be removed afterwards
 *   (the Petstore is a shared public instance - test data should not pile up).
 * - Retries only read requests on 502/503/504. Write requests are never
 *   retried, and the final result is always asserted, so a failure is never
 *   hidden by the retry logic.
 */
const RETRYABLE_STATUS = [502, 503, 504];

class PetApi {
  constructor(request) {
    this.request = request;
    this.createdIds = new Set();
  }

  async create(pet) {
    const res = await this.request.post('pet', { data: pet, timeout: 30_000 });
    if (res.status() === 200) this.createdIds.add(pet.id);
    return res;
  }

  async remove(id) {
    const res = await this.request.delete(`pet/${id}`, { timeout: 30_000 });
    if (res.status() === 200) this.createdIds.delete(id);
    return res;
  }

  async getById(id) {
    return this.getWithRetry(`pet/${id}`);
  }

  async findByStatus(status, { retries = 2 } = {}) {
    const values = Array.isArray(status) ? status : [status];
    const query = values.map((s) => `status=${encodeURIComponent(s)}`).join('&');
    return this.getWithRetry(`pet/findByStatus?${query}`, { retries });
  }

  async getWithRetry(url, { retries = 2 } = {}) {
    let res;
    for (let attempt = 0; attempt <= retries; attempt++) {
      res = await this.request.get(url, { timeout: 30_000 });
      if (!RETRYABLE_STATUS.includes(res.status())) return res;
      console.warn(`GET ${url} -> ${res.status()}; retrying (${attempt + 1}/${retries})`);
      await new Promise((r) => setTimeout(r, 1_000 * (attempt + 1)));
    }
    return res;
  }

  /** Best-effort cleanup of everything created in the current test. */
  async cleanup() {
    for (const id of [...this.createdIds]) {
      try {
        await this.remove(id);
      } catch {
        // cleanup must not mask the test result
      }
    }
  }
}

module.exports = { PetApi };
