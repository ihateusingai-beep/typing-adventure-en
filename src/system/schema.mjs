/**
 * Production schema contract — local-first, cloud-optional later.
 * Wire format stays compatible with core.normalizeSave (schemaVersion 3).
 */
export const GAME_ID = 'typing-adventure-en';
export const CONTENT_VERSION = 'story-v1';
export const SAVE_SCHEMA = 3; // core.blankSave / normalizeSave
export const META_SCHEMA = 1;

/** Meta index: which profiles exist on this device */
export const META_KEY = 'ta_en_meta_v1';
/** Legacy single-slot key (migrated once into default profile) */
export const LEGACY_GUEST_KEY = 'typing_adventure_en_guest_v1';
export const saveKey = (profileId) => `ta_en_save_${profileId}`;

/**
 * @typedef {object} ProfileMeta
 * @property {string} id
 * @property {string} name
 * @property {number} updatedAt
 * @property {number} [completed]
 */

/**
 * @typedef {object} DeviceMeta
 * @property {number} schemaVersion
 * @property {string} activeProfileId
 * @property {ProfileMeta[]} profiles
 */

export function blankMeta() {
  return { schemaVersion: META_SCHEMA, activeProfileId: null, profiles: [] };
}

export function newProfileId() {
  return globalThis.crypto?.randomUUID?.() ?? `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Canonical save envelope (API / export).
 * Inner `save` is core schemaVersion 3 document.
 */
export function wrapExport(save, profile = {}) {
  return {
    game: GAME_ID,
    route: 'en',
    schemaVersion: SAVE_SCHEMA,
    contentVersion: CONTENT_VERSION,
    profile: { id: profile.id ?? null, name: profile.name ?? save?.displayName ?? '同學' },
    exportedAt: new Date().toISOString(),
    save,
  };
}

/** Validate import payload shape (not full normalize). */
export function parseImport(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('請揀呢個遊戲嘅存檔。');
  if (raw.game && raw.game !== GAME_ID && raw.game !== 'wuxia-typing-journey') {
    throw new Error('請揀呢個遊戲嘅存檔。');
  }
  if (raw.route && raw.route !== 'en') throw new Error('只支援英文存檔。');
  if (!raw.save || typeof raw.save !== 'object') throw new Error('這份紀錄無法讀取。');
  return raw;
}
