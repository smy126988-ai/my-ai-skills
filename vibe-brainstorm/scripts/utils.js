const fs = require('fs');
const path = require('path');
const { VIBE_DIR, ARCHIVE_DIR, DESKTOP_REPORTS_DIR } = require('./config');

// 确保 .vibe 目录存在
function ensureVibeDir() {
  if (!fs.existsSync(VIBE_DIR)) {
    fs.mkdirSync(VIBE_DIR, { recursive: true });
  }
}

// 确保归档目录存在
function ensureArchiveDir() {
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }
}

// 确保桌面报告目录存在
function ensureDesktopReportsDir() {
  if (!fs.existsSync(DESKTOP_REPORTS_DIR)) {
    fs.mkdirSync(DESKTOP_REPORTS_DIR, { recursive: true });
  }
}

// 确保项目报告目录存在
function ensureDesktopProjectDir(projectName) {
  const safeName = String(projectName || '未命名项目').replace(/[<>:"/\\|?*]/g, '_');
  const projectDir = path.join(DESKTOP_REPORTS_DIR, safeName);
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }
  return projectDir;
}

// HTML 转义
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 转义 Mermaid 特殊字符
function escapeMermaid(str) {
  return String(str || '')
    .replace(/[&<>"]/g, ' ')
    .replace(/\n/g, '<br/>')
    .replace(/\|/g, '&#124;');
}

// 格式化日期
function formatDate(date = new Date()) {
  return date.toLocaleString('zh-CN');
}

// 安全读取 JSON 文件
function readJsonFile(filePath, defaultValue = null) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`⚠️  读取文件 ${filePath} 失败: ${err.message}`);
    return defaultValue;
  }
}

// 安全写入 JSON 文件
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`❌ 写入文件 ${filePath} 失败: ${err.message}`);
    return false;
  }
}

module.exports = {
  ensureVibeDir,
  ensureArchiveDir,
  ensureDesktopReportsDir,
  ensureDesktopProjectDir,
  escapeHtml,
  escapeMermaid,
  formatDate,
  readJsonFile,
  writeJsonFile
};
