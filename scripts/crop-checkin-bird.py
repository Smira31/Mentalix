from PIL import Image
from pathlib import Path

source = Image.open('/tmp/checkin-frames/frame-012.png').convert('RGBA')
# Reference bird + planetary rings occupy the central area around x=180..305, y=315..460.
# Preserve the black pixels because the app uses the same black surface.
crop = source.crop((155, 300, 325, 475))
out = Path('/home/ubuntu/Mentalix/public/checkin-bird-reference.png')
out.parent.mkdir(parents=True, exist_ok=True)
crop.save(out, optimize=True)
print(out, crop.size)
