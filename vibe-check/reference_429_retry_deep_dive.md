---
 name: 429 重试机制深度分析
 description: BSD/GNU grep 正则差异、off-by-one 数学推导、跨平台兼容最佳实践、退避策略设计
 type: reference
 originSessionId: b70249ea-ceb6-49db-828e-b02e2c0c73be
---
## 一、问题起源：为什么 429 重试在 macOS 上完全失效

 ### 1.1 原始代码
 ```bash
 if grep -q "429\|RESOURCE_EXHAUSTED\|capacity" "$error_log" 2>/dev/null; then
 ```

 ### 1.2 根本原因：BSD grep vs GNU grep 的正则语法差异

 | 特性 | GNU grep (Linux) | BSD grep (macOS) |
 |------|-----------------|------------------|
 | 默认模式 | BRE (Basic Regular Expression) | BRE |
 | `\|` 在 BRE 中 | **GNU 扩展**：表示"或" | **字面量**：匹配反斜杠+竖线 |
 | `-E` 参数 | 启用 ERE (Extended RE) | 启用 ERE |
 | `\|` 在 ERE 中 | 不可用（ERE 直接用 `|`） | 不可用（ERE 直接用 `|`） |
 | `|` 在 ERE 中 | 表示"或" | 表示"或" |

 **关键结论**：
 - `grep "a\|b"` 在 GNU grep 中匹配 `a` 或 `b`
 - `grep "a\|b"` 在 BSD grep 中匹配字面量 `a\|b`（永远不会匹配到）
 - **跨平台安全写法**：`grep -E "a|b"`（两边都支持）

 ### 1.3 实战验证

 ```bash
 # macOS 上测试
 $ echo "Error: 429 RESOURCE_EXHAUSTED" | grep -q "429\|RESOURCE_EXHAUSTED" && echo "MATCH" || echo "NO MATCH"
 NO MATCH   # ← 永远不会匹配！

 $ echo "Error: 429 RESOURCE_EXHAUSTED" | grep -qE "429|RESOURCE_EXHAUSTED" && echo "MATCH" || echo "NO MATCH"
 MATCH      # ← 正确匹配
 ```

 ## 二、修复方案详解

 ### 2.1 grep 修复
 ```bash
 # ❌ 修复前：GNU-only
 grep -q "429\|RESOURCE_EXHAUSTED\|capacity"

 # ✅ 修复后：GNU + BSD 兼容
 grep -qE "429|RESOURCE_EXHAUSTED|capacity"
 ```

 **为什么 `-E` 安全？**
 - `-E` 在 GNU grep 和 BSD grep 中都启用 ERE
 - ERE 中 `|` 不需要转义，两边行为一致
 - 这是 POSIX 标准行为，不是 GNU 扩展

 ### 2.2 补充说明：`-e` 多模式写法（更冗长但更兼容）
 ```bash
 # 另一种跨平台写法（不需要 -E）
 grep -q -e "429" -e "RESOURCE_EXHAUSTED" -e "capacity"
 ```
 这种方式在 BRE 模式下也能工作，因为 `-e` 是标准 POSIX 选项。

 ## 三、off-by-one：重试次数的数学推导

 ### 3.1 原始代码（有 bug）
 ```bash
 local max_retries=3
 local attempt=0

 while [[ $attempt -lt $max_retries ]]; do
     # 调用 gemini...
     if [[ $gemini_exit -eq 0 ]]; then return 0; fi

     if grep -qE "429|..." "$error_log"; then
         attempt=$((attempt + 1))          # attempt = 1, 2, 3
         if [[ $attempt -lt $max_retries ]]; then   # 3 < 3 = false!
             sleep $retry_delay
             continue
         fi
     fi
     return $gemini_exit
 done
 ```

 ### 3.2 执行流程推演

 | 轮次 | attempt(调用前) | 结果 | attempt(调用后) | `attempt < 3` | 行为 |
 |------|----------------|------|----------------|--------------|------|
 | 1 | 0 | 429 | 1 | 1 < 3 ✓ | sleep 5s, continue |
 | 2 | 1 | 429 | 2 | 2 < 3 ✓ | sleep 10s, continue |
 | 3 | 2 | 429 | 3 | 3 < 3 ✗ | **不 sleep，直接 return 失败** |

 **问题**：第 3 次重试（总共第 4 次调用）没有执行 20s 退避就直接失败了。
 实际只有 **2 次重试**，不是承诺的 3 次。

 ### 3.3 修复后代码
 ```bash
 local max_attempts=4   # 1次原始 + 3次重试
 local attempt=0

 while [[ $attempt -lt $max_attempts ]]; do
     # 调用 gemini...
     if [[ $gemini_exit -eq 0 ]]; then return 0; fi

     if grep -qE "429|..." "$error_log"; then
         attempt=$((attempt + 1))
         if [[ $attempt -lt $max_attempts ]]; then
             echo "重试 (${attempt}/3)..."
             sleep $retry_delay
             retry_delay=$((retry_delay * 2))
             continue
         fi
     fi
     return $gemini_exit
 done
 ```

 ### 3.4 修复后执行流程

 | 轮次 | attempt(调用前) | 结果 | attempt(调用后) | `attempt < 4` | 行为 |
 |------|----------------|------|----------------|--------------|------|
 | 1 | 0 | 429 | 1 | 1 < 4 ✓ | sleep 5s, continue |
 | 2 | 1 | 429 | 2 | 2 < 4 ✓ | sleep 10s, continue |
 | 3 | 2 | 429 | 3 | 3 < 4 ✓ | sleep 20s, continue |
 | 4 | 3 | 429 | 4 | 4 < 4 ✗ | return 失败（已用完） |

 **验证**：3 次重试全部执行，退避 5s → 10s → 20s，符合承诺。

 ## 四、跨平台 grep 最佳实践

 ### 4.1 规则速查表

 | 场景 | 推荐写法 | 兼容性 |
 |------|---------|--------|
 | 简单字符串匹配 | `grep -q "string"` | 全平台 ✓ |
 | "或" 逻辑（2-3 个） | `grep -qE "a|b|c"` | 全平台 ✓ |
 | "或" 逻辑（很多个） | `grep -q -e "a" -e "b" -e "c"` | 全平台 ✓ |
 | 正则匹配 | `grep -qE "regex"` | 全平台 ✓ |
 | ❌ 危险写法 | `grep "a\|b"` | 仅 GNU ✗ |

 ### 4.2 检测当前系统类型
 ```bash
 if grep -V 2>/dev/null | grep -q GNU; then
     echo "GNU grep"
 else
     echo "BSD grep (macOS)"
 fi
 ```

 ### 4.3 更安全：用 awk 替代 grep 做复杂匹配
 ```bash
 # awk 在所有平台行为一致
 if awk '/429|RESOURCE_EXHAUSTED|capacity/' "$error_log" | grep -q .; then
     # 429 错误
 fi
 ```

 ## 五、429 重试策略设计

 ### 5.1 常见退避策略对比

 | 策略 | 实现 | 优点 | 缺点 |
 |------|------|------|------|
 | 固定间隔 | `sleep 5` | 简单 | 不能适应不同负载 |
 | 线性退避 | `sleep $((attempt * 5))` | 线性增长，可控 | 重试频率仍可能过高 |
 | **指数退避** | `sleep $((5 * 2^(attempt-1)))` | 快速降低频率 | 最后一次等待较长 |
 | 指数退避 + Jitter | `sleep $((base * 2^attempt + RANDOM % jitter))` | 避免 thundering herd | 实现稍复杂 |

 ### 5.2 我们的选择：指数退避（5s → 10s → 20s）

 ```bash
 local retry_delay=5
 # ...
 sleep $retry_delay
 retry_delay=$((retry_delay * 2))
 ```

 **为什么是 3 次？**
 - Gemini Pro 的 429 通常是**临时容量不足**，不是永久拒绝
 - 3 次重试总等待时间 = 5 + 10 + 20 = 35s
 - 加上原始调用和重试调用，总耗时约 35-40s
 - 超过这个时长，继续重试意义不大，应让用户人工介入

 ### 5.3 生产级改进建议

 ```bash
 _call_gemini() {
     # ...
     local max_attempts=4
     local base_delay=5
     local max_delay=60
     local attempt=0

     while [[ $attempt -lt $max_attempts ]]; do
         # 调用...

         if grep -qE "429|RESOURCE_EXHAUSTED|capacity" "$error_log"; then
             attempt=$((attempt + 1))
             if [[ $attempt -lt $max_attempts ]]; then
                 # 指数退避 + 封顶
                 local delay=$((base_delay * (2 ** (attempt - 1))))
                 [[ $delay -gt $max_delay ]] && delay=$max_delay

                 # 可选：加 jitter 避免集中重试
                 # delay=$((delay + RANDOM % 3))

                 echo "[dispatch] 429，${delay}秒后重试 (${attempt}/3)..." >&2
                 sleep $delay
                 continue
             fi
         fi
         # ...
     done
 }
 ```

 ## 六、其他会话如何应用此修复

 ### 6.1 检查清单
 如果你的项目有类似的 429 重试逻辑，请检查：

 - [ ] grep 是否使用了 `\|` 而不带 `-E`
 - [ ] while 循环条件是 `< retries` 还是 `< attempts`
 - [ ] 重试次数是否和文档承诺一致
 - [ ] 退避时间是否正确递增

 ### 6.2 一键修复脚本
 ```bash
 # 扫描项目中可疑的 grep 用法
 grep -rn 'grep.*\\|' --include="*.sh" .

 # 扫描 off-by-one 重试模式
 grep -rn 'max_retries=' --include="*.sh" .
 ```

 ## 七、总结

 | 问题 | 根因 | 修复 | 验证 |
 |------|------|------|------|
 | 429 不触发重试 | BSD grep `\|` 不支持 | `grep -qE "a\|b"` | ✅ 实战 429 触发成功 |
 | 重试次数不足 | off-by-one | `max_attempts=4` | ✅ 3 次退避全部执行 |
