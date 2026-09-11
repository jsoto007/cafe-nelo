/**
 * Canvas renderers for printable QR designs.
 *
 * Every design takes an already-rendered QR canvas (from qrcode.react's
 * QRCodeCanvas), centres the Café Nelo wordmark on it, and composes it into a
 * print-ready layout at 300 dpi. The
 * layouts mirror the PNG set delivered to the client so downloads from the
 * admin page match the originals.
 */

const COLORS = {
  charcoal: '#1B3028',
  cream: '#FAF7F2',
  linen: '#F0EBE0',
  gold: '#BFA882',
  copper: '#C4622D',
  muted: '#7D6E63',
  white: '#FFFFFF',
  black: '#141414',
  goldSoft: '#C8BEAF',
};

const SERIF_ITALIC = (px) => `italic 500 ${px}px "Cormorant Garamond", Georgia, "Times New Roman", serif`;
const SERIF = (px) => `500 ${px}px "Cormorant Garamond", Georgia, "Times New Roman", serif`;
const SANS = (px) => `400 ${px}px Inter, "Helvetica Neue", Helvetica, Arial, sans-serif`;

export const QR_DESIGNS = [
  { id: 'cream-classic', name: 'Cream Classic', size: '5 × 7 in', width: 1500, height: 2100 },
  { id: 'charcoal-gold', name: 'Charcoal & Gold', size: '5 × 7 in', width: 1500, height: 2100 },
  { id: 'minimal-white', name: 'Minimal White', size: '4 × 6 in', width: 1200, height: 1800 },
  { id: 'copper-accent', name: 'Copper Accent', size: '5 × 7 in', width: 1500, height: 2100 },
  { id: 'square-sticker', name: 'Square Sticker', size: '4 × 4 in', width: 1200, height: 1200 },
];

const LOGO_SRC = '/cafe-nelo-wordmark.png';
const LOGO_WIDTH_RATIO = 0.34; // wordmark width relative to the QR edge
const LOGO_PAD_RATIO = 0.025; // quiet zone around the wordmark, relative to the QR edge

let logoReady = null;
export function ensureDesignLogo() {
  if (!logoReady) {
    logoReady = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null); // fall back to a plain QR if the asset is missing
      img.src = LOGO_SRC;
    });
  }
  return logoReady;
}

let fontsReady = null;
export function ensureDesignFonts() {
  if (!fontsReady) {
    const loads = [
      'italic 500 150px "Cormorant Garamond"',
      '500 96px "Cormorant Garamond"',
      '400 34px Inter',
      '600 34px Inter',
    ];
    fontsReady =
      typeof document !== 'undefined' && document.fonts?.load
        ? Promise.all(loads.map((f) => document.fonts.load(f).catch(() => null))).then(() => true)
        : Promise.resolve(true);
  }
  return fontsReady;
}

function drawTracked(ctx, text, cx, y, { font, fill, tracking = 0 }) {
  ctx.font = font;
  ctx.fillStyle = fill;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  const chars = Array.from(text);
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1);
  let x = cx - total / 2;
  chars.forEach((ch, i) => {
    ctx.fillText(ch, x, y);
    x += widths[i] + tracking;
  });
}

function centered(ctx, text, cx, y, { font, fill }) {
  ctx.font = font;
  ctx.fillStyle = fill;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillText(text, cx, y);
  ctx.textAlign = 'left';
}

function rule(ctx, x1, x2, y, color, width = 3) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
}

function strokeRect(ctx, x, y, w, h, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.strokeRect(x, y, w, h);
}

