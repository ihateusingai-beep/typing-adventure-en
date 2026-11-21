/**
 * GameAPI — production facade.
 * UI / main call this; adapters hide storage + cache.
 *
 * Future remote adapter implements same methods (listProfiles, getSave, putSave…).
 */
import { LocalRepository } from './repository.mjs';
import { assetCache } from './cache.mjs';
import { wrapExport, parseImport, GAME_ID, CONTENT_VERSION } from './schema.mjs';
import { blankSave, normalizeSave, cleanName } from '../core.mjs?v=values1';

export class GameAPI {
  constructor() {
    this.repo = new LocalRepository();
    this.cache = assetCache;
    this.ready = false;
    this.profile = null;
    this.save = blankSave();
    this.status = 'boot';
  }

  /**
   * Boot device meta, select profile, load save, optional asset warm.
   * @param {{ prefetch?: string[] }} [opts]
   */
  async init(opts = {}) {
    this.repo.boot();
    let profiles = this.repo.listProfiles();
    if (!profiles.length) {
      this.profile = this.repo.createProfile('同學');
      this.repo.writeSave(blankSave('同學'), { profileId: this.profile.id, name: '同學' });
      profiles = this.repo.listProfiles();
    }
    const active = this.repo.activeId() || profiles[0].id;
    await this.selectProfile(active, { silent: true });
    this.ready = true;
    this.status = 'local';
    if (opts.prefetch?.length) {
      // non-blocking warm
      this.cache.prefetch(opts.prefetch).catch(() => {});
    }
    return this.snapshot();
  }

  snapshot() {
    return {
      ready: this.ready,
      status: this.status,
      profile: this.profile ? { ...this.profile } : null,
      profiles: this.repo.listProfiles(),
      save: this.save,
      game: GAME_ID,
      contentVersion: CONTENT_VERSION,
    };
  }

  listProfiles() {
    return this.repo.listProfiles();
  }

  async selectProfile(id, { silent = false } = {}) {
    const p = this.repo.selectProfile(id);
    this.profile = p;
    const raw = this.repo.readSave(id);
    try {
      this.save = raw ? normalizeSave(raw) : blankSave(p.name);
    } catch {
      this.save = blankSave(p.name);
      this.status = 'storage-error';
    }
    if (!silent) this.status = 'local';
    return this.snapshot();
  }

  async createProfile(name = '同學') {
    const n = cleanName(name) || '同學';
    const p = this.repo.createProfile(n);
    this.repo.writeSave(blankSave(n), { profileId: p.id, name: n });
    return this.selectProfile(p.id);
  }

  async deleteProfile(id) {
    this.repo.deleteProfile(id);
    return this.selectProfile(this.repo.activeId());
  }

  /** Replace save (already normalized by caller or normalize here). */
  updateSave(next, { nameDirty = false } = {}) {
    try {
      this.save = normalizeSave(next);
    } catch (e) {
      this.status = 'storage-error';
      throw e;
    }
    if (nameDirty && this.profile) {
      this.profile.name = this.save.displayName || this.profile.name;
    }
    try {
      this.repo.writeSave(this.save, {
        profileId: this.profile?.id,
        name: this.save.displayName,
      });
      this.status = 'local';
    } catch {
      this.status = 'storage-error';
    }
    return this.save;
  }

  exportJSON() {
    return JSON.stringify(
      wrapExport(this.save, this.profile || {}),
      null,
      2,
    );
  }

  importJSON(raw) {
    const payload = parseImport(typeof raw === 'string' ? JSON.parse(raw) : raw);
    const save = normalizeSave(payload.save);
    if (payload.profile?.name && !save.displayName) save.displayName = cleanName(payload.profile.name);
    this.updateSave(save, { nameDirty: true });
    return this.snapshot();
  }

  /** Critical URLs for classroom offline warm. */
  static criticalAssets() {
    return [
      'game-data/media.json?v=brand1',
      'assets/brand/puichi-logo.png',
      'assets/brand/ken-cheng-logo.png',
      'audio/bgm_main_game.mp3',
      'audio/bgm_title_screen.mp3',
      'audio/bgm_battle.mp3',
      'audio/sfx_answer_correct.mp3',
      'audio/sfx_answer_wrong.mp3',
      'audio/sfx_button_click.mp3',
    ];
  }
}

/** Singleton used by app boot */
export const gameApi = new GameAPI();
