export const BLOCK_CATEGORIES = [
  {
    name: "Motion",
    color: "#4C97FF",
    blocks: [
      { type: "move", label: "Move 1 step", steps: 1 },
      { type: "move", label: "Move 10 steps", steps: 10 },
      { type: "turn", label: "Turn 15° right", degrees: 15 },
      { type: "turn", label: "Turn 15° left", degrees: -15 },
      { type: "go_to_origin", label: "Go to x: 0 y: 0", x: 0, y: 0 },
      { type: "set_x", label: "Set x to 0", x: 0 },
      { type: "set_y", label: "Set y to 0", y: 0 },
      { type: "change_x", label: "Change x by 10", dx: 10 },
      { type: "change_y", label: "Change y by 10", dy: 10 },
      { type: "goto", label: "Go to x: 100 y: 100", x: 100, y: 100 },
      { type: "glide", label: "Glide 1s to x: 50 y: 50", secs: 1, x: 50, y: 50 },
      { type: "point_in_direction", label: "Point in direction 90°", direction: 90 },
      { type: "point_towards", label: "Point towards mouse-pointer", target: "mouse" },
      { type: "if_on_edge_bounce", label: "If on edge, bounce" },
    ],
  },
  {
    name: "Looks",
    blocks: [
      {
        type: "show",
        label: "Show sprite", // No input needed
      },
      {
        type: "hide",
        label: "Hide sprite", // No input needed
      },
      {
        type: "change_size",
        label: "Change size by",
        value: 10, // Default value, but user can edit
        inputType: "number"
      }
    ]
  },
  {
    name: "Sound",
    color: "#FF4C4C",
    blocks: [
      { type: "play_sound", label: "Play Beep Sound", sound: "beep" },
      { type: "play_sound", label: "Play Pop Sound", sound: "pop" },
      { type: "stop_sounds", label: "Stop All Sounds" },
      { type: "set_volume", label: "Set Volume to 80%", volume: 80 },
      { type: "change_volume", label: "Change Volume by 10", delta: 10 },
      { type: "change_volume", label: "Change Volume by -10", delta: -10 },
      { type: "clear_sound_effects", label: "Clear sound effects" },
    ],
  },
  {
    name: "Control",
    color: "#FFAB19",
    blocks: [
      {
        type: "repeat",
        label: "Repeat 10",
        times: 10,
        body: [],
      },
      {
        type: "forever",
        label: "Forever",
        body: [],
      },
      {
        type: "if",
        label: "If (a = b) then",
        condition: { op: "equals", a: 1, b: 1 },
        body: [],
      },
      {
        type: "if_else",
        label: "If (a = b) then / else",
        condition: { op: "equals", a: 1, b: 2 },
        body: [],
        elseBody: [],
      },
     {
        type: "wait",
        label: "Wait",
        value: 1, // Default seconds
        inputType: "number" // Input box for seconds
      },
      {
        type: "for",
        label: "Repeat from",
        varName: "i", // Default loop variable
        from: 1,
        to: 10,
        inputType: "for" // Custom: indicate for-loop UI
      }
    ],
  },
   
  {
    name: "Events",
    color: "#f67280",
    blocks: [
      { type: "when_stage_clicked", label: "When Stage Clicked", body: [] },
      { type: "when_robot_clicked", label: "When Robot Clicked", body: [] },
    ],
  },
  
];