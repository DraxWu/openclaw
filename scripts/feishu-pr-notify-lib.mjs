/**
 * PR diff parsing, business-scope detection, and merge consideration heuristics
 * for Feishu PR notifications.
 */

const MAX_FILES_IN_CARD = 40;

/** @typedef {"added"|"deleted"|"modified"|"renamed"} FileStatus */

/**
 * @typedef {Object} ParsedFile
 * @property {string} path
 * @property {FileStatus} status
 * @property {number} additions
 * @property {number} deletions
 * @property {string[]} hunks
 * @property {string[]} addedLines
 * @property {string[]} removedLines
 * @property {string} [renameFrom]
 * @property {string} [renameTo]
 */

/**
 * @typedef {Object} ParsedDiff
 * @property {ParsedFile[]} files
 * @property {{ additions: number; deletions: number }} totals
 */

/**
 * @typedef {Object} FileCounts
 * @property {number} total
 * @property {number} added
 * @property {number} modified
 * @property {number} deleted
 * @property {number} renamed
 */

/**
 * @typedef {Object} BusinessScope
 * @property {string} id
 * @property {string} label
 */

/**
 * @param {string} diffText
 * @returns {ParsedDiff}
 */
export function parseDiff(diffText) {
  /** @type {ParsedFile[]} */
  const files = [];
  /** @type {ParsedFile | null} */
  let current = null;

  for (const line of diffText.split("\n")) {
    if (line.startsWith("diff --git ")) {
      const match = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
      if (current) {
        files.push(current);
      }
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
    if (!current) {
      continue;
    }

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
      if (current.addedLines.length < 8) {
        current.addedLines.push(line.slice(1));
      }
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      current.deletions += 1;
      if (current.removedLines.length < 4) {
        current.removedLines.push(line.slice(1));
      }
    }
  }
  if (current) {
    files.push(current);
  }

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

/**
 * @param {ParsedDiff} parsed
 * @returns {FileCounts}
 */
export function countFilesByStatus(parsed) {
  /** @type {FileCounts} */
  const counts = { total: parsed.files.length, added: 0, modified: 0, deleted: 0, renamed: 0 };
  for (const file of parsed.files) {
    counts[file.status] += 1;
  }
  return counts;
}

/**
 * @param {string} path
 * @returns {string | null}
 */
function extensionPluginLabel(path) {
  const match = path.match(/^extensions\/([^/]+)\//);
  if (!match) {
    return null;
  }
  const id = match[1];
  const channelNames = {
    feishu: "飞书",
    discord: "Discord",
    slack: "Slack",
    telegram: "Telegram",
    matrix: "Matrix",
    msteams: "Microsoft Teams",
    signal: "Signal",
    whatsapp: "WhatsApp",
  };
  const friendly = channelNames[id] ?? id;
  return `插件 / ${friendly} (${id})`;
}

const SCOPE_RULES = [
  {
    id: "gateway",
    label: "Gateway 网关",
    test: (p) =>
      p.startsWith("src/gateway/") || p.startsWith("src/daemon/") || p.startsWith("docs/gateway/"),
  },
  {
    id: "cli",
    label: "CLI 命令行",
    test: (p) => p.startsWith("src/cli/"),
  },
  {
    id: "commands",
    label: "命令实现",
    test: (p) => p.startsWith("src/commands/"),
  },
  {
    id: "agents",
    label: "Agent 运行时",
    test: (p) => p.startsWith("src/agents/"),
  },
  {
    id: "channels-core",
    label: "内置频道 (core)",
    test: (p) =>
      p.startsWith("src/telegram/") ||
      p.startsWith("src/discord/") ||
      p.startsWith("src/slack/") ||
      p.startsWith("src/signal/") ||
      p.startsWith("src/imessage/") ||
      p.startsWith("src/web/") ||
      p.startsWith("src/channels/") ||
      p.startsWith("src/routing/"),
  },
  {
    id: "plugin-sdk",
    label: "Plugin SDK",
    test: (p) => p.startsWith("src/plugin-sdk/") || p.startsWith("src/plugin-sdk-internal/"),
  },
  {
    id: "config",
    label: "配置与类型",
    test: (p) => p.startsWith("src/config/"),
  },
  {
    id: "infra",
    label: "基础设施",
    test: (p) => p.startsWith("src/infra/"),
  },
  {
    id: "media",
    label: "媒体管线",
    test: (p) => p.startsWith("src/media/"),
  },
  {
    id: "android",
    label: "Android 客户端",
    test: (p) => p.startsWith("apps/android/") || p === "docs/platforms/android.md",
  },
  {
    id: "ios",
    label: "iOS 客户端",
    test: (p) => p.startsWith("apps/ios/") || p === "docs/platforms/ios.md",
  },
  {
    id: "macos",
    label: "macOS 客户端",
    test: (p) =>
      p.startsWith("apps/macos/") ||
      p.startsWith("docs/platforms/macos.md") ||
      p.startsWith("docs/platforms/mac/"),
  },
  {
    id: "web-ui",
    label: "Web 控制面板",
    test: (p) => p.startsWith("ui/"),
  },
  {
    id: "docs",
    label: "文档",
    test: (p) => p.startsWith("docs/") || /\.mdx?$/.test(p),
  },
  {
    id: "ci",
    label: "CI / GitHub Actions",
    test: (p) => p.startsWith(".github/"),
  },
  {
    id: "scripts",
    label: "脚本工具",
    test: (p) => p.startsWith("scripts/"),
  },
  {
    id: "deps",
    label: "依赖与锁文件",
    test: (p) =>
      p === "package.json" ||
      p === "pnpm-lock.yaml" ||
      p === "pnpm-workspace.yaml" ||
      p.endsWith("/package.json"),
  },
  {
    id: "security",
    label: "安全相关",
    test: (p) =>
      /security/i.test(p) ||
      p === "CODEOWNERS" ||
      p.startsWith("docs/gateway/security") ||
      p.startsWith("docs/cli/security"),
  },
  {
    id: "changelog",
    label: "变更日志",
    test: (p) => p === "CHANGELOG.md",
  },
];

/**
 * @param {string[]} paths
 * @returns {BusinessScope[]}
 */
export function detectBusinessScopes(paths) {
  /** @type {Map<string, BusinessScope>} */
  const found = new Map();

  for (const rawPath of paths) {
    const path = String(rawPath).trim();
    if (!path) {
      continue;
    }

    const pluginLabel = extensionPluginLabel(path);
    if (pluginLabel) {
      const id = `ext:${path.match(/^extensions\/([^/]+)/)?.[1] ?? "unknown"}`;
      found.set(id, { id, label: pluginLabel });
    }

    for (const rule of SCOPE_RULES) {
      if (rule.test(path)) {
        found.set(rule.id, { id: rule.id, label: rule.label });
      }
    }
  }

  if (found.size === 0) {
    return [{ id: "other", label: "其他 / 未归类路径" }];
  }

  return [...found.values()].toSorted((a, b) => a.label.localeCompare(b.label, "zh"));
}

/**
 * @param {ParsedFile} file
 */
function describeFile(file) {
  const statusLabel =
    file.status === "added"
      ? "新增"
      : file.status === "deleted"
        ? "删除"
        : file.status === "renamed"
          ? "重命名"
          : "修改";
  const parts = [`【${statusLabel}】${file.path} (+${file.additions}/-${file.deletions})`];

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

/**
 * @param {ParsedDiff} parsed
 */
export function buildFileStatsSection(parsed) {
  const counts = countFilesByStatus(parsed);
  const { totals } = parsed;
  return [
    `**文件统计**`,
    `- 合计 **${counts.total}** 个文件（+${totals.additions} / -${totals.deletions} 行）`,
    `- 新增 **${counts.added}** · 修改 **${counts.modified}** · 删除 **${counts.deleted}** · 重命名 **${counts.renamed}**`,
  ].join("\n");
}

/**
 * @param {ParsedDiff} parsed
 */
export function buildFileDetailSection(parsed) {
  const { files } = parsed;
  const top = files.slice(0, MAX_FILES_IN_CARD).map(describeFile);
  const lines = ["**文件明细**", ...top];
  if (files.length > MAX_FILES_IN_CARD) {
    lines.push(`…另有 ${files.length - MAX_FILES_IN_CARD} 个文件未列出`);
  }
  return lines.join("\n");
}

/**
 * @param {BusinessScope[]} scopes
 */
export function buildBusinessScopeSection(scopes) {
  const labels = scopes.map((s) => s.label);
  return ["**影响业务范围**", labels.map((l) => `- ${l}`).join("\n")].join("\n");
}

/**
 * @param {ParsedDiff} parsed
 * @param {BusinessScope[]} scopes
 * @param {{ action?: string; isDraft?: boolean }} context
 */
export function buildMergeConsiderationSection(parsed, scopes, context = {}) {
  const counts = countFilesByStatus(parsed);
  const { totals, files } = parsed;
  const paths = files.map((f) => f.path);
  const lineChurn = totals.additions + totals.deletions;

  const considerations = [];

  if (context.isDraft) {
    considerations.push("当前为 **Draft PR**，通常表示作者仍在迭代，合并前建议等待转为 Ready。");
  }

  if (context.action === "closed") {
    considerations.push("PR 已 **关闭**，本条通知仅供归档参考。");
  }

  let sizeLabel = "小型";
  if (counts.total > 25 || lineChurn > 1500) {
    sizeLabel = "大型";
  } else if (counts.total > 8 || lineChurn > 400) {
    sizeLabel = "中型";
  }
  considerations.push(
    `变更规模为 **${sizeLabel}**（${counts.total} 个文件，+${totals.additions}/-${totals.deletions} 行）。`,
  );

  const scopeIds = new Set(scopes.map((s) => s.id));
  const touchesSrc = paths.some((p) => p.startsWith("src/") || p.startsWith("extensions/"));
  const touchesTests = paths.some((p) => /\.test\.[cm]?[jt]sx?$/.test(p) || p.startsWith("test/"));
  const docsOnly =
    paths.length > 0 &&
    paths.every((p) => p.startsWith("docs/") || /\.mdx?$/.test(p) || p === "CHANGELOG.md");

  if (docsOnly) {
    considerations.push(
      "变更集中在 **文档**，功能回归风险相对较低，但仍需核对链接与示例是否准确。",
    );
  }

  if (scopeIds.has("security") || scopeIds.has("gateway") || scopeIds.has("plugin-sdk")) {
    considerations.push(
      "触及 **网关 / SDK / 安全** 相关路径，建议由熟悉该模块的同事评审，并关注权限、认证与向后兼容。",
    );
  }

  if (scopeIds.has("deps")) {
    considerations.push(
      "包含 **依赖或锁文件** 变更，合并前建议确认 CI 全绿并留意供应链与版本锁定影响。",
    );
  }

  if (touchesSrc && !touchesTests && !docsOnly) {
    considerations.push(
      "有源码变更但 **未看到配套测试文件** 变更；若行为有变，请确认是否已有覆盖或需要补测。",
    );
  } else if (touchesTests) {
    considerations.push("包含 **测试** 变更，合并前可重点查看新增/调整的用例是否覆盖本次行为。");
  }

  if (counts.deleted > 0) {
    considerations.push(`含 **${counts.deleted}** 个删除文件，请确认是否为预期清理而非误删。`);
  }

  const channelScopes = scopes.filter((s) => s.id.startsWith("ext:") || s.id === "channels-core");
  if (channelScopes.length > 0) {
    considerations.push(
      `涉及 **消息频道**（${channelScopes.map((s) => s.label).join("、")}），建议做对应渠道的发送/收消息冒烟。`,
    );
  }

  if (considerations.length === 0) {
    considerations.push("未识别到显著风险信号；仍请结合 PR 描述与 CI 结果自行判断是否合并。");
  }

  return [
    "**合并考量（供你判断，非自动决策）**",
    "以下仅为基于 diff 的启发式分析，**不会代替你做出合并决定**：",
    ...considerations.map((c) => `- ${c}`),
    "",
    "_请结合 Code Review、CI 状态、发布窗口与团队约定自行决定是否合并。_",
  ].join("\n");
}

/**
 * @param {string} text
 * @param {number} max
 */
export function truncate(text, max) {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 20)}\n\n…(已截断)`;
}
