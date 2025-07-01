import React, { useEffect, useRef, useState } from "react";
import Controls from "./Controls";

type Pattern =
  | "PARALLEL"
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

interface Props {
  /** Number of horizontal chords */
  n?: number;
  /** Circle radius (px) */
  r?: number;
  /** Line thickness (px) */
  lineWidth?: number;
  /** Line color */
  lineColor?: string;
  /** Dot radius (px) */
  dotRadius?: number;
  /** Dot fill color */
  dotColor?: string;
  /** Random spin speed range [min, max] (degrees/sec) */
  idleSpinSpeedRange?: [number, number];
  /** Speed of the coordinated spin phase (degrees/sec) */
  spinSpeed?: number;
  /** Duration of the initial idle phase (ms) */
  initialIdleDuration?: number;
  /** Duration of transition between idle and a pattern (ms) */
  patternTransitionDuration?: number;
  /** Duration of the coordinated spin phase (ms) */
  spinDuration?: number;
  /** Duration of idle phase between patterns (ms) */
  idleDuration?: number;
  /** Multiplier for cardioid pattern (connect point i to k*i) */
  cardioidMultiplier?: number;
  /** Number of points to skip for the envelope pattern */
  envelopeSkipPoints?: number;
  /** Multiplier for the second cardioid pattern */
  cardioid2Multiplier?: number;
  /** Spiral turns */
  spiralTurns?: number;
  /** DNA helix turns */
  dnaTurns?: number;
  /** Multiplier for Maurer Rose pattern */
  maurerMultiplier?: number;
  /** Rectangle width for dot (px) */
  dotRectWidth?: number;
  /** Rectangle height for dot (px) */
  dotRectHeight?: number;
  /** Padding for dot rectangles */
  padding?: number;
}

