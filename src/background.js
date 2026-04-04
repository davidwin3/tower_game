import * as PIXI from "pixi.js";
import { checkMoveDown, getMoveDownValue } from "./utils";
import * as constant from "./constant";

/**
 * createBackground — gradient + background image layers.
 * Returns an instance added to the "bg" layer.
 */
export function createBackground(engine) {
  // Gradient rect (redrawn each frame with PIXI.Graphics)
  const gradGraphics = new PIXI.Graphics();
  // Background image sprite
  const bgSprite = new PIXI.Sprite();
  // Lightning flash overlay
  const flashRect = new PIXI.Graphics();
  flashRect.rect(0, 0, engine.width, engine.height).fill({ color: 0xffffff, alpha: 0 });

  const container = new PIXI.Container();
  container.addChild(gradGraphics, bgSprite, flashRect);

  const colorArr = [
    [200, 255, 150],
    [105, 230, 240],
    [90,  190, 240],
    [85,  100, 190],
    [55,   20,  35],
    [75,   25,  35],
    [25,    0,  10],
  ];

  const getColorRgb = (colorIndex, proportion) => {
    const ci = Math.min(colorIndex, colorArr.length - 1);
    const ni = Math.min(ci + 1, colorArr.length - 1);
    const cur  = colorArr[ci];
    const next = colorArr[ni];
    const r = Math.round(cur[0] + (next[0] - cur[0]) * proportion);
    const g = Math.round(cur[1] + (next[1] - cur[1]) * proportion);
    const b = Math.round(cur[2] + (next[2] - cur[2]) * proportion);
    return (r << 16) | (g << 8) | b;
  };

  const inst = {
    name: "background",
    container,
    visible: true,
    layer: "bg",

    tickFn: (_deltaMS, _now) => {
      const w = engine.width;
      const h = engine.height;

      // ── Gradient background ──────────────────────────────────────
      let gradOffset = engine.getVariable(constant.bgLinearGradientOffset, 0);
      if (checkMoveDown(engine)) {
        gradOffset += getMoveDownValue(engine) * 1.5;
        engine.setVariable(constant.bgLinearGradientOffset, gradOffset);
      }

      const colorIndex  = Math.floor(gradOffset / h);
      const proportion  = (gradOffset % h) / h;
      const colorTop    = getColorRgb(colorIndex + 1, proportion);
      const colorBase   = getColorRgb(colorIndex,     proportion);

      const gradient = new PIXI.FillGradient(0, 0, 0, h);
      gradient.addColorStop(0, colorTop);
      gradient.addColorStop(1, colorBase);

      gradGraphics.clear();
      gradGraphics.rect(0, 0, w, h).fill(gradient);

      // ── Lightning flash ──────────────────────────────────────────
      engine.getTimeMovement(
        constant.lightningMovement,
        [],
        () => {},
        {
          name: "lightning-bg",
          before: () => { flashRect.alpha = 0.7; },
          after:  () => { flashRect.alpha = 0; },
        }
      );

      // ── Background image (parallax) ───────────────────────────────
      const bgTexture = engine.getTexture("background");
      if (bgTexture && bgTexture !== PIXI.Texture.EMPTY) {
        if (bgSprite.texture !== bgTexture) {
          bgSprite.texture = bgTexture;
          bgSprite.width   = w;
          bgSprite.height  = (bgTexture.height * w) / bgTexture.width;
        }

        let offsetHeight = engine.getVariable(constant.bgImgOffset, h - bgSprite.height);

        if (offsetHeight > h) {
          bgSprite.visible = false;
          return;
        }

        engine.getTimeMovement(
          constant.moveDownMovement,
          [[offsetHeight, offsetHeight + getMoveDownValue(engine, { pixelsPerFrame: s => s / 2 })]],
          (value) => { offsetHeight = value; },
          { name: "background" }
        );

        engine.getTimeMovement(
          constant.bgInitMovement,
          [[offsetHeight, offsetHeight + bgSprite.height / 4]],
          (value) => { offsetHeight = value; }
        );

        engine.setVariable(constant.bgImgOffset, offsetHeight);
        engine.setVariable(
          constant.lineInitialOffset,
          h - (bgSprite.height * 0.394)
        );

        bgSprite.y       = offsetHeight;
        bgSprite.visible = true;
      }

      container.visible = inst.visible;
    },
  };

  return inst;
}
