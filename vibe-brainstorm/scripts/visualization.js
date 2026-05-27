const fs = require('fs');
const { VISUALS_FILE } = require('./config');
const { ensureVibeDir, escapeMermaid } = require('./utils');
const { loadState } = require('./state');

// 生成思维导图（用户场景 + 功能）
function generateMindmap(state) {
  const { scenarios = [], features = [] } = state;
  if (scenarios.length === 0 && features.length === 0) return '';

  let mindmap = 'mindmap\n  root((Brainstorm))\n';

  // 场景分支
  if (scenarios.length > 0) {
    mindmap += '    👤 用户场景\n';
    scenarios.forEach(s => {
      const scenarioText = escapeMermaid(`${s.who || '用户'}在${s.when || '场景'}${s.what}`);
      mindmap += `      ${scenarioText}\n`;
    });
  }

  // 功能分支（按优先级分组）
  if (features.length > 0) {
    const p0Features = features.filter(f => f.priority === 'P0' || f.priority === 0);
    const p1Features = features.filter(f => f.priority === 'P1' || f.priority === 1);
    const p2Features = features.filter(f => f.priority === 'P2' || f.priority === 2);
    const otherFeatures = features.filter(f => !p0Features.includes(f) && !p1Features.includes(f) && !p2Features.includes(f));

    if (p0Features.length > 0) {
      mindmap += '    ⭐ P0 核心功能\n';
      p0Features.forEach(f => {
        const featureText = escapeMermaid(f.name);
        mindmap += `      ${featureText}\n`;
      });
    }

    if (p1Features.length > 0) {
      mindmap += '    ✨ P1 重要功能\n';
      p1Features.forEach(f => {
        const featureText = escapeMermaid(f.name);
        mindmap += `      ${featureText}\n`;
      });
    }

    if (p2Features.length > 0) {
      mindmap += '    📌 P2 可选功能\n';
      p2Features.forEach(f => {
        const featureText = escapeMermaid(f.name);
        mindmap += `      ${featureText}\n`;
      });
    }

    if (otherFeatures.length > 0) {
      mindmap += '    📝 其他功能\n';
      otherFeatures.forEach(f => {
        const featureText = escapeMermaid(f.name);
        mindmap += `      ${featureText}\n`;
      });
    }
  }

  return mindmap;
}

// 生成流程图（场景→需求→功能→落地）
function generateFlowchart(state) {
  const { scenarios = [], features = [], decisions = [] } = state;
  if (scenarios.length === 0 && features.length === 0) return '';

  let flowchart = 'flowchart TD\n  %% 样式\n  classDef scenario fill:#1e293b,stroke:#3b82f6,color:#fff,rx:8\n  classDef feature fill:#1a1a2e,stroke:#6366f1,color:#fff,rx:8\n  classDef decision fill:#0f172a,stroke:#8b5cf6,color:#fff,rx:8\n\n';

  // 场景节点
  scenarios.forEach((s, i) => {
    const id = `S${i}`;
    const text = escapeMermaid(`${s.who || '用户'}\n${s.when}\n${s.what}`);
    flowchart += `  ${id}["${text}"]:::scenario\n`;
  });

  // 决策节点
  decisions.forEach((d, i) => {
    const id = `D${i}`;
    const text = escapeMermaid(d);
    flowchart += `  ${id}{"${text}"}:::decision\n`;
  });

  // 功能节点
  features.forEach((f, i) => {
    const id = `F${i}`;
    const priority = f.priority || 'P0';
    const text = escapeMermaid(`[${priority}] ${f.name}`);
    flowchart += `  ${id}["${text}"]:::feature\n`;
  });

  // 简单连接（场景→功能，决策→功能）
  if (scenarios.length > 0 && features.length > 0) {
    flowchart += `  ${scenarios.map((_, i) => `S${i}`).join(' & ')} --> ${features.map((_, i) => `F${i}`).join(' & ')}\n`;
  }
  if (decisions.length > 0 && features.length > 0) {
    flowchart += `  ${decisions.map((_, i) => `D${i}`).join(' & ')} --> ${features.map((_, i) => `F${i}`).join(' & ')}\n`;
  }

  return flowchart;
}

// 保存可视化图表到文件
function saveVisuals() {
  const state = loadState();
  if (!state) {
    console.error('❌ 没有找到状态文件');
    return false;
  }

  ensureVibeDir();

  const mindmap = generateMindmap(state);
  const flowchart = generateFlowchart(state);

  let content = '# 可视化图表\n\n';

  if (mindmap) {
    content += '## 思维导图\n```mermaid\n' + mindmap + '\n```\n\n';
  }

  if (flowchart) {
    content += '## 流程图\n```mermaid\n' + flowchart + '\n```\n\n';
  }

  try {
    fs.writeFileSync(VISUALS_FILE, content);
    console.log(`📊 图表已保存: ${VISUALS_FILE}`);
    return { mindmap, flowchart };
  } catch (err) {
    console.error(`❌ 保存图表失败: ${err.message}`);
    return false;
  }
}

module.exports = {
  generateMindmap,
  generateFlowchart,
  saveVisuals
};
