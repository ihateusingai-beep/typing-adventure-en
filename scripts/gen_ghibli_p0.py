#!/usr/bin/env python3
"""Generate Ghibli-style P0 assets for typing-adventure-en and replace third-party files."""
from __future__ import annotations

import base64
import io
import os
import sys
import time
from pathlib import Path

import requests
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps

ROOT = Path("/Users/kencheng/works/wuxia-typing-en-clone")
RAW = ROOT / "assets/_gen_raw"
RAW.mkdir(parents=True, exist_ok=True)

ENV = Path("/Users/kencheng/workspace/vs code/minimax-image-gen/.env")
API_KEY = None
with ENV.open() as f:
    for line in f:
        if line.startswith("MINIMAX_API_KEY="):
            API_KEY = line.strip().split("=", 1)[1].strip()
            break
if not API_KEY:
    raise SystemExit("no MINIMAX_API_KEY")

STYLE = (
    "Studio Ghibli soft pastel watercolor, hand-painted feel, warm gentle lighting, "
    "cozy atmosphere, soft edges, East Asian characters, expressive but soft faces, "
    "not chibi, not photoreal, no text, no letters, no logos, no watermark, no UI"
)

def gen(prompt: str, ratio: str = "16:9", retries: int = 2) -> Image.Image | None:
    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": "image-01",
        "prompt": f"{prompt}. {STYLE}",
        "aspect_ratio": ratio,
        "response_format": "base64",
    }
    for attempt in range(retries + 1):
        resp = requests.post(
            "https://api.minimax.io/v1/image_generation",
            headers=headers,
            json=payload,
            timeout=180,
        )
        data = resp.json()
        data_data = data.get("data")
        if data_data is None:
            code = data.get("base_resp", {}).get("status_code", 0)
            msg = data.get("base_resp", {}).get("status_msg", "unknown")
            print(f"  ERR code={code} {msg}")
            if code in (2056, 1008):
                return None  # quota
            time.sleep(2)
            continue
        b64 = data_data.get("image_base64", [])
        raw = base64.b64decode(b64[0] if isinstance(b64, list) else b64)
        return Image.open(io.BytesIO(raw)).convert("RGBA")
    return None


def save_webp(img: Image.Image, path: Path, size: tuple[int, int] | None = None, quality: int = 85):
    path.parent.mkdir(parents=True, exist_ok=True)
    out = img.convert("RGBA")
    if size:
        out = out.resize(size, Image.Resampling.LANCZOS)
    # webp via pillow
    rgb_check = out
    out.save(path, "WEBP", quality=quality, method=6)
    print(f"  W {path.relative_to(ROOT)} {path.stat().st_size}")


def key_white(img: Image.Image, thr: int = 245) -> Image.Image:
    """Make near-white background transparent."""
    img = img.convert("RGBA")
    datas = img.getdata()
    new = []
    for r, g, b, a in datas:
        if r >= thr and g >= thr and b >= thr:
            new.append((r, g, b, 0))
        else:
            new.append((r, g, b, a))
    img.putdata(new)
    return img


def fit_in_cell(img: Image.Image, cell: tuple[int, int], foot_y_ratio: float = 0.92) -> Image.Image:
    """Scale character to fit cell, bottom-weighted."""
    cw, ch = cell
    img = key_white(img)
    # trim alpha
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    iw, ih = img.size
    scale = min((cw * 0.85) / iw, (ch * 0.9) / ih)
    nw, nh = max(1, int(iw * scale)), max(1, int(ih * scale))
    img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    x = (cw - nw) // 2
    y = int(ch * foot_y_ratio) - nh
    y = max(0, min(y, ch - nh))
    canvas.paste(img, (x, y), img)
    return canvas


def build_motion_sheet(char: Image.Image) -> Image.Image:
    """4x4 grid 640 cell from one character with light per-cell variation."""
    cell, cols, rows = 640, 4, 4
    sheet = Image.new("RGBA", (cell * cols, cell * rows), (0, 0, 0, 0))
    base = fit_in_cell(char, (cell, cell))
    # variation recipes per index
    for idx in range(16):
        frame = base.copy()
        # subtle shift / scale for animation illusion
        dx = ((idx % 4) - 1.5) * 6
        if 2 <= idx <= 5:  # run
            dx = (idx % 2) * 18 - 9
            frame = ImageEnhance.Brightness(frame).enhance(1.02)
        if 8 <= idx <= 11:  # attack lean
            dx = 22
            frame = frame.rotate(-3 if idx % 2 == 0 else 4, resample=Image.Resampling.BICUBIC, expand=False)
        if 12 <= idx <= 13:  # defense
            dx = -12
        if 14 <= idx <= 15:  # hurt
            dx = -20
            frame = ImageEnhance.Color(frame).enhance(0.85)
        # paste with offset
        c = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
        c.paste(frame, (int(dx), 0), frame)
        r, col = divmod(idx, cols)
        # wait idx is row-major: row = idx // cols
        row, col = idx // cols, idx % cols
        sheet.paste(c, (col * cell, row * cell), c)
    return sheet


