import { Sprite, Text } from "pixi.js";
import { createBlock } from "./block";
import { checkMoveDown, getMoveDownValue, getAngleBase } from "./utils";
import { addFlight } from "./flight";
import * as constant from "./constant";

// ── HUD container (created once, lives in engine.layers.hud) ─────────────────
let hudInitialized = false;
let floorLabel, floorValue, scoreImg, scoreValue, heartSprites;

function initHud(engine) {
  if (hudInitialized) return;
  hudInitialized = true;

  const w = engine.width;
  const hud = engine.layers.hud;

  // "fl" label (small, above the number)
  floorLabel = new Text({
    text: "fl",
    style: { fontFamily: "Arial", fontWeight: "bold", fontSize: w * 0.055, fill: "#FAD961", stroke: { color: "#FFF", width: w * 0.005 } },
  });
  floorLabel.anchor.set(0, 0);
  floorLabel.x = w * 0.03;
  floorLabel.y = w * 0.01;

  // Floor number (below label, left-aligned)
  floorValue = new Text({
    text: "0",
    style: { fontFamily: "wenxue, Arial", fontSize: w * 0.14, fill: "#FAD961", stroke: { color: "#FFF", width: w * 0.014 } },
  });
  floorValue.anchor.set(0, 0);
  floorValue.x = w * 0.02;
  floorValue.y = w * 0.06;

  // Score icon (Sprite)
  scoreImg = new Sprite(engine.getTexture("score"));
  const scoreNatW = scoreImg.texture.width  || 1;
  const scoreNatH = scoreImg.texture.height || 1;
  const scoreW    = w * 0.35;
  scoreImg.width  = scoreW;
  scoreImg.height = (scoreNatH * scoreW) / scoreNatW;
  scoreImg.x      = w * 0.61;
  scoreImg.y      = w * 0.038;

  // Score number (vertically centered within the badge)
  scoreValue = new Text({
    text: "0",
    style: { fontFamily: "wenxue, Arial", fontSize: w * 0.07, fill: "#FAD961", stroke: { color: "#FFF", width: w * 0.007 } },
  });
  scoreValue.anchor.set(1, 0.5);
  scoreValue.x = w * 0.93;
  scoreValue.y = scoreImg.y + scoreImg.height / 2;

  // Heart sprites (3)
  heartSprites = [];
  const heartTex   = engine.getTexture("heart");
  const heartNatW  = heartTex.width  || 1;
  const heartNatH  = heartTex.height || 1;
  const heartW     = w * 0.08;
  const heartH     = (heartNatH * heartW) / heartNatW;
  for (let i = 0; i < 3; i++) {
    const s = new Sprite(heartTex);
    s.width  = heartW;
    s.height = heartH;
    s.x      = w * 0.66 + i * heartW;
    s.y      = w * 0.16;
    heartSprites.push(s);
    hud.addChild(s);
  }

  hud.addChild(floorLabel, floorValue, scoreImg, scoreValue);
}

// ── endAnimate — update HUD values each frame ─────────────────────────────────
export const endAnimate = (engine) => {
  if (!engine.getVariable(constant.gameStartNow)) return;
  initHud(engine);

  const successCount = engine.getVariable(constant.successCount, 0);
  const failedCount  = engine.getVariable(constant.failedCount,  0);
  const gameScore    = engine.getVariable(constant.gameScore,    0);

  floorValue.text  = String(successCount);
  scoreValue.text  = String(gameScore);

  // Heart dimming
  heartSprites.forEach((s, i) => {
    s.alpha = i < failedCount ? 0.2 : 1;
  });
};

// ── startAnimate — spawn next block and trigger flight animations ─────────────
export const startAnimate = (engine) => {
  if (!engine.getVariable(constant.gameStartNow)) return;

  const blockCount = engine.getVariable(constant.blockCount);
  const lastBlock  = engine.getInstance(`block_${blockCount}`);

  if (!lastBlock || [constant.land, constant.out].indexOf(lastBlock.status) > -1) {
    if (checkMoveDown(engine) && getMoveDownValue(engine)) return;
    if (engine.checkTimeMovement(constant.hookUpMovement)) return;

    const angleBase    = getAngleBase(engine);
    const initialAngle =
      (Math.PI *
        engine.utils.random(angleBase, angleBase + 5) *
        engine.utils.randomPositiveNegative()) /
      180;

    const nextCount = blockCount + 1;
    engine.setVariable(constant.blockCount,    nextCount);
    engine.setVariable(constant.initialAngle,  initialAngle);
    engine.setTimeMovement(constant.hookDownMovement, 500);

    const block = createBlock(engine, nextCount);
    engine.addInstance(block);
  }

  // Milestone flight animations
  const successCount = Number(engine.getVariable(constant.successCount, 0));
  switch (successCount) {
    case 2:  addFlight(engine, 1, "leftToRight");    break;
    case 6:  addFlight(engine, 2, "rightToLeft");    break;
    case 8:  addFlight(engine, 3, "leftToRight");    break;
    case 14: addFlight(engine, 4, "bottomToTop");    break;
    case 18: addFlight(engine, 5, "bottomToTop");    break;
    case 22: addFlight(engine, 6, "bottomToTop");    break;
    case 25: addFlight(engine, 7, "rightTopToLeft"); break;
    default: break;
  }
};

/** Call when game restarts so HUD is rebuilt fresh. */
export const resetHud = () => {
  hudInitialized = false;
  floorLabel = floorValue = scoreImg = scoreValue = null;
  heartSprites = null;
};
