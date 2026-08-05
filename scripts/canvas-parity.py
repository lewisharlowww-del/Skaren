"""Mechanical parity check: every literal the canvas specifies for the result
screen must appear in the corresponding component."""
import re, sys

checks = [
    # (component, [(label, needle), ...])
    ("components/ScoreCard.tsx", [
        ("score card radius 22 / padding 20", 'borderRadius: 22, padding: 20'),
        ("score 40px", 'fontSize: 40'),
        ("SCORE label .12em weight 600", 'letterSpacing: "0.12em"'),
        ("why pill 44 min-height", 'minHeight: 44'),
        ("why pill padding 0 14px", 'padding: "0 14px"'),
        ("median rail height 9 radius 5", 'height: 9, borderRadius: 5'),
        ("median tick top -4 h17", 'top: -4'),
        ("dot 15px ring 3px", 'border: "3px solid var(--sk-surface-card)"'),
        ("tiles gap 10 / margin 16", 'gap: 10, marginTop: 16'),
        ("tile padding 14/16/13", '"14px 16px 13px"'),
        ("ghost letter 84px", 'fontSize: 84'),
        ("ghost offset right -14 top -18", 'right: -14'),
        ("chip 26x26 radius 9", 'width: 26,\n            height: 26,\n            borderRadius: 9'),
        ("verdict word 17px", 'fontSize: 17'),
        ("dots 4px / 2.5 gap", 'gap: 2.5, marginTop: 9'),
    ]),
    ("components/Additives.tsx", [
        ("summary radius 18 padding 14/18", 'borderRadius: 18,\n          padding: "14px 18px"'),
        ("count 34px lh .9", 'lineHeight: 0.9'),
        ("ratio bar 10px gap 3", 'height: 10,\n                  borderRadius: 3'),
        ("watch tile radius 15 padding 10/12/9", '"10px 12px 9px"'),
        ("watch left edge 4px", 'width: 4, background: "var(--sk-score-weak)"'),
        ("safe tile radius 15 padding 11/13", '"11px 13px"'),
        ("safe left edge 3px", 'width: 3, background: "var(--sk-border-green)"'),
        ("grid 2 col gap 8", 'gridTemplateColumns: "1fr 1fr",\n          gap: 8'),
    ]),
    ("components/ProcessingLevel.tsx", [
        ("card padding 15/18/14", '"15px 18px 14px"'),
        ("segments height 9 radius 5", 'height: 9,\n              borderRadius: 5'),
        ("segments margin 14", 'gap: 4, marginTop: 14'),
        ("step labels margin 8", 'gap: 4, marginTop: 8'),
        ("nova name 20px", 'fontSize: 20'),
        ("allergen dot 9px", 'width: 9,\n          height: 9'),
        ("allergen padding 13/16", '"13px 16px"'),
    ]),
    ("components/NutritionTable.tsx", [
        ("card radius 20", 'borderRadius: 20'),
        ("row height 44", 'minHeight: 44'),
        ("bar 5px radius 3", 'height: 5,\n                        borderRadius: 3'),
        ("percent column 30px", 'width: 30'),
        ("column divider 1px", 'width: 1, background: "var(--sk-rule-strong)"'),
        ("sub-row dash 10px", 'width: 10, height: 1'),
    ]),
    ("components/ProductPageLayout.tsx", [
        ("verdict radius 22 padding 18/20", 'borderRadius: 22,\n            padding: "18px 20px"'),
        ("verdict gap 13 align bottom", 'alignItems: "flex-end",\n            gap: 13'),
        ("folded corner 26px", 'width: 26,\n              height: 26'),
        ("Merk 94px", 'size={94}'),
        ("headline 17.5", 'fontSize: 17.5'),
        ("body 13.5 / 1.45", 'fontSize: 13.5,\n                lineHeight: 1.45'),
        ("name 24px 600 -.025em", 'letterSpacing: "-0.025em"'),
        ("20px gutters", 'className="mx-5'),
    ]),
    ("components/Alternatives.tsx", [
        ("CTA border 1.5px ink", '1.5px solid var(--sk-text-primary)'),
        ("CTA radius 20 padding 15/20", 'padding: "15px 20px",\n          borderRadius: 20'),
        ("CTA title 15.5 600", 'fontSize: 15.5, fontWeight: 600'),
        ("CTA sub 12.5 forest", 'fontSize: 12.5, color: "var(--sk-brand-forest)"'),
    ]),
]

fail = 0
for path, items in checks:
    src = open(path).read()
    for label, needle in items:
        if needle not in src:
            print(f"MISS  {path}: {label}")
            fail += 1
print(f"\n{'FAILURES: ' + str(fail) if fail else 'All canvas literals present.'}")
sys.exit(1 if fail else 0)
