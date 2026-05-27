#!/usr/bin/env node
const { ALIAS_MAP } = require('./config');
const {
  saveRequirement,
  saveDesign,
  resumeCmd,
  clearCmd,
  reportCmd,
  searchCommand
} = require('./commands');
const { updateState } = require('./state');

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    showHelp();
    process.exit(0);
  }
  let subcommand = args[0];
  const restArgs = args.slice(1);
  if (ALIAS_MAP[subcommand]) {
    subcommand = ALIAS_MAP[subcommand];
  }
  return { subcommand, args: restArgs };
}

function showHelp() {
  console.log(`
vibe-brainstorm - 需求脑暴

📝 对话式脑暴
  /vibe 脑洞大开 [主题]   开始新的需求脑暴讨论

⚡ 脚本功能
  /vibe 落地需求 [标题] [内容]           将讨论结果写入 requirements.md
  /vibe 保存设计 [skill] [design-system]  生成 DESIGN.md + od-meta.json
  /vibe 恢复会话                          恢复上次脑暴会话
  /vibe 清空会话                          清空当前脑暴会话
  /vibe 生成报告                          生成脑暴报告
  /vibe 搜搜看 [关键词]                   搜索行业最佳实践

💡 别名说明
  脑洞大开 = 脑暴 = brainstorm = 捋捋需求
  落地需求 = 记录需求
  搜搜看 = 查查方案 = 行业参考
`);
}

// 从 stdin 读取所有数据（防止 shell 参数注入：之前必须 SKILL.md 里手工提醒"用单引号包裹"，把责任甩给 LLM；现在改成只通过 stdin 传内容）
function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
    // 如果 stdin 关闭得很快（无数据），直接 resolve 空串
    setTimeout(() => resolve(data), 50);
  });
}

async function main() {
  const { subcommand, args } = parseArgs();
  try {
    switch (subcommand) {
      case 'save-requirement': {
        // 三种调用方式，优先级 高 → 低：
        //   1. --stdin       从 stdin 读 JSON: {"topic":"...","content":"..."}
        //   2. 命令行参数    args[0]=topic, args[1..]=content（旧接口，保留兼容）
        let topic, content;
        if (args.includes('--stdin')) {
          const raw = await readStdin();
          try {
            const obj = JSON.parse(raw);
            topic = obj.topic || '未命名需求';
            content = obj.content || '';
          } catch (e) {
            console.error(`❌ --stdin 模式需要合法 JSON 输入: ${e.message}`);
            process.exit(1);
          }
        } else {
          topic = args[0] || '未命名需求';
          content = args.slice(1).join(' ');
        }
        await saveRequirement(topic, content);
        break;
      }
      case 'save-design':
        const skill = args[0];
        const designSystem = args[1] || 'neutral-modern';
        const craftRulesStr = args[2] || 'anti-ai-slop,typography';
        const reqId = args[3] ? parseInt(args[3]) : null;
        saveDesign(skill, designSystem, craftRulesStr.split(','), reqId);
        break;
      case 'resume':
        resumeCmd();
        break;
      case 'clear':
        clearCmd();
        break;
      case 'report':
        await reportCmd();
        break;
      case 'search':
        const query = args.join(' ');
        await searchCommand(query);
        break;
      case 'update-state':
        const deltaStr = args.join(' ');
        try {
          updateState(JSON.parse(deltaStr));
          console.log('✅ 状态已更新');
        } catch (e) {
          console.error(`❌ JSON 格式错误: ${e.message}`);
          process.exit(1);
        }
        break;
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;
      default:
        console.error(`❌ 未知命令: ${subcommand}`);
        console.log(`ℹ️  输入 help 查看帮助`);
        process.exit(1);
    }
  } catch (err) {
    console.error(`❌ 执行失败: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
