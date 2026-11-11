#!/usr/bin/env python3
"""Pack real pose stills into hero 4x4 / enemy 6x5 sheets + combat FX strips."""
from __future__ import annotations
import colorsys
from pathlib import Path
from collections import deque
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageOps, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets/_gen_raw/motion"
FXR = ROOT / "assets/_gen_raw/fx"
OUT_Q3 = ROOT / "assets/v3/q3"
OUT_EN = ROOT / "assets/v3/enemies"
OUT_FX = ROOT / "assets/v3/combat-fx"
OUT_SIG = ROOT / "assets/v3/signatures"
OUT_XIAN = ROOT / "assets/v3/xianxia"
for p in (OUT_Q3, OUT_EN, OUT_FX, OUT_SIG, OUT_XIAN):
    p.mkdir(parents=True, exist_ok=True)


def flood_cut(im: Image.Image, tol: int = 42) -> Image.Image:
    """Corner flood-fill near-bg → alpha; soft edge."""
    im = im.convert("RGBA")
    arr = np.array(im)
    h, w = arr.shape[:2]
    # sample corner median as bg
    corners = np.concatenate(
        [
            arr[0:8, 0:8].reshape(-1, 4),
            arr[0:8, w - 8 : w].reshape(-1, 4),
            arr[h - 8 : h, 0:8].reshape(-1, 4),
            arr[h - 8 : h, w - 8 : w].reshape(-1, 4),
        ]
    )
    bg = np.median(corners[:, :3], axis=0)
    visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for y, x in [(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1), (0, w // 2), (h - 1, w // 2), (h // 2, 0), (h // 2, w - 1)]:
        q.append((y, x))
        visited[y, x] = True
    mask = np.zeros((h, w), dtype=bool)
    while q:
        y, x = q.popleft()
        pix = arr[y, x, :3].astype(np.float32)
        if np.linalg.norm(pix - bg) <= tol or (arr[y, x, 3] < 20):
            mask[y, x] = True
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                    visited[ny, nx] = True
                    q.append((ny, nx))
    # also kill near-white interior only if connected? keep interior whites (eyes)
    alpha = arr[:, :, 3].astype(np.float32)
    alpha[mask] = 0
    # soft edge: erode mask boundary
    from PIL import Image as _I

    mimg = _I.fromarray((mask * 255).astype(np.uint8))
    soft = np.array(mimg.filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255.0
    alpha = alpha * (1.0 - soft) + alpha * 0  # outside soft already 0
    # restore non-mask with original alpha * (1-soft) already; for non-mask soft~0
    alpha = arr[:, :, 3].astype(np.float32) * (1.0 - soft)
    out = arr.copy()
    out[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    # kill near-white leftover only on edges where soft high
    return Image.fromarray(out, "RGBA")


def bbox_content(im: Image.Image, a_thr: int = 12):
    arr = np.array(im)
    a = arr[:, :, 3]
    ys, xs = np.where(a > a_thr)
    if len(xs) == 0:
        return (0, 0, im.width, im.height)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def fit_cell(im: Image.Image, cell: int, foot_y_ratio: float = 0.97, body_ratio: float = 0.88) -> Image.Image:
    """Place cutout into square cell, feet near bottom."""
    im = flood_cut(im)
    x0, y0, x1, y1 = bbox_content(im)
    crop = im.crop((x0, y0, x1, y1))
    bw, bh = crop.size
    target_h = int(cell * body_ratio)
    scale = target_h / max(bh, 1)
    # don't exceed width
    if bw * scale > cell * 0.9:
        scale = (cell * 0.9) / max(bw, 1)
    nw, nh = max(1, int(bw * scale)), max(1, int(bh * scale))
    crop = crop.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
    fx = (cell - nw) // 2
    fy = int(cell * foot_y_ratio) - nh
    fy = max(0, min(cell - nh, fy))
    canvas.paste(crop, (fx, fy), crop)
    return canvas


def lerp_pose(a: Image.Image, b: Image.Image, t: float) -> Image.Image:
    a, b = a.convert("RGBA"), b.convert("RGBA")
    return Image.blend(a, b, t)


def shift_pose(im: Image.Image, dx: int = 0, dy: int = 0, rot: float = 0, scale: float = 1.0) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    if abs(rot) > 0.01 or abs(scale - 1) > 0.001:
        im = im.rotate(rot, resample=Image.Resampling.BICUBIC, expand=False, fillcolor=(0, 0, 0, 0))
        if abs(scale - 1) > 0.001:
            nw, nh = int(w * scale), int(h * scale)
            im = im.resize((nw, nh), Image.Resampling.LANCZOS)
            canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
            canvas.paste(im, ((w - nw) // 2, (h - nh) // 2), im)
            im = canvas
    if dx or dy:
        canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        canvas.paste(im, (dx, dy), im)
        im = canvas
    return im


def pack_hero():
    cell = 640
    # sources
    idle_src = ROOT / "assets/_gen_raw/O00.png"
    paths = {
        "idle": idle_src,
        "run": RAW / "O00c_run.jpg",
        "jump": RAW / "O00c_jump.jpg",
        "cast": RAW / "O00c_cast.jpg",
        "attack": RAW / "O00c_attack.jpg",
        "defense": RAW / "O00c_defense.jpg",
        "hurt": RAW / "O00c_hurt.jpg",
    }
    base = {k: fit_cell(Image.open(p), cell) for k, p in paths.items() if p.exists()}
    # ensure idle
    if "idle" not in base:
        base["idle"] = fit_cell(Image.open(RAW / "O00_cell0.png"), cell)

    # 16 cells layout matching media.json actions
    # 0-1 idle, 2-5 run, 3-4 also jump overlap ok, 6-7 cast, 8-11 attack, 12-13 defense, 14-15 hurt
    cells = [None] * 16
    idle = base["idle"]
    cells[0] = idle
    cells[1] = shift_pose(idle, dy=-6, scale=1.01)  # breath
    run = base.get("run", idle)
    jump = base.get("jump", shift_pose(idle, dy=-40))
    cells[2] = shift_pose(run, dx=-8)
    cells[3] = jump
    cells[4] = shift_pose(run, dx=10, dy=-4)
    cells[5] = shift_pose(run, dx=-4, dy=2, scale=0.99)
    cast = base.get("cast", idle)
    cells[6] = cast
    cells[7] = shift_pose(cast, dy=-8, scale=1.02)
    atk = base.get("attack", idle)
    # attack 4-frame: windup blend idle→atk, atk, follow, recover
    cells[8] = lerp_pose(idle, atk, 0.35)
    cells[9] = lerp_pose(idle, atk, 0.7)
    cells[10] = atk
    cells[11] = lerp_pose(atk, idle, 0.45)
    guard = base.get("defense", idle)
    cells[12] = guard
    cells[13] = shift_pose(guard, dy=-4, scale=1.015)
    hurt = base.get("hurt", shift_pose(idle, dx=-12, rot=-6))
    cells[14] = hurt
    cells[15] = shift_pose(hurt, dx=-6, dy=4, rot=-3)

    sheet = Image.new("RGBA", (cell * 4, cell * 4), (0, 0, 0, 0))
    for i, c in enumerate(cells):
        r, col = divmod(i, 4)
        sheet.paste(c, (col * cell, r * cell), c)
    out = OUT_Q3 / "O00-motion.webp"
    sheet.save(out, "WEBP", quality=90, method=6)
    print("hero motion", out, sheet.size, "alpha%", transparency_pct(sheet))

    # signature 2x3 attack-ish frames
    sig = Image.new("RGBA", (cell * 2, cell * 3), (0, 0, 0, 0))
    seq = [cells[8], cells[9], cells[10], cells[11], cells[6], cells[0]]
    for i, c in enumerate(seq):
        r, col = divmod(i, 2)
        sig.paste(c, (col * cell, r * cell), c)
    sout = OUT_SIG / "O00-attack.webp"
    sig.save(sout, "WEBP", quality=90, method=6)
    print("signature", sout, sig.size)


def transparency_pct(im: Image.Image) -> float:
    a = np.array(im)[:, :, 3]
    return float((a < 10).mean() * 100)


def pack_enemy():
    cell = 256
    cols, rows = 6, 5
    idle_src = ROOT / "assets/_gen_raw/E_NEW_01.png"
    paths = {
        "idle": idle_src,
        "anticipation": RAW / "E01c_anticipation.jpg",
        "attack": RAW / "E01c_attack.jpg",
        "hurt": RAW / "E01c_hurt.jpg",
        "exit": RAW / "E01c_exit.jpg",
    }
    base = {k: fit_cell(Image.open(p), cell, foot_y_ratio=0.96, body_ratio=0.86) for k, p in paths.items() if p.exists()}
    idle = base["idle"]
    ant = base.get("anticipation", shift_pose(idle, dy=6, scale=0.96))
    atk = base.get("attack", shift_pose(idle, dx=10))
    hurt = base.get("hurt", shift_pose(idle, dx=-8, rot=5))
    ex = base.get("exit", shift_pose(idle, rot=25, dy=20, scale=0.95))

    sheet = Image.new("RGBA", (cell * cols, cell * rows), (0, 0, 0, 0))
    # row0 idle x6
    for c in range(6):
        fr = shift_pose(idle, dy=int(np.sin(c / 6 * np.pi * 2) * 3), scale=1 + 0.01 * np.sin(c))
        sheet.paste(fr, (c * cell, 0 * cell), fr)
    # row1 anticipation x4 (fill 6 with variants)
    ant_seq = [ant, shift_pose(ant, dy=4), shift_pose(ant, scale=0.98, dy=6), lerp_pose(ant, atk, 0.25), ant, shift_pose(ant, dx=-2)]
    for c, fr in enumerate(ant_seq):
        sheet.paste(fr, (c * cell, 1 * cell), fr)
    # row2 attack x6
    atk_seq = [
        lerp_pose(ant, atk, 0.3),
        lerp_pose(ant, atk, 0.55),
        atk,
        shift_pose(atk, dx=6),
        lerp_pose(atk, idle, 0.4),
        lerp_pose(atk, idle, 0.7),
    ]
    for c, fr in enumerate(atk_seq):
        sheet.paste(fr, (c * cell, 2 * cell), fr)
    # row3 hurt x4 + pad
    hurt_seq = [hurt, shift_pose(hurt, dx=-4, rot=3), shift_pose(hurt, dy=4), lerp_pose(hurt, idle, 0.5), hurt, shift_pose(hurt, dx=-2)]
    for c, fr in enumerate(hurt_seq):
        sheet.paste(fr, (c * cell, 3 * cell), fr)
    # row4 exit
    exit_seq = [ex, shift_pose(ex, rot=10, dy=8), shift_pose(ex, rot=20, dy=16, scale=0.92), shift_pose(ex, rot=35, dy=28, scale=0.85)]
    for c in range(6):
        fr = exit_seq[min(c, len(exit_seq) - 1)]
        # fade last frames
        if c >= 4:
            fr = fr.copy()
            a = np.array(fr)
            a[:, :, 3] = (a[:, :, 3].astype(np.float32) * (0.55 if c == 4 else 0.25)).astype(np.uint8)
            fr = Image.fromarray(a, "RGBA")
        sheet.paste(fr, (c * cell, 4 * cell), fr)

    out = OUT_EN / "E_NEW_01.webp"
    sheet.save(out, "WEBP", quality=90, method=6)
    print("enemy", out, sheet.size, "alpha%", transparency_pct(sheet))


def black_to_alpha(im: Image.Image, thr: int = 28) -> Image.Image:
    im = im.convert("RGBA")
    arr = np.array(im).astype(np.float32)
    rgb = arr[:, :, :3]
    lum = rgb.mean(axis=2)
    # darkness → alpha inverse for VFX on black
    alpha = np.clip((lum - thr) / max(1, 255 - thr) * 255, 0, 255)
    # boost chroma where bright
    arr[:, :, 3] = alpha
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def split_h_frames(im: Image.Image, n: int = 4) -> list[Image.Image]:
    im = im.convert("RGBA")
    w, h = im.size
    fw = w // n
    return [im.crop((i * fw, 0, (i + 1) * fw, h)) for i in range(n)]


def pack_fx_strip(src: Path, out: Path, cell: int = 512, n: int = 4, tint: tuple | None = None):
    im = black_to_alpha(Image.open(src))
    # If the generator put all frames in one image not evenly, still slice equally
    frames = split_h_frames(im, n)
    # also try: if content is single effect, synthesize 4 scales
    # check variance across slices
    dens = [np.array(f)[:, :, 3].mean() for f in frames]
    if max(dens) < 5 or (max(dens) - min(dens) < 1 and dens[0] < 20):
        # fallback: whole image as base, scale stages
        base = im
        x0, y0, x1, y1 = bbox_content(base, 8)
        base = base.crop((x0, y0, x1, y1))
        frames = []
        for i, sc in enumerate((0.35, 0.65, 1.0, 0.75)):
            canvas = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
            bw, bh = base.size
            scale = sc * min((cell * 0.85) / max(bw, 1), (cell * 0.85) / max(bh, 1))
            nw, nh = max(1, int(bw * scale)), max(1, int(bh * scale))
            fr = base.resize((nw, nh), Image.Resampling.LANCZOS)
            if i == 3:
                a = np.array(fr)
                a[:, :, 3] = (a[:, :, 3].astype(np.float32) * 0.45).astype(np.uint8)
                fr = Image.fromarray(a, "RGBA")
            canvas.paste(fr, ((cell - nw) // 2, (cell - nh) // 2), fr)
            frames.append(canvas)
    else:
        # fit each frame into cell
        fitted = []
        for fr in frames:
            x0, y0, x1, y1 = bbox_content(fr, 8)
            fr = fr.crop((x0, y0, x1, y1)) if x1 > x0 else fr
            canvas = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
            bw, bh = fr.size
            scale = min((cell * 0.9) / max(bw, 1), (cell * 0.9) / max(bh, 1))
            nw, nh = max(1, int(bw * scale)), max(1, int(bh * scale))
            fr = fr.resize((nw, nh), Image.Resampling.LANCZOS)
            canvas.paste(fr, ((cell - nw) // 2, (cell - nh) // 2), fr)
            fitted.append(canvas)
        frames = fitted

    if tint:
        tinted = []
        for fr in frames:
            arr = np.array(fr).astype(np.float32)
            a = arr[:, :, 3:4] / 255.0
            color = np.array(tint, dtype=np.float32).reshape(1, 1, 3)
            # keep luminance, apply tint
            lum = arr[:, :, :3].mean(axis=2, keepdims=True) / 255.0
            arr[:, :, :3] = np.clip(color * (0.35 + 0.9 * lum) * 255, 0, 255)
            tinted.append(Image.fromarray(arr.astype(np.uint8), "RGBA"))
        frames = tinted

    strip = Image.new("RGBA", (cell * n, cell), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        strip.paste(fr, (i * cell, 0), fr)
    strip.save(out, "WEBP", quality=92, method=6)
    # ink bounds approx
    x0, y0, x1, y1 = bbox_content(frames[2] if len(frames) > 2 else frames[0], 10)
    print("fx", out.name, strip.size, "alpha%", round(transparency_pct(strip), 1), "ink", (x0, y0, x1, y1))
    return (x0, y0, x1, y1)


def pack_all_fx():
    blade_src = FXR / "blade_sheet.jpg"
    ward_src = FXR / "ward_sheet.jpg"
    hit_src = FXR / "hit_sheet.jpg"
    # if single-effect images, still ok
    b_ink = pack_fx_strip(blade_src, OUT_FX / "blade.webp", 512, 4, tint=(242, 220, 157))
    pack_fx_strip(ward_src, OUT_FX / "ward.webp", 512, 4, tint=(120, 210, 180))
    pack_fx_strip(hit_src, OUT_FX / "thunder.webp", 512, 4, tint=(193, 171, 255))
    pack_fx_strip(blade_src, OUT_FX / "frost.webp", 512, 4, tint=(168, 230, 255))
    pack_fx_strip(hit_src, OUT_FX / "flame.webp", 512, 4, tint=(255, 174, 120))

    # O00-fx 384 cell x4 (signature)
    ink = pack_fx_strip(blade_src, OUT_SIG / "O00-fx.webp", 384, 4, tint=(242, 220, 157))
    # icon 128
    icon_src = Image.open(blade_src).convert("RGBA")
    icon = black_to_alpha(icon_src)
    # take center crop
    w, h = icon.size
    side = min(w, h)
    icon = icon.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2)).resize((128, 128), Image.Resampling.LANCZOS)
    icon.save(OUT_SIG / "O00-icon.webp", "WEBP", quality=90)
    print("icon", OUT_SIG / "O00-icon.webp")

    # minimal xianxia fallbacks (single soft glow frames reused as 4x4 atlas via same strip scaled)
    for name, tint in [("sword_arc", (242, 220, 157)), ("relic-arts", (200, 180, 255))]:
        pack_fx_strip(blade_src if "sword" in name else hit_src, OUT_XIAN / f"{name}.webp", 256, 4, tint=tint)


def main():
    pack_hero()
    pack_enemy()
    pack_all_fx()
    print("DONE pack")


if __name__ == "__main__":
    main()
