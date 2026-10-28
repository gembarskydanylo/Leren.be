#!/usr/bin/env python3
"""Build the card pictures that must differ from a sibling card (knee vs leg, toe vs foot, aunt vs mother, ...).

Inputs: complete Fluent Emoji 3D pictures (MIT) downloaded into SRC (<key>.png, 256 px, transparent).
Output: img/emoji/kb-<name>.png (192 px) and modules/emoji/variants.js (card id -> picture).

    python3 tools/make-card-variants.py SRC_DIR
"""
import json, sys, pathlib
from PIL import Image, ImageDraw

SRC = pathlib.Path(sys.argv[1]); OUT = pathlib.Path('img/emoji')
RED = (229, 72, 77, 255); SS = 4

def load(k):
    return Image.open(SRC / f'{k}.png').convert('RGBA')

def fit(im, size):
    im = im.crop(im.getbbox()); im.thumbnail((size, size), Image.LANCZOS); return im

def canvas():
    return Image.new('RGBA', (256, 256), (0, 0, 0, 0))

def put(c, im, cx, cy):
    c.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))

def ring_arrow(c, centre, r=26, arrow_from=None):
    """Red ring (white inner halo) and an arrow pointing to it, drawn 4x and scaled down for smooth edges."""
    big = Image.new('RGBA', (256 * SS, 256 * SS), (0, 0, 0, 0)); d = ImageDraw.Draw(big)
    x, y = centre[0] * SS, centre[1] * SS; R = r * SS
    d.ellipse([x - R - 5 * SS, y - R - 5 * SS, x + R + 5 * SS, y + R + 5 * SS], outline=(255, 255, 255, 255), width=4 * SS)
    d.ellipse([x - R, y - R, x + R, y + R], outline=RED, width=7 * SS)
    if arrow_from:
        ax, ay = arrow_from[0] * SS, arrow_from[1] * SS
        import math
        ang = math.atan2(y - ay, x - ax); tip = (x - (R + 8 * SS) * math.cos(ang), y - (R + 8 * SS) * math.sin(ang))
        d.line([(ax, ay), tip], fill=(255, 255, 255, 255), width=14 * SS); d.line([(ax, ay), tip], fill=RED, width=8 * SS)
        for s in (-1, 1):
            a2 = ang + s * 2.5
            p = (tip[0] + 22 * SS * math.cos(a2), tip[1] + 22 * SS * math.sin(a2))
            d.line([tip, p], fill=(255, 255, 255, 255), width=14 * SS); d.line([tip, p], fill=RED, width=8 * SS)
    c.alpha_composite(big.resize((256, 256), Image.LANCZOS))

def single(k, size=176):
    c = canvas(); put(c, fit(load(k), size), 128, 128); return c

def badge(base, extra, scale=.5, corner='br'):
    c = canvas(); put(c, fit(load(base), 170), 112, 112)
    e = fit(load(extra), int(256 * scale)); cx, cy = (256 - e.width / 2 - 6, 256 - e.height / 2 - 6)
    if corner == 'bl': cx = e.width / 2 + 6
    put(c, e, cx, cy); return c

def pair(a, b, s=118):
    c = canvas(); put(c, fit(load(a), s), 70, 128); put(c, fit(load(b), s), 186, 128); return c

def leg_knee():
    c = single('leg', 196)
    ring_arrow(c, (151, 111), 27, arrow_from=(216, 40)); return c

def foot_toe():
    c = single('foot', 200)
    ring_arrow(c, (50, 160), 22, arrow_from=(100, 70)); return c

V = {
 'knie': (leg_knee, ['bod_17','mv_5','kl_12']),
 'been': (lambda: single('leg', 196), ['bod_10','mv_14','kl_14','course_pt_klachten_4']),
 'teen': (foot_toe, ['bod_19','mv_8']),
 'voet': (lambda: single('foot', 196), ['bod_11','mv_3','kl_13','course_pt_klachten_6']),
 'moeder': (lambda: badge('woman', 'girl', .46), ['fam_moeder']),
 'vrouw': (lambda: badge('woman', 'ring', .42), ['fam_vrouw']),
 'tante': (lambda: single('redhair', 176), ['fam_tante']),
 'vader': (lambda: badge('man', 'boy', .46), ['fam_vader']),
 'oom': (lambda: single('beard', 176), ['fam_oom']),
 'dochter': (lambda: single('girl', 176), ['fam_dochter']),
 'kinderen': (lambda: pair('girl', 'boy'), ['fam_kinderen']),
 'melk': (lambda: single('milk', 176), ['sh_melk']),
 'yoghurt': (lambda: single('bowl', 176), ['sh_yoghurt', 'course_ex11_22']),
 'ketchup': (lambda: badge('can', 'tomato', .42), ['sh_ketchup']),
 'mayonaise': (lambda: single('jar', 176), ['sh_mayonaise']),
 'kassa': (lambda: single('euro', 176), ['sh_2']),
 'bonnetje': (lambda: single('receipt', 176), ['sh_3']),
 'cornflakes': (lambda: badge('bowl', 'corn', .46), ['course_ex11_25']),
 'havermout': (lambda: badge('bowl', 'rice', .46), ['course_ex11_26']),
 'muesli': (lambda: badge('bowl', 'peanut', .46), ['course_ex11_27']),
 'zoetbeleg': (lambda: single('honey', 176), ['course_ex11_14']),
 'confituur': (lambda: badge('jar', 'strawberry', .46), ['course_ex11_16']),
 'melkproducten': (lambda: pair('milk', 'cheese'), ['course_ex11_21']),
 'boter': (lambda: single('butter', 176), ['course_ex11_23']),
 'margarine': (lambda: badge('butter', 'sunflower', .44), ['course_ex11_24']),
 'volkoren': (lambda: badge('bread', 'wheat', .44), ['course_ex11_28']),
 'witbrood': (lambda: single('bread', 176), ['course_ex11_29']),
 'krant': (lambda: single('rolled', 176), ['course_pt_ex8_11']),
}
cards = {}
for name, (fn, ids) in V.items():
    im = fn(); im = im.crop(im.getbbox()); pad = 12
    out = Image.new('RGBA', (192, 192), (0, 0, 0, 0)); im.thumbnail((192 - 2 * pad, 192 - 2 * pad), Image.LANCZOS)
    out.alpha_composite(im, ((192 - im.width) // 2, (192 - im.height) // 2))
    out.save(OUT / f'kb-{name}.png', optimize=True)
    for i in ids: cards[i] = f'kb-{name}'
js = ('/* Card pictures that differ from a sibling card with the same emoji (built by tools/make-card-variants.py). */\n'
      'globalThis.LerenCardVariants = ' + json.dumps(cards, separators=(',', ':')) + ';\n')
pathlib.Path('modules/emoji/variants.js').write_text(js, encoding='utf8')
print(len(V), 'pictures,', len(cards), 'cards')
