from PIL import Image, ImageDraw, ImageFilter
import math
import struct

SIZE = 1024
CENTER = SIZE // 2

# Colors
BG = (10, 12, 18)           # dark background
PANEL = (18, 22, 32)        # panel fill
CYAN = (0, 240, 255)        # cyber cyan
CYAN_DIM = (0, 180, 190)    # dimmer cyan
WHITE = (230, 245, 255)
SHADOW = (0, 0, 0)

img = Image.new('RGBA', (SIZE, SIZE), BG)
draw = ImageDraw.Draw(img)

# Rounded square background with subtle border
radius = 180
margin = 40
bg_box = [margin, margin, SIZE - margin, SIZE - margin]
draw.rounded_rectangle(bg_box, radius=radius, fill=PANEL, outline=(40, 50, 70), width=4)

# Inner glow border (simulated with blurred layer)
glow = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
glow_draw = ImageDraw.Draw(glow)
glow_draw.rounded_rectangle(bg_box, radius=radius, outline=CYAN, width=12)
glow = glow.filter(ImageFilter.GaussianBlur(radius=20))
img = Image.alpha_composite(img, glow)
draw = ImageDraw.Draw(img)

# Shield shape
def shield_points(cx, cy, w, h, top_offset=0.12):
    """Return points for a shield polygon."""
    half_w = w / 2
    top_h = h * top_offset
    bottom_h = h / 2
    return [
        (cx - half_w, cy - h / 2 + top_h),
        (cx - half_w + top_h, cy - h / 2),
        (cx + half_w - top_h, cy - h / 2),
        (cx + half_w, cy - h / 2 + top_h),
        (cx + half_w, cy + h * 0.25),
        (cx, cy + h / 2),
        (cx - half_w, cy + h * 0.25),
    ]

shield_cx, shield_cy = CENTER, CENTER - 20
shield_w, shield_h = 560, 640
shield = shield_points(shield_cx, shield_cy, shield_w, shield_h)

# Shield outer glow
glow2 = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
glow2_draw = ImageDraw.Draw(glow2)
glow2_draw.polygon(shield, outline=CYAN, width=16)
glow2 = glow2.filter(ImageFilter.GaussianBlur(radius=24))
img = Image.alpha_composite(img, glow2)
draw = ImageDraw.Draw(img)

# Shield body (semi-transparent dark fill)
shield_fill = PANEL + (220,)
draw.polygon(shield, fill=shield_fill, outline=CYAN, width=12)

# Inner shield outline (thinner)
inner_shield = shield_points(shield_cx, shield_cy, shield_w - 80, shield_h - 90)
draw.polygon(inner_shield, outline=CYAN_DIM, width=4)

# Key symbol in center
key_cx, key_cy = shield_cx, shield_cy + 20
key_color = CYAN
key_glow = (0, 240, 255, 80)

# Key head (circle ring)
head_r = 110
head_inner_r = 65
# Outer head
glow3 = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
glow3_draw = ImageDraw.Draw(glow3)
glow3_draw.ellipse([key_cx - head_r - 10, key_cy - head_r - 10,
                    key_cx + head_r + 10, key_cy + head_r + 10],
                   outline=key_color, width=16)
glow3 = glow3.filter(ImageFilter.GaussianBlur(radius=14))
img = Image.alpha_composite(img, glow3)
draw = ImageDraw.Draw(img)

draw.ellipse([key_cx - head_r, key_cy - head_r,
              key_cx + head_r, key_cy + head_r],
             outline=key_color, width=14)
draw.ellipse([key_cx - head_inner_r, key_cy - head_inner_r,
              key_cx + head_inner_r, key_cy + head_inner_r],
             outline=CYAN_DIM, width=8)

# Key shaft (angled down-right)
shaft_angle = math.radians(45)
shaft_len = 180
shaft_w = 28
shaft_start_x = key_cx + head_r * math.cos(shaft_angle)
shaft_start_y = key_cy + head_r * math.sin(shaft_angle)
shaft_end_x = shaft_start_x + shaft_len * math.cos(shaft_angle)
shaft_end_y = shaft_start_y + shaft_len * math.sin(shaft_angle)

