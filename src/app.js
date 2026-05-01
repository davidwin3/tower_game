import "./styles/main.css";
import { createEngine } from "./engine";
import { touchEventHandler } from "./utils";
import { createBackground } from "./background";
import { createLine } from "./line";
import { createCloud } from "./cloud";
import { createHook } from "./hook";
import { createTutorial } from "./tutorial";
import { createLoadingScene } from "./scenes/loading";
import { createGameOverScene } from "./scenes/game-over";
import * as constant from "./constant";
import { startAnimate, endAnimate, resetHud } from "./animateFuncs";

// ── Window sizing ──────────────────────────────────────────────────────────────
var gameWidth  = window.innerWidth;
var gameHeight = window.innerHeight;
var ratio = 1.5;
if (gameHeight / gameWidth < ratio) {
  gameWidth = Math.ceil(gameHeight / ratio);
}
$(".content").css({ height: gameHeight + "px", width: gameWidth + "px" });

// ── App state ──────────────────────────────────────────────────────────────────
var domReady       = false;
var loadError      = false;
var gameStart      = false;
var isRestarting   = false;
var selectedGameMode = null;
var score          = 0;
var successCount   = 0;
var engine         = null;   // current engine instance
var loadingScene   = null;   // current PIXI loading scene
var gameOverScene  = null;   // current PIXI game-over modal

// ── Game options ───────────────────────────────────────────────────────────────
const option = {
  width:    gameWidth,
  height:   gameHeight,
  canvasId: "canvas",
  soundOn:  true,
  setGameScore:   (s) => { score = s; },
  setGameSuccess: (s) => { successCount = s; },
  setGameFailed:  (f) => {
    if (f >= 3 && gameOverScene) gameOverScene.show(score);
  },
};

// Build the game-over modal once textures are loaded. Called after the
// initial load and after every engine.reset() (which destroys the previous
// modal along with the rest of the ui layer).
function buildGameOverScene() {
  if (!engine) return;
  gameOverScene = createGameOverScene(engine, {
    onReload:     handleReload,
    onInvite:     handleInvite,
    onModeSelect: handleModeSelect,
  });
  gameOverScene.hide();
}

// ── TowerGame factory ──────────────────────────────────────────────────────────
window.TowerGame = async (opt = {}) => {
  const {
    width, height, canvasId, soundOn,
    gameMode = "old",
    maxBooks = 39,
  } = opt;

  const eng = await createEngine({ canvasId, width, height, soundOn });
  const pathGen = (p) => `./assets/${p}`;

  // ── Queue images ─────────────────────────────────────────────────────────
  eng.addImg("background",   pathGen("background.png"));
  eng.addImg("hook",         pathGen("hook.png"));
  eng.addImg("blockRope",    pathGen("block-rope.png"));
  eng.addImg("block",        pathGen("block.png"));
  eng.addImg("block-perfect",pathGen("block-perfect.png"));
  eng.addImg("tutorial",       pathGen("tutorial.png"));
  eng.addImg("tutorial-arrow", pathGen("tutorial-arrow.png"));
  eng.addImg("heart",        pathGen("heart.png"));
  eng.addImg("score",        pathGen("score.png"));
  eng.addImg("modal-bg",     pathGen("main-modal-bg.png"));
  eng.addImg("modal-over",   pathGen("main-modal-over.png"));
  eng.addImg("modal-again",  pathGen("main-modal-again-b.png"));
  eng.addImg("modal-invite", pathGen("main-modal-invite-b.png"));
  eng.addImg("modal-mode",   pathGen("main-modal-mode-b.png"));
  eng.addImg("share-icon",   pathGen("main-share-icon.png"));

  const bgPrefix = gameMode === "old" ? "old" : "new";
  for (let i = 1; i <= 8; i++) eng.addImg(`c${i}`, pathGen(`${bgPrefix}-bg-${i}.png`));
  for (let i = 1; i <= 7; i++) eng.addImg(`f${i}`, pathGen(`${bgPrefix}-flight-${i}.png`));

  // ── Queue audio ───────────────────────────────────────────────────────────
  eng.addAudio("drop-perfect", pathGen("drop-perfect.mp3"));
  eng.addAudio("drop",         pathGen("drop.mp3"));
  eng.addAudio("game-over",    pathGen("game-over.mp3"));
  eng.addAudio("rotate",       pathGen("rotate.mp3"));
  eng.addAudio("bgm",          pathGen("bgm.mp3"));

  // ── Initial state variables ───────────────────────────────────────────────
  // Extracted so restart can re-apply them after engine.reset() clears state.
  eng._initState = () => {
    eng.setVariable(constant.blockWidth,  width  * 0.25);
    eng.setVariable(constant.blockHeight, width  * 0.25 * 0.71);
    eng.setVariable(constant.cloudSize,   width  * 0.3);
    eng.setVariable(constant.ropeHeight,  height * 0.4);
    eng.setVariable(constant.blockCount,  0);
    eng.setVariable(constant.successCount, 0);
    eng.setVariable(constant.failedCount,  0);
    eng.setVariable(constant.gameScore,    0);
    eng.setVariable(constant.hardMode,     false);
    eng.setVariable(constant.gameUserOption, opt);
    eng.setVariable(constant.gameMode,    gameMode);
    eng.setVariable(constant.maxBooks,    maxBooks);
    eng.setVariable(constant.gameStartNow, false);
  };
  eng._initState();

  // ── Game-loop callbacks (called from ticker) ──────────────────────────────
  eng.app.ticker.add(() => {
    if (!eng.getVariable(constant.gameStartNow)) return;
    startAnimate(eng);
    endAnimate(eng);
  });

  // ── Public API (mirrors cooljs game object) ───────────────────────────────
  eng.playBgm  = () => eng.playAudio("bgm", true);
  eng.pauseBgm = () => eng.pauseAudio("bgm");

  // Pre-game instances — rendered behind the landing overlay so the canvas
  // already shows an animated background + clouds before the user taps START.
  // Matches the old cooljs behavior (paintUnderInstance + immediate addInstance).
  eng._addPreGameInstances = () => {
    eng.addInstance(createBackground(eng));
    for (let i = 1; i <= 4; i++) eng.addInstance(createCloud(eng, i));
    eng.addInstance(createLine(eng));
    eng.addInstance(createHook(eng));
  };

  eng.start = () => {
    // Tutorial
    const tut      = createTutorial(eng, "tutorial");
    const tutArrow = createTutorial(eng, "tutorial-arrow");
    eng.addInstance(tut);
    eng.addInstance(tutArrow);

    // Kick off tweens
    eng.setTimeMovement(constant.bgInitMovement,   500);
    eng.setTimeMovement(constant.tutorialMovement, 500);
    eng.setVariable(constant.gameStartNow, true);

    // Touch / click handler
    // document 레벨로 등록: .content div가 position:relative로 캔버스 위에 쌓여
    // canvas의 pointerdown을 차단하기 때문에 document에서 감지해야 함
    const onInput = () => touchEventHandler(eng);
    document.addEventListener("pointerdown", onInput);
    document.addEventListener("touchstart", onInput, { passive: true });
    eng._removeInputListeners = () => {
      document.removeEventListener("pointerdown", onInput);
      document.removeEventListener("touchstart", onInput);
    };
  };

  eng.addKeyDownListener("enter", () => {
    if (eng.debug) eng.togglePaused();
  });

  return eng;
};

