/**
 * 前端测试运行脚本
 * 用于执行特定的前端测试或所有前端测试
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 测试文件路径
const TEST_PATHS = {
  researchProgress: 'src/pages/ResearchProgress/ResearchProgress.test.tsx',
  paperReproduction: 'src/pages/PaperReproduction/PaperReproduction.test.tsx',
  all: '' // 空字符串表示运行所有测试
};

// 解析命令行参数
const args = process.argv.slice(2);
const testType = args[0] || 'all';
const coverage = args.includes('--coverage');

// 验证测试类型
if (!Object.keys(TEST_PATHS).includes(testType)) {
  console.error(`错误: 未知的测试类型 "${testType}"`)
  console.log('可用的测试类型:')
  Object.keys(TEST_PATHS).forEach(type => {
    console.log(`  - ${type}${type === 'all' ? ' (默认)' : ''}`)
  });
  process.exit(1);
}

// 构建测试命令
let command = 'npm test';
if (testType !== 'all') {
  command += ` -- ${TEST_PATHS[testType]}`;
}
if (coverage) {
  command += ' --coverage';
}

console.log(`\n===== 运行前端测试: ${testType} =====`);
console.log(`执行命令: ${command}\n`);

try {
  // 执行测试命令
  execSync(command, { stdio: 'inherit' });
  console.log('\n===== 测试完成 =====');
} catch (error) {
  console.error('\n测试执行失败:', error.message);
  process.exit(1);
}