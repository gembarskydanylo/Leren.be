#!/usr/bin/env python3
"""Publish generated 3D scene pictures.

Put images named <card-id>.png|.jpg|.webp into img/scenes/ (e.g. kl_12.png, course_pt_klachten_5.png),
then run:  python3 tools/add-scenes.py
It converts to 512px WebP, rewrites modules/scenes/map.js and the scene block in sw.js, bumps the
service-worker cache and the ?v= of the map file. Unknown ids are reported, nothing else is touched.
"""
import re, sys, pathlib
from PIL import Image
root = pathlib.Path(__file__).resolve().parent.parent
sd = root / "img" / "scenes"
ids = set(re.findall(r'\["([A-Za-z0-9_]+)",', (root / "index.html").read_text(encoding="utf-8")))
ids |= set(re.findall(r'^\s*"?(course_[a-z0-9_]+)"?', "", re.M))
known = None
done = {}
for f in sorted(sd.iterdir()):
    if f.suffix.lower() not in (".png", ".jpg", ".jpeg", ".webp"): continue
    cid = f.stem
    out = sd / (cid + ".webp")
    im = Image.open(f).convert("RGBA")
    if max(im.size) > 512: im.thumbnail((512, 512), Image.LANCZOS)
    im.save(out, "WEBP", quality=88, method=6)
    if f != out: f.unlink()
    done[cid] = cid + ".webp"
(root / "modules" / "scenes" / "map.js").write_text(
    "globalThis.LerenScenes = " + __import__("json").dumps(done, ensure_ascii=False, sort_keys=True) + ";\n", encoding="utf-8")
sw = (root / "sw.js").read_text(encoding="utf-8")
sw = re.sub(r"\n// scenes-begin.*?// scenes-end", "", sw, flags=re.S)
m = re.search(r'CACHE_NAME = "leren-be-v(\d+)"', sw)
ver = int(m.group(1)) + 1
sw = sw.replace(m.group(0), f'CACHE_NAME = "leren-be-v{ver}"')
block = "\n// scenes-begin\n" + "".join(f'APP_FILES.push("./img/scenes/{v}");\n' for v in done.values()) + \
        f'APP_FILES.push("./modules/scenes/map.js?v={ver}");\n// scenes-end'
sw = sw.rstrip("\n") + block + "\n"
(root / "sw.js").write_text(sw, encoding="utf-8")
idx = (root / "index.html").read_text(encoding="utf-8")
idx = re.sub(r"modules/scenes/map\.js\?v=\d+", f"modules/scenes/map.js?v={ver}", idx)
idx = re.sub(r'const RELEASE_VERSION="\d+"', f'const RELEASE_VERSION="{ver}"', idx)
(root / "index.html").write_text(idx, encoding="utf-8")
print(f"{len(done)} scene pictures published, release {ver}")
