const path = require('path');
const os = require('os');
const fs = require('fs');

const ALIAS_MAP = {
  "落地需求": "save-requirement",
  "记录需求": "save-requirement",
  "搜搜看": "search",
  "查查方案": "search",
  "行业参考": "search",
  "有没有现成的": "search",
  "更新状态": "update-state",
  "update-state": "update-state"
};

const CWD = process.cwd();
const VIBE_DIR = path.join(CWD, '.vibe');
const REQUIREMENTS_FILE = path.join(VIBE_DIR, 'requirements.md');
const STATE_FILE = path.join(VIBE_DIR, 'brainstorm_state.json');
const REPORT_FILE = path.join(VIBE_DIR, 'brainstorm_report.md');
const VISUALS_FILE = path.join(VIBE_DIR, 'brainstorm_visuals.md');
const ARCHIVE_DIR = path.join(VIBE_DIR, 'archives');
const SEARCH_CACHE_FILE = path.join(VIBE_DIR, 'search_cache.json');
const homeDir = os.homedir();
const defaultDesktop = path.join(homeDir, 'Desktop');
const desktopBase = fs.existsSync(defaultDesktop) ? defaultDesktop : homeDir;
const DESKTOP_REPORTS_DIR = path.join(desktopBase, 'vibe-reports');
const MAX_STATE_RECORDS = 50;
const SEARCH_CACHE_TTL = 24 * 60 * 60 * 1000;
const OD_META_FILE = path.join(VIBE_DIR, 'od-meta.json');
const OD_ROOT = process.env.OPEN_DESIGN_ROOT || '/tmp/open-design';

module.exports = {
  ALIAS_MAP,
  CWD,
  VIBE_DIR,
  REQUIREMENTS_FILE,
  STATE_FILE,
  REPORT_FILE,
  VISUALS_FILE,
  ARCHIVE_DIR,
  SEARCH_CACHE_FILE,
  DESKTOP_REPORTS_DIR,
  MAX_STATE_RECORDS,
  SEARCH_CACHE_TTL,
  OD_META_FILE,
  OD_ROOT
};
