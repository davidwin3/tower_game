import { Sprite, Text } from "pixi.js";
import { createModal } from "./ui/modal";
import { createButton } from "./ui/button";
import { loadFont } from "./ui/helpers";

/**
 * createGameOverScene — full-screen game-over modal with score and three
 * action buttons (reload / invite / mode-select).
 *
 * Layout follows the original DOM modal proportions:
 *   - dialog backdrop: modal-bg sprite, ~92% canvas width
 *   - title image (over-img): ~80% of dialog width, anchored near top
 *   - score text: wenxue font, #ff735c with white stroke
 *   - "Try Again!" tip text: small, #9b724e
 *   - 3 stacked buttons: ~70% of dialog width
 *
 * @param {object} engine
 * @param {object} callbacks
 * @param {() => void} callbacks.onReload
 * @param {() => void} callbacks.onInvite
 * @param {() => void} callbacks.onModeSelect
 */
export function createGameOverScene(engine, callbacks = {}) {
  const { width: vw, height: vh } = engine;

  const modal = createModal({ width: vw, height: vh });
  modal.container.zIndex = 10;
  engine.layers.ui.addChild(modal.container);

  // Dialog backdrop sprite — anchored center on modal.content (which itself
  // sits at viewport center). The PNG defines the dialog's visual frame.
  const bgTex   = engine.getTexture("modal-bg");
  const dialogW = Math.min(vw * 0.92, vh * 0.65);
  const bgScale = bgTex.width ? dialogW / bgTex.width : 1;
  const dialogH = bgTex.height ? bgTex.height * bgScale : dialogW * 1.4;

  const dialogBg = new Sprite(bgTex);
  dialogBg.anchor.set(0.5);
  dialogBg.width = dialogW;
  dialogBg.height = dialogH;
  modal.content.addChild(dialogBg);

  // Layout origin: dialog top-left expressed relative to modal.content (which
  // is at viewport center, so dialog top-left is at -dialogW/2, -dialogH/2).
  const dx = -dialogW / 2;
  const dy = -dialogH / 2;

  // ── Over title image (main-modal-over) ────────────────────────────────────
  const overTex = engine.getTexture("modal-over");
  const overW   = dialogW * 0.8;
  const over = new Sprite(overTex);
  over.anchor.set(0.5, 0);
  if (overTex.width) {
    const s = overW / overTex.width;
    over.scale.set(s);
  } else {
    over.width = overW;
  }
  over.x = 0;
  over.y = dy + dialogH * 0.13;
  modal.content.addChild(over);

  // ── Score text (wenxue) ───────────────────────────────────────────────────
  const overH = overTex.height ? overTex.height * (overW / overTex.width) : dialogH * 0.18;
  const scoreText = new Text({
    text: "0",
    style: {
      fontFamily: "wenxue, Helvetica Neue, Arial, sans-serif",
      fontSize: dialogW * 0.18,
      fill: 0xff735c,
      stroke: { color: 0xffffff, width: dialogW * 0.012 },
    },
  });
  scoreText.anchor.set(0.5, 0);
  scoreText.x = 0;
  scoreText.y = over.y + overH - dialogW * 0.02;
  modal.content.addChild(scoreText);

  // ── Buttons (stacked vertically) ──────────────────────────────────────────
  // Note: original DOM had a hardcoded "Try Again!" <p> in .tip but JS cleared
  // it on every overShowOver() call, so the user never saw it. We preserve the
  // visual gap between score and buttons but skip the empty paragraph.
  const btnW   = dialogW * 0.7;
  const btnGap = dialogW * 0.025;
  let btnY = scoreText.y + dialogW * 0.3;

  const makeBtn = (alias, onTap) => {
    const tex = engine.getTexture(alias);
    const btn = createButton({ texture: tex, x: 0, y: btnY, width: btnW, anchor: [0.5, 0], onTap });
    modal.content.addChild(btn);
    const h = tex.height && tex.width ? tex.height * (btnW / tex.width) : btnW * 0.2;
    btnY += h + btnGap;
    return btn;
  };

  makeBtn("modal-again",  () => callbacks.onReload     && callbacks.onReload());
  makeBtn("modal-invite", () => callbacks.onInvite     && callbacks.onInvite());
  makeBtn("modal-mode",   () => callbacks.onModeSelect && callbacks.onModeSelect());

  // Preload wenxue so the score text re-renders with the right glyphs after
  // the webfont is available. Without this, the first show() may render in
  // a fallback font.
  loadFont("wenxue", "0123456789").then(() => {
    if (scoreText.destroyed) return;
    // Force re-render by reassigning text (PIXI snapshots on construction).
    const cur = scoreText.text;
    scoreText.text = "";
    scoreText.text = cur;
  });

  let destroyed = false;

  const setScore = (s) => {
    if (destroyed || scoreText.destroyed) return;
    scoreText.text = String(s);
  };

  const show = (s) => {
    if (destroyed) return;
    if (s != null) setScore(s);
    modal.show();
  };

  const hide = () => {
    if (destroyed) return;
    modal.hide();
  };

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    if (modal.container.destroyed) return;
    if (modal.container.parent) modal.container.parent.removeChild(modal.container);
    modal.container.destroy({ children: true });
  };

  return { container: modal.container, show, hide, setScore, destroy };
}
