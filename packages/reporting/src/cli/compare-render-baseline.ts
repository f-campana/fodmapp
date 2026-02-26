import { existsSync, writeFileSync, readFileSync } from "node:fs";
import { resolve, isAbsolute, dirname, join } from "node:path";

import {
  parseRenderBaselineManifest,
  SCIENTIFIC_FIGURE_ORDER,
  type RenderBaselineManifest,
} from "../index";

interface Args {
  currentManifest: string;
  baselineManifest: string;
  mode: "semantic" | "full";
  floatEps: number;
  outFile?: string;
}

interface CompareResult {
  ok: boolean;
  mismatch_count: number;
  mode: "semantic" | "full";
  mismatches: Array<Record<string, unknown>>;
}

function parseArgs(argv: string[]): Args {
  const byFlag = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--" || !token.startsWith("--")) {
      continue;
    }
    byFlag.set(token, argv[i + 1] ?? "");
    i += 1;
  }

  const currentManifest = byFlag.get("--current-manifest") ?? "";
  const baselineManifest = byFlag.get("--baseline-manifest") ?? "";
  const mode = (byFlag.get("--mode") ?? "semantic") as "semantic" | "full";
  const floatEps = Number(byFlag.get("--float-eps") ?? "1e-6");
  const outFile = byFlag.get("--out-file");

  if (!currentManifest || !baselineManifest) {
    throw new Error(
      "usage: render:compare -- --current-manifest <file> --baseline-manifest <file> --mode semantic|full --float-eps 1e-6",
    );
  }
  if (mode !== "semantic" && mode !== "full") {
    throw new Error(`invalid mode: ${mode}`);
  }
  if (!Number.isFinite(floatEps) || floatEps < 0) {
    throw new Error("--float-eps must be a non-negative number");
  }

  return { currentManifest, baselineManifest, mode, floatEps, outFile };
}

function findWorkspaceRoot(): string {
  let cursor = process.cwd();
  for (;;) {
    if (existsSync(join(cursor, "pnpm-workspace.yaml"))) {
      return cursor;
    }
    const parent = dirname(cursor);
    if (parent === cursor) {
      return process.cwd();
    }
    cursor = parent;
  }
}

function resolveWorkspacePath(pathValue: string): string {
  if (isAbsolute(pathValue)) {
    return pathValue;
  }
  const workspaceRoot = findWorkspaceRoot();
  return resolve(workspaceRoot, pathValue);
}

function loadManifest(path: string): RenderBaselineManifest {
  const raw = JSON.parse(
    readFileSync(resolveWorkspacePath(path), "utf8"),
  ) as unknown;
  return parseRenderBaselineManifest(raw);
}

function pushMismatch(
  mismatches: Array<Record<string, unknown>>,
  reason: string,
  details: Record<string, unknown>,
): void {
  mismatches.push({ reason, ...details });
}

function compareRefs(
  current: RenderBaselineManifest,
  baseline: RenderBaselineManifest,
  mismatches: Array<Record<string, unknown>>,
): void {
  const left = [...current.contract_refs].sort((a, b) => a.localeCompare(b));
  const right = [...baseline.contract_refs].sort((a, b) => a.localeCompare(b));
  if (JSON.stringify(left) !== JSON.stringify(right)) {
    pushMismatch(mismatches, "contract_refs_mismatch", {
      current: left,
      baseline: right,
    });
  }
}

function compareScientific(
  current: RenderBaselineManifest,
  baseline: RenderBaselineManifest,
  mismatches: Array<Record<string, unknown>>,
): void {
  if (current.scientific.length !== SCIENTIFIC_FIGURE_ORDER.length) {
    pushMismatch(mismatches, "scientific_count_mismatch", {
      current_count: current.scientific.length,
      expected_count: SCIENTIFIC_FIGURE_ORDER.length,
    });
  }

  const currentByFile = new Map(
    current.scientific.map((row) => [row.file, row]),
  );
  const baselineByFile = new Map(
    baseline.scientific.map((row) => [row.file, row]),
  );

  for (const file of SCIENTIFIC_FIGURE_ORDER) {
    const currentRow = currentByFile.get(file);
    const baselineRow = baselineByFile.get(file);
    if (!currentRow) {
      pushMismatch(mismatches, "scientific_file_missing_current", { file });
      continue;
    }
    if (!baselineRow) {
      pushMismatch(mismatches, "scientific_file_missing_baseline", { file });
      continue;
    }

    if (currentRow.figure_id !== baselineRow.figure_id) {
      pushMismatch(mismatches, "scientific_figure_id_mismatch", {
        file,
        current: currentRow.figure_id,
        baseline: baselineRow.figure_id,
      });
    }
    if (currentRow.title !== baselineRow.title) {
      pushMismatch(mismatches, "scientific_title_mismatch", {
        file,
        current: currentRow.title,
        baseline: baselineRow.title,
      });
    }
    if (currentRow.sha256 !== baselineRow.sha256) {
      pushMismatch(mismatches, "scientific_checksum_mismatch", {
        file,
        current: currentRow.sha256,
        baseline: baselineRow.sha256,
      });
    }
  }

  const extraCurrent = current.scientific
    .map((row) => row.file)
    .filter((file) => !SCIENTIFIC_FIGURE_ORDER.includes(file));
  if (extraCurrent.length > 0) {
    pushMismatch(mismatches, "scientific_unexpected_files_current", {
      files: extraCurrent.sort(),
    });
  }

  const extraBaseline = baseline.scientific
    .map((row) => row.file)
    .filter((file) => !SCIENTIFIC_FIGURE_ORDER.includes(file));
  if (extraBaseline.length > 0) {
    pushMismatch(mismatches, "scientific_unexpected_files_baseline", {
      files: extraBaseline.sort(),
    });
  }
}

