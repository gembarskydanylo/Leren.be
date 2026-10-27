# Run: python3 tools/tg-bot/make-stickers.py img/mascot/student-cat-v1.png fonts/unbounded.woff stickers  (needs Pillow)
# Cuts the six poses of img/mascot/student-cat-v1.png into 512x512 Telegram stickers with a Dutch caption.
import sys
from collections import deque
from PIL import Image, ImageDraw, ImageFont
src, fontp, out = sys.argv[1], sys.argv[2], sys.argv[3]
atlas = Image.open(src).convert("RGBA")
captions = ["Dag!", "Ik leer!", "Even denken…", "Super!", "Je kunt het!", "Voor jou!"]

def keep_main(cell):
    """Drop stray specks: keep only blobs that are at least 2% of the biggest one (the star in pose 4 survives)."""
    a = cell.getchannel("A"); w, h = a.size; px = a.load()
    seen = bytearray(w * h); blobs = []
    for y in range(h):
        for x in range(w):
            if px[x, y] > 20 and not seen[y * w + x]:
                q, pts = deque([(x, y)]), []; seen[y * w + x] = 1
                while q:
                    cx, cy = q.popleft(); pts.append((cx, cy))
                    for nx, ny in ((cx+1, cy), (cx-1, cy), (cx, cy+1), (cx, cy-1)):
                        if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and px[nx, ny] > 20:
                            seen[ny * w + nx] = 1; q.append((nx, ny))
                blobs.append(pts)
    big = max(len(b) for b in blobs)
    c = cell.copy(); cp = c.load()
    for b in blobs:
        if len(b) < big * 0.02:
            for x, y in b: cp[x, y] = (0, 0, 0, 0)
    return c

for i, cap in enumerate(captions):
    cell = keep_main(atlas.crop(((i % 3) * 512, (i // 3) * 512, (i % 3) * 512 + 512, (i // 3) * 512 + 512)))
    cat = cell.crop(cell.getbbox())
    scale = min(470 / cat.width, 400 / cat.height)
    cat = cat.resize((round(cat.width * scale), round(cat.height * scale)), Image.LANCZOS)
    st = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    st.alpha_composite(cat, ((512 - cat.width) // 2, 8))
    d = ImageDraw.Draw(st)
    size = 58
    while d.textlength(cap, font=ImageFont.truetype(fontp, size)) > 440: size -= 2
    font = ImageFont.truetype(fontp, size)
    w = d.textlength(cap, font=font)
    d.text(((512 - w) / 2, 470 - size / 2 - 8), cap, font=font, fill="#1E1712", stroke_width=9, stroke_fill="white")
    st.save(f"{out}/cat-{i + 1}.png", optimize=True)
