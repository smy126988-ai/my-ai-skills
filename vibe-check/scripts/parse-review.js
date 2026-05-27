#!/usr/bin/env node
/**
 * 解析 Gemini review.md，提取问题并自动入池到 backlog_skill_issues.md
 *
 * 用法：
 *   node parse-review.js <review.md> <skill-name>
 *
 * 示例：
 *   node parse-review.js \
 *     ~/.claude/dispatch-gemini/sessions/2026-05-06_005511_c12d5d6e/review.md \
 *     dispatch-gemini
 */

const fs = require('fs');
const path = require('path');

const BACKLOG_PATH = path.join(
  process.env.HOME,
  '.claude/projects/-Users-simengyu/memory/backlog_skill_issues.md'
);

function parseReview(filePath, skillName) {
  const content = fs.readFileSync(filePath, 'utf8');
  const today = new Date().toISOString().split('T')[0];

  // 匹配问题模式: #### N. [Level] 标题
  // 然后捕获后续的 - **描述**：... 块
  const issueRegex = /#{3,4}\s*\d+\.\s*\[(Critical|High|Medium|Low)\]\s*(.+?)\n([\s\S]*?)(?=(?:#{3,4}\s*\d+\.\s*\[)|\n## |\n### |$)/gi;

  const issues = [];
  let match;

  while ((match = issueRegex.exec(content)) !== null) {
    const level = match[1];
    const title = match[2].trim();
    const body = match[3].trim();

    // 从标题括号中推断技能名，如 "xxx (git-auto)"
    const skillFromTitle = title.match(/\(([^)]+)\)$/)?.[1];
    const actualSkill = skillFromTitle || skillName;

    // 提取描述
    const descMatch = body.match(/-\s*\*\*描述\*\*：\s*(.+?)(?=\n\s*-\s*\*\*|$)/i);
    const description = descMatch ? descMatch[1].trim() : title;

    // 提取复现条件
    const reproMatch = body.match(/-\s*\*\*复现条件\*\*：\s*(.+?)(?=\n\s*-\s*\*\*|$)/i);
    const repro = reproMatch ? reproMatch[1].trim() : '';

    // 提取修复方案
    const fixMatch = body.match(/-\s*\*\*建议修复方案\*\*：\s*(.+?)(?=\n\s*-\s*\*\*|$)/i);
    const fix = fixMatch ? fixMatch[1].trim() : '';

    issues.push({
      level,
      title,
      description,
      repro,
      fix,
      skill: actualSkill,
      date: today,
      source: path.basename(filePath),
    });
  }

  return issues;
}

function readBacklog() {
  if (!fs.existsSync(BACKLOG_PATH)) {
    return { content: '', issues: [] };
  }
  return { content: fs.readFileSync(BACKLOG_PATH, 'utf8'), issues: [] };
}

function generateId(skill) {
  const prefix = skill.toUpperCase().substring(0, 2);
  const backlog = readBacklog().content;

  // 找现有最大编号
  const idRegex = new RegExp(`\\| ${prefix}-(\\d{3}) \\|`, 'g');
  let maxId = 0;
  let m;
  while ((m = idRegex.exec(backlog)) !== null) {
    maxId = Math.max(maxId, parseInt(m[1], 10));
  }
  return `${prefix}-${String(maxId + 1).padStart(3, '0')}`;
}

function isDuplicate(backlogContent, issue) {
  // 简单去重：检查标题关键词是否在 backlog 活跃问题区已存在
  const archiveStart = backlogContent.indexOf('## 已修复归档');
  const activeSection = archiveStart > 0 ? backlogContent.substring(0, archiveStart) : backlogContent;

  const keywords = issue.title
    .replace(/\[.*?\]/g, '')
    .replace(/[^\w一-龥]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4)
    .slice(0, 3);

  if (keywords.length === 0) return false;

  return keywords.every(kw => activeSection.includes(kw));
}

