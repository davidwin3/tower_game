import { Container, Sprite, Text } from "pixi.js";
import {
  getMoveDownValue,
  getLandBlockVelocity,
  getSwingBlockVelocity,
  addSuccessCount,
  addFailedCount,
  addScore,
} from "./utils";
import * as constant from "./constant";
import { getBibleBook } from "../bible-config.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const getBibleBookName = (gameMode, bookIndex) => {
  const arrayIndex = gameMode === "old" ? bookIndex - 1 : bookIndex - 40;
  const book = getBibleBook(gameMode, arrayIndex);
  return book
    ? book.name
    : `${gameMode === "old" ? "구약" : "신약"} ${bookIndex}`;
};

const checkCollision = (inst, line) => {
  // 0 goon  1 drop  2 rotate-left  3 rotate-right  4 ok  5 perfect
  if (inst.y + inst.height < line.y) return 0;
  if (inst.x < line.x - inst.calWidth || inst.x > line.collisionX + inst.calWidth) return 1;
  if (inst.x < line.x)          return 2;
  if (inst.x > line.collisionX) return 3;
  if (inst.x > line.x + inst.calWidth * 0.8 && inst.x < line.x + inst.calWidth * 1.2) return 5;
  return 4;
};

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * createBlock — PixiJS block instance factory.
 * Each block is one game object with a sprite + bible text label.
 */
