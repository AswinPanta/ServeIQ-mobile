#!/usr/bin/env node
/**
 * Fix: wrap JSX attribute token references in braces.
 *   color=SLATE[400]    -> color={SLATE[400]}
 *   color{SLATE[400]}   -> color={SLATE[400]}   (repair)
 * Only touches JSX attr slots (attr name preceded by whitespace/`}`/`>`).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

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
        } else if (entry.name.endsWith('.tsx')) {
          out.push(full);
        }
      }
    };
    walk(abs);
  }
  return out;
}

const REF = '[A-Z][A-Za-z0-9_]+(?:\\[[0-9]+\\]|\\.[a-zA-Z]+)';
const BARE = new RegExp(`([\\w$.$-]+)(=)(${REF})`, 'g'); // color=SLATE[400]
const BROKEN = new RegExp(`([\\w$.$-]+)(\\{)(${REF})(\\})`, 'g'); // color{SLATE[400]}

function isAttrSlot(src, idx) {
  const prev = idx > 0 ? src[idx - 1] : '';
  return prev === '' || /\s/.test(prev) || prev === '}' || prev === '>';
}

let fixed = 0;
let repaired = 0;
let filesChanged = 0;
for (const file of collectFiles()) {
  const src = fs.readFileSync(file, 'utf8');
  const edits = [];
  BARE.lastIndex = 0;
  let m;
  while ((m = BARE.exec(src))) {
    if (!isAttrSlot(src, m.index)) continue;
    edits.push({ start: m.index, end: m.index + m[0].length, text: `${m[1]}={${m[3]}}` });
  }
  BROKEN.lastIndex = 0;
  while ((m = BROKEN.exec(src))) {
    if (!isAttrSlot(src, m.index)) continue;
    edits.push({ start: m.index, end: m.index + m[0].length, text: `${m[1]}={${m[3]}}` });
  }
  if (edits.length === 0) continue;
  edits.sort((a, b) => b.start - a.start);
  let next = src;
  for (const e of edits) {
    next = next.slice(0, e.start) + e.text + next.slice(e.end);
  }
  fs.writeFileSync(file, next);
  filesChanged++;
  const before = src.split('={').length - 1;
  const after = next.split('={').length - 1;
  fixed += edits.length;
  repaired += Math.max(0, after - before);
}
console.log(`JSX attrs fixed: ${fixed} across ${filesChanged} files`);
