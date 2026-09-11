"""Generate print-ready PNG QR designs for the Café Nelo specials page.

Usage (from the repo root, any Python 3.11+ with Pillow):
    pip install qrcode Pillow
    python scripts/make_qr_designs.py out/qr-designs [https://cafe-nelo.onrender.com/specials]

The layouts mirror client/src/lib/qrDesigns.js, which the admin "QR & Promo Codes"
page uses for in-browser downloads. Fonts are resolved from the macOS system font
folders; adjust the SUP/SANS paths on other platforms.
"""
import sys
from pathlib import Path
import qrcode
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image, ImageDraw, ImageFont

OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
URL = sys.argv[2] if len(sys.argv) > 2 else "https://cafe-nelo.onrender.com/specials"
CAPTION_URL = URL.split("://", 1)[-1]

CHARCOAL = (27, 48, 40); CREAM = (250, 247, 242); LINEN = (240, 235, 224)
GOLD = (191, 168, 130); COPPER = (196, 98, 45); MUTED = (125, 110, 99); WHITE = (255, 255, 255); BLACK = (20, 20, 20)
SUP = "/System/Library/Fonts/Supplemental/"
def font(name, size, index=0):
    return ImageFont.truetype(name, size, index=index)
SERIF = lambda s: font(SUP + "Georgia.ttf", s)
SERIF_I = lambda s: font(SUP + "Georgia Italic.ttf", s)
SANS = lambda s: font("/System/Library/Fonts/Helvetica.ttc", s, 0)
SANS_B = lambda s: font("/System/Library/Fonts/Helvetica.ttc", s, 1)

LOGO_PATH = Path(__file__).resolve().parent.parent / "client" / "public" / "cafe-nelo-wordmark.png"
LOGO_WIDTH_RATIO = 0.34   # wordmark width relative to the QR edge
LOGO_PAD_RATIO = 0.025    # quiet zone around the wordmark, relative to the QR edge


def qr_image(size, fg, bg):
    """QR at error-correction level H with the wordmark centred on a padded plate.

    Level H tolerates ~30% damage; the plate covers well under 10% of the symbol
    and stays clear of the finder patterns in the corners.
    """
    q = qrcode.QRCode(error_correction=ERROR_CORRECT_H, box_size=10, border=0)
    q.add_data(URL); q.make(fit=True)
    img = q.make_image(fill_color=fg, back_color=bg).convert("RGBA")
    img = img.resize((size, size), Image.NEAREST)

    logo = Image.open(LOGO_PATH).convert("RGBA")
    logo_w = int(size * LOGO_WIDTH_RATIO)
    logo_h = int(logo_w * logo.height / logo.width)
    logo = logo.resize((logo_w, logo_h), Image.LANCZOS)
    # Tint the wordmark to the module colour so it reads as part of the code.
    tint = Image.new("RGBA", logo.size, fg + (255,))
    tint.putalpha(logo.getchannel("A"))
    pad = int(size * LOGO_PAD_RATIO)
    plate_w, plate_h = logo_w + 2 * pad, logo_h + 2 * pad
    px, py = (size - plate_w) // 2, (size - plate_h) // 2
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([px, py, px + plate_w, py + plate_h], radius=int(pad * 1.5), fill=bg + (255,))
    img.alpha_composite(tint, (px + pad, py + pad))
    return img.convert("RGB")

def text_w(draw, text, f, tracking=0):
    w = sum(draw.textlength(ch, font=f) for ch in text) + tracking * (len(text) - 1)
    return w

def draw_tracked(draw, cx, y, text, f, fill, tracking=0):
    """Draw text centred at cx with letter-spacing `tracking` px."""
    w = text_w(draw, text, f, tracking)
    x = cx - w / 2
    for ch in text:
        draw.text((x, y), ch, font=f, fill=fill)
        x += draw.textlength(ch, font=f) + tracking
    return w

def centered(draw, cx, y, text, f, fill):
    w = draw.textlength(text, font=f)
    draw.text((cx - w / 2, y), text, font=f, fill=fill)

def rule(draw, x1, x2, y, fill, width=3):
    draw.line([(x1, y), (x2, y)], fill=fill, width=width)

def logo_lines(draw, cx, y, color_top, color_name, small=False):
    f_top = SANS(34 if not small else 28)
    draw_tracked(draw, cx, y, "C A F É   N E L O", f_top, color_top, tracking=6)

# ---------------------------------------------------------------- 1. Cream Classic (5x7 in)
def design_cream_classic():
    W, H = 1500, 2100
    im = Image.new("RGB", (W, H), CREAM); d = ImageDraw.Draw(im)
    d.rectangle([60, 60, W - 60, H - 60], outline=GOLD, width=4)
    d.rectangle([80, 80, W - 80, H - 80], outline=GOLD, width=2)
    cx = W / 2
    logo_lines(d, cx, 220, MUTED, CHARCOAL)
    centered(d, cx, 330, "Today's Specials", SERIF_I(150), CHARCOAL)
    rule(d, cx - 120, cx + 120, 540, GOLD, 3)
    qr = qr_image(880, CHARCOAL, CREAM); im.paste(qr, (int(cx - 440), 640))
    draw_tracked(d, cx, 1600, "SCAN TO VIEW TODAY'S MENU", SANS(38), CHARCOAL, tracking=8)
    centered(d, cx, 1680, CAPTION_URL, SANS(34), MUTED)
    rule(d, cx - 120, cx + 120, 1820, GOLD, 3)
    draw_tracked(d, cx, 1880, "102 KRAFT AVE  ·  BRONXVILLE, NY", SANS(30), MUTED, tracking=5)
    return im

