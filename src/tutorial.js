import * as PIXI from "pixi.js";
import { getHookStatus } from "./utils";
import * as constant from "./constant";

/**
 * createTutorial — tutorial overlay sprite factory.
 * @param {object} engine
 * @param {string} imageName  "tutorial" or "tutorial-arrow"
 */
export function createTutorial(engine, imageName) {
  const sprite    = new PIXI.Sprite();
  const container = new PIXI.Container();
  container.addChild(sprite);

  let ready = false;
  let x = 0, y = 0, w = 0, h = 0;

  const inst = {
    name: imageName,
    container,
    visible: true,
    layer: "overlay",

    tickFn: (_deltaMS, now) => {
      if (!ready) {
        ready = true;
        sprite.texture = engine.getTexture(imageName);
        w = engine.width * 0.2;
        h = w * 0.46;
        sprite.width  = w;
        sprite.height = h;
        x = engine.calWidth - w;
        y = engine.height * 0.45;
        if (imageName !== "tutorial") {
          y += h * 1.2;
        }
      }

      if (imageName !== "tutorial") {
        y += Math.cos(now / 200) * h * 0.01;
      }

      // Hide while tween or hook moving
      const show =
        !engine.checkTimeMovement(constant.tutorialMovement) &&
        getHookStatus(engine) === constant.hookNormal;

      container.x       = x;
      container.y       = y;
      container.visible = inst.visible && show;
    },
  };

  return inst;
}
