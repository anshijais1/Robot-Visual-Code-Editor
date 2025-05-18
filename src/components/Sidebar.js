import React from "react";
import { BLOCK_CATEGORIES } from "../data/BlockCategories";

// Custom extra blocks
const MOTION_EXTRA_BLOCKS = [
  { type: "move_up", label: "Move Up", steps: 10 },
  { type: "move_down", label: "Move Down", steps: 10 },
  { type: "move_left", label: "Move Left", steps: 10 },
  { type: "move_right", label: "Move Right", steps: 10 },
];
const COLOR_EXTRA_BLOCKS = [
  { type: "set_color", label: "Set Color (Blue)", colorIndex: 0 },
  { type: "set_color", label: "Set Color (Yellow)", colorIndex: 1 },
  { type: "set_color", label: "Set Color (Red)", colorIndex: 2 },
  { type: "set_color", label: "Set Color (Green)", colorIndex: 3 },
  { type: "set_color", label: "Set Color (Purple)", colorIndex: 4 },
  { type: "next_color", label: "Next Color" },
  { type: "prev_color", label: "Previous Color" },
];

export default function BlockPaletteSidebar({ onBlockAdd }) {
  function handleBlockClick(block) {
    // Deep copy for safe nesting
    onBlockAdd && onBlockAdd(JSON.parse(JSON.stringify(block)));
  }

  const customCategories = [
    {
      name: "Motion+",
      color: "#16a2b8",
      blocks: MOTION_EXTRA_BLOCKS,
    },
    {
      name: "Color",
      color: "#ab47bc",
      blocks: COLOR_EXTRA_BLOCKS,
    },
    ...BLOCK_CATEGORIES
  ];

  return (
    <div className="block-palette-sidebar">
      {customCategories.map((cat) => (
        <div key={cat.name} className="block-category">
          <div className="block-category-header" style={{ background: cat.color, color: "#fff" }}>
            {cat.name}
          </div>
          <div className="block-category-body">
            {cat.blocks.map((block, idx) => (
              <div
                key={idx}
                className="block-palette-block"
                onClick={() => handleBlockClick(block)}
                style={{
                  background: "#fff",
                  borderLeft: `7px solid ${cat.color}`,
                  borderRadius: 6,
                  margin: "6px 0",
                  padding: "7px 12px",
                  boxShadow: "0 1px 4px #0001",
                  fontSize: ".97em",
                  cursor: "pointer",
                  userSelect: "none"
                }}
                title={block.label}
              >
                {block.label}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
