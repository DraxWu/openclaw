#!/usr/bin/env node
/**
 * Build a structured Feishu (Lark) bot message from a PR git diff and POST it.
 *
 * Env:
 *   FEISHU_WEBHOOK_URL — required bot hook URL
 *   PR_TITLE, PR_URL, PR_ACTION, PR_AUTHOR, PR_NUMBER
 *   PR_BASE_REF, PR_HEAD_REF, PR_BODY (optional)
 *   DIFF_TEXT — unified diff (optional; falls back to git diff BASE..HEAD)
 *   BASE_SHA, HEAD_SHA — used when DIFF_TEXT unset
 */

import { execFileSync } from "node:child_process";
import process from "node:process";

const MAX_DIFF_CHARS = 12_000;
const MAX_FILES_IN_CARD = 40;

function env(name, fallback = "") {
  return (process.env[name] ?? fallback).trim();
}

function truncate(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 20)}\n\n…(已截断)`;
}

function parseDiff(diffText) {
  const files = [];
  let current = null;

  for (const line of diffText.split("\n")) {
    if (line.startsWith("diff --git ")) {
      const match = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
      if (current) files.push(current);
      const path = match?.[2] ?? match?.[1] ?? line.slice("diff --git ".length);
      current = {
        path,
        status: "modified",
        additions: 0,
        deletions: 0,
        hunks: [],
        addedLines: [],
        removedLines: [],
      };
      continue;
    }
    if (!current) continue;

    if (line.startsWith("new file mode")) {
      current.status = "added";
    } else if (line.startsWith("deleted file mode")) {
      current.status = "deleted";
    } else if (line.startsWith("rename from ")) {
      current.status = "renamed";
      current.renameFrom = line.slice("rename from ".length);
    } else if (line.startsWith("rename to ")) {
      current.renameTo = line.slice("rename to ".length);
      current.path = current.renameTo;
    } else if (line.startsWith("@@")) {
      current.hunks.push(line);
    } else if (line.startsWith("+") && !line.startsWith("+++")) {
      current.additions += 1;
      if (current.addedLines.length < 8) current.addedLines.push(line.slice(1));
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      current.deletions += 1;
      if (current.removedLines.length < 4) current.removedLines.push(line.slice(1));
    }
  }
  if (current) files.push(current);

  const totals = files.reduce(
    (acc, f) => {
      acc.additions += f.additions;
      acc.deletions += f.deletions;
      return acc;
    },
    { additions: 0, deletions: 0 },
  );

  return { files, totals };
}

function describeFile(file) {
  const parts = [];
  const statusLabel =
    file.status === "added"
      ? "新增"
      : file.status === "deleted"
        ? "删除"
        : file.status === "renamed"
          ? "重命名"
          : "修改";
  parts.push(`【${statusLabel}】${file.path} (+${file.additions}/-${file.deletions})`);

  if (file.path.endsWith("package.json")) {
    const scriptAdds = file.addedLines.filter((l) => /^\s*"/.test(l));
    if (scriptAdds.length > 0) {
      parts.push(`  npm scripts: ${scriptAdds.map((l) => l.trim()).join("; ")}`);
    }
  }

  const samples = file.addedLines.slice(0, 3).map((l) => `  + ${l.trim()}`);
  if (samples.length > 0 && !file.path.endsWith("package.json")) {
    parts.push(samples.join("\n"));
  }

  return parts.join("\n");
}

function buildSummary(parsed) {
  const { files, totals } = parsed;
  const byStatus = { added: 0, deleted: 0, modified: 0, renamed: 0 };
  for (const f of files) byStatus[f.status] = (byStatus[f.status] ?? 0) + 1;

  const lines = [
    `变更文件 ${files.length} 个，合计 +${totals.additions} / -${totals.deletions} 行`,
    `新增 ${byStatus.added} · 修改 ${byStatus.modified} · 删除 ${byStatus.deleted} · 重命名 ${byStatus.renamed}`,
  ];

  const top = files.slice(0, MAX_FILES_IN_CARD).map(describeFile);
  lines.push("", "—— 文件明细 ——", ...top);
  if (files.length > MAX_FILES_IN_CARD) {
    lines.push(`…另有 ${files.length - MAX_FILES_IN_CARD} 个文件未列出`);
  }

  return lines.join("\n");
}

function buildFeishuPayload(params) {
  const { title, url, action, author, number, baseRef, headRef, body, summary, diffExcerpt } =
    params;

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
  const textBlock = [
    `**仓库 PR**`,
    `标题: ${title}`,
    `作者: ${author}`,
    `分支: ${headRef} → ${baseRef}`,
    `链接: ${url}`,
    body ? `\n描述:\n${truncate(body, 500)}` : "",
    "",
    "**变更解读**",
    summary,
    "",
    "**Diff 摘要**",
    truncate(diffExcerpt || "(无 diff)", 3500),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    msg_type: "interactive",
    card: {
      header: {
        title: { tag: "plain_text", content: cardTitle },
        template: action === "closed" ? "grey" : "blue",
      },
      elements: [
        {
          tag: "div",
          text: { tag: "lark_md", content: textBlock },
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
  if (fromEnv) return fromEnv;

  const base = env("BASE_SHA");
  const head = env("HEAD_SHA");
  if (!base || !head) {
    throw new Error("Set DIFF_TEXT or both BASE_SHA and HEAD_SHA");
  }
  return execFileSync("git", ["diff", `${base}...${head}`], { encoding: "utf8" });
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

  const diffText = readDiff();
  const parsed = parseDiff(diffText);
  const summary = buildSummary(parsed);
  const diffExcerpt = diffText
    .split("\n")
    .filter((l) => l.startsWith("+++") || l.startsWith("---") || l.startsWith("@@") || l.startsWith("+") || l.startsWith("-"))
    .join("\n");

  const payload = buildFeishuPayload({
    title,
    url,
    action,
    author,
    number,
    baseRef,
    headRef,
    body,
    summary,
    diffExcerpt,
  });

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
