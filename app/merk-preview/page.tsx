"use client";

import { Merk, type MerkExpression } from "@/components/Merk";

const EXPRESSIONS: MerkExpression[] = [
  "happy",
  "curious",
  "surprised",
  "unsure",
  "confident",
  "celebration",
  "concern",
  "thinking",
  "scanning",
];

export default function MerkPreview() {
  return (
    <div style={{ minHeight: "100vh", background: "#F6F3EC", padding: 40, fontFamily: "sans-serif" }}>
      <h1 style={{ color: "#33684A", marginBottom: 24 }}>Merk — all expressions</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, maxWidth: 900 }}>
        {EXPRESSIONS.map((ex) => (
          <div key={ex} style={{ background: "#fff", borderRadius: 20, border: "1px solid #E6E0D0", padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Merk expression={ex} size={150} />
            <span style={{ fontWeight: 800, color: "#33684A", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}>{ex}</span>
          </div>
        ))}
      </div>
      <h2 style={{ color: "#33684A", margin: "36px 0 16px" }}>Accessories &amp; seasons</h2>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <Merk expression="curious" accessory="basket" pose="hold" size={150} />
        <Merk expression="curious" accessory="magnifier" size={150} />
        <Merk expression="happy" accessory="apple" size={150} />
        <Merk expression="happy" season="santa" size={150} />
        <Merk expression="celebration" season="flag" size={150} />
        <Merk expression="happy" limbs={false} still size={150} />
      </div>
    </div>
  );
}
