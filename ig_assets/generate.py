#!/usr/bin/env python3
"""Skaren Instagram graphics generator. Brand: dark forest green, cream text, A-E grades."""
import math, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = HERE

# ---------- Brand ----------
BG        = (18, 40, 27)      # deep forest #12281B
BG2       = (12, 28, 19)      # darker
CARD      = (32, 58, 40)      # card surface
CARD2     = (40, 70, 50)
CREAM     = (244, 240, 228)   # off-white
CREAM_DIM = (196, 205, 190)
GREEN     = (74, 222, 128)    # accent
GREEN_D   = (34, 160, 90)
GOLD      = (214, 176, 90)

GRADE = {  # A-E palette
    'A': (34, 178, 96),
    'B': (140, 190, 60),
    'C': (222, 178, 60),
    'D': (232, 130, 50),
    'E': (222, 74, 74),
}

# ---------- Fonts ----------
AV = "/System/Library/Fonts/Avenir Next.ttc"
def font(size, weight="heavy"):
    idx = {"heavy":7, "bold":1, "demi":5, "medium":3, "regular":0}.get(weight,7)
    try:
        return ImageFont.truetype(AV, size, index=idx)
    except Exception:
        return ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", size)

# ---------- helpers ----------
def vgrad(w, h, top, bot):
    base = Image.new("RGB", (w, h), top)
    top_c = top; bot_c = bot
    for y in range(h):
        t = y / max(1, h-1)
        # ease
        t = t*t*(3-2*t)
        r = int(top_c[0] + (bot_c[0]-top_c[0])*t)
        g = int(top_c[1] + (bot_c[1]-top_c[1])*t)
        b = int(top_c[2] + (bot_c[2]-top_c[2])*t)
        for x in range(0,1):
            pass
        base.paste((r,g,b), (0,y,w,y+1))
    return base

def radial_glow(img, cx, cy, radius, color, strength=60):
    w,h = img.size
    glow = Image.new("L",(w,h),0)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([cx-radius,cy-radius,cx+radius,cy+radius], fill=strength)
    glow = glow.filter(ImageFilter.GaussianBlur(radius/2.2))
    tint = Image.new("RGB",(w,h),color)
    img.paste(Image.composite(tint,img,glow), (0,0))
    return img

def measure(draw, text, f, tracking=0):
    if tracking==0:
        b = draw.textbbox((0,0), text, font=f)
        return b[2]-b[0], b[3]-b[1]
    w=0
    for ch in text:
        b=draw.textbbox((0,0),ch,font=f); w += (b[2]-b[0])+tracking
    b=draw.textbbox((0,0),"Ag",font=f)
    return w, b[3]-b[1]

def text_tracked(draw, xy, text, f, fill, tracking=0, anchor="la"):
    if tracking==0:
        draw.text(xy, text, font=f, fill=fill, anchor=anchor)
        return
    x,y = xy
    total,_ = measure(draw,text,f,tracking)
    if anchor[0]=="m": x -= total/2
    elif anchor[0]=="r": x -= total
    for ch in text:
        draw.text((x,y), ch, font=f, fill=fill, anchor="l"+anchor[1])
        b=draw.textbbox((0,0),ch,font=f); x += (b[2]-b[0])+tracking

def wrap(draw, text, f, maxw):
    words = text.split(); lines=[]; cur=""
    for wd in words:
        t=(cur+" "+wd).strip()
        if draw.textlength(t,font=f)<=maxw: cur=t
        else:
            if cur: lines.append(cur)
            cur=wd
    if cur: lines.append(cur)
    return lines

def draw_multiline(draw, x, y, text, f, fill, maxw, lh, anchor="l", center_x=None):
    lines = wrap(draw,text,f,maxw)
    for ln in lines:
        if anchor=="m":
            draw.text((center_x,y), ln, font=f, fill=fill, anchor="ma")
        else:
            draw.text((x,y), ln, font=f, fill=fill, anchor="la")
        y += lh
    return y

