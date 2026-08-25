#!/usr/bin/env node
/**
 * Merge duplicate @/lib/constants/figma-tokens import lines into one.
 * For a base name imported multiple times, keep the binding the code uses
 * (prefer plain `X` if referenced, else `X as XTokens`).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const IMPORT_RE = /^import\s*\{([^}]*)\}\s*from\s*['"]@\/lib\/constants\/figma-tokens['"]/gm;
const TOKEN_IMPORT = '@/lib/constants/figma-tokens';

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

let merged = 0;
for (const file of collectFiles()) {
  const src = fs.readFileSync(file, 'utf8');
  const matches = [...src.matchAll(IMPORT_RE)];
  if (matches.length < 2) continue;

  const bindings = []; // {base, ref}
  for (const m of matches) {
    for (const part of m[1].split(',')) {
      const p = part.trim();
      if (!p) continue;
      const as = p.match(/^(\w+)\s+as\s+(\w+)$/);
      bindings.push(as ? { base: as[1], ref: as[2] } : { base: p, ref: p });
    }
  }

  const code = src.replace(IMPORT_RE, '');
  const chosen = [];
  const seen = new Set();
  for (const b of bindings) {
    if (seen.has(b.base)) continue;
    seen.add(b.base);
    const duplicates = bindings.filter((x) => x.base === b.base);
    const used = duplicates.find((x) => new RegExp(`\\b${x.ref}\\b`).test(code));
    chosen.push(used || b);
  }

  const importLine = `import { ${chosen.map((c) => (c.ref === c.base ? c.base : `${c.base} as ${c.ref}`)).join(', ')} } from '${TOKEN_IMPORT}';`;
  let next = src.replace(IMPORT_RE, () => '');
  const lines = next.split('\n').filter((l, i, arr) => !(i === arr.length - 1 && l.trim() === ''));
  let injectAt = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(import|export\s+\*|export\s+\{|'use strict')/.test(lines[i])) injectAt = i + 1;
  }
  lines.splice(injectAt, 0, importLine);
  fs.writeFileSync(file, lines.join('\n'));
  merged++;
}
console.log(`Merged duplicate token imports in ${merged} files`);
