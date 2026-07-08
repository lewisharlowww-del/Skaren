# Skaren — App Store Preview Video (Storyboard)

**Goal:** 15–30s vertical video that shows the core loop (scan → instant grades →
act) in the first 3 seconds, because the App Store autoplays muted and most
viewers drop within 5s. No narration needed; design for **sound-off**.

**Specs (App Store Connect):**
- Duration: **15–30s** (aim ~20s).
- Resolution: **886 × 1920** (6.5") and **1080 × 1920** (6.7"), portrait, .mov/.mp4, H.264/HEVC.
- First frame is used as the **poster** — make it your best product-result screen with the A grade visible.
- Only in-app footage allowed (Apple rejects marketing-only intros). Every shot must be real UI.
- Captions are fine (encouraged for sound-off). Keep text large and on-screen ≥1.5s.

---

## Shot list (~20s)

| # | Time | On screen (real UI) | Caption overlay | Motion |
|---|------|---------------------|-----------------|--------|
| 1 | 0.0–3.0s | Scanner screen, phone pointed at a real grocery barcode; reticle animates and locks | **"Scan any food"** | Barcode line sweep, subtle haptic pop on lock |
| 2 | 3.0–4.0s | Quick transition into the product result loading, then snapping in | *(no caption — let motion carry)* | Fast card slide-up |
| 3 | 4.0–9.0s | Product result: **A (Health)** and **D (Eco)** grade circles fill/animate in | **"Instant A–E grades"** | Grade rings draw on; numbers count up |
| 4 | 9.0–13.0s | Scroll down to Additives / NOVA processing bar filling | **"Every additive explained"** | Smooth auto-scroll, NOVA bar fills |
| 5 | 13.0–16.0s | Tap "Add to list" → shopping list screen with item added | **"Build a cleaner basket"** | Button press state + list item drop-in |
| 6 | 16.0–19.0s | Stats/history screen with weekly grades | **"Track your habits"** | Cards stagger in |
| 7 | 19.0–20.5s | Logo lockup on brand green | **"Skaren — Scan smarter. Live cleaner."** | Gentle logo scale/fade |

---

## Recording checklist

- Record on a **real device** (iPhone 15/16 Pro) via **screen recording**
  (Settings > Control Center > Screen Recording), 60fps. Use a clean status bar:
  QuickTime "New Movie Recording" from a connected device gives a clean bar, or
  use the Simulator (`xcrun simctl io booted recordVideo out.mov`) if the UI
  looks identical.
- Pre-stage data: one product that grades **A health** and a contrasting one so
  the grades look meaningful. The Tine Helmelk screen (A / D) is a great hero.
- Keep each tap deliberate and slightly slower than natural so viewers follow.
- Hide personal info (real account email etc.) — use a demo account.

## Editing checklist

- Trim to ≤30s. Put the strongest 3s first (scan + grade reveal).
- Add captions in the app's Satoshi font, brand green `#145C3A` / cream `#F6F1E6`.
- Export both required sizes. First frame = A-grade product screen (poster).
- No music with licensing issues; Apple's autoplay is muted anyway, so music is optional.

## Fast path (no filming)

If you want a preview quickly, you can build an **animated screen-flow** from the
existing screenshots (Ken Burns + slide transitions) in CapCut/Keynote/After
Effects. It's allowed as long as it depicts real app UI. Order the frames as:
`05_Product_Result → 02_Additives → 03_Track → 04_History`, 3–4s each, with the
captions above.
