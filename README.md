# my-ai-skills

业务技能库 — 按需加载的 AI 能力扩展。

> 配套仓库：
> - [my-claude-configs](https://github.com/smy126988-ai/my-claude-configs) — 基础设施
> - [my-ai-memory](https://github.com/smy126988-ai/my-ai-memory) — 记忆系统

## Skills

| Skill | 功能 | 触发词 |
|-------|------|--------|
| **vibe-brainstorm** | 需求脑暴（Gemini 双AI验证） | "脑洞大开一下" |
| **vibe-prompt** | 开发 Prompt 生成 | "整个活吧" |
| **vibe-check** | 文档完整性检查 | "看看缺啥" |
| **vibe-task** | 项目级任务记录 | "先记一笔" |
| **vibe-flow** | 版本发版 | "发版" |
| **personal-coach** | AI 认知伙伴 | "/coach" |
| **git-auto** | 中文 Commit Message 生成 | "生成commit" |

## 安装

```bash
git clone https://github.com/smy126988-ai/my-ai-skills.git ~/my-ai-skills
cd ~/my-ai-skills
# 按需复制 skill 到 ~/.claude/skills/
cp -r vibe-brainstorm ~/.claude/skills/
```

## 原 vibe-flow 说明

vibe-flow 原为全能工作流，v3.0 已拆分为 5 个独立 skill（brainstorm/prompt/check/task/flow）。