def build_enemy_sheet(char: Image.Image) -> Image.Image:
    cell, cols, rows = 256, 6, 5
    sheet = Image.new("RGBA", (cell * cols, cell * rows), (0, 0, 0, 0))
    base = fit_in_cell(char, (cell, cell), foot_y_ratio=0.95)
    for idx in range(cols * rows):
        frame = base.copy()
        dx = ((idx % 3) - 1) * 4
        if idx >= 12:
            frame = ImageEnhance.Brightness(frame).enhance(0.9)
        c = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
        c.paste(frame, (int(dx), 0), frame)
        row, col = idx // cols, idx % cols
        sheet.paste(c, (col * cell, row * cell), c)
    return sheet


def build_sig_sheet(char: Image.Image) -> Image.Image:
    cell, cols, rows = 640, 2, 3
    sheet = Image.new("RGBA", (cell * cols, cell * rows), (0, 0, 0, 0))
    base = fit_in_cell(char, (cell, cell))
    for idx in range(6):
        frame = base.rotate((-1) ** idx * (idx + 1) * 2, expand=False)
        if idx >= 3:
            frame = ImageEnhance.Brightness(frame).enhance(1.08)
        row, col = idx // cols, idx % cols
        sheet.paste(frame, (col * cell, row * cell), frame)
    return sheet