# Draw shaft as a thick line with rounded caps
def draw_rounded_line(draw, x1, y1, x2, y2, width, fill):
    draw.line([(x1, y1), (x2, y2)], fill=fill, width=width)
    r = width // 2
    draw.ellipse([x1 - r, y1 - r, x1 + r, y1 + r], fill=fill)
    draw.ellipse([x2 - r, y2 - r, x2 + r, y2 + r], fill=fill)

draw_rounded_line(draw, shaft_start_x, shaft_start_y, shaft_end_x, shaft_end_y, shaft_w, key_color)

# Key teeth (two notches)
tooth_w = 18
tooth_h = 30
for i, offset in enumerate([40, 80]):
    tx = shaft_start_x + offset * math.cos(shaft_angle)
    ty = shaft_start_y + offset * math.sin(shaft_angle)
    # perpendicular direction
    perp_angle = shaft_angle + math.pi / 2
    tooth_pts = [
        (tx, ty),
        (tx + tooth_h * math.cos(perp_angle), ty + tooth_h * math.sin(perp_angle)),
        (tx + tooth_h * math.cos(perp_angle) - tooth_w * math.cos(shaft_angle),
         ty + tooth_h * math.sin(perp_angle) - tooth_w * math.sin(shaft_angle)),
        (tx - tooth_w * math.cos(shaft_angle), ty - tooth_w * math.sin(shaft_angle)),
    ]
    draw.polygon(tooth_pts, fill=key_color)

# Add small decorative dots (like circuit nodes)
dot_positions = [
    (CENTER - 220, CENTER - 220),
    (CENTER + 220, CENTER - 220),
    (CENTER - 220, CENTER + 220),
    (CENTER + 220, CENTER + 220),
]
for dx, dy in dot_positions:
    draw.ellipse([dx - 10, dy - 10, dx + 10, dy + 10], fill=CYAN_DIM)

# Save master PNG
img.save('icon.png')

# Generate sizes
sizes = {
    '32x32.png': 32,
    '128x128.png': 128,
    '128x128@2x.png': 256,
}

for name, s in sizes.items():
    resized = img.resize((s, s), Image.Resampling.LANCZOS)
    resized.save(name)

# Generate multi-size ICO with BMP-encoded frames for maximum Windows compatibility.
def create_bmp_ico(source: Image.Image, sizes: list[int], out_path: str) -> None:
    entries = []
    images_data = []
    data_offset = 6 + len(sizes) * 16  # header + directory entries

    for size in sizes:
        # Resize and ensure RGBA
        frame = source.resize((size, size), Image.Resampling.LANCZOS).convert('RGBA')

        # BMP stores pixels bottom-up and in BGRA order
        bgra = bytearray()
        for y in range(size - 1, -1, -1):
            for x in range(size):
                r, g, b, a = frame.getpixel((x, y))
                bgra.extend([b, g, r, a])
        xor_mask = bytes(bgra)

        # AND mask: 1-bit, fully opaque (all zeros), padded to 4 bytes per row
        row_bytes = ((size + 31) // 32) * 4
        and_mask = bytes(row_bytes * size)

        dib_header = struct.pack(
            '<IiiHHIIiiII',
            40,            # biSize
            size,          # biWidth
            size * 2,      # biHeight (XOR + AND masks)
            1,             # biPlanes
            32,            # biBitCount
            0,             # biCompression (BI_RGB)
            0,             # biSizeImage
            0,             # biXPelsPerMeter
            0,             # biYPelsPerMeter
            0,             # biClrUsed
            0,             # biClrImportant
        )

        dib_data = dib_header + xor_mask + and_mask
        images_data.append(dib_data)

        # ICO directory entry
        entry_width = 0 if size == 256 else size
        entry_height = 0 if size == 256 else size
        entries.append(struct.pack(
            '<BBBBHHII',
            entry_width,
            entry_height,
            0,        # colors
            0,        # reserved
            1,        # planes
            32,       # bit count
            len(dib_data),
            data_offset,
        ))
        data_offset += len(dib_data)

    with open(out_path, 'wb') as f:
        f.write(struct.pack('<HHH', 0, 1, len(sizes)))
        for entry in entries:
            f.write(entry)
        for data in images_data:
            f.write(data)


ico_source = img.resize((256, 256), Image.Resampling.LANCZOS)
create_bmp_ico(ico_source, [16, 32, 48, 128, 256], 'icon.ico')

print('Icon generated: icon.png, 32x32.png, 128x128.png, 128x128@2x.png, icon.ico')
