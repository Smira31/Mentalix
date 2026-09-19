from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

root = Path('qa-evidence/mxl-246/390x844')
items = [('02-journal-writer.png', 'Шаг 1'), *[(f'03-journal-step-{i}.png', f'Шаг {i + 1}') for i in range(1, 7)], ('03-journal-complete.png', 'Completion')]
thumb_w, thumb_h = 195, 422
label_h = 28
cols = 4
rows = 2
sheet = Image.new('RGB', (cols * thumb_w, rows * (thumb_h + label_h)), '#101b18')
draw = ImageDraw.Draw(sheet)
for index, (filename, label) in enumerate(items):
    image = Image.open(root / filename).convert('RGB')
    image.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
    tile = Image.new('RGB', (thumb_w, thumb_h), '#101b18')
    tile.paste(image, ((thumb_w - image.width) // 2, (thumb_h - image.height) // 2))
    x = (index % cols) * thumb_w
    y = (index // cols) * (thumb_h + label_h)
    sheet.paste(tile, (x, y))
    draw.text((x + 8, y + thumb_h + 6), label, fill='#f2e8d5')
sheet.save('qa-evidence/mxl-246/390x844-journal-after-contact-sheet.png')
