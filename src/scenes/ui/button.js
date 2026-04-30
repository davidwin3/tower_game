import { Sprite } from "pixi.js";

/**
 * createButton — interactive Sprite that fires onTap on pointertap.
 *
 * @param {object} opts
 * @param {PIXI.Texture} opts.texture
 * @param {number} [opts.x]
 * @param {number} [opts.y]
 * @param {number} [opts.width]   target render width; height auto-scales
 * @param {number} [opts.height]  target render height (overrides aspect ratio)
 * @param {[number, number]} [opts.anchor]  default [0.5, 0.5]
 * @param {() => void} opts.onTap
 * @returns {PIXI.Sprite}
 */
export function createButton({
  texture,
  x = 0,
  y = 0,
  width,
  height,
  anchor = [0.5, 0.5],
  onTap,
}) {
  const sprite = new Sprite(texture);
  sprite.anchor.set(anchor[0], anchor[1]);
  sprite.x = x;
  sprite.y = y;

  if (width != null && height == null && texture.width) {
    sprite.scale.set(width / texture.width);
  } else {
    if (width != null) sprite.width = width;
    if (height != null) sprite.height = height;
  }

  sprite.eventMode = "static";
  sprite.cursor = "pointer";

  let pressed = false;
  const press = () => {
    pressed = true;
    sprite.alpha = 0.7;
  };
  const release = () => {
    if (!pressed) return;
    pressed = false;
    sprite.alpha = 1;
  };

  sprite.on("pointerdown", press);
  sprite.on("pointerup", release);
  sprite.on("pointerupoutside", release);
  sprite.on("pointertap", () => {
    if (onTap) onTap();
  });

  return sprite;
}
