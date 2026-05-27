---
name: vibe-prompt
description: Use this skill when the user wants to generate a structured development prompt or coding instruction set based on an existing requirement or feature description. This includes: the user has a finalized requirement and wants to start implementation; the user asks to "generate a prompt", "create coding instructions", "let's build this", "start development", or any Chinese conversational variant about turning a requirement into actionable development guidance (e.g., "整个活吧", "生成开发prompt", "prompt生成", "开发指令", "coding prompt", "写代码", "开干", "安排开发", "开始写代码", "把这个需求实现了", "按刚才讨论的做", "动手做吧"). Do NOT use when the user is still exploring or brainstorming ideas — route those to vibe-brainstorm instead.
user-invocable: true
when_to_use: 整个活吧, 开干, 安排开发, coding prompt, 生成开发 prompt
allowed-tools: Read, Bash
---

根据需求生成结构化的开发 prompt。

## 触发
- 用户说"整个活吧"、"开干"、"干活"、"安排"、"做个需求"
- 用户提供需求 ID 或直接描述

## 行为
1. 若用户提供需求 ID，读取 `.vibe/requirements.md` 找到对应需求
2. 若用户提供直接描述，基于描述生成
3. 检查 `.vibe/od-meta.json`，如果存在，自动引入对应 craft 规则到 prompt
4. 输出包含：需求详情、技术方案、开发步骤、验收标准、风险应对、设计规范（如有）
5. **在生成的 prompt 末尾，自动追加以下「开发执行约束」（解决反复修复和改崩问题）：**

```markdown
---

## 开发执行约束（自动生效）
1. **改前快照**：执行 `git stash push -m "before: <本次修改描述>"`，创建回退点
2. **测试先行**：如果是 bug 修复或新功能，先写/修改测试用例，再改业务代码
3. **范围隔离**：一次只修改一个逻辑点，不连带修改无关文件
4. **改后验证**：修改完成后立即运行全量测试（npm test / pytest / 等）
5. **失败回退**：如果测试失败，执行 `git stash pop` 回退，重新分析后再改
6. **完成验收**：全部改完后，对照本 prompt 中的「验收标准」逐项确认，输出验收结果（通过/不通过）
```

## 脚本调用
```bash
node scripts/index.js '<需求ID或描述>'
```
> 安全提示：使用单引号包裹参数。如果参数内容包含单引号，必须先将 `'` 替换为 `'\''` 再包裹，防止命令注入。