# ---------------------------------------------------------------- 2. Charcoal & Gold (5x7 in)
def design_charcoal_gold():
    W, H = 1500, 2100
    im = Image.new("RGB", (W, H), CHARCOAL); d = ImageDraw.Draw(im)
    d.rectangle([70, 70, W - 70, H - 70], outline=GOLD, width=3)
    cx = W / 2
    logo_lines(d, cx, 220, GOLD, CREAM)
    centered(d, cx, 330, "Today's Specials", SERIF_I(150), CREAM)
    rule(d, cx - 120, cx + 120, 540, GOLD, 3)
    panel = 960; px, py = int(cx - panel / 2), 620
    d.rounded_rectangle([px, py, px + panel, py + panel], radius=40, fill=CREAM)
    qr = qr_image(860, CHARCOAL, CREAM); im.paste(qr, (px + 50, py + 50))
    draw_tracked(d, cx, 1680, "SCAN FOR TODAY'S SPECIALS", SANS(38), GOLD, tracking=8)
    centered(d, cx, 1760, CAPTION_URL, SANS(34), (200, 190, 175))
    draw_tracked(d, cx, 1900, "BRONXVILLE, NY", SANS(30), GOLD, tracking=6)
    return im

# ---------------------------------------------------------------- 3. Minimal White (menu insert, 4x6 in)
def design_minimal_white():
    W, H = 1200, 1800
    im = Image.new("RGB", (W, H), WHITE); d = ImageDraw.Draw(im)
    cx = W / 2
    draw_tracked(d, cx, 150, "C A F É   N E L O", SANS(30), MUTED, tracking=6)
    qr = qr_image(820, BLACK, WHITE); im.paste(qr, (int(cx - 410), 280))
    centered(d, cx, 1190, "Today's Specials", SERIF(96), BLACK)
    draw_tracked(d, cx, 1330, "SCAN WITH YOUR PHONE CAMERA", SANS(30), MUTED, tracking=6)
    centered(d, cx, 1400, CAPTION_URL, SANS(30), MUTED)
    rule(d, cx - 60, cx + 60, 1560, BLACK, 2)
    return im

# ---------------------------------------------------------------- 4. Copper Accent (5x7 in)
def design_copper_accent():
    W, H = 1500, 2100
    im = Image.new("RGB", (W, H), LINEN); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 26], fill=COPPER); d.rectangle([0, H - 26, W, H], fill=COPPER)
    cx = W / 2
    logo_lines(d, cx, 200, COPPER, CHARCOAL)
    centered(d, cx, 300, "Specials", SERIF_I(190), CHARCOAL)
    draw_tracked(d, cx, 530, "FRESH  ·  SEASONAL  ·  DAILY", SANS(32), COPPER, tracking=8)
    rule(d, 260, W - 260, 620, COPPER, 3)
    qr = qr_image(880, CHARCOAL, LINEN); im.paste(qr, (int(cx - 440), 690))
    rule(d, 260, W - 260, 1640, COPPER, 3)
    draw_tracked(d, cx, 1700, "SCAN TO SEE WHAT THE KITCHEN IS SERVING TODAY", SANS(32), CHARCOAL, tracking=5)
    centered(d, cx, 1770, CAPTION_URL, SANS(32), MUTED)
    draw_tracked(d, cx, 1920, "102 KRAFT AVE  ·  BRONXVILLE, NY", SANS(28), MUTED, tracking=5)
    return im

# ---------------------------------------------------------------- 5. Square sticker (4x4 in)
def design_square_sticker():
    W = 1200
    im = Image.new("RGB", (W, W), CREAM); d = ImageDraw.Draw(im)
    d.rounded_rectangle([40, 40, W - 40, W - 40], radius=60, outline=GOLD, width=4)
    cx = W / 2
    draw_tracked(d, cx, 120, "C A F É   N E L O", SANS(30), MUTED, tracking=6)
    qr = qr_image(700, CHARCOAL, CREAM); im.paste(qr, (int(cx - 350), 220))
    centered(d, cx, 950, "Today's Specials", SERIF_I(84), CHARCOAL)
    draw_tracked(d, cx, 1070, "SCAN TO VIEW", SANS(28), MUTED, tracking=8)
    return im

DESIGNS = {
    "01-cream-classic-5x7": design_cream_classic,
    "02-charcoal-gold-5x7": design_charcoal_gold,
    "03-minimal-white-4x6": design_minimal_white,
    "04-copper-accent-5x7": design_copper_accent,
    "05-square-sticker-4x4": design_square_sticker,
}
for name, fn in DESIGNS.items():
    im = fn(); p = OUT / f"cafe-nelo-specials-qr-{name}.png"
    im.save(p, dpi=(300, 300)); print(p.name, im.size)