def rrect(draw, box, r, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)

def star(draw, cx, cy, r, fill):
    pts=[]
    for i in range(10):
        ang = -math.pi/2 + i*math.pi/5
        rad = r if i%2==0 else r*0.42
        pts.append((cx+rad*math.cos(ang), cy+rad*math.sin(ang)))
    draw.polygon(pts, fill=fill)

def star_row(draw, cx, cy, r, n, gap, fill):
    total = n*2*r + (n-1)*gap
    x = cx - total/2 + r
    for _ in range(n):
        star(draw, x, cy, r, fill); x += 2*r+gap

def soft_card(base, box, r=40, fill=CARD, shadow=70, blur=40, dy=18):
    w,h = base.size
    sh = Image.new("RGBA",(w,h),(0,0,0,0))
    sd = ImageDraw.Draw(sh)
    sd.rounded_rectangle([box[0],box[1]+dy,box[2],box[3]+dy], radius=r, fill=(0,0,0,shadow))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(sh)
    d = ImageDraw.Draw(base)
    d.rounded_rectangle(box, radius=r, fill=fill+(255,))
    return d

def load_icon(size, radius_ratio=0.225):
    ic = Image.open(os.path.join(HERE,"appicon.png")).convert("RGBA").resize((size,size), Image.LANCZOS)
    mask = Image.new("L",(size,size),0)
    ImageDraw.Draw(mask).rounded_rectangle([0,0,size,size], radius=int(size*radius_ratio), fill=255)
    ic.putalpha(mask)
    return ic

def base_canvas(w,h):
    img = vgrad(w,h,(20,44,30),(11,26,18)).convert("RGBA")
    img = radial_glow(img, int(w*0.5), int(h*0.16), int(w*0.7), (60,150,90), 55)
    img = radial_glow(img, int(w*0.85), int(h*0.9), int(w*0.5), (30,90,60), 40)
    return img

def grade_badge(draw, cx, cy, letter, size, big_label=None):
    col = GRADE[letter]
    r = size
    draw.ellipse([cx-r,cy-r,cx+r,cy+r], fill=col)
    f = font(int(size*1.25),"heavy")
    draw.text((cx,cy+2), letter, font=f, fill=(255,255,255), anchor="mm")

def paste_center(base, im, cx, cy):
    base.alpha_composite(im, (int(cx-im.width/2), int(cy-im.height/2)))

def save(img, name):
    p = os.path.join(OUT,name)
    img.convert("RGB").save(p, "PNG", quality=95)
    print("wrote", name, img.size)

W,H = 1080,1350   # portrait feed
SW,SH = 1080,1920 # story

# =========================================================
# SLIDE 1 — COVER
# =========================================================
def slide_cover():
    img = base_canvas(W,H); d = ImageDraw.Draw(img)
    icon = load_icon(190); paste_center(img, icon, W/2, 250)
    text_tracked(d,(W/2,395),"S K A R E N",font(30,"bold"),CREAM,tracking=8,anchor="ma")

    d.text((W/2,470), "Scan mat.", font=font(96,"heavy"), fill=CREAM, anchor="ma")
    d.text((W/2,575), "Spis smartere.", font=font(96,"heavy"), fill=GREEN, anchor="ma")

    draw_multiline(d, 0, 720,
        "Skann strekkoden og forstå hva du faktisk spiser.",
        font(38,"medium"), CREAM_DIM, 860, 52, anchor="m", center_x=W/2)

    # three pill chips
    chips = ["Helse-karakter","Øko-karakter","NOVA-nivå"]
    fchip = font(30,"demi")
    gap=22; pads=30
    widths=[d.textlength(c,font=fchip)+pads*2 for c in chips]
    total=sum(widths)+gap*(len(chips)-1)
    x=(W-total)/2; y=880
    for c,wc in zip(chips,widths):
        rrect(d,[x,y,x+wc,y+70],35,fill=CARD)
        d.text((x+wc/2,y+35),c,font=fchip,fill=CREAM,anchor="mm")
        x+=wc+gap

    # grade row preview
    letters=["A","B","C","D","E"]; bs=54; gapg=34
    tw=len(letters)*bs*2+gapg*(len(letters)-1)
    gx=(W-tw)/2+bs; gy=1080
    for L in letters:
        grade_badge(d,gx,gy,L,bs); gx+=bs*2+gapg
    d.text((W/2,1180),"A til E. Ærlig. Enkelt.",font=font(30,"medium"),fill=CREAM_DIM,anchor="ma")

    d.text((W/2,1275),"Sveip videre",font=font(34,"demi"),fill=GREEN,anchor="ma")
    # arrow triangle
    ax=W/2+130; ay=1290
    d.polygon([(ax,ay-14),(ax,ay+14),(ax+22,ay)],fill=GREEN)
    save(img,"01_cover.png")

