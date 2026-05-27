---
name: vibe-task
description: Use this skill when the user wants to quickly record a task, todo item, or action item to a persistent project-level task list. This includes: the user wants to jot down a task for later; the user says "add a task", "note this down", "remind me to", "todo list", or any Chinese conversational variant about recording tasks (e.g., "先记一笔", "记个todo", "记个事儿", "开个任务", "记录任务", "任务记录", "记一笔", "add task", "记下来", "别忘了这个", "加到我的todo", "记一下待办", "提醒我做..."). Do NOT use for session-level task tracking — that uses TodoWrite. Do NOT use for saving requirement documents or brainstorm results — use vibe-brainstorm save-requirement instead.
user-invocable: true
when_to_use: 先记一笔, 记个 todo, 记个事儿, add task, 记录任务
allowed-tools: Read, Write, Edit, Bash
---

自动带时间戳记录任务到项目本地的 `.vibe/todo.md`。

## 触发
- 用户说"先记一笔"、"记个todo"、"记个事儿"、"开个任务"
- 用户说"记录任务"、"todo list"

## 行为
1. 确保 `.vibe/` 目录存在
2. 将任务以 `- [ ] 任务内容 (创建时间: YYYY-MM-DD HH:mm)` 格式追加到 `.vibe/todo.md`
3. 若文件不存在则自动创建并添加标题

## 与 TodoWrite 的区别
- **TodoWrite**: 会话级任务追踪，当前对话有效
- **vibe-task**: 项目级任务记录，持久化在 `.vibe/todo.md`，跨会话可用

## 脚本调用
```bash
node scripts/index.js '<任务内容>'
```
> 安全提示：使用单引号包裹参数。如果参数内容包含单引号，必须先将 `'` 替换为 `'\''` 再包裹，防止命令注入。
