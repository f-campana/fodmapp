import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";

import {
  FIGURE_TITLE_BY_ID,
  parseRenderBaselineManifest,
  parseReportingRun,
  type RenderBaselineManifest,
  type RenderScientificArtifact,
  renderScientificSvgBundle,
  SCIENTIFIC_FIGURE_ORDER,
} from "../index";
import { logError, logInfo } from "./logger";

interface Args {
  input: string;
  outDir: string;
  manifestOut: string;
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

  const input = byFlag.get("--input") ?? "";
  const outDir = byFlag.get("--out-dir") ?? "";
  const manifestOut = byFlag.get("--manifest-out") ?? "";

  if (!input || !outDir || !manifestOut) {
    throw new Error(
      "usage: render:scientific -- --input <run.json> --out-dir <dir> --manifest-out <manifest.json>",
    );
  }

  return { input, outDir, manifestOut };
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

function sha256String(payload: string): string {
  return `sha256:${createHash("sha256").update(payload, "utf8").digest("hex")}`;
}

function readManifest(path: string): RenderBaselineManifest | null {
  if (!existsSync(path)) {
    return null;
  }
  const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
  return parseRenderBaselineManifest(raw);
}

function main(): number {
  try {
    const args = parseArgs(process.argv.slice(2));
    const inputPath = resolveWorkspacePath(args.input);
    const outDirPath = resolveWorkspacePath(args.outDir);
    const manifestPath = resolveWorkspacePath(args.manifestOut);

    const runInput = JSON.parse(readFileSync(inputPath, "utf8")) as unknown;
    const run = parseReportingRun(runInput);

    const bundle = renderScientificSvgBundle(run, {});
    mkdirSync(outDirPath, { recursive: true });

    const scientific: RenderScientificArtifact[] = SCIENTIFIC_FIGURE_ORDER.map(
      (file) => {
        const svg = bundle[file];
        const outputPath = resolve(outDirPath, file);
        writeFileSync(outputPath, svg, "utf8");

        const figureId = run.figures.find((figure) => {
          const mappedFile = {
            "P-01_stage_progression_contract_curve":
              "fig_A_pipeline_progression.svg",
            "P-02_candidate_pool_split_by_stage":
              "fig_B_candidate_pool_evolution.svg",
            "P-03_gap_completion_matrix": "fig_C_gap_completion_heatmap.svg",
            "Q-02_critical_contract_scorecard": "fig_D_status_distribution.svg",
            "Q-03_snapshot_lock_drift_panel": "fig_E_evidence_quality.svg",
            "Q-04_rank2_exclusion_audit":
              "fig_F_serving_load_vs_thresholds.svg",
            "E-03_threshold_provenance_completeness":
              "fig_G_source_provenance.svg",
            "E-04_rank2_quarantine_case_study": "fig_H_quarantine_impact.svg",
          }[figure.figure_id];
          return mappedFile === file;
        })?.figure_id;

        if (!figureId) {
          throw new Error(`missing figure id mapping for ${file}`);
        }

        return {
          figure_id: figureId,
          file,
          title: FIGURE_TITLE_BY_ID[figureId] ?? file,
          sha256: sha256String(svg),
        };
      },
    );

    const contractRefs = [
      ...new Set(run.figures.flatMap((figure) => figure.contract_refs)),
    ].sort((a, b) => a.localeCompare(b));

    const existing = readManifest(manifestPath);
    const manifest: RenderBaselineManifest = {
      schema_version: "phase2-render-baseline-manifest-v1",
      generated_at_utc: new Date().toISOString(),
      source_run: {
        run_id: run.run_id,
        git_sha: run.git_sha,
        source_db_ref: run.source_db_ref,
        contract_version: run.contract_version,
      },
      contract_refs: contractRefs,
      scientific,
      public: existing?.public ?? [],
    };

    mkdirSync(dirname(manifestPath), { recursive: true });
    writeFileSync(
      manifestPath,
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8",
    );

    logInfo(
      `rendered scientific SVG bundle (${scientific.length}) to ${outDirPath}`,
    );
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logError(`[FAIL] ${message}`);
    return 1;
  }
}

process.exitCode = main();