// ── DOM helpers ────────────────────────────────────────────────────────────────
// Swap the canvas element with a fresh clone. Required before creating a new
// PIXI.Application on mode change — reusing a canvas whose WebGL context has
// been torn down produces flicker and hangs on init.
function replaceCanvasElement() {
  const old = document.getElementById("canvas");
  if (!old || !old.parentNode) return;
  const fresh = document.createElement("canvas");
  fresh.id = "canvas";
  fresh.className = old.className;
  old.parentNode.replaceChild(fresh, old);
}

function updateLoading(status) {
  const { failed } = status;
  if (failed > 0 && !loadError) {
    loadError = true;
    alert("Network error... Please try again.");
    return;
  }
  if (loadingScene) loadingScene.onProgress(status);
}

function onLoadComplete() {
  if (engine && engine._addPreGameInstances) engine._addPreGameInstances();
  buildGameOverScene();
  setTimeout(() => {
    if (loadingScene) {
      loadingScene.destroy();
      loadingScene = null;
    }
    isRestarting = false;
    gameStart = true;
    engine.playBgm();
    setTimeout(engine.start, 400);
    if (window.BibleDailySDK) window.BibleDailySDK.onGameStart();
  }, 1000);
}

async function gameReady() {
  if (!option.gameMode) return;

  engine = await window.TowerGame(option);
  $("#canvas").show();
  loadingScene = createLoadingScene(engine);
  engine.load(onLoadComplete, updateLoading);
}

// ── Event handlers ─────────────────────────────────────────────────────────────
$(".landing .mode-btn").on("click", function () {
  selectedGameMode = $(this).data("mode");
  option.gameMode  = selectedGameMode;
  option.maxBooks  = selectedGameMode === "old" ? 39 : 27;
  loadError = false;

  // Animate landing screen off
  $(".landing .action-1").addClass("slideTop");
  $(".landing .action-2").addClass("slideBottom");
  setTimeout(() => { $(".landing").hide(); }, 950);

  const isWechat = navigator.userAgent.toLowerCase().indexOf("micromessenger") !== -1;
  if (isWechat) {
    document.addEventListener("WeixinJSBridgeReady", gameReady, false);
  } else {
    gameReady();
  }
});

function handleReload() {
  if (!selectedGameMode) {
    window.location.href = window.location.href.split("?")[0] + "?s=" + +new Date();
    return;
  }
  gameStart    = false;
  score        = 0;
  successCount = 0;

  if (!engine) {
    isRestarting = true;
    loadError    = false;
    gameReady();
    return;
  }

  // In-place restart — reuse the existing PIXI.Application. Destroying and
  // recreating the Pixi app on the same canvas is brittle (stale WebGL
  // context, dangling tickers), so we clear state instead. engine.reset()
  // also destroys the game-over scene's container (it lives in layers.ui),
  // so we rebuild it after re-adding pre-game instances.
  engine.reset();
  resetHud();
  gameOverScene = null;
  engine._initState();
  engine._addPreGameInstances();
  buildGameOverScene();
  gameStart = true;
  engine.playBgm();
  setTimeout(engine.start, 400);
}

function handleInvite() {
  $(".wxShare").show();
}

$(".wxShare").on("click", function () { $(".wxShare").hide(); });

function handleModeSelect() {
  gameStart    = false;
  score        = 0;
  successCount = 0;

  if (engine) {
    engine.destroy();
    resetHud();
    replaceCanvasElement();
    engine = null;
    gameOverScene = null;
  }

  selectedGameMode = null;
  option.gameMode  = null;
  option.maxBooks  = null;

  // Return to landing screen
  $(".landing .action-1").removeClass("slideTop");
  $(".landing .action-2").removeClass("slideBottom");
  $(".landing").show();
}

window.addEventListener("load", () => {
  domReady = true;
  setTimeout(() => {
    $(".landing").show();
  }, 500);
});
