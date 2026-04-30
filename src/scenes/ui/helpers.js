/**
 * rem(value) — convert rem units to pixels using the document root font-size.
 * Mirrors the project's CSS rem-based sizing (main.css uses 17.6vh root).
 */
export function rem(value) {
  const rootSize = parseFloat(
    getComputedStyle(document.documentElement).fontSize
  ) || 16;
  return value * rootSize;
}

/**
 * loadFont(family) — wait for a CSS @font-face to be ready before creating
 * PIXI.Text. Without this, text renders in a fallback font on first paint
 * (FOUT) because PIXI snapshots glyphs at construction time.
 */
export function loadFont(family, sample = "0123456789") {
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  return document.fonts.load(`1em ${family}`, sample).catch(() => {});
}
