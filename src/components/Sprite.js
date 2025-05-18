import React from "react";

export default function Sprite({
  x,
  y,
  src,
  alt = "",
  selected,
  color,
  say,
  angle,
  flash,
  highlight,
  onClick,
  visible = true,
  size = 100,
}) {
  // Only render if visible is true
  if (!visible) return null;

  return (
    <div
      className="sprite"
      onClick={onClick}
      tabIndex={0}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        background: color,
        border: selected ? "2.5px solid #22f" : "2px solid transparent",
        borderRadius: 14,
        zIndex: 2,
        boxShadow: [
          highlight ? "0 0 0 8px gold, 0 0 30px 10px #ffe06666" : "",
          selected ? "0 0 16px 5px #6cf, 0 0 8px 2px #22f" : "",
          flash ? "0 0 32px 16px #ff2b2b, 0 0 8px 4px #fff" : ""
        ]
          .filter(Boolean)
          .join(", "),
        userSelect: "none",
        cursor: "pointer",
        transition: "box-shadow 0.23s, border-color 0.22s, background 0.25s, width 0.2s, height 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{
          width: "90%",
          height: "90%",
          filter: `drop-shadow(0 2px 10px #${color ? color.replace("#", "") : "6cf"}88)`,
          pointerEvents: "none",
          transform: `rotate(${angle || 0}deg)`,
          transition: "transform 0.21s",
        }}
      />
      {say && (
        <div
          style={{
            position: "absolute",
            top: -32,
            left: 18,
            background: "#fff",
            border: "1px solid #bbb",
            borderRadius: 7,
            padding: "2px 8px",
            fontSize: 15,
            color: "#333",
            boxShadow: "0 2px 8px #0002",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          {say}
        </div>
      )}
    </div>
  );
}