import React, { useState } from "react";
import CodingPanel, { evaluateExpression } from "./components/CodingPanel";
import BlockPaletteSidebar from "./components/BlockPaletteSidebar";
import Sprite from "./components/Sprite";
import { BLOCK_CATEGORIES } from "./data/BlockCategories";
import "./AppBest.css";
import "./AppBlockPalette.css";

const ROBOT_SVGS = [
  "/robot1.svg",
  "/cat.png",
  "/robot2.svg",
  "/robot3.svg",
  "/dog.png",
  "/cake.png"
];

const COLOR_PALETTE = [
  "#7b2ff2", "#00dfd8", "#f7971e", "#ffd200",
  "#21d4fd", "#fa71cd", "#38ef7d", "#1e3c72", "#e0eafd", "#c471f5"
];
const SOUND_MAP = {
  beep: "/beep.mp3",
  pop: "/pop.mp3",
  hero: "/hero.wav"
};
const DEFAULT_COLOR = "#6cf";
let nextId = 1;

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
function makeSprite(name, x, y, src, color = DEFAULT_COLOR) {
  return {
    id: nextId++,
    name,
    x,
    y,
    src,
    color,
    say: "",
    program: [],
    angle: 0,
    penDown: false,
    penColor: "#444",
    penWidth: 3,
    penTrail: [],
    trail: [],
    visible: true,
    size: 100,
    highlight: false,
    volume: 70,
    lastOp: 0,
  };
}
const GOAL_POS = { x: 460, y: 260, r: 36 };

function spritesCollide(a, b) {
  return (
    a.x < b.x + 64 &&
    a.x + 64 > b.x &&
    a.y < b.y + 64 &&
    a.y + 64 > b.y
  );
}

function isSpriteAtGoal(sprite, goal) {
  const spriteCenterX = sprite.x + 32;
  const spriteCenterY = sprite.y + 32;
  const goalCenterX = goal.x + goal.r / 2;
  const goalCenterY = goal.y + goal.r / 2;
  const dx = spriteCenterX - goalCenterX;
  const dy = spriteCenterY - goalCenterY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < goal.r / 2 + 32;
}

function evalOperator(block) {
  function value(v) {
    if (typeof v === "object" && v !== null && v.type) return evalOperator(v);
    return v;
  }
  switch (block.type) {
    case "value": return block.value;
    case "add":     return (Number(value(block.a)) ?? 0) + (Number(value(block.b)) ?? 0);
    case "subtract":return (Number(value(block.a)) ?? 0) - (Number(value(block.b)) ?? 0);
    case "multiply":return (Number(value(block.a)) ?? 0) * (Number(value(block.b)) ?? 0);
    case "divide":  return (Number(value(block.a)) ?? 0) / (Number(value(block.b)) ?? 1);
    case "mod":     return (Number(value(block.a)) ?? 0) % (Number(value(block.b)) ?? 1);
    case "round":   return Math.round(Number(value(block.a)) ?? 0);
     case "max": return Math.max(Number(value(block.a)) ?? 0, Number(value(block.b)) ?? 0);
    case "min": return Math.min(Number(value(block.a)) ?? 0, Number(value(block.b)) ?? 0);
    case "abs":     return Math.abs(Number(value(block.a)) ?? 0);
    case "greater_than": return (Number(value(block.a)) ?? 0) > (Number(value(block.b)) ?? 0) ? 1 : 0;
    case "less_than":    return (Number(value(block.a)) ?? 0) < (Number(value(block.b)) ?? 0) ? 1 : 0;
    case "equals":  return Number(value(block.a)) === Number(value(block.b)) ? 1 : 0;
    case "and":     return Boolean(value(block.a) && value(block.b)) ? 1 : 0;
    case "or":      return Boolean(value(block.a) || value(block.b)) ? 1 : 0;
    case "not":     return !value(block.a) ? 1 : 0;
    case "pick_random":
      return Math.floor(Math.random() * ((value(block.b) ?? 10) - (value(block.a) ?? 1) + 1)) + (value(block.a) ?? 1);
    default:
      return undefined;
  }
}
function evalCondForIfBlock(block) {
  let a = block.a;
  let b = block.b;
  if (typeof a === "object" && a !== null && a.type) a = evalOperator(a);
  if (typeof b === "object" && b !== null && b.type) b = evalOperator(b);
  return Number(a) === Number(b);
}

