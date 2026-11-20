// SUPPLIED: button creation and input registration. You call connect() once from src/app.ts.
//
// connect(genre, handlers) builds ONE of the two domain-action panels inside #actions:
//   treasure -> North / East / South / West buttons, each calling handlers.dispatch({ type: "move", direction })
//   range    -> Hit / Miss buttons, each calling handlers.dispatch({ type: "hit" }) or ({ type: "miss" })
// and wires the lifecycle buttons already in index.html (#start, #restart, #reload).
// Buttons are ordinary <button> elements, so they work with a keyboard (Tab, Enter/Space);
// no reflex timing or aiming is involved.
//
// playable(enabled) enables or disables the domain-action buttons only. Lifecycle buttons stay usable.
const TREASURE_BUTTONS = [
    ["North", { type: "move", direction: "north" }],
    ["East", { type: "move", direction: "east" }],
    ["South", { type: "move", direction: "south" }],
    ["West", { type: "move", direction: "west" }],
];
const RANGE_BUTTONS = [
    ["Hit", { type: "hit" }],
    ["Miss", { type: "miss" }],
];
let connected = false;
function element(id, kind) {
    const found = document.getElementById(id);
    if (!(found instanceof kind))
        throw new Error(`Supplied page is missing #${id}`);
    return found;
}
export function connect(genre, handlers) {
    // Registering twice would make one click dispatch twice, so a second call is refused.
    if (connected)
        throw new Error("connect() was called more than once; call it once at startup");
    connected = true;
    const panel = element("actions", HTMLElement);
    panel.replaceChildren();
    panel.setAttribute("aria-label", genre === "treasure" ? "Move" : "Record a shot");
    document.body.dataset.genre = genre;
    const buttons = genre === "treasure" ? TREASURE_BUTTONS : RANGE_BUTTONS;
    const dispatch = handlers.dispatch;
    for (const [label, action] of buttons) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.dataset.action = "direction" in action ? action.direction : action.type;
        button.className = "action";
        // A fresh copy each time, so the rules can never change the panel's own object.
        button.addEventListener("click", () => dispatch({ ...action }));
        panel.append(button);
    }
    element("start", HTMLButtonElement).addEventListener("click", () => handlers.start());
    element("restart", HTMLButtonElement).addEventListener("click", () => handlers.restart());
    element("reload", HTMLButtonElement).addEventListener("click", () => handlers.reload());
}
/** Enable (true) or disable (false) every domain-action button. */
export function playable(enabled) {
    for (const button of document.querySelectorAll("#actions button")) {
        button.disabled = !enabled;
    }
}
//# sourceMappingURL=controls.js.map