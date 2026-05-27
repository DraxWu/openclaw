#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const LABELER_PATH = path.join(process.cwd(), ".github", "labeler.yml");
const LABEL_LINE_RE = /^"([^"]+)":\s*$/;
const GLOB_LINE_RE = /^\s+-\s+"([^"]+)"\s*$/;

/**
 * @typedef {{ label: string; globs: string[] }} ScopeRule
 */

/**
 * @param {string} glob
 * @param {string} filePath
 */
export function matchGlob(glob, filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  const pattern = glob.replace(/\\/g, "/");
  const re = globToRegExp(pattern);
  return re.test(normalized);
}

/**
 * @param {string} pattern
 */
function globToRegExp(pattern) {
  let re = "^";
  for (let i = 0; i < pattern.length; i += 1) {
    const ch = pattern[i];
    if (ch === "*") {
      if (pattern[i + 1] === "*") {
        if (pattern[i + 2] === "/") {
          re += "(?:.*/)?";
          i += 2;
        } else {
          re += ".*";
          i += 1;
        }
      } else {
        re += "[^/]*";
      }
      continue;
    }
    if (ch === "?") {
      re += "[^/]";
      continue;
    }
    re += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`${re}$`);
}

/**
 * @returns {ScopeRule[]}
 */
export function loadScopeRules(labelerPath = LABELER_PATH) {
  const raw = fs.readFileSync(labelerPath, "utf8");
  /** @type {ScopeRule[]} */
  const rules = [];
  let currentLabel = "";
  /** @type {string[]} */
  let currentGlobs = [];

  const flush = () => {
    if (currentLabel && currentGlobs.length > 0) {
      rules.push({ label: currentLabel, globs: [...currentGlobs] });
    }
    currentLabel = "";
    currentGlobs = [];
  };

  for (const line of raw.split("\n")) {
    const labelMatch = line.match(LABEL_LINE_RE);
    if (labelMatch) {
      flush();
      currentLabel = labelMatch[1] ?? "";
      continue;
    }
    const globMatch = line.match(GLOB_LINE_RE);
    if (globMatch && currentLabel) {
      currentGlobs.push(globMatch[1] ?? "");
    }
  }
  flush();
  return rules;
}

/**
 * @param {string[]} files
 * @param {ScopeRule[]} [rules]
 */
export function detectBusinessScopes(files, rules = loadScopeRules()) {
  /** @type {Map<string, string[]>} */
  const hits = new Map();

  for (const file of files) {
    for (const rule of rules) {
      if (!rule.globs.some((glob) => matchGlob(glob, file))) {
        continue;
      }
      const list = hits.get(rule.label) ?? [];
      list.push(file);
      hits.set(rule.label, list);
    }
  }

  if (hits.size === 0) {
    return inferFallbackScopes(files);
  }

  return [...hits.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, matchedFiles]) => ({
      label,
      matchedFiles: [...new Set(matchedFiles)].sort(),
    }));
}

/**
 * @param {string[]} files
 */
function inferFallbackScopes(files) {
  /** @type {Map<string, string[]>} */
  const buckets = new Map();

  for (const file of files) {
    const normalized = file.replace(/\\/g, "/");
    let label = "other";
    if (normalized.startsWith("src/")) {
      label = "core";
    } else if (normalized.startsWith("extensions/")) {
      const parts = normalized.split("/");
      label = parts.length >= 2 ? `extensions: ${parts[1]}` : "extensions";
    } else if (normalized.startsWith("apps/")) {
      const parts = normalized.split("/");
      label = parts.length >= 2 ? `app: ${parts[1]}` : "apps";
    } else if (normalized.startsWith("docs/")) {
      label = "docs";
    } else if (normalized === "package.json" || normalized.startsWith("pnpm")) {
      label = "tooling / package scripts";
    }

    const list = buckets.get(label) ?? [];
    list.push(normalized);
    buckets.set(label, list);
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, matchedFiles]) => ({ label, matchedFiles: [...new Set(matchedFiles)].sort() }));
}
