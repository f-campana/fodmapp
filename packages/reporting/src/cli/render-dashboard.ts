import { createHash } from "node:crypto";
import { dirname, resolve, isAbsolute, join } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import {
  parseRenderBaselineManifest,
  parseReportingRun,
  renderStandaloneDashboardHtml,
  type RenderBaselineManifest,
} from "../index";

interface Args {
  input: string;
  outFile: string;
  manifestOut?: string;
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
  const outFile = byFlag.get("--out-file") ?? "";
  const manifestOut = byFlag.get("--manifest-out");
  if (!input || !outFile) {
    throw new Error(
      "usage: render:dashboard -- --input <run.json> --out-file <phase2_dashboard.html> [--manifest-out <manifest.json>]",
    );
  }

  return { input, outFile, manifestOut };
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
    const outFilePath = resolveWorkspacePath(args.outFile);

    const runInput = JSON.parse(readFileSync(inputPath, "utf8")) as unknown;
    const run = parseReportingRun(runInput);

    const html = renderStandaloneDashboardHtml(run, {
      title: "Phase 2 Reporting Dashboard",
      subtitle: "Deterministic dashboard from canonical reporting contract",
    });

    const outputPath = outFilePath;
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, html, "utf8");

    if (args.manifestOut) {
      const manifestPath = resolveWorkspacePath(args.manifestOut);
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
        scientific: existing?.scientific ?? [],
        public: [
          {
            artifact_id: "phase2_dashboard_html",
            file: "phase2_dashboard.html",
            title: "Phase 2 Reporting Dashboard",
            sha256: sha256String(html),
          },
        ],
      };

      mkdirSync(dirname(manifestPath), { recursive: true });
      writeFileSync(
        manifestPath,
        `${JSON.stringify(manifest, null, 2)}\n`,
        "utf8",
      );
    }

    console.log(`rendered standalone dashboard to ${outputPath}`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[FAIL] ${message}`);
    return 1;
  }
}

process.exitCode = main();
