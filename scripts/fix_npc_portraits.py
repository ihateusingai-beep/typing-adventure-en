#!/usr/bin/env python3
"""NPC portraits: opaque paper-cream plate — no alpha holes on pastel Ghibli art."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets/_gen_raw"
OUT = ROOT / "assets/v3/portraits"
OUT.mkdir(parents=True, exist_ok=True)

# Match game paper cream
PAPER = (242, 237, 223, 255)  # #f2eddf
NAMES = ("master-portraits", "peer-portraits", "villain-portraits")


def flatten_on_paper(src: Path, dest: Path, paper=PAPER) -> dict:
    im = Image.open(src).convert("RGBA")
    arr = np.array(im).astype(np.float32)
    # If already has alpha holes from bad cutout, treat low alpha as paper
    a = arr[:, :, 3:4] / 255.0
    paper_rgb = np.array(paper[:3], dtype=np.float32).reshape(1, 1, 3)
    rgb = arr[:, :, :3] * a + paper_rgb * (1.0 - a)
    # Also gently map pure-ish corner white to paper so seams match UI
    # but keep character paint: only replace pixels that are BOTH near-white AND similar to corners
    h, w = rgb.shape[:2]
    corners = np.concatenate(
        [
            rgb[0:10, 0:10].reshape(-1, 3),
            rgb[0:10, w - 10 : w].reshape(-1, 3),
            rgb[h - 10 : h, 0:10].reshape(-1, 3),
            rgb[h - 10 : h, w - 10 : w].reshape(-1, 3),
        ]
    )
    bg = np.median(corners, axis=0)
    dist = np.linalg.norm(rgb - bg, axis=2)
    # mild recolor of flat bg to paper (not a cutout)
    near = dist < 12
    for c in range(3):
        rgb[:, :, c] = np.where(near, paper_rgb[0, 0, c] * 0.65 + rgb[:, :, c] * 0.35, rgb[:, :, c])

    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[:, :, 3] = 255  # fully opaque — kills black hole artifacts
    Image.fromarray(out, "RGBA").save(dest, "WEBP", quality=92, method=6)
    return {"name": dest.name, "src": src.name, "size": [w, h], "bytes": dest.stat().st_size, "opaque": True}


def main():
    for name in NAMES:
        raw = RAW / f"{name}.png"
        dest = OUT / f"{name}.webp"
        # Prefer raw generator source; else current webp
        src = raw if raw.exists() else dest
        if not src.exists():
            print("missing", name)
            continue
        print(flatten_on_paper(src, dest))
    print("DONE opaque paper portraits")


if __name__ == "__main__":
    main()
