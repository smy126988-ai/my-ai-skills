const fs = require('fs');
const path = require('path');
const { REPORT_FILE, DESKTOP_REPORTS_DIR } = require('./config');
const { ensureVibeDir, ensureDesktopReportsDir, ensureDesktopProjectDir, escapeHtml, formatDate } = require('./utils');
const { loadState } = require('./state');
const { saveVisuals, generateMindmap, generateFlowchart } = require('./visualization');

// 生成 Markdown 报告
function generateMarkdownReport(state) {
  let report = `# Brainstorm 报告: ${state.topic}\n\n`;
  report += `> 生成时间: ${formatDate()}\n`;
  report += `> 会话状态: ${state.status}\n`;
  report += `> 当前聚焦: ${state.current_focus}\n\n`;

  // 1. 用户场景
  if (state.scenarios && state.scenarios.length > 0) {
    report += '## 🎭 用户场景\n\n';
    state.scenarios.forEach((s, i) => {
      report += `${i + 1}. **${s.who || '用户'}** 在 **${s.when || '未知场景'}** 时 **${s.what || '进行操作'}**\n`;
      if (s.feeling) {
        report += `   > 体验期望: ${s.feeling}\n`;
      }
      report += '\n';
    });
  }

  // 2. 功能清单
  if (state.features && state.features.length > 0) {
    report += '## ✨ 功能清单\n\n';
    report += '| 功能 | 优先级 | 状态 | 描述 |\n';
    report += '|------|--------|------|------|\n';
    state.features.forEach(f => {
      const status = f.status === 'confirmed' ? '✅ 已确认' : (f.status === 'pending' ? '❓ 待确认' : '🔄 讨论中');
      const safeName = String(f.name || '').replace(/\|/g, '&#124;');
      const safeDesc = String(f.description || '').replace(/\|/g, '&#124;');
      report += `| ${safeName} | ${f.priority || 'P0'} | ${status} | ${safeDesc} |\n`;
    });
    report += '\n';
  }

  // 3. 边界与约束
  if (state.boundaries && state.boundaries.length > 0) {
    report += '## 🚧 边界与约束\n\n';
    state.boundaries.forEach((b, i) => {
      report += `${i + 1}. ${b}\n`;
    });
    report += '\n';
  }

  // 4. 已排除方案
  if (state.rejected && state.rejected.length > 0) {
    report += '## ❌ 已排除方案\n\n';
    state.rejected.forEach((r, i) => {
      report += `${i + 1}. **${r.idea}**\n`;
      report += `   > 排除原因: ${r.reason || '未说明'}\n\n`;
    });
  }

  // 5. 关键决策
  if (state.decisions && state.decisions.length > 0) {
    report += '## 🎯 关键决策\n\n';
    state.decisions.forEach((d, i) => {
      report += `${i + 1}. ${d}\n`;
    });
    report += '\n';
  }

  // 6. 设计分析
  if (state.analysis && state.analysis.trim()) {
    report += '## 💡 设计分析\n\n';
    report += state.analysis + '\n\n';
  }

  // 7. 技术方案
  if (state.technical && state.technical.trim()) {
    report += '## 🔧 技术方案\n\n';
    report += state.technical + '\n\n';
  }

  // 8. 验收标准
  if (state.acceptance && state.acceptance.length > 0) {
    report += '## ✅ 验收标准\n\n';
    state.acceptance.forEach((a, i) => {
      report += `${i + 1}. ${a}\n`;
    });
    report += '\n';
  }

  // 9. 行业参考
  if (state.industry && state.industry.trim()) {
    report += '## 🌐 行业参考\n\n';
    report += state.industry + '\n\n';
  }

  // 10. 讨论记录（最近10条）
  if (state.conversations && state.conversations.length > 0) {
    report += '## 💬 讨论记录\n\n';
    const recentConversations = state.conversations.slice(-10);
    recentConversations.forEach((c, i) => {
      const role = c.role === 'user' ? '🙋 用户' : '🤖 Claude';
      const time = new Date(c.timestamp).toLocaleString('zh-CN');
      report += `### ${role} [${time}]\n${c.content}\n\n`;
    });
  }

  return report;
}

