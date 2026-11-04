#!/usr/bin/env node
/**
 * Lightweight manifest + syntax check for the Fanggao Pet bundle.
 * Usage: node scripts/validate.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;

const ok = (msg) => console.log(`✓ ${msg}`);
const fail = (msg) => {
  failures += 1;
  console.error(`✗ ${msg}`);
};

let pkg;
try {
  pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  ok('package.json 可解析');
} catch (error) {
  fail(`package.json 解析失败: ${error.message}`);
  process.exit(1);
}

const patch = pkg.dsh?.bundle?.patch;
if (!patch) fail('缺少 dsh.bundle.patch');
else if (!existsSync(resolve(root, patch))) fail(`patch 文件不存在: ${patch}`);
else ok(`dsh.bundle.patch 指向 ${patch}`);

if (pkg.dsh?.client?.platform !== 'web') fail('dsh.client.platform 应为 web');
else ok('dsh.client.platform = web');

for (const locale of ['en', 'zh']) {
  const file = resolve(root, `locale/${locale}.json`);
  if (!existsSync(file)) {
    fail(`缺少 locale/${locale}.json`);
    continue;
  }
  try {
    const dict = JSON.parse(readFileSync(file, 'utf8'));
    if (!dict.meta?.title || !dict.meta?.description) fail(`locale/${locale}.json 缺少 meta.title / meta.description`);
    else ok(`locale/${locale}.json 元数据完整`);
  } catch (error) {
    fail(`locale/${locale}.json 解析失败: ${error.message}`);
  }
}

for (const file of ['index.js', 'client.js']) {
  const target = resolve(root, file);
  if (!existsSync(target)) {
    fail(`缺少 ${file}`);
    continue;
  }
  try {
    execFileSync(process.execPath, ['--check', target], { stdio: 'pipe' });
    ok(`${file} 语法通过`);
  } catch (error) {
    fail(`${file} 语法错误: ${error.stderr?.toString() ?? error.message}`);
  }
}

if (!pkg.exports?.['.'] || !pkg.exports?.['./client']) fail('exports 缺少 "." 或 "./client"');
else ok('exports 完整');

if (pkg.license !== 'MIT') fail('license 应为 MIT');
else ok('license = MIT');

if (failures > 0) {
  console.error(`\n${failures} 项校验未通过`);
  process.exit(1);
}
console.log('\n全部校验通过');
