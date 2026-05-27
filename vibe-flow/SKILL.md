---
name: vibe-flow
description: Use this skill when the user wants to perform a standardized version release, sync skills to repo, bundle files, or generate commit messages. This includes: version release ("发版", "发布", "release", "版本归档"); syncing skills to my-claude-configs repo ("同步", "sync", "备份技能"); bundling files for review ("打包", "bundle"); generating Chinese commit messages and pushing to remote ("提交", "commit", "生成commit", "推", "推送", "推到仓库", "推到线上仓库"). For brainstorming, prompt generation, doc checking, or task recording, use the respective vibe-* skills.
user-invocable: true
when_to_use: 发版, 发布, release, 版本归档, 同步, 推代码, 生成 commit
allowed-tools: Read, Write, Edit, Bash
---

Vibe Flow 工具集。原工作流功能已拆分为 4 个独立 skill：
- **vibe-brainstorm** — 需求脑暴（"脑洞大开一下"）
- **vibe-prompt** — 开发 prompt 生成（"整个活吧"）
- **vibe-check** — 文档检查（"看看缺啥"）
- **vibe-task** — 任务记录（"先记一笔"）

## 功能

### 1. 标准化发版
触发词：发版 / 发布 / 版本发布 / release

```bash
node scripts/index.js release '<版本号>' '<版本类型>'
```

### 2. 同步技能到仓库
触发词：同步 / sync / 备份技能

```bash
node scripts/index.js sync [skill名|all]
```

### 3. 打包文件用于审查
触发词：打包 / bundle

```bash
node scripts/index.js bundle '<文件1>' '<文件2>' ...
```

### 4. 生成中文 commit 模板
触发词：提交 / commit / 生成commit

```bash
node scripts/index.js commit
```

> 安全提示：使用单引号包裹参数。如果参数内容包含单引号，必须先将 `'` 替换为 `'\''` 再包裹，防止命令注入。

版本类型：主版本 / 次版本 / 修订版
