"""Converts the captured PNGs to WebP and drops the originals.

Called by shoot-screenshots.mjs. Kept in Python because Pillow is already
available and pulling an image library into npm for this would be worse.
"""
import sys, pathlib
from PIL import Image

root = pathlib.Path(sys.argv[1])
for png in sorted(root.rglob("*.png")):
    im = Image.open(png).convert("RGB")
    webp = png.with_suffix(".webp")
    im.save(webp, "WEBP", quality=82, method=6)
    print(f"  {webp.relative_to(root)}  {webp.stat().st_size / 1024:.0f} KB")
    png.unlink()
