import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = resolve(__dirname, "../..");
const BASE = "/xm-knowledge/";

function resolveFile(href: string): string | null {
  if (!href.startsWith(BASE)) return null;
  const relative = href.slice(BASE.length).replace(/\/$/, "");
  const candidates = [
    resolve(DOCS_ROOT, relative + ".md"),
    resolve(DOCS_ROOT, relative, "index.md"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

function parseDate(filePath: string): string | null {
  try {
    const content = readFileSync(filePath, "utf-8");
    const m = content.match(/^---\n([\s\S]*?)\n---/);
    if (!m) return null;
    const fm = m[1];
    const dateMatch = fm.match(/^date:\s*(.+)$/m);
    return dateMatch ? dateMatch[1].trim() : null;
  } catch {
    return null;
  }
}

export function enrichTreeDates(): Plugin {
  return {
    name: "enrich-tree-dates",
    enforce: "pre",
    transform(src: string, id: string) {
      if (!id.endsWith(".md")) return;
      if (!src.includes("```tree")) return;

      const lines = src.split("\n");
      const result: string[] = [];
      let inTree = false;
      let treeStart = -1;
      let treeEnd = -1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("```tree")) {
          inTree = true;
          treeStart = i;
          treeEnd = -1;
          result.push(line);
          continue;
        }
        if (inTree && line.trimStart().startsWith("```")) {
          inTree = false;
          treeEnd = i;

          const treeLines = lines.slice(treeStart + 1, treeEnd);
          const enriched = enrichTreeBlock(treeLines);
          result.push(...enriched);
          result.push(line);
          continue;
        }
        if (!inTree) {
          result.push(line);
        }
      }

      return result.join("\n");
    },
  };
}

function enrichTreeBlock(treeLines: string[]): string[] {
  const items: { start: number; end: number; lines: string[] }[] = [];
  let currentItem: number[] | null = null;

  for (let i = 0; i < treeLines.length; i++) {
    const line = treeLines[i];
    if (line.trimStart().startsWith("- ")) {
      if (currentItem) {
        items.push({
          start: currentItem[0],
          end: currentItem[1],
          lines: treeLines.slice(currentItem[0], currentItem[1]),
        });
      }
      currentItem = [i, i + 1];
    } else if (currentItem) {
      currentItem[1] = i + 1;
    }
  }
  if (currentItem) {
    items.push({
      start: currentItem[0],
      end: currentItem[1],
      lines: treeLines.slice(currentItem[0], currentItem[1]),
    });
  }

  const result = [...treeLines];
  let offset = 0;

  for (const item of items) {
    const itemLines = item.lines;
    let href = "";
    let hasNote = false;
    for (const l of itemLines) {
      const trimmed = l.trim();
      if (trimmed.startsWith("href:")) {
        href = trimmed.slice(5).trim();
      }
      if (trimmed.startsWith("note:")) {
        hasNote = true;
      }
    }
    if (!href || hasNote) continue;

    const filePath = resolveFile(href);
    if (!filePath) continue;

    const date = parseDate(filePath);
    if (!date) continue;

    const indent = itemLines[0].match(/^(\s*)/)?.[1] ?? "";
    const insertIdx = item.start + offset + itemLines.length;

    let lastContentIdx = itemLines.length - 1;
    while (lastContentIdx >= 0 && itemLines[lastContentIdx].trim() === "") {
      lastContentIdx--;
    }
    const lastLine = itemLines[lastContentIdx];
    const lineIndent = lastLine.match(/^(\s*)/)?.[1] ?? indent;
    const noteLine = `${indent}  note: ${date}`;

    result.splice(insertIdx, 0, noteLine);
    offset++;
  }

  return result;
}
