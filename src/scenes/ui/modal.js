import { Container, Graphics } from "pixi.js";

/**
 * createModal — full-screen overlay scene with a darkened mask and a content
 * container centered on top. Mask intercepts pointer events so taps don't fall
 * through to gameplay.
 *
 * @param {object} opts
 * @param {number} opts.width
 * @param {number} opts.height
 * @param {number} [opts.maskColor]
 * @param {number} [opts.maskAlpha]
 * @returns {{
 *   container: PIXI.Container,
 *   content: PIXI.Container,
 *   show: () => void,
 *   hide: () => void,
 * }}
 */
export function createModal({
  width,
  height,
  maskColor = 0x000000,
  maskAlpha = 0.6,
}) {
  const container = new Container();
  container.visible = false;

  const mask = new Graphics().rect(0, 0, width, height).fill(maskColor);
  mask.alpha = maskAlpha;
  mask.eventMode = "static";
  container.addChild(mask);

  const content = new Container();
  content.x = width / 2;
  content.y = height / 2;
  container.addChild(content);

  const show = () => { container.visible = true; };
  const hide = () => { container.visible = false; };

  return { container, content, show, hide };
}
