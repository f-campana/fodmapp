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
const CATEGORY_TO_LANE_DIR = {
  adapter: "adapter",
  foundation: "foundation",
  composed: "composed",
  utility: "utilities",
};

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function listUiComponentImplementations(implementationsDir) {
  const slugsByLane = new Map();
  const duplicateSlugs = [];
  const rootFiles = [];
  const unknownLaneFiles = [];
  const laneDirs = new Set(Object.values(CATEGORY_TO_LANE_DIR));

  for (const entry of readdirSync(implementationsDir)) {
    const entryPath = path.join(implementationsDir, entry);
    const stats = statSync(entryPath);

    if (stats.isFile()) {
      if (entry.endsWith(".tsx") && !entry.endsWith(".test.tsx")) {
        rootFiles.push(entry);
      }
      continue;
    }

    if (!stats.isDirectory()) {
      continue;
    }

    for (const file of readdirSync(entryPath)) {
      const filePath = path.join(entryPath, file);
      if (!statSync(filePath).isFile()) {
        continue;
      }

      if (!file.endsWith(".tsx") || file.endsWith(".test.tsx")) {
        continue;
      }

      const slug = file.replace(/\.tsx$/, "");
      if (slugsByLane.has(slug)) {
        duplicateSlugs.push(
          `${slug} (in ${slugsByLane.get(slug).laneDir} and ${entry})`,
        );
      }

      slugsByLane.set(slug, {
        laneDir: entry,
        file: `${entry}/${file}`,
      });

      if (!laneDirs.has(entry)) {
        unknownLaneFiles.push(`${entry}/${file}`);
      }
    }
  }

  return {
    slugsByLane,
    duplicateSlugs: sorted(duplicateSlugs),
    rootFiles: sorted(rootFiles),
    unknownLaneFiles: sorted(unknownLaneFiles),
  };
}

function listComponentStoryFiles(storiesDir) {
  const storyFiles = [];
  const excludedDirs = new Set(["foundations", "reporting"]);

  function walk(currentDir, relativeDir = "") {
    for (const entry of readdirSync(currentDir)) {
      const entryPath = path.join(currentDir, entry);
      const stats = statSync(entryPath);
      const relativePath = relativeDir
        ? path.posix.join(relativeDir, entry)
        : entry;

      if (stats.isDirectory()) {
        if (excludedDirs.has(relativePath)) {
          continue;
        }
        walk(entryPath, relativePath);
        continue;
      }

      if (stats.isFile() && entry.endsWith(".stories.tsx")) {
        storyFiles.push(relativePath);
      }
    }
  }

  walk(storiesDir);

  return sorted(storyFiles);
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

  const implementationsDir = path.join(
    repoRoot,
    "packages/ui/src/components/ui",
  );
  const storiesDir = path.join(storybookDir, "stories");
  const taxonomyPath = path.join(storiesDir, "component-taxonomy.json");

  const taxonomy = readJson(taxonomyPath);

  const titlePrefixes = taxonomy?.titlePrefixes ?? {};
  const componentsMap = taxonomy?.components ?? {};

  const implementations = listUiComponentImplementations(implementationsDir);
  const implementationSlugs = sorted(implementations.slugsByLane.keys());
  const taxonomySlugs = sorted(Object.keys(componentsMap));
  const storyFiles = listComponentStoryFiles(storiesDir);

  const errors = [];

  if (typeof taxonomy?.version !== "number") {
    errors.push("taxonomy.version must be a number.");
  }

  if (implementations.rootFiles.length > 0) {
    errors.push(
      `Unexpected implementation files at packages/ui/src/components/ui root: ${implementations.rootFiles.join(", ")}`,
    );
  }

  if (implementations.unknownLaneFiles.length > 0) {
    errors.push(
      `Unexpected implementation files in unknown lanes: ${implementations.unknownLaneFiles.join(", ")}`,
    );
  }

  if (implementations.duplicateSlugs.length > 0) {
    errors.push(
      `Duplicate implementation slugs across lanes: ${implementations.duplicateSlugs.join(", ")}`,
    );
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

    const expectedLaneDir = CATEGORY_TO_LANE_DIR[entry.category];
    const implementation = implementations.slugsByLane.get(slug);
    if (implementation && implementation.laneDir !== expectedLaneDir) {
      errors.push(
        `components.${slug} is categorized as '${entry.category}' but implementation is in ui/${implementation.laneDir} (${implementation.file}).`,
      );
    }
  }

  const missingTaxonomyEntries = implementationSlugs.filter(
    (slug) => !taxonomySlugs.includes(slug),
  );
  const extraTaxonomyEntries = taxonomySlugs.filter(
    (slug) => !implementationSlugs.includes(slug),
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
      `Unmapped component story files (must be represented in component-taxonomy.json): ${unmappedRootStoryFiles.join(", ")}`,
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
    `[storybook-taxonomy] OK: ${implementationSlugs.length} components mapped, ${storyFiles.length} component stories validated.\n`,
  );
}

main();