# =========================================================
# SLIDE 2 — HOW IT WORKS (3 steps)
# =========================================================
def slide_how():
    img = base_canvas(W,H); d = ImageDraw.Draw(img)
    text_tracked(d,(90,120),"S L I K   V I R K E R   D E T",font(28,"bold"),GREEN,tracking=6)
    d.text((90,170),"3 sekunder til",font=font(74,"heavy"),fill=CREAM,anchor="la")
    d.text((90,255),"et klarere bilde.",font=font(74,"heavy"),fill=CREAM,anchor="la")

    steps=[("1","Skann strekkoden","Pek kameraet mot en hvilken som helst matvare."),
           ("2","Se karakterene","Helse og øko fra A til E, med det samme."),
           ("3","Velg smartere","Sammenlign, bygg handleliste, spis bedre.")]
    y=420; ch=250; m=90
    for num,title,body in steps:
        box=[m,y,W-m,y+ch-40]
        d2=soft_card(img,box,r=38,fill=CARD); d=d2
        cy=y+(ch-40)/2
        d.ellipse([m+40,cy-45,m+40+90,cy+45],fill=GREEN)
        d.text((m+85,cy),num,font=font(58,"heavy"),fill=BG,anchor="mm")
        d.text((m+180,cy-42),title,font=font(46,"heavy"),fill=CREAM,anchor="lm")
        draw_multiline(d,m+180,cy+2,body,font(31,"medium"),CREAM_DIM,W-m-m-200,40)
        y+=ch
    save(img,"02_how.png")

# =========================================================
# SLIDE 3 — GRADES A-E
# =========================================================
def slide_grades():
    img = base_canvas(W,H); d = ImageDraw.Draw(img)
    text_tracked(d,(90,120),"K A R A K T E R E R",font(28,"bold"),GREEN,tracking=6)
    d.text((90,170),"To karakterer.",font=font(76,"heavy"),fill=CREAM,anchor="la")
    d.text((90,258),"Null gjetting.",font=font(76,"heavy"),fill=GREEN,anchor="la")

    def scale_block(y, label, sub, highlight):
        d.text((90,y),label,font=font(44,"heavy"),fill=CREAM,anchor="la")
        d.text((90,y+58),sub,font=font(28,"medium"),fill=CREAM_DIM,anchor="la")
        letters=["A","B","C","D","E"]; n=len(letters)
        m=90; total=W-2*m; gap=20; bw=(total-gap*(n-1))/n
        yy=y+110
        for i,L in enumerate(letters):
            x=m+i*(bw+gap)
            col=GRADE[L]
            sel = (L==highlight)
            rrect(d,[x,yy,x+bw,yy+ (150 if sel else 120)],26,fill=col)
            d.text((x+bw/2, yy+(75 if sel else 60)),L,font=font(58 if sel else 46,"heavy"),fill=(255,255,255),anchor="mm")
            if sel:
                d.polygon([(x+bw/2-14,yy-18),(x+bw/2+14,yy-18),(x+bw/2,yy-2)],fill=CREAM)
        return yy+180

    y=430
    y=scale_block(y,"Helse","Næring, sukker, tilsetningsstoffer","B")
    y=scale_block(y+30,"Øko","Miljøpåvirkning og bærekraft","C")
    save(img,"03_grades.png")

