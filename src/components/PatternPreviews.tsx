import React, { useEffect, useRef } from "react";

// Import the Pattern type from circle.tsx if needed, or redefine here for isolation
export type Pattern =
  | "CONVERGENCE"
  | "CARDIOID"
  | "ENVELOPE"
  | "CARDIOID_2"
  | "DIAMETERS"
  | "SPIRAL"
  | "WAVES"
  | "DNA"
  | "DNA_HELIX"
  | "DESTINY"
  | "MAURER_ROSE"
  | "TORUS_KNOT"
  | "TUNNEL";

interface PreviewProps {
  n?: number;
  r?: number;
  lineWidth?: number;
  lineColor?: string;
  dotRadius?: number;
  dotColor?: string;
  cardioidMultiplier?: number;
  envelopeSkipPoints?: number;
  cardioid2Multiplier?: number;
  spiralTurns?: number;
  dnaTurns?: number;
  dotRectWidth?: number;
  dotRectHeight?: number;
  backgroundColor?: string;
  textColor?: string;
  maurerMultiplier?: number;
}

const allPatterns: Pattern[] = [
  "CONVERGENCE",
  "CARDIOID",
  "ENVELOPE",
  "CARDIOID_2",
  "DIAMETERS",
  "SPIRAL",
  "WAVES",
  "DNA",
  "DNA_HELIX",
  "DESTINY",
  "MAURER_ROSE",
  "TORUS_KNOT",
  "TUNNEL",
];

const StaticCirclePreview: React.FC<
  {
    pattern: Pattern;
  } & PreviewProps