const CircleRandomConverging: React.FC<Props> = ({
  r = 300,
  lineColor = "white",
  dotRadius = 4,
  dotColor = "white",
  idleSpinSpeedRange = [10, 90],
  spinSpeed = -20, // Negative for clockwise
  cardioidMultiplier = 2,
  envelopeSkipPoints = 15,
  cardioid2Multiplier = 3,
  spiralTurns = 3,
  dnaTurns = 10,
  maurerMultiplier = 6,
  dotRectWidth = 6,
  dotRectHeight = 2,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | undefined>(undefined);

  // Responsive radius calculation
  const [responsiveRadius, setResponsiveRadius] = useState(() => {
    if (typeof window !== "undefined") {
      const defaultRadius = 300;
      // Only scale down on mobile screens
      if (window.innerWidth < 650) {
        const screenSize = Math.min(window.innerWidth, window.innerHeight);
        return (screenSize * 0.8) / 2;
      }
      return defaultRadius;
    }
    return 300; // Default radius
  });

  useEffect(() => {
    const updateRadius = () => {
      const defaultRadius = 300;
      // Only scale down on mobile screens
      if (window.innerWidth < 650) {
        const screenSize = Math.min(window.innerWidth, window.innerHeight);
        setResponsiveRadius((screenSize * 0.8) / 2);
      } else {
        setResponsiveRadius(defaultRadius);
      }
    };

    window.addEventListener("resize", updateRadius);
    updateRadius(); // Call once on mount

    return () => window.removeEventListener("resize", updateRadius);
  }, []);

  // Use responsive radius instead of the prop
  const effectiveRadius = responsiveRadius;

  // --- Controls state ---
  const [n, setN] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth < 650) {
      return 50; // Mobile default
    }
    return 100; // Desktop default
  });
  const [lineWidth, setLineWidth] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [idleDurationMs, setIdleDurationMs] = useState(2000);
  const [patternDisplayDurationMs, setPatternDisplayDurationMs] =
    useState(2500);
  const [randomizeIdleSpin, setRandomizeIdleSpin] = useState(true);
  const [reverseSpin, setReverseSpin] = useState(false);
  const [padding, setPadding] = useState(5);
  const [color, setColor] = useState("#ffffff");
  const [backgroundColor, setBackgroundColor] = useState("#181a20");

  // Helper to decide if color is dark
  const isDarkColor = (hex: string) => {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance < 140; // threshold
  };

  const textColor = isDarkColor(backgroundColor) ? "#ffffff" : "#000000";

  // Responsive dimensions for mobile
  const isMobile = typeof window !== "undefined" && window.innerWidth < 650;
  const effectiveLineWidth = lineWidth;
  const effectiveDotRectWidth = dotRectWidth;
  const effectiveDotRectHeight = isMobile ? dotRectHeight * 0.5 : dotRectHeight;

  // patternTransitionDuration and spinDuration are both set by transitionSpeed
  const initialIdleDuration = 2000 / speed;
  const idleDuration = idleDurationMs / speed;
  const patternTransitionDuration = 2500 / speed;
  const spinDuration = patternDisplayDurationMs / speed;
  const effectiveSpinSpeed = (reverseSpin ? -1 : 1) * spinSpeed * speed;
  const effectiveEnvelopeSkipPoints = Math.floor(n / 3);

  const deltaAngle = (from: number, to: number) => {
    let d = to - from;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return d;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canvasPadding = isMobile ? 8 : 32;
    const D = 2 * effectiveRadius;
    canvas.width = D + 2 * canvasPadding;
    canvas.height = D + 2 * canvasPadding;
    ctx.lineWidth = effectiveLineWidth;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineCap = "butt";

    // Fill background
    ctx.save();
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, D + 2 * canvasPadding, D + 2 * canvasPadding);
    ctx.restore();

    const cx = effectiveRadius + canvasPadding,
      cy = effectiveRadius + canvasPadding;
    // convergence point: 30% from right edge, 30% from top edge
    const Px = 0.7 * D,
      Py = 0.3 * D;

    type Chord = {
      startAngle0: number; // starting angle of endpoint 0
      startAngle1: number; // starting angle of endpoint 1
      parallelTarget0: number;
      parallelTarget1: number;
      convergenceTarget0: number;
      convergenceTarget1: number;
      cardioidTarget0: number;
      cardioidTarget1: number;
      envelopeTarget0: number;
      envelopeTarget1: number;
      cardioid2Target0: number;
      cardioid2Target1: number;
      diametersTarget0: number;
      diametersTarget1: number;
      spiralTarget0: number;
      spiralTarget1: number;
      wavesTarget0: number;
      wavesTarget1: number;
      dnaTarget0: number;
      dnaTarget1: number;
      dnaHelixTarget0: number;
      dnaHelixTarget1: number;
      destinyTarget0: number;
      destinyTarget1: number;
      fractalTarget0: number;
      fractalTarget1: number;
      idleSpinSpeed0: number; // rad/ms
      idleSpinSpeed1: number; // rad/ms
      maurerTarget0: number;
      maurerTarget1: number;
      torusTarget0: number;
      torusTarget1: number;
      tunnelTarget0: number;
      tunnelTarget1: number;
    };

    const chords: Chord[] = [];
    const spacing = n > 1 ? (2 * effectiveRadius) / (n - 1) : 0;

    // Pre-calculate starting and ending positions for each chord
    for (let i = 0; i < n; i++) {
      const y = -effectiveRadius + spacing * i;
      const half = Math.sqrt(effectiveRadius * effectiveRadius - y * y);
      if (!isFinite(half)) continue;

      // STARTING positions: horizontal chord
      const startAngle0 = Math.atan2(y, -half);
      const startAngle1 = Math.atan2(y, half);

      // ENDING positions: evenly spaced lines through P (for convergence)
      const lineAngle = (i / (n - 1)) * Math.PI; // 0 to π
      const dirX = Math.cos(lineAngle);
      const dirY = Math.sin(lineAngle);
      const dx = Px - cx;
      const dy = Py - cy;
      const a = 1;
      const b = 2 * (dx * dirX + dy * dirY);
      const c = dx * dx + dy * dy - effectiveRadius * effectiveRadius;
      const disc = b * b - 4 * a * c;
      if (disc < 0) continue;
      const sqrt_d = Math.sqrt(disc);
      const t1 = (-b + sqrt_d) / 2;
      const t2 = (-b - sqrt_d) / 2;
      const x1 = Px + t1 * dirX,
        y1 = Py + t1 * dirY;
      const x2 = Px + t2 * dirX,
        y2 = Py + t2 * dirY;
      const cand0 = Math.atan2(y1 - cy, x1 - cx);
      const cand1 = Math.atan2(y2 - cy, x2 - cx);
      const dist0_1 = Math.abs(deltaAngle(startAngle0, cand0));
      const dist0_2 = Math.abs(deltaAngle(startAngle0, cand1));
      const convergenceTarget0 = dist0_1 < dist0_2 ? cand0 : cand1;
      const convergenceTarget1 = dist0_1 < dist0_2 ? cand1 : cand0;

      // Parallel pattern targets (keep horizontal lines)
      const parallelTarget0 = startAngle0;
      const parallelTarget1 = startAngle1;

      // Cardioid pattern targets
      const p0_idx = i;
      const p1_idx_cardioid = (i * cardioidMultiplier) % n;
      // find best offset once (skip details here)
      const bestOffset = 0;
      const cardioidTarget0 = 2 * Math.PI * (p0_idx / n + bestOffset);
      const cardioidTarget1 = 2 * Math.PI * (p1_idx_cardioid / n + bestOffset);

      // Cardioid 2
      const p1_idx_cardioid2 = (i * cardioid2Multiplier) % n;
      const cardioid2Target0 = cardioidTarget0;
      const cardioid2Target1 =
        2 * Math.PI * (p1_idx_cardioid2 / n + bestOffset);

      // Envelope
      const p1_idx_envelope = (i + effectiveEnvelopeSkipPoints) % n;
      const envelopeTarget0 = 2 * Math.PI * (p0_idx / n);
      const envelopeTarget1 = 2 * Math.PI * (p1_idx_envelope / n);

      // Diameters
      const diametersTarget0 = 2 * Math.PI * (p0_idx / n);
      const diametersTarget1 = diametersTarget0 + Math.PI;

      // Spiral
      const spiralOffset = (i * spiralTurns) / n;
      const spiralTarget0 = 2 * Math.PI * (p0_idx / n);
      const spiralTarget1 = 2 * Math.PI * (p0_idx / n + spiralOffset);

      // Waves
      const wavePhase = (2 * Math.PI * i) / n;
      const waveOffset = 0.3 * Math.sin(4 * wavePhase);
      const wavesTarget0 = 2 * Math.PI * (p0_idx / n);
      const wavesTarget1 = 2 * Math.PI * (p0_idx / n + 0.5 + waveOffset);

      // DNA (simple twisting strands across the diameter)
      const axialPos = i / (n - 1);
      const dnaPhase = 2 * Math.PI * dnaTurns * axialPos;
      const dnaOffset = Math.sin(dnaPhase) * (Math.PI / 5); // ±36° phase swing
      const dnaTarget0 = dnaOffset; // strand A angle
      const dnaTarget1 = Math.PI - dnaOffset; // strand B angle (opposite side)

      // DNA_HELIX (double-helix wrapped around the circle)
      const helixTurns = 3; // number of helical turns around the circumference
      const baseAngleHelix = axialPos * 2 * Math.PI; // base circumferential angle (0-2π)
      const helixPhase = axialPos * helixTurns * 2 * Math.PI; // 0-helixTurns * 2π
      const helixOffset = 0.3 * Math.sin(helixPhase); // radial phase offset
      const dnaHelixTarget0 = baseAngleHelix + helixOffset; // strand 1
      const dnaHelixTarget1 = baseAngleHelix + Math.PI - helixOffset; // strand 2

      // Destiny
      const destinyBaseAngle = (2 * Math.PI * i) / n;
      const pulse = 0.18 + 0.08 * Math.sin(Date.now() / 700 + i * 0.7);
      const wave = Math.sin(i * 0.5 + Date.now() / 1200) * 0.18;
      const destinyTarget0 = destinyBaseAngle + wave;
      const destinyTarget1 = destinyBaseAngle + Math.PI + wave;

      // Fractal: i → i² mod n
      const fractalTarget0 = 2 * Math.PI * (i / n);
      const fractalTarget1 = 2 * Math.PI * (((i * i) % n) / n);

      // Maurer-Rose (times-table) pattern
      const maurerTarget0 = 2 * Math.PI * (p0_idx / n);
      const maurerTarget1 = 2 * Math.PI * (((maurerMultiplier * i) % n) / n);

      // Torus Knot (3,2) trefoil-style illusion
      const knotQ = 2;
      const theta = (2 * Math.PI * i) / n; // parameter around circle
      const depthOffset = 0.35 * Math.sin(knotQ * theta); // creates front/back illusion
      const torusTarget0 = theta + depthOffset; // first strand
      const torusTarget1 = theta + Math.PI - depthOffset; // opposite strand

      // Tunnel swirl illusion (in-out sine wave along circle)
      const thetaTun = (2 * Math.PI * i) / n;
      const offset = 0.6 * Math.sin(4 * thetaTun); // 4 ripples around
      const tunnelTarget0 = thetaTun;
      const tunnelTarget1 = thetaTun + Math.PI + offset;

      // Idle spins
      const [minIdle, maxIdle] = idleSpinSpeedRange;
      let idleSpinSpeed0, idleSpinSpeed1;
      if (randomizeIdleSpin) {
        const speed0 = minIdle + Math.random() * (maxIdle - minIdle);
        const speed1 = minIdle + Math.random() * (maxIdle - minIdle);
        const dir0 = Math.random() < 0.5 ? 1 : -1;
        const dir1 = Math.random() < 0.5 ? 1 : -1;
        idleSpinSpeed0 = ((dir0 * speed0 * Math.PI) / 180 / 1000) * speed;
        idleSpinSpeed1 = ((dir1 * speed1 * Math.PI) / 180 / 1000) * speed;
      } else {
        const fixed = ((30 * (Math.PI / 180)) / 1000) * speed;
        const spinSign = Math.sign(effectiveSpinSpeed) || 1;
        idleSpinSpeed0 = spinSign * fixed;
        idleSpinSpeed1 = spinSign * fixed;
      }

      chords.push({
        startAngle0,
        startAngle1,
        parallelTarget0,
        parallelTarget1,
        convergenceTarget0,
        convergenceTarget1,
        cardioidTarget0,
        cardioidTarget1,
        envelopeTarget0,
        envelopeTarget1,
        cardioid2Target0,
        cardioid2Target1,
        diametersTarget0,
        diametersTarget1,
        spiralTarget0,
        spiralTarget1,
        wavesTarget0,
        wavesTarget1,
        dnaTarget0,
        dnaTarget1,
        dnaHelixTarget0,
        dnaHelixTarget1,
        destinyTarget0,
        destinyTarget1,
        fractalTarget0,
        fractalTarget1,
        idleSpinSpeed0,
        idleSpinSpeed1,
        maurerTarget0,
        maurerTarget1,
        torusTarget0,
        torusTarget1,
        tunnelTarget0,
        tunnelTarget1,
      });
    }

    let startTime: number | null = null;
    let phase:
      | "INITIAL_IDLE"
      | "TRANSITION_TO_PATTERN"
      | "SPIN"
      | "TRANSITION_TO_IDLE"
      | "IDLE" = "SPIN";
    let phaseStartTime = 0;
    let currentPattern: Pattern = "PARALLEL";

    const phaseStartAngles = chords.map((c) => ({
      angle0: c.startAngle0,
      angle1: c.startAngle1,
    }));

    const quinticHermite = (
      p: number,
      p0: number,
      p1: number,
      v0: number,
      v1: number
    ) => {
      const p2 = p * p,
        p3 = p2 * p,
        p4 = p3 * p,
        p5 = p4 * p;
      const h00 = 1 - 10 * p3 + 15 * p4 - 6 * p5;
      const h10 = p - 6 * p3 + 8 * p4 - 3 * p5;
      const h01 = 10 * p3 - 15 * p4 + 6 * p5;
      const h11 = -4 * p3 + 7 * p4 - 3 * p5;
      return h00 * p0 + h10 * v0 + h01 * p1 + h11 * v1;
    };

    function draw(timestamp: number) {
      if (!ctx) return;
      if (startTime === null) {
        startTime = timestamp;
        phaseStartTime = timestamp;
      }

      const spinSpeedRad = (effectiveSpinSpeed * Math.PI) / 180 / 1000;

      let phaseChanged = true;
      while (phaseChanged) {
        phaseChanged = false;
        const elapsedInPhase = timestamp - phaseStartTime;
        let dur = 0;

        switch (phase) {
          case "INITIAL_IDLE":
            dur = initialIdleDuration;
            if (elapsedInPhase >= dur) {
              chords.forEach((c, i) => {
                phaseStartAngles[i] = {
                  angle0: phaseStartAngles[i].angle0 + c.idleSpinSpeed0 * dur,
                  angle1: phaseStartAngles[i].angle1 + c.idleSpinSpeed1 * dur,
                };
              });
              phase = "TRANSITION_TO_PATTERN";
              phaseStartTime += dur;
              phaseChanged = true;
            }
            break;

          case "TRANSITION_TO_PATTERN":
            dur = patternTransitionDuration;
            if (elapsedInPhase >= dur) {
              chords.forEach((c, i) => {
                const start0 = phaseStartAngles[i].angle0;
                const start1 = phaseStartAngles[i].angle1;
                let target0 = 0,
                  target1 = 0;
                switch (currentPattern) {
                  case "PARALLEL":
                    target0 = c.parallelTarget0;
                    target1 = c.parallelTarget1;
                    break;
                  case "CONVERGENCE":
                    target0 = c.convergenceTarget0;
                    target1 = c.convergenceTarget1;
                    break;
                  case "CARDIOID":
                    target0 = c.cardioidTarget0;
                    target1 = c.cardioidTarget1;
                    break;
                  case "ENVELOPE":
                    target0 = c.envelopeTarget0;
                    target1 = c.envelopeTarget1;
                    break;
                  case "CARDIOID_2":
                    target0 = c.cardioid2Target0;
                    target1 = c.cardioid2Target1;
                    break;
                  case "DIAMETERS":
                    target0 = c.diametersTarget0;
                    target1 = c.diametersTarget1;
                    break;
                  case "SPIRAL":
                    target0 = c.spiralTarget0;
                    target1 = c.spiralTarget1;
                    break;
                  case "WAVES":
                    target0 = c.wavesTarget0;
                    target1 = c.wavesTarget1;
                    break;
                  case "DNA":
                    target0 = c.dnaTarget0;
                    target1 = c.dnaTarget1;
                    break;
                  case "DNA_HELIX":
                    target0 = c.dnaHelixTarget0;
                    target1 = c.dnaHelixTarget1;
                    break;
                  case "DESTINY":
                    target0 = c.destinyTarget0;
                    target1 = c.destinyTarget1;
                    break;
                  case "MAURER_ROSE":
                    target0 = c.maurerTarget0;
                    target1 = c.maurerTarget1;
                    break;
                  case "TORUS_KNOT":
                    target0 = c.torusTarget0;
                    target1 = c.torusTarget1;
                    break;
                  case "TUNNEL":
                    target0 = c.tunnelTarget0;
                    target1 = c.tunnelTarget1;
                    break;
                }
                phaseStartAngles[i] = {
                  angle0: start0 + deltaAngle(start0, target0),
                  angle1: start1 + deltaAngle(start1, target1),
                };
              });
              phase = "SPIN";
              phaseStartTime += dur;
              phaseChanged = true;
            }
            break;

          case "SPIN":
            dur = spinDuration;
            if (elapsedInPhase >= dur) {
              chords.forEach((c, i) => {
                phaseStartAngles[i] = {
                  angle0: phaseStartAngles[i].angle0 + spinSpeedRad * dur,
                  angle1: phaseStartAngles[i].angle1 + spinSpeedRad * dur,
                };
              });
              phase = "TRANSITION_TO_IDLE";
              phaseStartTime += dur;
              phaseChanged = true;
            }
            break;

          case "TRANSITION_TO_IDLE":
            dur = patternTransitionDuration;
            if (elapsedInPhase >= dur) {
              chords.forEach((c, i) => {
                const start0 = phaseStartAngles[i].angle0;
                const start1 = phaseStartAngles[i].angle1;
                const v0 = spinSpeedRad * dur;
                const v1 = c.idleSpinSpeed0 * dur;
                const v2 = spinSpeedRad * dur;
                const v3 = c.idleSpinSpeed1 * dur;
                const target0 = start0 + (v0 + v1) / 2;
                const target1 = start1 + (v2 + v3) / 2;
                phaseStartAngles[i] = {
                  angle0: quinticHermite(1, start0, target0, v0, v1),
                  angle1: quinticHermite(1, start1, target1, v2, v3),
                };
              });
              phase = "IDLE";
              phaseStartTime += dur;
              phaseChanged = true;
            }
            break;

          case "IDLE":
            dur = idleDuration;
            if (elapsedInPhase >= dur) {
              chords.forEach((c, i) => {
                phaseStartAngles[i] = {
                  angle0: phaseStartAngles[i].angle0 + c.idleSpinSpeed0 * dur,
                  angle1: phaseStartAngles[i].angle1 + c.idleSpinSpeed1 * dur,
                };
              });
              switch (currentPattern) {
                case "PARALLEL":
                  currentPattern = "CONVERGENCE";
                  break;
                case "CONVERGENCE":
                  currentPattern = "CARDIOID";
                  break;
                case "CARDIOID":
                  currentPattern = "ENVELOPE";
                  break;
                case "ENVELOPE":
                  currentPattern = "CARDIOID_2";
                  break;
                case "CARDIOID_2":
                  currentPattern = "DIAMETERS";
                  break;
                case "DIAMETERS":
                  currentPattern = "SPIRAL";
                  break;
                case "SPIRAL":
                  currentPattern = "WAVES";
                  break;
                case "WAVES":
                  currentPattern = "DNA";
                  break;
                case "DNA":
                  currentPattern = "DNA_HELIX";
                  break;
                case "DNA_HELIX":
                  currentPattern = "DESTINY";
                  break;
                case "DESTINY":
                  currentPattern = "MAURER_ROSE";
                  break;
                case "MAURER_ROSE":
                  currentPattern = "TORUS_KNOT";
                  break;
                case "TORUS_KNOT":
                  currentPattern = "TUNNEL";
                  break;
                case "TUNNEL":
                  currentPattern = "PARALLEL";
                  break;
              }
              phase = "TRANSITION_TO_PATTERN";
              phaseStartTime += dur;
              phaseChanged = true;
            }
            break;
        }
      }

      // DRAW
      const elapsed = timestamp - phaseStartTime;
      let totalDur = 0;
      switch (phase) {
        case "INITIAL_IDLE":
          totalDur = initialIdleDuration;
          break;
        case "TRANSITION_TO_PATTERN":
          totalDur = patternTransitionDuration;
          break;
        case "SPIN":
          totalDur = spinDuration;
          break;
        case "TRANSITION_TO_IDLE":
          totalDur = patternTransitionDuration;
          break;
        case "IDLE":
          totalDur = idleDuration;
          break;
      }

      ctx.clearRect(0, 0, D + 2 * canvasPadding, D + 2 * canvasPadding);
      ctx.save();
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, D + 2 * canvasPadding, D + 2 * canvasPadding);
      ctx.restore();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      for (let i = 0; i < chords.length; i++) {
        const c = chords[i];
        let a0 = 0,
          a1 = 0;
        const p = Math.min(1, elapsed / totalDur);

        switch (phase) {
          case "INITIAL_IDLE":
          case "IDLE":
            a0 = phaseStartAngles[i].angle0 + c.idleSpinSpeed0 * elapsed;
            a1 = phaseStartAngles[i].angle1 + c.idleSpinSpeed1 * elapsed;
            break;

          case "TRANSITION_TO_PATTERN":
            const s0 = phaseStartAngles[i].angle0;
            const s1 = phaseStartAngles[i].angle1;
            let t0 = 0,
              t1 = 0;
            switch (currentPattern) {
              case "PARALLEL":
                t0 = c.parallelTarget0;
                t1 = c.parallelTarget1;
                break;
              case "CONVERGENCE":
                t0 = c.convergenceTarget0;
                t1 = c.convergenceTarget1;
                break;
              case "CARDIOID":
                t0 = c.cardioidTarget0;
                t1 = c.cardioidTarget1;
                break;
              case "ENVELOPE":
                t0 = c.envelopeTarget0;
                t1 = c.envelopeTarget1;
                break;
              case "CARDIOID_2":
                t0 = c.cardioid2Target0;
                t1 = c.cardioid2Target1;
                break;
              case "DIAMETERS":
                t0 = c.diametersTarget0;
                t1 = c.diametersTarget1;
                break;
              case "SPIRAL":
                t0 = c.spiralTarget0;
                t1 = c.spiralTarget1;
                break;
              case "WAVES":
                t0 = c.wavesTarget0;
                t1 = c.wavesTarget1;
                break;
              case "DNA":
                t0 = c.dnaTarget0;
                t1 = c.dnaTarget1;
                break;
              case "DNA_HELIX":
                t0 = c.dnaHelixTarget0;
                t1 = c.dnaHelixTarget1;
                break;
              case "DESTINY":
                t0 = c.destinyTarget0;
                t1 = c.destinyTarget1;
                break;
              case "MAURER_ROSE":
                t0 = c.maurerTarget0;
                t1 = c.maurerTarget1;
                break;
              case "TORUS_KNOT":
                t0 = c.torusTarget0;
                t1 = c.torusTarget1;
                break;
              case "TUNNEL":
                t0 = c.tunnelTarget0;
                t1 = c.tunnelTarget1;
                break;
            }
            const vStart0 = c.idleSpinSpeed0 * totalDur;
            const vStart1 = c.idleSpinSpeed1 * totalDur;
            const vEnd = spinSpeedRad * totalDur;
            a0 = quinticHermite(p, s0, s0 + deltaAngle(s0, t0), vStart0, vEnd);
            a1 = quinticHermite(p, s1, s1 + deltaAngle(s1, t1), vStart1, vEnd);
            break;

          case "SPIN":
            a0 = phaseStartAngles[i].angle0 + spinSpeedRad * elapsed;
            a1 = phaseStartAngles[i].angle1 + spinSpeedRad * elapsed;
            break;

          case "TRANSITION_TO_IDLE":
            const ss0 = phaseStartAngles[i].angle0;
            const ss1 = phaseStartAngles[i].angle1;
            const vv0 = spinSpeedRad * totalDur;
            const vv1 = c.idleSpinSpeed0 * totalDur;
            const vv2 = spinSpeedRad * totalDur;
            const vv3 = c.idleSpinSpeed1 * totalDur;
            const tt0 = ss0 + (vv0 + vv1) / 2;
            const tt1 = ss1 + (vv2 + vv3) / 2;
            a0 = quinticHermite(p, ss0, tt0, vv0, vv1);
            a1 = quinticHermite(p, ss1, tt1, vv2, vv3);
            break;
        }

        // Draw lines ending before the rectangles (like CSS padding)
        const lineEndRadius =
          effectiveRadius - padding - effectiveDotRectWidth / 2;
        const rx0 = cx + Math.cos(a0) * effectiveRadius;
        const ry0 = cy + Math.sin(a0) * effectiveRadius;
        const rx1 = cx + Math.cos(a1) * effectiveRadius;
        const ry1 = cy + Math.sin(a1) * effectiveRadius;
        const sx0 = cx + Math.cos(a0) * lineEndRadius;
        const sy0 = cy + Math.sin(a0) * lineEndRadius;
        const sx1 = cx + Math.cos(a1) * lineEndRadius;
        const sy1 = cy + Math.sin(a1) * lineEndRadius;
        ctx.beginPath();
        ctx.moveTo(sx0, sy0);
        ctx.lineTo(sx1, sy1);
        ctx.stroke();
        const drawRect = (x: number, y: number, angle: number) => {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.fillStyle = color;
          ctx.fillRect(
            -effectiveDotRectWidth / 2,
            -effectiveDotRectHeight / 2,
            effectiveDotRectWidth,
            effectiveDotRectHeight
          );
          ctx.restore();
        };
        drawRect(rx0, ry0, a0);
        drawRect(rx1, ry1, a1);
      }

      raf.current = requestAnimationFrame(draw);
    }

    raf.current = requestAnimationFrame(draw);

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [
    n,
    effectiveRadius,
    effectiveLineWidth,
    color,
    dotRadius,
    dotColor,
    idleSpinSpeedRange,
    effectiveSpinSpeed,
    patternTransitionDuration,
    spinDuration,
    idleDuration,
    cardioidMultiplier,
    envelopeSkipPoints,
    cardioid2Multiplier,
    spiralTurns,
    dnaTurns,
    maurerMultiplier,
    effectiveDotRectWidth,
    effectiveDotRectHeight,
    randomizeIdleSpin,
    reverseSpin,
    padding,
    backgroundColor,
  ]);

  // Set page background
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.background = backgroundColor;
    }
  }, [backgroundColor]);

  const allPatterns: Pattern[] = [
    "CONVERGENCE",
    "CARDIOID",
    "ENVELOPE",
    "CARDIOID_2",
    "DIAMETERS",
    "SPIRAL",
    "WAVES",
    "DNA",
    "DESTINY",
    "MAURER_ROSE",
    "TORUS_KNOT",
    "TUNNEL",
  ];

  const isDesktopLayout =
    typeof window !== "undefined" ? window.innerWidth >= 1220 : false;

  return (
    <div className="circle-layout">
      <Controls
        backgroundColor={backgroundColor}
        onBackgroundColorChange={(c) => setBackgroundColor(c)}
        n={n}
        lineWidth={lineWidth}
        speed={speed}
        idleDuration={idleDurationMs}
        patternDisplayDuration={patternDisplayDurationMs}
        randomizeIdleSpin={randomizeIdleSpin}
        reverseSpin={reverseSpin}
        padding={padding}
        color={color}
        onNChange={setN}
        onLineWidthChange={setLineWidth}
        onSpeedChange={setSpeed}
        onIdleDurationChange={setIdleDurationMs}
        onPatternDisplayDurationChange={setPatternDisplayDurationMs}
        onRandomizeIdleSpinChange={setRandomizeIdleSpin}
        onReverseSpinChange={setReverseSpin}
        onPaddingChange={setPadding}
        onColorChange={setColor}
      />
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
};

export default CircleRandomConverging;