# =========================================================
# SLIDE 4 — ADDITIVES + NOVA
# =========================================================
def slide_additives():
    img = base_canvas(W,H); d = ImageDraw.Draw(img)
    text_tracked(d,(90,120),"D Y P E R E   I N N S I K T",font(28,"bold"),GREEN,tracking=6)
    d.text((90,170),"Ingenting skjult.",font=font(74,"heavy"),fill=CREAM,anchor="la")

    # additives card
    box=[90,320,W-90,690]; d=soft_card(img,box,r=40,fill=CARD)
    d.text((130,360),"300+ E-numre",font=font(56,"heavy"),fill=CREAM,anchor="la")
    d.text((130,430),"Hvert tilsetningsstoff vurdert og forklart.",font=font(30,"medium"),fill=CREAM_DIM,anchor="la")
    rows=[("E621","Smaksforsterker","E"),("E330","Sitronsyre","A"),("E951","Søtstoff","D")]
    yy=500
    for code,name,g in rows:
        rrect(d,[130,yy,W-130,yy+52],14,fill=CARD2)
        d.text((150,yy+26),code,font=font(30,"heavy"),fill=CREAM,anchor="lm")
        d.text((280,yy+26),name,font=font(28,"medium"),fill=CREAM_DIM,anchor="lm")
        grade_badge(d,W-165,yy+26,g,22)
        yy+=62

    # NOVA card
    box=[90,730,W-90,1230]; d=soft_card(img,box,r=40,fill=CARD)
    d.text((130,770),"NOVA-skala",font=font(56,"heavy"),fill=CREAM,anchor="la")
    d.text((130,840),"Hvor bearbeidet maten faktisk er.",font=font(30,"medium"),fill=CREAM_DIM,anchor="la")
    nova=[("1","Ubearbeidet",(34,178,96)),("2","Kulinarisk",(140,190,60)),
          ("3","Bearbeidet",(232,150,50)),("4","Ultraprosessert",(222,74,74))]
    yy=910
    barx=640
    for num,lab,col in nova:
        d.ellipse([130,yy,130+58,yy+58],fill=col)
        d.text((159,yy+29),num,font=font(34,"heavy"),fill=(255,255,255),anchor="mm")
        d.text((215,yy+29),lab,font=font(32,"demi"),fill=CREAM,anchor="lm")
        # bar
        barw=int((int(num)/4)*(W-130-barx))
        rrect(d,[barx,yy+16,barx+barw,yy+42],13,fill=col)
        yy+=78
    save(img,"04_additives.png")

# =========================================================
# SLIDE 5 — CTA
# =========================================================
def slide_cta():
    img = base_canvas(W,H); d = ImageDraw.Draw(img)
    icon = load_icon(170); paste_center(img,icon,W/2,300)
    d.text((W/2,470),"Gratis. For alltid.",font=font(72,"heavy"),fill=CREAM,anchor="ma")
    draw_multiline(d,0,580,"Last ned Skaren og begynn å spise smartere i dag.",
                   font(38,"medium"),CREAM_DIM,860,52,anchor="m",center_x=W/2)

    # app store button
    bw,bh=560,130; bx=(W-bw)/2; by=760
    d=soft_card(img,[bx,by,bx+bw,by+bh],r=32,fill=CREAM)
    d.text((bx+bw/2+24,by+bh/2-20),"Last ned på",font=font(26,"medium"),fill=(30,50,38),anchor="mm")
    d.text((bx+bw/2+24,by+bh/2+18),"App Store",font=font(42,"heavy"),fill=(18,30,22),anchor="mm")
    # apple logo circle
    d.ellipse([bx+58,by+bh/2-34,bx+58+68,by+bh/2+34],fill=BG)
    _apple(d, bx+92, by+bh/2, 30, CREAM)

    # rating
    star_row(d, W/2, 970, 26, 5, 16, GOLD)
    d.text((W/2,1040),"Matvarescanner for Norge",font=font(32,"medium"),fill=CREAM_DIM,anchor="ma")

    text_tracked(d,(W/2,1200),"S K A R E N . A P P",font(30,"bold"),GREEN,tracking=8,anchor="ma")
    save(img,"05_cta.png")