// 生成 HTML 报告
function generateHTMLReport(state) {
  const topic = state.topic || '未命名项目';
  const mindmap = generateMindmap(state);
  const flowchart = generateFlowchart(state);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(topic)} - Vibe Flow 报告</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg: #fafafa;
      --text: #0a0a0a;
      --muted: #666;
      --border: #e5e5e5;
      --card: #ffffff;
      --sidebar-bg: #f5f5f5;
      --accent: #6366f1;
      --chat-user: #0a0a0a;
      --chat-ai: #374151;
    }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
      position: relative;
    }
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      z-index: -1;
      background:
        radial-gradient(ellipse 800px 600px at 15% 20%, rgba(99,102,241,0.08), transparent),
        radial-gradient(ellipse 600px 500px at 85% 40%, rgba(168,85,247,0.06), transparent),
        radial-gradient(ellipse 700px 400px at 50% 80%, rgba(59,130,246,0.05), transparent);
    }

    /* 导航 */
    .nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      padding: 2rem 4rem;
      display: flex; justify-content: space-between; align-items: center;
      mix-blend-mode: difference;
    }
    .nav-logo { font-size: 0.85rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: #fff; }
    .nav-meta { font-size: 0.75rem; color: #fff; opacity: 0.7; letter-spacing: 0.1em; }

    /* Hero */
    .hero {
      height: 100vh;
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      text-align: center; padding: 0 4rem;
      position: relative; overflow: hidden;
    }
    .hero::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
      z-index: -1;
    }
    .hero-title {
      font-size: clamp(3rem, 10vw, 8rem); font-weight: 900; color: #fff;
      line-height: 0.95; letter-spacing: -0.04em; margin-bottom: 2rem;
    }
    .hero-subtitle { font-size: 1rem; color: rgba(255,255,255,0.5); font-weight: 400; letter-spacing: 0.15em; text-transform: uppercase; }
    .hero-scroll {
      position: absolute; bottom: 4rem; left: 50%; transform: translateX(-50%);
      color: rgba(255,255,255,0.3); font-size: 0.75rem; letter-spacing: 0.2em;
      text-transform: uppercase; animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.8} }

    /* 主内容 */
    .content { max-width: 1400px; margin: 0 auto; padding: 0 4rem; }

    /* 双栏板块 */
    .section {
      padding: 8rem 0; border-bottom: 1px solid var(--border);
      opacity: 0; transform: translateY(60px);
      transition: all 0.8s cubic-bezier(0.16,1,0.3,1);
    }
    .section.visible { opacity: 1; transform: translateY(0); }
    .section-number { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); margin-bottom: 1rem; }
    .section-title { font-size: clamp(2rem,5vw,4rem); font-weight: 800; letter-spacing: -0.03em; margin-bottom: 4rem; }

    .section-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 6rem;
      align-items: start;
    }
    .section-main { min-width: 0; }
    .section-sidebar {
      position: sticky; top: 120px;
      padding: 2rem;
      background: rgba(245,245,245,0.7);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.6);
      box-shadow: 0 4px 30px rgba(0,0,0,0.04);
    }
    .sidebar-label { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 1rem; }

    /* 响应式 */
    @media (max-width: 1024px) {
      .section-grid { grid-template-columns: 1fr; gap: 3rem; }
      .section-sidebar { position: relative; top: 0; }
      .nav { padding: 1rem 2rem; }
      .content { padding: 0 2rem; }
      .section { padding: 4rem 0; }
    }

    /* 键值卡片 */
    .kv-card {
      padding: 1.5rem 0;
      border-bottom: 1px solid var(--border);
    }
    .kv-label {
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 0.5rem;
    }
    .kv-value {
      font-size: 1.1rem;
      font-weight: 500;
      line-height: 1.6;
    }
    .kv-steps {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.75rem;
      flex-wrap: wrap;
    }
    .kv-step {
      font-size: 0.85rem;
      font-weight: 600;
      padding: 0.35rem 0.75rem;
      background: var(--sidebar-bg);
      border: 1px solid var(--border);
    }
    .kv-arrow {
      font-size: 0.75rem;
      color: var(--muted);
    }

    /* 场景卡片 */
    .scenario { margin-bottom: 2rem; }
    .scenario-role { font-weight: 700; font-size: 1.1rem; margin-bottom: 0.5rem; }
    .scenario-text { margin-bottom: 0.5rem; }
    .scenario-validation { font-size: 0.9rem; color: var(--muted); font-style: italic; padding-left: 1rem; border-left: 2px solid var(--border); }

    /* 功能表格 */
    .feature-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    .feature-table th { text-align: left; padding: 0.75rem; border-bottom: 2px solid var(--border); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); }
    .feature-table td { padding: 1rem 0.75rem; border-bottom: 1px solid var(--border); }
    .feature-name { font-weight: 600; }
    .feature-priority { font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.5rem; border-radius: 4px; }
    .priority-P0 { background: #fee2e2; color: #dc2626; }
    .priority-P1 { background: #fef3c7; color: #d97706; }
    .priority-P2 { background: #dbeafe; color: #2563eb; }
    .feature-status { font-size: 0.85rem; }
    .status-confirmed { color: #16a34a; }
    .status-pending { color: #d97706; }

    /* 聊天消息 */
    .chat-msg { margin-bottom: 1.5rem; padding: 1.5rem; border-radius: 8px; background: var(--card); border: 1px solid var(--border); }
    .chat-role { font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; color: var(--muted); }
    .chat-content { font-size: 0.95rem; line-height: 1.6; }
    .chat-user { border-left: 3px solid var(--accent); }
    .chat-assistant { border-left: 3px solid var(--muted); }

    /* 列表样式 */
    .simple-list { list-style: none; }
    .simple-list li { padding: 0.5rem 0; padding-left: 1.5rem; position: relative; }
    .simple-list li::before { content: '•'; position: absolute; left: 0; color: var(--accent); font-weight: 700; }

    /* Mermaid */
    .chart-container {
      margin: 4rem 0; padding: 4rem;
      background: rgba(255,255,255,0.6);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.5);
      box-shadow: 0 4px 30px rgba(0,0,0,0.04);
    }

    /* 页脚 */
    .footer {
      padding: 4rem 0;
      text-align: center;
      color: var(--muted);
      border-top: 1px solid var(--border);
      margin-top: 4rem;
    }
    .footer-brand {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text);
      margin-bottom: 0.5rem;
    }
  </style>
</head>
<body>
  <!-- 导航栏 -->
  <nav class="nav">
    <div class="nav-logo">VIBE FLOW</div>
    <div class="nav-meta">${formatDate()}</div>
  </nav>

  <!-- Hero 区域 -->
  <section class="hero">
    <h1 class="hero-title">${escapeHtml(topic)}</h1>
    <p class="hero-subtitle">${state.status === 'completed' ? '需求已确认' : '需求讨论中'}</p>
    <div class="hero-scroll">Scroll to explore</div>
  </section>

  <!-- 主内容 -->
  <main class="content">
    <!-- 1. 用户场景 -->
    ${(state.scenarios && state.scenarios.length > 0) ? `
    <section class="section" id="scenarios">
      <div class="section-number">01 — 用户场景</div>
      <h2 class="section-title">谁在什么情况下用</h2>
      <div class="section-grid">
        <div class="section-main">
          ${state.scenarios.map((s, i) => `
          <div class="scenario">
            <div class="scenario-role">${escapeHtml(s.who || '用户')}</div>
            <div class="scenario-text">在 ${escapeHtml(s.when || '这个场景')} 时，${escapeHtml(s.what || '进行操作')}</div>
            ${s.feeling ? `<div class="scenario-validation">"${escapeHtml(s.feeling)}"</div>` : ''}
          </div>
          `).join('')}
        </div>
        <div class="section-sidebar">
          <div class="sidebar-label">体感验证</div>
          ${state.scenarios.map(s => {
            const who = s.who || '用户';
            const when = s.when || '这个场景';
            const what = s.what || '操作';
            return `<div style="margin-bottom: 1.5rem;font-size: 0.9rem;color: var(--muted);font-style: italic;">
              "如果你是${escapeHtml(who)}，在${escapeHtml(when)}时，${escapeHtml(what)}的体验是否流畅？"
            </div>`;
          }).join('')}
        </div>
      </div>
    </section>
    ` : ''}

    <!-- 2. 设计思路 -->
    <section class="section" id="design">
      <div class="section-number">02 — 设计思路</div>
      <h2 class="section-title">为什么这样做</h2>
      <div class="section-grid">
        <div class="section-main">
          <div class="kv-card">
            <div class="kv-label">追问策略</div>
            <div class="kv-value">场景优先，动态推进</div>
            <div class="kv-steps">
              <span class="kv-step">场景</span>
              <span class="kv-arrow">→</span>
              <span class="kv-step">功能</span>
              <span class="kv-arrow">→</span>
              <span class="kv-step">边界</span>
              <span class="kv-arrow">→</span>
              <span class="kv-step">技术</span>
            </div>
          </div>
          ${state.decisions && state.decisions.length > 0 ?
            state.decisions.map(d => {
              const parts = d.split('：');
              if (parts.length >= 2) {
                return `<div class="kv-card"><div class="kv-label">${escapeHtml(parts[0])}</div><div class="kv-value">${escapeHtml(parts.slice(1).join('：'))}</div></div>`;
              }
              return `<div class="kv-card"><div class="kv-value">${escapeHtml(d)}</div></div>`;
            }).join('')
            : '<p style="color:var(--muted)">设计决策将在讨论过程中逐步记录</p>'}
        </div>
        <div class="section-sidebar">
          <div class="sidebar-label">决策依据</div>
          <p style="font-size: 0.9rem;color: var(--muted);">
            每个决策都有明确的取舍理由，基于实际场景约束而非凭印象判断。
          </p>
        </div>
      </div>
    </section>

    <!-- 3. 功能清单 -->
    ${(state.features && state.features.length > 0) ? `
    <section class="section" id="features">
      <div class="section-number">03 — 功能清单</div>
      <h2 class="section-title">我们要做什么</h2>
      <div class="section-grid">
        <div class="section-main">
          ${state.features.map(f => {
            const status = f.status === 'confirmed' ? '✅ 已确认' : (f.status === 'pending' ? '❓ 待确认' : '🔄 讨论中');
            const priority = f.priority || 'P0';
            return `
            <div class="kv-card">
              <div class="kv-label">
                <span class="feature-priority priority-${priority}">${priority}</span>
                <span class="feature-status status-${f.status || 'pending'}">${status}</span>
              </div>
              <div class="kv-value feature-name">${escapeHtml(f.name)}</div>
              ${f.description ? `<div style="margin-top: 0.5rem; font-size: 0.95rem; color: var(--muted); line-height: 1.6;">${escapeHtml(f.description)}</div>` : ''}
            </div>
            `;
          }).join('')}
        </div>
        <div class="section-sidebar">
          <div class="sidebar-label">优先级说明</div>
          <ul class="simple-list" style="font-size: 0.9rem;">
            <li><strong>P0</strong>: 核心功能，必须实现</li>
            <li><strong>P1</strong>: 重要功能，优先实现</li>
            <li><strong>P2</strong>: 可选功能，后续迭代</li>
          </ul>
        </div>
      </div>
    </section>
    ` : ''}

    <!-- 4. 设计分析 -->
    ${state.analysis && state.analysis.trim() ? `
    <section class="section" id="analysis">
      <div class="section-number">04 — 设计分析</div>
      <h2 class="section-title">我们怎么想</h2>
      <div class="section-grid">
        <div class="section-main">
          ${state.analysis.split(/。|；|\n/).filter(s => s.trim()).map(s => {
            const text = s.trim().replace(/。$/, '');
            if (!text) return '';
            const colonIdx = text.indexOf('是');
            const colonIdx2 = text.indexOf('：');
            const splitAt = colonIdx2 > 0 ? colonIdx2 : (colonIdx > 0 && colonIdx < 15 ? colonIdx : -1);
            if (splitAt > 0 && splitAt < 20) {
              return `<div class="kv-card"><div class="kv-label">${escapeHtml(text.slice(0, splitAt).replace(/的$/, ''))}</div><div class="kv-value">${escapeHtml(text.slice(splitAt + 1))}</div></div>`;
            }
            return `<div class="kv-card"><div class="kv-value">${escapeHtml(text)}</div></div>`;
          }).join('')}
          ${state.current_focus ? `<div class="kv-card" style="border-left:3px solid var(--accent);"><div class="kv-label">当前聚焦</div><div class="kv-value">${escapeHtml(state.current_focus)}</div></div>` : ''}
        </div>
        <div class="section-sidebar">
          <div class="sidebar-label">可行性挑战</div>
          <p style="font-size: 0.9rem;color: var(--muted);">
            当需求涉及多个独立系统、需要大量数据、或开发周期超过 2 周时，Claude 会主动提示风险并给出 MVP 替代方案。
          </p>
        </div>
      </div>
    </section>
    ` : ''}

    <!-- 5. 行业参考 -->
    ${state.industry && state.industry.trim() ? `
    <section class="section" id="industry">
      <div class="section-number">05 — 行业参考</div>
      <h2 class="section-title">别人怎么做</h2>
      <div class="section-grid">
        <div class="section-main">
          ${(() => {
            const lines = state.industry.split('\n').filter(l => l.trim());
            const items = [];
            let current = null;
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('-') || trimmed.startsWith('·')) {
                if (current) items.push(current);
                const content = trimmed.replace(/^[-·]\s*/, '');
                const colonIdx = content.indexOf('：');
                if (colonIdx > 0) {
                  current = { label: content.slice(0, colonIdx).trim(), value: content.slice(colonIdx + 1).trim() };
                } else {
                  current = { label: '', value: content };
                }
              } else if (current) {
                current.value += ' ' + trimmed;
              } else if (trimmed) {
                items.push({ label: '', value: trimmed });
              }
            }
            if (current) items.push(current);
            return items.map(item => {
              if (item.label) {
                return `<div class="kv-card"><div class="kv-label">${escapeHtml(item.label)}</div><div class="kv-value">${escapeHtml(item.value)}</div></div>`;
              }
              return `<div class="kv-card"><div class="kv-value">${escapeHtml(item.value)}</div></div>`;
            }).join('');
          })()}
        </div>
        <div class="section-sidebar">
          <div class="sidebar-label">搜索策略</div>
          <ul class="simple-list" style="font-size: 0.9rem;">
            <li>Tavily 在线搜索</li>
            <li>24 小时结果缓存</li>
            <li>"需求 vs 行业方案"对比格式</li>
            <li>搜索失败自动降级到 Claude 知识</li>
          </ul>
        </div>
      </div>
    </section>
    ` : ''}

    <!-- 6. 技术方案 -->
    ${state.technical && state.technical.trim() ? `
    <section class="section" id="technical">
      <div class="section-number">06 — 技术方案</div>
      <h2 class="section-title">怎么实现</h2>
      <div class="section-grid">
        <div class="section-main">
          ${state.technical.split(/。|；|\n/).filter(s => s.trim()).map(s => {
            const text = s.trim().replace(/。$/, '');
            if (!text) return '';
            const colonIdx = text.indexOf('：');
            if (colonIdx > 0 && colonIdx < 20) {
              return `<div class="kv-card"><div class="kv-label">${escapeHtml(text.slice(0, colonIdx))}</div><div class="kv-value">${escapeHtml(text.slice(colonIdx + 1))}</div></div>`;
            }
            return `<div class="kv-card"><div class="kv-value">${escapeHtml(text)}</div></div>`;
          }).join('')}
        </div>
        <div class="section-sidebar">
          <div class="sidebar-label">边界与约束</div>
          ${state.boundaries && state.boundaries.length > 0 ?
            state.boundaries.map(b => `<div class="kv-card"><div class="kv-value">${escapeHtml(b)}</div></div>`).join('')
            : '<p style="font-size: 0.9rem;color: var(--muted)">暂无边界约束</p>'}
        </div>
      </div>
    </section>
    ` : ''}

    <!-- 7. 验收标准 -->
    ${state.acceptance && state.acceptance.length > 0 ? `
    <section class="section" id="acceptance">
      <div class="section-number">07 — 验收标准</div>
      <h2 class="section-title">怎么算完成</h2>
      <div class="section-grid">
        <div class="section-main">
          ${state.acceptance.map((a, i) => `<div class="kv-card"><div class="kv-label">验收项 ${i + 1}</div><div class="kv-value">${escapeHtml(a)}</div></div>`).join('')}
        </div>
        <div class="section-sidebar">
          <div class="sidebar-label">已排除方案</div>
          ${state.rejected && state.rejected.length > 0 ?
            state.rejected.map(r => `<div class="kv-card"><div class="kv-label" style="color: var(--muted);text-decoration: line-through;">${escapeHtml(r.idea)}</div>${r.reason ? `<div class="kv-value" style="font-size: 0.9rem;color: var(--muted);">${escapeHtml(r.reason)}</div>` : ''}</div>`).join('')
            : '<p style="font-size: 0.9rem;color: var(--muted)">暂无排除方案</p>'}
        </div>
      </div>
    </section>
    ` : ''}

    <!-- 8. 可视化图表 -->
    ${mindmap || flowchart ? `
    <section class="section" id="visuals">
      <div class="section-number">08 — 可视化</div>
      <h2 class="section-title">一图胜千言</h2>
      ${mindmap ? `
      <div class="chart-container">
        <h3 style="margin-bottom: 2rem; font-size: 1.5rem; font-weight: 700;">思维导图</h3>
        <div class="mermaid">
${mindmap}
        </div>
      </div>
      ` : ''}
      ${flowchart ? `
      <div class="chart-container">
        <h3 style="margin-bottom: 2rem; font-size: 1.5rem; font-weight: 700;">流程图</h3>
        <div class="mermaid">
${flowchart}
        </div>
      </div>
      ` : ''}
    </section>
    ` : ''}

    <!-- 9. 讨论记录 -->
    ${state.conversations && state.conversations.length > 0 ? `
    <section class="section" id="conversations">
      <div class="section-number">09 — 讨论记录</div>
      <h2 class="section-title">我们聊了什么</h2>
      <div class="section-grid">
        <div class="section-main">
          ${state.conversations.slice(-10).reverse().map(c => {
            const role = c.role === 'user' ? '用户' : 'Claude';
            const time = new Date(c.timestamp).toLocaleString('zh-CN');
            return `
            <div class="chat-msg chat-${c.role}">
              <div class="chat-role">${role} · ${time}</div>
              <div class="chat-content">${escapeHtml(c.content).replace(/\n/g, '<br>')}</div>
            </div>
            `;
          }).join('')}
        </div>
        <div class="section-sidebar">
          <div class="sidebar-label">会话信息</div>
          <div class="kv-card" style="padding: 0;">
            <div class="kv-value" style="font-size: 0.9rem;">会话 ID: ${state.sessionId || '未知'}</div>
            <div class="kv-value" style="font-size: 0.9rem; margin-top: 0.5rem;">消息总数: ${state.conversations.length} 条</div>
            <div class="kv-value" style="font-size: 0.9rem; margin-top: 0.5rem;">最后更新: ${formatDate(new Date(state.last_updated))}</div>
          </div>
        </div>
      </div>
    </section>
    ` : ''}

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-brand">${escapeHtml(topic)}</div>
      <div class="footer-meta">Generated by Vibe Flow</div>
    </footer>
  </main>

  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#1a1a2e',
        primaryTextColor: '#fff',
        primaryBorderColor: '#6366f1',
        lineColor: '#94a3b8',
        secondaryColor: '#0f172a',
        tertiaryColor: '#1e293b',
        fontFamily: 'Inter, sans-serif'
      },
      flowchart: { curve: 'basis', padding: 20 },
      mindmap: { padding: 20 }
    });

    const sections = document.querySelectorAll('.section');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1 });
    sections.forEach(s => observer.observe(s));
  </script>
