# Prompt for Codex: generate 3D scene pictures and publish them on Leren.be

You work in the repository gembarskydanylo/Leren.be (Dutch-learning PWA, GitHub Pages, production lerenbe.com).
Another agent also edits this repo, so before anything: `git pull --no-rebase origin main`.

## 1. Generate
Generate every picture from the list in CODEX-SCENES-LIST.md (id -> scene) with your image tool.
Style for ALL pictures (paste unchanged into every generation):
"A cute 3D rendered icon in the style of Microsoft Fluent Emoji 3D / soft glossy clay: rounded smooth shapes, soft plastic material, gentle studio lighting from the top left, subtle soft shadow under the object, vibrant but friendly colors. A single centered subject on a plain warm cream background (#FFF4E6), square 1:1 composition, subject fills about 75% of the frame, generous margin, no text, no letters, no watermark, no border, no extra objects, family-friendly."
Character (when a person is in the picture), identical every time: "a friendly adult with short brown hair, light-blue t-shirt, gray trousers, round soft face, small dot eyes and small mouth, neutral skin tone".
Pain pictures: the aching body part glows soft red-orange with three small red sparks; the rest stays calm; the face is slightly pained but not scary, no blood.
Keep the character identical across images (use the first good image as reference).

## 2. Save
Save each result as `img/scenes/<id>.png` (square, 1024 px), where `<id>` is exactly the id from the list (e.g. `kl_12.png`, `course_pt_klachten_5.png`). Use only ids from the list. Do not overwrite anything outside `img/scenes/`.

## 3. Publish (one command, do not edit other files by hand)
```
python3 tools/add-scenes.py
```
It converts to 512 px WebP, rewrites `modules/scenes/map.js`, the scene block in `sw.js`, and bumps the cache/release version. It is safe to run again after adding more pictures.

## 4. Check
- `for t in tests/*.cjs; do node $t || echo FAIL $t; done` must print no FAIL.
- Serve the repo (`python3 -m http.server 8767`), open index.html at 390x800, open the lesson "Здоров'я та лікар → Мені погано: скарги" and confirm the new pictures appear and are not cropped.

## 5. Ship
```
git add -A && git commit -m "Add 3D scene pictures" && git pull --no-rebase origin main && git push origin HEAD:main
```
If the pull conflicts in sw.js, index.html or modules/scenes/map.js, take both sides and re-run `python3 tools/add-scenes.py`. Then check `gh run list -R gembarskydanylo/Leren.be -L 1` shows success.
Publish ALL pictures you have generated so far, in one go; later batches use the same steps.