def _apple(d,cx,cy,s,col):
    # cleaner apple silhouette: two overlapping lobes, leaf, and bite
    d.ellipse([cx-s*0.72,cy-s*0.55,cx+s*0.18,cy+s*0.85],fill=col)
    d.ellipse([cx-s*0.18,cy-s*0.55,cx+s*0.72,cy+s*0.85],fill=col)
    # top dip
    d.ellipse([cx-s*0.28,cy-s*0.95,cx+s*0.28,cy-s*0.45],fill=BG)
    # bite on the right
    d.ellipse([cx+s*0.30,cy-s*0.30,cx+s*0.95,cy+s*0.45],fill=BG)
    # leaf
    d.polygon([(cx+s*0.02,cy-s*0.72),(cx+s*0.45,cy-s*1.05),(cx+s*0.30,cy-s*0.55)],fill=col)

# =========================================================
# SQUARE HOOK 1080x1080
# =========================================================
def square_hook():
    w=h=1080
    img=base_canvas(w,h); d=ImageDraw.Draw(img)
    text_tracked(d,(90,110),"S K A R E N",font(26,"bold"),GREEN,tracking=8)
    d.text((90,200),"\u201CSunn\u201D",font=font(120,"heavy"),fill=CREAM,anchor="la")
    d.text((90,348),"står det på",font=font(76,"heavy"),fill=CREAM,anchor="la")
    d.text((90,438),"pakken.",font=font(76,"heavy"),fill=CREAM,anchor="la")
    d.text((90,568),"Men er den",font=font(76,"heavy"),fill=CREAM_DIM,anchor="la")
    d.text((90,658),"det?",font=font(76,"heavy"),fill=GREEN,anchor="la")
    icon=load_icon(120); img.alpha_composite(icon,(w-90-120,110))
    box=[90,808,w-90,982]; d=soft_card(img,box,r=32,fill=CARD)
    d.text((130,848),"Skann og se sannheten:",font=font(34,"heavy"),fill=CREAM,anchor="la")
    d.text((130,904),"helse · øko · NOVA · tilsetningsstoffer",font=font(28,"medium"),fill=CREAM_DIM,anchor="la")
    d.text((90,1010),"Gratis matvarescanner  \u2014  skaren.app",font=font(30,"demi"),fill=GREEN,anchor="la")
    save(img,"square_hook.png")

# =========================================================
# STORY 1080x1920
# =========================================================
def story_main():
    img=base_canvas(SW,SH); d=ImageDraw.Draw(img)
    icon=load_icon(150); paste_center(img,icon,SW/2,360)
    text_tracked(d,(SW/2,470),"S K A R E N",font(30,"bold"),CREAM,tracking=8,anchor="ma")
    d.text((SW/2,640),"Vet du hva",font=font(96,"heavy"),fill=CREAM,anchor="ma")
    d.text((SW/2,745),"du spiser?",font=font(96,"heavy"),fill=GREEN,anchor="ma")
    draw_multiline(d,0,920,"Skann strekkoden og få helse- og økokarakter på 3 sekunder.",
                   font(40,"medium"),CREAM_DIM,820,56,anchor="m",center_x=SW/2)
    # grades
    letters=["A","B","C","D","E"]; bs=58; gap=40
    tw=len(letters)*bs*2+gap*(len(letters)-1); gx=(SW-tw)/2+bs; gy=1200
    for L in letters: grade_badge(d,gx,gy,L,bs); gx+=bs*2+gap
    # CTA button
    bw,bh=620,140; bx=(SW-bw)/2; by=1480
    d=soft_card(img,[bx,by,bx+bw,by+bh],r=34,fill=GREEN)
    d.text((SW/2,by+bh/2),"Last ned gratis",font=font(52,"heavy"),fill=BG,anchor="mm")
    d.text((SW/2,1720),"Sveip opp  ·  App Store",font=font(34,"demi"),fill=CREAM_DIM,anchor="ma")
    save(img,"story_main.png")

