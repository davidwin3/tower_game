import { Container, Graphics } from "pixi.js";

/**
 * createProgressBar — horizontal Graphics-based progress bar.
 *
 * Layout matches the original CSS loading bar: outer rounded border, inner
 * fill that grows left-to-right.
 *
 * @param {object} opts
 * @param {number} opts.width
 * @param {number} opts.height
 * @param {number} [opts.borderWidth]
 * @param {number} [opts.color]      fill color (hex)
 * @param {number} [opts.borderColor]
 * @returns {{ container: PIXI.Container, setProgress: (p: number) => void }}
 */
export function createProgressBar({
  width,
  height,
  borderWidth = 3,
  color = 0xffffff,
  borderColor = 0xffffff,
}) {
  const container = new Container();

  const radius = height / 2;

  const border = new Graphics()
    .roundRect(0, 0, width, height, radius)
    .stroke({ width: borderWidth, color: borderColor });
  container.addChild(border);

  const innerPad = borderWidth + 1;
  const innerWidth = width - innerPad * 2;
  const innerHeight = height - innerPad * 2;
  const innerRadius = innerHeight / 2;

  const fill = new Graphics();
  fill.x = innerPad;
  fill.y = innerPad;
  container.addChild(fill);

  const setProgress = (p) => {
    const clamped = Math.max(0, Math.min(1, p));
    const w = innerWidth * clamped;
    fill.clear();
    if (w > 0) {
      fill.roundRect(0, 0, w, innerHeight, Math.min(innerRadius, w / 2)).fill(color);
    }
  };

  setProgress(0);

  return { container, setProgress };
}
