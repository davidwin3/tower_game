# CLAUDE.md — Tower Game Codebase Guide

This file provides context for AI assistants working on this repository.

## Commit Message Policy (project override)

All commit messages in this repository MUST be written in English, including
when invoked via the `/gc` skill. This overrides any default Korean-language
behavior of the `gc` skill for this project. Follow Conventional Commits
(e.g. `feat:`, `fix:`, `chore:`, `refactor:`) with English subject and body.

**Do NOT include `Co-Authored-By:` trailers** (or any other co-author
attribution) in commit messages or pull request descriptions. This applies
to all tooling including `/gc`, `git commit`, and `gh pr create`.

## Project Overview

**Tower Game** is a mobile-friendly, browser-based tower-stacking game built with HTML5 Canvas and ES6 JavaScript. It's a Bible-themed adaptation of the classic "Tower Bloxx" mechanic where players tap to release a swinging block and stack it precisely on a growing tower.

**Key characteristics:**
- Two game modes: Old Testament (39 books) and New Testament (27 books)
- Each block displays a Bible book name; completing all books wins the game
- Integrates with an external `window.BibleDailySDK` API for analytics
- Mobile-first, targeting iOS >= 9 and Android >= 4

---

## Repository Structure

```
tower_game/
├── src/                   # All source code
│   ├── app.js             # Main entry point — game init, DOM events, mode selection
│   ├── bible-config.js    # Bible book data (66 books), game modes, image mappings
│   ├── constant.js        # All engine state keys (SCREAMING_SNAKE_CASE)
│   ├── utils.js           # Physics helpers, scoring logic, text rendering
│   ├── block.js           # Block movement, collision detection, Bible text rendering
│   ├── hook.js            # Rope/hook swing animation and rendering
│   ├── line.js            # Collision detection line
│   ├── cloud.js           # Background cloud animation
│   ├── background.js      # Background image rendering
│   ├── flight.js          # Flying milestone animation effects
│   ├── tutorial.js        # Tutorial overlay
│   ├── animateFuncs.js    # Start/end animation sequences, score/floor/heart updates
│   ├── index.html         # HTML template: canvas, mode selection UI, modals
│   └── styles/main.css    # Full stylesheet (510 lines)
├── assets/                # Static assets (copied to dist as-is)
│   ├── old-bg-1~8.png     # OT mode backgrounds
│   ├── new-bg-1~8.png     # NT mode backgrounds
│   ├── old-flight-1~7.png # OT milestone animations
│   ├── new-flight-1~7.png # NT milestone animations
│   ├── block.png, block-perfect.png, block-rope.png
│   ├── bgm.mp3/ogg, drop.mp3/ogg, drop-perfect.mp3/ogg, ...
│   └── zepto-1.1.6.min.js # jQuery-like DOM library (loaded via script tag)
├── bible-config.js        # Duplicate at root — used as a standalone data module
├── webpack.config.js      # Build config
├── .babelrc               # Babel config (targets iOS>=9, Android>=4)
├── package.json           # Scripts and dependencies
├── README.md              # English docs (game rules, customization options)
├── README.zh-CN.md        # Chinese docs
└── README-BIBLE.md        # Bible mode feature documentation
```

---

## Development Commands

```bash
npm install          # Install dependencies (first time setup)
npm run dev          # Start webpack dev server → http://localhost:8082 (hot reload)
npm run build        # Production build → /dist/
npm run clean        # Remove /dist/ folder
```

> **Node 17+ users:** If build fails with OpenSSL errors, prefix with:
> `NODE_OPTIONS="--openssl-legacy-provider" npm run build`

**No test suite is configured.** Manual testing via browser is the only test method.

---

## Architecture & Key Patterns

### Game Engine (cooljs)
The game uses `cooljs` (v1.0.2), a custom canvas game engine. Key engine APIs:

```javascript
import Engine from 'cooljs';

const engine = new Engine({ canvasId, width, height });

// State management
engine.setVariable(CONSTANT_KEY, value);
engine.getVariable(CONSTANT_KEY);

// Instance system — every game object has action + painter
engine.addInstance(new Instance({
  name: 'myObject',
  action(engine) { /* update logic, runs every frame */ },
  painter(engine, ctx) { /* render logic */ }
}));

// Asset loading
engine.loadImages({ key: 'path/to/image.png', ... });
engine.loadAudio({ key: 'path/to/sound.mp3', ... });

// Time-based animation (tweening)
engine.setTimeMovement(durationMs, startVal, endVal);
engine.getTimeMovement();

// Audio
engine.playAudio('key');
```