function comparePublic(
  current: RenderBaselineManifest,
  baseline: RenderBaselineManifest,
  mismatches: Array<Record<string, unknown>>,
): void {
  if (current.public.length !== baseline.public.length) {
    pushMismatch(mismatches, "public_count_mismatch", {
      current_count: current.public.length,
      baseline_count: baseline.public.length,
    });
  }

  const currentRow = current.public.find(
    (row) => row.artifact_id === "phase2_dashboard_html",
  );
  const baselineRow = baseline.public.find(
    (row) => row.artifact_id === "phase2_dashboard_html",
  );
  if (!currentRow || !baselineRow) {
    pushMismatch(mismatches, "public_dashboard_missing", {
      current_present: Boolean(currentRow),
      baseline_present: Boolean(baselineRow),
    });
    return;
  }

  if (currentRow.file !== baselineRow.file) {
    pushMismatch(mismatches, "public_file_mismatch", {
      current: currentRow.file,
      baseline: baselineRow.file,
    });
  }
  if (currentRow.title !== baselineRow.title) {
    pushMismatch(mismatches, "public_title_mismatch", {
      current: currentRow.title,
      baseline: baselineRow.title,
    });
  }
  if (currentRow.sha256 !== baselineRow.sha256) {
    pushMismatch(mismatches, "public_checksum_mismatch", {
      current: currentRow.sha256,
      baseline: baselineRow.sha256,
    });
  }
}

function compareFullMetadata(
  current: RenderBaselineManifest,
  baseline: RenderBaselineManifest,
  mismatches: Array<Record<string, unknown>>,
): void {
  const fields: Array<keyof RenderBaselineManifest["source_run"]> = [
    "run_id",
    "git_sha",
    "source_db_ref",
    "contract_version",
  ];

  for (const field of fields) {
    if (current.source_run[field] !== baseline.source_run[field]) {
      pushMismatch(mismatches, "source_run_mismatch", {
        field,
        current: current.source_run[field],
        baseline: baseline.source_run[field],
      });
    }
  }

  if (current.generated_at_utc !== baseline.generated_at_utc) {
    pushMismatch(mismatches, "generated_at_utc_mismatch", {
      current: current.generated_at_utc,
      baseline: baseline.generated_at_utc,
    });
  }
}

function main(): number {
  try {
    const args = parseArgs(process.argv.slice(2));
    void args.floatEps;

    const current = loadManifest(args.currentManifest);
    const baseline = loadManifest(args.baselineManifest);

    const mismatches: Array<Record<string, unknown>> = [];
    compareRefs(current, baseline, mismatches);
    compareScientific(current, baseline, mismatches);
    comparePublic(current, baseline, mismatches);

    if (args.mode === "full") {
      compareFullMetadata(current, baseline, mismatches);
    }

    const result: CompareResult = {
      ok: mismatches.length === 0,
      mismatch_count: mismatches.length,
      mode: args.mode,
      mismatches,
    };

    const currentManifestPath = resolveWorkspacePath(args.currentManifest);
    const outPath = args.outFile
      ? resolveWorkspacePath(args.outFile)
      : resolve(dirname(currentManifestPath), "render-baseline-diff.json");
    writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

    if (!result.ok) {
      console.error(`render baseline drift found: ${result.mismatch_count}`);
      return 1;
    }

    console.log("render baseline compare passed");
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[FAIL] ${message}`);
    return 1;
  }
}

process.exitCode = main();
