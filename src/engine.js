import * as PIXI from "pixi.js";
import { Howl } from "howler";
import { setState, getState, resetState } from "./state";
import { setTween, checkTween, getTween } from "./tween";

/**
 * createEngine — PixiJS-based drop-in replacement for cooljs Engine.
 * Returns an async-constructed object whose API mirrors what the rest of the
 * codebase expects from the cooljs Engine instance.
 */
export async function createEngine({ canvasId, width, height, soundOn = true }) {

  // ── PixiJS Application ──────────────────────────────────────────────────
  const app = new PIXI.Application();
  await app.init({
    canvas: document.getElementById(canvasId),
    width,
    height,
    backgroundColor: 0x000000,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
  });

  // ── Rendering layers (back → front) ─────────────────────────────────────
  const layers = {
    bg:      new PIXI.Container(),
    clouds:  new PIXI.Container(),
    flight:  new PIXI.Container(),   // constant.flightLayer
    blocks:  new PIXI.Container(),
    hook:    new PIXI.Container(),
    line:    new PIXI.Container(),
    hud:     new PIXI.Container(),
    overlay: new PIXI.Container(),   // tutorial / effects
  };
  Object.values(layers).forEach(l => app.stage.addChild(l));

  // ── Asset queues ─────────────────────────────────────────────────────────
  const imgQueue  = [];   // { alias, src }
  const textures  = {};   // alias → PIXI.Texture
  const sounds    = {};   // alias → Howl

  // ── Instance registry ────────────────────────────────────────────────────
  const instances = {};   // name → instance object

  // ── Accumulated time for tween system ───────────────────────────────────
  let _now = 0;
  app.ticker.add((ticker) => { _now += ticker.deltaMS; });

  // ── Helpers ──────────────────────────────────────────────────────────────
  const utils = {
    random: (min, max) => min + Math.random() * (max - min),
    randomPositiveNegative: () => (Math.random() > 0.5 ? 1 : -1),
  };

  /** Mirrors cooljs pixelsPerFrame: converts a "base pixels at 60 fps" to per-frame value. */
  const pixelsPerFrame = (base) => base / 60;

  // ── Engine object ────────────────────────────────────────────────────────
  const engine = {
    // Dimensions (read-only)
    width,
    height,
    get calWidth() { return width; },  // cooljs compat

    app,
    layers,
    soundOn,
    utils,
    pixelsPerFrame,
    debug: false,
    paused: false,

    // ── State ──────────────────────────────────────────────────────────────
    setVariable: setState,
    getVariable: getState,
    resetState,

    // ── Tween ──────────────────────────────────────────────────────────────
    setTimeMovement: (key, durationMs) => setTween(key, durationMs),
    checkTimeMovement: (key) => checkTween(key),
    getTimeMovement: (key, ranges, onValue, options) =>
      getTween(key, _now, ranges, onValue, options),

    // ── Images ─────────────────────────────────────────────────────────────
    addImg: (alias, src) => imgQueue.push({ alias, src }),

    /** Returns the loaded PIXI.Texture for alias. */
    getTexture: (alias) => textures[alias] || PIXI.Texture.EMPTY,

    // Legacy compat: modules call engine.getImg(); return the texture so
    // callers can use it as a Sprite source.
    getImg: (alias) => textures[alias] || PIXI.Texture.EMPTY,

    // ── Audio ───────────────────────────────────────────────────────────────
    addAudio: (alias, src) => {
      if (!soundOn) return;
      const oggSrc = src.replace(/\.mp3$/, ".ogg");
      sounds[alias] = new Howl({ src: [src, oggSrc], preload: false });
    },
    playAudio: (alias, loop = false) => {
      if (!soundOn) return;
      const s = sounds[alias];
      if (!s) return;
      s.loop(loop);
      if (!s.playing()) s.play();
    },
    pauseAudio: (alias) => {
      const s = sounds[alias];
      if (s) s.pause();
    },

    // ── Instances ───────────────────────────────────────────────────────────
    /**
     * addInstance(inst, layerName?)
     * inst must have: { name, container, tickFn?, layer?, visible }
     */
    addInstance: (inst, layerName) => {
      const key = layerName || inst.layer || "blocks";
      const targetLayer = layers[key] || layers.blocks;
      targetLayer.addChild(inst.container);
      instances[inst.name] = inst;

      if (inst.tickFn) {
        const wrapped = (ticker) => {
          if (inst.visible === false) return;
          inst.tickFn(ticker.deltaMS, _now);
        };
        inst._pixiTickerFn = wrapped;
        app.ticker.add(wrapped);
      }
    },

    getInstance: (name) => instances[name] || null,

    removeInstance: (name) => {
      const inst = instances[name];
      if (!inst) return;
      if (inst._pixiTickerFn) app.ticker.remove(inst._pixiTickerFn);
      if (inst.container && !inst.container.destroyed) {
        inst.container.destroy({ children: true });
      }
      delete instances[name];
    },

    // addLayer / swapLayer are no-ops (layers are pre-created)
    addLayer: () => {},
    swapLayer: () => {},

    // Misc compat
    debugLineY: () => {},
    togglePaused: () => {},
    addKeyDownListener: (key, cb) => {
      if (key === "enter") {
        window.addEventListener("keydown", (e) => {
          if (e.key === "Enter") cb();
        });
      }
    },

    // ── Load & Init ─────────────────────────────────────────────────────────
    load: (onComplete, onProgress) => {
      const total = imgQueue.length;
      if (total === 0) {
        if (onProgress) onProgress({ success: 1, total: 1, failed: 0 });
        if (onComplete) onComplete();
        return;
      }

      let loaded = 0;
      const promises = imgQueue.map(({ alias, src }) =>
        PIXI.Assets.load(src)
          .then((tex) => {
            textures[alias] = tex;
            loaded += 1;
            if (onProgress) onProgress({ success: loaded, total, failed: 0 });
          })
          .catch(() => {
            loaded += 1;
            if (onProgress) onProgress({ success: loaded, total, failed: 1 });
          })
      );

      Promise.all(promises).then(() => {
        if (onComplete) onComplete();
      });
    },

    init: () => {},  // no-op; ticker starts automatically
  };

  return engine;
}
