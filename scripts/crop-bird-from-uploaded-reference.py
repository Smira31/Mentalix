from PIL import Image
from pathlib import Path
source = Image.open('/home/ubuntu/Mentalix/artifacts/qa-reference/checkin-screenshots/04.jpg').convert('RGBA')
# Exact bird/rings region from the 589x1280 uploaded reference.
crop = source.crop((225, 315, 375, 545))
out = Path('/home/ubuntu/Mentalix/public/checkin-bird-reference.png')
crop.save(out, optimize=True)
print(out, crop.size)
