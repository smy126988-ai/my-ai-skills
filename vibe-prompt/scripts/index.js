#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const CWD = process.cwd();
const VIBE_DIR = path.join(CWD, '.vibe');
const REQUIREMENTS_FILE = path.join(VIBE_DIR, 'requirements.md');
const OD_META_FILE = path.join(VIBE_DIR, 'od-meta.json');
const OD_ROOT = process.env.OPEN_DESIGN_ROOT || '/tmp/open-design';

function ensureVibeDir() {
  if (!fs.existsSync(VIBE_DIR)) {
    fs.mkdirSync(VIBE_DIR, { recursive: true });
  }
}

function formatDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function readRequirements() {
  if (!fs.existsSync(REQUIREMENTS_FILE)) return [];
  const content = fs.readFileSync(REQUIREMENTS_FILE, 'utf8');
  const requirements = [];
  let currentReq = null;
  for (const line of content.split('\n')) {
    const match = line.match(/^## (\d+)\. (.*)/);
    if (match) {
      if (currentReq) requirements.push(currentReq);
      currentReq = { id: parseInt(match[1]), title: match[2], content: '' };
    } else if (currentReq) {
      currentReq.content += line + '\n';
    }
  }
  if (currentReq) requirements.push(currentReq);
  return requirements;
}

function loadOdMeta() {
  if (!fs.existsSync(OD_META_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(OD_META_FILE, 'utf8'));
  } catch (e) {
    return null;
  }
}

function loadCraftRules(rules) {
  const sections = [];
  for (const rule of rules || []) {
    const rulePath = path.join(OD_ROOT, 'craft', `${rule}.md`);
    if (fs.existsSync(rulePath)) {
      const content = fs.readFileSync(rulePath, 'utf8');
      sections.push(`## ${rule}\n${content}`);
    }
  }
  return sections.join('\n\n');
}

function promptCmd(input = null) {
  const requirements = readRequirements();
  if (requirements.length === 0) {
    console.log(`ℹ️  暂无需求，请先通过脑暴讨论落地需求`);
    return;
  }
  if (!input) {
    console.log(`📋 现有需求列表:\n`);
    requirements.forEach(r => {
      console.log(`#${r.id} ${r.title}`);
    });
    console.log(`\n👉 用 "整个活吧 [ID]" 生成对应需求的开发 prompt`);
    return;
  }

  let reqTitle = '直接需求';
  let reqContent = input;

  // 判断是否是纯数字 ID
  if (/^\d+$/.test(input.trim())) {
    const req = requirements.find(r => r.id == parseInt(input));
    if (!req) {
      console.error(`❌ 未找到需求 #${input}`);
      return;
    }
    reqTitle = req.title;
    reqContent = req.content;
  }

  // 检查 OD 联动配置
  const odMeta = loadOdMeta();
  let craftSection = '';
  if (odMeta) {
    const craftContent = loadCraftRules(odMeta.craft_rules);
    if (craftContent) {
      craftSection = `\n### 设计规范 (Open Design)\n${craftContent}\n`;
    }
  }

  const promptContent = `## 开发需求: ${reqTitle}
### 需求详情
${reqContent}
### 开发要求
1. 先分析需求，明确核心目标和边界
2. 给出技术实现方案和架构设计
3. 列出具体的开发步骤和任务拆分
4. 提供可直接运行的代码实现
5. 给出测试方案和验收标准
6. 说明可能的风险和应对措施
${craftSection}
请按照以上要求输出完整的开发方案和代码实现。
`;
  console.log(`✅ 已生成需求 "${reqTitle}" 的开发 prompt:\n\n`);
  console.log(promptContent);
  console.log(`\n\n👉 可以直接复制以上内容开始开发`);
  return promptContent;
}

function showHelp() {
  console.log(`
vibe-prompt - 开发 prompt 生成工具

用法:
  node scripts/index.js [需求ID]

示例:
  node scripts/index.js 1    # 生成需求 #1 的开发 prompt
  node scripts/index.js      # 列出所有需求
`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 0 && (args[0] === '--help' || args[0] === '-h')) {
    showHelp();
    return;
  }
  await promptCmd(args[0]);
}

main().catch(err => {
  console.error(`❌ 执行失败: ${err.message}`);
  process.exit(1);
});