### Action/Painter Pattern
Every game object module exports two functions:
- `xyzAction(engine)` — update game state (physics, collisions)
- `xyzPainter(engine, ctx)` — render to canvas

### State Storage
All mutable game state is stored in the engine via `setVariable`/`getVariable`. Constants for all keys are in `src/constant.js`. Never store game state outside the engine.

### Collision Detection
`line.js` implements 1D collision detection. Collision outcomes are numeric codes (0–5):
- `0` = no collision
- `1` = perfect landing (within ±10% tolerance)
- `2–5` = partial / failed

---

## Game Flow

```
Loading Screen
    ↓ (assets loaded)
Mode Selection (Old Testament / New Testament)
    ↓ (user taps mode)
Landing Screen (Start button)
    ↓ (user taps Start)
Gameplay Loop:
    - Hook swings back and forth
    - User taps → block releases
    - Collision determines: success (25 pts), perfect (50 pts + bonus), or fall (-1 hp)
    - Bible book name displayed on each block
    - After 39/27 successes → win message
    ↓ (3 hp lost OR all books completed)
Game Over / Completion Modal
    - Shows score, books completed
    - Options: Restart, Change Mode, Share
```

---

## Bible Configuration (`bible-config.js`)

Central data file with all 66 Bible books and mode configuration.

```javascript
// Access books
getBibleBooks('old')      // Returns array of 39 OT books
getBibleBooks('new')      // Returns array of 27 NT books
getBibleBook('old', 0)    // Returns { id, name, korean, english }
getGameMode('old')        // Returns { books: 39 }

// Book object shape
{ id: 1, name: "창세기", korean: "창", english: "Genesis" }
```

Image mappings in `BIBLE_CONFIG.IMAGE_MAPPING` define which background/flight images load per mode and floor milestone.

---

## Game Initialization (`app.js`)

The game is exported as a global factory function:

```javascript
window.TowerGame = (option = {}) => { ... }
```

**Option object:**

| Key | Type | Description |
|-----|------|-------------|
| `width` | number | Canvas width |
| `height` | number | Canvas height |
| `canvasId` | string | Target canvas element ID |
| `soundOn` | boolean | Enable audio |
| `gameMode` | `"old"` \| `"new"` | Bible testament mode |
| `maxBooks` | `39` \| `27` | Books to complete for win |
| `hookSpeed(floor, score)` | function | Returns hook swing speed |
| `hookAngle(floor, score)` | function | Returns max swing angle |
| `landBlockSpeed(floor, score)` | function | Returns block drop speed |
| `setGameScore(score)` | function | Callback when score changes |
| `setGameSuccess(count)` | function | Callback on successful placement |
| `setGameFailed(count)` | function | Callback on failed placement |

The returned game object exposes `.start()` and `.playBgm()`.

---

## External SDK Integration

The game fires hooks to an optional external SDK:

```javascript
if (window.BibleDailySDK) {
  window.BibleDailySDK.onGameStart();
  window.BibleDailySDK.onGameFinished(score);
}
```

Always guard with `if (window.BibleDailySDK)` — the SDK may not be present.

---

## Code Conventions

- **Module system:** ES6 `import`/`export`
- **Naming:** camelCase for functions/variables; `SCREAMING_SNAKE_CASE` for constant keys
- **Indentation:** 2 spaces
- **Arrow functions** preferred for callbacks
- **Comments:** Some comments are in Korean — do not remove them
- **Debug logs:** `console.log` statements exist for block creation — acceptable to leave
- **No test files** — the project has no test infrastructure

---

## Assets

- Images are in `/assets/` and copied to `/dist/assets/` by `CopyWebpackPlugin`
- Audio comes in both `.mp3` and `.ogg` pairs for browser compatibility
- Mode-specific assets follow naming conventions: `old-bg-N.png` / `new-bg-N.png`
- The font `wenxue` (TTF/EOT/SVG/WOFF) is used for score display

---

## Known Gaps & Future Work

From `README-BIBLE.md`:
1. Real Bible book images (currently using generic block texture)
2. Scripture verse display for each completed book
3. Achievement/badge system
4. Mode-appropriate sound effects
5. Multi-language Bible book names (English, Chinese)

**`npm start` is broken** — references a non-existent `index.js` server. Use `npm run dev` instead.

---

## Branch Strategy

- `master` — stable main branch
- `feature/bible-block` — Bible-themed feature development
- `claude/*` — AI-assisted documentation and tooling branches
