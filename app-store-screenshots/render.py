from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT = Path(__file__).parent
SOURCE = ROOT / "source"
EXPORTS = ROOT / "exports"
EXPORTS.mkdir(exist_ok=True)

W, H = 1290, 2796
GREEN = "#145C3A"
CREAM = "#F6F1E6"
OFF_WHITE = "#FFFDF7"
DARK = "#123B2A"
LIME = "#CFF641"
MUTED = "#766E61"

REGULAR = SOURCE / "Satoshi-Regular.otf"
BOLD = SOURCE / "Satoshi-Bold.otf"
ITALIC = SOURCE / "Satoshi-MediumItalic.otf"


def font(size, kind="regular"):
    path = {"regular": REGULAR, "bold": BOLD, "italic": ITALIC}[kind]
    return ImageFont.truetype(str(path), size=size)


def multiline(draw, xy, text, fnt, fill, width, spacing=10):
    words = text.split()
    lines, current = [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=fnt)[2] <= width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    draw.multiline_text(xy, "\n".join(lines), font=fnt, fill=fill, spacing=spacing)
    return lines


def rounded_mask(size, radius):
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0], size[1]), radius, fill=255)
    return mask


def phone(screen_path, width, border=22, radius=92):
    screen = Image.open(screen_path).convert("RGB")
    target_h = int(width * screen.height / screen.width)
    screen = screen.resize((width, target_h), Image.Resampling.LANCZOS)
    shell = Image.new("RGBA", (width + border * 2, target_h + border * 2), (0, 0, 0, 0))
    shadow = Image.new("RGBA", shell.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((border, border, shell.width - 1, shell.height - 1), radius, fill=(0, 0, 0, 95))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    shell.alpha_composite(shadow, (-4, 14))
    ImageDraw.Draw(shell).rounded_rectangle((0, 0, shell.width - 1, shell.height - 1), radius, fill="#10110F")
    inner = rounded_mask(screen.size, max(60, radius - border))
    shell.paste(screen, (border, border), inner)
    return shell


def place(canvas, image, xy, angle=0):
    if angle:
        image = image.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    canvas.alpha_composite(image, xy)


def logo_mark(size=118, cream=False):
    logo = Image.open(SOURCE / "skaren-logo.png").convert("RGBA")
    pixels = logo.load()
    for y in range(logo.height):
        for x in range(logo.width):
            r, g, b, a = pixels[x, y]
            if g > r * 1.12 and g > b * 1.12:
                pixels[x, y] = (r, g, b, 0)
    logo.thumbnail((size, size), Image.Resampling.LANCZOS)
    if cream:
        alpha = logo.getchannel("A")
        cream_mark = Image.new("RGBA", logo.size, OFF_WHITE)
        cream_mark.putalpha(alpha)
        logo = cream_mark
    return logo


def save(canvas, name):
    canvas.convert("RGB").save(EXPORTS / name, quality=100)


def frame_1():
    im = Image.new("RGBA", (W, H), GREEN)
    d = ImageDraw.Draw(im)
    place(im, logo_mark(132, cream=True), (92, 92))
    d.text((92, 690), "Know what\nyou eat", font=font(166, "bold"), fill=OFF_WHITE, spacing=4)
    multiline(
        d,
        (98, 1910),
        "Instant health & eco grades for every product you scan",
        font(76),
        OFF_WHITE,
        1010,
        16,
    )
    save(im, "01_Know_What_You_Eat.png")


def frame_2():
    im = Image.new("RGBA", (W, H), CREAM)
    d = ImageDraw.Draw(im)
    d.text((82, 120), "Every additive\nexplained", font=font(142, "italic"), fill=DARK, spacing=-2)
    multiline(d, (92, 770), "300+ E-numbers with clear safety ratings", font(66, "bold"), DARK, 760, 8)
    p = phone(SOURCE / "additives.png", 690)
    place(im, p, (410, 940), angle=-13)
    d.rounded_rectangle((0, 2300, W, H + 60), 130, fill="#EFE7D4")
    d.text((82, 2450), "Clear ratings.\nPlain-language context.", font=font(62, "bold"), fill=DARK, spacing=8)
    save(im, "02_Additives_Explained.png")


def pill(draw, y, text):
    draw.rounded_rectangle((720, y, 1228, y + 126), 63, fill=GREEN)
    draw.text((974, y + 63), text, anchor="mm", font=font(42, "bold"), fill=OFF_WHITE)


def frame_3():
    im = Image.new("RGBA", (W, H), CREAM)
    d = ImageDraw.Draw(im)
    d.text((82, 110), "Track your\nfood habits", font=font(138, "bold"), fill=DARK, spacing=-10)
    pill(d, 790, "A–E health grade")
    pill(d, 950, "Eco impact grade")
    pill(d, 1110, "NOVA processing level")
    p = phone(SOURCE / "stats.png", 610)
    place(im, p, (-90, 850), angle=7)
    d.rounded_rectangle((0, 2280, W, H + 80), 130, fill="#EFE7D4")
    d.text((82, 2435), "Full history.\nWeekly insights.", font=font(72, "bold"), fill=DARK, spacing=4)
    d.ellipse((1020, 2415, 1185, 2580), outline=DARK, width=10)
    d.line((1065, 2498, 1145, 2498), fill=DARK, width=12)
    d.line((1112, 2465, 1145, 2498, 1112, 2531), fill=DARK, width=12, joint="curve")
    save(im, "03_Track_Food_Habits.png")


def frame_4():
    im = Image.new("RGBA", (W, H), CREAM)
    d = ImageDraw.Draw(im)
    d.text((82, 104), "Your full\nscan history", font=font(142, "bold"), fill=DARK, spacing=-8)
    multiline(
        d,
        (92, 620),
        "Every product you’ve scanned, always within reach",
        font(68, "italic"),
        DARK,
        980,
        8,
    )
    d.ellipse((530, 1080, 1190, 1740), fill=GREEN)
    p = phone(SOURCE / "history.png", 720)
    place(im, p, (360, 900))
    d.rectangle((0, 2500, W, H), fill=GREEN)
    d.text((82, 2570), "Revisit every choice.", font=font(68, "bold"), fill=OFF_WHITE)
    save(im, "04_Scan_History.png")


def frame_5():
    im = Image.new("RGBA", (W, H), CREAM)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W, 760), fill=GREEN)
    p = phone(SOURCE / "product.png", 820)
    place(im, p, (220, 160))
    d.text((82, 2300), "Scan smarter.\nLive cleaner.", font=font(128, "bold"), fill=DARK, spacing=-6)
    save(im, "05_Product_Result.png")


if __name__ == "__main__":
    frame_1()
    frame_2()
    frame_3()
    frame_4()
    frame_5()
