#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const CWD = process.cwd();
const VIBE_DIR = path.join(CWD, '.vibe');
const REQUIREMENTS_FILE = path.join(VIBE_DIR, 'requirements.md');
const TODO_FILE = path.join(VIBE_DIR, 'todo.md');
const OD_META_FILE = path.join(VIBE_DIR, 'od-meta.json');
const OD_ROOT = process.env.OPEN_DESIGN_ROOT || '/tmp/open-design';

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
    console.log(`⚠️  od-meta.json 解析失败: ${e.message}\n`);
    return null;
  }
}

function loadOdChecklist(skill) {
  const checklistPath = path.join(OD_ROOT, 'skills', skill, 'references', 'checklist.md');
  if (!fs.existsSync(checklistPath)) return null;
  return fs.readFileSync(checklistPath, 'utf8');
}

function parseChecklist(content) {
  const p0 = [];
  const p1 = [];
  const p2 = [];
  let current = null;
  for (const line of content.split('\n')) {
    if (line.includes('P0') || line.includes('must pass')) {
      current = p0;
    } else if (line.includes('P1') || line.includes('should pass')) {
      current = p1;
    } else if (line.includes('P2') || line.includes('nice to have')) {
      current = p2;
    } else if (current && line.trim().startsWith('- [')) {
      current.push(line.trim());
    }
  }
  return { p0, p1, p2 };
}

function checkCmd() {
  console.log(`🔍 正在检查项目文档...\n`);
  let hasIssue = false;

  // 基础检查
  if (!fs.existsSync(REQUIREMENTS_FILE)) {
    console.log(`❌ 缺少需求文件: ${REQUIREMENTS_FILE}`);
    console.log(`   💡 提示: 通过 vibe-brainstorm 脑暴讨论后落地需求\n`);
    hasIssue = true;
  } else {
    const requirements = readRequirements();
    console.log(`✅ 需求文件存在，共 ${requirements.length} 个需求\n`);
  }

  if (!fs.existsSync(TODO_FILE)) {
    console.log(`❌ 缺少任务文件: ${TODO_FILE}`);
    console.log(`   💡 提示: 使用 vibe-task "先记一笔" 命令记录开发任务\n`);
    hasIssue = true;
  } else {
    const todoContent = fs.readFileSync(TODO_FILE, 'utf8');
    const todoCount = todoContent.split('\n').filter(l => l.trim().startsWith('-')).length;
    console.log(`✅ 任务文件存在，共 ${todoCount} 个待办任务\n`);
  }

  // OD 联动检查
  const odMeta = loadOdMeta();
  if (odMeta) {
    console.log(`🎨 检测到 Open Design 配置:`);
    console.log(`   Skill: ${odMeta.skill}`);
    console.log(`   Design System: ${odMeta.design_system}`);
    console.log(`   Craft Rules: ${(odMeta.craft_rules || []).join(', ')}\n`);

    const checklist = loadOdChecklist(odMeta.skill);
    if (checklist) {
      const parsed = parseChecklist(checklist);
      console.log(`📋 OD Checklist (${odMeta.skill}):`);
      console.log(`   P0 (must pass): ${parsed.p0.length} 项`);
      console.log(`   P1 (should pass): ${parsed.p1.length} 项`);
      console.log(`   P2 (nice to have): ${parsed.p2.length} 项\n`);
    }

    const designMd = path.join(CWD, odMeta.design_md_path || './DESIGN.md');
    if (fs.existsSync(designMd)) {
      console.log(`✅ DESIGN.md 存在: ${designMd}\n`);
    } else {
      console.log(`❌ DESIGN.md 缺失: ${designMd}`);
      console.log(`   💡 运行: vibe-brainstorm save-design ${odMeta.skill} ${odMeta.design_system}\n`);
      hasIssue = true;
    }
  }

  if (hasIssue) {
    console.log(`📝 以上是需要补全的文档项`);
  } else {
    console.log(`🎉 所有必要文档都已齐全，可以开始开发`);
  }
}

checkCmd();
