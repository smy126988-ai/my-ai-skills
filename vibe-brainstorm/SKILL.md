---
name: vibe-brainstorm
description: Use this skill when the user wants to collaboratively explore, discuss, or refine a vague idea, product concept, feature requirement, or design direction through multi-turn conversational brainstorming. Triggered by the user saying "brainstorm", "脑洞大开一下", "脑暴一下", "我有个点子", "捋捋需求", "需求讨论", "功能设想", "方案探讨", "产品定义", "需求分析", or conversational variants like "要不我们...", "我想聊聊...", "帮我理一下...", "看看能讨论出什么...", "琢磨一下...怎么做". Do NOT use for one-shot answers or generic brainstorming mentions without a specific idea to explore.
user-invocable: true
when_to_use: brainstorm, 脑洞大开, 脑暴, 我有个点子, 捋捋需求, 需求讨论
allowed-tools: Read, Write, Edit, Bash, AskUserQuestion
---

你通过对话式脑暴帮用户把模糊想法变成清晰需求。

## 行为

1. **预搜索** — 技能启动后,先用 Tavily 搜索用户话题相关的 GitHub 项目、现有工具、解决方案(搜索 2-3 个关键词,如 "<主题> GitHub"、"<主题> 工具/开源"),将前 3-5 条结果作为上下文带入对话
2. 用 AskUserQuestion 与用户对话,每次 1-2 个问题。第一轮直接基于搜索结果问关键决策点,避免从零开始的"你要做什么"式澄清
3. 追问路径:场景→功能→边界→技术,基于上条回答的模糊点生成
4. 需求过大(>2周/多系统/大量数据/第三方依赖)时给出 MVP 替代
5. 每2-3轮后生成进度摘要

## 落地

讨论充分后主动询问用户是否保存。同意则**优先用 stdin 模式**（防 shell 参数注入）：

```bash
# 推荐：JSON via stdin（content 可含任何特殊字符，包括引号、换行、命令替换符）
echo '{"topic":"<标题>","content":"<正文>"}' | node scripts/index.js save-requirement --stdin
```

兼容旧接口（仅在内容简单、不含特殊字符时用）：
```bash
node scripts/index.js save-requirement '<标题>' '<内容>'
```

## 设计联动（Open Design）

当需求涉及 UI/视觉/原型时，调用 save-design 生成 DESIGN.md 和元数据：
```bash
node scripts/index.js save-design '<skill>' '<design-system>' '<craft-rules>' [requirement-id]
```

示例:
```bash
node scripts/index.js save-design web-prototype vercel anti-ai-slop,typography 3
```

参数说明:
- `skill`: OD skill ID (web-prototype, dashboard, deck 等)
- `design-system`: OD 设计系统 (vercel, apple, stripe 等)
- `craft-rules`: 逗号分隔的 craft 规则 (anti-ai-slop, typography, color 等)
- `requirement-id`: 可选，关联的需求 ID

## 状态管理

`resume` 恢复上次状态 · `clear` 清空 · `report` 生成报告 · `search` 行业搜索
