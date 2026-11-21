# System Design — 電腦打字大冒險 (SEN production)

## Product constraints
- Classroom: shared iPads, ~10 students, weak literacy
- Offline-first (school Wi‑Fi flaky)
- No login / no Google / no Firebase for mainline
- GitHub Pages static host

## Architecture (local-first, cloud-optional)

```
┌─────────────────────────────────────────────┐
│ Presentation                                │
│  main.mjs (router) · battle-ui · collection │
├─────────────────────────────────────────────┤
│ Application API                             │
│  system/api.mjs  GameAPI facade             │
│  storage.mjs     SaveStore (UI adapter)     │
├─────────────────────────────────────────────┤
│ Domain                                      │
│  core.mjs session/save rules · drill · coll │
├─────────────────────────────────────────────┤
│ Infrastructure                              │
│  system/repository.mjs  multi-profile LS    │
│  system/cache.mjs       memory + Cache API  │
│  system/schema.mjs      keys + export shape │
│  media.mjs              sprites / audio     │
└─────────────────────────────────────────────┘
        │ future
        ▼
  RemoteAdapter (optional school server)
```

## Component structure
| Component | Responsibility |
|---|---|
| `GameAPI` | init, profiles, import/export, prefetch |
| `LocalRepository` | meta index + per-profile save blobs |
| `AssetCache` | L1 memory, L2 Cache Storage, network |
| `SaveStore` | EventTarget bridge for existing UI |
| `core` | pure curriculum / typing / normalize |
| `battle-ui` | virt keyboard + HUD patches |

## Data flow
1. Boot → `SaveStore.init` → `repo.boot` (migrate legacy guest) → load active profile save
2. UI action → domain mutate → `store.update` → `repo.writeSave` (+ dual-write legacy key)
3. Media → `assetCache.match/loadImage` → paint
4. Export → `wrapExport(save, profile)` JSON file

## API design (facade)
```
GameAPI.init({ prefetch? })
GameAPI.listProfiles()
GameAPI.createProfile(name)
GameAPI.selectProfile(id)
GameAPI.deleteProfile(id)
GameAPI.updateSave(save)
GameAPI.exportJSON() / importJSON(raw)
AssetCache.match(url) / prefetch(urls[])
```
Remote later: same methods, HTTP under the hood.

## Database schema (device-local)

**Meta** `ta_en_meta_v1`
```json
{
  "schemaVersion": 1,
  "activeProfileId": "uuid",
  "profiles": [
    { "id": "uuid", "name": "阿明", "updatedAt": 0, "completed": 3 }
  ]
}
```

**Save** `ta_en_save_<profileId>` — core `schemaVersion: 3` document
```
displayName, completedNodeIds, nodeRecords,
equippedOutfitId, equippedTreasureId,
collection { stones, earned, items, claimedIds, forge },
settings { muted, virtualKeyboard, voiceRead, ... },
challengeBest, bossBest  // legacy fields retained
```

**Legacy** `typing_adventure_en_guest_v1` — dual-written active slot (compat)

## Caching strategy
| Layer | What | TTL |
|---|---|---|
| L1 memory Map | images + in-flight fetch | session |
| L2 Cache Storage `ta-en-assets-v1` | media.json, brand, BGM/SFX | until version bump |
| HTTP / Pages CDN | static assets | CDN default |
| Bust | `?v=sys1` on entry modules | deploy |

Prefetch on `initMedia`: brand logos + 3 BGM + core SFX.

## Scale path
1. **Now**: multi-profile local (classroom shared device) ✅
2. **Next**: IndexedDB when save >64KB or analytics ring buffer
3. **Later**: optional school sync server implementing GameAPI
4. **Not**: cloud auth on student path

## Minimal production shipped (`?v=sys1`)
- system/* modules
- multi-profile entry + account UI
- asset cache warm
- export envelope with profile metadata
