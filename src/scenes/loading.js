import { Container, Graphics, Text } from "pixi.js";
import { createProgressBar } from "./ui/progress-bar";

/**
 * createLoadingScene — full-screen asset-load progress UI rendered into
 * engine.layers.ui. Uses Graphics + system font (no FOUT risk on first
 * paint, before the wenxue webfont has loaded).
 *
 * Lifecycle:
 *   const scene = createLoadingScene(engine);
 *   engine.load(() => scene.destroy(), scene.onProgress);
 */
export function createLoadingScene(engine) {
  const { width, height } = engine;

  const container = new Container();

  const bg = new Graphics().rect(0, 0, width, height).fill(0xf05a50);
  bg.eventMode = "static";   // swallow taps so they don't reach gameplay
  container.addChild(bg);

  const barWidth = width * 0.6;
  const barHeight = Math.max(12, height * 0.018);

  const percentText = new Text({
    text: "0%",
    style: {
      fontFamily: "Helvetica Neue, Arial, sans-serif",
      fontSize: Math.round(height * 0.045),
      fill: 0xffffff,
      fontWeight: "bold",
    },
  });
  percentText.anchor.set(0.5);
  percentText.x = width / 2;
  percentText.y = height / 2 - barHeight - Math.round(height * 0.04);
  container.addChild(percentText);

  const bar = createProgressBar({
    width: barWidth,
    height: barHeight,
    color: 0xffffff,
    borderColor: 0xffffff,
  });
  bar.container.x = (width - barWidth) / 2;
  bar.container.y = height / 2;
  container.addChild(bar.container);

  const labelText = new Text({
    text: "Loading...",
    style: {
      fontFamily: "Helvetica Neue, Arial, sans-serif",
      fontSize: Math.round(height * 0.022),
      fill: 0xffffff,
    },
  });
  labelText.anchor.set(0.5);
  labelText.x = width / 2;
  labelText.y = height / 2 + barHeight + Math.round(height * 0.03);
  container.addChild(labelText);

  engine.layers.ui.addChild(container);

  let destroyed = false;

  const onProgress = (status) => {
    if (destroyed) return;
    const { success, total } = status;
    if (!total) return;
    const pct = Math.min(Math.floor((success / total) * 100), 98);
    percentText.text = pct + "%";
    bar.setProgress(pct / 100);
  };

  const setProgress = (p) => {
    if (destroyed) return;
    const pct = Math.max(0, Math.min(100, Math.floor(p * 100)));
    percentText.text = pct + "%";
    bar.setProgress(pct / 100);
  };

  const hide = () => { container.visible = false; };

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    if (container.destroyed) return;
    if (container.parent) container.parent.removeChild(container);
    container.destroy({ children: true });
  };

  return { container, onProgress, setProgress, hide, destroy };
}
