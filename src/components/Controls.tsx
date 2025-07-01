import React, { useEffect, useState } from "react";

interface ControlsProps {
  n: number;
  lineWidth: number;
  speed: number;
  idleDuration: number;
  patternDisplayDuration: number;
  randomizeIdleSpin: boolean;
  reverseSpin: boolean;
  padding: number;
  color: string;
  backgroundColor: string;
  onNChange: (n: number) => void;
  onLineWidthChange: (w: number) => void;
  onSpeedChange: (s: number) => void;
  onIdleDurationChange: (d: number) => void;
  onPatternDisplayDurationChange: (d: number) => void;
  onRandomizeIdleSpinChange: (b: boolean) => void;
  onReverseSpinChange: (b: boolean) => void;
  onPaddingChange: (g: number) => void;
  onColorChange: (color: string) => void;
  onBackgroundColorChange: (color: string) => void;
}

const Controls: React.FC<ControlsProps> = ({
  n,
  lineWidth,
  speed,
  idleDuration,
  patternDisplayDuration,
  randomizeIdleSpin,
  reverseSpin,
  padding,
  color,
  backgroundColor,
  onNChange,
  onLineWidthChange,
  onSpeedChange,
  onIdleDurationChange,
  onPatternDisplayDurationChange,
  onRandomizeIdleSpinChange,
  onReverseSpinChange,
  onPaddingChange,
  onColorChange,
  onBackgroundColorChange,
}) => {
  const LARGE_SCREEN_BREAKPOINT = 775;
  const [isLargeScreen, setIsLargeScreen] = useState(
    typeof window !== "undefined"
      ? window.innerWidth >= LARGE_SCREEN_BREAKPOINT
      : false
  );
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= LARGE_SCREEN_BREAKPOINT);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isLargeScreen) {
    // Desktop: Original layout
    const isDark = (() => {
      const hex = backgroundColor.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return 0.299 * r + 0.587 * g + 0.114 * b < 140;
    })();
    const fgColor = isDark ? "#ffffff" : "#000000";

    const labelStyle: React.CSSProperties = {
      color: fgColor,
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontWeight: 500,
      fontSize: 15,
    };
    const inputStyle: React.CSSProperties = {
      background: isDark ? "#23242b" : "#e5e5e5",
      color: fgColor,
      border: "1px solid #444",
      borderRadius: 6,
      padding: "4px 10px",
      fontSize: 15,
      marginRight: 18,
      width: 80,
    };
    const containerStyle: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      background: backgroundColor,
      padding: "12px 12px",
      borderRadius: 20,
      marginBottom: 18,
      border: "1px solid #333",
    };
    const moreOptionsStyle: React.CSSProperties = {
      background: isDark ? "#23242b" : "#d0d0d0",
      borderRadius: 8,
      padding: 12,
      color: fgColor,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      minWidth: 260,
    };

    return (
      <div style={containerStyle} className="controls-container">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: 12,
          }}
        >
          <label style={labelStyle}>
            # Chords
            <input
              type="number"
              max={1000}
              value={n === 0 ? "" : n}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") onNChange(0);
                else onNChange(Math.max(0, Math.min(1000, Number(val))));
              }}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Chord Size (px)
            <input
              type="number"
              max={20}
              value={lineWidth === 0 ? "" : lineWidth}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") onLineWidthChange(0);
                else onLineWidthChange(Math.max(0, Number(val)));
              }}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Speed Multiplier
            <input
              type="number"
              step={0.01}
              value={speed === 0 ? "" : speed}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") onSpeedChange(0);
                else onSpeedChange(Math.max(0, Number(val)));
              }}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Color
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="color"
                value={color}
                onChange={(e) => onColorChange(e.target.value)}
                style={{
                  width: 40,
                  height: 30,
                  border: "1px solid #444",
                  borderRadius: 4,
                  background: "transparent",
                  cursor: "pointer",
                }}
              />
              <input
                type="text"
                value={color}
                onChange={(e) => onColorChange(e.target.value)}
                placeholder="#ffffff"
                style={{
                  ...inputStyle,
                  width: 100,
                  marginRight: 0,
                }}
              />
            </div>
          </label>
          <label style={labelStyle}>
            Background
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => onBackgroundColorChange(e.target.value)}
                style={{
                  width: 40,
                  height: 30,
                  border: "1px solid #444",
                  borderRadius: 4,
                  background: "transparent",
                  cursor: "pointer",
                }}
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => onBackgroundColorChange(e.target.value)}
                placeholder="#181a20"
                style={{
                  ...inputStyle,
                  width: 100,
                  marginRight: 0,
                }}
              />
            </div>
          </label>
        </div>
        <div style={moreOptionsStyle}>
          <label style={labelStyle}>
            Idle Duration (ms)
            <input
              type="number"
              value={idleDuration === 0 ? "" : idleDuration}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") onIdleDurationChange(0);
                else onIdleDurationChange(Math.max(0, Number(val)));
              }}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Pattern Duration (ms)
            <input
              type="number"
              value={patternDisplayDuration === 0 ? "" : patternDisplayDuration}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") onPatternDisplayDurationChange(0);
                else onPatternDisplayDurationChange(Math.max(0, Number(val)));
              }}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Chaotic Idle
            <input
              type="checkbox"
              checked={randomizeIdleSpin}
              onChange={(e) => onRandomizeIdleSpinChange(e.target.checked)}
              style={{ marginLeft: 8 }}
            />
          </label>
          <label style={labelStyle}>
            Padding
            <input
              type="number"
              value={padding === 0 ? "" : padding}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") onPaddingChange(0);
                else onPaddingChange(Math.max(0, Number(val)));
              }}
              style={inputStyle}
            />
          </label>
        </div>
      </div>
    );
  } else {
    // Mobile: Compact layout with collapsible additional options
    const isDarkMobile = (() => {
      const hex = backgroundColor.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return 0.299 * r + 0.587 * g + 0.114 * b < 140;
    })();
    const fgColorMobile = isDarkMobile ? "#ffffff" : "#000000";
    const labelStyle: React.CSSProperties = {
      color: fgColorMobile,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 6,
      fontWeight: 500,
      fontSize: 14,
      width: "100%",
      minHeight: "36px",
      padding: "2px 0",
    };
    const inputStyle: React.CSSProperties = {
      background: isDarkMobile ? "#23242b" : "#e5e5e5",
      color: fgColorMobile,
      border: "1px solid #444",
      borderRadius: 6,
      padding: "6px 8px",
      fontSize: 14,
      width: 120,
    };
    const containerStyle: React.CSSProperties = {
      background: backgroundColor,
      padding: 12,
      borderRadius: 16,
      border: "1px solid #333",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      width: "100%",
      maxWidth: 320,
    };
    const moreOptionsStyle: React.CSSProperties = {
      background: isDarkMobile ? "#23242b" : "#d0d0d0",
      borderRadius: 6,
      padding: 8,
      color: fgColorMobile,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      width: "100%",
      maxWidth: "100%",
      boxSizing: "border-box",
    };
    const toggleStyle: React.CSSProperties = {
      color: "#aaa",
      cursor: "pointer",
      fontSize: 14,
      userSelect: "none",
      border: "none",
      background: "none",
      padding: "8px 0",
      fontWeight: 500,
      textAlign: "center",
      width: "100%",
    };

    return (
      <div style={containerStyle} className="controls-container">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: 8,
            width: "100%",
            maxWidth: "280px",
            boxSizing: "border-box",
          }}
        >
          <label style={labelStyle}>
            # Chords
            <input
              type="number"
              max={1000}
              value={n === 0 ? "" : n}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") onNChange(0);
                else onNChange(Math.max(0, Math.min(1000, Number(val))));
              }}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Cord Size (px)
            <input
              type="number"
              max={20}
              value={lineWidth === 0 ? "" : lineWidth}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") onLineWidthChange(0);
                else onLineWidthChange(Math.max(0, Number(val)));
              }}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Speed Multiplier
            <input
              type="number"
              step={0.01}
              value={speed === 0 ? "" : speed}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") onSpeedChange(0);
                else onSpeedChange(Math.max(0, Number(val)));
              }}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Color
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="color"
                value={color}
                onChange={(e) => onColorChange(e.target.value)}
                style={{
                  width: 32,
                  height: 28,
                  border: "1px solid #444",
                  borderRadius: 4,
                  background: "transparent",
                  cursor: "pointer",
                }}
              />
              <input
                type="text"
                value={color}
                onChange={(e) => onColorChange(e.target.value)}
                placeholder="#ffffff"
                style={{
                  ...inputStyle,
                  width: "90px",
                  marginLeft: 0,
                }}
              />
            </div>
          </label>
          <label style={labelStyle}>
            Bg Color
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => onBackgroundColorChange(e.target.value)}
                style={{
                  width: 32,
                  height: 26,
                  border: "1px solid #444",
                  borderRadius: 4,
                  background: "transparent",
                }}
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => onBackgroundColorChange(e.target.value)}
                style={{ ...inputStyle, width: 90 }}
              />
            </div>
          </label>
        </div>

        <button style={toggleStyle} onClick={() => setShowMore(!showMore)}>
          {showMore ? "▲ Hide More Options" : "▼ More Options"}
        </button>

        {showMore && (
          <div style={moreOptionsStyle}>
            <label style={labelStyle}>
              Idle Duration (ms)
              <input
                type="number"
                value={idleDuration === 0 ? "" : idleDuration}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") onIdleDurationChange(0);
                  else onIdleDurationChange(Math.max(0, Number(val)));
                }}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              Pattern Duration (ms)
              <input
                type="number"
                value={
                  patternDisplayDuration === 0 ? "" : patternDisplayDuration
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") onPatternDisplayDurationChange(0);
                  else onPatternDisplayDurationChange(Math.max(0, Number(val)));
                }}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              Chaotic Idle
              <input
                type="checkbox"
                checked={randomizeIdleSpin}
                onChange={(e) => onRandomizeIdleSpinChange(e.target.checked)}
                style={{ marginLeft: 8 }}
              />
            </label>
            <label style={labelStyle}>
              Padding
              <input
                type="number"
                value={padding === 0 ? "" : padding}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") onPaddingChange(0);
                  else onPaddingChange(Math.max(0, Number(val)));
                }}
                style={inputStyle}
              />
            </label>
          </div>
        )}
      </div>
    );
  }
};

export default Controls;
