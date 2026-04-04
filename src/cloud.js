import * as PIXI from "pixi.js";
import { checkMoveDown, getMoveDownValue } from "./utils";
import * as constant from "./constant";

const randomCloudImgName = (count) => {
  const clouds = ["c1", "c2", "c3"];
  const stones = ["c4", "c5", "c6", "c7", "c8"];
  const arr = count > 6 ? stones : clouds;
  return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * createCloud — PixiJS cloud instance factory.
 * @param {object} engine  Game engine
 * @param {number} index   1–4 (position slot)
 * @returns Instance object compatible with engine.addInstance()
 */
export function createCloud(engine, index) {
  const sprite = new PIXI.Sprite();
  const container = new PIXI.Container();
  container.addChild(sprite);

  let count = 5 - index;
  let imgName = randomCloudImgName(count);
  let ready = false;

  // Internal physics state
  let x = 0, y = 0, originX = 0, ax = 0;
  let size = 0;

  const inst = {
    name: `cloud_${index}`,
    container,
    visible: true,
    layer: "clouds",

    tickFn: (_deltaMS, _now) => {
      if (!ready) {
        ready = true;
        size   = engine.getVariable(constant.cloudSize);
        const w = engine.width;
        const h = engine.height;
        const positions = [
          { x: w * 0.1,  y: -h * 0.66 },
          { x: w * 0.65, y: -h * 0.33 },
          { x: w * 0.1,  y: 0 },
          { x: w * 0.65, y:  h * 0.33 },
        ];
        const pos = positions[index - 1];
        x = engine.utils.random(pos.x, pos.x * 1.2);
        y = engine.utils.random(pos.y, pos.y * 1.2);
        originX = x;
        ax = engine.pixelsPerFrame(
          size * engine.utils.random(0.05, 0.08) * engine.utils.randomPositiveNegative()
        );
        sprite.texture = engine.getTexture(imgName);
        sprite.width   = size;
        sprite.height  = size;
      }

      x += ax;
      if (x >= originX + size || x <= originX - size) ax *= -1;

      if (checkMoveDown(engine)) {
        y += getMoveDownValue(engine) * 1.2;
      }

      if (y >= engine.height) {
        y = -engine.height * 0.66;
        count += 4;
        imgName = randomCloudImgName(count);
        sprite.texture = engine.getTexture(imgName);
      }

      container.x = x;
      container.y = y;
      container.visible = inst.visible;
    },
  };

  return inst;
}
