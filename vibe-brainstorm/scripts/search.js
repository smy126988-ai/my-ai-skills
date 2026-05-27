const fs = require('fs');
const { SEARCH_CACHE_FILE, SEARCH_CACHE_TTL } = require('./config');
const { ensureVibeDir, readJsonFile, writeJsonFile } = require('./utils');
const { updateState } = require('./state');

// 加载搜索缓存
function loadSearchCache() {
  return readJsonFile(SEARCH_CACHE_FILE, {});
}

// 保存搜索缓存
function saveSearchCache(cache) {
  ensureVibeDir();
  return writeJsonFile(SEARCH_CACHE_FILE, cache);
}

// Tavily API 直调（零依赖，开箱即用）
async function callTavily(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error('未配置 TAVILY_API_KEY 环境变量');
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      include_answer: true,
      max_results: 5
    })
  });

  if (!response.ok) {
    throw new Error(`Tavily API ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

// 搜索行业参考（优先缓存，其次 Tavily，最后降级到 Claude 知识）
async function searchIndustry(query, forceRefresh = false) {
  const cache = loadSearchCache();
  const cacheKey = query.trim().toLowerCase();
  const now = Date.now();

  // 检查缓存是否有效
  if (!forceRefresh && cache[cacheKey] && (now - cache[cacheKey].timestamp) < SEARCH_CACHE_TTL) {
    console.log('ℹ️  命中搜索缓存');
    return cache[cacheKey].result;
  }

  console.log(`🔍 正在搜索: ${query}`);

  try {
    // 调用 Tavily 搜索（原生 fetch，零依赖）
    const response = await callTavily(query);
    const result = formatSearchResults(response, query);

    // 保存到缓存
    cache[cacheKey] = { result, timestamp: now };
    saveSearchCache(cache);

    // 保存到状态
    await updateState({ industry: result });

    console.log('✅ 搜索完成');
    return result;
  } catch (err) {
    console.warn(`⚠️  搜索失败，使用内置知识: ${err.message}`);
    const fallbackResult = getFallbackResult(query);

    // 保存到缓存（缓存 fallback 结果 1 小时）
    cache[cacheKey] = { result: fallbackResult, timestamp: now };
    saveSearchCache(cache);

    // 保存到状态
    await updateState({ industry: fallbackResult });

    return fallbackResult;
  }
}

// 格式化搜索结果
function formatSearchResults(response, query) {
  const { answer = '', results = [] } = response;

  let formatted = `## 行业参考: ${query}\n\n`;

  if (answer) {
    formatted += `### 摘要\n${answer}\n\n`;
  }

  if (results.length > 0) {
    formatted += '### 相关资源\n';
    results.forEach((r, i) => {
      formatted += `${i + 1}. [${r.title}](${r.url}) - ${r.content?.slice(0, 150)}...\n`;
    });
    formatted += '\n';
  }

  formatted += '### 方案对比\n';
  formatted += '- **优势**: 基于行业最佳实践，成熟方案风险低\n';
  formatted += '- **劣势**: 可能存在定制化不足，需要根据业务场景调整\n';
  formatted += '- **适配度**: 建议结合当前需求场景进行二次设计\n';

  return formatted;
}

// 搜索失败时的 fallback 结果
function getFallbackResult(query) {
  return `## 行业参考: ${query}\n\n
### 通用方案建议
由于网络问题未能获取实时行业数据，以下是通用建议：

1. **技术选型原则**
   - 优先选择团队熟悉的技术栈，降低学习成本
   - 优先选择生态完善、社区活跃的开源项目
   - 优先选择有商业支持的方案，降低长期维护风险

2. **架构设计原则**
   - 保持最小可行设计，避免过度工程
   - 分层架构，各层职责单一，便于扩展和维护
   - 关键路径预留性能余量，应对业务增长

3. **风险控制**
   - 核心依赖做降级预案，避免单点故障
   - 敏感数据做加密处理，符合合规要求
   - 关键流程做灰度发布，降低上线风险

建议后续网络恢复后重新执行搜索获取最新行业数据。
`;
}

// 搜索命令入口
async function searchCmd(query) {
  if (!query) {
    console.error('❌ 请输入搜索关键词');
    return;
  }
  const result = await searchIndustry(query);
  console.log(result);
  return result;
}

module.exports = {
  loadSearchCache,
  saveSearchCache,
  searchIndustry,
  formatSearchResults,
  getFallbackResult,
  searchCmd
};
