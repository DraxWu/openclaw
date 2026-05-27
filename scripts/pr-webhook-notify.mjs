#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";

import { detectBusinessScopes } from "./lib/pr-notify-scope.mjs";

/**
 * @typedef {{
 *   number: number;
 *   title: string;
 *   url: string;
 *   state: string;
 *   draft: boolean;
 *   headRefName: string;
 *   baseRefName: string;
 *   authorLogin: string;
 *   additions: number;
 *   deletions: number;
 *   changedFiles: number;
 *   body: string;
 * }} PullRequestSummary
 */

/**
 * @typedef {{
 *   filename: string;
 *   status: string;
 *   additions: number;
 *   deletions: number;
 *   changes: number;
 * }} PullRequestFile
 */

/**
 * @typedef {{
 *   event: string;
 *   repo: string;
 *   pr: PullRequestSummary;
 *   files: PullRequestFile[];
 *   stats: { changed: number; added: number; modified: number; deleted: number; renamed: number };
 *   scopes: ReturnType<typeof detectBusinessScopes>;
 *   mergeAnalysis: {
 *     summary: string;
 *     factors: string[];
 *     cautions: string[];
 *     suggestedChecks: string[];
 *   };
 * }} NotifyPayload
 */

function parseArgs(argv) {
  /** @type {{ repo: string; pr: string; event: string; dryRun: boolean; webhookUrl: string; format: string }} */
  const args = {
    repo: "",
    pr: "",
    event: "pull_request",
    dryRun: false,
    webhookUrl: "",
    format: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--repo") {
      args.repo = argv[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (token === "--pr") {
      args.pr = argv[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (token === "--event") {
      args.event = argv[i + 1] ?? args.event;
      i += 1;
      continue;
    }
    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (token === "--webhook-url") {
      args.webhookUrl = argv[i + 1] ?? "";
      i += 1;
    }
    if (token === "--format") {
      args.format = argv[i + 1] ?? "";
      i += 1;
    }
  }

  return args;
}

function runGh(args) {
  return execFileSync("gh", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/**
 * @param {string} repo
 * @param {string | number} prNumber
 */
function fetchPullRequest(repo, prNumber) {
  const json = runGh([
    "api",
    `repos/${repo}/pulls/${prNumber}`,
    "-H",
    "Accept: application/vnd.github+json",
  ]);
  const data = JSON.parse(json);
  return /** @type {PullRequestSummary} */ ({
    number: data.number,
    title: data.title ?? "",
    url: data.html_url ?? "",
    state: data.state ?? "open",
    draft: Boolean(data.draft),
    headRefName: data.head?.ref ?? "",
    baseRefName: data.base?.ref ?? "",
    authorLogin: data.user?.login ?? "unknown",
    additions: data.additions ?? 0,
    deletions: data.deletions ?? 0,
    changedFiles: data.changed_files ?? 0,
    body: data.body ?? "",
  });
}

/**
 * @param {string} repo
 * @param {string | number} prNumber
 */
function fetchPullRequestFiles(repo, prNumber) {
  const json = runGh([
    "api",
    `repos/${repo}/pulls/${prNumber}/files`,
    "--paginate",
    "-H",
    "Accept: application/vnd.github+json",
  ]);
  const data = JSON.parse(json);
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map((file) => ({
    filename: file.filename ?? "",
    status: file.status ?? "changed",
    additions: file.additions ?? 0,
    deletions: file.deletions ?? 0,
    changes: file.changes ?? 0,
  }));
}

/**
 * @param {PullRequestFile[]} files
 */
function summarizeFileStats(files) {
  let added = 0;
  let modified = 0;
  let deleted = 0;
  let renamed = 0;

  for (const file of files) {
    switch (file.status) {
      case "added":
        added += 1;
        break;
      case "removed":
        deleted += 1;
        break;
      case "renamed":
        renamed += 1;
        break;
      default:
        modified += 1;
        break;
    }
  }

  return {
    changed: files.length,
    added,
    modified,
    deleted,
    renamed,
  };
}

/**
 * @param {NotifyPayload} payload
 */
function buildMergeAnalysis(payload) {
  const { pr, files, stats, scopes } = payload;
  /** @type {string[]} */
  const factors = [];
  /** @type {string[]} */
  const cautions = [];
  /** @type {string[]} */
  const suggestedChecks = [];

  if (stats.changed <= 3 && pr.additions + pr.deletions <= 80) {
    factors.push("变更面较小，便于快速审阅。");
  } else if (stats.changed > 20 || pr.additions + pr.deletions > 800) {
    cautions.push("变更文件或行数较多，建议分模块审阅并关注回归风险。");
  } else {
    factors.push("变更规模中等，可按业务范围拆分审查。");
  }

  if (pr.draft) {
    cautions.push("当前为 Draft PR，通常表示作者仍在迭代，合并前可等待转为 Ready。");
  }

  const scopeLabels = scopes.map((scope) => scope.label);
  if (scopeLabels.length === 1) {
    factors.push(`影响集中在单一业务范围：${scopeLabels[0]}。`);
  } else if (scopeLabels.length > 3) {
    cautions.push(`跨多个业务范围（${scopeLabels.length} 个），集成与发布影响面更广。`);
  }

  const touchesCore = scopes.some((scope) =>
    ["gateway", "agents", "cli", "commands", "security"].includes(scope.label),
  );
  const touchesChannel = scopes.some((scope) => scope.label.startsWith("channel:"));
  const touchesApp = scopes.some((scope) => scope.label.startsWith("app:"));

  if (touchesCore) {
    cautions.push("触及核心运行时（gateway/agents/cli 等），建议跑完整 CI 并关注配置兼容性。");
    suggestedChecks.push("pnpm check");
    suggestedChecks.push("pnpm test");
  }
  if (touchesChannel) {
    cautions.push("触及消息通道实现，需确认所有内置与插件通道的共享逻辑未被破坏。");
    suggestedChecks.push("针对相关通道的定向测试");
  }
  if (touchesApp) {
    suggestedChecks.push("相关平台应用构建或冒烟（如适用）");
  }

  const onlyDocs = files.every((file) => file.filename.startsWith("docs/"));
  const onlyScripts =
    files.length > 0 &&
    files.every(
      (file) =>
        file.filename.startsWith("scripts/") ||
        file.filename === "package.json" ||
        file.filename.endsWith(".yml") ||
        file.filename.endsWith(".yaml"),
    );

  if (onlyDocs) {
    factors.push("仅文档变更，功能回归风险相对较低。");
  } else if (onlyScripts) {
    factors.push("主要为脚本/工具链变更，需确认 CI 与开发者工作流仍可用。");
    suggestedChecks.push("pnpm check（若触及 lint/format 配置）");
  }

  if (files.some((file) => file.filename.includes("CODEOWNERS") || file.filename.includes("security"))) {
    cautions.push("涉及安全或 CODEOWNERS 路径，建议由对应维护者审阅。");
  }

  const uniqueChecks = [...new Set(suggestedChecks)];
  let summary =
    "以下为合并前参考分析，不构成自动合并决定。请结合 CI 结果、审阅意见与发布窗口自行判断。";
  if (factors.length === 0 && cautions.length === 0) {
    summary += " 当前未发现显著风险信号，但仍建议完成常规审阅。";
  } else if (cautions.length === 0) {
    summary += " 整体风险信号较少，可优先做针对性验证后合并。";
  } else if (factors.length > cautions.length) {
    summary += " 有利因素与注意事项并存，建议先处理 cautions 中列出的项。";
  } else {
    summary += " 存在若干需要关注的点，建议在合并前逐项确认。";
  }

  return { summary, factors, cautions, suggestedChecks: uniqueChecks };
}

/**
 * @param {NotifyPayload} payload
 */
function buildFeishuCard(payload) {
  const { pr, stats, scopes, mergeAnalysis, event, repo } = payload;
  const scopeLines =
    scopes.length === 0
      ? "未能匹配到 labeler 规则，已使用路径启发式归类。"
      : scopes
          .map((scope) => `- **${scope.label}**（${scope.matchedFiles.length} 个文件）`)
          .join("\n");

  const factorLines =
    mergeAnalysis.factors.length > 0
      ? mergeAnalysis.factors.map((line) => `- ${line}`).join("\n")
      : "- （无额外有利因素）";
  const cautionLines =
    mergeAnalysis.cautions.length > 0
      ? mergeAnalysis.cautions.map((line) => `- ${line}`).join("\n")
      : "- （暂无特别注意事项）";
  const checkLines =
    mergeAnalysis.suggestedChecks.length > 0
      ? mergeAnalysis.suggestedChecks.map((line) => `- \`${line}\``).join("\n")
      : "- 按仓库默认 landing bar（pnpm check / pnpm test 等）";

  const markdown = [
    `**仓库**：${repo}`,
    `**事件**：${event}`,
    `**PR**：[#${pr.number} ${pr.title}](${pr.url})`,
    `**作者**：@${pr.authorLogin}`,
    `**源分支 → 目标分支**：\`${pr.headRefName}\` → \`${pr.baseRefName}\``,
    "",
    "**文件统计**",
    `- 变更文件：**${stats.changed}**`,
    `- 新增：**${stats.added}** · 修改：**${stats.modified}** · 删除：**${stats.deleted}** · 重命名：**${stats.renamed}**`,
    `- 行变更：+${pr.additions} / -${pr.deletions}`,
    "",
    "**业务范围**",
    scopeLines,
    "",
    "**合并参考分析**（非自动决策）",
    mergeAnalysis.summary,
    "",
    "有利因素：",
    factorLines,
    "",
    "注意事项：",
    cautionLines,
    "",
    "建议验证：",
    checkLines,
  ].join("\n");

  return {
    msg_type: "interactive",
    card: {
      config: { wide_screen_mode: true },
      header: {
        template: pr.draft ? "grey" : "blue",
        title: {
          tag: "plain_text",
          content: `PR #${pr.number} · ${pr.headRefName}`,
        },
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
              type: "primary",
              url: pr.url,
            },
          ],
        },
      ],
    },
  };
}

/**
 * @param {NotifyPayload} payload
 */
function buildGenericPayload(payload) {
  return {
    type: "openclaw.pr.notify",
    ...payload,
    cardMarkdown: buildFeishuCard(payload).card.elements[0].text.content,
  };
}

/**
 * @param {string} url
 */
function detectWebhookFormat(url, explicit) {
  if (explicit === "feishu" || explicit === "generic") {
    return explicit;
  }
  if (/feishu\.cn|larksuite\.com|open\.feishu/i.test(url)) {
    return "feishu";
  }
  return "generic";
}

/**
 * @param {string} url
 * @param {unknown} body
 */
async function postWebhook(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Webhook HTTP ${response.status}: ${text.slice(0, 500)}`);
  }
  return text;
}

function resolveRepoAndPr(args) {
  let repo = args.repo.trim();
  let prNumber = args.pr.trim();

  const eventPath = process.env.GITHUB_EVENT_PATH?.trim();
  if ((!repo || !prNumber) && eventPath && fs.existsSync(eventPath)) {
    const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
    repo = repo || event.repository?.full_name || "";
    prNumber = prNumber || String(event.pull_request?.number ?? event.number ?? "");
    if (!args.event || args.event === "pull_request") {
      args.event = process.env.GITHUB_EVENT_NAME || args.event;
    }
  }

  if (!repo && process.env.GITHUB_REPOSITORY) {
    repo = process.env.GITHUB_REPOSITORY;
  }

  if (!prNumber) {
    throw new Error("Missing PR number. Pass --pr <number> or run inside a pull_request workflow.");
  }
  if (!repo) {
    throw new Error("Missing repository. Pass --repo owner/name or set GITHUB_REPOSITORY.");
  }

  return { repo, prNumber, event: args.event };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const webhookUrl =
    args.webhookUrl.trim() ||
    process.env.PR_NOTIFY_WEBHOOK_URL?.trim() ||
    process.env.OPENCLAW_PR_NOTIFY_WEBHOOK_URL?.trim() ||
    "";

  const { repo, prNumber, event } = resolveRepoAndPr(args);
  const pr = fetchPullRequest(repo, prNumber);
  const files = fetchPullRequestFiles(repo, prNumber);
  const stats = summarizeFileStats(files);
  const scopes = detectBusinessScopes(files.map((file) => file.filename));

  /** @type {NotifyPayload} */
  const payload = {
    event,
    repo,
    pr,
    files,
    stats,
    scopes,
    mergeAnalysis: { summary: "", factors: [], cautions: [], suggestedChecks: [] },
  };
  payload.mergeAnalysis = buildMergeAnalysis(payload);

  const format = detectWebhookFormat(webhookUrl, args.format);
  const body = format === "feishu" ? buildFeishuCard(payload) : buildGenericPayload(payload);

  const output = JSON.stringify(body, null, 2);
  if (args.dryRun || !webhookUrl) {
    console.log(output);
    if (!webhookUrl) {
      console.error(
        "PR_NOTIFY_WEBHOOK_URL is not set; printed payload only (dry-run). Configure the secret to deliver cards.",
      );
      process.exitCode = 0;
    }
    return;
  }

  const responseText = await postWebhook(webhookUrl, body);
  if (responseText.trim()) {
    console.log(responseText.trim());
  }
  console.log(`Delivered PR #${pr.number} notification to webhook (${format}).`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
