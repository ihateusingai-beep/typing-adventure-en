/**
 * Local persistence repository — multi-profile on one device.
 * Adapter boundary: swap to IndexedDB / remote later without touching UI.
 */
import {
  META_KEY, LEGACY_GUEST_KEY, saveKey, blankMeta, newProfileId, META_SCHEMA,
} from './schema.mjs';

function lsGet(key) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

function lsSet(key, value) {
  const json = JSON.stringify(value);
  if (new TextEncoder().encode(json).length > 65536) throw new Error('size');
  localStorage.setItem(key, json);
}

function lsDel(key) {
  try { localStorage.removeItem(key); } catch {}
}

export class LocalRepository {
  constructor() {
    this.meta = blankMeta();
  }

  /** Load meta + one-time migrate legacy guest key. */
  boot() {
    const raw = lsGet(META_KEY);
    if (raw && raw.schemaVersion === META_SCHEMA && Array.isArray(raw.profiles)) {
      this.meta = {
        schemaVersion: META_SCHEMA,
        activeProfileId: raw.activeProfileId || raw.profiles[0]?.id || null,
        profiles: raw.profiles.map(p => ({
          id: String(p.id),
          name: String(p.name || '同學').slice(0, 20),
          updatedAt: Number(p.updatedAt) || 0,
          completed: Number(p.completed) || 0,
        })),
      };
    } else {
      this.meta = blankMeta();
    }
    this.#migrateLegacy();
    this.#persistMeta();
    return this.meta;
  }

  #migrateLegacy() {
    if (this.meta.profiles.length) return;
    const legacy = lsGet(LEGACY_GUEST_KEY);
    if (!legacy) return;
    const id = newProfileId();
    const name = String(legacy.displayName || '同學').slice(0, 20);
    const completed = Array.isArray(legacy.completedNodeIds) ? legacy.completedNodeIds.length : 0;
    try {
      lsSet(saveKey(id), legacy);
      this.meta.profiles = [{ id, name, updatedAt: Date.now(), completed }];
      this.meta.activeProfileId = id;
      // keep legacy key as backup until next write overwrites via dual-write
    } catch {}
  }

  listProfiles() {
    return [...this.meta.profiles].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  activeId() {
    return this.meta.activeProfileId;
  }

  getProfile(id) {
    return this.meta.profiles.find(p => p.id === id) || null;
  }

  createProfile(name = '同學') {
    const id = newProfileId();
    const profile = {
      id,
      name: String(name || '同學').slice(0, 20),
      updatedAt: Date.now(),
      completed: 0,
    };
    this.meta.profiles.push(profile);
    this.meta.activeProfileId = id;
    this.#persistMeta();
    return profile;
  }

  selectProfile(id) {
    if (!this.getProfile(id)) throw new Error('搵唔到呢個進度。');
    this.meta.activeProfileId = id;
    this.#persistMeta();
    return this.getProfile(id);
  }

  renameProfile(id, name) {
    const p = this.getProfile(id);
    if (!p) throw new Error('搵唔到呢個進度。');
    p.name = String(name || '同學').slice(0, 20);
    p.updatedAt = Date.now();
    this.#persistMeta();
    return p;
  }

  deleteProfile(id) {
    if (this.meta.profiles.length <= 1) throw new Error('至少留一個進度。');
    this.meta.profiles = this.meta.profiles.filter(p => p.id !== id);
    lsDel(saveKey(id));
    if (this.meta.activeProfileId === id) {
      this.meta.activeProfileId = this.meta.profiles[0].id;
    }
    this.#persistMeta();
  }

  readSave(profileId = this.meta.activeProfileId) {
    if (!profileId) return null;
    return lsGet(saveKey(profileId));
  }

  writeSave(save, { profileId = this.meta.activeProfileId, name, completed } = {}) {
    if (!profileId) {
      const p = this.createProfile(name || save?.displayName || '同學');
      profileId = p.id;
    }
    const doc = { ...save, updatedAt: new Date().toISOString() };
    lsSet(saveKey(profileId), doc);
    // dual-write legacy key so old tooling still sees active slot
    try { lsSet(LEGACY_GUEST_KEY, doc); } catch {}
    const p = this.getProfile(profileId);
    if (p) {
      if (name) p.name = String(name).slice(0, 20);
      else if (save?.displayName) p.name = String(save.displayName).slice(0, 20);
      p.updatedAt = Date.now();
      if (completed != null) p.completed = completed;
      else if (Array.isArray(save?.completedNodeIds)) p.completed = save.completedNodeIds.length;
    }
    this.meta.activeProfileId = profileId;
    this.#persistMeta();
    return profileId;
  }

  #persistMeta() {
    try { lsSet(META_KEY, this.meta); } catch {}
  }
}