> = ({
  pattern,
  n = 25,
  r = 80,
  lineWidth = 1,
  lineColor = "white",
  dotRadius = 2,
  dotColor = "white",
  cardioidMultiplier = 2,
  envelopeSkipPoints = 8,
  cardioid2Multiplier = 3,
  spiralTurns = 3,
  dnaTurns = 5,
  dotRectWidth = 8,
  dotRectHeight = 3,
  backgroundColor = "#181a20",
  textColor = "#ffffff",
  maurerMultiplier = 6,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const padding = 32;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const D = 2 * r;
    canvas.width = D + 2 * padding;
    canvas.height = D + 2 * padding + 25;
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = lineColor;
    ctx.fillStyle = dotColor;
    ctx.lineCap = "butt";
    ctx.clearRect(0, 0, D + 2 * padding, D + 2 * padding + 25);
    ctx.save();
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, D + 2 * padding, D + 2 * padding + 25);
    ctx.restore();
    const cx = r + padding,
      cy = r + padding;
    const Px = 0.7 * D,
      Py = 0.3 * D;
    const chords: { angle0: number; angle1: number }[] = [];
    const spacing = n > 1 ? (2 * r) / (n - 1) : 0;
    for (let i = 0; i < n; i++) {
      const y = -r + spacing * i;
      const half = Math.sqrt(r * r - y * y);
      if (!isFinite(half)) continue;
      const p0_idx = i;
      let angle0 = 0,
        angle1 = 0;
      switch (pattern) {
        case "CONVERGENCE": {
          const lineAngle = (i / (n - 1)) * Math.PI;
          const dirX = Math.cos(lineAngle);
          const dirY = Math.sin(lineAngle);
          const dx = Px - cx;
          const dy = Py - cy;
          const a = 1;
          const b = 2 * (dx * dirX + dy * dirY);
          const c = dx * dx + dy * dy - r * r;
          const disc = b * b - 4 * a * c;
          if (disc < 0) continue;
          const sqrt_d = Math.sqrt(disc);
          const t1 = (-b + sqrt_d) / 2;
          const t2 = (-b - sqrt_d) / 2;
          const x1 = Px + t1 * dirX,
            y1 = Py + t1 * dirY;
          const x2 = Px + t2 * dirX,
            y2 = Py + t2 * dirY;
          angle0 = Math.atan2(y1 - cy, x1 - cx);
          angle1 = Math.atan2(y2 - cy, x2 - cx);
          break;
        }
        case "CARDIOID": {
          const p1 = (i * cardioidMultiplier) % n;
          angle0 = (2 * Math.PI * p0_idx) / n;
          angle1 = (2 * Math.PI * p1) / n;
          break;
        }
        case "ENVELOPE": {
          const p1 = (i + envelopeSkipPoints) % n;
          angle0 = (2 * Math.PI * p0_idx) / n;
          angle1 = (2 * Math.PI * p1) / n;
          break;
        }
        case "CARDIOID_2": {
          const p1 = (i * cardioid2Multiplier) % n;
          angle0 = (2 * Math.PI * p0_idx) / n;
          angle1 = (2 * Math.PI * p1) / n;
          break;
        }
        case "DIAMETERS": {
          angle0 = (2 * Math.PI * p0_idx) / n;
          angle1 = angle0 + Math.PI;
          break;
        }
        case "SPIRAL": {
          const off = (i * spiralTurns) / n;
          angle0 = (2 * Math.PI * p0_idx) / n;
          angle1 = 2 * Math.PI * (p0_idx / n + off);
          break;
        }
        case "WAVES": {
          const phase = (2 * Math.PI * i) / n;
          const off = 0.3 * Math.sin(4 * phase);
          angle0 = (2 * Math.PI * p0_idx) / n;
          angle1 = 2 * Math.PI * (p0_idx / n + 0.5 + off);
          break;
        }
        case "DNA": {
          const ax = i / (n - 1);
          const hp = 2 * Math.PI * dnaTurns * ax;
          const ao = Math.sin(hp) * (Math.PI / 5);
          angle0 = ao;
          angle1 = Math.PI - ao;
          break;
        }
        case "DNA_HELIX": {
          const helixTurns = 3;
          const progress = i / (n - 1);
          const doubleHelixPhase = progress * helixTurns * 2 * Math.PI;
          const helixRadius = 0.3;

          const strand1_x = helixRadius * Math.cos(doubleHelixPhase);
          const strand2_x = helixRadius * Math.cos(doubleHelixPhase + Math.PI);

          const baseCircumferentialAngle = progress * 2 * Math.PI;
          angle0 = baseCircumferentialAngle + strand1_x;
          angle1 = baseCircumferentialAngle + strand2_x;
          break;
        }
        case "DESTINY": {
          const base = (2 * Math.PI * p0_idx) / n;
          const wave = Math.sin(i * 0.5) * 0.18;
          angle0 = base + wave;
          angle1 = base + Math.PI + wave;
          break;
        }
        case "MAURER_ROSE": {
          const p1 = (maurerMultiplier * i) % n;
          angle0 = (2 * Math.PI * p0_idx) / n;
          angle1 = (2 * Math.PI * p1) / n;
          break;
        }
        case "TORUS_KNOT": {
          const knotQ = 2;
          const theta = (2 * Math.PI * i) / n;
          const depthOffset = 0.35 * Math.sin(knotQ * theta);
          angle0 = theta + depthOffset;
          angle1 = theta + Math.PI - depthOffset;
          break;
        }
        case "TUNNEL": {
          const thetaTun = (2 * Math.PI * i) / n;
          const offset = 0.6 * Math.sin(4 * thetaTun);
          angle0 = thetaTun;
          angle1 = thetaTun + Math.PI + offset;
          break;
        }
      }
      chords.push({ angle0, angle1 });
    }
    for (const c of chords) {
      const x0 = cx + r * Math.cos(c.angle0);
      const y0 = cy + r * Math.sin(c.angle0);
      const x1 = cx + r * Math.cos(c.angle1);
      const y1 = cy + r * Math.sin(c.angle1);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      const gap = 4;
      const drawRect = (x: number, y: number, a: number) => {
        ctx.save();
        ctx.translate(x + Math.cos(a) * gap, y + Math.sin(a) * gap);
        ctx.rotate(a);
        ctx.fillStyle = dotColor;
        ctx.fillRect(
          -dotRectWidth / 2,
          -dotRectHeight / 2,
          dotRectWidth,
          dotRectHeight
        );
        ctx.restore();
      };
      drawRect(x0, y0, c.angle0);
      drawRect(x1, y1, c.angle1);
    }
    ctx.save();
    ctx.fillStyle = textColor;
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(
      pattern.replace("_", " "),
      (D + 2 * padding) / 2,
      D + padding + 5
    );
    ctx.restore();
  }, [
    pattern,
    n,
    r,
    lineWidth,
    lineColor,
    dotRadius,
    dotColor,
    cardioidMultiplier,
    envelopeSkipPoints,
    cardioid2Multiplier,
    spiralTurns,
    dnaTurns,
    dotRectWidth,
    dotRectHeight,
    backgroundColor,
    textColor,
    maurerMultiplier,
  ]);
  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        border: "1px solid #ddd",
        borderRadius: "4px",
        margin: "2px",
      }}
    />
  );
};

const PatternPreviews: React.FC<PreviewProps> = (props) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      marginBottom: "20px",
      gap: "4px",
    }}
  >
    {allPatterns.map((pattern) => (
      <StaticCirclePreview key={pattern} pattern={pattern} {...props} />
    ))}
  </div>
);

export default PatternPreviews;
