# Wonder Build — Right Panel Tabs

This page explains the **Right Panel** tabs in the Wonder Build builder.

The Right Panel is where you edit the currently selected element. Tabs are separated by intent:

- **Content**: what it *says* / what it *contains*
- **Media**: what it *shows*
- **Wiring**: what it *does*
- **AI**: how to *generate / refactor* using prompts

---

## A — Content

Use **Content** to edit the element’s *meaning* and *content fields*.

Typical edits:
- Headline / paragraph text
- Button label text
- Link URLs (if the element supports it)
- Any basic “content-like” props tied to the element

When to use:
- “Change this text”
- “Rename the button”
- “Update this URL”
- “Edit this paragraph copy”

---

## B — Media

Use **Media** to edit what the element *renders as media*.

Typical edits:
- Image `src` (URL)
- Video `src` (URL)
- Alt text / captions (if supported)
- Fit/crop behavior (object-fit)
- Media sizing related fields (if your block supports them)

When to use:
- “Swap this image”
- “Set the hero image”
- “Change the video URL”
- “Make it cover/contain”

---

## C — Wiring

Use **Wiring** to connect behaviors and interactions.

Typical edits:
- Click/tap actions (navigate, open, toggle)
- Events and triggers
- Connecting elements together (flows)
- “When X happens, do Y”

When to use:
- “On click, go to /pricing”
- “Open a modal when tapped”
- “Connect this button to an action”
- “Trigger a behavior / animation”

---

## D — AI

Use **AI** to let the AI orchestrate changes.

Typical uses:
- Generate a section from prompt
- Rewrite copy in the selected element
- Suggest styles or layout improvements
- Create multiple blocks from a description

When to use:
- “Add a pricing section”
- “Rewrite this headline more confidently”
- “Make this layout modern”
- “Generate a landing page section”

---

## Troubleshooting: “I dropped a block but can’t see it”

If a block is dropped near the **right edge** or **bottom**, and it seems “missing,” it usually spawned **off-canvas** due to incorrect drop coordinate math.

Fix is in the builder drop engine:
- convert `clientX/clientY` → canvas-local coordinates
- clamp spawn position to visible bounds
- optionally center/scroll to the newly created node

If you want, search for your drop handler and apply the clamp fix:
- look for `onDrop`, `clientX`, `clientY`, `dataTransfer`, `handleDrop`
