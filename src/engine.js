import { Application, Container, Texture } from "pixi.js";
import { Howl } from "howler";
import { setState, getState, resetState } from "./state";
import { setTween, checkTween, getTween, resetTweens } from "./tween";

/**
 * createEngine — PixiJS-based drop-in replacement for cooljs Engine.
 * Returns an async-constructed object whose API mirrors what the rest of the
 * codebase expects from the cooljs Engine instance.
 */
export async function createEngine({ canvasId, width, height, soundOn = true }) {

  // ── PixiJS Application ──────────────────────────────────────────────────
  const app = new Application();
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
    bg:      new Container(),
    clouds:  new Container(),
    flight:  new Container(),   // constant.flightLayer
    blocks:  new Container(),
    hook:    new Container(),
    line:    new Container(),
    hud:     new Container(),
    overlay: new Container(),   // tutorial / effects
    ui:      new Container(),   // full-screen scenes: loading, modals, share
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
    getTexture: (alias) => textures[alias] || Texture.EMPTY,

    // Legacy compat: modules call engine.getImg(); return the texture so
    // callers can use it as a Sprite source.
    getImg: (alias) => textures[alias] || Texture.EMPTY,

    // ── Audio ───────────────────────────────────────────────────────────────
    addAudio: (alias, src) => {
      if (!soundOn) return;
      const oggSrc = src.replace(/\.mp3$/, ".ogg");
      const isBgm = alias === "bgm";
      sounds[alias] = new Howl({
        src: [src, oggSrc],
        html5: isBgm,   // BGM은 HTML5 Audio로 재생 (모바일 호환성)
      });
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
        new Promise((resolve) => {
          const img = new Image();
          const done = (failed) => {
            loaded += 1;
            if (onProgress) onProgress({ success: loaded, total, failed: failed ? 1 : 0 });
            resolve();
          };
          img.onload = () => {
            try {
              textures[alias] = Texture.from(img);
              done(false);
            } catch (e) {
              done(true);
            }
          };
          img.onerror = () => done(true);
          img.src = src;
        })
      );

      Promise.all(promises).then(() => {
        if (onComplete) onComplete();
      });
    },

    init: () => {},  // no-op; ticker starts automatically

    // ── Reset for restart ───────────────────────────────────────────────────
    // Clears all game state in-place so the same engine/Pixi app can be
    // reused for a new game. Avoids tearing down the PIXI.Application (which
    // is brittle on canvas reuse) while guaranteeing no stale instances,
    // tweens, tickers, HUD nodes, or input listeners leak into the next run.
    reset: () => {
      if (engine._removeInputListeners) {
        engine._removeInputListeners();
        engine._removeInputListeners = null;
      }
      Object.keys(sounds).forEach((alias) => {
        try { sounds[alias].stop(); } catch (e) { /* noop */ }
      });
      Object.values(instances).forEach((inst) => {
        if (inst._pixiTickerFn) {
          try { app.ticker.remove(inst._pixiTickerFn); } catch (e) { /* noop */ }
        }
      });
      Object.keys(instances).forEach((k) => delete instances[k]);
      Object.values(layers).forEach((layer) => {
        const kids = layer.removeChildren();
        kids.forEach((c) => {
          if (c && !c.destroyed) {
            try { c.destroy({ children: true }); } catch (e) { /* noop */ }
          }
        });
      });
      resetState();
      resetTweens();
      _now = 0;
    },

    // ── Full teardown ───────────────────────────────────────────────────────
    // Use when switching game modes: the next run needs a brand-new engine
    // (different image set), so we stop the ticker and tear down the Pixi app.
    // Caller is responsible for replacing the <canvas> element afterwards —
    // reusing the same canvas with a destroyed WebGL context is unreliable.
    destroy: () => {
      if (engine._removeInputListeners) {
        engine._removeInputListeners();
        engine._removeInputListeners = null;
      }
      Object.keys(sounds).forEach((alias) => {
        try { sounds[alias].stop(); sounds[alias].unload(); } catch (e) { /* noop */ }
      });
      // Clear our registry without destroying containers — app.destroy will
      // walk the scene graph itself and double-destroying causes crashes.
      Object.keys(instances).forEach((k) => delete instances[k]);
      resetState();
      resetTweens();
      if (app && !app.destroyed) {
        try { app.ticker.stop(); } catch (e) { /* noop */ }
        try {
          app.destroy({ removeView: false }, { children: true });
        } catch (e) { /* noop */ }
      }
    },
  };

  return engine;
}
