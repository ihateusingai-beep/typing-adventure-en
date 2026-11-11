#!/usr/bin/env python3
"""Pack 4 single NPC portraits into a clean 2x2 opaque sheet."""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/v3/portraits"
RAW = ROOT / "assets/_gen_raw"
OUT.mkdir(parents=True, exist_ok=True)
PAPER = (242, 237, 223, 255)

# cell size: portrait 3:4
CELL_W, CELL_H = 512, 682  # aspect ≈ 0.75


def fit_on_paper(src: Path, tw=CELL_W, th=CELL_H) -> Image.Image:
    im = Image.open(src).convert("RGBA")
    arr = np.array(im).astype(np.float32)
    # flatten any alpha onto paper
    a = arr[:, :, 3:4] / 255.0
    paper = np.array(PAPER[:3], dtype=np.float32)
    rgb = arr[:, :, :3] * a + paper * (1.0 - a)
    flat = np.zeros((arr.shape[0], arr.shape[1], 4), dtype=np.uint8)
    flat[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    flat[:, :, 3] = 255
    im = Image.fromarray(flat, "RGBA")

    # content bbox vs paper
    a2 = np.array(im)
    dist = np.linalg.norm(a2[:, :, :3].astype(float) - np.array(PAPER[:3]), axis=2)
    mask = dist > 18
    ys, xs = np.where(mask)
    if len(xs) == 0:
        canvas = Image.new("RGBA", (tw, th), PAPER)
        return canvas
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    # pad a little
    pad = 8
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(im.width, x1 + pad), min(im.height, y1 + pad)
    crop = im.crop((x0, y0, x1, y1))
    cw, ch = crop.size
    # scale to fit inside cell with margin
    margin = 0.92
    scale = min((tw * margin) / cw, (th * margin) / ch)
    nw, nh = max(1, int(cw * scale)), max(1, int(ch * scale))
    crop = crop.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (tw, th), PAPER)
    canvas.paste(crop, ((tw - nw) // 2, (th - nh) // 2))
    # ensure opaque
    out = np.array(canvas)
    out[:, :, 3] = 255
    return Image.fromarray(out, "RGBA")


def pack(paths: list[Path], dest: Path) -> dict:
    assert len(paths) == 4
    sheet = Image.new("RGBA", (CELL_W * 2, CELL_H * 2), PAPER)
    for i, p in enumerate(paths):
        r, c = divmod(i, 2)
        # order: 0 1 / 2 3  -> row-major; expressions index matches
        cell = fit_on_paper(p)
        sheet.paste(cell, (c * CELL_W, r * CELL_H))
    # row-major in divmod is wrong: divmod(i,2) gives r=i//2, c=i%2
    # i=0 -> 0,0; i=1 -> 0,1; i=2 -> 1,0; i=3 -> 1,1  YES correct with r,c = divmod(i,2) 
    # wait divmod(1,2)=(0,1) -> r=0,c=1 top-right OK
    sheet_arr = np.array(sheet)
    sheet_arr[:, :, 3] = 255
    sheet = Image.fromarray(sheet_arr, "RGBA")
    dest.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(dest, "WEBP", quality=92, method=6)
    # also save raw pack png
    raw_path = RAW / dest.name.replace(".webp", ".png")
    sheet.save(raw_path, "PNG")
    return {
        "dest": str(dest),
        "size": list(sheet.size),
        "cell": [CELL_W, CELL_H],
        "aspect": round(CELL_W / CELL_H, 4),
        "bytes": dest.stat().st_size,
    }


def update_media(master_aspect: float, peer_aspect: float | None = None):
    p = ROOT / "game-data/media.json"
    m = json.loads(p.read_text())
    bust = "portrait2"
    if "MASTER" in m.get("portraits", {}):
        m["portraits"]["MASTER"].update(
            {
                "src": f"assets/v3/portraits/master-portraits.webp?v={bust}",
                "columns": 2,
                "rows": 2,
                "aspect": master_aspect,
                "expressions": ["calm", "demonstrating", "encouraging", "proud"],
            }
        )
    if peer_aspect is not None and "PEER" in m.get("portraits", {}):
        m["portraits"]["PEER"].update(
            {
                "src": f"assets/v3/portraits/peer-portraits.webp?v={bust}",
                "columns": 2,
                "rows": 2,
                "aspect": peer_aspect,
                "expressions": ["happy", "thinking", "surprised", "relieved"],
            }
        )
    p.write_text(json.dumps(m, ensure_ascii=False, separators=(",", ":")))
    print("media.json aspect MASTER", master_aspect, "PEER", peer_aspect)


def main():
    cache = Path("/Users/kencheng/.hermes/cache/images")
    # latest master gens by mtime matching
    master_files = sorted(cache.glob("xai_grok-imagine-image_20261111_2022*.jpg"))
    # explicit list from this run timestamps
    master = [
        cache / "xai_grok-imagine-image_20261111_202201_aecee4b4.jpg",  # calm
        cache / "xai_grok-imagine-image_20261111_202209_6500c1c0.jpg",  # demonstrating
        cache / "xai_grok-imagine-image_20261111_202217_bd95863c.jpg",  # encouraging
        cache / "xai_grok-imagine-image_20261111_202226_76c6a44f.jpg",  # proud
    ]
    for f in master:
        if not f.exists():
            raise SystemExit(f"missing {f}")
    rep_m = pack(master, OUT / "master-portraits.webp")
    print("MASTER", rep_m)

    peer = sorted(cache.glob("xai_grok-imagine-image_20261111_2023*.jpg"))
    # will fill after peer gens complete - try common names
    peer_candidates = list(cache.glob("xai_grok-imagine-image*.jpg"))
    peer_candidates = sorted(peer_candidates, key=lambda p: p.stat().st_mtime, reverse=True)
    # take 4 newest that aren't master
    master_set = set(master)
    peer_files = [p for p in peer_candidates if p not in master_set][:4]
    peer_files = list(reversed(peer_files))  # oldest of the 4 first roughly
    # Better: use explicit if we know names after generation
    print("peer candidates", [p.name for p in peer_files])
    if len(peer_files) == 4:
        rep_p = pack(peer_files, OUT / "peer-portraits.webp")
        print("PEER", rep_p)
        update_media(rep_m["aspect"], rep_p["aspect"])
    else:
        update_media(rep_m["aspect"], None)


if __name__ == "__main__":
    main()
