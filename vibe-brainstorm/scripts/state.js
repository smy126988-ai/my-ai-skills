const fs = require('fs');
const path = require('path');
const { STATE_FILE, ARCHIVE_DIR, MAX_STATE_RECORDS } = require('./config');
const { ensureVibeDir, ensureArchiveDir, readJsonFile, writeJsonFile } = require('./utils');

// 加载当前 brainstorm 状态
function loadState() {
  return readJsonFile(STATE_FILE, null);
}

// 保存 brainstorm 状态（自动归档旧版本）
function saveState(state) {
  ensureVibeDir();
  ensureArchiveDir();

  // 如果已有状态文件，先归档
  if (fs.existsSync(STATE_FILE)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const archivePath = path.join(ARCHIVE_DIR, `brainstorm_state_${timestamp}.json`);
    try {
      fs.copyFileSync(STATE_FILE, archivePath);
    } catch (err) {
      console.error(`⚠️  状态归档失败: ${err.message}`);
    }
  }

  // 限制记录数量
  if (state.scenarios && state.scenarios.length > MAX_STATE_RECORDS) {
    state.scenarios = state.scenarios.slice(-MAX_STATE_RECORDS);
  }
  if (state.features && state.features.length > MAX_STATE_RECORDS) {
    state.features = state.features.slice(-MAX_STATE_RECORDS);
  }
  if (state.rejected && state.rejected.length > MAX_STATE_RECORDS) {
    state.rejected = state.rejected.slice(-MAX_STATE_RECORDS);
  }
  if (state.conversations && state.conversations.length > MAX_STATE_RECORDS) {
    state.conversations = state.conversations.slice(-MAX_STATE_RECORDS);
  }
  if (state.decisions && state.decisions.length > MAX_STATE_RECORDS) {
    state.decisions = state.decisions.slice(-MAX_STATE_RECORDS);
  }

  state.last_updated = new Date().toISOString();

  return writeJsonFile(STATE_FILE, state);
}

// 更新状态（增量更新）
function updateState(delta) {
  const state = loadState() || createEmptyState();

  // 合并顶层字段
  if (delta.topic !== undefined) state.topic = delta.topic;
  if (delta.status !== undefined) state.status = delta.status;
  if (delta.complexity !== undefined) state.complexity = delta.complexity;
  if (delta.current_focus !== undefined) state.current_focus = delta.current_focus;
  if (delta.analysis !== undefined) state.analysis = delta.analysis;
  if (delta.technical !== undefined) state.technical = delta.technical;
  if (delta.industry !== undefined) state.industry = delta.industry;

  // 追加 scenarios
  if (delta.scenarios && Array.isArray(delta.scenarios)) {
    state.scenarios = state.scenarios || [];
    delta.scenarios.forEach(s => {
      if (!state.scenarios.find(existing =>
        existing.who === s.who && existing.when === s.when && existing.what === s.what
      )) {
        state.scenarios.push(s);
      }
    });
  }

  // 追加/更新 features
  if (delta.features && Array.isArray(delta.features)) {
    state.features = state.features || [];
    delta.features.forEach(f => {
      const existing = state.features.find(e => e.name === f.name);
      if (existing) {
        existing.priority = f.priority || existing.priority;
        existing.status = f.status || existing.status;
        existing.description = f.description || existing.description;
      } else {
        state.features.push(f);
      }
    });
  }

  // 追加 boundaries
  if (delta.boundaries && Array.isArray(delta.boundaries)) {
    state.boundaries = state.boundaries || [];
    delta.boundaries.forEach(b => {
      if (!state.boundaries.includes(b)) {
        state.boundaries.push(b);
      }
    });
  }

  // 追加 rejected
  if (delta.rejected && Array.isArray(delta.rejected)) {
    state.rejected = state.rejected || [];
    delta.rejected.forEach(r => {
      if (!state.rejected.find(existing => existing.idea === r.idea)) {
        state.rejected.push(r);
      }
    });
  }

  // 追加 conversations
  if (delta.conversations && Array.isArray(delta.conversations)) {
    state.conversations = state.conversations || [];
    delta.conversations.forEach(c => {
      state.conversations.push({
        role: c.role || 'user',
        content: c.content || '',
        timestamp: c.timestamp || new Date().toISOString()
      });
    });
  }

  // 追加 decisions
  if (delta.decisions && Array.isArray(delta.decisions)) {
    state.decisions = state.decisions || [];
    delta.decisions.forEach(d => {
      if (!state.decisions.includes(d)) {
        state.decisions.push(d);
      }
    });
  }

  // 追加 acceptance
  if (delta.acceptance && Array.isArray(delta.acceptance)) {
    state.acceptance = state.acceptance || [];
    delta.acceptance.forEach(a => {
      if (!state.acceptance.includes(a)) {
        state.acceptance.push(a);
      }
    });
  }

  return saveState(state);
}

// 创建空状态
function createEmptyState(topic = '未命名项目') {
  return {
    topic,
    status: 'in_progress',
    complexity: 'simple',
    sessionId: `session_${Date.now()}`,
    current_focus: '明确需求场景',
    last_updated: new Date().toISOString(),
    scenarios: [],
    features: [],
    boundaries: [],
    rejected: [],
    conversations: [],
    decisions: [],
    analysis: '',
    technical: '',
    acceptance: [],
    industry: ''
  };
}

// 恢复上次会话
function resumeState() {
  const state = loadState();
  if (!state) {
    console.log('ℹ️  没有找到之前的会话，已创建新会话');
    const newState = createEmptyState();
    saveState(newState);
    return newState;
  }
  console.log(`✅ 已恢复会话: ${state.topic}`);
  return state;
}

// 清空当前状态
function clearState() {
  if (!fs.existsSync(STATE_FILE)) {
    console.log('ℹ️  没有找到状态文件');
    return true;
  }
  // 先归档再删除
  ensureArchiveDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const archivePath = path.join(ARCHIVE_DIR, `brainstorm_state_${timestamp}_cleared.json`);
  try {
    fs.copyFileSync(STATE_FILE, archivePath);
    fs.unlinkSync(STATE_FILE);
    console.log('✅ 状态已清空，旧版本已归档');
    return true;
  } catch (err) {
    console.error(`❌ 清空状态失败: ${err.message}`);
    return false;
  }
}

module.exports = {
  loadState,
  saveState,
  updateState,
  createEmptyState,
  resumeState,
  clearState
};
