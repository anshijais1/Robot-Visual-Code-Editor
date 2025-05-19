import React, { useRef, useState } from "react";
import { BLOCK_CATEGORIES } from "../data/BlockCategories";

const VALUES = [
  { type: "value", label: "0", value: 0 },
  { type: "value", label: "1", value: 1 },
  { type: "value", label: "2", value: 2 },
  { type: "value", label: "3", value: 3 },
  { type: "value", label: "4", value: 4 },
  { type: "value", label: "5", value: 5 },
  { type: "value", label: "6", value: 6 },
  { type: "value", label: "7", value: 7 },
  { type: "value", label: "8", value: 8 },
  { type: "value", label: "9", value: 9 },
  { type: "value", label: "10", value: 10 },
];

const ALL_PALETTE_BLOCKS = [
  ...VALUES,
  { type: "move_up", label: "Move Up", steps: 10 },
  { type: "move_down", label: "Move Down", steps: 10 },
  { type: "move_left", label: "Move Left", steps: 10 },
  { type: "move_right", label: "Move Right", steps: 10 },
  { type: "set_color", label: "Set Color (Blue)", colorIndex: 0 },
  { type: "set_color", label: "Set Color (Yellow)", colorIndex: 1 },
  { type: "set_color", label: "Set Color (Red)", colorIndex: 2 },
  { type: "set_color", label: "Set Color (Green)", colorIndex: 3 },
  { type: "set_color", label: "Set Color (Purple)", colorIndex: 4 },
  { type: "next_color", label: "Next Color" },
  { type: "prev_color", label: "Previous Color" },
  { type: "play_sound", label: "Play Sound (Beep)", sound: "beep" },
  { type: "play_sound", label: "Play Sound (Pop)", sound: "pop" },
  { type: "play_sound", label: "Play Sound (Hero)", sound: "hero" },
  { type: "set_volume", label: "Set Volume (100)", volume: 100 },
  ...BLOCK_CATEGORIES.flatMap(cat => cat.blocks)
];

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function isEventBlockType(type) {
  return type === "when_stage_clicked" || type === "when_robot_clicked";
}

