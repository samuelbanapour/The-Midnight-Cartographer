#!/usr/bin/env python3
"""Generate the app icon for The Midnight Cartographer.

A geometric amber owl on the candle-lit dark background, matching the title
screen palette (#1a0e05 ground, #d4a017 amber). Rendered at 4x and downscaled
for clean anti-aliasing. Produces a 512x512 PNG (Amazon Appstore icon).

    pip install Pillow
    python3 native/android/make_icon.py
"""
from PIL import Image, ImageDraw, ImageFilter

S = 512
SS = 4              # supersample factor
W = S * SS
cx = W / 2

GROUND = (26, 14, 5)        # #1a0e05
AMBER = (212, 160, 23)      # #d4a017
AMBER_DIM = (160, 120, 16)  # #a07810
CREAM = (245, 230, 190)
DARK = (36, 20, 8)          # #241408 (eye wells / owl belly shadow)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


img = Image.new("RGB", (W, W), GROUND)
px = img.load()

# --- radial amber glow behind the owl --------------------------------------
glow_cx, glow_cy, glow_r = cx, W * 0.42, W * 0.46
for y in range(W):
    for x in range(W):
        dx, dy = x - glow_cx, y - glow_cy
        d = (dx * dx + dy * dy) ** 0.5 / glow_r
        if d < 1:
            t = (1 - d) ** 2 * 0.16
            px[x, y] = lerp(px[x, y], AMBER, t)

draw = ImageDraw.Draw(img)


def ellipse(cx_, cy_, rx, ry, fill):
    draw.ellipse([cx_ - rx, cy_ - ry, cx_ + rx, cy_ + ry], fill=fill)


# --- ring framing the owl (like the title-screen medallion) ----------------
ring_r = W * 0.40
draw.ellipse(
    [cx - ring_r, W * 0.46 - ring_r, cx + ring_r, W * 0.46 + ring_r],
    outline=AMBER, width=int(W * 0.012),
)

oc_y = W * 0.46  # owl centre

# --- ear tufts -------------------------------------------------------------
tuft_dx = W * 0.135
tuft_top = oc_y - W * 0.30
for sign in (-1, 1):
    tx = cx + sign * tuft_dx
    draw.polygon(
        [(tx - W * 0.055, oc_y - W * 0.14),
         (tx + W * 0.055, oc_y - W * 0.14),
         (tx + sign * 0.02 * W, tuft_top)],
        fill=AMBER,
    )

# --- body / head (rounded owl silhouette) ----------------------------------
ellipse(cx, oc_y - W * 0.02, W * 0.205, W * 0.215, AMBER)        # head
ellipse(cx, oc_y + W * 0.16, W * 0.175, W * 0.165, AMBER)        # body
# belly shading
ellipse(cx, oc_y + W * 0.175, W * 0.11, W * 0.115, lerp(AMBER, GROUND, 0.18))

# --- face disc -------------------------------------------------------------
ellipse(cx, oc_y - W * 0.025, W * 0.165, W * 0.16, lerp(AMBER, CREAM, 0.10))

# --- eyes ------------------------------------------------------------------
eye_dx = W * 0.072
eye_y = oc_y - W * 0.05
for sign in (-1, 1):
    ex = cx + sign * eye_dx
    ellipse(ex, eye_y, W * 0.066, W * 0.066, GROUND)            # eye well
    ellipse(ex, eye_y, W * 0.052, W * 0.052, CREAM)             # sclera
    ellipse(ex, eye_y, W * 0.026, W * 0.026, DARK)              # pupil
    ellipse(ex - W * 0.009, eye_y - W * 0.009, W * 0.008, W * 0.008, CREAM)  # glint

# --- beak ------------------------------------------------------------------
beak_y = eye_y + W * 0.058
draw.polygon(
    [(cx - W * 0.026, beak_y),
     (cx + W * 0.026, beak_y),
     (cx, beak_y + W * 0.05)],
    fill=AMBER_DIM,
)

# --- symmetric wing seams for definition (contained inside the body) -------
for sign in (-1, 1):
    wx = cx + sign * W * 0.125
    draw.arc(
        [wx - W * 0.05, oc_y + W * 0.04, wx + W * 0.05, oc_y + W * 0.27],
        start=110 if sign < 0 else 250,
        end=250 if sign < 0 else 110,
        fill=lerp(AMBER, GROUND, 0.28), width=int(W * 0.009),
    )

# --- downscale with high-quality resampling --------------------------------
icon = img.resize((S, S), Image.LANCZOS)
icon.save("native/android/icon-512.png")

# A subtly sharpened 1024 master too (store pages sometimes ask for it).
master = img.resize((1024, 1024), Image.LANCZOS).filter(
    ImageFilter.UnsharpMask(radius=2, percent=60))
master.save("native/android/icon-1024.png")
print("wrote native/android/icon-512.png and icon-1024.png")