</body>
</html>`;
}

// 复制报告到桌面
function copyToDesktop(projectName, htmlContent) {
  const projectDir = ensureDesktopProjectDir(projectName);
  const htmlPath = path.join(projectDir, 'index.html');

  try {
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`🌐 HTML 报告已生成: ${htmlPath}`);
    return htmlPath;
  } catch (err) {
    console.error(`❌ 复制到桌面失败: ${err.message}`);
    return null;
  }
}

// 生成总览页
function generateIndexPage() {
  if (!fs.existsSync(DESKTOP_REPORTS_DIR)) return;

  const projects = fs.readdirSync(DESKTOP_REPORTS_DIR).filter(item => {
    const itemPath = path.join(DESKTOP_REPORTS_DIR, item);
    return fs.statSync(itemPath).isDirectory() && fs.existsSync(path.join(itemPath, 'index.html'));
  });

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vibe Flow - 项目总览</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #ffffff;
      min-height: 100vh;
      padding: 4rem 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 {
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #00ffff, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle { color: #888; margin-bottom: 3rem; }
    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .project-card {
      background: #1a1a1a;
      border: 1px solid #222;
      border-radius: 12px;
      padding: 2rem;
      transition: all 0.3s;
      text-decoration: none;
      color: #fff;
    }
    .project-card:hover {
      border-color: #00ffff;
      box-shadow: 0 0 30px rgba(0, 255, 255, 0.15);
      transform: translateY(-4px);
    }
    .project-card h3 {
      font-size: 1.3rem;
      margin-bottom: 0.5rem;
    }
    .project-card p { color: #888; font-size: 0.9rem; }
    .empty { text-align: center; color: #888; padding: 4rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>VIBE FLOW</h1>
    <p class="subtitle">项目报告总览 · ${projects.length} 个项目</p>
    ${projects.length > 0 ? `
    <div class="projects-grid">
      ${projects.map(p => {
        const projectPath = path.join(DESKTOP_REPORTS_DIR, p, 'index.html');
        const stat = fs.statSync(projectPath);
        const updateTime = stat.mtime.toLocaleString('zh-CN');
        return `
        <a href="./${encodeURIComponent(p)}/index.html" class="project-card">
          <h3>${escapeHtml(p)}</h3>
          <p>更新时间: ${updateTime}</p>
          <p>点击查看详细报告</p>
        </a>`;
      }).join('')}
    </div>` : `
    <div class="empty">
      <p>暂无项目报告</p>
      <p style="margin-top: 0.5rem; font-size: 0.85rem;">使用 /vibe 脑洞大开 开始创建你的第一个项目</p>
    </div>`}
  </div>
</body>
</html>`;

  const indexPath = path.join(DESKTOP_REPORTS_DIR, 'index.html');
  fs.writeFileSync(indexPath, html);
  console.log(`📋 总览页已更新: ${indexPath}`);
  return indexPath;
}

// 报告命令入口
async function generateReport() {
  const state = loadState();
  if (!state) {
    console.error('❌ 没有找到状态文件，请先进行脑暴讨论');
    return false;
  }

  ensureVibeDir();
  ensureDesktopReportsDir();

  // 生成 Markdown 报告
  const markdown = generateMarkdownReport(state);
  fs.writeFileSync(REPORT_FILE, markdown);
  console.log(`📊 Markdown 报告已生成: ${REPORT_FILE}`);

  // 生成可视化图表
  const visuals = saveVisuals();

  // 生成 HTML 报告并复制到桌面
  const html = generateHTMLReport(state);
  const htmlPath = copyToDesktop(state.topic, html);

  // 更新总览页
  generateIndexPage();

  return { markdown, html, htmlPath, visuals };
}

module.exports = {
  generateMarkdownReport,
  generateHTMLReport,
  copyToDesktop,
  generateIndexPage,
  generateReport
};
