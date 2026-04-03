# CLAUDE.md — Tower Game

This document is the authoritative reference for AI assistants working in this repository. It covers architecture, conventions, workflows, and key patterns to follow.

---

## Repository Overview

**Tower Game** is a mobile-first, single-player, HTML5 Canvas tower-stacking game. Players drop blocks onto a swinging hook to build the highest tower possible. Built with vanilla JavaScript (ES6+) and a custom game engine library (`cooljs`), it targets iOS 9+ and Android 4+.

- **Source:** ~1,100 lines of JS across 11 files in `src/`
- **License:** ISC
- **Mobile-first:** Touch and mouse input, responsive viewport scaling

---

## Project Structure

```
tower_game/
├── index.js              # Express dev server (serves assets + index.html)
├── index.html            # Main HTML entry: game config, UI, loading screen
├── package.json          # NPM config, scripts, dependencies
├── .babelrc              # Babel config (targets iOS ≥9, Android ≥4)
│
├── src/                  # All game source code
│   ├── index.js          # Game factory: TowerGame(option) — initialization
│   ├── constant.js       # All constants and variable key names
│   ├── utils.js          # Helpers: scoring, velocity, input, difficulty
│   ├── block.js          # Core: block physics, collision, state machine
│   ├── hook.js           # Hook swinging mechanics
│   ├── background.js     # Dual-layer background: gradient + parallax scroll
│   ├── cloud.js          # Obstacle/cloud sprites
│   ├── flight.js         # Decorative flying sprites
│   ├── line.js           # Landing platform tracking
│   ├── tutorial.js       # Tutorial overlay rendering
│   └── animateFuncs.js   # Game loop: spawning, UI rendering (score, hearts)
│
├── dist/
│   └── main.js           # Webpack production bundle (auto-generated, do not edit)
│
└── assets/               # Static game assets
    ├── *.png             # Sprites and UI images
    ├── *.mp3 / *.ogg    # Audio files (both formats for cross-browser)
    └── wenxue.*          # Custom font (eot, ttf, woff, svg)
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Game Engine | `cooljs` v1.0.2 — Canvas game loop, asset loading, instance management |
| Bundler | Webpack 4 |
| Transpiler | Babel 7 (`@babel/preset-env`, targets iOS ≥9, Android ≥4) |
| Dev Server | Express 4 (port 8082) |
| DOM Utilities | Zepto.js 1.1.6 (jQuery-like, loaded from `assets/`) |
| Analytics | Google Analytics (`gtag`) — configured in `index.html` |
| Language | JavaScript ES6+ with ES module syntax |

---

## Development Workflow

### Setup

```bash
npm install
```

### Development / Running

```bash
npm start       # Runs: npm run build && node index.js
                # Builds dist/main.js, starts server on http://localhost:8082
                # Auto-opens browser
```

### Build Only

```bash
npm run build   # webpack --mode production --module-bind js=babel-loader
                # Output: dist/main.js (minified bundle)
```

### Testing

There is **no automated test suite**. Testing is done by playing the game manually in the browser.

---

## Architecture: cooljs Engine Patterns

All game logic is built around two `cooljs` primitives:

### Instance
Every visible game object is a `cooljs` Instance with:
- **`action(instance, engine, time)`** — called each frame; update position, velocity, state
- **`painter(instance, engine)`** — called each frame after action; draw to canvas

### Engine
The `engine` object is passed to every action/painter function and provides:
- `engine.getVariable(key)` / `engine.setVariable(key, value)` — global game state store
- `engine.width` / `engine.height` — canvas dimensions
- `engine.getTimeMovement(duration, easing)` — interpolated animation value (0→1)
- `engine.addImg(key, url)` / `engine.getImg(key)` — image asset management
- `engine.addAudio(key, url)` / `engine.playAudio(key)` / `engine.pauseAudio(key)`
- `engine.addInstance(name, instance)` / `engine.getInstance(name)`

### Game Initialization Flow

```
index.html loads
  └─► TowerGame(option) called (src/index.js)
        ├─ Creates Engine instance
        ├─ Loads all images and audio assets asynchronously
        ├─ Creates initial instances: clouds (c0-c3), hook, line, tutorial
        ├─ Sets up variable store with defaults (from constant.js keys)
        └─ Exposes public API: load(), init(), playBgm(), pauseBgm(), start()
```

---

## Global State (Variable Store)

All game state is stored via `engine.setVariable()` / `engine.getVariable()`. The keys are string constants defined in `src/constant.js`. **Always use the constants, never raw strings.**

| Constant Key | Type | Description |
|---|---|---|
| `GAME_START_NOW` | boolean | Whether a game session is active |
| `BLOCK_COUNT` | number | Total blocks spawned (0-indexed floor count) |
| `SUCCESS_COUNT` | number | Successfully placed blocks (drives difficulty) |
| `FAILED_COUNT` | number | Misses (0–3; game over at 3) |
| `GAME_SCORE` | number | Current score |
| `PERFECT_COUNT` | number | Consecutive perfect placements (bonus multiplier) |
| `HARD_MODE` | boolean | Anti-cheat flag; set if block lands out-of-bounds |
| `BLOCK_WIDTH` | number | Current block pixel width |
| `BLOCK_HEIGHT` | number | Current block pixel height |
| `CLOUD_SIZE` | number | Cloud sprite scaling |
| `ROPE_HEIGHT` | number | Hook rope length |
| `FLIGHT_COUNT` | number | Index for flight sprite cycling |

---

## Block State Machine

Blocks follow a strict lifecycle managed in `blockAction` (`src/block.js`):

```
swing
  └─► beforeDrop  (user taps / enters)
        └─► drop  (falling with gravity)
              ├─► land        (successful placement)
              ├─► rotateLeft  (tilted landing, starts rotation)
              ├─► rotateRight (tilted landing, opposite direction)
              └─► out         (missed platform entirely)
