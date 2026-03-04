#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VALID_CATEGORIES = new Set([
  "adapter",
  "foundation",
  "composed",
  "utility",
]);

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function listUiComponentSlugs(componentsDir) {
  return sorted(
    readdirSync(componentsDir)
      .filter((file) => file.endsWith(".tsx"))
      .filter((file) => !file.endsWith(".test.tsx"))
      .map((file) => file.replace(/\.tsx$/, "")),
  );
}

function listRootStoryFiles(storiesDir) {
  return sorted(
    readdirSync(storiesDir)
      .filter((file) => file.endsWith(".stories.tsx"))
      .filter((file) => statSync(path.join(storiesDir, file)).isFile()),
  );
}

function extractStoryTitle(storyFilePath) {
  const source = readFileSync(storyFilePath, "utf8");
  const titleMatch = source.match(/title:\s*"([^"]+)"/);
  return titleMatch?.[1] ?? null;
}

function main() {
  const scriptPath = fileURLToPath(import.meta.url);
  const scriptDir = path.dirname(scriptPath);
  const storybookDir = path.resolve(scriptDir, "..");
  const repoRoot = path.resolve(storybookDir, "..", "..");

  const componentsDir = path.join(repoRoot, "packages/ui/src/components");
  const storiesDir = path.join(storybookDir, "stories");
  const taxonomyPath = path.join(storiesDir, "component-taxonomy.json");

  const taxonomy = readJson(taxonomyPath);

  const titlePrefixes = taxonomy?.titlePrefixes ?? {};
  const componentsMap = taxonomy?.components ?? {};

  const componentSlugs = listUiComponentSlugs(componentsDir);
  const taxonomySlugs = sorted(Object.keys(componentsMap));
  const storyFiles = listRootStoryFiles(storiesDir);

  const errors = [];

  if (typeof taxonomy?.version !== "number") {
    errors.push("taxonomy.version must be a number.");
  }

  for (const [category, prefix] of Object.entries(titlePrefixes)) {
    if (!VALID_CATEGORIES.has(category)) {
      errors.push(`titlePrefixes has unknown category: ${category}`);
    }
    if (typeof prefix !== "string" || prefix.trim() === "") {
      errors.push(`titlePrefixes.${category} must be a non-empty string.`);
    }
  }

  for (const slug of taxonomySlugs) {
    const entry = componentsMap[slug];
    if (!entry || typeof entry !== "object") {
      errors.push(`components.${slug} must be an object.`);
      continue;
    }

    if (!VALID_CATEGORIES.has(entry.category)) {
      errors.push(
        `components.${slug}.category must be one of: ${sorted(VALID_CATEGORIES).join(", ")}`,
      );
    }

    if (
      typeof entry.storyFile !== "string" ||
      !entry.storyFile.endsWith(".stories.tsx")
    ) {
      errors.push(`components.${slug}.storyFile must end with .stories.tsx`);
    }

    if (typeof entry.title !== "string" || entry.title.trim() === "") {
      errors.push(`components.${slug}.title must be a non-empty string.`);
    }

    const expectedPrefix = titlePrefixes[entry.category];
    if (
      expectedPrefix &&
      typeof entry.title === "string" &&
      !entry.title.startsWith(`${expectedPrefix}/`)
    ) {
      errors.push(
        `components.${slug}.title must start with '${expectedPrefix}/' for category '${entry.category}'.`,
      );
    }
  }

  const missingTaxonomyEntries = componentSlugs.filter(
    (slug) => !taxonomySlugs.includes(slug),
  );
  const extraTaxonomyEntries = taxonomySlugs.filter(
    (slug) => !componentSlugs.includes(slug),
  );

  if (missingTaxonomyEntries.length > 0) {
    errors.push(
      `Missing taxonomy entries for components: ${missingTaxonomyEntries.join(", ")}`,
    );
  }

  if (extraTaxonomyEntries.length > 0) {
    errors.push(
      `Taxonomy entries with no matching component file: ${extraTaxonomyEntries.join(", ")}`,
    );
  }

  const expectedStoryFiles = sorted(
    taxonomySlugs.map((slug) => componentsMap[slug]?.storyFile).filter(Boolean),
  );

  const missingStoryFiles = expectedStoryFiles.filter(
    (file) => !storyFiles.includes(file),
  );
  const unmappedRootStoryFiles = storyFiles.filter(
    (file) => !expectedStoryFiles.includes(file),
  );

  if (missingStoryFiles.length > 0) {
    errors.push(`Missing mapped story files: ${missingStoryFiles.join(", ")}`);
  }

  if (unmappedRootStoryFiles.length > 0) {
    errors.push(
      `Unmapped root story files (must be represented in component-taxonomy.json): ${unmappedRootStoryFiles.join(", ")}`,
    );
  }

  for (const slug of taxonomySlugs) {
    const entry = componentsMap[slug];
    if (!entry?.storyFile) {
      continue;
    }

    const storyFilePath = path.join(storiesDir, entry.storyFile);
    if (!storyFiles.includes(entry.storyFile)) {
      continue;
    }

    const actualTitle = extractStoryTitle(storyFilePath);
    if (!actualTitle) {
      errors.push(
        `Story '${entry.storyFile}' is missing a parsable 'title: "..."' field.`,
      );
      continue;
    }

    if (actualTitle !== entry.title) {
      errors.push(
        `Story title mismatch for '${entry.storyFile}': expected '${entry.title}', got '${actualTitle}'.`,
      );
    }
  }

  if (errors.length > 0) {
    process.stderr.write("[storybook-taxonomy] Validation failed:\n");
    for (const error of sorted(errors)) {
      process.stderr.write(`- ${error}\n`);
    }
    process.exit(1);
  }

  process.stdout.write(
    `[storybook-taxonomy] OK: ${componentSlugs.length} components mapped, ${storyFiles.length} root stories validated.\n`,
  );
}

main();
