const fs = require('fs');
const path = require('path');
const { REQUIREMENTS_FILE, OD_META_FILE, OD_ROOT } = require('./config');
const { ensureVibeDir } = require('./utils');
const { resumeState, clearState } = require('./state');
const { generateReport } = require('./report');
const { searchCmd } = require('./search');

const OD_SKILLS_DIR = path.join(OD_ROOT, 'skills');
const OD_DESIGN_SYSTEMS_DIR = path.join(OD_ROOT, 'design-systems');

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

async function saveRequirement(topic, content = '') {
  if (!topic) {
    console.log(`❌ 缺少需求标题`);
    return;
  }
  if (!content || !content.trim()) {
    console.log(`❌ 缺少需求正文`);
    return;
  }
  ensureVibeDir();
  const requirements = readRequirements();
  const newId = requirements.length > 0 ? Math.max(...requirements.map(r => r.id)) + 1 : 1;
  const block = `## ${newId}. ${topic}\n> 生成时间: ${new Date().toLocaleString('zh-CN')}\n\n${content.trim()}\n`;
  if (fs.existsSync(REQUIREMENTS_FILE)) {
    fs.appendFileSync(REQUIREMENTS_FILE, '\n' + block);
  } else {
    fs.writeFileSync(REQUIREMENTS_FILE, `# 🎯 项目需求列表\n> 由脑暴讨论沉淀而来\n` + block);
  }
  console.log(`✅ 需求已落地: #${newId} ${topic}`);
  console.log(`📝 需求文件路径: ${REQUIREMENTS_FILE}`);
}

function resumeCmd() {
  const state = resumeState();
  return state;
}

function clearCmd() {
  return clearState();
}

async function reportCmd() {
  return await generateReport();
}

async function searchCommand(query) {
  return await searchCmd(query);
}

function saveDesign(skill, designSystem = 'neutral-modern', craftRules = ['anti-ai-slop', 'typography'], requirementId = null) {
  if (!skill) {
    console.log(`❌ 缺少 skill 参数`);
    return;
  }

  const skillDir = path.join(OD_SKILLS_DIR, skill);
  const designSystemDir = path.join(OD_DESIGN_SYSTEMS_DIR, designSystem);
  const designMdSrc = path.join(designSystemDir, 'DESIGN.md');
  const designMdDest = path.join(process.cwd(), 'DESIGN.md');

  if (!fs.existsSync(skillDir)) {
    console.log(`❌ OD skill 不存在: ${skill}`);
    console.log(`   可用 skills: ${listOdSkills().join(', ')}`);
    return;
  }

  if (!fs.existsSync(designSystemDir)) {
    console.log(`❌ OD design system 不存在: ${designSystem}`);
    console.log(`   可用 design systems: ${listOdDesignSystems().join(', ')}`);
    return;
  }

  ensureVibeDir();

  // Copy DESIGN.md
  if (fs.existsSync(designMdSrc)) {
    fs.copyFileSync(designMdSrc, designMdDest);
    console.log(`✅ DESIGN.md 已复制: ${designMdDest}`);
  } else {
    console.log(`⚠️ DESIGN.md 未找到于 ${designSystemDir}，跳过复制`);
  }

  // Write od-meta.json
  const meta = {
    skill,
    design_system: designSystem,
    craft_rules: craftRules,
    design_md_path: './DESIGN.md',
    ...(requirementId ? { requirement_id: requirementId } : {})
  };
  fs.writeFileSync(OD_META_FILE, JSON.stringify(meta, null, 2));
  console.log(`✅ 设计元数据已保存: ${OD_META_FILE}`);
  console.log(`\n📋 配置摘要:`);
  console.log(`   Skill: ${skill}`);
  console.log(`   Design System: ${designSystem}`);
  console.log(`   Craft Rules: ${craftRules.join(', ')}`);
}

function listOdSkills() {
  if (!fs.existsSync(OD_SKILLS_DIR)) return [];
  return fs.readdirSync(OD_SKILLS_DIR).filter(d => {
    return fs.statSync(path.join(OD_SKILLS_DIR, d)).isDirectory();
  });
}

function listOdDesignSystems() {
  if (!fs.existsSync(OD_DESIGN_SYSTEMS_DIR)) return [];
  return fs.readdirSync(OD_DESIGN_SYSTEMS_DIR).filter(d => {
    return fs.statSync(path.join(OD_DESIGN_SYSTEMS_DIR, d)).isDirectory();
  });
}

module.exports = {
  readRequirements,
  saveRequirement,
  saveDesign,
  resumeCmd,
  clearCmd,
  reportCmd,
  searchCommand
};