async function executeBlocksRecursive(blocks, temp, flashSprite, setSprites, selectedId, checkWinCallback) {
  for (let block of blocks) {
    // Control
    if (block.type === "repeat") {
      let times = (block.a !== undefined) ? evalOperator(block.a) : (block.times !== undefined ? block.times : 10);
      for (let i = 0; i < (Number(times) || 0); i++) {
        await executeBlocksRecursive(block.body || [], temp, flashSprite, setSprites, selectedId, checkWinCallback);
      }
    } else if (block.type === "forever") {
      for (let i = 0; i < 20; i++) {
        await executeBlocksRecursive(block.body || [], temp, flashSprite, setSprites, selectedId, checkWinCallback);
      }
    } else if (block.type === "if") {
      if (evalCondForIfBlock(block)) {
        await executeBlocksRecursive(block.body || [], temp, flashSprite, setSprites, selectedId, checkWinCallback);
      }
    } else if (block.type === "if_else") {
      if (evalCondForIfBlock(block)) {
        await executeBlocksRecursive(block.body || [], temp, flashSprite, setSprites, selectedId, checkWinCallback);
      } else {
        await executeBlocksRecursive(block.elseBody || [], temp, flashSprite, setSprites, selectedId, checkWinCallback);
      }
    }
    // Motion
    else if (
      [
        "move", "move_up", "move_down", "move_left", "move_right", "turn",
        "set_x", "set_y", "goto", "change_x", "change_y",
        "point_in_direction", "go_to_origin", "if_on_edge_bounce"
      ].includes(block.type)
    ) {
      executeBlock(temp, block, flashSprite);
    }
    // Color
    else if (
      ["set_color", "next_color", "prev_color"].includes(block.type)
    ) {
      if (block.type === "set_color") temp.color = COLOR_PALETTE[block.colorIndex % COLOR_PALETTE.length];
      if (block.type === "next_color") temp.color = COLOR_PALETTE[(COLOR_PALETTE.indexOf(temp.color) + 1) % COLOR_PALETTE.length];
      if (block.type === "prev_color") temp.color = COLOR_PALETTE[(COLOR_PALETTE.indexOf(temp.color) - 1 + COLOR_PALETTE.length) % COLOR_PALETTE.length];
    }
    // Sound
    else if (block.type === "play_sound") {
      let src = SOUND_MAP[block.sound] || "";
      if (src) {
        const audio = new window.Audio(src);
        audio.volume = typeof block.volume !== "undefined" ? block.volume / 100 : 1;
        audio.play();
      }
    } else if (block.type === "set_volume") {
      temp.volume = block.volume;
    }
    // Operators (for debugging/logic)
    else if (
      [
        "add", "subtract", "multiply", "divide", "pick_random",
        "greater_than", "less_than", "equals", "and", "or", "not", "mod", "round", "abs"
      ].includes(block.type)
    ) {
      temp.lastOp = evalOperator(block);
    }

    // Wait Block
    else if (block.type === "wait") {
      let seconds = Number(block.value) || 1;
      await new Promise(r => setTimeout(r, seconds * 1000));
    }

    // Change Size Block
    else if (block.type === "change_size") {
      let delta = Number(block.value) || 10;
      temp.size = Math.max(10, Math.min(300, (temp.size || 100) + delta));
    }

    // Show/Hide Block
    else if (block.type === "show") {
      temp.visible = true;
    } else if (block.type === "hide") {
      temp.visible = false;
    }

    // For Loop Block
    else if (block.type === "for") {
      let from = Number(block.from) || 1;
      let to = Number(block.to) || 10;
      let varName = block.varName || "i";
      for (let i = from; i <= to; i++) {
        temp[varName] = i;
        await executeBlocksRecursive(block.body || [], temp, flashSprite, setSprites, selectedId, checkWinCallback);
      }
    }

    setSprites(old => old.map(s => s.id === selectedId ? { ...temp } : s));
    if (checkWinCallback) checkWinCallback({ ...temp });
    await new Promise(r => setTimeout(r, 170));
  }
}

