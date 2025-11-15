import "./styles/main.css";

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
