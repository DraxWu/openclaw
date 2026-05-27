#!/usr/bin/env node
/**
 * Build a structured Feishu (Lark) interactive card from a PR git diff and POST it.
 *
 * Env:
 *   FEISHU_WEBHOOK_URL — required bot hook URL
 *   PR_TITLE, PR_URL, PR_ACTION, PR_AUTHOR, PR_NUMBER
 *   PR_BASE_REF, PR_HEAD_REF, PR_BODY (optional)
 *   PR_DRAFT — "true" when the PR is a draft
 *   DIFF_TEXT — unified diff (optional; falls back to git diff BASE..HEAD)
 *   BASE_SHA, HEAD_SHA — used when DIFF_TEXT unset
 */

import { execFileSync } from "node:child_process";
import process from "node:process";
import {
  buildBusinessScopeSection,
  buildFileDetailSection,
  buildFileStatsSection,
  buildMergeConsiderationSection,
  detectBusinessScopes,
  parseDiff,
  truncate,
} from "./feishu-pr-notify-lib.mjs";

const MAX_DIFF_EXCERPT = 3500;

function env(name, fallback = "") {
  return (process.env[name] ?? fallback).trim();
}

/**
 * @param {import("./feishu-pr-notify-lib.mjs").ParsedDiff} parsed
 * @param {ReturnType<typeof detectBusinessScopes>} scopes
 * @param {object} meta
 */
export function buildCardMarkdown(parsed, scopes, meta) {
  const { title, url, author, baseRef, headRef, body, action, isDraft, diffExcerpt } = meta;

  const actionLabel =
    {
      opened: "已打开",
      reopened: "已重新打开",
      synchronize: "已更新",
      closed: "已关闭",
      ready_for_review: "可评审",
      converted_to_draft: "转为草稿",
    }[action] ?? action;

  return [
    `**Pull Request** · ${actionLabel}`,
    `- 标题: ${title}`,
    `- 作者: ${author}`,
    `- 来源分支: **${headRef || "(未知)"}** → 目标分支: **${baseRef}**`,
    `- 链接: ${url}`,
    isDraft ? "- 状态: **Draft 草稿**" : "",
    body ? `\n**描述**\n${truncate(body, 500)}` : "",
    "",
    buildFileStatsSection(parsed),
    "",
    buildBusinessScopeSection(scopes),
    "",
    buildMergeConsiderationSection(parsed, scopes, { action, isDraft }),
    "",
    buildFileDetailSection(parsed),
    "",
    "**Diff 摘要**",
    truncate(diffExcerpt || "(无 diff)", MAX_DIFF_EXCERPT),
  ]
    .filter((line) => line !== "")
    .join("\n");
}

/**
 * @param {object} params
 */
export function buildFeishuPayload(params) {
  const { cardTitle, markdown, url } = params;
  return {
    msg_type: "interactive",
    card: {
      header: {
        title: { tag: "plain_text", content: cardTitle },
        template: params.headerTemplate ?? "blue",
      },
      elements: [
        {
          tag: "div",
          text: { tag: "lark_md", content: markdown },
        },
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: { tag: "plain_text", content: "在 GitHub 查看" },
              url,
              type: "primary",
            },
          ],
        },
      ],
    },
  };
}

function readDiff() {
  const fromEnv = env("DIFF_TEXT");
  if (fromEnv) {
    return fromEnv;
  }

  const base = env("BASE_SHA");
  const head = env("HEAD_SHA");
  if (!base || !head) {
    throw new Error("Set DIFF_TEXT or both BASE_SHA and HEAD_SHA");
  }
  return execFileSync("git", ["diff", `${base}...${head}`], { encoding: "utf8" });
}

function buildDiffExcerpt(diffText) {
  return diffText
    .split("\n")
    .filter(
      (l) =>
        l.startsWith("+++") ||
        l.startsWith("---") ||
        l.startsWith("@@") ||
        l.startsWith("+") ||
        l.startsWith("-"),
    )
    .join("\n");
}

async function main() {
  const webhook = env("FEISHU_WEBHOOK_URL");
  if (!webhook) {
    console.error("FEISHU_WEBHOOK_URL is required");
    process.exit(1);
  }

  const number = env("PR_NUMBER", "0");
  const title = env("PR_TITLE", "(no title)");
  const url = env("PR_URL");
  const action = env("PR_ACTION", "unknown");
  const author = env("PR_AUTHOR", "unknown");
  const baseRef = env("PR_BASE_REF", "main");
  const headRef = env("PR_HEAD_REF", "");
  const body = env("PR_BODY");
  const isDraft = env("PR_DRAFT").toLowerCase() === "true";

  const diffText = readDiff();
  const parsed = parseDiff(diffText);
  const scopes = detectBusinessScopes(parsed.files.map((f) => f.path));
  const diffExcerpt = buildDiffExcerpt(diffText);

  const actionLabel =
    {
      opened: "已打开",
      reopened: "已重新打开",
      synchronize: "已更新",
      closed: "已关闭",
      ready_for_review: "可评审",
      converted_to_draft: "转为草稿",
    }[action] ?? action;

  const cardTitle = `PR #${number} ${actionLabel}: ${title}`;
  const headerTemplate = action === "closed" ? "grey" : isDraft ? "orange" : "blue";

  const markdown = buildCardMarkdown(parsed, scopes, {
    title,
    url,
    author,
    baseRef,
    headRef,
    body,
    action,
    isDraft,
    diffExcerpt,
  });

  const payload = buildFeishuPayload({ cardTitle, markdown, url, headerTemplate });

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`Feishu webhook failed: ${res.status} ${text}`);
    process.exit(1);
  }

  let parsedResponse;
  try {
    parsedResponse = JSON.parse(text);
  } catch {
    parsedResponse = { raw: text };
  }

  if (parsedResponse.StatusCode !== undefined && parsedResponse.StatusCode !== 0) {
    console.error("Feishu API error:", parsedResponse);
    process.exit(1);
  }
  if (parsedResponse.code !== undefined && parsedResponse.code !== 0) {
    console.error("Feishu API error:", parsedResponse);
    process.exit(1);
  }

  console.log("Feishu PR notification sent:", parsedResponse);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
