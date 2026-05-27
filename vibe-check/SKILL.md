---
name: vibe-check
description: Use this skill when the user wants to check project documentation completeness or health. Triggered by phrases like "check docs", "health check", "what's missing", or Chinese variants about reviewing project docs (e.g., "看看缺啥", "检查一下", "啥情况", "文档检查", "文档齐了吗", "项目状态怎么样"). Do NOT use for searching external information, industry data, or brainstorming context — use vibe-brainstorm search instead.
user-invocable: true
when_to_use: 看看缺啥, 检查一下, 文档检查, 文档齐了吗, 项目状态怎么样
allowed-tools: Read, Bash
---

扫描项目核心文档的完整性，给出补全建议。

## 触发
- 用户说"看看缺啥"、"检查一下"、"啥情况"
- 用户问"文档齐了吗"、"项目健康度"

## 行为
1. 检查 `.vibe/requirements.md` 是否存在
2. 检查 `.vibe/todo.md` 是否存在
3. 检查 `.vibe/od-meta.json` 是否存在（Open Design 联动）
4. 如果 od-meta.json 存在，加载对应 OD skill 的 checklist 并统计 P0/P1/P2 项
5. 检查 DESIGN.md 是否存在
6. 输出检查结果和补全建议

## 脚本调用
```bash
node scripts/index.js
```
