#!/usr/bin/env node
'use strict';

/**
 * bin/xf-skills.cjs
 * -----------------------------------------------------------
 * Teaching Skills Framework - Interactive CLI & Micro-Runtime
 * 
 * 零外部依赖的终端交互式教学技能工具箱。
 * 支持技能发现、知识检索、技能详情查阅以及终端苏格拉底追问模拟体验。
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT_DIR = path.resolve(__dirname, '..');
const CATALOG_PATH = path.join(ROOT_DIR, 'catalog.json');

function loadCatalog() {
  if (fs.existsSync(CATALOG_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    } catch (e) {
      // ignore
    }
  }
  return null;
}

function loadPackageJson() {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
  } catch (e) {
    return { version: '0.5.0' };
  }
}

function printHelp() {
  const pkg = loadPackageJson();
  console.log(`
🎓 Teaching Skills Framework CLI (v${pkg.version})
开源·模块化·具有学科认知深度的 AI 教学技能框架

用法:
  xf-skills <command> [options]

命令列表:
  list, ls                 列出框架内全量教学技能资产 (按学科归类)
  search <query>           根据关键词/标签/触发词搜索技能
  info <skill-id>          查阅指定技能的完整规约、依赖与认知红线
  chat <skill-id> [--mock] 启动终端交互式苏格拉底追问模拟体验
  validate                 运行框架静态规范校验器
  version, -v              查看当前框架版本号
  help, -h                 查看此帮助信息

示例:
  xf-skills list
  xf-skills search 闭环控制
  xf-skills info te.toulmin-assistant
  xf-skills chat it.primm-debugger --mock
`);
}

function handleList() {
  const catalog = loadCatalog();
  if (!catalog || !catalog.skills) {
    console.error('❌ 尚未生成 catalog.json，请先运行: npm run build:catalog');
    process.exit(1);
  }

  console.log(`\n📦 Teaching Skills 技能清单 (共收录 ${catalog.skills.length} 项技能):\n`);

  const groups = {
    common: { name: '📚 通用教学设计基础 (Common Core)', list: [] },
    'information-technology': { name: '💻 信息科技学科 (Information Technology)', list: [] },
    'technology-engineering': { name: '🛠️ 技术与工程学科 (Technology & Engineering)', list: [] },
    physics: { name: '🔬 物理学科 (Physics)', list: [] },
    other: { name: '📖 其他学科 (Other)', list: [] }
  };

  for (const s of catalog.skills) {
    const subj = (s.subject && s.subject[0]) || 'other';
    const grp = groups[subj] || groups.other;
    grp.list.push(s);
  }

  for (const [, grp] of Object.entries(groups)) {
    if (grp.list.length === 0) continue;
    console.log(`=== ${grp.name} (${grp.list.length}) ===`);
    for (const s of grp.list) {
      console.log(`  • \x1b[36m${s.id.padEnd(28)}\x1b[0m ${s.display_name.padEnd(20)} \x1b[90mv${s.version}\x1b[0m`);
      if (s.description) {
        const firstLine = s.description.split('\n')[0].slice(0, 60);
        console.log(`    \x1b[33m└─\x1b[0m \x1b[90m${firstLine}...\x1b[0m`);
      }
    }
    console.log('');
  }
}

function handleSearch(query) {
  if (!query) {
    console.error('❌ 请提供搜索关键词，如: xf-skills search 递归');
    process.exit(1);
  }

  const catalog = loadCatalog();
  if (!catalog) {
    console.error('❌ 尚未生成 catalog.json');
    process.exit(1);
  }

  const q = query.toLowerCase();
  const matched = catalog.skills.filter(s => {
    return (
      s.id.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.display_name && s.display_name.toLowerCase().includes(q)) ||
      (s.description && s.description.toLowerCase().includes(q)) ||
      (s.tags && s.tags.some(t => t.toLowerCase().includes(q)))
    );
  });

  console.log(`\n🔍 关键词 "${query}" 匹配结果 (${matched.length} 项):\n`);
  for (const s of matched) {
    console.log(`  • \x1b[36m${s.id}\x1b[0m (${s.display_name})`);
    if (s.tags && s.tags.length > 0) {
      console.log(`    标签: ${s.tags.join(', ')}`);
    }
    if (s.description) {
      const summary = s.description.split('\n')[0];
      console.log(`    简介: ${summary}`);
    }
    console.log('');
  }
}

function handleInfo(skillId) {
  if (!skillId) {
    console.error('❌ 请指定技能 ID，如: xf-skills info te.toulmin-assistant');
    process.exit(1);
  }

  const catalog = loadCatalog();
  if (!catalog) {
    console.error('❌ 尚未生成 catalog.json');
    process.exit(1);
  }

  const skill = catalog.skills.find(s => s.id === skillId || s.name === skillId);
  if (!skill) {
    console.error(`❌ 未找到技能: ${skillId}`);
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(`📖 技能规格: \x1b[36m${skill.id}\x1b[0m (${skill.display_name})`);
  console.log(`======================================================`);
  console.log(`• 版本状态: v${skill.version} (${skill.status})`);
  console.log(`• 适用学科: ${(skill.subject || []).join(', ')}`);
  console.log(`• 适用学段: ${(skill.education_level || []).join(', ')}`);
  console.log(`• 依赖项  : ${(skill.depends_on || []).join(', ') || '无 (基础能力)'}`);
  console.log(`• 输出产物: ${(skill.outputs || []).join(', ')}`);
  console.log(`• 标签    : ${(skill.tags || []).join(', ')}`);
  console.log(`• 规范文件: ${skill.file}`);
  console.log(`\n【技能描述与意图触发词】:\n${skill.description || '暂无描述'}\n`);
}

function handleChat(skillId, isMock) {
  if (!skillId) {
    console.error('❌ 请指定体验技能 ID，如: xf-skills chat te.toulmin-assistant');
    process.exit(1);
  }

  console.log(`\n🤖 正在启动 [${skillId}] 终端苏格拉底互动模拟器...`);
  console.log(`⚠️  认知摩擦红线生效中：严禁提供成品答案，单次回答不超过 150 字。\n`);

  if (isMock) {
    console.log(`[模拟对话演示模式]`);
    if (skillId.includes('primm') || skillId.includes('programming')) {
      console.log(`👤 学生: "助教，我写的列表倒序遍历报错 IndexError，快帮我改代码！"`);
      console.log(`🤖 助教 (84字): "年轻的程序员，直接帮你改代码可学不会编程！代码报错是最好的调试机会。请用一句话告诉我：你的代码原本【预期】输出什么？实际控制台弹出了什么提示？"\n`);
      console.log(`👤 学生: "预期打印 40 30 20 10，实际报错：IndexError: list index out of range，在 print(nums[i])！"`);
      console.log(`🤖 助教 (120字): "IndexError 是极具价值的证据！教材中明确指明：长度为 N 的列表最大合法索引是 N-1。当循环刚启动时，range(len(nums), 0, -1) 产生的第一个 i 是多少？它超出了边界吗？"\n`);
    } else {
      console.log(`👤 学生: "助教，我搭的纸梁刚挂了 3 个钩码就从中间断成两截了，快给我一张最稳的图纸！"`);
      console.log(`🤖 助教 (88字): "年轻的工程师，想要现成图纸可不行，真正的图纸是自己迭代出来的！结构在测试中破坏是最好的学习机会。请用一句话告诉我：你的第一步改进【主张（Claim）】是什么？你打算调整截面形状还是跨度？"\n`);
    }
    console.log(`✅ 模拟交互演示结束。`);
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`💬 请输入您的工程困境或代码问题（输入 'exit' 退出）:\n`);
  rl.setPrompt('👤 您: ');
  rl.prompt();

  let turn = 1;
  rl.on('line', (line) => {
    const input = line.trim();
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      rl.close();
      return;
    }

    if (!input) {
      rl.prompt();
      return;
    }

    if (turn === 1) {
      if (skillId.includes('primm') || skillId.includes('programming')) {
        console.log(`\n🤖 助教: 年轻的程序员，直接要现成代码可学不会编程！代码异常是最好的学习机会。请用一句话告诉我：你的第一步【预期输出】是什么？实际控制台弹出了什么报错信息？\n`);
      } else {
        console.log(`\n🤖 助教: 年轻的工程师，想要现成图纸可不行，真正的方案是自己迭代出来的！请用一句话告诉我：你的第一步改进【主张（Claim）】是什么？打算调整材料形状还是连接方式？\n`);
      }
      turn = 2;
    } else if (turn === 2) {
      if (input.includes('猜') || input.includes('感觉') || input.includes('不知道')) {
        console.log(`\n🛑【证据门禁拦截】: 在工程与编程中我们‘凭证据说话’，严禁靠感觉。请出具具体的控制台报错（Traceback）或传感器实测数据，再来找我！\n`);
      } else {
        console.log(`\n🤖 助教: 很好的实测证据！现在请结合我们学过的原理，【推理解释】一下：为什么这个因果调整能够针对性解决当前失效现象？\n`);
        turn = 3;
      }
    } else {
      console.log(`\n🤖 助教: 推理非常符合逻辑！现在引入现实硬约束挑战：如果材料自重或时间复杂度超出限额 20%，你的方案会在什么极端工况下失效？打算如何折中权衡？\n`);
      turn = 1;
    }

    rl.prompt();
  }).on('close', () => {
    console.log('\n👋 体验结束，感谢使用 Teaching Skills Framework！');
    process.exit(0);
  });
}

function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === 'help' || cmd === '-h' || cmd === '--help') {
    printHelp();
    return;
  }

  if (cmd === 'version' || cmd === '-v' || cmd === '--version') {
    const pkg = loadPackageJson();
    console.log(`teaching-skills v${pkg.version}`);
    return;
  }

  if (cmd === 'list' || cmd === 'ls') {
    handleList();
    return;
  }

  if (cmd === 'search' || cmd === 'find') {
    handleSearch(args[1]);
    return;
  }

  if (cmd === 'info') {
    handleInfo(args[1]);
    return;
  }

  if (cmd === 'chat') {
    const isMock = args.includes('--mock');
    const skillId = args.find(a => a !== 'chat' && a !== '--mock');
    handleChat(skillId, isMock);
    return;
  }

  if (cmd === 'validate') {
    require('../scripts/validate/validator.js');
    return;
  }

  console.error(`❌ 未知命令: ${cmd}。输入 'xf-skills help' 查看用法。`);
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = {
  loadCatalog,
  loadPackageJson,
  handleSearch,
  handleInfo
};