export function createBlock(engine, blockNumber) {
  // Sprites
  const blockSprite = new Sprite();
  const ropeSprite  = new Sprite();

  // Bible text label (outline + fill achieved via separate Text objects)
  const labelStyle = {
    fontFamily: "Arial",
    fontSize: 24,
    fontWeight: "bold",
    fill: "#FFFFFF",
    stroke: { color: "#000000", width: 3 },
    align: "center",
  };
  const label = new Text({ text: "", style: labelStyle });
  label.anchor.set(0.5, 0.5);

  const container = new Container();
  container.addChild(ropeSprite, blockSprite, label);

  // ── Internal state ─────────────────────────────────────────────────────────
  let ready  = false;
  let width  = 0;
  let height = 0;
  let calWidth = 0;   // half-width used in collision detection

  const phys = {
    x: 0, y: 0,
    angle: 0, weightX: 0, weightY: 0,
    rotate: 0,
    vx: 0, vy: 0, ay: 0,
    startDropTime: null,
    outwardOffset: 0,
    originOutwardAngle: 0,
    originHypotenuse: 0,
  };

  const inst = {
    name: `block_${blockNumber}`,
    container,
    visible: true,
    layer: "blocks",

    // Collision-detection surface (read by line.js / animateFuncs.js)
    get x()      { return phys.x; },
    set x(v)     { phys.x = v; },
    get y()      { return phys.y; },
    set y(v)     { phys.y = v; },
    get width()  { return width; },
    get height() { return height; },
    get calWidth() { return calWidth; },

    status: constant.swing,
    perfect: false,
    bibleBookName: "",
    bibleBookIndex: 0,

    tickFn: (_deltaMS, now) => {
      const ropeHeight = engine.getVariable(constant.ropeHeight);

      if (!ready) {
        ready  = true;
        width  = engine.getVariable(constant.blockWidth);
        height = engine.getVariable(constant.blockHeight);
        calWidth = width / 2;

        phys.x = engine.width / 2;
        phys.y = ropeHeight * -1.5;

        blockSprite.texture = engine.getTexture("block");
        ropeSprite.texture  = engine.getTexture("blockRope");

        // Assign bible book
        const currentSuccess = engine.getVariable(constant.successCount);
        const gameMode       = engine.getVariable(constant.gameMode);
        const maxBooks       = engine.getVariable(constant.maxBooks);
        const nextSuccess    = currentSuccess + 1;
        const relIndex       = ((nextSuccess - 1) % maxBooks) + 1;
        const bookIndex      = gameMode === "old" ? relIndex : 40 + (relIndex - 1);
        inst.bibleBookIndex  = bookIndex;
        inst.bibleBookName   = getBibleBookName(gameMode, bookIndex);
      }

      if (!inst.visible) return;

      const line = engine.getInstance("line");
      if (!line) return;

      switch (inst.status) {
        case constant.swing: {
          engine.getTimeMovement(
            constant.hookDownMovement,
            [[phys.y, phys.y + ropeHeight]],
            (value) => { phys.y = value; },
            { name: inst.name }
          );
          const initialAngle = engine.getVariable(constant.initialAngle);
          phys.angle   = initialAngle * getSwingBlockVelocity(engine, now);
          phys.weightX = phys.x + Math.sin(phys.angle) * ropeHeight;
          phys.weightY = phys.y + Math.cos(phys.angle) * ropeHeight;
          _renderSwing(ropeHeight);
          break;
        }

        case constant.beforeDrop: {
          phys.x    = phys.weightX - calWidth;
          phys.y    = phys.weightY + 0.3 * height;
          phys.rotate = 0;
          phys.ay   = engine.pixelsPerFrame(0.0003 * engine.height);
          phys.startDropTime = now;
          phys.vy   = 0;
          inst.status = constant.drop;
          // fall-through to drop on next frame
          _renderBlock();
          break;
        }

        case constant.drop: {
          const dt = now - phys.startDropTime;
          phys.startDropTime = now;
          phys.vy += phys.ay * dt;
          phys.y  += phys.vy * dt + 0.5 * phys.ay * dt ** 2;

          const collision = checkCollision(inst, line);
          const blockY    = line.y - height;

          if (collision === 1) {
            _checkOut();
          } else if (collision === 2 || collision === 3) {
            inst.status = collision === 2 ? constant.rotateLeft : constant.rotateRight;
            phys.y     = blockY;
            phys.outwardOffset = collision === 2
              ? line.x          + calWidth - phys.x
              : line.collisionX + calWidth - phys.x;
            phys.originOutwardAngle  = Math.atan(height / phys.outwardOffset);
            phys.originHypotenuse    = Math.sqrt(height ** 2 + phys.outwardOffset ** 2);
            engine.playAudio("rotate");
            _renderBlock();
          } else if (collision === 4 || collision === 5) {
            inst.status = constant.land;

            addSuccessCount(engine);
            const currentSuccess = engine.getVariable(constant.successCount);
            const gameMode       = engine.getVariable(constant.gameMode);
            const maxBooks       = engine.getVariable(constant.maxBooks);
            const relIndex       = ((currentSuccess - 1) % maxBooks) + 1;
            const finalBookIndex = gameMode === "old" ? relIndex : 40 + (relIndex - 1);
            inst.bibleBookIndex  = finalBookIndex;
            inst.bibleBookName   = getBibleBookName(gameMode, finalBookIndex);

            engine.setTimeMovement(constant.moveDownMovement, 500);
            const lastSuccess = currentSuccess - 1;
            if (lastSuccess === 10 || lastSuccess === 15) {
              engine.setTimeMovement(constant.lightningMovement, 150);
            }

            phys.y             = blockY;
            line.y             = blockY;
            line.x             = phys.x - calWidth;
            line.collisionX    = line.x + width;

            const cheatWidth = width * 0.3;
            if (phys.x > engine.width - cheatWidth * 2 || phys.x < -cheatWidth) {
              engine.setVariable(constant.hardMode, true);
            }

            if (collision === 5) {
              inst.perfect = true;
              addScore(engine, true);
              engine.playAudio("drop-perfect");
            } else {
              addScore(engine);
              engine.playAudio("drop");
            }

            _renderBlock();
          } else {
            _renderBlock();
          }
          break;
        }

        case constant.land: {
          engine.getTimeMovement(
            constant.moveDownMovement,
            [[phys.y, phys.y + getMoveDownValue(engine, { pixelsPerFrame: s => s / 2 })]],
            (value) => {
              if (!inst.visible) return;
              phys.y = value;
              if (phys.y > engine.height) inst.visible = false;
            },
            { name: inst.name }
          );
          phys.x += getLandBlockVelocity(engine, now);
          _renderBlock();
          break;
        }

        case constant.rotateLeft:
        case constant.rotateRight: {
          const isRight      = inst.status === constant.rotateRight;
          const rotateSpeed  = engine.pixelsPerFrame(Math.PI * 4);
          const sign         = isRight ? 1 : -1;
          const isShouldFall = isRight ? phys.rotate > 1.3 : phys.rotate < -1.3;

          if (isShouldFall) {
            phys.rotate += (rotateSpeed / 8) * sign;
            phys.y      += engine.pixelsPerFrame(engine.height * 0.7);
            phys.x      += engine.pixelsPerFrame(engine.width  * 0.3) * sign;
          } else {
            let ratio = (calWidth - phys.outwardOffset) / calWidth;
            ratio = ratio > 0.5 ? ratio : 0.5;
            phys.rotate += rotateSpeed * ratio * sign;

            const angle      = phys.originOutwardAngle + phys.rotate;
            const axisX      = isRight
              ? line.collisionX + calWidth
              : line.x + calWidth;
            phys.x = axisX - Math.cos(angle) * phys.originHypotenuse;
            phys.y = line.y - Math.sin(angle) * phys.originHypotenuse;
          }
          _checkOut();
          _renderRotated();
          break;
        }

        default:
          break;
      }

      container.visible = inst.visible;
    },
  };

  // ── Render helpers ──────────────────────────────────────────────────────────

  function _setLabel(x, y, w, h) {
    const bookName   = inst.bibleBookName || "창세기";
    const maxW       = w * 0.9;
    const minFontSz  = 15;
    let fontSize     = Math.max(minFontSz, w * 0.22);

    // Binary-search-like font shrink (canvas measureText not available in PixiJS directly)
    // Use PIXI.Text measurement instead
    label.style.fontSize = fontSize;
    label.text           = bookName;
    while (label.width > maxW && fontSize > minFontSz) {
      fontSize -= 1;
      label.style.fontSize = fontSize;
    }

    label.style.stroke = { color: "#000000", width: w * 0.04 };
    label.x = x + w / 2;
    label.y = y + h / 2;
  }

  function _renderSwing(ropeHeight) {
    const bx = phys.weightX - calWidth;
    const by = phys.weightY;

    ropeSprite.texture = engine.getTexture("blockRope");
    ropeSprite.x       = bx;
    ropeSprite.y       = by;
    ropeSprite.width   = width;
    ropeSprite.height  = height * 1.3;
    ropeSprite.visible = true;

    blockSprite.visible = false;
    container.rotation  = 0;
    container.x         = 0;
    container.y         = 0;

    _setLabel(bx, by, width, height * 1.6);
  }

  function _renderBlock() {
    ropeSprite.visible = false;

    const tex = engine.getTexture(inst.perfect ? "block-perfect" : "block");
    blockSprite.texture = tex;
    blockSprite.x       = phys.x;
    blockSprite.y       = phys.y;
    blockSprite.width   = width;
    blockSprite.height  = height;
    blockSprite.alpha   = 1;
    blockSprite.visible = true;

    container.rotation  = 0;
    container.x         = 0;
    container.y         = 0;

    _setLabel(phys.x, phys.y, width, height);
  }

  function _renderRotated() {
    ropeSprite.visible = false;

    const tex = engine.getTexture(inst.perfect ? "block-perfect" : "block");
    blockSprite.texture = tex;
    blockSprite.width   = width;
    blockSprite.height  = height;
    blockSprite.visible = true;

    // Rotate around phys.x, phys.y
    container.x        = phys.x;
    container.y        = phys.y;
    container.rotation = phys.rotate;
    blockSprite.x      = 0;
    blockSprite.y      = 0;

    _setLabel(0, 0, width, height);
  }

  function _checkOut() {
    if (inst.status === constant.rotateLeft) {
      if (phys.y - width >= engine.height) {
        inst.visible = false;
        inst.status  = constant.out;
        addFailedCount(engine);
      }
    } else if (phys.y >= engine.height) {
      inst.visible = false;
      inst.status  = constant.out;
      addFailedCount(engine);
    }
  }

  return inst;
}
