import assert from "node:assert/strict";
import fs from "node:fs/promises";
import sharp from "sharp";
const tokens = JSON.parse(
  await fs.readFile("packages/brand/tokens.json", "utf8"),
);
const luminance = (hex) => {
  const [r, g, b] = hex.match(/[0-9a-f]{2}/gi).map((x) => {
    const v = parseInt(x, 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const report = { themes: {}, assets: [] };
for (const theme of ["light", "dark"]) {
  const t = tokens[theme];
  const pairs = [
    ["text", "bg"],
    ["text", "surface"],
    ["muted", "bg"],
    ["muted", "surface"],
    ["muted", "surface-subtle"],
    ["accent", "bg"],
    ["on-primary", "primary"],
    ["on-primary", "primary-hover"],
    ["error", "surface"],
  ];
  report.themes[theme] = pairs.map(([fg, bg]) => {
    const ratio = contrast(t[fg], t[bg]);
    assert(ratio >= 4.5, `${theme} ${fg}/${bg}: ${ratio.toFixed(2)}`);
    return { pair: `${fg}/${bg}`, ratio: Number(ratio.toFixed(2)) };
  });
  for (const [fg, bg] of [
    ["control-border", "surface"],
    ["focus", "bg"],
  ])
    assert(contrast(t[fg], t[bg]) >= 3, `${theme} ${fg} requires 3:1`);
}
const assets = await fs.readdir("assets/logos");
assert.equal(assets.length, 12);
for (const file of assets) {
  const source = await fs.readFile(`assets/logos/${file}`, "utf8");
  assert(source.includes("viewBox="));
  assert(!/<(?:text|image|script)\b/.test(source));
  await sharp(Buffer.from(source)).png().toBuffer();
  report.assets.push(file);
}
for (const size of [32, 180, 192, 512]) {
  const image = await sharp(`assets/icons/icon-${size}.png`).metadata();
  assert.equal(image.width, size);
  assert.equal(image.height, size);
}
await fs.access("assets/fonts/OFL.txt");
await fs.mkdir("tmp/qa", { recursive: true });
await fs.writeFile("tmp/qa/brand-checks.json", JSON.stringify(report, null, 2));
console.log(
  "PASS: 12 self-contained vector logos, icon dimensions, licensed fonts, 18 text contrast pairs and 4 focus/control contrast pairs.",
);
