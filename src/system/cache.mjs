/**
 * Asset caching strategy — memory L1 + Cache Storage L2 (when available).
 * Production: warm critical paths on boot; battle/media hit memory first.
 */
const CACHE_NAME = 'ta-en-assets-v1';
const memory = new Map(); // url -> Promise<Response|Blob|Image>

export class AssetCache {
  constructor({ cacheName = CACHE_NAME } = {}) {
    this.cacheName = cacheName;
    this.enabled = typeof caches !== 'undefined';
  }

  /** In-flight / resolved memory entry */
  getMem(url) {
    return memory.get(url) || null;
  }

  setMem(url, promise) {
    memory.set(url, promise);
    promise.catch?.(() => memory.delete(url));
    return promise;
  }

  async open() {
    if (!this.enabled) return null;
    try { return await caches.open(this.cacheName); } catch { return null; }
  }

  /**
   * Fetch with L1 memory → L2 Cache Storage → network.
   * Returns Response (clone-safe callers should clone).
   */
  async match(url, { put = true } = {}) {
    const abs = new URL(url, document.baseURI).href;
    const mem = this.getMem(abs);
    if (mem) return mem;

    const work = (async () => {
      const cache = await this.open();
      if (cache) {
        const hit = await cache.match(abs);
        if (hit) return hit;
      }
      const res = await fetch(abs, { credentials: 'same-origin' });
      if (put && res.ok && cache) {
        try { await cache.put(abs, res.clone()); } catch {}
      }
      return res;
    })();

    return this.setMem(abs, work);
  }

  /** Prefetch list of relative/absolute URLs (best-effort). */
  async prefetch(urls = []) {
    const list = [...new Set(urls.filter(Boolean))];
    const results = await Promise.allSettled(list.map(u => this.match(u)));
    return {
      ok: results.filter(r => r.status === 'fulfilled' && r.value?.ok !== false).length,
      total: list.length,
    };
  }

  /** Image loader compatible with media.mjs pattern */
  loadImage(src) {
    const abs = new URL(src, document.baseURI).href;
    const hit = this.getMem('img:' + abs);
    if (hit) return hit;
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('image'));
      // Prefer cache-warmed URL; browser HTTP cache + our Cache Storage help
      image.src = abs;
    });
    return this.setMem('img:' + abs, promise);
  }

  async clear() {
    memory.clear();
    if (!this.enabled) return;
    try { await caches.delete(this.cacheName); } catch {}
  }
}

export const assetCache = new AssetCache();
