from pathlib import Path

import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SVG = ROOT / 'public' / 'favicon.svg'
ICONS = ROOT / 'public' / 'icons'
ICONS.mkdir(exist_ok=True)

# The source SVG already carries the production --c-bg/--c-gold equivalents.
for size, name in ((192, 'icon-192.png'), (512, 'icon-512.png')):
    cairosvg.svg2png(url=str(SVG), write_to=str(ICONS / name), output_width=size, output_height=size)

# Maskable artwork gets a conservative safe-zone scale while retaining the solid background.
svg_text = SVG.read_text()
maskable_svg = svg_text.replace('transform="translate(8 18) scale(.35)"', 'transform="translate(22 30) scale(.285)"')
maskable_path = ROOT / '.tmp-maskable-brand.svg'
maskable_path.write_text(maskable_svg)
try:
    cairosvg.svg2png(url=str(maskable_path), write_to=str(ICONS / 'icon-maskable-512.png'), output_width=512, output_height=512)
finally:
    maskable_path.unlink(missing_ok=True)

# Apple touch icons must be opaque.
cairosvg.svg2png(url=str(SVG), write_to='/tmp/apple-touch-icon.png', output_width=180, output_height=180)
image = Image.open('/tmp/apple-touch-icon.png').convert('RGB')
image.save(ROOT / 'public' / 'apple-touch-icon.png', format='PNG', optimize=True)