function executeBlock(temp, block, flashSprite) {
  if (block.type === "move") {
    let rad = ((temp.angle || 0) * Math.PI) / 180;
    let steps = block.steps || 10;
    let dx = steps * Math.cos(rad);
    let dy = steps * Math.sin(rad);
    let oldX = temp.x, oldY = temp.y;
    let newX = clamp(oldX + dx, 0, 504);
    let newY = clamp(oldY + dy, 0, 304);
    if (newX !== oldX + dx || newY !== oldY + dy) flashSprite(temp.id);
    temp.x = newX; temp.y = newY;
  }
  if (block.type === "move_up") temp.y = clamp(temp.y - (block.steps || 10), 0, 304);
  if (block.type === "move_down") temp.y = clamp(temp.y + (block.steps || 10), 0, 304);
  if (block.type === "move_left") temp.x = clamp(temp.x - (block.steps || 10), 0, 504);
  if (block.type === "move_right") temp.x = clamp(temp.x + (block.steps || 10), 0, 504);
  if (block.type === "turn") temp.angle = ((temp.angle || 0) + (block.degrees || 15)) % 360;
  if (block.type === "set_x") temp.x = clamp(block.x || 0, 0, 504);
  if (block.type === "set_y") temp.y = clamp(block.y || 0, 0, 304);
  if (block.type === "goto") { temp.x = clamp(block.x || 0, 0, 504); temp.y = clamp(block.y || 0, 0, 304); }
  if (block.type === "change_x") temp.x = clamp(temp.x + (block.dx || 0), 0, 504);
  if (block.type === "change_y") temp.y = clamp(temp.y + (block.dy || 0), 0, 304);
  if (block.type === "point_in_direction") temp.angle = block.direction || 0;
  if (block.type === "go_to_origin") { temp.x = 0; temp.y = 0; }
  if (block.type === "if_on_edge_bounce") {
    let bounced = false;
    if (temp.x <= 0 || temp.x >= 504) { temp.angle = 180 - temp.angle; bounced = true; }
    if (temp.y <= 0 || temp.y >= 304) { temp.angle = -temp.angle; bounced = true; }
    if (bounced) flashSprite(temp.id);
  }
}

async function runProgramForSprite(sprite, setSprites, flashSprite, runningFlagObj, checkWinCallback) {
  let temp = { ...sprite };
  for (let block of sprite.program) {
    if (!runningFlagObj.running) break;
    // Control
    if (block.type === "repeat") {
      let times = (block.a !== undefined) ? evalOperator(block.a) : (block.times !== undefined ? block.times : 10);
      for (let i = 0; i < (Number(times) || 0) && runningFlagObj.running; i++) {
        await executeBlocksRecursive(block.body || [], temp, flashSprite, setSprites, sprite.id, checkWinCallback);
      }
    } else if (block.type === "forever") {
      for (let i = 0; i < 20 && runningFlagObj.running; i++) {
        await executeBlocksRecursive(block.body || [], temp, flashSprite, setSprites, sprite.id, checkWinCallback);
      }
    } else if (block.type === "wait") {
      let seconds = Number(block.value) || 1;
      await new Promise(r => setTimeout(r, seconds * 1000));
    } else if (block.type === "change_size") {
      let delta = Number(block.value) || 10;
      temp.size = Math.max(10, Math.min(300, (temp.size || 100) + delta));
    } else if (block.type === "show") {
      temp.visible = true;
    } else if (block.type === "hide") {
      temp.visible = false;
    } else if (block.type === "for") {
      let from = Number(block.from) || 1;
      let to = Number(block.to) || 10;
      let varName = block.varName || "i";
      for (let i = from; i <= to; i++) {
        temp[varName] = i;
        await executeBlocksRecursive(block.body || [], temp, flashSprite, setSprites, sprite.id, checkWinCallback);
      }
    } else if (block.type === "if") {
      if (evalCondForIfBlock(block)) {
        await executeBlocksRecursive(block.body || [], temp, flashSprite, setSprites, sprite.id, checkWinCallback);
      }
    } else if (block.type === "if_else") {
      if (evalCondForIfBlock(block)) {
        await executeBlocksRecursive(block.body || [], temp, flashSprite, setSprites, sprite.id, checkWinCallback);
      } else {
        await executeBlocksRecursive(block.elseBody || [], temp, flashSprite, setSprites, sprite.id, checkWinCallback);
      }
    }
    // Motion
    else if (
      [
        "move", "move_up", "move_down", "move_left", "move_right", "turn",
        "set_x", "set_y", "goto", "change_x", "change_y",
        "point_in_direction", "go_to_origin", "if_on_edge_bounce"
      ].includes(block.type)
    ) {
      executeBlock(temp, block, flashSprite);
    }
    // Color
    else if (
      ["set_color", "next_color", "prev_color"].includes(block.type)
    ) {
      if (block.type === "set_color") temp.color = COLOR_PALETTE[block.colorIndex % COLOR_PALETTE.length];
      if (block.type === "next_color") temp.color = COLOR_PALETTE[(COLOR_PALETTE.indexOf(temp.color) + 1) % COLOR_PALETTE.length];
      if (block.type === "prev_color") temp.color = COLOR_PALETTE[(COLOR_PALETTE.indexOf(temp.color) - 1 + COLOR_PALETTE.length) % COLOR_PALETTE.length];
    }
    // Sound
    else if (block.type === "play_sound") {
      let src = SOUND_MAP[block.sound] || "";
      if (src) {
        const audio = new window.Audio(src);
        audio.volume = typeof block.volume !== "undefined" ? block.volume / 100 : 1;
        audio.play();
      }
    } else if (block.type === "set_volume") {
      temp.volume = block.volume;
    }
    // Operators (for debugging/logic)
    else if (
      [
        "add", "subtract", "multiply", "divide", "pick_random",
        "greater_than", "less_than", "equals", "and", "or", "not", "mod", "round", "abs"
      ].includes(block.type)
    ) {
      temp.lastOp = evalOperator(block);
    }
    setSprites(old => old.map(s => s.id === sprite.id ? { ...temp } : s));
    if (checkWinCallback) checkWinCallback({ ...temp });
    await new Promise(r => setTimeout(r, 170));
  }
}

