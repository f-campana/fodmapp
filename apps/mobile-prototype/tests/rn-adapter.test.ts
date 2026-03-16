import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { nativeTokens } from "@fodmapp/design-tokens/native";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "../../..");
const colorSource = JSON.parse(
  readFileSync(
    path.join(repoRoot, "packages/design-tokens/src/tokens/base/color.json"),
    "utf8",
  ),
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const b = (colorSource as any).base.color.brand;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const light = (nativeTokens.themes.light.semantic as any).color;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nb = nativeTokens.base as any;

void test("canvas color matches brand.canvasLight hex", () => {
  assert.equal(light.background.canvas, b.canvasLight.$value.hex);
});

void test("accent color matches brand.accentLight hex", () => {
  assert.equal(light.action.primary.bg, b.accentLight.$value.hex);
});

void test("text color matches brand.textLight hex", () => {
  assert.equal(light.text.primary, b.textLight.$value.hex);
});

void test("danger color matches brand.dangerLight hex", () => {
  assert.equal(light.action.destructive.bg, b.dangerLight.$value.hex);
});

void test("border color matches brand.borderLight hex", () => {
  assert.equal(light.border.default, b.borderLight.$value.hex);
});

void test("radius.lg is a number equal to 12", () => {
  assert.equal(typeof nb.radius.lg, "number");
  assert.equal(nb.radius.lg, 12);
});

void test("radius.full is a number equal to 9999", () => {
  assert.equal(typeof nb.radius.full, "number");
  assert.equal(nb.radius.full, 9999);
});

void test("space.4 is a number equal to 16", () => {
  assert.equal(typeof nb.space["4"], "number");
  assert.equal(nb.space["4"], 16);
});

void test("motion.duration.fast is a number equal to 120", () => {
  assert.equal(typeof nb.motion.duration.fast, "number");
  assert.equal(nb.motion.duration.fast, 120);
});

void test("typography.fontWeight.regular is string '400'", () => {
  assert.equal(typeof nb.typography.fontWeight.regular, "string");
  assert.equal(nb.typography.fontWeight.regular, "400");
});
