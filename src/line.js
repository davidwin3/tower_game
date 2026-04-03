import * as PIXI from "pixi.js";
import { getMoveDownValue, getLandBlockVelocity } from "./utils";
import * as constant from "./constant";

/**
 * createLine — collision-detection reference line.
 * In debug mode renders as a red line; otherwise invisible.
 */
export function createLine(engine) {
  const graphics  = new PIXI.Graphics();
  const container = new PIXI.Container();
  container.addChild(graphics);

  let ready = false;

  const inst = {
    name: "line",
    container,
    visible: true,
    layer: "line",

    // Shared collision state read by block.js
    y: 0,
    x: 0,
    collisionX: 0,

    tickFn: (_deltaMS, _now) => {
      if (!ready) {
        inst.y          = engine.getVariable(constant.lineInitialOffset, engine.height * 0.8);
        inst.collisionX = engine.width - engine.getVariable(constant.blockWidth);
        inst.x          = 0;
        ready           = true;
      }

      engine.getTimeMovement(
        constant.moveDownMovement,
        [[inst.y, inst.y + getMoveDownValue(engine, { pixelsPerFrame: s => s / 2 })]],
        (value) => { inst.y = value; },
        { name: "line" }
      );

      const vel = getLandBlockVelocity(engine, performance.now());
      inst.x          += vel;
      inst.collisionX += vel;

      // Debug render
      graphics.clear();
      if (engine.debug) {
        graphics.moveTo(inst.x, inst.y).lineTo(inst.collisionX, inst.y);
        graphics.stroke({ width: 1, color: 0xff0000 });
      }
      container.visible = inst.visible;
    },
  };

  return inst;
}
