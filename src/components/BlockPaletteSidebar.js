import React, { useState } from "react";
import { BLOCK_CATEGORIES } from "../data/BlockCategories";

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
  const [inputValues, setInputValues] = useState({});

  function handleInputNumberChange(key, e) {
    setInputValues((vals) => ({
      ...vals,
      [key]: e.target.value,
    }));
  }

  function handleInputTextChange(key, e) {
    setInputValues((vals) => ({
      ...vals,
      [key]: e.target.value,
    }));
  }

  function getNumberInputValue(key, fallback) {
    return inputValues[key] !== undefined ? inputValues[key] : String(fallback);
  }

  function handleBlockClick(block, catIdx, blockIdx) {
    let newBlock = { ...JSON.parse(JSON.stringify(block)), _id: Math.random().toString(36).slice(2) + Date.now() };
    const key = `${catIdx}_${blockIdx}`;
    if (block.type === "change_size" || block.type === "wait") {
      const val = inputValues[key];
      newBlock.value = val === "" || val === undefined
        ? (block.value ?? (block.type === "wait" ? 1 : 10))
        : Number(val);
    }
    if (block.type === "for") {
      newBlock.varName =
        inputValues[`${key}_varName`] === undefined
          ? block.varName ?? "i"
          : inputValues[`${key}_varName`];
      const fromVal = inputValues[`${key}_from`];
      const toVal = inputValues[`${key}_to`];
      newBlock.from = fromVal === "" || fromVal === undefined
        ? block.from ?? 1
        : Number(fromVal);
      newBlock.to = toVal === "" || toVal === undefined
        ? block.to ?? 10
        : Number(toVal);
      newBlock.body = [];
    }
    onBlockAdd && onBlockAdd(newBlock);
  }

  function handleDragStart(e, block, catIdx, blockIdx) {
    let dragBlock = { ...block };
    const key = `${catIdx}_${blockIdx}`;
    if (block.type === "change_size" || block.type === "wait") {
      const val = inputValues[key];
      dragBlock.value = val === "" || val === undefined
        ? (block.value ?? (block.type === "wait" ? 1 : 10))
        : Number(val);
    }
    if (block.type === "for") {
      dragBlock.varName =
        inputValues[`${key}_varName`] === undefined
          ? block.varName ?? "i"
          : inputValues[`${key}_varName`];
      const fromVal = inputValues[`${key}_from`];
      const toVal = inputValues[`${key}_to`];
      dragBlock.from = fromVal === "" || fromVal === undefined
        ? block.from ?? 1
        : Number(fromVal);
      dragBlock.to = toVal === "" || toVal === undefined
        ? block.to ?? 10
        : Number(toVal);
      dragBlock.body = [];
    }
    e.dataTransfer.setData("application/json", JSON.stringify(dragBlock));
  }

  function handleDrop(e) {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (data && onBlockAdd) onBlockAdd({ ...JSON.parse(data), _id: Math.random().toString(36).slice(2) + Date.now() });
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
    ...BLOCK_CATEGORIES,
  ];

  return (
    <div className="block-palette-sidebar" onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
      {customCategories.map((cat, catIdx) => (
        <div key={cat.name} className="block-category">
          <div className="block-category-header" style={{ background: cat.color, color: "#fff" }}>
            {cat.name}
          </div>
          <div className="block-category-body">
            {cat.blocks.map((block, blockIdx) => {
              const key = `${catIdx}_${blockIdx}`;
              return (
                <div
                  key={blockIdx}
                  className="block-palette-block"
                  draggable
                  onDragStart={e => handleDragStart(e, block, catIdx, blockIdx)}
                  onClick={() => handleBlockClick(block, catIdx, blockIdx)}
                  style={{
                    background: "#fff",
                    borderLeft: `7px solid ${cat.color}`,
                    borderRadius: 6,
                    margin: "6px 0",
                    padding: "7px 12px",
                    boxShadow: "0 1px 4px #0001",
                    fontSize: ".97em",
                    cursor: "grab",
                    userSelect: "none",
                    minHeight: 34,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    flexDirection: "column",
                  }}
                  title={block.label}
                >
                  <span style={{ width: "100%" }}>
                    {block.label}
                  </span>
                  {block.type === "change_size" && (
                    <input
                      type="number"
                      style={{ width: 50, fontSize: "1em", marginTop: 4 }}
                      value={getNumberInputValue(key, block.value ?? 10)}
                      min={-100}
                      max={100}
                      onClick={e => e.stopPropagation()}
                      onChange={e => handleInputNumberChange(key, e)}
                      title="Amount to change size by"
                    />
                  )}
                  {block.type === "wait" && (
                    <div style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
                      <input
                        type="number"
                        style={{ width: 40, fontSize: "1em" }}
                        value={getNumberInputValue(key, block.value ?? 1)}
                        min={0}
                        max={60}
                        onClick={e => e.stopPropagation()}
                        onChange={e => handleInputNumberChange(key, e)}
                        title="Seconds to wait"
                      />
                      <span style={{ marginLeft: 6 }}>sec</span>
                    </div>
                  )}
                  {block.type === "for" && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4, alignItems: "center" }}>
                      <span style={{ fontSize: "0.97em" }}>var</span>
                      <input
                        type="text"
                        style={{ width: 22, fontSize: "1em" }}
                        value={inputValues[`${key}_varName`] === undefined ? (block.varName ?? "i") : inputValues[`${key}_varName`]}
                        maxLength={2}
                        onClick={e => e.stopPropagation()}
                        onChange={e => handleInputTextChange(`${key}_varName`, e)}
                        title="Loop variable"
                      />
                      <span>from</span>
                      <input
                        type="number"
                        style={{ width: 34, fontSize: "1em" }}
                        value={getNumberInputValue(`${key}_from`, block.from ?? 1)}
                        onClick={e => e.stopPropagation()}
                        onChange={e => handleInputNumberChange(`${key}_from`, e)}
                        title="Start"
                      />
                      <span>to</span>
                      <input
                        type="number"
                        style={{ width: 34, fontSize: "1em" }}
                        value={getNumberInputValue(`${key}_to`, block.to ?? 10)}
                        onClick={e => e.stopPropagation()}
                        onChange={e => handleInputNumberChange(`${key}_to`, e)}
                        title="End"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}