import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "K. Venkata Sahith — AI Engineer and Computer Vision Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0B1110", color: "#F3F0E7", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#22B8AA", fontSize: 22, letterSpacing: 5 }}>SAHITH <span style={{ width: 9, height: 9, borderRadius: 9, background: "#22B8AA" }} /></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontSize: 66, fontWeight: 700, lineHeight: 1.08 }}>K. Venkata Sahith</div>
        <div style={{ fontSize: 29, color: "#9ADFD6" }}>AI Engineer · Computer Vision · Full-Stack Developer</div>
      </div>
      <div style={{ fontSize: 20, color: "#AEBAB3" }}>Artificial Intelligence undergraduate · Amrita Vishwa Vidyapeetham</div>
    </div>,
    size,
  );
}
