"""PWA用アイコン画像を生成するスクリプト。

緑背景 (#4caf50) に白文字「買」を中央配置した正方形PNGを
180x180 / 192x192 / 512x512 の3サイズで出力する。
512 は maskable 対応のため文字を少し小さく描画。
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "public" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

GREEN = "#4caf50"
FONT_PATH = "C:/Windows/Fonts/YuGothB.ttc"

# (size, font_ratio) — maskable は安全領域 80% に収める
SIZES = [
    (180, 0.65),
    (192, 0.65),
    (512, 0.50),
]

for size, ratio in SIZES:
    img = Image.new("RGB", (size, size), GREEN)
    draw = ImageDraw.Draw(img)

    font_size = int(size * ratio)
    font = ImageFont.truetype(FONT_PATH, font_size)
    text = "買"

    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = (size - w) // 2 - bbox[0]
    y = (size - h) // 2 - bbox[1]

    draw.text((x, y), text, font=font, fill="white")

    out_path = OUT / f"{size}.png"
    img.save(out_path, optimize=True)
    print(f"wrote {out_path}")