function roundedRect(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

/** Draw the QR onto the design with the requested module colour, at (x, y, size). */
function drawQr(ctx, qrCanvas, x, y, size, fg, bg, logo) {
  // Re-tint: draw the source QR (dark modules on white) then map colours via
  // a temporary canvas so any design can use brand colours.
  const tmp = document.createElement('canvas');
  tmp.width = size;
  tmp.height = size;
  const tctx = tmp.getContext('2d');
  tctx.imageSmoothingEnabled = false;
  tctx.drawImage(qrCanvas, 0, 0, size, size);
  const img = tctx.getImageData(0, 0, size, size);
  const data = img.data;
  const [fr, fgG, fb] = hexToRgb(fg);
  const [br, bgG, bb] = hexToRgb(bg);
  for (let i = 0; i < data.length; i += 4) {
    const dark = data[i] < 128;
    data[i] = dark ? fr : br;
    data[i + 1] = dark ? fgG : bgG;
    data[i + 2] = dark ? fb : bb;
    data[i + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tmp, x, y);
  ctx.imageSmoothingEnabled = true;

  if (logo) {
    // Level-H codes tolerate ~30% damage; the plate covers well under 10% and
    // stays clear of the corner finder patterns.
    const logoW = Math.round(size * LOGO_WIDTH_RATIO);
    const logoH = Math.round((logoW * logo.naturalHeight) / logo.naturalWidth);
    const pad = Math.round(size * LOGO_PAD_RATIO);
    const plateW = logoW + pad * 2;
    const plateH = logoH + pad * 2;
    const px = x + Math.round((size - plateW) / 2);
    const py = y + Math.round((size - plateH) / 2);
    roundedRect(ctx, px, py, plateW, plateH, Math.round(pad * 1.5), bg);
    // Tint the wordmark to the module colour.
    const mark = document.createElement('canvas');
    mark.width = logoW;
    mark.height = logoH;
    const mctx = mark.getContext('2d');
    mctx.imageSmoothingEnabled = true;
    mctx.imageSmoothingQuality = 'high';
    mctx.drawImage(logo, 0, 0, logoW, logoH);
    mctx.globalCompositeOperation = 'source-in';
    mctx.fillStyle = fg;
    mctx.fillRect(0, 0, logoW, logoH);
    ctx.drawImage(mark, px + pad, py + pad);
  }
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const DEFAULT_TEXT = {
  kicker: 'C A F É   N E L O',
  heading: "Today's Specials",
  caption: "SCAN TO VIEW TODAY'S MENU",
  url: '',
  footer: '102 KRAFT AVE  ·  BRONXVILLE, NY',
};

const RENDERERS = {
  'cream-classic': (ctx, qr, t, logo) => {
    const W = 1500;
    const H = 2100;
    const cx = W / 2;
    ctx.fillStyle = COLORS.cream;
    ctx.fillRect(0, 0, W, H);
    strokeRect(ctx, 60, 60, W - 120, H - 120, COLORS.gold, 4);
    strokeRect(ctx, 80, 80, W - 160, H - 160, COLORS.gold, 2);
    drawTracked(ctx, t.kicker, cx, 220, { font: SANS(34), fill: COLORS.muted, tracking: 6 });
    centered(ctx, t.heading, cx, 320, { font: SERIF_ITALIC(150), fill: COLORS.charcoal });
    rule(ctx, cx - 120, cx + 120, 540, COLORS.gold);
    drawQr(ctx, qr, cx - 440, 640, 880, COLORS.charcoal, COLORS.cream, logo);
    drawTracked(ctx, t.caption, cx, 1600, { font: SANS(38), fill: COLORS.charcoal, tracking: 8 });
    centered(ctx, t.url, cx, 1680, { font: SANS(34), fill: COLORS.muted });
    rule(ctx, cx - 120, cx + 120, 1820, COLORS.gold);
    drawTracked(ctx, t.footer, cx, 1880, { font: SANS(30), fill: COLORS.muted, tracking: 5 });
  },
  'charcoal-gold': (ctx, qr, t, logo) => {
    const W = 1500;
    const H = 2100;
    const cx = W / 2;
    ctx.fillStyle = COLORS.charcoal;
    ctx.fillRect(0, 0, W, H);
    strokeRect(ctx, 70, 70, W - 140, H - 140, COLORS.gold, 3);
    drawTracked(ctx, t.kicker, cx, 220, { font: SANS(34), fill: COLORS.gold, tracking: 6 });
    centered(ctx, t.heading, cx, 320, { font: SERIF_ITALIC(150), fill: COLORS.cream });
    rule(ctx, cx - 120, cx + 120, 540, COLORS.gold);
    const panel = 960;
    const px = cx - panel / 2;
    const py = 620;
    roundedRect(ctx, px, py, panel, panel, 40, COLORS.cream);
    drawQr(ctx, qr, px + 50, py + 50, 860, COLORS.charcoal, COLORS.cream, logo);
    drawTracked(ctx, t.caption, cx, 1680, { font: SANS(38), fill: COLORS.gold, tracking: 8 });
    centered(ctx, t.url, cx, 1760, { font: SANS(34), fill: COLORS.goldSoft });
    drawTracked(ctx, 'BRONXVILLE, NY', cx, 1900, { font: SANS(30), fill: COLORS.gold, tracking: 6 });
  },
  'minimal-white': (ctx, qr, t, logo) => {
    const W = 1200;
    const H = 1800;
    const cx = W / 2;
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(0, 0, W, H);
    drawTracked(ctx, t.kicker, cx, 150, { font: SANS(30), fill: COLORS.muted, tracking: 6 });
    drawQr(ctx, qr, cx - 410, 280, 820, COLORS.black, COLORS.white, logo);
    centered(ctx, t.heading, cx, 1180, { font: SERIF(96), fill: COLORS.black });
    drawTracked(ctx, t.caption, cx, 1330, { font: SANS(30), fill: COLORS.muted, tracking: 6 });
    centered(ctx, t.url, cx, 1400, { font: SANS(30), fill: COLORS.muted });
    rule(ctx, cx - 60, cx + 60, 1560, COLORS.black, 2);
  },
  'copper-accent': (ctx, qr, t, logo) => {
    const W = 1500;
    const H = 2100;
    const cx = W / 2;
    ctx.fillStyle = COLORS.linen;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = COLORS.copper;
    ctx.fillRect(0, 0, W, 26);
    ctx.fillRect(0, H - 26, W, 26);
    drawTracked(ctx, t.kicker, cx, 200, { font: SANS(34), fill: COLORS.copper, tracking: 6 });
    centered(ctx, t.heading === DEFAULT_TEXT.heading ? 'Specials' : t.heading, cx, 290, {
      font: SERIF_ITALIC(190),
      fill: COLORS.charcoal,
    });
    drawTracked(ctx, 'FRESH  ·  SEASONAL  ·  DAILY', cx, 530, { font: SANS(32), fill: COLORS.copper, tracking: 8 });
    rule(ctx, 260, W - 260, 620, COLORS.copper);
    drawQr(ctx, qr, cx - 440, 690, 880, COLORS.charcoal, COLORS.linen, logo);
    rule(ctx, 260, W - 260, 1640, COLORS.copper);
    drawTracked(ctx, t.caption, cx, 1700, { font: SANS(32), fill: COLORS.charcoal, tracking: 5 });
    centered(ctx, t.url, cx, 1770, { font: SANS(32), fill: COLORS.muted });
    drawTracked(ctx, t.footer, cx, 1920, { font: SANS(28), fill: COLORS.muted, tracking: 5 });
  },
  'square-sticker': (ctx, qr, t, logo) => {
    const W = 1200;
    const cx = W / 2;
    ctx.fillStyle = COLORS.cream;
    ctx.fillRect(0, 0, W, W);
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(40, 40, W - 80, W - 80, 60);
    ctx.stroke();
    drawTracked(ctx, t.kicker, cx, 120, { font: SANS(30), fill: COLORS.muted, tracking: 6 });
    drawQr(ctx, qr, cx - 350, 220, 700, COLORS.charcoal, COLORS.cream, logo);
    centered(ctx, t.heading, cx, 940, { font: SERIF_ITALIC(84), fill: COLORS.charcoal });
    drawTracked(ctx, t.caption === DEFAULT_TEXT.caption ? 'SCAN TO VIEW' : t.caption, cx, 1070, {
      font: SANS(28),
      fill: COLORS.muted,
      tracking: 8,
    });
  },
};

/**
 * Render a design to a new canvas.
 * @param {string} designId one of QR_DESIGNS[].id
 * @param {HTMLCanvasElement} qrCanvas source QR (dark modules on white)
 * @param {object} text overrides for kicker/heading/caption/url/footer
 */
export async function renderQrDesign(designId, qrCanvas, text = {}) {
  const [, logo] = await Promise.all([ensureDesignFonts(), ensureDesignLogo()]);
  const design = QR_DESIGNS.find((d) => d.id === designId);
  if (!design) {
    throw new Error(`Unknown design: ${designId}`);
  }
  const canvas = document.createElement('canvas');
  canvas.width = design.width;
  canvas.height = design.height;
  const ctx = canvas.getContext('2d');
  RENDERERS[designId](ctx, qrCanvas, { ...DEFAULT_TEXT, ...text }, logo);
  return canvas;
}

/** Downscale a rendered design into a data URL for gallery thumbnails. */
export function thumbnailFromCanvas(canvas, width = 360) {
  const scale = width / canvas.width;
  const thumb = document.createElement('canvas');
  thumb.width = width;
  thumb.height = Math.round(canvas.height * scale);
  const ctx = thumb.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, thumb.width, thumb.height);
  return thumb.toDataURL('image/png');
}

/** Trigger a browser download of a canvas as PNG. */
export function downloadCanvasPng(canvas, filename) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Unable to export PNG.'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    }, 'image/png');
  });
}

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