def story_poll():
    img=base_canvas(SW,SH); d=ImageDraw.Draw(img)
    text_tracked(d,(SW/2,300),"S K A R E N",font(28,"bold"),GREEN,tracking=8,anchor="ma")
    draw_multiline(d,0,520,"Sjekker du tilsetningsstoffer før du kjøper mat?",
                   font(72,"heavy"),CREAM,900,88,anchor="m",center_x=SW/2)
    # poll bar mock
    bx=140; by=980; bw=SW-280
    rrect(d,[bx,by,bx+bw,by+120],28,fill=CARD)
    d.text((bx+50,by+60),"Ja, alltid",font=font(44,"demi"),fill=CREAM,anchor="lm")
    rrect(d,[bx,by+160,bx+bw,by+280],28,fill=CARD)
    d.text((bx+50,by+220),"Aldri...",font=font(44,"demi"),fill=CREAM,anchor="lm")
    draw_multiline(d,0,1400,"Skaren gjør det for deg. Gratis.",
                   font(46,"medium"),GREEN,820,60,anchor="m",center_x=SW/2)
    save(img,"story_poll.png")

# =========================================================
# FACEBOOK COVER 1640x624 (safe zone centered ~820 wide)
# =========================================================
def facebook_cover():
    w,h = 1640,624
    img = vgrad(w,h,(20,44,30),(11,26,18)).convert("RGBA")
    img = radial_glow(img, int(w*0.30), int(h*0.28), int(w*0.5), (60,150,90), 55)
    img = radial_glow(img, int(w*0.9), int(h*0.9), int(w*0.4), (30,90,60), 40)
    d = ImageDraw.Draw(img)

    # Profile pic overlaps bottom-left (~180px avatar). Keep that corner clear.
    # Text block sits center-left but lifted above the avatar zone.
    lx = 470
    text_tracked(d,(lx, 95),"S K A R E N",font(42,"bold"),CREAM,tracking=8)
    d.text((lx, 155),"Scan mat. Spis smartere.",font=font(32,"medium"),fill=GREEN,anchor="la")

    d.text((lx, 250),"Vet du hva du spiser?",font=font(74,"heavy"),fill=CREAM,anchor="la")
    draw_multiline(d, lx, 355,
        "Gratis matvarescanner for Norge. Skann strekkoden og se helse, øko, NOVA og tilsetningsstoffer.",
        font(30,"medium"), CREAM_DIM, 780, 44)

    # grade badges row, aligned with text block (well clear of avatar)
    letters=["A","B","C","D","E"]; bs=32; gap=20
    gx=lx+bs; gy=490
    for L in letters:
        grade_badge(d,gx,gy,L,bs); gx+=bs*2+gap

    # right: A-E vertical scale accent
    sx = 1290; sy=130; sw=250
    labels=[("A",(34,178,96)),("B",(140,190,60)),("C",(222,178,60)),("D",(232,130,50)),("E",(222,74,74))]
    yy=sy
    for L,col in labels:
        rrect(d,[sx,yy,sx+sw,yy+56],16,fill=col)
        d.text((sx+28,yy+28),L,font=font(32,"heavy"),fill=(255,255,255),anchor="lm")
        yy+=68
    save(img,"facebook_cover.png")

if __name__=="__main__":
    slide_cover(); slide_how(); slide_grades(); slide_additives(); slide_cta()
    square_hook(); story_main(); story_poll(); facebook_cover()
    print("DONE")
