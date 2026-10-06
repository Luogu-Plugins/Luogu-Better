import { readFileSync, writeFileSync, existsSync, watch, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripComments } from './strip-comments.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const OUTFILE = join(ROOT, 'LuoguBetter.user.js');
const LEGACY_DIST = join(ROOT, 'dist');

const ORDER = [
    'core/namespace.js',
    'core/utils.js',
    'core/storage.js',
    'core/config.js',
    'core/spa.js',
    'core/ui.js',
    'core/panel.js',
    'modules/appearance.js',
    'modules/adblock.js',
    'modules/background.js',
    'modules/background-panel.js',
    'modules/benben.js',
    'modules/imagehosting.js',
    'modules/contest.js',
    'modules/updater.js',
    'main.js',
];

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

function reindent(code) {
    return code
        .split('\n')
        .map((line) => {
            if (!line.trim()) return '';
            return `    ${line.replace(/\t/g, '    ')}`;
        })
        .join('\n');
}

function build({ quiet = false } = {}) {
    const version = pkg.version;

    const header = readFileSync(join(SRC, 'meta.txt'), 'utf8')
        .replaceAll('\r\n', '\n')
        .replaceAll('\r', '\n')
        .replaceAll('%VERSION%', version)
        .trimEnd();

    const parts = [];
    const missing = [];
    let strippedComments = 0;

    for (const rel of ORDER) {
        const file = join(SRC, rel);
        if (!existsSync(file)) {
            missing.push(rel);
            continue;
        }
        const raw = readFileSync(file, 'utf8')
            .replaceAll('\r\n', '\n')
            .replaceAll('\r', '\n')
            .replaceAll('__LB_VERSION__', version);
        const code = stripComments(raw, { onComment: () => strippedComments++ }).trim();
        parts.push(reindent(code));
    }

    if (missing.length) {
        console.warn(`[build] 警告：缺失模块 ${missing.join(', ')}`);
    }

    const body = [
        header,
        '',
        '(function() {',
        "    'use strict';",
        '',
        parts.join('\n\n'),
        '})();',
        '',
    ].join('\n');

    const compact = body
        .split('\n')
        .map((line) => line.replace(/[ \t]+$/, ''))
        .join('\n')
        .replace(/(\n[ \t]*\n)(?:[ \t]*\n)+/g, '$1');

    writeFileSync(OUTFILE, compact, 'utf8');
    if (existsSync(LEGACY_DIST)) rmSync(LEGACY_DIST, { recursive: true, force: true });

    const kb = (Buffer.byteLength(compact, 'utf8') / 1024).toFixed(1);
    if (!quiet) {
        const p = (n) => String(n).padStart(2, '0');
        const d = new Date();
        const at = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
        console.log(`[build] ${at}  v${version}  ${parts.length} 个模块  ${kb} KB`);
        console.log(`[build] -> ${OUTFILE}`);
    }
    return { body: compact, version, kb, strippedComments };
}

function syntaxCheck(body) {
    try {
        new Function(body.replace(/^\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/, ''));
        console.log('[check] 语法检查通过');
        return true;
    } catch (err) {
        console.error('[check] 语法错误：', err.message);
        return false;
    }
}

function assertNoComments(body) {
    const code = body.replace(/^\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/, '');
    const leftovers = [];
    stripComments(code, { onComment: (text, kind) => leftovers.push(`${kind}: ${text.trim().slice(0, 70)}`) });
    if (leftovers.length) {
        console.error(`[check] 产物里还有 ${leftovers.length} 段注释：`);
        leftovers.slice(0, 10).forEach((l) => console.error(`        ${l}`));
        return false;
    }

    const withoutHeader = body.replace(/^\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/, '');
    const slashStars = (withoutHeader.match(/\/\*\*/g) || []).length;
    const wideGroups = (withoutHeader.match(/\/\*/g) || []).length - slashStars;
    if (wideGroups > 1) {
        console.error(
            `[check] 产物里有 ${wideGroups} 处 "/*"；` +
                '说明请写在模板外面'
        );
        return false;
    }

    console.log(`[check] 产物无注释残留（保留 ${slashStars} 段 @param 文档）`);
    return true;
}

function assertBlankLines(body) {
    const bad = body.match(/\n[ \t]*\n[ \t]*\n/g) || [];
    if (bad.length) {
        console.error(`[check] 产物里有 ${bad.length} 处连续空行超过 1 行`);
        return false;
    }
    console.log('[check] 产物空行正常（连续空行 ≤ 1）');
    return true;
}

function assertIndent(body) {
    const lines = body.split('\n');
    const start = lines.findIndex((l) => l === '(function() {');
    const end = lines.findIndex((l) => l === '})();');
    if (start === -1 || end === -1 || end <= start) {
        console.error('[check] 找不到 IIFE 的起止行，缩进断言无法执行');
        return false;
    }
    const bad = [];
    for (let i = start + 1; i < end; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        if (!/^ {4}/.test(line)) bad.push(`L${i + 1}: ${line.slice(0, 60)}`);
    }
    if (bad.length) {
        console.error(`[check] 产物里有 ${bad.length} 行没有缩进到 IIFE 里面：`);
        bad.slice(0, 8).forEach((l) => console.error(`        ${l}`));
        return false;
    }
    console.log('[check] 产物缩进统一（IIFE 内每行 ≥ 4 空格）');
    return true;
}

const args = process.argv.slice(2);
const result = build();

if (args.includes('--check')) {
    const okSyntax = syntaxCheck(result.body);
    const okComments = assertNoComments(result.body);
    const okBlanks = assertBlankLines(result.body);
    const okIndent = assertIndent(result.body);
    if (!okSyntax || !okComments || !okBlanks || !okIndent) process.exitCode = 1;
}

if (args.includes('--watch')) {
    console.log('[watch] 监听 src/ ...');
    let timer = null;
    watch(SRC, { recursive: true }, (_event, file) => {
        if (file && !/\.(js|txt)$/.test(file)) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
            try {
                build();
            } catch (err) {
                console.error('[watch] 构建失败：', err.message);
            }
        }, 80);
    });
}
