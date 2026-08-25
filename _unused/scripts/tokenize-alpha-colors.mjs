#!/usr/bin/env node
/**
 * Pass 2: tokenize remaining hex colors.
 *  - 8-digit RGBA hex (#RRGGBBAA)  -> TOKEN + 'AA'
 *  - 3-digit grayscale (#111..)    -> GRAY[900]..GRAY[100]
 * Base colors map to existing tokens; unknown bases stay untouched.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

const BASE8 = {
  '10B981': 'EMERALD[500]',
  'EF4444': 'RED[500]',
  '6B7280': 'GRAY[500]',
  'F59E0B': 'AMBER[500]',
  '3B82F6': 'BLUE[500]',
  '8B5CF6': 'PURPLE[500]',
  '2563EB': 'BLUE[600]',
  'FFD700': 'FLAT.gold',
  'F39C12': 'ORANGE[400]',
  'D35400': 'UI.warning',
  'C0392B': 'UI.error',
  '27AE60': 'GREEN.bright',
  '1E8449': 'FLAT.green',
  '2980B9': 'FLAT.blue',
  '7C3AED': 'PURPLE[700]',
};

const GRAY3 = {
  '111': 'GRAY[900]',
  '666': 'GRAY[600]',
  '999': 'GRAY[400]',
  'aaa': 'GRAY[400]',
  'ccc': 'GRAY[300]',
  'ddd': 'GRAY[200]',
  'eee': 'GRAY[100]',
};

function collectFiles() {
  const out = [];
  for (const dir of ['app', 'components', 'lib']) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    const walk = (d) => {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name === 'mock') continue;
          walk(full);
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          out.push(full);
        }
      }
    };
    walk(abs);
  }
  return out;
}

const TOKEN_IMPORT = '@/lib/constants/figma-tokens';
const importRe = /^import\s*\{([^}]*)\}\s*from\s*['"]@\/lib\/constants\/figma-tokens['"]/;

function rootOf(ref) {
  return ref.replace(/\[[0-9]+\]$/, '').split('.')[0];
}

function upsertImport(src, needed) {
  const names = [...needed].map((n) => ({ name: n, alias: n }));
  const m = src.match(importRe);
  if (m) {
    const existing = m[1].split(',').map((s) => s.trim()).filter(Boolean);
    const existingNames = new Set(existing.map((s) => s.split(/\s+as\s+/)[0].trim()));
    const add = [];
    for (const item of names) {
      if (!existingNames.has(item.name)) add.push(item.name);
    }
    if (add.length === 0) return src;
    const list = [...existing, ...add].join(', ');
    return src.replace(importRe, `import { ${list} } from '${TOKEN_IMPORT}'`);
  }
  // No existing import: alias any name already bound as a top-level import.
  const bound = new Set();
  for (const line of src.split('\n')) {
    const im = line.match(/^import\s+(?:type\s+)?(?:([A-Za-z_$][\w$]*)\s*,?\s*)?\{?([^}]*)?\}?\s*from/);
    if (im) {
      if (im[1]) bound.add(im[1]);
      if (im[2]) im[2].split(',').forEach((s) => {
        const p = s.trim().split(/\s+as\s+/)[0].trim();
        if (p) bound.add(p);
      });
    }
  }
  const resolved = names.map((n) => (bound.has(n.name) ? `${n.name} as ${n.name}Tokens` : n.name));
  const importLine = `import { ${resolved.join(', ')} } from '${TOKEN_IMPORT}';`;
  const lines = src.split('\n');
  let injectAt = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(import|export\s+\*|export\s+\{|'use strict')/.test(lines[i])) injectAt = i + 1;
  }
  lines.splice(injectAt, 0, importLine);
  return lines.join('\n');
}

let count = 0;
let filesChanged = 0;
for (const file of collectFiles()) {
  const src = fs.readFileSync(file, 'utf8');
  const edits = [];
  const alphaRe = /['"]#([0-9A-Fa-f]{8})['"]/g;
  let m;
  while ((m = alphaRe.exec(src))) {
    const hex = m[1];
    const base = hex.slice(0, 6).toUpperCase();
    const alpha = hex.slice(6);
    if (!BASE8[base]) continue;
    edits.push({ start: m.index, end: m.index + m[0].length, text: `${BASE8[base]} + '${alpha}'` });
  }
  const grayRe = /['"]#([0-9A-Fa-f]{3})['"]/g;
  while ((m = grayRe.exec(src))) {
    const hex = m[1].toLowerCase();
    if (!GRAY3[hex]) continue;
    edits.push({ start: m.index, end: m.index + m[0].length, text: GRAY3[hex] });
  }
  if (edits.length === 0) continue;
  edits.sort((a, b) => b.start - a.start);
  let next = src;
  const needed = new Set();
  for (const e of edits) {
    next = next.slice(0, e.start) + e.text + next.slice(e.end);
    needed.add(rootOf(e.text.split("'")[0].trim().replace(/\s*\+.*/, '')));
  }
  next = upsertImport(next, needed);
  fs.writeFileSync(file, next);
  filesChanged++;
  count += edits.length;
}
console.log(`Alpha/gray hexes tokenized: ${count} across ${filesChanged} files`);
