---
name: git-auto
description: Use this skill when the user wants to generate a Chinese commit message based on staged git changes. This includes: the user wants to commit code but doesn't know what to write; the user says "生成commit", "写commit message", "commit怎么写", "帮我写提交信息", or any variant about generating git commit messages. The skill analyzes git diff, detects change type (feat/fix/docs/refactor/chore/test/style/perf/security), generates scope, and outputs a structured Chinese commit message following Conventional Commits style. Do NOT use when the user already has a clear commit message in mind.
user-invocable: true
when_to_use: 生成commit, 写commit message, commit怎么写, 帮我写提交信息
allowed-tools: Read, Bash
---

自动生成结构化的中文 commit message，基于暂存区的 git 变更。

## 触发方式（两种）

### 方式一：用户显式请求
用户说以下任意表达时触发：
- "生成commit"、"写commit message"、"commit怎么写"
- "帮我写提交信息"、"提交说明"
- "commit 写啥"、"帮我写个 commit"

### 方式二：主动检测（推荐）
**当用户表达以下意图时，主动询问是否需要生成 commit message：**

| 用户意图 | 典型表达 | 主动询问 |
|---------|---------|---------|
| 要提交代码 | "commit 一下"、"提交了"、"推上去"、"commit" | "暂存区有 X 个文件变更，要生成 commit message 吗？" |
| 不确定写什么 | "commit 写什么呢"、"不知道写啥" | "要帮你生成 commit message 吗？" |
| 完成修改后 | "改完了"、"修好了"、"可以提交了" | "变更已就绪，要生成 commit message 吗？" |

**主动检测前提条件**（必须同时满足）：
1. 当前目录在 git 仓库内
2. `git diff --cached --name-only` 返回非空（暂存区有内容）
3. 用户没有明确说"不用了"、"我自己写"、"已经写好了"

## 行为
1. 分析 `git diff --cached` 获取变更文件列表
2. 自动识别变更类型（feat/fix/docs/refactor/chore/test/style/perf/security）
3. 提取作用域（变更涉及的目录）
4. 生成符合约定式提交风格的 commit message

## 脚本调用
```bash
node "$HOME/.claude/skills/git-auto/scripts/index.js"
```

## 输出格式
```
✨ 新增功能(scope): 核心变更描述

### 目录
- 文件1
- 文件2

**变更统计：**
 file1 | 10 +++---
 file2 |  5 +++++

Co-Authored-By: Claude Code <noreply@anthropic.com>
```

## 参数
- `--dry-run` / `-n`: 预览生成的 commit message 但不写入文件
- `--amend` / `-a`: 查看上次提交信息
