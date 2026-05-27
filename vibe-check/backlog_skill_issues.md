---
name: 技能修复池
 description: 跟踪所有自定义技能中未修复的 review/审查问题，按严重程度排序，支持自动解析 review.md 入池
 type: project
 originSessionId: b70249ea-ceb6-49db-828e-b02e2c0c73be
originSessionId: b70249ea-ceb6-49db-828e-b02e2c0c73be
---
## 活跃问题

 ### Critical（立即修复）
 无

 ### High（本轮或下轮必须修复）

 | ID | 技能 | 问题 | 发现时间 | 来源 | 影响 | 修复方案 | 状态 | 阻塞原因 |
 |----|------|------|---------|------|------|---------|------|---------|
 | DG-001 | dispatch-gemini | ARG_MAX: `-p "$(cat file)"` 大prompt超命令行长度限制 | 2026-05-06 | Gemini review #2 | 大项目场景下 run 命令直接崩溃 | 确认 gemini CLI 是否支持 stdin 或 `@file` 语法 | open | 需查询 gemini CLI 输入方式 |
 | DG-002 | dispatch-gemini | Python 内联脚本路径注入: heredoc 中直接插 Bash 变量 | 2026-05-06 | Gemini review #2 | 路径含单引号时 Python SyntaxError | 全部改为 `sys.argv` 传参 | open | 改动面大，需全局重构 |

 ### Medium（计划修复）

 | ID | 技能 | 问题 | 发现时间 | 来源 | 影响 | 修复方案 | 状态 |
 |----|------|------|---------|------|------|---------|------|
 | DG-003 | dispatch-gemini | merge 路径遍历: 模型生成 `../` 文件名可覆盖工程外文件 | 2026-05-06 | Gemini review #2 | 安全风险 | merge 前用 `realpath` 验证目标路径在 project_dir 内 | open |
 | DG-004 | dispatch-gemini | batch 模型参数不透传: `--pro`/`--flash` 不传给子任务 | 2026-05-06 | Gemini review #2 | batch 无法使用 pro 模型 | cmd_batch 解析参数并透传 | open |
 | VB-001 | vibe-brainstorm | 模型语义匹配不确定性: 口语化变体仍可能不触发 | 2026-05-05 | 实际会话观察 | 用户说"要不我们脑洞大开"未触发 | 持续优化 description + 全局 CLAUDE.md 路由规则 | open |

 ### Low（有空再修）
 无

 | DI-001 | dispatch-gemini | 脚本中多处使用了字符串插值的方式来拼接 Python 内联代码（例如 `with open('$meta_file') ... | 2026-05-05 | review.md | Python 内联脚本存在路径注入与执行风险 (dispatch-gemini) | TBD | open |
| DI-002 | dispatch-gemini | 在 `cmd_merge` 中，基于沙箱文件相对路径拼接目标路径的逻辑为 `local target_file="$pr... | 2026-05-05 | review.md | merge 命令缺乏路径遍历（Path Traversal）防护 (dispatch-gemini) | TBD | open |
| DI-003 | dispatch-gemini | 上轮提到的 `batch` 命令不支持模型指定的问题未解决。在 `cmd_batch` 中调起子任务时，写死了 `"$S... | 2026-05-05 | review.md | batch 模式未透传模型参数 (未修复) | 在 `cmd_batch` 中解析 `--pro/--flash` 参数，并在循... | open |

## 已修复归档

 | ID | 技能 | 问题 | 发现时间 | 修复时间 | 修复 Commit |
 |----|------|------|---------|---------|------------|
 | DG-005 | dispatch-gemini | BSD grep `\|` 不兼容导致 429 重试失效 | 2026-05-06 | 2026-05-06 | `74e9bb9` |
 | DG-006 | dispatch-gemini | 429 off-by-one: 第3次重试无退避 | 2026-05-06 | 2026-05-06 | `74e9bb9` |
 | DG-007 | dispatch-gemini | run 默认未显式降级到 flash | 2026-05-06 | 2026-05-06 | `74e9bb9` |
 | DG-008 | dispatch-gemini | `_update_meta` endTime 脏数据 | 2026-05-06 | 2026-05-06 | `74e9bb9` |
 | GA-001 | git-auto | `/tmp` 硬编码跨平台崩溃 | 2026-05-06 | 2026-05-06 | `74e9bb9` |
 | GA-002 | git-auto | `detectType` 缺失 fix/refactor | 2026-05-06 | 2026-05-06 | `74e9bb9` |
 | GA-003 | git-auto | `generateScope` 根目录文件处理 | 2026-05-06 | 2026-05-06 | `74e9bb9` |
 | GA-004 | git-auto | `execSync` Buffer 溢出 | 2026-05-06 | 2026-05-06 | `74e9bb9` |
 | GA-005 | git-auto | `--amend` 功能不完整 | 2026-05-06 | 2026-05-06 | `74e9bb9` |
 | GA-006 | git-auto | 文案硬编码 | 2026-05-06 | 2026-05-06 | `74e9bb9` |
 | GA-007 | git-auto | 临时文件并发冲突 | 2026-05-06 | 2026-05-06 | `b3be71e` |
 | GA-008 | git-auto | help 文案不一致 | 2026-05-06 | 2026-05-06 | `b3be71e` |

 ## 自动入池机制

 ### 触发条件
 1. Gemini review 完成后，review 报告未达 Approve（score < 8 或 request_changes）
 2. 手动审查发现新问题

 ### 入池脚本
 ```bash
 # 解析 review.md 提取问题，追加到本文件
 node ~/.claude/skills/vibe-check/scripts/parse-review.js <review.md> <skill-name>
 ```

 ### 状态流转
 ```
 open → in_progress → fixed → verified → archived
   ↑                                    |
   └─────── reopened ───────────────────┘
 ```

 ### 健康度指标
 - Critical open = 0（红线）
 - High open <= 2（黄线）
 - Medium+Low 累计 <= 5（建议值）
