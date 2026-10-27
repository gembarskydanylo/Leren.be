#!/usr/bin/env python3
"""Clean icons cut out of generated sheets and make them app-sized.

For every PNG: keep the main object, drop pieces of neighbouring icons that touch
the image edge, remove the faint coloured fringe, centre the object with the same
margin for all icons, resize to 256x256 and save a compact palette PNG.

    python3 tools/clean-emoji.py SRC_DIR OUT_DIR [--size 256]

Needs Pillow, numpy and scipy.
"""
import argparse, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

def clean(img, size=256, margin=0.08):
    a = np.array(img.convert('RGBA'))
    alpha = a[:, :, 3].astype(np.int32)
    solid = alpha > 24
    labels, n = ndimage.label(solid, structure=np.ones((3, 3)))
    if n == 0:
        return img.resize((size, size))
    sizes = ndimage.sum(solid, labels, range(1, n + 1))
    ids = list(range(1, n + 1))
    h, w = solid.shape
    cy, cx = h / 2, w / 2
    objs = ndimage.find_objects(labels)
    def centre(i):
        sl = objs[i - 1]; return ((sl[0].start + sl[0].stop) / 2, (sl[1].start + sl[1].stop) / 2)
    # Main object: the biggest piece, preferring pieces near the middle of the image.
    def score(i):
        y, x = centre(i); d = ((y - cy) ** 2 + (x - cx) ** 2) ** .5 / (h / 2)
        return sizes[i - 1] * (1.0 - min(d, 0.9))
    main = max(ids, key=score)
    my, mx = centre(main)
    def cut_edge(i):
        """A slice of a neighbouring icon has a straight cut on the side away from the main object."""
        sl = objs[i - 1]; comp = labels[sl] == i
        y, x = centre(i)
        # look at the 3 outermost lines: anti-aliasing makes the very last one thin
        rows = {'top': comp[:3].max(0), 'bottom': comp[-3:].max(0), 'left': comp[:, :3].max(1), 'right': comp[:, -3:].max(1)}
        sides = []
        if y < my: sides.append('top')
        if y > my: sides.append('bottom')
        if x < mx: sides.append('left')
        if x > mx: sides.append('right')
        for side in sides:
            line = rows[side]
            if line.sum() >= max(10, 0.35 * len(line)):
                return True
        return False
    keep = np.zeros(n + 1, bool)
    keep[main] = True
    ref = sizes[main - 1]
    pieces = sum(1 for i in ids if sizes[i - 1] >= 0.1 * ref)  # fireworks, confetti: many real pieces
    for i in ids:
        if i == main or sizes[i - 1] < 0.004 * ref:
            continue
        msl, sl = objs[main - 1], objs[i - 1]
        # a whole neighbour from the row above/below: big, with no rows in common with the icon
        other_row = sl[0].stop <= msl[0].start or sl[0].start >= msl[0].stop
        keep[i] = not cut_edge(i) and not (other_row and pieces <= 4 and sizes[i - 1] >= 0.3 * ref)
    mask = keep[labels]
    # Grow the kept area by 2 px so the soft anti-aliased edge of the object stays.
    mask = ndimage.binary_dilation(mask, iterations=2)
    alpha = np.where(mask, alpha, 0)
    # Fringe: very faint pixels carry the old background colour; drop them and
    # pull the remaining edge colour towards the object's own colour.
    alpha = np.where(alpha < 40, 0, alpha)
    edgepx = (alpha > 0) & (alpha < 200)
    if edgepx.any():
        inner = ndimage.grey_erosion(alpha, size=3) >= 200
        rgb = a[:, :, :3].astype(np.float32)
        # nearest solid colour for edge pixels
        idx = ndimage.distance_transform_edt(~inner, return_distances=False, return_indices=True)
        near = rgb[idx[0], idx[1]]
        t = (alpha[..., None] / 255.0)
        rgb = np.where(edgepx[..., None], near * (1 - t * 0.5) + rgb * (t * 0.5), rgb)
        a[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    a[:, :, 3] = alpha.astype(np.uint8)
    ys, xs = np.nonzero(alpha)
    if not len(xs):
        return img.resize((size, size))
    box = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    obj = Image.fromarray(box, 'RGBA')
    inner_size = int(size * (1 - 2 * margin))
    obj.thumbnail((inner_size, inner_size), Image.LANCZOS)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(obj, ((size - obj.width) // 2, (size - obj.height) // 2), obj)
    return out

def main():
    p = argparse.ArgumentParser()
    p.add_argument('src'); p.add_argument('out'); p.add_argument('--size', type=int, default=256)
    p.add_argument('--glob', default='card-*.png')
    args = p.parse_args()
    out = pathlib.Path(args.out); out.mkdir(parents=True, exist_ok=True)
    total = 0
    for f in sorted(pathlib.Path(args.src).glob(args.glob)):
        img = clean(Image.open(f), args.size)
        q = img.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
        target = out / f.name
        q.save(target, optimize=True)
        total += target.stat().st_size
    print(f'{len(list(out.glob(args.glob)))} icons, {total // 1024} KB')

if __name__ == '__main__':
    main()
