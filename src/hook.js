import { Container, Sprite } from "pixi.js";
import { getSwingBlockVelocity } from "./utils";
import * as constant from "./constant";

/**
 * createHook — PixiJS hook/rope instance factory.
 */
export function createHook(engine) {
  const sprite = new Sprite();
  const container = new Container();
  container.addChild(sprite);

  let ready = false;

  const inst = {
    name: "hook",
    container,
    visible: true,
    layer: "hook",

    // Shared state read by block.js
    x: 0,
    y: 0,
    angle: 0,
    weightX: 0,
    weightY: 0,

    tickFn: (_deltaMS, now) => {
      const ropeHeight = engine.getVariable(constant.ropeHeight);

      if (!ready) {
        inst.x = engine.width / 2;
        inst.y = ropeHeight * -1.5;
        ready  = true;
        sprite.texture = engine.getTexture("hook");
      }

      engine.getTimeMovement(
        constant.hookUpMovement,
        [[inst.y, inst.y - ropeHeight]],
        (value) => { inst.y = value; },
        {
          name: "hook-up",
          after: () => { inst.y = ropeHeight * -1.5; },
        }
      );

      engine.getTimeMovement(
        constant.hookDownMovement,
        [[inst.y, inst.y + ropeHeight]],
        (value) => { inst.y = value; },
        { name: "hook" }
      );

      const initialAngle = engine.getVariable(constant.initialAngle);
      inst.angle   = initialAngle * getSwingBlockVelocity(engine, now);
      inst.weightX = inst.x + Math.sin(inst.angle) * ropeHeight;
      inst.weightY = inst.y + Math.cos(inst.angle) * ropeHeight;

      // Render: rotate hook sprite around its top-center
      const ropeWidth = ropeHeight * 0.1;
      sprite.width  = ropeWidth;
      sprite.height = ropeHeight + 5;
      // Place sprite so top-center aligns with inst.x, inst.y
      sprite.anchor.set(0.5, 0);
      container.x        = inst.x;
      container.y        = inst.y;
      container.rotation = Math.PI * 2 - inst.angle;
      container.visible  = inst.visible;
    },
  };

  return inst;
}