function isInArchive(backlogContent, issue) {
  // 检查问题是否已在"已修复归档"中（宽松匹配：核心关键词出现在归档区）
  const archiveStart = backlogContent.indexOf('## 已修复归档');
  if (archiveStart < 0) return false;

  const archiveSection = backlogContent.substring(archiveStart);
  const keywords = issue.title
    .replace(/\[.*?\]/g, '')
    .replace(/[^\w一-龥]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4)
    .slice(0, 3);

  if (keywords.length === 0) return false;
  // 至少 2/3 关键词匹配（放宽容错）
  const matched = keywords.filter(kw => archiveSection.includes(kw)).length;
  return matched >= Math.max(2, Math.floor(keywords.length * 0.6));
}

function formatIssueRow(issue, id) {
  const desc = issue.description.length > 60
    ? issue.description.substring(0, 60) + '...'
    : issue.description;
  return `| ${id} | ${issue.skill} | ${desc} | ${issue.date} | ${issue.source} | ${issue.title} | ${issue.fix ? issue.fix.substring(0, 40) + '...' : 'TBD'} | open |`;
}

function appendToBacklog(issues) {
  let backlog = readBacklog().content;
  if (!backlog) {
    console.error('错误: backlog 文件不存在');
    process.exit(1);
  }

  // 预计算下一个 ID
  const idCounters = {};
  const idRegex = /\|\s*(\w{2})-(\d{3})\s*\|/g;
  let m;
  while ((m = idRegex.exec(backlog)) !== null) {
    const prefix = m[1];
    const num = parseInt(m[2], 10);
    idCounters[prefix] = Math.max(idCounters[prefix] || 0, num);
  }

  let added = 0;
  let skipped = 0;
  const rowsToAdd = [];

  for (const issue of issues) {
    if (issue.title.includes('已修复') || isInArchive(backlog, issue)) {
      console.log(`  [SKIP] 已修复/归档: ${issue.title.substring(0, 50)}`);
      skipped++;
      continue;
    }

    if (isDuplicate(backlog, issue)) {
      console.log(`  [SKIP] 疑似重复: ${issue.title.substring(0, 50)}`);
      skipped++;
      continue;
    }

    const prefix = issue.skill.toUpperCase().substring(0, 2);
    idCounters[prefix] = (idCounters[prefix] || 0) + 1;
    const id = `${prefix}-${String(idCounters[prefix]).padStart(3, '0')}`;
    const row = formatIssueRow(issue, id);
    rowsToAdd.push({ level: issue.level, row, id, title: issue.title });
  }

  // 在 "## 已修复归档" 之前统一插入所有新行
  if (rowsToAdd.length > 0) {
    const archivePos = backlog.indexOf('## 已修复归档');
    const insertPos = archivePos > 0 ? archivePos : backlog.length;
    const newContent = rowsToAdd.map(r => r.row).join('\n') + '\n';
    backlog = backlog.substring(0, insertPos) + newContent + backlog.substring(insertPos);

    for (const r of rowsToAdd) {
      console.log(`  [ADD] ${r.id}: ${r.title.substring(0, 50)}`);
      added++;
    }
  }

  fs.writeFileSync(BACKLOG_PATH, backlog);
  return { added, skipped };
}

function main() {
  const reviewFile = process.argv[2];
  const skillName = process.argv[3];

  if (!reviewFile || !skillName) {
    console.log('用法: node parse-review.js <review.md> <skill-name>');
    process.exit(1);
  }

  if (!fs.existsSync(reviewFile)) {
    console.error(`错误: 文件不存在: ${reviewFile}`);
    process.exit(1);
  }

  console.log(`解析: ${reviewFile}`);
  console.log(`技能: ${skillName}`);
  console.log('');

  const issues = parseReview(reviewFile, skillName);

  if (issues.length === 0) {
    console.log('未检测到问题条目');
    process.exit(0);
  }

  console.log(`检测到 ${issues.length} 个问题:`);
  for (const issue of issues) {
    console.log(`  [${issue.level}] ${issue.title.substring(0, 60)}`);
  }
  console.log('');

  const { added, skipped } = appendToBacklog(issues);

  console.log('');
  console.log(`✅ 已入池: ${added} 个`);
  console.log(`⏭️  跳过(重复): ${skipped} 个`);
}

main();