export default function App() {
  const [sprites, setSprites] = useState([
    makeSprite("Alpha", 100, 120, ROBOT_SVGS[0]),
    makeSprite("Beta", 250, 200, ROBOT_SVGS[1]),
  ]);
  async function handleStageClick() {
  for (const sprite of sprites) {
    for (const eventBlock of sprite.program.filter(block => block.type === "when_stage_clicked")) {
      let temp = { ...sprite };
      await executeBlocksRecursive(
        eventBlock.body,
        temp,
        flashSprite,
        setSprites,
        sprite.id
      );
      setSprites(old => old.map(s => s.id === sprite.id ? { ...temp } : s));
    }
  }
}

async function handleRobotSpriteClick(spriteId) {
  const sprite = sprites.find(s => s.id === spriteId);
  if (!sprite) return;
  for (const eventBlock of sprite.program.filter(block => block.type === "when_robot_clicked")) {
    let temp = { ...sprite };
    await executeBlocksRecursive(
      eventBlock.body,
      temp,
      flashSprite,
      setSprites,
      sprite.id
    );
    setSprites(old => old.map(s => s.id === sprite.id ? { ...temp } : s));
  }
}
  const [selectedId, setSelectedId] = useState(1);
  const [won, setWon] = useState(false);
  const [running, setRunning] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [flashRobot, setFlashRobot] = useState({});
  const [swappedIds, setSwappedIds] = useState([]);

  function checkWin(sprite) {
    if (isSpriteAtGoal(sprite, GOAL_POS)) {
      setWon(true);
      setRunning(false);
    }
  }

  React.useEffect(() => {
    function handleKeyDown(e) {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
      setSprites(sprites => sprites.map(sprite => {
        if (sprite.id !== selectedId) return sprite;
        let { x, y } = sprite;
        if (e.key === "ArrowUp") y = Math.max(0, y - 10);
        if (e.key === "ArrowDown") y = Math.min(304, y + 10);
        if (e.key === "ArrowLeft") x = Math.max(0, x - 10);
        if (e.key === "ArrowRight") x = Math.min(504, x + 10);
        return { ...sprite, x, y };
      }));
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  React.useEffect(() => {
    if (!running) {
      setSwappedIds([]);
      setSprites(sps =>
        sps.some(s => s.highlight)
          ? sps.map(s => ({ ...s, highlight: false }))
          : sps
      );
      return;
    }
    for (let i = 0; i < sprites.length; i++) {
      for (let j = i + 1; j < sprites.length; j++) {
        if (
          spritesCollide(sprites[i], sprites[j]) &&
          !swappedIds.some(
            pair =>
              (pair[0] === sprites[i].id && pair[1] === sprites[j].id) ||
              (pair[0] === sprites[j].id && pair[1] === sprites[i].id)
          )
        ) {
          setSprites(prev => prev.map(s =>
            (s.id === sprites[i].id || s.id === sprites[j].id)
              ? { ...s, highlight: true }
              : s
          ));
          setTimeout(() => {
            setSprites(prev => prev.map(s =>
              (s.id === sprites[i].id || s.id === sprites[j].id)
                ? { ...s, highlight: false }
                : s
            ));
          }, 700);
          setSprites(prev => {
            let arr = [...prev];
            let idxA = arr.findIndex(s => s.id === sprites[i].id);
            let idxB = arr.findIndex(s => s.id === sprites[j].id);
            if (idxA === -1 || idxB === -1) return arr;
            const tempProg = arr[idxA].program;
            arr[idxA] = { ...arr[idxA], program: arr[idxB].program };
            arr[idxB] = { ...arr[idxB], program: tempProg };
            return arr;
          });
          flashSprite(sprites[i].id);
          flashSprite(sprites[j].id);
          setSwappedIds(prev => [...prev, [sprites[i].id, sprites[j].id]]);
          return;
        }
      }
    }
  }, [running]);

  function saveProject() {
    const project = { sprites, selectedId };
    localStorage.setItem("robotProject", JSON.stringify(project));
    alert("Project saved!");
  }
  function loadProject() {
    const data = localStorage.getItem("robotProject");
    if (data) {
      try {
        const project = JSON.parse(data);
        let idMap = {}, curId = 1;
        const loadedSprites = project.sprites.map(sprite => {
          idMap[sprite.id] = curId;
          return { ...sprite, id: curId++ };
        });
        nextId = curId;
        setSprites(loadedSprites);
        setSelectedId(idMap[project.selectedId] || 1);
        setWon(false);
        setUndoStack([]);
        setRedoStack([]);
        alert("Project loaded!");
      } catch {
        alert("Failed to load project.");
      }
    } else {
      alert("No saved project found.");
    }
  }
  function exportProject() {
    const project = { sprites, selectedId };
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "robot-project.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  function importProject(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const project = JSON.parse(e.target.result);
        let idMap = {}, curId = 1;
        const loadedSprites = project.sprites.map(sprite => {
          idMap[sprite.id] = curId;
          return { ...sprite, id: curId++ };
        });
        nextId = curId;
        setSprites(loadedSprites);
        setSelectedId(idMap[project.selectedId] || 1);
        setWon(false);
        setUndoStack([]);
        setRedoStack([]);
        alert("Project imported!");
      } catch {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  }

  function handleAddSprite() {
    const name = "Sprite " + (sprites.length + 1);
    const src = ROBOT_SVGS[(sprites.length) % ROBOT_SVGS.length];
    const sprite = makeSprite(name, 120 + 40 * (sprites.length), 140, src);
    setSprites(arr => [...arr, sprite]);
    setUndoStack([]);
    setRedoStack([]);
  }
  function handleRemoveSprite() {
    if (sprites.length === 1) return;
    const idx = sprites.findIndex(s => s.id === selectedId);
    const newSprites = sprites.filter(s => s.id !== selectedId);
    setSprites(newSprites);
    // When removing, select previous sprite or first if none left
    const newSelectedIdx = Math.max(0, idx - 1);
    if (newSprites.length > 0) {
      setSelectedId(newSprites[newSelectedIdx].id);
    }
    setUndoStack([]);
    setRedoStack([]);
  }
  function handlePresetRobotChange(src) {
    setSprites(prev =>
      prev.map(sprite =>
        sprite.id === selectedId ? { ...sprite, src } : sprite
      )
    );
  }
  function handleRobotImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      setSprites(prev =>
        prev.map(sprite =>
          sprite.id === selectedId ? { ...sprite, src: ev.target.result } : sprite
        )
      );
    };
    reader.readAsDataURL(file);
  }

  function handleBlockAdd(block) {
    setSprites(sps =>
      sps.map(sprite =>
        sprite.id === selectedId
          ? { ...sprite, program: [...sprite.program, block] }
          : sprite
      )
    );
    setUndoStack(stack => [...stack, sprites.find(s => s.id === selectedId)?.program || []]);
    setRedoStack([]);
  }
  function setProgram(newProgram) {
    setSprites(sps =>
      sps.map(sprite =>
        sprite.id === selectedId
          ? { ...sprite, program: typeof newProgram === "function" ? newProgram(sprite.program) : newProgram }
          : sprite
      )
    );
    setUndoStack(stack => [...stack, sprites.find(s => s.id === selectedId)?.program || []]);
    setRedoStack([]);
  }
  function handleUndo() {
    if (undoStack.length === 0) return;
    setRedoStack(stack => [...stack, sprites.find(s => s.id === selectedId)?.program || []]);
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(stack => stack.slice(0, -1));
    setSprites(sp =>
      sp.map(sprite => sprite.id === selectedId ? { ...sprite, program: previous } : sprite)
    );
  }
  function handleRedo() {
    if (redoStack.length === 0) return;
    setUndoStack(stack => [...stack, sprites.find(s => s.id === selectedId)?.program || []]);
    const next = redoStack[redoStack.length - 1];
    setRedoStack(stack => stack.slice(0, -1));
    setSprites(sp =>
      sp.map(sprite => sprite.id === selectedId ? { ...sprite, program: next } : sprite)
    );
  }

  function flashSprite(id) {
    setFlashRobot(f => ({ ...f, [id]: true }));
    setTimeout(() => setFlashRobot(f => ({ ...f, [id]: false })), 250);
  }

  async function runSelected() {
    const selectedSprite = sprites.find(s => s.id === selectedId);
    if (!selectedSprite || selectedSprite.program.length === 0 || running) return;
    setRunning(true);
    setWon(false);
    let temp = { ...selectedSprite };
    await executeBlocksRecursive(
      selectedSprite.program,
      temp,
      flashSprite,
      setSprites,
      selectedId,
      (sprite) => {
        if (isSpriteAtGoal(sprite, GOAL_POS)) {
          setWon(true);
          setRunning(false);
        }
      }
    );
    setSprites(old => old.map(s => s.id === selectedId ? { ...temp } : s));
    setRunning(false);
  }
  function runAll() {
    if (running) return;
    setRunning(true);
    setWon(false);

    const runningFlagObj = { running: true };
    let finished = false;
    let promises = sprites.map(sprite =>
      runProgramForSprite(
        sprite,
        setSprites,
        flashSprite,
        runningFlagObj,
        (spr) => {
          if (!finished && isSpriteAtGoal(spr, GOAL_POS)) {
            finished = true;
            setWon(true);
            runningFlagObj.running = false;
            setRunning(false);
          }
        }
      )
    );
    Promise.all(promises).then(() => {
      setRunning(false);
    });
  }

  const stageStyle = {
    background: "linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 60%, #667eea 100%)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative",
    width: 570,
    height: 370,
    borderRadius: 22,
    boxShadow: "0 4px 32px #0001, 0 1.5px 0 #c4d4ee inset",
    border: "2px solid #d4e1f6",
    margin: "0 auto",
    overflow: "hidden",
    transition: "box-shadow 0.2s"
  };

  return (
    <div id="robot-app-root">
      <div className="topbar">
        <div className="logo">🤖 Robot Lab</div>
        <div className="toolbar">
          <button onClick={saveProject}>💾 Save</button>
          <button onClick={loadProject}>📂 Load</button>
          <button onClick={exportProject}>⬇️ Export JSON</button>
          <label>
            ⬆️ Import JSON
            <input
              type="file"
              accept=".json,application/json"
              onChange={importProject}
            />
          </label>
        </div>
      </div>
      <div className="main-grid" style={{
      gridTemplateColumns: "240px 170px 600px 350px",
      gap: "22px"
    }}>
        <BlockPaletteSidebar onBlockAdd={handleBlockAdd} />
      <div className="panel left-panel" style={{ padding: 9, display: "flex", flexDirection: "column", gap: 12, minWidth: 170 }}>
        <div
          className="robot-selector"
          style={{
            flex: 1,
            marginBottom: 0,
            gap: 6,
            display: "flex",
            flexDirection: "column",
            maxHeight: "280px",
            minHeight: "120px",
            overflowY: "auto",
            border: "1px solid #ececec",
            borderRadius: 7,
            background: "#fefefe",
            boxShadow: "0 1px 4px #0001",
            padding: "6px 0"
          }}
        >
          {sprites.map(sprite => (
            <button
              key={sprite.id}
              className={`robot-btn${selectedId === sprite.id ? " selected" : ""}`}
              onClick={() => {
                setSelectedId(sprite.id);
                setUndoStack([]);
                setRedoStack([]);
              }}
              style={{
                marginBottom: 3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "flex",
                alignItems: "center",
                gap: 7
              }}
            >
              <img src={sprite.src} alt="" width={22} height={22} style={{ borderRadius: 4, marginRight: 4 }} />
              {sprite.name}
            </button>
          ))}
        </div>
          <div
            className="robot-gallery"
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 7,
              padding: "7px 2px",
              background: "#f8fbff",
              borderRadius: 8,
              boxShadow: "0 1px 6px #0001",
              alignItems: "center",
              justifyContent: "flex-start",
              overflowX: "auto",
              overflowY: "hidden",
              maxWidth: "100%",
              minHeight: 42,
              scrollbarWidth: "thin",
              WebkitOverflowScrolling: "touch"
            }}
          >
            {ROBOT_SVGS.map(src => (
              <button
                key={src}
                onClick={() => handlePresetRobotChange(src)}
                className={`robot-gallery-btn${sprites.find(s => s.id === selectedId)?.src === src ? " selected" : ""}`}
                title="Choose robot"
                style={{
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #eee",
                  borderRadius: 8,
                  background: "#fff",
                  padding: 1,
                  margin: 0,
                  flex: "0 0 auto"
                }}
              >
                <img src={src} alt="preset robot" style={{ width: 28, height: 28, objectFit: "contain" }} />
              </button>
            ))}
          </div>
          <label className="robot-btn" style={{
            marginTop: "9px",
            background: "#e4c1f9",
            width: "100%",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            justifyContent: "center"
          }}>
            <span role="img" aria-label="image">🖼️</span> Change Image
            <input
              type="file"
              accept=".svg,image/*"
              onChange={handleRobotImageChange}
              style={{ display: "none" }}
            />
          </label>
          {/* Add/Remove Sprite Buttons */}
          <div style={{ display: "flex", gap: 8, marginTop: 11, justifyContent: "center" }}>
            <button
              className="robot-btn"
              style={{ background: "#b2f7b8", color: "#222", fontWeight: 700, flex: 1 }}
              onClick={handleAddSprite}
              title="Add a new robot"
            >
              ＋ Add Robot
            </button>
            <button
              className="robot-btn"
              style={{ background: "#f7b2b2", color: "#222", fontWeight: 700, flex: 1 }}
              onClick={handleRemoveSprite}
              disabled={sprites.length === 1}
              title="Remove selected robot"
            >
              － Remove
            </button>
          </div>
        </div>
       <div className="panel center-panel">
  <div className="stage" style={stageStyle} onClick={async () => await handleStageClick()}>
    <div
      style={{
        position: "absolute",
        left: GOAL_POS.x,
        top: GOAL_POS.y,
        width: GOAL_POS.r,
        height: GOAL_POS.r,
        borderRadius: "50%",
        background: won ? "limegreen" : "gold",
        border: "2px solid #333",
        zIndex: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 28,
        boxShadow: won ? "0 0 20px 6px #4f4" : "0 0 8px 3px #fd0",
        transition: "box-shadow 0.3s"
      }}
    >🏁</div>
    {sprites.map(sprite => (
      <Sprite
        key={sprite.id}
        x={sprite.x}
        y={sprite.y}
        src={sprite.src}
        alt={sprite.name}
        selected={sprite.id === selectedId}
        color={sprite.color}
        say={sprite.say}
        angle={sprite.angle}
        flash={!!flashRobot[sprite.id]}
        onClick={async () => {
          setSelectedId(sprite.id);
          setUndoStack([]);
          setRedoStack([]);
          await handleRobotSpriteClick(sprite.id);
        }}
        visible={sprite.visible}
        size={sprite.size}
        highlight={sprite.highlight}
      />
    ))}
    {won && (
      <div style={{
        position: "absolute", left: 190, top: 40, zIndex: 9, color: "#18cf18", fontSize: 38, fontWeight: 800,
        textShadow: "2px 2px 14px #fff,0 0 16px #0008"
      }}>
        Goal reached!
      </div>
    )}
  </div>
</div>
      <div className="panel right-panel">
        <CodingPanel
          program={sprites.find(s => s.id === selectedId)?.program || []}
          setProgram={setProgram}
          onRun={runSelected}
          onRunAll={runAll}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          running={running}
        />
      </div>
    </div>
    <div className="tip-footer">
      <span>
        Robot Lab is an interactive coding platform where you can visually program robots using drag-and-drop blocks. Create and customize multiple robots, design their behavior, and run or test your programs instantly. Features include undo/redo, project saving and loading, and a clean, modern interface for a seamless learning and coding experience.
      </span>
    </div>
  </div>
  );
}