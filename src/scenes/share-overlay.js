import { Container, Graphics, Sprite } from "pixi.js";

/**
 * createShareOverlay — full-screen semi-transparent black overlay with the
 * share-icon arrow anchored to the top-right. Tap anywhere to dismiss.
 *
 * Mirrors the original DOM `.wxShare`:
 *   - background: #000 at 0.9 opacity
 *   - icon: width 50% of viewport, top-right with ~10px margin
 *
 * Lives in engine.layers.ui above the game-over modal so a SHARE tap from
 * the modal stacks on top.
 */
export function createShareOverlay(engine) {
  const { width, height } = engine;

  const container = new Container();
  container.visible = false;

  const bg = new Graphics().rect(0, 0, width, height).fill(0x000000);
  bg.alpha = 0.9;
  bg.eventMode = "static";
  container.addChild(bg);

  const tex = engine.getTexture("share-icon");
  const icon = new Sprite(tex);
  icon.anchor.set(1, 0);
  if (tex.width) {
    icon.scale.set((width * 0.5) / tex.width);
  } else {
    icon.width = width * 0.5;
  }
  icon.x = width - 10;
  icon.y = 10;
  container.addChild(icon);

  let destroyed = false;

  const show = () => { if (!destroyed) container.visible = true; };
  const hide = () => { if (!destroyed) container.visible = false; };

  bg.on("pointertap", hide);

  engine.layers.ui.addChild(container);

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    if (container.destroyed) return;
    if (container.parent) container.parent.removeChild(container);
    container.destroy({ children: true });
  };

  return { container, show, hide, destroy };
}
