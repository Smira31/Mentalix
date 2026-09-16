from PIL import Image, ImageDraw
from pathlib import Path
frames = sorted(Path('/tmp/checkin-contact').glob('frame-*.png'))
thumbs = []
for path in frames:
    im = Image.open(path).convert('RGB')
    im.thumbnail((192, 426))
    canvas = Image.new('RGB', (200, 455), 'white')
    canvas.paste(im, ((200-im.width)//2, 24))
    ImageDraw.Draw(canvas).text((8, 5), path.stem, fill='black')
    thumbs.append(canvas)
cols = 4
rows = (len(thumbs) + cols - 1) // cols
sheet = Image.new('RGB', (cols*200, rows*455), '#dddddd')
for i, im in enumerate(thumbs):
    sheet.paste(im, ((i%cols)*200, (i//cols)*455))
out = Path('/tmp/checkin-reference-contact.png')
sheet.save(out)
print(out, len(frames), sheet.size)
