import "./styles/main.css";
import { Engine, Instance } from "cooljs";
import { touchEventHandler } from "./utils";
import { background } from "./background";
import { lineAction, linePainter } from "./line";
import { cloudAction, cloudPainter } from "./cloud";
import { hookAction, hookPainter } from "./hook";
import { tutorialAction, tutorialPainter } from "./tutorial";
import * as constant from "./constant";
import { startAnimate, endAnimate } from "./animateFuncs";

window.TowerGame = (option = {}) => {
  const {
    width,
    height,
    canvasId,
    soundOn,
    gameMode = "old", // 기본값: 구약
    maxBooks = 39,
  } = option;
  const game = new Engine({
    canvasId,
    highResolution: true,
    width,
    height,
    soundOn,
  });
  const pathGenerator = (path) => `./assets/${path}`;

  // 기본 게임 이미지
  game.addImg("background", pathGenerator("background.png"));
  game.addImg("hook", pathGenerator("hook.png"));
  game.addImg("blockRope", pathGenerator("block-rope.png"));
  game.addImg("block", pathGenerator("block.png"));
  game.addImg("block-perfect", pathGenerator("block-perfect.png"));

  // 모드별 배경 이미지 로딩 (c1-c8 대체)
  const backgroundPrefix = gameMode === "old" ? "old" : "new";
  for (let i = 1; i <= 8; i += 1) {
    game.addImg(`c${i}`, pathGenerator(`${backgroundPrefix}-bg-${i}.png`));
  }

  // 비행 레이어 추가
  game.addLayer(constant.flightLayer);

  // 모드별 비행 이미지 로딩 (f1-f7 대체)
  for (let i = 1; i <= 7; i += 1) {
    game.addImg(`f${i}`, pathGenerator(`${backgroundPrefix}-flight-${i}.png`));
  }

  // 모드별 성경책 블록 이미지 로딩
  const maxBooksToLoad = Math.min(maxBooks, 66); // 최대 66권
  for (let i = 1; i <= maxBooksToLoad; i += 1) {
    game.addImg(
      `bible-${i}`,
      pathGenerator(`${backgroundPrefix}-book-${i}.png`)
    );
  }
  game.swapLayer(0, 1);
  game.addImg("tutorial", pathGenerator("tutorial.png"));
  game.addImg("tutorial-arrow", pathGenerator("tutorial-arrow.png"));
  game.addImg("heart", pathGenerator("heart.png"));
  game.addImg("score", pathGenerator("score.png"));
  game.addAudio("drop-perfect", pathGenerator("drop-perfect.mp3"));
  game.addAudio("drop", pathGenerator("drop.mp3"));
  game.addAudio("game-over", pathGenerator("game-over.mp3"));
  game.addAudio("rotate", pathGenerator("rotate.mp3"));
  game.addAudio("bgm", pathGenerator("bgm.mp3"));
  game.setVariable(constant.blockWidth, game.width * 0.25);
  game.setVariable(
    constant.blockHeight,
    game.getVariable(constant.blockWidth) * 0.71
  );
  game.setVariable(constant.cloudSize, game.width * 0.3);
  game.setVariable(constant.ropeHeight, game.height * 0.4);
  game.setVariable(constant.blockCount, 0);
  game.setVariable(constant.successCount, 0);
  game.setVariable(constant.failedCount, 0);
  game.setVariable(constant.gameScore, 0);
  game.setVariable(constant.hardMode, false);
  game.setVariable(constant.gameUserOption, option);
  game.setVariable(constant.gameMode, gameMode);
  game.setVariable(constant.maxBooks, maxBooks);
  for (let i = 1; i <= 4; i += 1) {
    const cloud = new Instance({
      name: `cloud_${i}`,
      action: cloudAction,
      painter: cloudPainter,
    });
    cloud.index = i;
    cloud.count = 5 - i;
    game.addInstance(cloud);
  }
  const line = new Instance({
    name: "line",
    action: lineAction,
    painter: linePainter,
  });
  game.addInstance(line);
  const hook = new Instance({
    name: "hook",
    action: hookAction,
    painter: hookPainter,
  });
  game.addInstance(hook);

  game.startAnimate = startAnimate;
  game.endAnimate = endAnimate;
  game.paintUnderInstance = background;
  game.addKeyDownListener("enter", () => {
    if (game.debug) game.togglePaused();
  });
  game.touchStartListener = () => {
    touchEventHandler(game);
  };

  game.playBgm = () => {
    game.playAudio("bgm", true);
  };

  game.pauseBgm = () => {
    game.pauseAudio("bgm");
  };

  game.start = () => {
    const tutorial = new Instance({
      name: "tutorial",
      action: tutorialAction,
      painter: tutorialPainter,
    });
    game.addInstance(tutorial);
    const tutorialArrow = new Instance({
      name: "tutorial-arrow",
      action: tutorialAction,
      painter: tutorialPainter,
    });
    game.addInstance(tutorialArrow);
    game.setTimeMovement(constant.bgInitMovement, 500);
    game.setTimeMovement(constant.tutorialMovement, 500);
    game.setVariable(constant.gameStartNow, true);
  };

  return game;
};