def build_npc_sheet(imgs: list[Image.Image]) -> Image.Image:
    """2x2 from 4 images (or pad)."""
    while len(imgs) < 4:
        imgs.append(imgs[-1] if imgs else Image.new("RGBA", (512, 512), (0, 0, 0, 0)))
    # normalize sizes
    w = h = 512
    sheet = Image.new("RGBA", (w * 2, h * 2), (0, 0, 0, 0))
    for i, im in enumerate(imgs[:4]):
        im = key_white(im)
        im = ImageOps.contain(im, (w, h), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        canvas.paste(im, ((w - im.width) // 2, (h - im.height) // 2), im)
        r, c = divmod(i, 2)
        sheet.paste(canvas, (c * w, r * h), canvas)
    return sheet


def portrait_and_thumb(char: Image.Image, portrait_path: Path, thumb_path: Path):
    im = key_white(char)
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    # height ~402
    target_h = 402
    scale = target_h / im.height
    nw = max(1, int(im.width * scale))
    im2 = im.resize((nw, target_h), Image.Resampling.LANCZOS)
    # pad transparent canvas width ~ aspect 0.55
    tw = max(nw, int(target_h * 0.55))
    canvas = Image.new("RGBA", (tw, target_h), (0, 0, 0, 0))
    canvas.paste(im2, ((tw - nw) // 2, 0), im2)
    save_webp(canvas, portrait_path, quality=88)
    thumb = ImageOps.contain(canvas, (256, 256), Image.Resampling.LANCZOS)
    tcan = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    tcan.paste(thumb, ((256 - thumb.width) // 2, (256 - thumb.height) // 2), thumb)
    save_webp(tcan, thumb_path, quality=85)


# --- job tables ---
BGS = [
    ("BG_YARD", "peaceful traditional East Asian martial arts school courtyard with wooden practice posts, mossy stones, maple leaves, morning mist, wide establishing shot"),
    ("BG_HALL", "warm wooden inner training hall, soft lantern light, empty center floor, paper windows, cozy Ghibli interior, wide shot"),
    ("BG_EXISTING_FROZEN", "gentle snowy mountain path, soft pastel sky, distant peaks, a small paper kite silhouette, calm adventure path, wide shot"),
    ("BG_BRIDGE", "bamboo footbridge over a quiet green stream, soft sunlight through leaves, peaceful riverside, wide shot"),
    ("BG_EXISTING_RUINS", "ancient soft stone ruins at dusk with glowing star-shaped paper lanterns, magical but gentle, wide shot"),
    ("BG_EXISTING_VOLCANO", "dramatic rocky outdoor arena with warm distant glow behind cliffs, still soft Ghibli lighting not scary, wide shot"),
    ("BG_IMMORTAL", "floating cloud terrace garden in soft gold sky, ethereal but gentle, wide shot"),
]

OUTFITS = [
    ("O00", "young East Asian hero trainee about 20 years old, simple deep blue cloth martial arts outfit, wooden practice sword, humble kind expression, full body"),
    ("O01", "same young hero type, green bamboo-disciple robe, bamboo-pattern wrist guards, gentle smile, full body"),
    ("O02", "same young hero type, light traveler outfit with small messenger bag and shoulder guards, wind-swept soft hair, full body"),
    ("O03", "same young hero type, soft blue-grey short cloak frost guardian look, gloves, calm focused face, full body"),
    ("O04", "same young hero type, elegant long golden-trimmed master robe, dignified warm expression, full body"),
    ("O05", "same young hero type, crimson short cloak fire-feather courier look, copper shoulder accents, full body"),
    ("O06", "same young hero type, moon-white sword robe with soft silver accents and blue sash, full body"),
    ("O07", "same young hero type, deep purple robe with subtle star embroidery and glowing soft sash, full body"),
]

ENEMIES = [
    ("E_NEW_01", "cute wooden training dummy with leafy bamboo hat, friendly not scary, full body centered"),
    ("E_NEW_02", "small adorable ink-blob spirit creature with tiny eyes, floating, full body centered"),
    ("E_NEW_03", "beautiful traditional paper kite bird spirit, pastel ribbons, full body centered"),
    ("E_NEW_04", "bamboo mechanical puppet guardian, gentle face, full body centered"),
    ("E_NEW_05", "stone lantern guardian spirit, soft moss and warm light, full body centered"),
    ("E_NEW_06", "ink-shadow swordsman silhouette with soft edges, mysterious but not horror, full body centered"),
    ("nether_lord_boss", "tall ink-lord cloaked swordsman boss, dramatic but Ghibli-soft, full body centered"),
]

NPC_EXPR = {
    "MASTER": [
        ("calm", "kind middle-aged East Asian martial arts teacher, calm gentle smile, upper body portrait"),
        ("demonstrating", "same teacher explaining with open hand gesture, patient face, upper body"),
        ("encouraging", "same teacher warm encouraging smile, upper body"),
        ("proud", "same teacher proud soft smile, upper body"),
    ],
    "PEER": [
        ("happy", "cheerful East Asian teen friend girl or boy, happy smile, upper body"),
        ("thinking", "same teen friend thoughtful expression, upper body"),
        ("surprised", "same teen friend surprised soft expression, upper body"),
        ("relieved", "same teen friend relieved smile, upper body"),
    ],
    "VILLAIN": [
        ("smug", "proud young rival swordsman, smug soft expression not evil, upper body"),
        ("focused", "same rival focused serious eyes, upper body"),
        ("surprised", "same rival mildly surprised, upper body"),
        ("respectful", "same rival respectful nod expression, upper body"),
    ],
}

ICONS = [
    "home", "journey", "challenges", "wardrobe", "boss", "target", "combo", "score", "clock",
    "next", "sound", "gem", "rank", "spell", "talisman", "shield", "settings", "pause", "gift", "star",
]
DETAILS = [
    "back", "retry", "help", "keyboard", "cloud", "local", "user", "lock", "check",
    "fullscreen", "upload", "download", "run", "jump", "exit", "close",
]


def run_batch(which: str):
    if which == "bg":
        for bid, desc in BGS:
            print(f"BG {bid}")
            img = gen(f"{desc}, wide establishing shot game background, empty of people", "16:9")
            if not img:
                print("STOP quota/fail"); return False
            img.save(RAW / f"{bid}.png")
            # 1672x941
            save_webp(img.convert("RGB").convert("RGBA"), ROOT / f"assets/v3/backgrounds/{bid}.webp", (1672, 941))
            if bid == "BG_IMMORTAL":
                save_webp(img.convert("RGBA"), ROOT / "assets/v3/xianxia/immortal-court.webp", (1672, 941))
            if bid == "BG_YARD":
                save_webp(img.convert("RGBA"), ROOT / "assets/backgrounds/battle_forest_pixel.jpg".replace(".jpg", ".webp") if False else ROOT / "assets/backgrounds/battle_forest_pixel.jpg", (1672, 941))
                # save as jpg-named webp content is ok? better real jpeg
                rgb = img.convert("RGB").resize((1672, 941), Image.Resampling.LANCZOS)
                (ROOT / "assets/backgrounds").mkdir(parents=True, exist_ok=True)
                rgb.save(ROOT / "assets/backgrounds/battle_forest_pixel.jpg", quality=85)
            time.sleep(1.5)
        return True

    if which == "outfits":
        for oid, desc in OUTFITS:
            print(f"OUTFIT {oid}")
            img = gen(
                f"{desc}, plain soft white background, single character only, full body head to toe, "
                f"feet visible, centered, soft shadow optional",
                "3:4",
            )
            if not img:
                print("STOP"); return False
            img.save(RAW / f"{oid}.png")
            portrait_and_thumb(
                img,
                ROOT / f"assets/v3/q3/{oid}-portrait.webp",
                ROOT / f"assets/v3/q3/{oid}-thumb.webp",
            )
            motion = build_motion_sheet(img)
            save_webp(motion, ROOT / f"assets/v3/q3/{oid}-motion.webp", quality=80)
            sig = build_sig_sheet(img)
            save_webp(sig, ROOT / f"assets/v3/signatures/{oid}-attack.webp", quality=80)
            time.sleep(1.5)
        return True

    if which == "enemies":
        for eid, desc in ENEMIES:
            print(f"ENEMY {eid}")
            img = gen(
                f"{desc}, plain soft white background, single subject, game enemy concept, full body",
                "1:1",
            )
            if not img:
                print("STOP"); return False
            img.save(RAW / f"{eid}.png")
            if eid == "nether_lord_boss":
                # gif-ish: save webp sheet as enemy alternative + gif frames
                sheet = build_enemy_sheet(img)
                # also put as gif simple
                (ROOT / "assets/monsters").mkdir(parents=True, exist_ok=True)
                frame = fit_in_cell(img, (256, 256))
                frame.convert("P", palette=Image.Palette.ADAPTIVE).save(
                    ROOT / "assets/monsters/nether_lord_boss.gif", save_all=False
                )
                # store a webp sheet path unused unless media updated — still ok gif
            else:
                sheet = build_enemy_sheet(img)
                save_webp(sheet, ROOT / f"assets/v3/enemies/{eid}.webp", quality=80)
            time.sleep(1.5)
        return True

    if which == "npc":
        mapping = {
            "MASTER": "master-portraits.webp",
            "PEER": "peer-portraits.webp",
            "VILLAIN": "villain-portraits.webp",
        }
        for nid, exprs in NPC_EXPR.items():
            frames = []
            for label, desc in exprs:
                print(f"NPC {nid} {label}")
                img = gen(f"{desc}, plain soft white background, bust portrait", "1:1")
                if not img:
                    print("STOP"); return False
                img.save(RAW / f"{nid}_{label}.png")
                frames.append(img)
                time.sleep(1.2)
            sheet = build_npc_sheet(frames)
            save_webp(sheet, ROOT / f"assets/v3/portraits/{mapping[nid]}", quality=85)
        return True

    if which == "icons":
        for name in ICONS:
            print(f"ICON {name}")
            img = gen(
                f"simple cute game UI icon symbol for '{name}', centered, soft pastel Ghibli color, "
                f"readable silhouette, plain soft cream background, single icon only",
                "1:1",
            )
            if not img:
                print("STOP"); return False
            img = ImageOps.contain(img.convert("RGBA"), (128, 128), Image.Resampling.LANCZOS)
            c = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
            # optional key cream
            img = key_white(img, thr=250)
            c.paste(img, ((128 - img.width) // 2, (128 - img.height) // 2), img)
            save_webp(c, ROOT / f"assets/v3/ui/icons/{name}.webp", quality=85)
            time.sleep(0.8)
        for name in DETAILS:
            print(f"DETAIL {name}")
            img = gen(
                f"simple cute game UI small icon for '{name}', centered, soft pastel, plain cream background",
                "1:1",
            )
            if not img:
                print("STOP"); return False
            img = key_white(ImageOps.contain(img.convert("RGBA"), (128, 128), Image.Resampling.LANCZOS), 250)
            c = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
            c.paste(img, ((128 - img.width) // 2, (128 - img.height) // 2), img)
            save_webp(c, ROOT / f"assets/v3/ui/details/{name}.webp", quality=85)
            time.sleep(0.8)
        # favicon portrait from O00 raw if exists else gen
        if (RAW / "O00.png").exists():
            im = Image.open(RAW / "O00.png").convert("RGBA")
        else:
            im = gen("young hero face icon soft ghibli, cream bg", "1:1")
        if im:
            im = ImageOps.fit(im.convert("RGB"), (256, 256), Image.Resampling.LANCZOS)
            (ROOT / "assets/ui").mkdir(parents=True, exist_ok=True)
            im.save(ROOT / "assets/ui/portrait.png")
            print("  W assets/ui/portrait.png")
        return True

    print("unknown batch", which)
    return False


if __name__ == "__main__":
    batch = sys.argv[1] if len(sys.argv) > 1 else "bg"
    ok = run_batch(batch)
    print("RESULT", "OK" if ok else "FAIL", batch)
    sys.exit(0 if ok else 1)
