import * as PIXI from "pixi.js";
import * as constant from "./constant";

/**
 * createFlight — milestone animation sprite factory.
 * Used by addFlight() which is called from animateFuncs.js
 */
function createFlight(engine, number, type) {
  const sprite    = new PIXI.Sprite(engine.getTexture(`f${number}`));
  const container = new PIXI.Container();
  container.addChild(sprite);

  const size = engine.getVariable(constant.cloudSize);
  sprite.width  = size;
  sprite.height = size;

  const { width, height, utils, pixelsPerFrame } = engine;
  const { random } = utils;

  const actionTypes = {
    bottomToTop:  { x: width * random(0.3, 0.7),  y: height,            vx: 0,                                 vy: pixelsPerFrame(height) * 0.7 * -1 },
    leftToRight:  { x: size * -1,                  y: height * random(0.3, 0.6), vx: pixelsPerFrame(width) * 0.4,   vy: pixelsPerFrame(height) * 0.1 * -1 },
    rightToLeft:  { x: width,                      y: height * random(0.2, 0.5), vx: pixelsPerFrame(width) * 0.4 * -1, vy: pixelsPerFrame(height) * 0.1 },
    rightTopToLeft: { x: width,                    y: 0,                  vx: pixelsPerFrame(width) * 0.6 * -1, vy: pixelsPerFrame(height) * 0.5 },
  };

  const action = actionTypes[type];
  let x = action.x, y = action.y;
  const { vx, vy } = action;

  const inst = {
    name: `flight_${number}`,
    container,
    visible: true,
    layer: "flight",

    tickFn: () => {
      if (!inst.visible) return;
      x += vx;
      y += vy;

      if (y + size < 0 || y > height || x + size < 0 || x > width) {
        inst.visible       = false;
        container.visible  = false;
      }

      container.x       = x;
      container.y       = y;
      container.visible = inst.visible;
    },
  };

  return inst;
}

export const addFlight = (engine, number, type) => {
  const flightCount = engine.getVariable(constant.flightCount);
  if (flightCount === number) return;
  const inst = createFlight(engine, number, type);
  engine.addInstance(inst, "flight");
  engine.setVariable(constant.flightCount, number);
};