var domReady,
  loadFinish,
  canvasReady,
  loadError,
  gameStart,
  game,
  score,
  successCount;
// init window height and width
var gameWidth = window.innerWidth;
var gameHeight = window.innerHeight;
var ratio = 1.5;
if (gameHeight / gameWidth < ratio) {
  gameWidth = Math.ceil(gameHeight / ratio);
}
$(".content").css({ height: gameHeight + "px", width: gameWidth + "px" });
$(".js-modal-content").css({ width: gameWidth + "px" });

// loading animation
// 게임 모드 변수
var selectedGameMode = null;

function hideLoading() {
  if (domReady && canvasReady) {
    $("#canvas").show();
    loadFinish = true;
    setTimeout(function () {
      $(".loading").hide();
      $(".mode-selection").show();
    }, 1000);
  }
}

function updateLoading(status) {
  var success = status.success;
  var total = status.total;
  var failed = status.failed;
  if (failed > 0 && !loadError) {
    loadError = true;
    alert("Network error... Please try again.");
    return;
  }
  var percent = parseInt((success / total) * 100);
  if (percent === 100 && !canvasReady) {
    canvasReady = true;
    hideLoading();
  }
  percent = percent > 98 ? 98 : percent;
  percent = percent + "%";
  $(".loading .title").text(percent);
  $(".loading .percent").css({
    width: percent,
  });
}

function overShowOver() {
  $("#modal").show();
  $("#over-modal").show();
  $("#over-zero").show();

  // 성경 모드별 메시지 추가
  if (selectedGameMode) {
    const modeText = selectedGameMode === "old" ? "구약 성경" : "신약 성경";
    const maxBooks = selectedGameMode === "old" ? 39 : 27;
    const completedBooks = Math.min(successCount, maxBooks);

    let message = `${modeText} 모드에서 ${completedBooks}권을 쌓았습니다!`;

    if (completedBooks === maxBooks) {
      message = `🎉 축하합니다! ${modeText} ${maxBooks}권을 모두 완성했습니다! 🎉`;
    } else if (completedBooks >= maxBooks * 0.8) {
      message = `👏 훌륭합니다! ${modeText} ${completedBooks}권을 쌓았습니다!`;
    }

    $(".tip p").text(message);
  }
}

// game customization options
const option = {
  width: gameWidth,
  height: gameHeight,
  canvasId: "canvas",
  soundOn: true,
  setGameScore: function (s) {
    score = s;
  },
  setGameSuccess: function (s) {
    successCount = s;
  },
  setGameFailed: function (f) {
    $("#score").text(score);
    if (f >= 3) overShowOver();
  },
};

// game init with option
function gameReady() {
  game = TowerGame(option);
  game.load(function () {
    game.init();
    setTimeout(function () {
      game.playBgm();
    });
  }, updateLoading);
}

var isWechat =
  navigator.userAgent.toLowerCase().indexOf("micromessenger") !== -1;
if (isWechat) {
  document.addEventListener("WeixinJSBridgeReady", gameReady, false);
} else {
  gameReady();
}

function modeSelectionHide() {
  $(".mode-selection").addClass("slideTop");
  setTimeout(function () {
    $(".mode-selection").hide();
    $(".landing").show();
  }, 950);
}

function indexHide() {
  $(".landing .action-1").addClass("slideTop");
  $(".landing .action-2").addClass("slideBottom");
  setTimeout(function () {
    $(".landing").hide();
  }, 950);
}

// 모드 선택 이벤트
$(".mode-button").on("click", function () {
  selectedGameMode = $(this).data("mode");
  console.log("Selected mode:", selectedGameMode);

  // 선택된 모드에 따라 게임 설정 업데이트
  if (selectedGameMode === "old") {
    option.gameMode = "old";
    option.maxBooks = 39;
  } else {
    option.gameMode = "new";
    option.maxBooks = 27;
  }

  modeSelectionHide();
});

// click event
$("#start").on("click", function () {
  if (gameStart || !selectedGameMode) return;
  gameStart = true;
  setTimeout(function () {
    game.playBgm();
  });
  indexHide();
  setTimeout(game.start, 400);
});

$(".js-reload").on("click", function () {
  window.location.href = window.location.href + "?s=" + +new Date();
});

$(".js-invite").on("click", function () {
  $(".wxShare").show();
});

$(".wxShare").on("click", function () {
  $(".wxShare").hide();
});

// listener
window.addEventListener(
  "load",
  function () {
    domReady = true;
    hideLoading();
  },
  false
);
