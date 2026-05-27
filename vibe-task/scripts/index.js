#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const CWD = process.cwd();
const VIBE_DIR = path.join(CWD, '.vibe');
const TODO_FILE = path.join(VIBE_DIR, 'todo.md');

function ensureVibeDir() {
  if (!fs.existsSync(VIBE_DIR)) {
    fs.mkdirSync(VIBE_DIR, { recursive: true });
  }
}

function formatDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function taskCmd(topic) {
  if (!topic) {
    console.error(`❌ 请输入任务内容`);
    process.exit(1);
  }
  ensureVibeDir();
  const taskLine = `- [ ] ${topic} (创建时间: ${formatDate()})\n`;
  if (fs.existsSync(TODO_FILE)) {
    fs.appendFileSync(TODO_FILE, taskLine);
  } else {
    fs.writeFileSync(TODO_FILE, `# 📝 任务清单\n> 记录需要完成的开发任务\n\n` + taskLine);
  }
  console.log(`✅ 任务已记录: ${topic}`);
  console.log(`📝 任务文件路径: ${TODO_FILE}`);
}

const args = process.argv.slice(2);
const topic = args.join(' ');
taskCmd(topic);
