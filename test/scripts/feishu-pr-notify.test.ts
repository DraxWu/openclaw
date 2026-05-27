import { describe, expect, it } from "vitest";
import {
  buildFileStatsSection,
  buildMergeConsiderationSection,
  countFilesByStatus,
  detectBusinessScopes,
  parseDiff,
} from "../../scripts/feishu-pr-notify-lib.mjs";

const SAMPLE_DIFF = `diff --git a/package.json b/package.json
index 111..222 100644
--- a/package.json
+++ b/package.json
@@ -1,3 +1,4 @@
 {
+  "dev:new": "pnpm dev"
 }
diff --git a/docs/ci.md b/docs/ci.md
new file mode 100644
index 000..333
--- /dev/null
+++ b/docs/ci.md
@@ -0,0 +1,2 @@
+# CI
+hello
diff --git a/src/gateway/foo.ts b/src/gateway/foo.ts
deleted file mode 100644
index 444..000
--- a/src/gateway/foo.ts
+++ /dev/null
@@ -1,2 +0,0 @@
-export const x = 1;
-export const y = 2;
`;

describe("feishu-pr-notify", () => {
  it("parses added, modified, and deleted files", () => {
    const parsed = parseDiff(SAMPLE_DIFF);
    const counts = countFilesByStatus(parsed);
    expect(counts.total).toBe(3);
    expect(counts.added).toBe(1);
    expect(counts.modified).toBe(1);
    expect(counts.deleted).toBe(1);
    expect(parsed.totals.additions).toBeGreaterThan(0);
    expect(parsed.totals.deletions).toBeGreaterThan(0);
  });

  it("builds file stats section with counts", () => {
    const parsed = parseDiff(SAMPLE_DIFF);
    const section = buildFileStatsSection(parsed);
    expect(section).toContain("文件统计");
    expect(section).toContain("新增 **1**");
    expect(section).toContain("删除 **1**");
  });

  it("detects business scopes from paths", () => {
    const parsed = parseDiff(SAMPLE_DIFF);
    const scopes = detectBusinessScopes(parsed.files.map((f) => f.path));
    const labels = scopes.map((s) => s.label);
    expect(labels).toContain("Gateway 网关");
    expect(labels).toContain("文档");
    expect(labels).toContain("依赖与锁文件");
  });

  it("merge consideration does not prescribe merge or reject", () => {
    const parsed = parseDiff(SAMPLE_DIFF);
    const scopes = detectBusinessScopes(parsed.files.map((f) => f.path));
    const section = buildMergeConsiderationSection(parsed, scopes, {});
    expect(section).toContain("供你判断");
    expect(section).not.toMatch(/建议合并|不建议合并|应当合并|禁止合并/i);
    expect(section).toContain("删除");
  });

  it("flags draft PR in merge considerations", () => {
    const parsed = parseDiff(SAMPLE_DIFF);
    const scopes = detectBusinessScopes(parsed.files.map((f) => f.path));
    const section = buildMergeConsiderationSection(parsed, scopes, { isDraft: true });
    expect(section).toContain("Draft");
  });
});