```

Collision detection (`checkCollision`) returns a status code (0–5) mapping to these states.

**Perfect landing:** Block center lands within ±10% of block width of platform center.

---

## Naming Conventions

| Category | Convention | Example |
|---|---|---|
| Constants | `UPPER_SNAKE_CASE` | `GAME_START_NOW`, `BLOCK_WIDTH` |
| Functions | `camelCase` | `getSwingBlockVelocity`, `addSuccessCount` |
| Variables | `camelCase` | `blockCount`, `gameScore` |
| Instances | `prefix_index` | `block_0`, `cloud_1`, `tutorial-arrow` |
| Imports | Wildcard for constants | `import * as constant from './constant'` |

---

## Key Functions Reference

| Function | File | Purpose |
|---|---|---|
| `TowerGame(option)` | `src/index.js` | Game factory; creates and starts engine |
| `blockAction(instance, engine, time)` | `src/block.js` | Block physics update per frame |
| `blockPainter(instance, engine)` | `src/block.js` | Block rendering |
| `checkCollision(block, line)` | `src/block.js` | Returns landing status code |
| `hookAction(instance, engine, time)` | `src/hook.js` | Hook angular swing update |
| `startAnimate(engine)` | `src/animateFuncs.js` | Start-of-frame: spawning logic |
| `endAnimate(engine)` | `src/animateFuncs.js` | End-of-frame: HUD rendering |
| `touchEventHandler(engine)` | `src/utils.js` | Processes tap/click → drop block |
| `getSwingBlockVelocity(engine, time)` | `src/utils.js` | Difficulty-scaled swing speed |
| `getLandBlockVelocity(engine, time)` | `src/utils.js` | Sway speed after landing |
| `addSuccessCount(engine)` | `src/utils.js` | Records successful block, updates difficulty |
| `addFailedCount(engine)` | `src/utils.js` | Records miss, checks for game over |
| `addScore(engine, isPerfect)` | `src/utils.js` | Computes and applies score delta |

---

## Physics Constants (Magic Numbers to Know)

- **Gravity:** `0.0003 * engine.height` per frame² (applied in drop state)
- **Perfect threshold:** ±10% of `BLOCK_WIDTH` from platform center
- **Difficulty scaling:** Hook angle and block speed increase with `SUCCESS_COUNT`
- **Max failures:** 3 (FAILED_COUNT ≥ 3 triggers game over)

---

## Customization Hooks (option object in index.html)

The game is configured via an `option` object passed to `TowerGame(option)`. These are defined in `index.html` and documented in `README.md`:

| Option | Type | Description |
|---|---|---|
| `hookSpeed` | function | Returns angular velocity override |
| `hookAngle` | function | Returns max swing angle override |
| `landBlockSpeed` | function | Returns sway speed on land |
| `setGameScore(score)` | function | Called when score changes |
| `setGameSuccess(score)` | function | Called on game completion |
| `setGameFailed(score)` | function | Called on game over |

---

## Important Conventions for AI Assistants

1. **Never edit `dist/main.js` directly.** It is auto-generated by Webpack. Edit files in `src/` only.

2. **Use constants from `src/constant.js`** for all variable store keys. Never use raw strings as state keys.

3. **Maintain the action/painter separation.** Logic goes in `action()`, drawing goes in `painter()`. Never draw in action functions.

4. **Audio must have both `.mp3` and `.ogg` variants** in `assets/` for cross-browser/mobile compatibility.

5. **All difficulty scaling** should be based on `SUCCESS_COUNT` (not `BLOCK_COUNT`), as `SUCCESS_COUNT` only counts successful placements.

6. **No automated tests exist.** When making logic changes, manually verify by running `npm start` and testing gameplay.

7. **Zepto (not jQuery or vanilla DOM)** is available for DOM manipulation in `index.html` scripts. Do not add jQuery.

8. **The dev server is port 8082.** Do not change this without updating the Express config in root `index.js`.

9. **Mobile-first:** All new features must work with touch events. Use the existing `touchStartListener` / `touchEventHandler` pattern from `src/utils.js`.

10. **No TypeScript, no JSX, no CSS preprocessors** — keep the stack plain JS/HTML/CSS with Webpack/Babel.

---

## Git Branch

Active development branch: `claude/add-claude-documentation-qRMb1`

The `master` branch is the stable production branch. All AI-driven changes should be committed and pushed to the feature branch above.