export default function CodingPanel({
  program,
  setProgram,
  onRun,
  onRunAll,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  running,
}) {
  const dragIdx = useRef(null);
  const [addInsideIdx, setAddInsideIdx] = useState(null);
  const [addInsideType, setAddInsideType] = useState("");

  function handleDragStart(idx) { dragIdx.current = idx; }
  function handleDragOver(e, idx) {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === idx) return;
    const newProgram = [...program];
    const [moved] = newProgram.splice(dragIdx.current, 1);
    newProgram.splice(idx, 0, moved);
    setProgram(newProgram);
    dragIdx.current = idx;
  }
  function handleDragEnd() { dragIdx.current = null; }

  function handleDrop(e) {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (data) {
      let block = JSON.parse(data);
      // Always ensure .body is an array for event blocks
      if (isEventBlockType(block.type)) block.body = [];
      setProgram((prev) => [
        ...prev,
        { ...block, _id: Math.random().toString(36).slice(2) + Date.now() },
      ]);
    }
  }
  function handleBlockClick(block) {
    // Always ensure .body is an array for event blocks
    if (isEventBlockType(block.type)) block.body = [];
    setProgram((prev) => [
      ...prev,
      { ...deepClone(block), _id: Math.random().toString(36).slice(2) + Date.now() },
    ]);
  }

  function handleDelete(idx) {
    setProgram(program.filter((_, i) => i !== idx));
  }
  function handleDeleteNested(idx, type, nidx) {
    setProgram((program) =>
      program.map((block, i) =>
        i !== idx
          ? block
          : {
              ...block,
              [type]: (block[type] || []).filter((_, j) => j !== nidx),
            }
      )
    );
  }

  function handleAddInside(idx, type) {
    setAddInsideIdx(idx);
    setAddInsideType(type);
  }

  function handleModalSelect(block) {
    setProgram((program) =>
      program.map((b, i) => {
        if (i !== addInsideIdx) return b;
        // Always ensure the slot is an array for event/control blocks (body/elseBody)
        if (Array.isArray(b[addInsideType]) || addInsideType === "body" || addInsideType === "elseBody") {
          return {
            ...b,
            [addInsideType]: [
              ...(Array.isArray(b[addInsideType]) ? b[addInsideType] : []),
              block.type === "value"
                ? block.value
                : { ...deepClone(block), _id: Math.random().toString(36).slice(2) + Date.now() },
            ],
          };
        } else { // for operator slots a/b
          return {
            ...b,
            [addInsideType]:
              block.type === "value"
                ? block.value
                : { ...deepClone(block), _id: Math.random().toString(36).slice(2) + Date.now() },
          };
        }
      })
    );
    setAddInsideIdx(null);
    setAddInsideType("");
  }

  function handleCloseModal() {
    setAddInsideIdx(null);
    setAddInsideType("");
  }

  function handleBlockValueChange(idx, field, val) {
    setProgram((program) =>
      program.map((b, i) => (i === idx ? { ...b, [field]: val } : b))
    );
  }

  function isEventBlock(block) {
    return isEventBlockType(block.type);
  }

  function renderBlock(block, idx, parentIdx, parentType) {
    if (typeof block === "number" || typeof block === "string") {
      return (
        <span
          key={idx}
          style={{
            background: "#f1f8e9",
            borderRadius: 5,
            padding: "2px 9px",
            margin: "0 7px",
            fontWeight: 600,
            color: "#4caf50",
            border: "1.5px solid #c8e6c9",
          }}
        >
          {block}
        </span>
      );
    }

    const isControlBlock = ["repeat", "forever", "if", "if_else"].includes(block.type);
    const isOperatorBlock = [
      "add",
      "subtract",
      "multiply",
      "divide",
      "pick_random",
      "greater_than",
      "less_than",
      "equals",
      "and",
      "or",
      "not",
      "mod",
      "round",
      "abs",
    ].includes(block.type);
    const isIfBlock = block.type === "if" || block.type === "if_else";

    // EVENT BLOCK SUPPORT: add +inside for event blocks and render body children
    if (isEventBlock(block)) {
      return (
        <div
          key={block._id || idx}
          className="coding-block event-block"
          style={{
            background: "#fce4ec",
            borderLeft: "8px solid #f67280",
            borderRadius: 8,
            margin: "8px 0",
            padding: "7px 10px",
            boxShadow: "0 1px 4px #0001",
            display: "flex",
            flexDirection: "column",
            fontSize: 15,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ flex: 1, fontWeight: 700 }}>{block.label}</span>
            <button
              className="add-inside-btn"
              onClick={() => handleAddInside(parentIdx == null ? idx : parentIdx, "body")}
              style={{ marginLeft: 4 }}
              title="Add block inside event"
            >
              + inside
            </button>
            <button
              onClick={() =>
                parentIdx == null
                  ? handleDelete(idx)
                  : handleDeleteNested(parentIdx, parentType, idx)
              }
              style={{
                marginLeft: 6,
                background: "#e57373",
                color: "#fff",
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
                fontWeight: 700,
                padding: "0 8px",
              }}
              title="Delete block"
            >
              ×
            </button>
          </div>
          {block.body && block.body.length > 0 && (
            <div
              style={{
                marginLeft: 18,
                marginTop: 6,
                borderLeft: "2.5px solid #f67280",
              }}
            >
              {block.body.map((nested, nidx) =>
                renderBlock(
                  nested,
                  nidx,
                  parentIdx == null ? idx : parentIdx,
                  "body"
                )
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={block._id || idx}
        className="coding-block"
        draggable={parentIdx == null}
        onDragStart={parentIdx == null ? () => handleDragStart(idx) : undefined}
        onDragOver={parentIdx == null ? (e) => handleDragOver(e, idx) : undefined}
        onDragEnd={parentIdx == null ? handleDragEnd : undefined}
        style={{
          background: "#eaf6fb",
          borderLeft: "6px solid #6cf",
          borderRadius: 7,
          margin: "6px 0",
          padding: "7px 10px",
          boxShadow: "0 1px 4px #0002",
          display: "flex",
          flexDirection: "column",
          fontSize: 15,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ flex: 1 }}>
            {block.label}
            {block.type === "wait" && (
              <input
                type="number"
                style={{ width: 48, marginLeft: 8 }}
                value={block.value === undefined ? "1" : block.value}
                min={0}
                max={60}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) =>
                  handleBlockValueChange(idx, "value", e.target.value)
                }
              />
            )}
            {block.type === "change_size" && (
              <input
                type="number"
                style={{ width: 48, marginLeft: 8 }}
                value={block.value === undefined ? "10" : block.value}
                min={-100}
                max={100}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) =>
                  handleBlockValueChange(idx, "value", e.target.value)
                }
              />
            )}
            {block.type === "for" && (
              <span style={{ marginLeft: 8 }}>
                var
                <input
                  type="text"
                  style={{ width: 22, marginLeft: 2 }}
                  value={block.varName || "i"}
                  maxLength={2}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    setProgram((program) =>
                      program.map((b, i) =>
                        i === idx ? { ...b, varName: e.target.value } : b
                      )
                    )
                  }
                />
                {" from "}
                <input
                  type="number"
                  style={{ width: 34, marginLeft: 2 }}
                  value={block.from === undefined ? "1" : block.from}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    handleBlockValueChange(idx, "from", e.target.value)
                  }
                />
                {" to "}
                <input
                  type="number"
                  style={{ width: 34, marginLeft: 2 }}
                  value={block.to === undefined ? "10" : block.to}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    handleBlockValueChange(idx, "to", e.target.value)
                  }
                />
              </span>
            )}
            {isIfBlock && (
              <span style={{ marginLeft: 8, fontWeight: 400 }}>
                (
                <span style={{ marginLeft: 2, marginRight: 2 }}>
                  a:
                  {block.a !== undefined && block.a !== null ? (
                    <span
                      onClick={() =>
                        handleAddInside(
                          parentIdx == null ? idx : parentIdx,
                          "a"
                        )
                      }
                      style={{
                        cursor: "pointer",
                        marginLeft: 2,
                        marginRight: 4,
                      }}
                    >
                      {renderBlock(
                        block.a,
                        0,
                        parentIdx == null ? idx : parentIdx,
                        "a"
                      )}
                    </span>
                  ) : (
                    <button
                      className="add-inside-btn"
                      onClick={() =>
                        handleAddInside(
                          parentIdx == null ? idx : parentIdx,
                          "a"
                        )
                      }
                      style={{
                        marginLeft: 2,
                        marginRight: 4,
                        padding: "0 6px",
                      }}
                    >
                      + a
                    </button>
                  )}
                  ==
                  b:
                  {block.b !== undefined && block.b !== null ? (
                    <span
                      onClick={() =>
                        handleAddInside(
                          parentIdx == null ? idx : parentIdx,
                          "b"
                        )
                      }
                      style={{ cursor: "pointer", marginLeft: 2 }}
                    >
                      {renderBlock(
                        block.b,
                        1,
                        parentIdx == null ? idx : parentIdx,
                        "b"
                      )}
                    </span>
                  ) : (
                    <button
                      className="add-inside-btn"
                      onClick={() =>
                        handleAddInside(
                          parentIdx == null ? idx : parentIdx,
                          "b"
                        )
                      }
                      style={{ marginLeft: 2, padding: "0 6px" }}
                    >
                      + b
                    </button>
                  )}
                </span>
                )
              </span>
            )}
          </span>
          {isControlBlock && (
            <>
              {["repeat", "forever", "if"].includes(block.type) && (
                <button
                  className="add-inside-btn"
                  onClick={() =>
                    handleAddInside(parentIdx == null ? idx : parentIdx, "body")
                  }
                  style={{ marginLeft: 4 }}
                  title="Add block inside"
                >
                  + inside
                </button>
              )}
              {block.type === "if_else" && (
                <>
                  <button
                    className="add-inside-btn"
                    onClick={() =>
                      handleAddInside(
                        parentIdx == null ? idx : parentIdx,
                        "body"
                      )
                    }
                    style={{ marginLeft: 4 }}
                    title="Add block inside (then)"
                  >
                    + then
                  </button>
                  <button
                    className="add-inside-btn"
                    onClick={() =>
                      handleAddInside(
                        parentIdx == null ? idx : parentIdx,
                        "elseBody"
                      )
                    }
                    style={{ marginLeft: 4 }}
                    title="Add block inside (else)"
                  >
                    + else
                  </button>
                </>
              )}
            </>
          )}
          {isOperatorBlock && (
            <>
              {"a" in block && (
                <button
                  className="add-inside-btn"
                  onClick={() =>
                    handleAddInside(parentIdx == null ? idx : parentIdx, "a")
                  }
                  style={{ marginLeft: 4 }}
                  title="Add block to slot a"
                >
                  + a
                </button>
              )}
              {"b" in block && (
                <button
                  className="add-inside-btn"
                  onClick={() =>
                    handleAddInside(parentIdx == null ? idx : parentIdx, "b")
                  }
                  style={{ marginLeft: 4 }}
                  title="Add block to slot b"
                >
                  + b
                </button>
              )}
            </>
          )}
          <button
            onClick={() =>
              parentIdx == null
                ? handleDelete(idx)
                : handleDeleteNested(parentIdx, parentType, idx)
            }
            style={{
              marginLeft: 6,
              background: "#e57373",
              color: "#fff",
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
              fontWeight: 700,
              padding: "0 8px",
            }}
            title="Delete block"
          >
            ×
          </button>
        </div>
        {isControlBlock && block.body && block.body.length > 0 && (
          <div
            style={{
              marginLeft: 18,
              marginTop: 6,
              borderLeft: "2.5px solid #6cf",
            }}
          >
            {block.body.map((nested, nidx) =>
              renderBlock(
                nested,
                nidx,
                parentIdx == null ? idx : parentIdx,
                "body"
              )
            )}
          </div>
        )}
        {block.type === "if_else" && block.elseBody && block.elseBody.length > 0 && (
          <div
            style={{
              marginLeft: 18,
              marginTop: 6,
              borderLeft: "2.5px solid #f5b342",
            }}
          >
            {block.elseBody.map((nested, nidx) =>
              renderBlock(
                nested,
                nidx,
                parentIdx == null ? idx : parentIdx,
                "elseBody"
              )
            )}
          </div>
        )}
        {isOperatorBlock && block.a !== undefined && block.a !== null && (
          <div
            style={{
              marginLeft: 18,
              marginTop: 6,
              borderLeft: "2.5px solid #59C059",
            }}
          >
            {renderBlock(
              block.a,
              0,
              parentIdx == null ? idx : parentIdx,
              "a"
            )}
          </div>
        )}
        {isOperatorBlock && block.b !== undefined && block.b !== null && (
          <div
            style={{
              marginLeft: 18,
              marginTop: 6,
              borderLeft: "2.5px solid #59C059",
            }}
          >
            {renderBlock(
              block.b,
              1,
              parentIdx == null ? idx : parentIdx,
              "b"
            )}
          </div>
        )}
      </div>
    );
  }

  const showModal = addInsideIdx !== null && addInsideType !== "";
  return (
    <div
      className="coding-panel"
      style={{
        minHeight: 260,
        background: "#fff",
        border: "1.5px solid #cfd8dc",
        borderRadius: 14,
        padding: 14,
      }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div style={{ color: "#3498db", marginBottom: 8, fontWeight: 600 }}>
        Code Blocks
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 9,
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="undo-btn"
          title="Undo"
        >
          ↺
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="redo-btn"
          title="Redo"
        >
          ↻
        </button>
      </div>
      {program.length === 0 && (
        <div style={{ color: "#bbb", margin: "18px 0" }}>
          Drag blocks here or click any block in palette!
        </div>
      )}
      {program.map((block, idx) => renderBlock(block, idx, null, null))}
      <div
        style={{
          marginTop: 18,
          display: "flex",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <button
          className="run-btn"
          onClick={onRun}
          disabled={program.length === 0 || running}
        >
          ▶️ Run
        </button>
        <button
          onClick={onRunAll}
          className="run-btn"
          disabled={running}
        >
          ▶️ Run All
        </button>
      </div>
      {showModal && (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.15)",
            zIndex: 99,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 22,
              borderRadius: 10,
              minWidth: 340,
              boxShadow: "0 2px 22px #0003",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                color: "#3498db",
                marginBottom: 10,
              }}
            >
              Select a block or value to add inside
            </div>
            <div style={{ maxHeight: 350, overflowY: "auto" }}>
              {ALL_PALETTE_BLOCKS.map((block, i) => (
                <div
                  key={i}
                  onClick={() => handleModalSelect(block)}
                  style={{
                    background:
                      block.type === "value" ? "#f1f8e9" : "#f8fbff",
                    margin: "7px 0",
                    padding: "8px 14px",
                    borderRadius: 7,
                    borderLeft:
                      block.type === "value"
                        ? "8px solid #4caf50"
                        : "8px solid #6cf",
                    boxShadow: "0 1px 4px #0001",
                    cursor: "pointer",
                    fontWeight: block.type === "value" ? 700 : 400,
                    color: block.type === "value" ? "#388e3c" : undefined,
                  }}
                >
                  {block.label}
                </div>
              ))}
            </div>
            <button
              onClick={handleCloseModal}
              style={{
                marginTop: 14,
                width: "100%",
                background: "#e57373",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                padding: "6px 0",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}