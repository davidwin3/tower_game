import "./styles/main.css";
import { createEngine } from "./engine";
import { touchEventHandler } from "./utils";
import { createBackground } from "./background";
import { createLine } from "./line";
import { createCloud } from "./cloud";
import { createHook } from "./hook";
import { createTutorial } from "./tutorial";
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
$(".js-modal-content").css({ width: gameWidth + "px" });

// ── App state ──────────────────────────────────────────────────────────────────
var domReady       = false;
var loadError      = false;
var gameStart      = false;
var isRestarting   = false;
var selectedGameMode = null;
var score          = 0;
var successCount   = 0;
var engine         = null;   // current engine instance

// ── Game options ───────────────────────────────────────────────────────────────
const option = {
  width:    gameWidth,
  height:   gameHeight,
  canvasId: "canvas",
  soundOn:  true,
  setGameScore:   (s) => { score = s; },
  setGameSuccess: (s) => { successCount = s; },
  setGameFailed:  (f) => {
    $("#score").text(score);
    if (f >= 3) overShowOver();
  },
};

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
function updateLoading(status) {
  const { success, total, failed } = status;
  if (failed > 0 && !loadError) {
    loadError = true;
    alert("Network error... Please try again.");
    return;
  }
  let percent = Math.min(parseInt((success / total) * 100), 98);
  $(".loading .title").text(percent + "%");
  $(".loading .percent").css({ width: percent + "%" });
}

function onLoadComplete() {
  $("#canvas").show();
  if (engine && engine._addPreGameInstances) engine._addPreGameInstances();
  setTimeout(() => {
    $(".loading").hide();
    if (isRestarting) {
      isRestarting = false;
      gameStart = true;
      engine.playBgm();
      setTimeout(engine.start, 400);
    } else {
      $(".landing").show();
    }
    if (window.BibleDailySDK) window.BibleDailySDK.onGameStart();
  }, 1000);
}

function overShowOver() {
  $("#modal").show();
  $("#over-modal").show();
  $("#over-zero").show();

  if (selectedGameMode) {
    const modeText   = selectedGameMode === "old" ? "구약 성경" : "신약 성경";
    const maxB       = selectedGameMode === "old" ? 39 : 27;
    const completed  = Math.min(successCount, maxB);
    let message      = `${modeText} 모드에서 ${completed}권을 쌓았습니다!`;
    if (completed === maxB) {
      message = `🎉 축하합니다! ${modeText} ${maxB}권을 모두 완성했습니다! 🎉`;
    } else if (completed >= maxB * 0.8) {
      message = `👏 훌륭합니다! ${modeText} ${completed}권을 쌓았습니다!`;
    }
    $(".tip p").text(message);
  }
}

async function gameReady() {
  if (!option.gameMode) return;

  $(".loading .title").text("0%");
  $(".loading .percent").css({ width: "0%" });
  $(".loading").show();

  engine = await window.TowerGame(option);
  engine.load(onLoadComplete, updateLoading);
}

// ── Event handlers ─────────────────────────────────────────────────────────────
$(".mode-button").on("click", function () {
  selectedGameMode = $(this).data("mode");
  option.gameMode  = selectedGameMode;
  option.maxBooks  = selectedGameMode === "old" ? 39 : 27;
  loadError = false;

  const isWechat = navigator.userAgent.toLowerCase().indexOf("micromessenger") !== -1;
  if (isWechat) {
    document.addEventListener("WeixinJSBridgeReady", gameReady, false);
  } else {
    gameReady();
  }

  // Slide mode selection off screen
  $(".mode-selection").addClass("slideTop");
  setTimeout(() => { $(".mode-selection").hide(); }, 950);
});

$("#start").on("click", function () {
  if (gameStart || !selectedGameMode) return;
  gameStart = true;
  $(".landing .action-1").addClass("slideTop");
  $(".landing .action-2").addClass("slideBottom");
  setTimeout(() => { $(".landing").hide(); }, 950);
  engine.playBgm();
  setTimeout(engine.start, 400);
});

$(".js-reload").on("click", function () {
  if (!selectedGameMode) {
    window.location.href = window.location.href.split("?")[0] + "?s=" + +new Date();
    return;
  }
  gameStart    = false;
  score        = 0;
  successCount = 0;
  isRestarting = true;
  $("#modal").hide();
  $("#over-modal").hide();
  $("#over-zero").hide();

  if (engine) {
    if (engine._removeInputListeners) engine._removeInputListeners();
    engine.pauseBgm();
    engine.resetState();
    resetHud();
    engine = null;
  }
  loadError = false;
  gameReady();
});

$(".js-invite").on("click", function () { $(".wxShare").show(); });
$(".wxShare").on("click",   function () { $(".wxShare").hide(); });

$(".js-mode-select").on("click", function () {
  $("#modal").hide();
  $("#over-modal").hide();
  $("#over-zero").hide();

  gameStart    = false;
  score        = 0;
  successCount = 0;

  if (engine) {
    if (engine._removeInputListeners) engine._removeInputListeners();
    engine.pauseBgm();
    engine.resetState();
    resetHud();
    engine = null;
  }

  selectedGameMode = null;
  option.gameMode  = null;
  option.maxBooks  = null;

  $(".landing").hide();
  $(".mode-selection").removeClass("slideTop").show();
});

window.addEventListener("load", () => {
  domReady = true;
  // Show mode selection screen immediately (no pre-game load needed)
  setTimeout(() => {
    $(".loading").hide();
    $(".mode-selection").show();
  }, 500);
});
